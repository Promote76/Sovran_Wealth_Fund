const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { waitlist } = require('../../shared/schema');
const { eq, desc, sql } = require('drizzle-orm');

/**
 * POST /api/waitlist/signup
 * Add email to waitlist
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, name, investmentRange, investorType, source } = req.body;

    // Validate email
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid email address is required' 
      });
    }

    // Check if email already exists
    const existing = await db
      .select()
      .from(waitlist)
      .where(eq(waitlist.email, email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'You are already on the waitlist!',
        position: existing[0].id,
        foundingMember: existing[0].foundingMember
      });
    }

    // Insert new waitlist entry
    const newEntry = await db
      .insert(waitlist)
      .values({
        email: email.toLowerCase(),
        name: name || null,
        investmentRange: investmentRange || null,
        investorType: investorType || null,
        source: source || 'direct',
        foundingMember: true,
        status: 'pending'
      })
      .returning();

    // Get total waitlist count
    const totalCount = await db
      .select({ count: sql`count(*)::int` })
      .from(waitlist);

    res.status(201).json({
      success: true,
      message: 'Successfully joined the waitlist!',
      position: newEntry[0].id,
      totalSignups: totalCount[0].count,
      foundingMember: true,
      benefits: {
        platformFee: '1% (50% off)',
        earlyAccess: 'First 100 investors',
        exclusiveUpdates: true
      }
    });

  } catch (error) {
    console.error('❌ Waitlist signup error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to join waitlist. Please try again.' 
    });
  }
});

/**
 * GET /api/waitlist/stats
 * Get public waitlist statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await db
      .select({ 
        total: sql`count(*)::int`,
        foundingMembers: sql`count(*) FILTER (WHERE founding_member = true)::int`,
        pending: sql`count(*) FILTER (WHERE status = 'pending')::int`
      })
      .from(waitlist);

    res.json({
      success: true,
      stats: {
        totalSignups: stats[0].total,
        foundingMembers: stats[0].foundingMembers,
        availableSpots: Math.max(0, 100 - stats[0].foundingMembers),
        pendingNotifications: stats[0].pending
      }
    });

  } catch (error) {
    console.error('❌ Waitlist stats error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch stats' 
    });
  }
});

/**
 * GET /api/waitlist/admin
 * Get all waitlist entries (admin only)
 */
router.get('/admin', async (req, res) => {
  try {
    // TODO: Add admin authentication middleware
    const entries = await db
      .select()
      .from(waitlist)
      .orderBy(desc(waitlist.createdAt))
      .limit(1000);

    const stats = await db
      .select({ 
        total: sql`count(*)::int`,
        byInvestmentRange: sql`
          json_object_agg(
            COALESCE(investment_range, 'unknown'),
            count(*)
          )
        `,
        byInvestorType: sql`
          json_object_agg(
            COALESCE(investor_type, 'unknown'),
            count(*)
          )
        `
      })
      .from(waitlist);

    res.json({
      success: true,
      entries,
      stats: stats[0]
    });

  } catch (error) {
    console.error('❌ Waitlist admin error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch waitlist data' 
    });
  }
});

/**
 * PUT /api/waitlist/admin/:id
 * Update waitlist entry status (admin only)
 */
router.put('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    // TODO: Add admin authentication middleware
    const updated = await db
      .update(waitlist)
      .set({
        status,
        notes,
        notified: status === 'contacted',
        notifiedAt: status === 'contacted' ? new Date() : undefined,
        convertedAt: status === 'converted' ? new Date() : undefined,
        updatedAt: new Date()
      })
      .where(eq(waitlist.id, parseInt(id)))
      .returning();

    res.json({
      success: true,
      entry: updated[0]
    });

  } catch (error) {
    console.error('❌ Waitlist update error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update waitlist entry' 
    });
  }
});

module.exports = router;
