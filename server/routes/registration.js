const express = require('express');
const { db } = require('../db');
const { 
  unifiedPersonalProfiles,
  unifiedFinancialProfiles,
  unifiedRiskProfiles,
  programEnrollments,
  registrationJourney
} = require('../../shared/schema');
const { eq } = require('drizzle-orm');
const { secureAuthMiddleware } = require('../middleware/secureAuth');

const router = express.Router();

router.get('/journey', secureAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const [journey] = await db
      .select()
      .from(registrationJourney)
      .where(eq(registrationJourney.userId, userId))
      .limit(1);

    if (!journey) {
      const [newJourney] = await db
        .insert(registrationJourney)
        .values({
          userId,
          currentStep: 'account_creation',
          completedSteps: JSON.stringify([])
        })
        .returning();

      return res.status(200).json({
        success: true,
        journey: {
          ...newJourney,
          completedSteps: JSON.parse(newJourney.completedSteps || '[]')
        }
      });
    }

    return res.status(200).json({
      success: true,
      journey: {
        ...journey,
        completedSteps: JSON.parse(journey.completedSteps || '[]'),
        stepTransitions: JSON.parse(journey.stepTransitions || '[]')
      }
    });
  } catch (error) {
    console.error('❌ Get journey error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load registration journey'
    });
  }
});

router.post('/personal-profile', secureAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const profileData = req.body;

    const [existingProfile] = await db
      .select()
      .from(unifiedPersonalProfiles)
      .where(eq(unifiedPersonalProfiles.userId, userId))
      .limit(1);

    if (existingProfile) {
      await db
        .update(unifiedPersonalProfiles)
        .set({
          ...profileData,
          isComplete: true,
          completedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(unifiedPersonalProfiles.userId, userId));
    } else {
      await db
        .insert(unifiedPersonalProfiles)
        .values({
          userId,
          ...profileData,
          isComplete: true,
          completedAt: new Date()
        });
    }

    const [currentJourney] = await db
      .select()
      .from(registrationJourney)
      .where(eq(registrationJourney.userId, userId))
      .limit(1);

    const completedSteps = JSON.parse(currentJourney.completedSteps || '[]');
    if (!completedSteps.includes('personal_profile')) {
      completedSteps.push('personal_profile');
    }

    await db
      .update(registrationJourney)
      .set({
        hasPersonalProfile: true,
        completedSteps: JSON.stringify(completedSteps),
        currentStep: 'financial_profile',
        lastActivityAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(registrationJourney.userId, userId));

    const [updatedJourney] = await db
      .select()
      .from(registrationJourney)
      .where(eq(registrationJourney.userId, userId))
      .limit(1);

    return res.status(200).json({
      success: true,
      journey: {
        ...updatedJourney,
        completedSteps: JSON.parse(updatedJourney.completedSteps || '[]')
      }
    });
  } catch (error) {
    console.error('❌ Update personal profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update personal profile'
    });
  }
});

router.post('/financial-profile', secureAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const profileData = req.body;

    const [existingProfile] = await db
      .select()
      .from(unifiedFinancialProfiles)
      .where(eq(unifiedFinancialProfiles.userId, userId))
      .limit(1);

    if (existingProfile) {
      await db
        .update(unifiedFinancialProfiles)
        .set({
          ...profileData,
          isComplete: true,
          completedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(unifiedFinancialProfiles.userId, userId));
    } else {
      await db
        .insert(unifiedFinancialProfiles)
        .values({
          userId,
          ...profileData,
          isComplete: true,
          completedAt: new Date()
        });
    }

    const [currentJourney] = await db
      .select()
      .from(registrationJourney)
      .where(eq(registrationJourney.userId, userId))
      .limit(1);

    const completedSteps = JSON.parse(currentJourney.completedSteps || '[]');
    if (!completedSteps.includes('financial_profile')) {
      completedSteps.push('financial_profile');
    }

    await db
      .update(registrationJourney)
      .set({
        hasFinancialProfile: true,
        completedSteps: JSON.stringify(completedSteps),
        currentStep: 'risk_profile',
        lastActivityAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(registrationJourney.userId, userId));

    const [updatedJourney] = await db
      .select()
      .from(registrationJourney)
      .where(eq(registrationJourney.userId, userId))
      .limit(1);

    return res.status(200).json({
      success: true,
      journey: {
        ...updatedJourney,
        completedSteps: JSON.parse(updatedJourney.completedSteps || '[]')
      }
    });
  } catch (error) {
    console.error('❌ Update financial profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update financial profile'
    });
  }
});

router.post('/risk-profile', secureAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const profileData = req.body;

    const [existingProfile] = await db
      .select()
      .from(unifiedRiskProfiles)
      .where(eq(unifiedRiskProfiles.userId, userId))
      .limit(1);

    if (existingProfile) {
      await db
        .update(unifiedRiskProfiles)
        .set({
          ...profileData,
          isComplete: true,
          completedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(unifiedRiskProfiles.userId, userId));
    } else {
      await db
        .insert(unifiedRiskProfiles)
        .values({
          userId,
          ...profileData,
          isComplete: true,
          completedAt: new Date()
        });
    }

    const [currentJourney] = await db
      .select()
      .from(registrationJourney)
      .where(eq(registrationJourney.userId, userId))
      .limit(1);

    const completedSteps = JSON.parse(currentJourney.completedSteps || '[]');
    if (!completedSteps.includes('risk_profile')) {
      completedSteps.push('risk_profile');
    }

    await db
      .update(registrationJourney)
      .set({
        hasRiskProfile: true,
        completedSteps: JSON.stringify(completedSteps),
        currentStep: 'program_selection',
        lastActivityAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(registrationJourney.userId, userId));

    const [updatedJourney] = await db
      .select()
      .from(registrationJourney)
      .where(eq(registrationJourney.userId, userId))
      .limit(1);

    return res.status(200).json({
      success: true,
      journey: {
        ...updatedJourney,
        completedSteps: JSON.parse(updatedJourney.completedSteps || '[]')
      }
    });
  } catch (error) {
    console.error('❌ Update risk profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update risk profile'
    });
  }
});

router.post('/enroll', secureAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { programType } = req.body;

    const [existingEnrollment] = await db
      .select()
      .from(programEnrollments)
      .where(eq(programEnrollments.userId, userId))
      .where(eq(programEnrollments.programType, programType))
      .limit(1);

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        error: 'Already enrolled in this program'
      });
    }

    await db
      .insert(programEnrollments)
      .values({
        userId,
        programType,
        status: 'enrolled',
        enrolledAt: new Date()
      });

    const [updatedJourney] = await db
      .select()
      .from(registrationJourney)
      .where(eq(registrationJourney.userId, userId))
      .limit(1);

    return res.status(200).json({
      success: true,
      message: 'Successfully enrolled in program',
      journey: updatedJourney
    });
  } catch (error) {
    console.error('❌ Program enrollment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to enroll in program'
    });
  }
});

router.get('/enrollments', secureAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const enrollments = await db
      .select()
      .from(programEnrollments)
      .where(eq(programEnrollments.userId, userId));

    return res.status(200).json({
      success: true,
      enrollments
    });
  } catch (error) {
    console.error('❌ Get enrollments error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load enrollments'
    });
  }
});

module.exports = router;
