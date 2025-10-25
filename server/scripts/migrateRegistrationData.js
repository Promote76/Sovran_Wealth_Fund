/**
 * ETL Migration Script - Legacy Registration Data to Unified System
 * 
 * This script migrates data from legacy registration tables to the unified registration system:
 * - userOnboarding → registrationJourney + unifiedPersonalProfiles + unifiedFinancialProfiles
 * - investorProfiles → unifiedPersonalProfiles
 * - investorFinancialProfiles → unifiedFinancialProfiles
 * - investorRiskAssessments → unifiedRiskProfiles
 * 
 * Usage: node server/scripts/migrateRegistrationData.js
 */

const { drizzle } = require('drizzle-orm/neon-serverless');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
const {
  users,
  userOnboarding,
  investorProfiles,
  investorFinancialProfiles,
  investorRiskAssessments,
  registrationJourney,
  unifiedPersonalProfiles,
  unifiedFinancialProfiles,
  unifiedRiskProfiles,
  programEnrollments
} = require('../../shared/schema');
const { eq } = require('drizzle-orm');
require('dotenv').config();

// Initialize database connection
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function migrateUserOnboarding() {
  console.log('\n📦 Migrating userOnboarding data...');
  
  try {
    const onboardingData = await db.select().from(userOnboarding);
    console.log(`Found ${onboardingData.length} userOnboarding records`);

    for (const record of onboardingData) {
      // Check if journey already exists
      const existing = await db
        .select()
        .from(registrationJourney)
        .where(eq(registrationJourney.userId, record.userId));

      if (existing.length > 0) {
        console.log(`  Skipping user ${record.userId} - journey already exists`);
        continue;
      }

      // Create registration journey
      await db.insert(registrationJourney).values({
        userId: record.userId,
        currentStep: record.isCompleted ? 'program_selection' : 'personal_profile',
        completedSteps: record.completedSteps || [],
        hasPersonalProfile: record.isCompleted || false,
        hasFinancialProfile: false,
        hasRiskProfile: false,
        isCompleted: record.isCompleted || false,
        completedAt: record.completedAt,
        startedAt: record.createdAt,
        lastActivityAt: record.updatedAt
      });

      console.log(`  ✅ Migrated user ${record.userId}`);
    }

    console.log('✅ userOnboarding migration complete\n');
  } catch (error) {
    console.error('❌ Error migrating userOnboarding:', error);
  }
}

async function migrateInvestorProfiles() {
  console.log('\n📦 Migrating investorProfiles data...');
  
  try {
    const profiles = await db.select().from(investorProfiles);
    console.log(`Found ${profiles.length} investorProfiles records`);

    for (const profile of profiles) {
      // Check if profile already exists
      const existing = await db
        .select()
        .from(unifiedPersonalProfiles)
        .where(eq(unifiedPersonalProfiles.userId, profile.userId));

      if (existing.length > 0) {
        console.log(`  Skipping user ${profile.userId} - profile already exists`);
        continue;
      }

      // Create unified personal profile
      await db.insert(unifiedPersonalProfiles).values({
        userId: profile.userId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: profile.phoneNumber,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        zipCode: profile.zipCode,
        country: profile.country || 'United States',
        dateOfBirth: profile.dateOfBirth,
        employmentStatus: 'employed', // Default value
        isComplete: true
      });

      // Update journey to mark personal profile complete
      await db
        .update(registrationJourney)
        .set({ hasPersonalProfile: true })
        .where(eq(registrationJourney.userId, profile.userId));

      console.log(`  ✅ Migrated investor profile for user ${profile.userId}`);
    }

    console.log('✅ investorProfiles migration complete\n');
  } catch (error) {
    console.error('❌ Error migrating investorProfiles:', error);
  }
}

async function migrateInvestorFinancialProfiles() {
  console.log('\n📦 Migrating investorFinancialProfiles data...');
  
  try {
    const profiles = await db.select().from(investorFinancialProfiles);
    console.log(`Found ${profiles.length} investorFinancialProfiles records`);

    for (const profile of profiles) {
      // Check if profile already exists
      const existing = await db
        .select()
        .from(unifiedFinancialProfiles)
        .where(eq(unifiedFinancialProfiles.userId, profile.userId));

      if (existing.length > 0) {
        console.log(`  Skipping user ${profile.userId} - financial profile already exists`);
        continue;
      }

      // Create unified financial profile
      await db.insert(unifiedFinancialProfiles).values({
        userId: profile.userId,
        annualIncome: profile.annualIncome,
        employmentStatus: profile.employmentStatus,
        employer: profile.employer,
        monthlyIncome: profile.annualIncome ? String(Number(profile.annualIncome) / 12) : '0',
        liquidAssets: profile.liquidAssets || '0',
        retirementAssets: profile.retirementAssets || '0',
        totalAssets: profile.totalAssets || '0',
        totalDebt: profile.totalDebt || '0',
        monthlyExpenses: profile.monthlyExpenses || '0',
        netWorth: profile.netWorth,
        creditScoreRange: profile.creditScore ? `${profile.creditScore}-${Number(profile.creditScore) + 49}` : '600-649',
        isAccredited: profile.accreditedInvestor || false,
        isComplete: true
      });

      // Update journey to mark financial profile complete
      await db
        .update(registrationJourney)
        .set({ hasFinancialProfile: true })
        .where(eq(registrationJourney.userId, profile.userId));

      console.log(`  ✅ Migrated financial profile for user ${profile.userId}`);
    }

    console.log('✅ investorFinancialProfiles migration complete\n');
  } catch (error) {
    console.error('❌ Error migrating investorFinancialProfiles:', error);
  }
}

async function migrateInvestorRiskAssessments() {
  console.log('\n📦 Migrating investorRiskAssessments data...');
  
  try {
    const assessments = await db.select().from(investorRiskAssessments);
    console.log(`Found ${assessments.length} investorRiskAssessments records`);

    for (const assessment of assessments) {
      // Check if profile already exists
      const existing = await db
        .select()
        .from(unifiedRiskProfiles)
        .where(eq(unifiedRiskProfiles.userId, assessment.userId));

      if (existing.length > 0) {
        console.log(`  Skipping user ${assessment.userId} - risk profile already exists`);
        continue;
      }

      // Create unified risk profile
      await db.insert(unifiedRiskProfiles).values({
        userId: assessment.userId,
        investmentGoals: assessment.investmentGoals || [],
        timeHorizon: assessment.timeHorizon,
        riskTolerance: assessment.riskTolerance,
        liquidityNeeds: assessment.liquidityNeeds || 5,
        isComplete: true
      });

      // Update journey to mark risk profile complete
      await db
        .update(registrationJourney)
        .set({ hasRiskProfile: true })
        .where(eq(registrationJourney.userId, assessment.userId));

      console.log(`  ✅ Migrated risk assessment for user ${assessment.userId}`);
    }

    console.log('✅ investorRiskAssessments migration complete\n');
  } catch (error) {
    console.error('❌ Error migrating investorRiskAssessments:', error);
  }
}

async function createProgramEnrollments() {
  console.log('\n📦 Creating program enrollments for migrated users...');
  
  try {
    // Get all investor profiles (these are Real Estate Investor enrollees)
    const investorProfiles = await db.select().from(investorProfiles);
    
    for (const profile of investorProfiles) {
      // Check if enrollment already exists
      const existing = await db
        .select()
        .from(programEnrollments)
        .where(eq(programEnrollments.userId, profile.userId));

      if (existing.length > 0) {
        console.log(`  Skipping user ${profile.userId} - enrollment already exists`);
        continue;
      }

      // Create program enrollment
      await db.insert(programEnrollments).values({
        userId: profile.userId,
        programType: 'real_estate_investor',
        status: 'active',
        enrolledAt: profile.createdAt || new Date()
      });

      console.log(`  ✅ Created enrollment for user ${profile.userId}`);
    }

    console.log('✅ Program enrollments created\n');
  } catch (error) {
    console.error('❌ Error creating program enrollments:', error);
  }
}

async function main() {
  console.log('🚀 Starting ETL Migration Process');
  console.log('================================\n');

  try {
    await migrateUserOnboarding();
    await migrateInvestorProfiles();
    await migrateInvestorFinancialProfiles();
    await migrateInvestorRiskAssessments();
    await createProgramEnrollments();

    console.log('\n================================');
    console.log('✅ Migration completed successfully!');
    console.log('================================\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
main();
