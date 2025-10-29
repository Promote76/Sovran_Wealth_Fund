const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db } = require('../db');
const { waitlist } = require('../../shared/schema');
const { eq, desc, sql, or, and, like, count } = require('drizzle-orm');

const FEATURE_FLAG_WAITLIST_LANES = process.env.WAITLIST_LANES_ENABLED === 'true';

function generateConfirmationToken() {
  return crypto.randomBytes(32).toString('hex');
}

function parseTags(tagsString) {
  if (!tagsString) return [];
  return tagsString.split(',').map(t => t.trim()).filter(Boolean);
}

function serializeTags(tagsArray) {
  if (!Array.isArray(tagsArray)) return '';
  return tagsArray.filter(Boolean).join(',');
}

function addTags(existingTags, newTags) {
  const current = parseTags(existingTags);
  const combined = [...new Set([...current, ...newTags])];
  return serializeTags(combined);
}

function expandRole(existingRole, newRole) {
  if (existingRole === 'both' || newRole === 'both') return 'both';
  if (existingRole === newRole) return existingRole;
  return 'both';
}

/**
 * POST /api/waitlist/signup
 * Add email to waitlist (dual-lane: investors + wholesalers)
 */
router.post('/signup', async (req, res) => {
  try {
    const { 
      email, 
      name, 
      country, 
      role,
      investmentRange, 
      investorType,
      companyName,
      marketsServed,
      avgMonthlyDeals,
      assignmentFeePercent,
      entityType,
      hasEin,
      hasEoInsurance,
      source,
      ref
    } = req.body;

    const actualRole = FEATURE_FLAG_WAITLIST_LANES ? (role || 'investor') : 'investor';

    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid email address is required' 
      });
    }

    if (actualRole === 'investor' || actualRole === 'both') {
      if (!investorType) {
        return res.status(400).json({
          success: false,
          error: 'Investor type is required for investor role'
        });
      }
      if (!investmentRange) {
        return res.status(400).json({
          success: false,
          error: 'Investment range is required for investor role'
        });
      }
    }

    if (actualRole === 'wholesaler' || actualRole === 'both') {
      if (!companyName || !companyName.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Company name is required for wholesaler role'
        });
      }
      if (avgMonthlyDeals === undefined || avgMonthlyDeals === null || avgMonthlyDeals < 0) {
        return res.status(400).json({
          success: false,
          error: 'Average monthly deals is required and must be 0 or greater'
        });
      }
    }

    const existing = await db
      .select()
      .from(waitlist)
      .where(eq(waitlist.email, email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      const existingEntry = existing[0];
      const mergedRole = expandRole(existingEntry.role, actualRole);
      const isRoleExpanded = mergedRole !== existingEntry.role;
      
      const existingTags = parseTags(existingEntry.tags);
      let newTags = [];
      
      if (isRoleExpanded) {
        newTags.push('re_signup');
      }
      
      if (ref && ref.trim()) {
        newTags.push('referred');
      }

      const updateData = {
        role: mergedRole,
        name: name || existingEntry.name,
        country: country || existingEntry.country,
        source: source || existingEntry.source,
        tags: addTags(existingEntry.tags, newTags),
        updatedAt: new Date()
      };

      if (mergedRole === 'investor' || mergedRole === 'both') {
        updateData.investorType = investorType || existingEntry.investorType;
        updateData.investmentRange = investmentRange || existingEntry.investmentRange;
      }

      if (mergedRole === 'wholesaler' || mergedRole === 'both') {
        updateData.companyName = companyName || existingEntry.companyName;
        updateData.marketsServed = marketsServed || existingEntry.marketsServed;
        updateData.avgMonthlyDeals = avgMonthlyDeals !== undefined ? avgMonthlyDeals : existingEntry.avgMonthlyDeals;
        updateData.assignmentFeePercent = assignmentFeePercent !== undefined ? assignmentFeePercent : existingEntry.assignmentFeePercent;
        updateData.entityType = entityType || existingEntry.entityType;
        updateData.hasEin = hasEin !== undefined ? hasEin : existingEntry.hasEin;
        updateData.hasEoInsurance = hasEoInsurance !== undefined ? hasEoInsurance : existingEntry.hasEoInsurance;
      }

      const updated = await db
        .update(waitlist)
        .set(updateData)
        .where(eq(waitlist.id, existingEntry.id))
        .returning();

      return res.status(200).json({
        success: true,
        message: isRoleExpanded 
          ? 'Your role has been updated to include both investor and wholesaler!'
          : 'You are already on the waitlist!',
        position: updated[0].id,
        role: updated[0].role,
        foundingMember: updated[0].foundingMember,
        roleExpanded: isRoleExpanded
      });
    }

    const confirmationToken = generateConfirmationToken();
    
    let initialTags = [];
    if (actualRole === 'investor') initialTags.push('investor_join');
    if (actualRole === 'wholesaler') initialTags.push('wholesaler_join');
    if (actualRole === 'both') initialTags.push('both_join');
    if (ref && ref.trim()) initialTags.push('referred');

    const newEntry = await db
      .insert(waitlist)
      .values({
        email: email.toLowerCase(),
        name: name || null,
        country: country || null,
        role: actualRole,
        investmentRange: (actualRole === 'investor' || actualRole === 'both') ? investmentRange : null,
        investorType: (actualRole === 'investor' || actualRole === 'both') ? investorType : null,
        companyName: (actualRole === 'wholesaler' || actualRole === 'both') ? companyName : null,
        marketsServed: (actualRole === 'wholesaler' || actualRole === 'both') ? marketsServed : null,
        avgMonthlyDeals: (actualRole === 'wholesaler' || actualRole === 'both') ? avgMonthlyDeals : null,
        assignmentFeePercent: (actualRole === 'wholesaler' || actualRole === 'both') ? assignmentFeePercent : null,
        entityType: (actualRole === 'wholesaler' || actualRole === 'both') ? entityType : null,
        hasEin: (actualRole === 'wholesaler' || actualRole === 'both') ? hasEin : null,
        hasEoInsurance: (actualRole === 'wholesaler' || actualRole === 'both') ? hasEoInsurance : null,
        tags: serializeTags(initialTags),
        source: source || 'direct',
        confirmationToken,
        foundingMember: false,
        status: 'pending'
      })
      .returning();

    const totalCount = await db
      .select({ count: sql`count(*)::int` })
      .from(waitlist);

    const confirmUrl = `${req.protocol}://${req.get('host')}/api/waitlist/confirm/${confirmationToken}`;

    res.status(201).json({
      success: true,
      message: 'Successfully joined the waitlist! Please check your email to confirm.',
      position: newEntry[0].id,
      role: newEntry[0].role,
      totalSignups: totalCount[0].count,
      confirmUrl,
      benefits: actualRole === 'wholesaler' 
        ? {
            listingFees: 'Zero for first 60 days',
            investorPool: 'Access to verified investors',
            payoutOptions: 'Stablecoin or fiat'
          }
        : {
            platformFee: '1% for founding members (50% off)',
            earlyAccess: 'First 500 qualified investors',
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
 * GET /api/waitlist/confirm/:token
 * Confirm email and update status to qualified
 */
router.get('/confirm/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const entry = await db
      .select()
      .from(waitlist)
      .where(eq(waitlist.confirmationToken, token))
      .limit(1);

    if (entry.length === 0) {
      return res.status(404).send('Invalid or expired confirmation link');
    }

    const existing = entry[0];

    if (existing.status === 'qualified') {
      return res.send('Your email is already confirmed! Thank you.');
    }

    const qualifiedCount = await db
      .select({ count: sql`count(*)::int` })
      .from(waitlist)
      .where(eq(waitlist.status, 'qualified'));

    const isFoundingMember = qualifiedCount[0].count < 500;

    const newTags = parseTags(existing.tags);
    newTags.push('confirmed');
    if (isFoundingMember && !newTags.includes('founding_member')) {
      newTags.push('founding_member');
    }

    const updated = await db
      .update(waitlist)
      .set({
        status: 'qualified',
        confirmedAt: new Date(),
        foundingMember: isFoundingMember,
        tags: serializeTags(newTags),
        updatedAt: new Date()
      })
      .where(eq(waitlist.id, existing.id))
      .returning();

    const message = isFoundingMember
      ? `🎉 Congratulations! You are a founding member (#${qualifiedCount[0].count + 1} of 500). You'll receive 50% off platform fees for life!`
      : `✅ Your email has been confirmed! You're on the waitlist.`;

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Email Confirmed - AXIOM</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
          h1 { color: #1e40af; }
          p { font-size: 18px; color: #374151; margin: 20px 0; }
          .badge { background: #1e40af; color: white; padding: 8px 16px; border-radius: 6px; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <h1>AXIOM Waitlist</h1>
        <p>${message}</p>
        ${isFoundingMember ? '<div class="badge">FOUNDING MEMBER</div>' : ''}
        <p>We'll notify you when we launch!</p>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('❌ Waitlist confirm error:', error);
    res.status(500).send('Failed to confirm email. Please try again.');
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
        qualified: sql`count(*) FILTER (WHERE status = 'qualified')::int`,
        foundingMembers: sql`count(*) FILTER (WHERE founding_member = true)::int`,
        investors: sql`count(*) FILTER (WHERE role IN ('investor', 'both'))::int`,
        wholesalers: sql`count(*) FILTER (WHERE role IN ('wholesaler', 'both'))::int`,
        pending: sql`count(*) FILTER (WHERE status = 'pending')::int`
      })
      .from(waitlist);

    res.json({
      success: true,
      stats: {
        totalSignups: stats[0].total,
        qualifiedSignups: stats[0].qualified,
        foundingMembers: stats[0].foundingMembers,
        availableFoundingSpots: Math.max(0, 500 - stats[0].foundingMembers),
        investors: stats[0].investors,
        wholesalers: stats[0].wholesalers,
        pendingConfirmations: stats[0].pending
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
 * GET /api/waitlist/recent
 * Get recent signups for social proof ticker
 */
router.get('/recent', async (req, res) => {
  try {
    const recentSignups = await db
      .select({
        name: waitlist.name,
        email: waitlist.email,
        role: waitlist.role,
        investor_type: waitlist.investorType,
        created_at: waitlist.createdAt
      })
      .from(waitlist)
      .where(eq(waitlist.status, 'qualified'))
      .orderBy(desc(waitlist.createdAt))
      .limit(6);

    res.json({
      success: true,
      recent: recentSignups
    });

  } catch (error) {
    console.error('❌ Recent signups fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent signups'
    });
  }
});

/**
 * GET /api/waitlist/admin
 * Get all waitlist entries (admin only)
 */
router.get('/admin', async (req, res) => {
  try {
    const { role, status, search, limit = 1000, offset = 0 } = req.query;

    let query = db.select().from(waitlist);

    const filters = [];
    if (role && role !== 'all') {
      if (role === 'both') {
        filters.push(eq(waitlist.role, 'both'));
      } else {
        filters.push(or(
          eq(waitlist.role, role),
          eq(waitlist.role, 'both')
        ));
      }
    }
    
    if (status && status !== 'all') {
      filters.push(eq(waitlist.status, status));
    }

    if (search && search.trim()) {
      filters.push(
        or(
          like(waitlist.email, `%${search}%`),
          like(waitlist.name, `%${search}%`),
          like(waitlist.companyName, `%${search}%`)
        )
      );
    }

    if (filters.length > 0) {
      query = query.where(and(...filters));
    }

    const entries = await query
      .orderBy(desc(waitlist.createdAt))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    const statsQuery = await db
      .select({ 
        total: sql`count(*)::int`,
        byRole: sql`
          json_object_agg(
            COALESCE(role, 'unknown'),
            count(*)
          ) FILTER (WHERE role IS NOT NULL)
        `,
        byStatus: sql`
          json_object_agg(
            COALESCE(status, 'unknown'),
            count(*)
          ) FILTER (WHERE status IS NOT NULL)
        `,
        byInvestmentRange: sql`
          json_object_agg(
            COALESCE(investment_range, 'unknown'),
            count(*)
          ) FILTER (WHERE investment_range IS NOT NULL)
        `,
        byInvestorType: sql`
          json_object_agg(
            COALESCE(investor_type, 'unknown'),
            count(*)
          ) FILTER (WHERE investor_type IS NOT NULL)
        `
      })
      .from(waitlist);

    res.json({
      success: true,
      entries,
      stats: statsQuery[0],
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: entries.length
      }
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
 * GET /api/waitlist/admin/export
 * Export waitlist as CSV
 */
router.get('/admin/export', async (req, res) => {
  try {
    const { role, status } = req.query;

    let query = db.select().from(waitlist);
    const filters = [];

    if (role && role !== 'all') {
      if (role === 'both') {
        filters.push(eq(waitlist.role, 'both'));
      } else {
        filters.push(or(
          eq(waitlist.role, role),
          eq(waitlist.role, 'both')
        ));
      }
    }

    if (status && status !== 'all') {
      filters.push(eq(waitlist.status, status));
    }

    if (filters.length > 0) {
      query = query.where(and(...filters));
    }

    const entries = await query.orderBy(desc(waitlist.createdAt));

    const headers = [
      'ID', 'Email', 'Name', 'Country', 'Role', 'Status',
      'Investor Type', 'Investment Range',
      'Company Name', 'Markets Served', 'Avg Monthly Deals', 
      'Assignment Fee %', 'Entity Type', 'Has EIN', 'Has E&O Insurance',
      'Tags', 'Founding Member', 'Source', 
      'Created At', 'Confirmed At', 'Converted At'
    ];

    const csvRows = [headers.join(',')];

    entries.forEach(entry => {
      const row = [
        entry.id,
        `"${entry.email}"`,
        `"${entry.name || ''}"`,
        `"${entry.country || ''}"`,
        entry.role,
        entry.status,
        `"${entry.investorType || ''}"`,
        `"${entry.investmentRange || ''}"`,
        `"${entry.companyName || ''}"`,
        `"${entry.marketsServed || ''}"`,
        entry.avgMonthlyDeals || '',
        entry.assignmentFeePercent || '',
        entry.entityType || '',
        entry.hasEin !== null ? entry.hasEin : '',
        entry.hasEoInsurance !== null ? entry.hasEoInsurance : '',
        `"${entry.tags || ''}"`,
        entry.foundingMember,
        entry.source || '',
        entry.createdAt ? new Date(entry.createdAt).toISOString() : '',
        entry.confirmedAt ? new Date(entry.confirmedAt).toISOString() : '',
        entry.convertedAt ? new Date(entry.convertedAt).toISOString() : ''
      ];
      csvRows.push(row.join(','));
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="axiom-waitlist-${Date.now()}.csv"`);
    res.send(csvRows.join('\n'));

  } catch (error) {
    console.error('❌ Waitlist export error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to export waitlist' 
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
    const { status, notes, foundingMember } = req.body;

    const updateData = {
      updatedAt: new Date()
    };

    if (status) {
      updateData.status = status;
      if (status === 'qualified') {
        updateData.confirmedAt = new Date();
      }
      if (status === 'converted') {
        updateData.convertedAt = new Date();
      }
      if (status === 'rejected') {
        updateData.foundingMember = false;
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (foundingMember !== undefined) {
      updateData.foundingMember = foundingMember;
    }

    const updated = await db
      .update(waitlist)
      .set(updateData)
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
