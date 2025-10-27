/**
 * Feature #7: Tax & Reporting Automation API Tests
 */

const BASE_URL = 'http://localhost:5000';
const TEST_INVESTOR_ID = 1;
let testDocumentId = null;
let testStatementId = null;
let testTaxLotId = null;

async function testEndpoint(name, method, endpoint, body = null) {
  try {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    if (!response.ok) {
      console.log(`❌ ${name}: FAILED (${response.status})`);
      console.log(`   Error: ${data.error || JSON.stringify(data)}`);
      return { success: false };
    }
    
    console.log(`✅ ${name}: PASSED`);
    return { success: true, data };
  } catch (error) {
    console.log(`❌ ${name}: ERROR - ${error.message}`);
    return { success: false };
  }
}

async function runTests() {
  console.log('🧪 Running Tax & Reporting Automation API Tests...\n');
  
  let passed = 0, failed = 0;

  console.log('👤 TAX PROFILES TESTS:');
  let result = await testEndpoint('Create Tax Profile', 'POST', '/api/tax/profiles', {
    investor_id: TEST_INVESTOR_ID,
    tax_id_type: 'ssn',
    tax_id_number: '***-**-1234',
    tax_classification: 'individual',
    w9_submitted: true,
    country: 'US'
  });
  result.success ? passed++ : failed++;

  result = await testEndpoint('Get Tax Profile', 'GET', `/api/tax/profiles/${TEST_INVESTOR_ID}`);
  result.success ? passed++ : failed++;

  console.log('\n📄 TAX DOCUMENTS TESTS:');
  result = await testEndpoint('Create Tax Document', 'POST', '/api/tax/documents', {
    investor_id: TEST_INVESTOR_ID,
    document_type: '1099-DIV',
    tax_year: 2024,
    property_id: 1,
    income_amount: 5000,
    withholding_amount: 500
  });
  if (result.success) {
    passed++;
    testDocumentId = result.data.document.document_id;
  } else failed++;

  result = await testEndpoint('Get Tax Documents', 'GET', `/api/tax/documents/${TEST_INVESTOR_ID}?tax_year=2024`);
  result.success ? passed++ : failed++;

  if (testDocumentId) {
    result = await testEndpoint('Generate Document', 'PUT', `/api/tax/documents/${testDocumentId}/generate`);
    result.success ? passed++ : failed++;

    result = await testEndpoint('Send Document', 'PUT', `/api/tax/documents/${testDocumentId}/send`);
    result.success ? passed++ : failed++;
  }

  console.log('\n📊 INVESTOR STATEMENTS TESTS:');
  result = await testEndpoint('Create Statement', 'POST', '/api/tax/statements', {
    investor_id: TEST_INVESTOR_ID,
    statement_type: 'annual',
    period_start: '2024-01-01',
    period_end: '2024-12-31',
    total_income: 12000,
    total_distributions: 10000
  });
  if (result.success) {
    passed++;
    testStatementId = result.data.statement.statement_id;
  } else failed++;

  result = await testEndpoint('Get Statements', 'GET', `/api/tax/statements/${TEST_INVESTOR_ID}?year=2024`);
  result.success ? passed++ : failed++;

  if (testStatementId) {
    result = await testEndpoint('Generate Statement', 'PUT', `/api/tax/statements/${testStatementId}/generate`);
    result.success ? passed++ : failed++;
  }

  console.log('\n💰 TAX LOT TRACKING TESTS:');
  result = await testEndpoint('Create Tax Lot', 'POST', '/api/tax/tax-lots', {
    investor_id: TEST_INVESTOR_ID,
    property_id: 1,
    acquisition_date: '2024-01-15',
    acquisition_price: 50000,
    shares_acquired: 100
  });
  if (result.success) {
    passed++;
    testTaxLotId = result.data.tax_lot.id;
  } else failed++;

  result = await testEndpoint('Get Tax Lots', 'GET', `/api/tax/tax-lots/${TEST_INVESTOR_ID}?status=open`);
  result.success ? passed++ : failed++;

  if (testTaxLotId) {
    result = await testEndpoint('Dispose Tax Lot', 'PUT', `/api/tax/tax-lots/${testTaxLotId}/dispose`, {
      disposition_date: '2024-10-01',
      disposition_price: 55000,
      shares_sold: 100
    });
    result.success ? passed++ : failed++;
  }

  console.log('\n🔌 INTEGRATIONS TESTS:');
  result = await testEndpoint('Create Integration', 'POST', '/api/tax/integrations', {
    provider_name: 'TaxBit',
    integration_status: 'active'
  });
  result.success ? passed++ : failed++;

  result = await testEndpoint('Get Integrations', 'GET', '/api/tax/integrations');
  result.success ? passed++ : failed++;

  console.log('\n📊 ANALYTICS TESTS:');
  result = await testEndpoint('Get Tax Summary', 'GET', `/api/tax/analytics/${TEST_INVESTOR_ID}/summary?tax_year=2024`);
  result.success ? passed++ : failed++;

  result = await testEndpoint('Bulk Generate Documents', 'POST', `/api/tax/bulk-generate/${TEST_INVESTOR_ID}`, {
    tax_year: 2024,
    document_types: ['1099-DIV', 'K-1']
  });
  result.success ? passed++ : failed++;

  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(50));

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Tax & Reporting API is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the API implementation.');
  }
}

runTests().catch(console.error);
