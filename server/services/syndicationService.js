/**
 * Feature #6: Syndication Portal Service
 * Handles investor syndicates and waterfall distributions
 */

const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

class SyndicationService {
  constructor() {
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }

  async createSyndicate(leadInvestorId, syndicateData) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const syndicateId = uuidv4();
      
      const result = await client.query(
        `INSERT INTO syndicates (
          syndicate_id, syndicate_name, lead_investor_id, lead_wallet_address,
          target_raise, minimum_commitment, waterfall_structure, status
        ) VALUES ($1, $2, $3, 
          (SELECT wallet_address FROM users WHERE id = $3),
          $4, $5, $6, 'fundraising')
        RETURNING *`,
        [
          syndicateId, syndicateData.name, leadInvestorId,
          syndicateData.targetRaise, syndicateData.minCommitment,
          syndicateData.waterfallStructure || 'tiered'
        ]
      );
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }

  async calculateWaterfallDistribution(syndicateId, distributionAmount) {
    const client = await this.pool.connect();
    try {
      // Get waterfall tiers
      const tiersResult = await client.query(
        `SELECT * FROM waterfall_tiers WHERE syndicate_id = $1 ORDER BY tier_order`,
        [syndicateId]
      );
      
      // Get syndicate members
      const membersResult = await client.query(
        `SELECT * FROM syndicate_members WHERE syndicate_id = $1 AND status = 'funded'`,
        [syndicateId]
      );
      
      // Calculate distributions based on waterfall
      const distributions = this.applyWaterfall(
        tiersResult.rows,
        membersResult.rows,
        distributionAmount
      );
      
      return distributions;
    } finally { client.release(); }
  }

  applyWaterfall(tiers, members, amount) {
    // Simplified waterfall calculation
    // Real implementation would handle complex tier logic
    const totalCommitment = members.reduce((sum, m) => sum + parseFloat(m.commitment_amount), 0);
    
    return members.map(member => ({
      memberId: member.id,
      investorId: member.investor_id,
      proRataShare: (parseFloat(member.commitment_amount) / totalCommitment) * amount,
      tierBonus: 0
    }));
  }
}

module.exports = new SyndicationService();
