/**
 * Feature #7: Tax Automation Service
 * Automated tax document generation and reporting
 */

const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

class TaxService {
  constructor() {
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }

  async createTaxProfile(investorId, taxData) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO tax_profiles (
          profile_id, investor_id, tax_id_type, tax_id_encrypted,
          tax_country, entity_type, w9_status
        ) VALUES ($1, $2, $3, $4, $5, $6, 'pending')
        RETURNING *`,
        [
          uuidv4(), investorId, taxData.idType,
          taxData.taxIdEncrypted, taxData.country || 'US',
          taxData.entityType || 'individual'
        ]
      );
      return result.rows[0];
    } finally { client.release(); }
  }

  async generate1099(investorId, taxYear) {
    const client = await this.pool.connect();
    try {
      // Get all distributions for the year
      const distributionsResult = await client.query(
        `SELECT SUM(total_amount) as total_income
         FROM investor_revenue_payments
         WHERE investor_id = $1
         AND EXTRACT(YEAR FROM created_at) = $2`,
        [investorId, taxYear]
      );
      
      const totalIncome = parseFloat(distributionsResult.rows[0]?.total_income || 0);
      
      const documentId = uuidv4();
      const result = await client.query(
        `INSERT INTO tax_documents (
          document_id, investor_id, tax_year, document_type,
          total_income, document_data, status
        ) VALUES ($1, $2, $3, '1099_div', $4, $5, 'pending')
        RETURNING *`,
        [
          documentId, investorId, taxYear, totalIncome,
          JSON.stringify({ form: '1099-DIV', boxdata: { box1a: totalIncome } })
        ]
      );
      
      return result.rows[0];
    } finally { client.release(); }
  }

  async trackTaxLot(investorId, propertyId, shares, costBasis, acquisitionDate) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO tax_lot_tracking (
          lot_id, investor_id, property_id, acquisition_date,
          shares_acquired, cost_basis, cost_per_share, shares_remaining
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $5)
        RETURNING *`,
        [
          uuidv4(), investorId, propertyId, acquisitionDate,
          shares, costBasis, costBasis / shares
        ]
      );
      return result.rows[0];
    } finally { client.release(); }
  }
}

module.exports = new TaxService();
