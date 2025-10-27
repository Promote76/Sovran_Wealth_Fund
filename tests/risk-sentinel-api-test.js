/**
 * Feature #5: Property Risk Sentinel API Tests
 * Comprehensive test suite for risk monitoring and property valuations
 */

const BASE_URL = 'http://localhost:5000';
const TEST_PROPERTY_ID = 1;

async function testEndpoint(name, method, endpoint, body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    if (!response.ok) {
      console.log(`❌ ${name}: FAILED (${response.status})`);
      console.log(`   Error: ${data.error || JSON.stringify(data)}`);
      return false;
    }
    
    console.log(`✅ ${name}: PASSED`);
    return true;
  } catch (error) {
    console.log(`❌ ${name}: ERROR - ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Running Property Risk Sentinel API Tests...\n');
  
  let passed = 0;
  let failed = 0;

  // =====================================================
  // PROPERTY VALUATIONS TESTS
  // =====================================================
  console.log('📊 PROPERTY VALUATIONS TESTS:');
  
  if (await testEndpoint(
    'Create Property Valuation',
    'POST',
    '/api/risk-sentinel/valuations',
    {
      property_id: TEST_PROPERTY_ID,
      valuation_type: 'avm',
      estimated_value: 350000,
      value_low: 330000,
      value_high: 370000,
      confidence_score: 0.85,
      data_source: 'test-api'
    }
  )) passed++; else failed++;

  if (await testEndpoint(
    'Get Property Valuations',
    'GET',
    `/api/risk-sentinel/valuations/${TEST_PROPERTY_ID}?limit=10`
  )) passed++; else failed++;

  if (await testEndpoint(
    'Get Latest Valuation',
    'GET',
    `/api/risk-sentinel/valuations/${TEST_PROPERTY_ID}/latest`
  )) passed++; else failed++;

  if (await testEndpoint(
    'Get Valuation History',
    'GET',
    `/api/risk-sentinel/valuations/${TEST_PROPERTY_ID}/history`
  )) passed++; else failed++;

  // =====================================================
  // RISK MONITORING TESTS
  // =====================================================
  console.log('\n⚠️  RISK MONITORING TESTS:');

  if (await testEndpoint(
    'Create Risk Event',
    'POST',
    '/api/risk-sentinel/risks',
    {
      property_id: TEST_PROPERTY_ID,
      event_type: 'flood_risk',
      severity: 'medium',
      risk_score: 65,
      description: 'Potential flood risk detected in area',
      source: 'weather-api',
      impact_assessment: 'Moderate risk requiring monitoring'
    }
  )) passed++; else failed++;

  if (await testEndpoint(
    'Get Property Risks',
    'GET',
    `/api/risk-sentinel/risks/${TEST_PROPERTY_ID}?status=active`
  )) passed++; else failed++;

  if (await testEndpoint(
    'Get All Active Risks',
    'GET',
    '/api/risk-sentinel/risks?status=active&limit=20'
  )) passed++; else failed++;

  // =====================================================
  // MARKET CONDITIONS TESTS
  // =====================================================
  console.log('\n📈 MARKET CONDITIONS TESTS:');

  if (await testEndpoint(
    'Create Market Condition',
    'POST',
    '/api/risk-sentinel/market',
    {
      geographic_area: 'Austin, TX',
      property_type: 'single_family',
      period_start: '2025-10-01',
      period_end: '2025-10-31',
      market_data: {
        median_sale_price: 425000,
        median_rent: 2500,
        price_trend: 'rising',
        price_change_percent: 3.5,
        market_temperature: 'warm'
      }
    }
  )) passed++; else failed++;

  if (await testEndpoint(
    'Get Market Conditions',
    'GET',
    '/api/risk-sentinel/market/Austin, TX?limit=12'
  )) passed++; else failed++;

  if (await testEndpoint(
    'Get Market Trend',
    'GET',
    '/api/risk-sentinel/market/Austin, TX/trend'
  )) passed++; else failed++;

  // =====================================================
  // PROPERTY ALERTS TESTS
  // =====================================================
  console.log('\n🔔 PROPERTY ALERTS TESTS:');

  if (await testEndpoint(
    'Create Property Alert',
    'POST',
    '/api/risk-sentinel/alerts',
    {
      property_id: TEST_PROPERTY_ID,
      alert_type: 'value_drop',
      severity: 'warning',
      title: 'Property Value Decline Detected',
      message: 'Property value has decreased by 5% in the last month',
      current_value: 330000,
      threshold_value: 350000,
      recommended_action: 'Monitor market conditions and review pricing'
    }
  )) passed++; else failed++;

  if (await testEndpoint(
    'Get Property Alerts',
    'GET',
    `/api/risk-sentinel/alerts/${TEST_PROPERTY_ID}?status=new`
  )) passed++; else failed++;

  if (await testEndpoint(
    'Get All Alerts',
    'GET',
    '/api/risk-sentinel/alerts?status=new&limit=50'
  )) passed++; else failed++;

  // =====================================================
  // ENVIRONMENTAL RISKS TESTS
  // =====================================================
  console.log('\n🌿 ENVIRONMENTAL RISKS TESTS:');

  if (await testEndpoint(
    'Create Environmental Risk',
    'POST',
    '/api/risk-sentinel/environmental',
    {
      property_id: TEST_PROPERTY_ID,
      risk_category: 'flood',
      risk_level: 'moderate',
      probability_score: 45,
      impact_score: 70,
      fema_zone: 'AE',
      insurance_required: true,
      estimated_annual_loss: 5000,
      data_provider: 'FEMA'
    }
  )) passed++; else failed++;

  if (await testEndpoint(
    'Get Environmental Risks',
    'GET',
    `/api/risk-sentinel/environmental/${TEST_PROPERTY_ID}`
  )) passed++; else failed++;

  if (await testEndpoint(
    'Get Environmental Risk Summary',
    'GET',
    `/api/risk-sentinel/environmental/${TEST_PROPERTY_ID}/summary`
  )) passed++; else failed++;

  // =====================================================
  // MONITORING SCHEDULES TESTS
  // =====================================================
  console.log('\n📅 MONITORING SCHEDULES TESTS:');

  if (await testEndpoint(
    'Create Monitoring Schedule',
    'POST',
    '/api/risk-sentinel/schedules',
    {
      property_id: TEST_PROPERTY_ID,
      monitor_type: 'valuation',
      frequency: 'monthly',
      configuration: { auto_alert: true }
    }
  )) passed++; else failed++;

  if (await testEndpoint(
    'Get Monitoring Schedules',
    'GET',
    `/api/risk-sentinel/schedules/${TEST_PROPERTY_ID}`
  )) passed++; else failed++;

  // =====================================================
  // DASHBOARD & ANALYTICS TESTS
  // =====================================================
  console.log('\n📊 DASHBOARD & ANALYTICS TESTS:');

  if (await testEndpoint(
    'Get Property Dashboard',
    'GET',
    `/api/risk-sentinel/dashboard/${TEST_PROPERTY_ID}`
  )) passed++; else failed++;

  if (await testEndpoint(
    'Get Portfolio Metrics',
    'GET',
    '/api/risk-sentinel/portfolio/metrics'
  )) passed++; else failed++;

  // =====================================================
  // SUMMARY
  // =====================================================
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(50));

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Risk Sentinel API is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the API implementation.');
  }
}

runTests().catch(console.error);
