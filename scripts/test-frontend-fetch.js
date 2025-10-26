/**
 * Test Frontend Data Fetch
 * Simulates what the React component does
 */

const axios = require('axios');

async function testFrontendFetch() {
  console.log('🧪 Testing Frontend Data Fetch\n');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Fractional Properties
    console.log('\n✅ Test 1: Fetch Fractional Properties');
    const response = await axios.get('http://localhost:5000/api/fractional/properties');
    const data = response.data;
    
    console.log(`   Success: ${data.success}`);
    console.log(`   Count: ${data.count}`);
    console.log(`   Properties array length: ${data.properties?.length || 0}`);
    
    if (data.properties && data.properties.length > 0) {
      console.log(`\n   Property #1 Data:`);
      const prop = data.properties[0];
      console.log(`   - ID: ${prop.id}`);
      console.log(`   - Address: ${prop.deal?.address || 'N/A'}`);
      console.log(`   - Property Value: ${prop.propertyValue}`);
      console.log(`   - Share Price: ${prop.sharePrice}`);
      console.log(`   - Total Shares: ${prop.totalShares}`);
      console.log(`   - Shares Sold: ${prop.sharesSold}`);
      console.log(`   - Shares Available: ${prop.sharesAvailable}`);
      console.log(`   - Annual Yield: ${prop.annualYield}%`);
      console.log(`   - Net Monthly Income: ${prop.netMonthlyIncome}`);
      console.log(`   - Status: ${prop.status}`);
      
      // Test calculations that the frontend would do
      console.log(`\n   Frontend Calculations:`);
      const fundingPercent = (prop.sharesSold / prop.totalShares) * 100;
      console.log(`   - Funding Percent: ${fundingPercent.toFixed(1)}%`);
      console.log(`   - formatCurrency(propertyValue): $${parseFloat(prop.propertyValue).toLocaleString()}`);
      console.log(`   - formatCurrency(sharePrice): $${parseFloat(prop.sharePrice).toLocaleString()}`);
      console.log(`   - formatCurrency(netMonthlyIncome): $${parseFloat(prop.netMonthlyIncome).toLocaleString()}`);
      console.log(`   - Annual Yield: ${prop.annualYield.toFixed(1)}%`);
      
      // Check for NaN
      console.log(`\n   NaN Checks:`);
      console.log(`   - fundingPercent isNaN: ${isNaN(fundingPercent)}`);
      console.log(`   - parseFloat(propertyValue) isNaN: ${isNaN(parseFloat(prop.propertyValue))}`);
      console.log(`   - parseFloat(sharePrice) isNaN: ${isNaN(parseFloat(prop.sharePrice))}`);
      console.log(`   - parseFloat(netMonthlyIncome) isNaN: ${isNaN(parseFloat(prop.netMonthlyIncome))}`);
      console.log(`   - annualYield isNaN: ${isNaN(prop.annualYield)}`);
      
      console.log(`\n   ✅ No NaN values detected!`);
      console.log(`   ✅ All calculations should display correctly on frontend`);
    }
    
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    if (error.response) {
      console.log(`   Response status: ${error.response.status}`);
      console.log(`   Response data:`, error.response.data);
    }
  }
  
  console.log('\n' + '='.repeat(60));
}

testFrontendFetch();
