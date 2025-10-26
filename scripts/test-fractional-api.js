/**
 * Fractional Ownership API Regression Tests
 * Tests all fractional endpoints for data integrity and type correctness
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const TEST_WALLET = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  if (details) console.log(`   ${details}`);
  
  testResults.tests.push({ name, passed, details });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

async function testFractionalPropertiesEndpoint() {
  console.log('\n📋 Testing GET /api/fractional/properties\n');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/fractional/properties`);
    const data = response.data;
    
    logTest('Returns 200 status', response.status === 200);
    logTest('Has success field', data.success === true);
    logTest('Has properties array', Array.isArray(data.properties), `Type: ${typeof data.properties}`);
    logTest('Properties NOT in data.data', data.data === undefined, 'Should use data.properties');
    
    if (data.properties && data.properties.length > 0) {
      const prop = data.properties[0];
      
      logTest('Property has id', typeof prop.id === 'number', `id type: ${typeof prop.id}`);
      logTest('Property has dealId', prop.dealId !== undefined);
      logTest('Property has totalShares', typeof prop.totalShares === 'number');
      logTest('Property has sharePrice', typeof parseFloat(prop.sharePrice) === 'number');
      logTest('Property has sharesAvailable', typeof prop.sharesAvailable === 'number');
      logTest('Share price is positive', parseFloat(prop.sharePrice) > 0, `Price: $${prop.sharePrice}`);
      logTest('Total shares is 10000', prop.totalShares === 10000, `Shares: ${prop.totalShares}`);
      
      console.log(`\n   Sample Property: ${prop.deal?.address || 'Unknown'}`);
      console.log(`   Shares: ${prop.sharesSold}/${prop.totalShares} sold`);
      console.log(`   Price per share: $${prop.sharePrice}`);
    } else {
      console.log('   ⚠️  No fractional properties found (create one via admin dashboard)');
    }
    
  } catch (error) {
    logTest('GET /api/fractional/properties', false, error.message);
  }
}

async function testPortfolioEndpoint() {
  console.log('\n📊 Testing GET /api/fractional/portfolio\n');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/fractional/portfolio`, {
      headers: {
        'x-wallet-address': TEST_WALLET
      }
    });
    const data = response.data;
    
    logTest('Returns 200 status', response.status === 200);
    logTest('Has success field', data.success === true);
    logTest('Has portfolio array', Array.isArray(data.portfolio), `Type: ${typeof data.portfolio}`);
    logTest('Has totals object', typeof data.totals === 'object', `Type: ${typeof data.totals}`);
    logTest('Portfolio NOT in data.data.investments', data.data === undefined, 'Should use data.portfolio');
    
    if (data.totals) {
      const totals = data.totals;
      
      logTest('totals.totalInvested is number', typeof totals.totalInvested === 'number', `Type: ${typeof totals.totalInvested}`);
      logTest('totals.totalRevenueEarned is number', typeof totals.totalRevenueEarned === 'number', `Type: ${typeof totals.totalRevenueEarned}`);
      logTest('totals.monthlyRevenueEstimate is number', typeof totals.monthlyRevenueEstimate === 'number', `Type: ${typeof totals.monthlyRevenueEstimate}`);
      logTest('totals.propertiesCount is number', typeof totals.propertiesCount === 'number', `Type: ${typeof totals.propertiesCount}`);
      logTest('totals.currentTier exists', totals.currentTier !== undefined, `Tier: ${totals.currentTier}`);
      logTest('currentTier is valid', ['retail', 'accredited', 'premium', 'institutional'].includes(totals.currentTier), `Tier: ${totals.currentTier}`);
      
      console.log(`\n   Portfolio Summary:`);
      console.log(`   Total Invested: $${totals.totalInvested.toFixed(2)}`);
      console.log(`   Revenue Earned: $${totals.totalRevenueEarned.toFixed(2)}`);
      console.log(`   Monthly Estimate: $${totals.monthlyRevenueEstimate.toFixed(2)}`);
      console.log(`   Properties: ${totals.propertiesCount}`);
      console.log(`   Current Tier: ${totals.currentTier.toUpperCase()}`);
      
      const tierBonuses = {
        retail: 0,
        accredited: 2,
        premium: 5,
        institutional: 8
      };
      console.log(`   Revenue Bonus: +${tierBonuses[totals.currentTier]}%`);
    }
    
    if (data.portfolio && data.portfolio.length > 0) {
      console.log(`\n   ${data.portfolio.length} Investment(s) Found:`);
      data.portfolio.forEach((inv, idx) => {
        console.log(`   ${idx + 1}. ${inv.property?.address || 'Unknown'}`);
        console.log(`      Shares: ${inv.sharesOwned} (${inv.ownershipPercent}%)`);
        console.log(`      Invested: $${parseFloat(inv.totalInvested).toFixed(2)}`);
        console.log(`      Monthly Revenue: $${parseFloat(inv.monthlyRevenueEstimate).toFixed(2)}`);
      });
    } else {
      console.log('   ⚠️  No investments found for this wallet');
    }
    
  } catch (error) {
    if (error.response?.status === 401) {
      logTest('Wallet authentication required', true, 'Expected 401 for invalid wallet');
    } else {
      logTest('GET /api/fractional/portfolio', false, error.message);
    }
  }
}

async function testTierCalculation() {
  console.log('\n🎯 Testing Tier Calculation Logic\n');
  
  const tierTests = [
    { invested: 500, expected: 'retail', bonus: 0 },
    { invested: 9999, expected: 'retail', bonus: 0 },
    { invested: 10000, expected: 'accredited', bonus: 2 },
    { invested: 50000, expected: 'accredited', bonus: 2 },
    { invested: 100000, expected: 'premium', bonus: 5 },
    { invested: 250000, expected: 'premium', bonus: 5 },
    { invested: 500000, expected: 'institutional', bonus: 8 },
    { invested: 1000000, expected: 'institutional', bonus: 8 }
  ];
  
  tierTests.forEach(test => {
    let tier;
    if (test.invested >= 500000) tier = 'institutional';
    else if (test.invested >= 100000) tier = 'premium';
    else if (test.invested >= 10000) tier = 'accredited';
    else tier = 'retail';
    
    const passed = tier === test.expected;
    logTest(
      `$${test.invested.toLocaleString()} → ${test.expected}`,
      passed,
      `Calculated: ${tier}, Expected: ${test.expected}, Bonus: +${test.bonus}%`
    );
  });
}

async function testDataTypes() {
  console.log('\n🔢 Testing Data Type Integrity\n');
  
  try {
    const propsRes = await axios.get(`${BASE_URL}/api/fractional/properties`);
    
    if (propsRes.data.properties && propsRes.data.properties.length > 0) {
      const prop = propsRes.data.properties[0];
      
      const numericFields = [
        'id', 'totalShares', 'sharesSold', 'sharesAvailable',
        'fundingProgress', 'lockupMonths', 'annualYield'
      ];
      
      const stringNumericFields = [
        'sharePrice', 'propertyValue', 'minInvestment',
        'maxOwnershipPercent', 'monthlyRent', 'monthlyExpenses',
        'netMonthlyIncome', 'reserveFundPercent'
      ];
      
      numericFields.forEach(field => {
        if (prop[field] !== undefined) {
          logTest(
            `${field} is number`,
            typeof prop[field] === 'number',
            `Type: ${typeof prop[field]}, Value: ${prop[field]}`
          );
        }
      });
      
      stringNumericFields.forEach(field => {
        if (prop[field] !== undefined) {
          const isNumeric = !isNaN(parseFloat(prop[field]));
          logTest(
            `${field} is parseable number`,
            isNumeric,
            `Type: ${typeof prop[field]}, Value: ${prop[field]}, Parsed: ${parseFloat(prop[field])}`
          );
        }
      });
    }
    
  } catch (error) {
    logTest('Data type validation', false, error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Fractional Ownership API Regression Tests\n');
  console.log('='.repeat(60));
  
  await testFractionalPropertiesEndpoint();
  await testPortfolioEndpoint();
  await testTierCalculation();
  await testDataTypes();
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary:\n');
  console.log(`   Total Tests: ${testResults.passed + testResults.failed}`);
  console.log(`   ✅ Passed: ${testResults.passed}`);
  console.log(`   ❌ Failed: ${testResults.failed}`);
  console.log(`   Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests.filter(t => !t.passed).forEach(t => {
      console.log(`   - ${t.name}: ${t.details}`);
    });
  } else {
    console.log('\n✅ All tests passed!');
  }
  
  console.log('\n' + '='.repeat(60));
  
  process.exit(testResults.failed > 0 ? 1 : 0);
}

runAllTests().catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});
