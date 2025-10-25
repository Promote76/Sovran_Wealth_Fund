const express = require('express');
const { db } = require('../db');
const { kycVerifications, users } = require('../../shared/schema');
const { eq, sql, desc } = require('drizzle-orm');
const { requireAdmin } = require('../middleware/secureAuth');

const router = express.Router();

// GET /api/kyc/verifications
// Get all KYC verification submissions (admin only)
router.get('/verifications', requireAdmin, async (req, res) => {
  try {
    const verifications = await db
      .select({
        id: kycVerifications.id,
        userId: kycVerifications.userId,
        firstName: kycVerifications.firstName,
        lastName: kycVerifications.lastName,
        dateOfBirth: kycVerifications.dateOfBirth,
        nationality: kycVerifications.nationality,
        phoneNumber: kycVerifications.phoneNumber,
        verificationStatus: kycVerifications.verificationStatus,
        submittedAt: kycVerifications.submittedAt,
        reviewedAt: kycVerifications.reviewedAt,
        riskLevel: kycVerifications.riskLevel,
        riskScore: kycVerifications.riskScore,
        createdAt: kycVerifications.createdAt,
        
        // User info
        userEmail: users.email,
        userRole: users.role,
        userAccountStatus: users.accountStatus
      })
      .from(kycVerifications)
      .leftJoin(users, eq(kycVerifications.userId, users.id))
      .orderBy(desc(kycVerifications.createdAt));

    res.json({
      success: true,
      verifications
    });
  } catch (error) {
    console.error('Error fetching KYC verifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch KYC verifications'
    });
  }
});

// GET /api/kyc/admin/stats
// Get KYC statistics for admin dashboard
router.get('/admin/stats', requireAdmin, async (req, res) => {
  try {
    // Get total counts by status
    const statsResult = await db.execute(sql`
      SELECT
        COUNT(*) as total_submissions,
        COUNT(CASE WHEN verification_status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN verification_status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN verification_status = 'rejected' THEN 1 END) as rejected_count,
        COUNT(CASE WHEN verification_status = 'under_review' THEN 1 END) as under_review_count,
        AVG(risk_score) as avg_risk_score
      FROM kyc_verifications
    `);

    const stats = statsResult.rows[0] || {
      total_submissions: 0,
      pending_count: 0,
      approved_count: 0,
      rejected_count: 0,
      under_review_count: 0,
      avg_risk_score: 0
    };

    // Get recent submissions (last 7 days)
    const recentResult = await db.execute(sql`
      SELECT COUNT(*) as recent_submissions
      FROM kyc_verifications
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `);

    const recentStats = recentResult.rows[0] || { recent_submissions: 0 };

    res.json({
      success: true,
      stats: {
        totalSubmissions: Number(stats.total_submissions),
        pending: Number(stats.pending_count),
        approved: Number(stats.approved_count),
        rejected: Number(stats.rejected_count),
        underReview: Number(stats.under_review_count),
        avgRiskScore: Number(stats.avg_risk_score) || 0,
        recentSubmissions: Number(recentStats.recent_submissions)
      }
    });
  } catch (error) {
    console.error('Error fetching KYC stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch KYC statistics'
    });
  }
});

// PUT /api/kyc/verifications/:id/status
// Update KYC verification status (admin only)
router.put('/verifications/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    const updateData = {
      verificationStatus: status,
      reviewedAt: new Date(),
      reviewedBy: req.user.id
    };

    if (status === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    await db
      .update(kycVerifications)
      .set(updateData)
      .where(eq(kycVerifications.id, id));

    res.json({
      success: true,
      message: 'KYC verification status updated'
    });
  } catch (error) {
    console.error('Error updating KYC verification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update KYC verification'
    });
  }
});

module.exports = router;
