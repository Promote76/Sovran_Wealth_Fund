/**
 * Feature #6: Co-Investment Syndication Portal - REST API
 * Enables lead investors to create syndicates with custom waterfall distributions
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// =====================================================
// SYNDICATES ENDPOINTS
// =====================================================

router.post('/syndicates', async (req, res) => {
  try {
    const { lead_investor_id, lead_wallet_address, syndicate_name, syndicate_type, target_raise, minimum_commitment, maximum_commitment, waterfall_structure, description, visibility } = req.body;
    
    if (!syndicate_name || !target_raise) {
      return res.status(400).json({ error: 'syndicate_name and target_raise are required' });
    }

    const syndicateId = uuidv4();
    const leadInvestorId = parseInt(lead_investor_id) || 9;
    const leadWallet = lead_wallet_address || '0x0000000000000000000000000000000000000000';
    
    const result = await pool.query(
      `INSERT INTO syndicates (syndicate_id, lead_investor_id, lead_wallet_address, syndicate_name, syndicate_type, target_raise, 
        minimum_commitment, maximum_commitment, waterfall_structure, description, visibility, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'fundraising')
      RETURNING *`,
      [syndicateId, leadInvestorId, leadWallet, syndicate_name, syndicate_type || 'deal_specific', target_raise, 
       minimum_commitment || 5000, maximum_commitment, waterfall_structure || 'tiered', description, visibility || 'private']
    );

    res.json({ success: true, syndicate: result.rows[0] });
  } catch (error) {
    console.error('Create syndicate error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/syndicates', async (req, res) => {
  try {
    const { status, syndicate_type, limit = 50 } = req.query;
    
    let query = 'SELECT * FROM syndicates WHERE 1=1';
    const params = [];
    
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    if (syndicate_type) {
      params.push(syndicate_type);
      query += ` AND syndicate_type = $${params.length}`;
    }
    
    params.push(limit);
    query += ` ORDER BY created_at DESC LIMIT $${params.length}`;

    const result = await pool.query(query, params);
    res.json({ success: true, syndicates: result.rows, count: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/syndicates/:syndicateId', async (req, res) => {
  try {
    const { syndicateId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM syndicates WHERE syndicate_id = $1',
      [syndicateId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Syndicate not found' });
    }

    res.json({ success: true, syndicate: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/syndicates/:syndicateId/status', async (req, res) => {
  try {
    const { syndicateId } = req.params;
    const { status } = req.body;
    
    if (!status || !['fundraising', 'active', 'closed', 'dissolved'].includes(status)) {
      return res.status(400).json({ error: 'Valid status required (fundraising, active, closed, dissolved)' });
    }

    const result = await pool.query(
      'UPDATE syndicates SET status = $1, updated_at = NOW() WHERE syndicate_id = $2 RETURNING *',
      [status, syndicateId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Syndicate not found' });
    }

    res.json({ success: true, syndicate: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// SYNDICATE MEMBERS ENDPOINTS
// =====================================================

router.post('/syndicates/:syndicateId/members', async (req, res) => {
  try {
    const { syndicateId } = req.params;
    const { investor_id, commitment_amount, role } = req.body;
    
    if (!investor_id || !commitment_amount) {
      return res.status(400).json({ error: 'investor_id and commitment_amount are required' });
    }

    const result = await pool.query(
      `INSERT INTO syndicate_members (syndicate_id, investor_id, commitment_amount, role, status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING *`,
      [syndicateId, investor_id, commitment_amount, role || 'member']
    );

    res.json({ success: true, member: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/syndicates/:syndicateId/members', async (req, res) => {
  try {
    const { syndicateId } = req.params;
    const { status } = req.query;
    
    let query = 'SELECT * FROM syndicate_members WHERE syndicate_id = $1';
    const params = [syndicateId];
    
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    
    query += ' ORDER BY joined_at DESC';

    const result = await pool.query(query, params);
    
    const totalCommitment = result.rows.reduce((sum, m) => sum + parseFloat(m.commitment_amount || 0), 0);

    res.json({ 
      success: true, 
      members: result.rows, 
      count: result.rows.length,
      total_commitment: totalCommitment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/members/:memberId/status', async (req, res) => {
  try {
    const { memberId } = req.params;
    const { status } = req.body;
    
    if (!status || !['pending', 'approved', 'funded', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Valid status required (pending, approved, funded, rejected)' });
    }

    const result = await pool.query(
      'UPDATE syndicate_members SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, memberId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json({ success: true, member: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// WATERFALL TIERS ENDPOINTS
// =====================================================

router.post('/syndicates/:syndicateId/waterfall', async (req, res) => {
  try {
    const { syndicateId } = req.params;
    const { tier_name, tier_order, tier_type, allocation_percentage, hurdle_rate, preferred_return, carry_percentage } = req.body;
    
    if (!tier_name || tier_order === undefined || !tier_type) {
      return res.status(400).json({ error: 'tier_name, tier_order, and tier_type are required' });
    }

    const result = await pool.query(
      `INSERT INTO waterfall_tiers (syndicate_id, tier_name, tier_order, tier_type, 
        allocation_percentage, hurdle_rate, preferred_return, carry_percentage)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [syndicateId, tier_name, tier_order, tier_type, allocation_percentage, hurdle_rate, preferred_return, carry_percentage]
    );

    res.json({ success: true, tier: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/syndicates/:syndicateId/waterfall', async (req, res) => {
  try {
    const { syndicateId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM waterfall_tiers WHERE syndicate_id = $1 ORDER BY tier_order',
      [syndicateId]
    );

    res.json({ success: true, tiers: result.rows, count: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/waterfall/:tierId', async (req, res) => {
  try {
    const { tierId } = req.params;
    const updates = req.body;
    
    const allowedFields = ['tier_name', 'allocation_percentage', 'hurdle_rate', 'preferred_return', 'carry_percentage'];
    const setFields = [];
    const values = [];
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        values.push(updates[key]);
        setFields.push(`${key} = $${values.length}`);
      }
    });
    
    if (setFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    values.push(tierId);
    const query = `UPDATE waterfall_tiers SET ${setFields.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`;
    
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Waterfall tier not found' });
    }

    res.json({ success: true, tier: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/waterfall/:tierId', async (req, res) => {
  try {
    const { tierId } = req.params;
    
    const result = await pool.query(
      'DELETE FROM waterfall_tiers WHERE id = $1 RETURNING *',
      [tierId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Waterfall tier not found' });
    }

    res.json({ success: true, message: 'Waterfall tier deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// DISTRIBUTIONS ENDPOINTS
// =====================================================

router.post('/syndicates/:syndicateId/distributions', async (req, res) => {
  try {
    const { syndicateId } = req.params;
    const { distribution_type, total_amount, distribution_date, notes } = req.body;
    
    if (!distribution_type || !total_amount) {
      return res.status(400).json({ error: 'distribution_type and total_amount are required' });
    }

    const distributionId = uuidv4();
    
    const result = await pool.query(
      `INSERT INTO syndicate_distributions (distribution_id, syndicate_id, distribution_type, 
        total_amount, distribution_date, notes, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING *`,
      [distributionId, syndicateId, distribution_type, total_amount, distribution_date || new Date(), notes]
    );

    res.json({ success: true, distribution: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/syndicates/:syndicateId/distributions', async (req, res) => {
  try {
    const { syndicateId } = req.params;
    const { status } = req.query;
    
    let query = 'SELECT * FROM syndicate_distributions WHERE syndicate_id = $1';
    const params = [syndicateId];
    
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    
    query += ' ORDER BY distribution_date DESC';

    const result = await pool.query(query, params);

    res.json({ success: true, distributions: result.rows, count: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/distributions/:distributionId/calculate', async (req, res) => {
  try {
    const { distributionId } = req.params;
    
    const distResult = await pool.query(
      'SELECT * FROM syndicate_distributions WHERE distribution_id = $1',
      [distributionId]
    );

    if (distResult.rows.length === 0) {
      return res.status(404).json({ error: 'Distribution not found' });
    }

    const distribution = distResult.rows[0];
    const syndicateId = distribution.syndicate_id;

    const membersResult = await pool.query(
      'SELECT * FROM syndicate_members WHERE syndicate_id = $1 AND status = \'funded\'',
      [syndicateId]
    );

    const tiersResult = await pool.query(
      'SELECT * FROM waterfall_tiers WHERE syndicate_id = $1 ORDER BY tier_order',
      [syndicateId]
    );

    const totalCommitment = membersResult.rows.reduce((sum, m) => sum + parseFloat(m.commitment_amount), 0);
    const distributionAmount = parseFloat(distribution.total_amount);

    const calculations = membersResult.rows.map(member => {
      const proRataShare = (parseFloat(member.commitment_amount) / totalCommitment) * distributionAmount;
      
      return {
        member_id: member.id,
        investor_id: member.investor_id,
        commitment_amount: member.commitment_amount,
        pro_rata_share: proRataShare.toFixed(2),
        tier_bonus: 0,
        total_distribution: proRataShare.toFixed(2)
      };
    });

    res.json({ 
      success: true, 
      distribution_id: distributionId,
      total_amount: distributionAmount,
      member_count: calculations.length,
      calculations 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/distributions/:distributionId/execute', async (req, res) => {
  try {
    const { distributionId } = req.params;
    
    const result = await pool.query(
      'UPDATE syndicate_distributions SET status = \'processed\', processed_at = NOW() WHERE distribution_id = $1 RETURNING *',
      [distributionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Distribution not found' });
    }

    res.json({ success: true, distribution: result.rows[0], message: 'Distribution executed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// INVITATIONS ENDPOINTS
// =====================================================

router.post('/syndicates/:syndicateId/invitations', async (req, res) => {
  try {
    const { syndicateId } = req.params;
    const { investor_id, email, suggested_commitment } = req.body;
    
    if (!investor_id && !email) {
      return res.status(400).json({ error: 'Either investor_id or email is required' });
    }

    const invitationId = uuidv4();
    
    const result = await pool.query(
      `INSERT INTO syndicate_invitations (invitation_id, syndicate_id, investor_id, email, 
        suggested_commitment, status)
      VALUES ($1, $2, $3, $4, $5, 'sent')
      RETURNING *`,
      [invitationId, syndicateId, investor_id, email, suggested_commitment]
    );

    res.json({ success: true, invitation: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/syndicates/:syndicateId/invitations', async (req, res) => {
  try {
    const { syndicateId } = req.params;
    const { status } = req.query;
    
    let query = 'SELECT * FROM syndicate_invitations WHERE syndicate_id = $1';
    const params = [syndicateId];
    
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    
    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    res.json({ success: true, invitations: result.rows, count: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/invitations/:invitationId/respond', async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { response } = req.body;
    
    if (!response || !['accepted', 'declined'].includes(response)) {
      return res.status(400).json({ error: 'Valid response required (accepted, declined)' });
    }

    const result = await pool.query(
      'UPDATE syndicate_invitations SET status = $1, responded_at = NOW() WHERE invitation_id = $2 RETURNING *',
      [response, invitationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    res.json({ success: true, invitation: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// FEES ENDPOINTS
// =====================================================

router.post('/syndicates/:syndicateId/fees', async (req, res) => {
  try {
    const { syndicateId } = req.params;
    const { fee_type, fee_percentage, fee_fixed_amount, description } = req.body;
    
    if (!fee_type) {
      return res.status(400).json({ error: 'fee_type is required' });
    }

    const result = await pool.query(
      `INSERT INTO syndicate_fees (syndicate_id, fee_type, fee_percentage, fee_fixed_amount, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [syndicateId, fee_type, fee_percentage, fee_fixed_amount, description]
    );

    res.json({ success: true, fee: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/syndicates/:syndicateId/fees', async (req, res) => {
  try {
    const { syndicateId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM syndicate_fees WHERE syndicate_id = $1 ORDER BY created_at',
      [syndicateId]
    );

    res.json({ success: true, fees: result.rows, count: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// ANALYTICS & REPORTING
// =====================================================

router.get('/syndicates/:syndicateId/summary', async (req, res) => {
  try {
    const { syndicateId } = req.params;
    
    const [syndicate, members, distributions, fees] = await Promise.all([
      pool.query('SELECT * FROM syndicates WHERE syndicate_id = $1', [syndicateId]),
      pool.query('SELECT * FROM syndicate_members WHERE syndicate_id = $1', [syndicateId]),
      pool.query('SELECT * FROM syndicate_distributions WHERE syndicate_id = $1', [syndicateId]),
      pool.query('SELECT * FROM syndicate_fees WHERE syndicate_id = $1', [syndicateId])
    ]);

    if (syndicate.rows.length === 0) {
      return res.status(404).json({ error: 'Syndicate not found' });
    }

    const totalCommitment = members.rows.reduce((sum, m) => sum + parseFloat(m.commitment_amount || 0), 0);
    const totalDistributed = distributions.rows
      .filter(d => d.status === 'processed')
      .reduce((sum, d) => sum + parseFloat(d.total_amount || 0), 0);

    res.json({
      success: true,
      summary: {
        syndicate: syndicate.rows[0],
        members_count: members.rows.length,
        total_commitment: totalCommitment,
        total_distributed: totalDistributed,
        distributions_count: distributions.rows.length,
        fees_count: fees.rows.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/investor/:investorId/syndicates', async (req, res) => {
  try {
    const { investorId } = req.params;
    
    const result = await pool.query(
      `SELECT s.*, sm.commitment_amount, sm.role, sm.status as member_status
      FROM syndicates s
      JOIN syndicate_members sm ON s.syndicate_id = sm.syndicate_id
      WHERE sm.investor_id = $1
      ORDER BY sm.joined_at DESC`,
      [investorId]
    );

    res.json({ success: true, syndicates: result.rows, count: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
