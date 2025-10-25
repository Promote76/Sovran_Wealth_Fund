const express = require('express');
const { db } = require('../db');
const {
  users,
  registrationJourney,
  unifiedPersonalProfiles,
  unifiedFinancialProfiles,
  unifiedRiskProfiles,
  programEnrollments,
  kycVerifications
} = require('../../shared/schema');
const { eq, desc, asc, like, and, or, sql, gte, lte } = require('drizzle-orm');
const { requireAdmin } = require('../middleware/secureAuth');

const router = express.Router();

// Protect all routes with admin authentication
router.use(requireAdmin);

// ============ ANALYTICS ENDPOINTS ============

// GET /api/unified-registration-admin/analytics/funnel
// Get registration funnel conversion metrics
router.get('/analytics/funnel', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = [];
    if (startDate) {
      dateFilter.push(gte(registrationJourney.startedAt, new Date(startDate)));
    }
    if (endDate) {
      dateFilter.push(lte(registrationJourney.startedAt, new Date(endDate)));
    }

    // Get funnel statistics
    const [funnelStats] = await db.execute(sql`
      SELECT
        COUNT(DISTINCT rj.user_id) as total_started,
        COUNT(DISTINCT CASE WHEN rj.has_personal_profile THEN rj.user_id END) as completed_personal,
        COUNT(DISTINCT CASE WHEN rj.has_financial_profile THEN rj.user_id END) as completed_financial,
        COUNT(DISTINCT CASE WHEN rj.has_risk_profile THEN rj.user_id END) as completed_risk,
        COUNT(DISTINCT CASE WHEN rj.has_kyc_verification THEN rj.user_id END) as completed_kyc,
        COUNT(DISTINCT CASE WHEN rj.is_completed THEN rj.user_id END) as completed_registration,
        AVG(rj.total_time_spent) as avg_time_spent,
        COUNT(DISTINCT CASE WHEN rj.abandoned_at IS NOT NULL THEN rj.user_id END) as abandoned_count
      FROM registration_journey rj
      ${dateFilter.length > 0 ? sql`WHERE ${and(...dateFilter)}` : sql``}
    `);

    // Get program enrollment statistics
    const programStats = await db
      .select({
        programType: programEnrollments.programType,
        count: sql<number>`count(*)`,
      })
      .from(programEnrollments)
      .groupBy(programEnrollments.programType);

    // Calculate conversion rates
    const totalStarted = Number(funnelStats.total_started) || 1;
    const metrics = {
      totalStarted: Number(funnelStats.total_started),
      steps: {
        personal: {
          completed: Number(funnelStats.completed_personal),
          conversionRate: ((Number(funnelStats.completed_personal) / totalStarted) * 100).toFixed(2)
        },
        financial: {
          completed: Number(funnelStats.completed_financial),
          conversionRate: ((Number(funnelStats.completed_financial) / totalStarted) * 100).toFixed(2)
        },
        risk: {
          completed: Number(funnelStats.completed_risk),
          conversionRate: ((Number(funnelStats.completed_risk) / totalStarted) * 100).toFixed(2)
        },
        kyc: {
          completed: Number(funnelStats.completed_kyc),
          conversionRate: ((Number(funnelStats.completed_kyc) / totalStarted) * 100).toFixed(2)
        }
      },
      completedRegistrations: Number(funnelStats.completed_registration),
      overallConversionRate: ((Number(funnelStats.completed_registration) / totalStarted) * 100).toFixed(2),
      avgTimeSpent: Number(funnelStats.avg_time_spent) || 0,
      abandonedCount: Number(funnelStats.abandoned_count),
      abandonmentRate: ((Number(funnelStats.abandoned_count) / totalStarted) * 100).toFixed(2),
      programEnrollments: programStats
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching funnel analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET /api/unified-registration-admin/analytics/daily-signups
// Get daily signup trends
router.get('/analytics/daily-signups', async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const dailySignups = await db.execute(sql`
      SELECT
        DATE(started_at) as date,
        COUNT(*) as signups,
        COUNT(CASE WHEN is_completed THEN 1 END) as completions
      FROM registration_journey
      WHERE started_at >= NOW() - INTERVAL '${sql.raw(days)} days'
      GROUP BY DATE(started_at)
      ORDER BY date DESC
    `);

    res.json(dailySignups.rows);
  } catch (error) {
    console.error('Error fetching daily signups:', error);
    res.status(500).json({ error: 'Failed to fetch daily signups' });
  }
});

// ============ USER MANAGEMENT ENDPOINTS ============

// GET /api/unified-registration-admin/users
// Get all users with registration progress
router.get('/users', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      currentStep,
      isCompleted,
      hasKyc
    } = req.query;

    const offset = (page - 1) * limit;
    const orderDirection = sortOrder === 'asc' ? asc : desc;

    // Build filters
    const filters = [];
    if (search) {
      filters.push(
        or(
          like(users.email, `%${search}%`),
          like(users.firstName, `%${search}%`),
          like(users.lastName, `%${search}%`)
        )
      );
    }

    // Get users with their registration journey data
    const query = db
      .select({
        userId: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        accountStatus: users.accountStatus,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
        
        // Registration Journey
        journeyId: registrationJourney.id,
        currentStep: registrationJourney.currentStep,
        completedSteps: registrationJourney.completedSteps,
        hasPersonalProfile: registrationJourney.hasPersonalProfile,
        hasFinancialProfile: registrationJourney.hasFinancialProfile,
        hasRiskProfile: registrationJourney.hasRiskProfile,
        hasKycVerification: registrationJourney.hasKycVerification,
        isCompleted: registrationJourney.isCompleted,
        completedAt: registrationJourney.completedAt,
        totalTimeSpent: registrationJourney.totalTimeSpent,
        lastActivityAt: registrationJourney.lastActivityAt,
      })
      .from(users)
      .leftJoin(registrationJourney, eq(users.id, registrationJourney.userId))
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(orderDirection(users[sortBy] || users.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));

    const usersData = await query;

    // Get total count for pagination
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(filters.length > 0 ? and(...filters) : undefined);

    const totalRecords = Number(countResult.count);
    const totalPages = Math.ceil(totalRecords / limit);

    res.json({
      users: usersData,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalRecords,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/unified-registration-admin/users/:userId
// Get detailed information about a specific user
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user basic info
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get registration journey
    const [journey] = await db
      .select()
      .from(registrationJourney)
      .where(eq(registrationJourney.userId, userId));

    // Get personal profile
    const [personalProfile] = await db
      .select()
      .from(unifiedPersonalProfiles)
      .where(eq(unifiedPersonalProfiles.userId, userId));

    // Get financial profile
    const [financialProfile] = await db
      .select()
      .from(unifiedFinancialProfiles)
      .where(eq(unifiedFinancialProfiles.userId, userId));

    // Get risk profile
    const [riskProfile] = await db
      .select()
      .from(unifiedRiskProfiles)
      .where(eq(unifiedRiskProfiles.userId, userId));

    // Get program enrollments
    const enrollments = await db
      .select()
      .from(programEnrollments)
      .where(eq(programEnrollments.userId, userId));

    // Get KYC verification
    const [kycVerification] = await db
      .select()
      .from(kycVerifications)
      .where(eq(kycVerifications.userId, userId));

    res.json({
      user,
      journey,
      personalProfile,
      financialProfile,
      riskProfile,
      enrollments,
      kycVerification
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// PATCH /api/unified-registration-admin/users/:userId/journey
// Manually update user's registration journey step
router.patch('/users/:userId/journey', async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentStep, completedSteps, notes } = req.body;

    const updateData = {};
    if (currentStep) updateData.currentStep = currentStep;
    if (completedSteps) updateData.completedSteps = completedSteps;

    const [updated] = await db
      .update(registrationJourney)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(registrationJourney.userId, userId))
      .returning();

    // Log admin action
    console.log(`Admin ${req.user.id} updated journey for user ${userId}: ${notes || 'Manual update'}`);

    res.json({ success: true, journey: updated });
  } catch (error) {
    console.error('Error updating user journey:', error);
    res.status(500).json({ error: 'Failed to update journey' });
  }
});

// PATCH /api/unified-registration-admin/users/:userId/status
// Update user account status
router.patch('/users/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { accountStatus, reason } = req.body;

    const [updated] = await db
      .update(users)
      .set({
        accountStatus,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    console.log(`Admin ${req.user.id} changed status for user ${userId} to ${accountStatus}: ${reason || 'No reason provided'}`);

    res.json({ success: true, user: updated });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// POST /api/unified-registration-admin/users/:userId/complete-step
// Manually mark a step as complete for a user
router.post('/users/:userId/complete-step', async (req, res) => {
  try {
    const { userId } = req.params;
    const { stepName } = req.body; // 'personal_profile', 'financial_profile', 'risk_profile', 'kyc'

    const updateData = {};
    const stepFlagMap = {
      'personal_profile': 'hasPersonalProfile',
      'financial_profile': 'hasFinancialProfile',
      'risk_profile': 'hasRiskProfile',
      'kyc': 'hasKycVerification'
    };

    if (stepFlagMap[stepName]) {
      updateData[stepFlagMap[stepName]] = true;
    }

    // Get current journey
    const [journey] = await db
      .select()
      .from(registrationJourney)
      .where(eq(registrationJourney.userId, userId));

    if (!journey) {
      return res.status(404).json({ error: 'Journey not found' });
    }

    // Add step to completedSteps array
    const completedSteps = journey.completedSteps || [];
    if (!completedSteps.includes(stepName)) {
      completedSteps.push(stepName);
    }

    const [updated] = await db
      .update(registrationJourney)
      .set({
        ...updateData,
        completedSteps,
        updatedAt: new Date()
      })
      .where(eq(registrationJourney.userId, userId))
      .returning();

    console.log(`Admin ${req.user.id} manually completed step ${stepName} for user ${userId}`);

    res.json({ success: true, journey: updated });
  } catch (error) {
    console.error('Error completing step:', error);
    res.status(500).json({ error: 'Failed to complete step' });
  }
});

// GET /api/unified-registration-admin/programs/stats
// Get program enrollment statistics
router.get('/programs/stats', async (req, res) => {
  try {
    const stats = await db
      .select({
        programType: programEnrollments.programType,
        totalEnrollments: sql<number>`count(*)`,
        activeEnrollments: sql<number>`count(CASE WHEN ${programEnrollments.status} = 'active' THEN 1 END)`,
        completedEnrollments: sql<number>`count(CASE WHEN ${programEnrollments.status} = 'completed' THEN 1 END)`,
      })
      .from(programEnrollments)
      .groupBy(programEnrollments.programType);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching program stats:', error);
    res.status(500).json({ error: 'Failed to fetch program statistics' });
  }
});

module.exports = router;
