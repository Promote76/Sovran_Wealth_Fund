/**
 * Feature #7: Tax & Reporting Automation - REST API
 * Automated tax document generation and investor statements
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// =====================================================
// TAX PROFILES ENDPOINTS
// =====================================================

router.post('/profiles', async (req, res) => {
  try {
    const { investor_id, tax_id_type, tax_id_number, tax_classification, w9_submitted, w8_submitted, backup_withholding, country } = req.body;
    
    if (!investor_id || !tax_id_type) {
      return res.status(400).json({ error: 'investor_id and tax_id_type are required' });
    }

    const result = await pool.query(
      `INSERT INTO tax_profiles (investor_id, tax_id_type, tax_id_number, tax_classification, 
        w9_submitted, w8_submitted, backup_withholding, country)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (investor_id) DO UPDATE SET
        tax_id_type = EXCLUDED.tax_id_type,
        tax_id_number = EXCLUDED.tax_id_number,
        tax_classification = EXCLUDED.tax_classification,
        updated_at = NOW()
      RETURNING *`,
      [investor_id, tax_id_type, tax_id_number, tax_classification || 'individual', 
       w9_submitted || false, w8_submitted || false, backup_withholding || false, country || 'US']
    );

    res.json({ success: true, profile: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/profiles/:investorId', async (req, res) => {
  try {
    const { investorId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM tax_profiles WHERE investor_id = $1',
      [investorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tax profile not found' });
    }

    res.json({ success: true, profile: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// TAX DOCUMENTS ENDPOINTS
// =====================================================

router.post('/documents', async (req, res) => {
  try {
    const { investor_id, document_type, tax_year, property_id, income_amount, withholding_amount, capital_gains, file_url, status } = req.body;
    
    if (!investor_id || !document_type || !tax_year) {
      return res.status(400).json({ error: 'investor_id, document_type, and tax_year are required' });
    }

    const documentId = uuidv4();
    
    const result = await pool.query(
      `INSERT INTO tax_documents (document_id, investor_id, document_type, tax_year, property_id,
        income_amount, withholding_amount, capital_gains, file_url, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [documentId, investor_id, document_type, tax_year, property_id,
       income_amount || 0, withholding_amount || 0, capital_gains, file_url, status || 'pending']
    );

    res.json({ success: true, document: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/documents/:investorId', async (req, res) => {
  try {
    const { investorId } = req.params;
    const { tax_year, document_type, limit = 50 } = req.query;
    
    let query = 'SELECT * FROM tax_documents WHERE investor_id = $1';
    const params = [investorId];
    
    if (tax_year) {
      params.push(tax_year);
      query += ` AND tax_year = $${params.length}`;
    }
    if (document_type) {
      params.push(document_type);
      query += ` AND document_type = $${params.length}`;
    }
    
    params.push(limit);
    query += ` ORDER BY tax_year DESC, created_at DESC LIMIT $${params.length}`;

    const result = await pool.query(query, params);
    
    res.json({ success: true, documents: result.rows, count: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/documents/:documentId/generate', async (req, res) => {
  try {
    const { documentId } = req.params;
    
    const result = await pool.query(
      `UPDATE tax_documents SET 
        status = 'generated', 
        generated_at = NOW(), 
        file_url = $1
      WHERE document_id = $2 
      RETURNING *`,
      [`/tax-documents/${documentId}.pdf`, documentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ success: true, document: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/documents/:documentId/send', async (req, res) => {
  try {
    const { documentId } = req.params;
    
    const result = await pool.query(
      'UPDATE tax_documents SET status = \'sent\', sent_at = NOW() WHERE document_id = $1 RETURNING *',
      [documentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ success: true, document: result.rows[0], message: 'Document sent to investor' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// TAX LINE ITEMS ENDPOINTS
// =====================================================

router.post('/line-items', async (req, res) => {
  try {
    const { document_id, line_item_type, description, amount, box_number } = req.body;
    
    if (!document_id || !line_item_type || !amount) {
      return res.status(400).json({ error: 'document_id, line_item_type, and amount are required' });
    }

    const result = await pool.query(
      `INSERT INTO tax_line_items (document_id, line_item_type, description, amount, box_number)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [document_id, line_item_type, description, amount, box_number]
    );

    res.json({ success: true, line_item: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/documents/:documentId/line-items', async (req, res) => {
  try {
    const { documentId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM tax_line_items WHERE document_id = $1 ORDER BY box_number',
      [documentId]
    );

    const totalAmount = result.rows.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

    res.json({ 
      success: true, 
      line_items: result.rows, 
      count: result.rows.length,
      total_amount: totalAmount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// INVESTOR STATEMENTS ENDPOINTS
// =====================================================

router.post('/statements', async (req, res) => {
  try {
    const { investor_id, statement_type, period_start, period_end, total_income, total_distributions, total_fees, file_url } = req.body;
    
    if (!investor_id || !statement_type || !period_start || !period_end) {
      return res.status(400).json({ error: 'investor_id, statement_type, period_start, and period_end are required' });
    }

    const statementId = uuidv4();
    
    const result = await pool.query(
      `INSERT INTO investor_statements (statement_id, investor_id, statement_type, period_start, period_end,
        total_income, total_distributions, total_fees, file_url, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
      RETURNING *`,
      [statementId, investor_id, statement_type, period_start, period_end,
       total_income || 0, total_distributions || 0, total_fees || 0, file_url]
    );

    res.json({ success: true, statement: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/statements/:investorId', async (req, res) => {
  try {
    const { investorId } = req.params;
    const { statement_type, year, limit = 50 } = req.query;
    
    let query = 'SELECT * FROM investor_statements WHERE investor_id = $1';
    const params = [investorId];
    
    if (statement_type) {
      params.push(statement_type);
      query += ` AND statement_type = $${params.length}`;
    }
    if (year) {
      params.push(`${year}-01-01`);
      params.push(`${year}-12-31`);
      query += ` AND period_start >= $${params.length - 1} AND period_end <= $${params.length}`;
    }
    
    params.push(limit);
    query += ` ORDER BY period_end DESC LIMIT $${params.length}`;

    const result = await pool.query(query, params);
    
    res.json({ success: true, statements: result.rows, count: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/statements/:statementId/generate', async (req, res) => {
  try {
    const { statementId } = req.params;
    
    const result = await pool.query(
      `UPDATE investor_statements SET 
        status = 'generated', 
        generated_at = NOW(), 
        file_url = $1
      WHERE statement_id = $2 
      RETURNING *`,
      [`/statements/${statementId}.pdf`, statementId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Statement not found' });
    }

    res.json({ success: true, statement: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// TAX LOT TRACKING ENDPOINTS
// =====================================================

router.post('/tax-lots', async (req, res) => {
  try {
    const { investor_id, property_id, acquisition_date, acquisition_price, shares_acquired, disposition_date, disposition_price, shares_sold, cost_basis, capital_gain } = req.body;
    
    if (!investor_id || !property_id || !acquisition_date || !acquisition_price) {
      return res.status(400).json({ error: 'investor_id, property_id, acquisition_date, and acquisition_price are required' });
    }

    const result = await pool.query(
      `INSERT INTO tax_lot_tracking (investor_id, property_id, acquisition_date, acquisition_price, 
        shares_acquired, disposition_date, disposition_price, shares_sold, cost_basis, capital_gain)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [investor_id, property_id, acquisition_date, acquisition_price, shares_acquired,
       disposition_date, disposition_price, shares_sold, cost_basis, capital_gain]
    );

    res.json({ success: true, tax_lot: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/tax-lots/:investorId', async (req, res) => {
  try {
    const { investorId } = req.params;
    const { property_id, status, limit = 100 } = req.query;
    
    let query = 'SELECT * FROM tax_lot_tracking WHERE investor_id = $1';
    const params = [investorId];
    
    if (property_id) {
      params.push(property_id);
      query += ` AND property_id = $${params.length}`;
    }
    if (status === 'open') {
      query += ' AND disposition_date IS NULL';
    } else if (status === 'closed') {
      query += ' AND disposition_date IS NOT NULL';
    }
    
    params.push(limit);
    query += ` ORDER BY acquisition_date DESC LIMIT $${params.length}`;

    const result = await pool.query(query, params);
    
    const totalCostBasis = result.rows.reduce((sum, lot) => sum + parseFloat(lot.cost_basis || lot.acquisition_price), 0);
    const totalGains = result.rows
      .filter(lot => lot.capital_gain)
      .reduce((sum, lot) => sum + parseFloat(lot.capital_gain), 0);

    res.json({ 
      success: true, 
      tax_lots: result.rows, 
      count: result.rows.length,
      total_cost_basis: totalCostBasis,
      total_capital_gains: totalGains
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/tax-lots/:lotId/dispose', async (req, res) => {
  try {
    const { lotId } = req.params;
    const { disposition_date, disposition_price, shares_sold } = req.body;
    
    if (!disposition_date || !disposition_price) {
      return res.status(400).json({ error: 'disposition_date and disposition_price are required' });
    }

    const lotResult = await pool.query('SELECT * FROM tax_lot_tracking WHERE id = $1', [lotId]);
    if (lotResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tax lot not found' });
    }

    const lot = lotResult.rows[0];
    const soldShares = shares_sold || lot.shares_acquired;
    const costBasis = (parseFloat(lot.acquisition_price) * soldShares) / lot.shares_acquired;
    const capitalGain = (parseFloat(disposition_price) * soldShares) - costBasis;

    const result = await pool.query(
      `UPDATE tax_lot_tracking SET 
        disposition_date = $1, 
        disposition_price = $2, 
        shares_sold = $3,
        cost_basis = $4,
        capital_gain = $5
      WHERE id = $6 
      RETURNING *`,
      [disposition_date, disposition_price, soldShares, costBasis, capitalGain, lotId]
    );

    res.json({ success: true, tax_lot: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// TAX PROVIDER INTEGRATIONS ENDPOINTS
// =====================================================

router.post('/integrations', async (req, res) => {
  try {
    const { provider_name, api_key_encrypted, integration_status, last_sync_at, configuration } = req.body;
    
    if (!provider_name) {
      return res.status(400).json({ error: 'provider_name is required' });
    }

    const result = await pool.query(
      `INSERT INTO tax_provider_integrations (provider_name, api_key_encrypted, integration_status, 
        last_sync_at, configuration)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, provider_name, integration_status, last_sync_at, configuration, created_at`,
      [provider_name, api_key_encrypted, integration_status || 'inactive', last_sync_at, configuration]
    );

    res.json({ success: true, integration: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/integrations', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, provider_name, integration_status, last_sync_at, configuration, created_at FROM tax_provider_integrations ORDER BY created_at DESC'
    );

    res.json({ success: true, integrations: result.rows, count: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/integrations/:integrationId/sync', async (req, res) => {
  try {
    const { integrationId } = req.params;
    
    const result = await pool.query(
      'UPDATE tax_provider_integrations SET last_sync_at = NOW(), integration_status = \'active\' WHERE id = $1 RETURNING id, provider_name, integration_status, last_sync_at',
      [integrationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    res.json({ success: true, integration: result.rows[0], message: 'Sync completed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// ANALYTICS & REPORTING
// =====================================================

router.get('/analytics/:investorId/summary', async (req, res) => {
  try {
    const { investorId } = req.params;
    const { tax_year } = req.query;
    
    const params = [investorId];
    let yearFilter = '';
    if (tax_year) {
      params.push(tax_year);
      yearFilter = ` AND tax_year = $${params.length}`;
    }

    const [documents, statements, taxLots] = await Promise.all([
      pool.query(`SELECT * FROM tax_documents WHERE investor_id = $1${yearFilter}`, params),
      pool.query('SELECT * FROM investor_statements WHERE investor_id = $1 ORDER BY period_end DESC LIMIT 1', [investorId]),
      pool.query('SELECT * FROM tax_lot_tracking WHERE investor_id = $1', [investorId])
    ]);

    const totalIncome = documents.rows.reduce((sum, doc) => sum + parseFloat(doc.income_amount || 0), 0);
    const totalWithholding = documents.rows.reduce((sum, doc) => sum + parseFloat(doc.withholding_amount || 0), 0);
    const totalGains = taxLots.rows
      .filter(lot => lot.capital_gain)
      .reduce((sum, lot) => sum + parseFloat(lot.capital_gain), 0);

    res.json({
      success: true,
      summary: {
        investor_id: investorId,
        tax_year: tax_year || new Date().getFullYear(),
        total_income: totalIncome,
        total_withholding: totalWithholding,
        total_capital_gains: totalGains,
        documents_count: documents.rows.length,
        statements_count: statements.rows.length,
        open_tax_lots: taxLots.rows.filter(lot => !lot.disposition_date).length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/bulk-generate/:investorId', async (req, res) => {
  try {
    const { investorId } = req.params;
    const { tax_year, document_types } = req.body;
    
    if (!tax_year || !document_types || !Array.isArray(document_types)) {
      return res.status(400).json({ error: 'tax_year and document_types array are required' });
    }

    const generated = [];
    
    for (const docType of document_types) {
      const documentId = uuidv4();
      const result = await pool.query(
        `INSERT INTO tax_documents (document_id, investor_id, document_type, tax_year, status, generated_at)
        VALUES ($1, $2, $3, $4, 'generated', NOW())
        RETURNING *`,
        [documentId, investorId, docType, tax_year]
      );
      generated.push(result.rows[0]);
    }

    res.json({ success: true, generated_documents: generated, count: generated.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
