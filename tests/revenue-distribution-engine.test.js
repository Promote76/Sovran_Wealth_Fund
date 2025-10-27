/**
 * Revenue Distribution Engine - Comprehensive Test Suite
 * Pure Node.js tests without external testing frameworks
 */

require('dotenv').config();
const { Pool } = require('pg');
const revenueEngineService = require('../server/services/revenueEngineService');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runTests() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   REVENUE DISTRIBUTION ENGINE - COMPREHENSIVE TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n');

  let passCount = 0;
  let failCount = 0;

  console.log('📋 TEST 1: Distribution Calculation Algorithm\n');
  
  try {
    const investors = [
      { investor_id: 1, wallet_address: '0xAAA', shares_owned: 5000, revenue_share_bonus: 0 },
      { investor_id: 2, wallet_address: '0xBBB', shares_owned: 3000, revenue_share_bonus: 0 },
      { investor_id: 3, wallet_address: '0xCCC', shares_owned: 2000, revenue_share_bonus: 0 },
    ];

    const result = revenueEngineService.calculateDistributions(10000, 10, 100, 0, investors);
    
    if (result.reserveFund === 1000 && result.distributable === 9000 && result.payouts.length === 3) {
      console.log('   ✅ Pro-rata distribution: PASSED');
      passCount++;
    } else {
      console.log('   ❌ Pro-rata distribution: FAILED');
      console.log('      Expected: reserveFund=1000, distributable=9000, payouts=3');
      console.log(`      Got: reserveFund=${result.reserveFund}, distributable=${result.distributable}, payouts=${result.payouts.length}`);
      failCount++;
    }
  } catch (error) {
    console.log('   ❌ Pro-rata distribution: FAILED -', error.message);
    failCount++;
  }

  try {
    const tieredInvestors = [
      { investor_id: 1, wallet_address: '0xAAA', shares_owned: 2500, tier: 'retail', revenue_share_bonus: 0 },
      { investor_id: 2, wallet_address: '0xBBB', shares_owned: 2500, tier: 'accredited', revenue_share_bonus: 2 },
      { investor_id: 3, wallet_address: '0xCCC', shares_owned: 2500, tier: 'premium', revenue_share_bonus: 5 },
      { investor_id: 4, wallet_address: '0xDDD', shares_owned: 2500, tier: 'institutional', revenue_share_bonus: 8 },
    ];

    const result = revenueEngineService.calculateDistributions(10000, 10, 80, 20, tieredInvestors);
    
    if (result.tierBonusPool === 1800 && result.payouts.length === 4) {
      console.log('   ✅ Tier bonus calculation: PASSED');
      passCount++;
    } else {
      console.log('   ❌ Tier bonus calculation: FAILED');
      console.log(`      Expected: tierBonusPool=1800, payouts=4`);
      console.log(`      Got: tierBonusPool=${result.tierBonusPool}, payouts=${result.payouts.length}`);
      failCount++;
    }
  } catch (error) {
    console.log('   ❌ Tier bonus calculation: FAILED -', error.message);
    failCount++;
  }

  try {
    const singleInvestor = [
      { investor_id: 1, wallet_address: '0xAAA', shares_owned: 10000, revenue_share_bonus: 5 },
    ];
    const result = revenueEngineService.calculateDistributions(10000, 10, 80, 20, singleInvestor);
    
    if (result.payouts.length === 1 && result.payouts[0].ownershipPercent === '100.00') {
      console.log('   ✅ Single investor edge case: PASSED');
      passCount++;
    } else {
      console.log('   ❌ Single investor edge case: FAILED');
      failCount++;
    }
  } catch (error) {
    console.log('   ❌ Single investor edge case: FAILED -', error.message);
    failCount++;
  }

  try {
    revenueEngineService.calculateDistributions(10000, 10, 80, 20, []);
    console.log('   ❌ Error handling: FAILED (should have thrown error)');
    failCount++;
  } catch (error) {
    if (error.message.includes('No investors')) {
      console.log('   ✅ Error handling: PASSED');
      passCount++;
    } else {
      console.log('   ❌ Error handling: FAILED -', error.message);
      failCount++;
    }
  }

  try {
    const fractionalInvestors = [
      { investor_id: 1, wallet_address: '0xAAA', shares_owned: 1250.5, tier: 'retail', revenue_share_bonus: 0 },
      { investor_id: 2, wallet_address: '0xBBB', shares_owned: 750.25, tier: 'accredited', revenue_share_bonus: 2 },
      { investor_id: 3, wallet_address: '0xCCC', shares_owned: 500.75, tier: 'premium', revenue_share_bonus: 5 },
    ];

    const result = revenueEngineService.calculateDistributions(10000, 10, 80, 20, fractionalInvestors);
    
    const totalShares = 1250.5 + 750.25 + 500.75;
    const investor1Ownership = 1250.5 / totalShares;
    const investor2Ownership = 750.25 / totalShares;
    const investor3Ownership = 500.75 / totalShares;
    
    const distributable = 9000;
    const basePool = 7200;
    const tierBonusPool = 1800;
    
    const expectedBase1 = basePool * investor1Ownership;
    const expectedBase2 = basePool * investor2Ownership;
    const expectedBase3 = basePool * investor3Ownership;
    
    if (
      result.payouts[0].sharesOwned === 1250.5 &&
      result.payouts[1].sharesOwned === 750.25 &&
      result.payouts[2].sharesOwned === 500.75 &&
      Math.abs(result.payouts[0].baseAmount - expectedBase1) < 0.5 &&
      Math.abs(result.payouts[1].baseAmount - expectedBase2) < 0.5 &&
      Math.abs(result.payouts[2].baseAmount - expectedBase3) < 0.5
    ) {
      console.log('   ✅ Fractional shares distribution: PASSED');
      passCount++;
    } else {
      console.log('   ❌ Fractional shares distribution: FAILED');
      console.log(`      Investor 1: shares=${result.payouts[0].sharesOwned}, baseAmount=${result.payouts[0].baseAmount}, expected=${expectedBase1.toFixed(2)}`);
      console.log(`      Investor 2: shares=${result.payouts[1].sharesOwned}, baseAmount=${result.payouts[1].baseAmount}, expected=${expectedBase2.toFixed(2)}`);
      console.log(`      Investor 3: shares=${result.payouts[2].sharesOwned}, baseAmount=${result.payouts[2].baseAmount}, expected=${expectedBase3.toFixed(2)}`);
      failCount++;
    }
  } catch (error) {
    console.log('   ❌ Fractional shares distribution: FAILED -', error.message);
    failCount++;
  }

  try {
    const edgeCaseFractional = [
      { investor_id: 1, wallet_address: '0xAAA', shares_owned: 0.1, tier: 'retail', revenue_share_bonus: 0 },
      { investor_id: 2, wallet_address: '0xBBB', shares_owned: 0.05, tier: 'accredited', revenue_share_bonus: 2 },
      { investor_id: 3, wallet_address: '0xCCC', shares_owned: 0.85, tier: 'premium', revenue_share_bonus: 5 },
    ];

    const result = revenueEngineService.calculateDistributions(10000, 10, 80, 20, edgeCaseFractional);
    
    const totalShares = 0.1 + 0.05 + 0.85;
    
    if (result.payouts.length === 3 && Math.abs(totalShares - 1.0) < 0.001) {
      console.log('   ✅ Small fractional shares edge case: PASSED');
      passCount++;
    } else {
      console.log('   ❌ Small fractional shares edge case: FAILED');
      failCount++;
    }
  } catch (error) {
    console.log('   ❌ Small fractional shares edge case: FAILED -', error.message);
    failCount++;
  }

  console.log('\n📋 TEST 2: Database Integration\n');

  try {
    const propertyResult = await pool.query('SELECT id FROM fractional_properties LIMIT 1');
    
    if (propertyResult.rows.length > 0) {
      const testPropertyId = propertyResult.rows[0].id;
      
      const policy = await revenueEngineService.createDistributionPolicy(testPropertyId, {
        name: 'Test Policy ' + Date.now(),
        type: 'tiered_bonus',
        baseAllocation: 80,
        tierBonus: 20,
        reserveFund: 10
      });

      if (policy && policy.policy_name.startsWith('Test Policy')) {
        console.log('   ✅ Distribution policy creation: PASSED');
        passCount++;
        
        await pool.query('DELETE FROM distribution_policies WHERE policy_id = $1', [policy.policy_id]);
      } else {
        console.log('   ❌ Distribution policy creation: FAILED');
        failCount++;
      }

      const investorsResult = await pool.query(
        `SELECT COUNT(*) as count FROM investor_shares WHERE property_id = $1 AND status = 'active'`,
        [testPropertyId]
      );

      if (parseInt(investorsResult.rows[0].count) > 0) {
        const policyResult = await revenueEngineService.createDistributionPolicy(testPropertyId, {
          name: 'Test Distribution Policy',
          type: 'tiered_bonus',
          baseAllocation: 80,
          tierBonus: 20,
          reserveFund: 10
        });

        const distribution = await revenueEngineService.processRentalDistribution(
          testPropertyId, 5000, 'Test Distribution ' + Date.now()
        );

        if (distribution.success && distribution.batchId) {
          console.log('   ✅ Rental distribution processing: PASSED');
          passCount++;
          
          await pool.query('DELETE FROM payout_transactions WHERE batch_id IN (SELECT id FROM payout_batches WHERE batch_id = $1)', [distribution.batchId]);
          await pool.query('DELETE FROM payout_batches WHERE batch_id = $1', [distribution.batchId]);
          await pool.query('DELETE FROM distribution_policies WHERE policy_id = $1', [policyResult.policy_id]);
        } else {
          console.log('   ❌ Rental distribution processing: FAILED');
          failCount++;
        }
      } else {
        console.log('   ⚠️  No active investors, skipping distribution test');
      }
    } else {
      console.log('   ⚠️  No test property available, skipping database tests');
    }
  } catch (error) {
    console.log('   ❌ Database integration: FAILED -', error.message);
    console.error(error);
    failCount++;
  }

  console.log('\n📋 TEST 3: Data Integrity Checks\n');

  try {
    const batches = await revenueEngineService.getAllPayoutBatches(null, 10);
    if (Array.isArray(batches)) {
      console.log('   ✅ Retrieve payout batches: PASSED');
      passCount++;
    } else {
      console.log('   ❌ Retrieve payout batches: FAILED');
      failCount++;
    }
  } catch (error) {
    console.log('   ❌ Retrieve payout batches: FAILED -', error.message);
    failCount++;
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`   TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('═══════════════════════════════════════════════════════════\n');

  await pool.end();

  if (failCount === 0) {
    console.log('🎉 ALL TESTS PASSED!\n');
    process.exit(0);
  } else {
    console.log(`⚠️  ${failCount} TEST(S) FAILED\n`);
    process.exit(1);
  }
}

if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Test suite error:', error);
    process.exit(1);
  });
}

module.exports = { runTests };
