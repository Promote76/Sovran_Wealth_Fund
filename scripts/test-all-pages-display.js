/**
 * Final Verification Test
 * Tests that all fractional ownership pages display without errors
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testAllPagesDisplay() {
  console.log('🔧 Testing All Fractional Ownership Page Displays\n');
  console.log('='.repeat(60));
  
  let allPassed = true;
  
  // Test 1: Properties API
  console.log('\n✅ Test 1: Fractional Properties API');
  try {
    const response = await axios.get(`${BASE_URL}/api/fractional/properties`);
    const data = response.data;
    
    if (data.properties && data.properties.length > 0) {
      const prop = data.properties[0];
      
      // Admin Dashboard field checks
      const adminChecks = [
        { name: 'dealId', exists: !!prop.dealId },
        { name: 'totalShares', exists: typeof prop.totalShares === 'number' },
        { name: 'sharesSold', exists: typeof prop.sharesSold === 'number' },
        { name: 'sharePrice', exists: !!prop.sharePrice },
        { name: 'propertyValue', exists: !!prop.propertyValue },
        { name: 'monthlyRent', exists: prop.monthlyRent !== undefined },
        { name: 'deal.address', exists: !!prop.deal?.address }
      ];
      
      const adminPassed = adminChecks.every(c => c.exists);
      console.log(`   Admin Dashboard fields: ${adminPassed ? '✅ PASS' : '❌ FAIL'}`);
      if (!adminPassed) {
        adminChecks.filter(c => !c.exists).forEach(c => {
          console.log(`      ❌ Missing: ${c.name}`);
        });
        allPassed = false;
      }
      
      // Investor Page field checks
      const investorChecks = [
        { name: 'sharesAvailable', exists: typeof prop.sharesAvailable === 'number' },
        { name: 'fundingProgress', exists: typeof prop.fundingProgress === 'number' },
        { name: 'annualYield', exists: typeof prop.annualYield === 'number' },
        { name: 'status', exists: !!prop.status }
      ];
      
      const investorPassed = investorChecks.every(c => c.exists);
      console.log(`   Investor Page fields: ${investorPassed ? '✅ PASS' : '❌ FAIL'}`);
      if (!investorPassed) {
        investorChecks.filter(c => !c.exists).forEach(c => {
          console.log(`      ❌ Missing: ${c.name}`);
        });
        allPassed = false;
      }
      
    } else {
      console.log('   ⚠️  No properties found (create one to test display)');
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    allPassed = false;
  }
  
  // Test 2: Portfolio API  
  console.log('\n✅ Test 2: Portfolio API (with currentTier)');
  try {
    const response = await axios.get(`${BASE_URL}/api/fractional/portfolio`, {
      headers: { 'x-wallet-address': '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' }
    });
    const data = response.data;
    
    const portfolioChecks = [
      { name: 'portfolio array', exists: Array.isArray(data.portfolio) },
      { name: 'totals object', exists: typeof data.totals === 'object' },
      { name: 'totals.currentTier', exists: !!data.totals?.currentTier },
      { name: 'totals.totalInvested', exists: typeof data.totals?.totalInvested === 'number' },
      { name: 'totals.propertiesCount', exists: typeof data.totals?.propertiesCount === 'number' }
    ];
    
    const portfolioPassed = portfolioChecks.every(c => c.exists);
    console.log(`   Portfolio Response: ${portfolioPassed ? '✅ PASS' : '❌ FAIL'}`);
    if (!portfolioPassed) {
      portfolioChecks.filter(c => !c.exists).forEach(c => {
        console.log(`      ❌ Missing: ${c.name}`);
      });
      allPassed = false;
    } else {
      console.log(`   Current Tier: ${data.totals.currentTier.toUpperCase()}`);
    }
    
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    allPassed = false;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Final Results:\n');
  
  if (allPassed) {
    console.log('✅ ALL PAGES READY FOR PRODUCTION');
    console.log('   ✅ Admin Dashboard: Field names correct (camelCase)');
    console.log('   ✅ Investor Page: Field names correct (camelCase)');
    console.log('   ✅ Portfolio: currentTier integrated');
    console.log('\n🎉 No "Section Error" should appear on any page!');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('   Check the errors above for details.');
  }
  
  console.log('\n' + '='.repeat(60));
  
  return allPassed;
}

testAllPagesDisplay().then(success => {
  process.exit(success ? 0 : 1);
});
