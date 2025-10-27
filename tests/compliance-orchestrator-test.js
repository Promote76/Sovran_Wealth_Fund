/**
 * Feature #2: Smart Compliance Orchestrator - Comprehensive Tests
 * Tests all compliance operations including KYC/AML, accreditation, and alerts
 */

require('dotenv').config();
const axios = require('axios');
const { Pool } = require('pg');
const { setupTestData, TEST_USER_EMAIL, TEST_WALLET } = require('../scripts/setup-compliance-test-data');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

let testUserId = null;
let testVerificationId = null;
let testCheckId = null;
let testAlertId = null;
let testFilingId = null;

async function test1_SubmitAccreditationVerification() {
  console.log('\n📝 Test 1: Submit Accreditation Verification');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/compliance/accreditation/submit`, {
      investorId: testUserId,
      walletAddress: TEST_WALLET,
      verificationType: 'income',
      verificationMethod: 'document_upload',
      verificationData: {
        annualIncome: 250000,
        employmentStatus: 'employed'
      },
      documents: []
    });

    if (response.data.success && response.data.verification) {
      testVerificationId = response.data.verification.verification_id;
      console.log(`✅ PASS: Accreditation verification submitted`);
      console.log(`   - Verification ID: ${testVerificationId}`);
      console.log(`   - Type: ${response.data.verification.verification_type}`);
      console.log(`   - Status: ${response.data.verification.status}`);
      return true;
    } else {
      console.log('❌ FAIL: Invalid response structure');
      return false;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function test2_ReviewAccreditationVerification() {
  console.log('\n📝 Test 2: Review Accreditation Verification (Approve)');
  
  if (!testVerificationId) {
    console.log('⚠️  SKIP: No verification ID available');
    return true;
  }
  
  try {
    const response = await axios.post(`${BASE_URL}/api/compliance/accreditation/${testVerificationId}/review`, {
      reviewerId: testUserId,
      approved: true,
      rejectionReason: null
    });

    if (response.data.success && response.data.verification) {
      console.log(`✅ PASS: Accreditation verification approved`);
      console.log(`   - Status: ${response.data.verification.status}`);
      console.log(`   - Reviewed At: ${response.data.verification.reviewed_at}`);
      return true;
    } else {
      console.log('❌ FAIL: Invalid response structure');
      return false;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function test3_RunAMLCheck() {
  console.log('\n📝 Test 3: Run AML Check');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/compliance/aml/check`, {
      investorId: testUserId,
      walletAddress: TEST_WALLET,
      checkType: 'identity_verification'
    });

    if (response.data.success && response.data.check) {
      testCheckId = response.data.check.check_id;
      console.log(`✅ PASS: AML check initiated`);
      console.log(`   - Check ID: ${testCheckId}`);
      console.log(`   - Type: ${response.data.check.check_type}`);
      console.log(`   - Provider: ${response.data.check.provider}`);
      console.log(`   - Status: ${response.data.check.status}`);
      return true;
    } else {
      console.log('❌ FAIL: Invalid response structure');
      return false;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function test4_ReviewAMLCheck() {
  console.log('\n📝 Test 4: Review AML Check (Clear)');
  
  if (!testCheckId) {
    console.log('⚠️  SKIP: No check ID available');
    return true;
  }
  
  try {
    const response = await axios.post(`${BASE_URL}/api/compliance/aml/${testCheckId}/review`, {
      reviewerId: testUserId,
      status: 'clear',
      riskLevel: 'low',
      findings: { notes: 'No issues found' },
      actionTaken: 'Cleared for investment'
    });

    if (response.data.success && response.data.amlCheck) {
      console.log(`✅ PASS: AML check reviewed`);
      console.log(`   - Status: ${response.data.amlCheck.status}`);
      console.log(`   - Risk Level: ${response.data.amlCheck.risk_level}`);
      console.log(`   - Risk Score: ${response.data.amlCheck.risk_score}`);
      return true;
    } else {
      console.log('❌ FAIL: Invalid response structure');
      return false;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function test5_GetComplianceAlerts() {
  console.log('\n📝 Test 5: Get Compliance Alerts');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/compliance/alerts?status=open&limit=10`);

    if (response.data.success && Array.isArray(response.data.alerts)) {
      const alerts = response.data.alerts;
      if (alerts.length > 0) {
        testAlertId = alerts[0].alert_id;
      }
      console.log(`✅ PASS: Compliance alerts retrieved`);
      console.log(`   - Total Alerts: ${alerts.length}`);
      if (alerts.length > 0) {
        console.log(`   - First Alert Type: ${alerts[0].alert_type}`);
        console.log(`   - Severity: ${alerts[0].severity}`);
      }
      return true;
    } else {
      console.log('❌ FAIL: Invalid response structure');
      return false;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function test6_ResolveAlert() {
  console.log('\n📝 Test 6: Resolve Compliance Alert');
  
  if (!testAlertId) {
    console.log('⚠️  SKIP: No alert ID available (no open alerts)');
    return true;
  }
  
  try {
    const response = await axios.post(`${BASE_URL}/api/compliance/alerts/${testAlertId}/resolve`, {
      resolvedBy: testUserId,
      resolutionNotes: 'Resolved during testing - no action needed'
    });

    if (response.data.success && response.data.alert) {
      console.log(`✅ PASS: Alert resolved successfully`);
      console.log(`   - Status: ${response.data.alert.status}`);
      console.log(`   - Resolved At: ${response.data.alert.resolved_at}`);
      return true;
    } else {
      console.log('❌ FAIL: Invalid response structure');
      return false;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function test7_GetInvestorComplianceStatus() {
  console.log('\n📝 Test 7: Get Investor Compliance Status');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/compliance/status/${testUserId}?walletAddress=${TEST_WALLET}`);

    if (response.data.success && response.data.status) {
      const status = response.data.status;
      console.log(`✅ PASS: Compliance status retrieved`);
      console.log(`   - Is Accredited: ${status.isAccredited}`);
      console.log(`   - Is Compliant: ${status.isCompliant}`);
      console.log(`   - Can Invest: ${status.canInvest}`);
      console.log(`   - Clear AML Checks: ${status.clearAmlChecks}`);
      console.log(`   - Open Alerts: ${status.openAlerts}`);
      return true;
    } else {
      console.log('❌ FAIL: Invalid response structure');
      return false;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function test8_CreateRegulatoryFiling() {
  console.log('\n📝 Test 8: Create Regulatory Filing');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/compliance/filings/create`, {
      filingType: 'form_d',
      propertyId: null,
      jurisdiction: 'US',
      filingData: {
        issuerName: 'AXIOM Platform',
        offeringAmount: 5000000,
        issuanceDate: new Date().toISOString()
      },
      filedBy: testUserId,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
    });

    if (response.data.success && response.data.filing) {
      testFilingId = response.data.filing.filing_id;
      console.log(`✅ PASS: Regulatory filing created`);
      console.log(`   - Filing ID: ${testFilingId}`);
      console.log(`   - Type: ${response.data.filing.filing_type}`);
      console.log(`   - Status: ${response.data.filing.filing_status}`);
      console.log(`   - Jurisdiction: ${response.data.filing.jurisdiction}`);
      return true;
    } else {
      console.log('❌ FAIL: Invalid response structure');
      return false;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function test9_UpdateFilingStatus() {
  console.log('\n📝 Test 9: Update Filing Status');
  
  if (!testFilingId) {
    console.log('⚠️  SKIP: No filing ID available');
    return true;
  }
  
  try {
    const response = await axios.post(`${BASE_URL}/api/compliance/filings/${testFilingId}/update`, {
      status: 'filed',
      filingNumber: 'D-2025-123456',
      confirmationNumber: 'CONF-789012',
      filingUrl: 'https://www.sec.gov/cgi-bin/browse-edgar',
      reviewedBy: testUserId
    });

    if (response.data.success && response.data.filing) {
      console.log(`✅ PASS: Filing status updated`);
      console.log(`   - Status: ${response.data.filing.filing_status}`);
      console.log(`   - Filing Number: ${response.data.filing.filing_number}`);
      console.log(`   - Filed At: ${response.data.filing.filed_at}`);
      return true;
    } else {
      console.log('❌ FAIL: Invalid response structure');
      return false;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function test10_GetComplianceMetrics() {
  console.log('\n📝 Test 10: Get Compliance Metrics');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/compliance/metrics`);

    if (response.data.success && response.data.metrics) {
      const metrics = response.data.metrics;
      console.log(`✅ PASS: Compliance metrics retrieved`);
      console.log(`   - Pending KYC: ${metrics.pendingKyc || 0}`);
      console.log(`   - Pending Accreditation: ${metrics.pendingAccreditation || 0}`);
      console.log(`   - Flagged AML: ${metrics.flaggedAml || 0}`);
      console.log(`   - Pending Filings: ${metrics.pendingFilings || 0}`);
      console.log(`   - Open Alerts: ${metrics.openAlerts || 0}`);
      return true;
    } else {
      console.log('❌ FAIL: Invalid response structure');
      return false;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');
  
  const client = await pool.connect();
  
  try {
    if (testUserId) {
      await client.query('DELETE FROM compliance_alerts WHERE investor_id = $1', [testUserId]);
      await client.query('DELETE FROM regulatory_filings WHERE filed_by = $1', [testUserId]);
      await client.query('DELETE FROM aml_checks WHERE investor_id = $1', [testUserId]);
      await client.query('DELETE FROM accreditation_verifications WHERE investor_id = $1', [testUserId]);
    }
    
    console.log('✅ Test data cleaned');
    
  } catch (error) {
    console.error('Error cleaning up:', error.message);
  } finally {
    client.release();
  }
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Feature #2: Smart Compliance Orchestrator Tests');
  console.log('═══════════════════════════════════════════════════');

  const results = [];
  
  try {
    const testData = await setupTestData();
    testUserId = testData.testUserId;

    results.push({ name: 'Submit Accreditation Verification', pass: await test1_SubmitAccreditationVerification() });
    results.push({ name: 'Review Accreditation Verification', pass: await test2_ReviewAccreditationVerification() });
    results.push({ name: 'Run AML Check', pass: await test3_RunAMLCheck() });
    results.push({ name: 'Review AML Check', pass: await test4_ReviewAMLCheck() });
    results.push({ name: 'Get Compliance Alerts', pass: await test5_GetComplianceAlerts() });
    results.push({ name: 'Resolve Alert', pass: await test6_ResolveAlert() });
    results.push({ name: 'Get Investor Compliance Status', pass: await test7_GetInvestorComplianceStatus() });
    results.push({ name: 'Create Regulatory Filing', pass: await test8_CreateRegulatoryFiling() });
    results.push({ name: 'Update Filing Status', pass: await test9_UpdateFilingStatus() });
    results.push({ name: 'Get Compliance Metrics', pass: await test10_GetComplianceMetrics() });

    await cleanupTestData();

  } catch (error) {
    console.error('\n💥 Test suite error:', error);
  } finally {
    await pool.end();
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  TEST RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════');

  const passed = results.filter(r => r.pass).length;
  const total = results.length;

  results.forEach(result => {
    console.log(`${result.pass ? '✅' : '❌'} ${result.name}`);
  });

  console.log('\n═══════════════════════════════════════════════════');
  console.log(`  ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`);
  console.log('═══════════════════════════════════════════════════');

  process.exit(passed === total ? 0 : 1);
}

runAllTests();
