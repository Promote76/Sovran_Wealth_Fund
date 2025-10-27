/**
 * Feature #8: Multi-chain Deployment Orchestrator - REST API
 * Cross-chain contract deployment and bridge management
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// =====================================================
// SUPPORTED CHAINS ENDPOINTS
// =====================================================

router.get('/chains', async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = 'SELECT * FROM supported_chains WHERE 1=1';
    const params = [];
    
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    
    query += ' ORDER BY chain_name';

    const result = await pool.query(query, params);
    
    res.json({ success: true, chains: result.rows, count: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/chains/:chainId', async (req, res) => {
  try {
    const { chainId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM supported_chains WHERE chain_id = $1',
      [chainId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chain not found' });
    }

    res.json({ success: true, chain: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/chains/:chainId/status', async (req, res) => {
  try {
    const { chainId } = req.params;
    const { status } = req.body;
    
    if (!status || !['active', 'inactive', 'maintenance'].includes(status)) {
      return res.status(400).json({ error: 'Valid status required (active, inactive, maintenance)' });
    }

    const result = await pool.query(
      'UPDATE supported_chains SET status = $1, updated_at = NOW() WHERE chain_id = $2 RETURNING *',
      [status, chainId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chain not found' });
    }

    res.json({ success: true, chain: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// DEPLOYED CONTRACTS ENDPOINTS
// =====================================================

router.post('/contracts', async (req, res) => {
  try {
    const { contract_name, contract_type, chain_id, contract_address, deployer_address, deployment_tx_hash, constructor_args, verification_status } = req.body;
    
    if (!contract_name || !contract_type || !chain_id || !contract_address) {
      return res.status(400).json({ error: 'contract_name, contract_type, chain_id, and contract_address are required' });
    }

    const deploymentId = uuidv4();
    
    const result = await pool.query(
      `INSERT INTO deployed_contracts (deployment_id, contract_name, contract_type, chain_id, 
        contract_address, deployer_address, deployment_tx_hash, constructor_args, verification_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [deploymentId, contract_name, contract_type, chain_id, contract_address, 
       deployer_address, deployment_tx_hash, constructor_args, verification_status || 'pending']
    );

    res.json({ success: true, contract: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/contracts', async (req, res) => {
  try {
    const { chain_id, contract_type, verification_status, limit = 100 } = req.query;
    
    let query = 'SELECT * FROM deployed_contracts WHERE 1=1';
    const params = [];
    
    if (chain_id) {
      params.push(chain_id);
      query += ` AND chain_id = $${params.length}`;
    }
    if (contract_type) {
      params.push(contract_type);
      query += ` AND contract_type = $${params.length}`;
    }
    if (verification_status) {
      params.push(verification_status);
      query += ` AND verification_status = $${params.length}`;
    }
    
    params.push(limit);
    query += ` ORDER BY deployed_at DESC LIMIT $${params.length}`;

    const result = await pool.query(query, params);
    
    res.json({ success: true, contracts: result.rows, count: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/contracts/:deploymentId', async (req, res) => {
  try {
    const { deploymentId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM deployed_contracts WHERE deployment_id = $1',
      [deploymentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    res.json({ success: true, contract: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/contracts/:deploymentId/verify', async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const { verification_url } = req.body;
    
    const result = await pool.query(
      `UPDATE deployed_contracts SET 
        verification_status = 'verified', 
        verification_url = $1,
        updated_at = NOW()
      WHERE deployment_id = $2 
      RETURNING *`,
      [verification_url, deploymentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    res.json({ success: true, contract: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// CROSS-CHAIN BRIDGES ENDPOINTS
// =====================================================

router.post('/bridges', async (req, res) => {
  try {
    const { bridge_name, source_chain_id, destination_chain_id, bridge_contract_address, supported_tokens, fee_percentage, status } = req.body;
    
    if (!bridge_name || !source_chain_id || !destination_chain_id) {
      return res.status(400).json({ error: 'bridge_name, source_chain_id, and destination_chain_id are required' });
    }

    const bridgeId = uuidv4();
    
    const result = await pool.query(
      `INSERT INTO cross_chain_bridges (bridge_id, bridge_name, source_chain_id, destination_chain_id,
        bridge_contract_address, supported_tokens, fee_percentage, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [bridgeId, bridge_name, source_chain_id, destination_chain_id, bridge_contract_address,
       supported_tokens, fee_percentage || 0.1, status || 'active']
    );

    res.json({ success: true, bridge: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/bridges', async (req, res) => {
  try {
    const { source_chain_id, destination_chain_id, status } = req.query;
    
    let query = 'SELECT * FROM cross_chain_bridges WHERE 1=1';
    const params = [];
    
    if (source_chain_id) {
      params.push(source_chain_id);
      query += ` AND source_chain_id = $${params.length}`;
    }
    if (destination_chain_id) {
      params.push(destination_chain_id);
      query += ` AND destination_chain_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    
    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    
    res.json({ success: true, bridges: result.rows, count: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// BRIDGE TRANSACTIONS ENDPOINTS
// =====================================================

router.post('/bridge-transactions', async (req, res) => {
  try {
    const { bridge_id, sender_address, recipient_address, token_address, amount, source_tx_hash } = req.body;
    
    if (!bridge_id || !sender_address || !recipient_address || !amount) {
      return res.status(400).json({ error: 'bridge_id, sender_address, recipient_address, and amount are required' });
    }

    const transactionId = uuidv4();
    
    const result = await pool.query(
      `INSERT INTO bridge_transactions (transaction_id, bridge_id, sender_address, recipient_address,
        token_address, amount, source_tx_hash, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING *`,
      [transactionId, bridge_id, sender_address, recipient_address, token_address, amount, source_tx_hash]
    );

    res.json({ success: true, transaction: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/bridge-transactions', async (req, res) => {
  try {
    const { bridge_id, sender_address, status, limit = 100 } = req.query;
    
    let query = 'SELECT * FROM bridge_transactions WHERE 1=1';
    const params = [];
    
    if (bridge_id) {
      params.push(bridge_id);
      query += ` AND bridge_id = $${params.length}`;
    }
    if (sender_address) {
      params.push(sender_address);
      query += ` AND sender_address = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    
    params.push(limit);
    query += ` ORDER BY created_at DESC LIMIT $${params.length}`;

    const result = await pool.query(query, params);
    
    res.json({ success: true, transactions: result.rows, count: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/bridge-transactions/:transactionId/complete', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { destination_tx_hash, gas_used } = req.body;
    
    const result = await pool.query(
      `UPDATE bridge_transactions SET 
        status = 'completed', 
        destination_tx_hash = $1,
        gas_used = $2,
        completed_at = NOW()
      WHERE transaction_id = $3 
      RETURNING *`,
      [destination_tx_hash, gas_used, transactionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ success: true, transaction: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// DEPLOYMENT TEMPLATES ENDPOINTS
// =====================================================

router.post('/templates', async (req, res) => {
  try {
    const { template_name, contract_type, template_code, constructor_params, supported_chains, description } = req.body;
    
    if (!template_name || !contract_type || !template_code) {
      return res.status(400).json({ error: 'template_name, contract_type, and template_code are required' });
    }

    const result = await pool.query(
      `INSERT INTO deployment_templates (template_name, contract_type, template_code, 
        constructor_params, supported_chains, description)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [template_name, contract_type, template_code, constructor_params, supported_chains, description]
    );

    res.json({ success: true, template: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/templates', async (req, res) => {
  try {
    const { contract_type } = req.query;
    
    let query = 'SELECT * FROM deployment_templates WHERE 1=1';
    const params = [];
    
    if (contract_type) {
      params.push(contract_type);
      query += ` AND contract_type = $${params.length}`;
    }
    
    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    
    res.json({ success: true, templates: result.rows, count: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// CHAIN MONITORING ENDPOINTS
// =====================================================

router.post('/monitoring', async (req, res) => {
  try {
    const { chain_id, metric_type, metric_value, threshold_value, alert_triggered } = req.body;
    
    if (!chain_id || !metric_type || metric_value === undefined) {
      return res.status(400).json({ error: 'chain_id, metric_type, and metric_value are required' });
    }

    const result = await pool.query(
      `INSERT INTO chain_monitoring (chain_id, metric_type, metric_value, threshold_value, alert_triggered)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [chain_id, metric_type, metric_value, threshold_value, alert_triggered || false]
    );

    res.json({ success: true, monitoring: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/monitoring/:chainId', async (req, res) => {
  try {
    const { chainId } = req.params;
    const { metric_type, limit = 100 } = req.query;
    
    let query = 'SELECT * FROM chain_monitoring WHERE chain_id = $1';
    const params = [chainId];
    
    if (metric_type) {
      params.push(metric_type);
      query += ` AND metric_type = $${params.length}`;
    }
    
    params.push(limit);
    query += ` ORDER BY recorded_at DESC LIMIT $${params.length}`;

    const result = await pool.query(query, params);
    
    res.json({ success: true, metrics: result.rows, count: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// GAS PRICE HISTORY ENDPOINTS
// =====================================================

router.post('/gas-prices', async (req, res) => {
  try {
    const { chain_id, gas_price_gwei, gas_price_usd, block_number } = req.body;
    
    if (!chain_id || !gas_price_gwei) {
      return res.status(400).json({ error: 'chain_id and gas_price_gwei are required' });
    }

    const result = await pool.query(
      `INSERT INTO gas_price_history (chain_id, gas_price_gwei, gas_price_usd, block_number)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [chain_id, gas_price_gwei, gas_price_usd, block_number]
    );

    res.json({ success: true, gas_price: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/gas-prices/:chainId', async (req, res) => {
  try {
    const { chainId } = req.params;
    const { hours = 24, limit = 1000 } = req.query;
    
    const timeAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const result = await pool.query(
      `SELECT * FROM gas_price_history 
      WHERE chain_id = $1 AND recorded_at >= $2
      ORDER BY recorded_at DESC 
      LIMIT $3`,
      [chainId, timeAgo, limit]
    );

    const avgGasPrice = result.rows.length > 0
      ? result.rows.reduce((sum, row) => sum + parseFloat(row.gas_price_gwei), 0) / result.rows.length
      : 0;

    res.json({ 
      success: true, 
      gas_prices: result.rows, 
      count: result.rows.length,
      average_gwei: avgGasPrice.toFixed(2)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// ANALYTICS & REPORTING
// =====================================================

router.get('/analytics/summary', async (req, res) => {
  try {
    const [chains, contracts, bridges, transactions] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM supported_chains WHERE status = \'active\''),
      pool.query('SELECT COUNT(*) as count FROM deployed_contracts'),
      pool.query('SELECT COUNT(*) as count FROM cross_chain_bridges WHERE status = \'active\''),
      pool.query('SELECT COUNT(*) as count FROM bridge_transactions WHERE status = \'completed\'')
    ]);

    res.json({
      success: true,
      summary: {
        active_chains: parseInt(chains.rows[0].count),
        deployed_contracts: parseInt(contracts.rows[0].count),
        active_bridges: parseInt(bridges.rows[0].count),
        completed_transactions: parseInt(transactions.rows[0].count)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/analytics/chain/:chainId/stats', async (req, res) => {
  try {
    const { chainId } = req.params;
    
    const [contracts, avgGas] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM deployed_contracts WHERE chain_id = $1', [chainId]),
      pool.query(
        `SELECT AVG(gas_price_gwei) as avg_gas FROM gas_price_history 
        WHERE chain_id = $1 AND recorded_at >= NOW() - INTERVAL '24 hours'`,
        [chainId]
      )
    ]);

    res.json({
      success: true,
      stats: {
        chain_id: chainId,
        deployed_contracts: parseInt(contracts.rows[0].count),
        avg_gas_24h: parseFloat(avgGas.rows[0].avg_gas || 0).toFixed(2)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
