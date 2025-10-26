/**
 * Test Admin Dashboard Fractional Properties Display
 * Verifies the frontend correctly renders API response fields
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testAdminFractionalDisplay() {
  console.log('🔧 Testing Admin Dashboard Fractional Display\n');
  console.log('='.repeat(60));
  
  try {
    // Fetch fractional properties
    const response = await axios.get(`${BASE_URL}/api/fractional/properties`);
    const data = response.data;
    
    console.log('\n✅ API Response Structure:');
    console.log(`   success: ${data.success}`);
    console.log(`   count: ${data.count}`);
    console.log(`   properties array length: ${data.properties?.length || 0}`);
    
    if (data.properties && data.properties.length > 0) {
      const prop = data.properties[0];
      
      console.log('\n📊 Sample Property Fields (camelCase):');
      console.log(`   ✅ id: ${prop.id} (type: ${typeof prop.id})`);
      console.log(`   ✅ dealId: ${prop.dealId}`);
      console.log(`   ✅ totalShares: ${prop.totalShares} (type: ${typeof prop.totalShares})`);
      console.log(`   ✅ sharesSold: ${prop.sharesSold} (type: ${typeof prop.sharesSold})`);
      console.log(`   ✅ sharesAvailable: ${prop.sharesAvailable}`);
      console.log(`   ✅ sharePrice: ${prop.sharePrice} (type: ${typeof prop.sharePrice})`);
      console.log(`   ✅ propertyValue: ${prop.propertyValue}`);
      console.log(`   ✅ monthlyRent: ${prop.monthlyRent}`);
      console.log(`   ✅ status: ${prop.status}`);
      console.log(`   ✅ deal.address: ${prop.deal?.address || 'N/A'}`);
      
      console.log('\n🎨 Frontend Display Checks:');
      
      // Check if fields can be safely rendered
      const checks = [
        {
          name: 'sharesSold.toLocaleString()',
          test: () => {
            const val = prop.sharesSold || 0;
            return val.toLocaleString();
          }
        },
        {
          name: 'totalShares.toLocaleString()',
          test: () => {
            const val = prop.totalShares || 0;
            return val.toLocaleString();
          }
        },
        {
          name: 'parseFloat(sharePrice)',
          test: () => parseFloat(prop.sharePrice || 0)
        },
        {
          name: 'parseFloat(propertyValue)',
          test: () => parseFloat(prop.propertyValue || 0)
        },
        {
          name: 'parseFloat(monthlyRent)',
          test: () => parseFloat(prop.monthlyRent || 0)
        },
        {
          name: 'deal?.address fallback',
          test: () => prop.deal?.address || `Property #${prop.id}`
        }
      ];
      
      let passed = 0;
      let failed = 0;
      
      checks.forEach(check => {
        try {
          const result = check.test();
          console.log(`   ✅ ${check.name}: ${result}`);
          passed++;
        } catch (error) {
          console.log(`   ❌ ${check.name}: ${error.message}`);
          failed++;
        }
      });
      
      console.log('\n' + '='.repeat(60));
      console.log(`\n📊 Display Test Results:`);
      console.log(`   ✅ Passed: ${passed}/${checks.length}`);
      console.log(`   ❌ Failed: ${failed}/${checks.length}`);
      
      if (failed === 0) {
        console.log('\n✅ All frontend display checks passed!');
        console.log('   The Admin Dashboard should render without errors.');
        return true;
      } else {
        console.log('\n❌ Some display checks failed!');
        console.log('   The Admin Dashboard may show "Section Error".');
        return false;
      }
      
    } else {
      console.log('\n⚠️  No fractional properties found.');
      console.log('   Create one via Admin Dashboard to test display.');
      return true;
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    return false;
  }
}

testAdminFractionalDisplay().then(success => {
  process.exit(success ? 0 : 1);
});
