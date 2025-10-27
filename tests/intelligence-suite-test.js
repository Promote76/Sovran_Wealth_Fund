/**
 * Feature #3: Investor Intelligence Suite - Comprehensive Test Suite
 * Tests all intelligence API endpoints with deterministic test data
 */

const axios = require('axios');
const { setupIntelligenceTestData, cleanupIntelligenceTestData } = require('../scripts/setup-intelligence-test-data');

const BASE_URL = 'http://localhost:5000';

let testUserId;
let testPropertyId;
let testProjectionId;
let testAnalyticsId;
let testBenchmarkId;
let testAssessmentId;

async function test1_GenerateCashFlowProjection() {
  console.log('\n📝 Test 1: Generate Cash Flow Projection');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/intelligence/projections/generate`, {
      propertyId: testPropertyId,
      investorId: testUserId
    });
    
    if (response.data.success && response.data.projection) {
      testProjectionId = response.data.projection.projection_id;
      console.log(`✅ PASS: Cash flow projection generated`);
      console.log(`   - Projection ID: ${testProjectionId}`);
      console.log(`   - Net Projected Cash Flow: $${parseFloat(response.data.projection.net_projected_cash_flow).toFixed(2)}`);
      console.log(`   - Confidence Score: ${response.data.projection.confidence_score}`);
      return true;
    }
    
    console.log(`❌ FAIL: ${response.data.error || 'Unknown error'}`);
    return false;
  } catch (error) {
    console.log(`❌ FAIL: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function test2_ListCashFlowProjections() {
  console.log('\n📝 Test 2: List Cash Flow Projections');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/intelligence/projections/list`, {
      params: {
        investorId: testUserId,
        limit: 5
      }
    });
    
    if (response.data.success && Array.isArray(response.data.projections)) {
      console.log(`✅ PASS: Cash flow projections listed`);
      console.log(`   - Total Projections: ${response.data.projections.length}`);
      return true;
    }
    
    console.log(`❌ FAIL: ${response.data.error || 'Unknown error'}`);
    return false;
  } catch (error) {
    console.log(`❌ FAIL: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function test3_CalculatePortfolioAnalytics() {
  console.log('\n📝 Test 3: Calculate Portfolio Analytics');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/intelligence/analytics/calculate`, {
      investorId: testUserId
    });
    
    if (response.data.success && response.data.analytics) {
      testAnalyticsId = response.data.analytics.analytics_id;
      console.log(`✅ PASS: Portfolio analytics calculated`);
      console.log(`   - Analytics ID: ${testAnalyticsId}`);
      console.log(`   - ROI: ${response.data.analytics.roi_percent}%`);
      console.log(`   - Diversification Score: ${response.data.analytics.diversification_score}`);
      console.log(`   - Risk Score: ${response.data.analytics.risk_score}`);
      return true;
    }
    
    console.log(`❌ FAIL: ${response.data.error || 'Unknown error'}`);
    return false;
  } catch (error) {
    console.log(`❌ FAIL: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function test4_GetPortfolioHistory() {
  console.log('\n📝 Test 4: Get Portfolio History');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/intelligence/analytics/history/${testUserId}`, {
      params: { limit: 10 }
    });
    
    if (response.data.success && Array.isArray(response.data.history)) {
      console.log(`✅ PASS: Portfolio history retrieved`);
      console.log(`   - History Entries: ${response.data.history.length}`);
      return true;
    }
    
    console.log(`❌ FAIL: ${response.data.error || 'Unknown error'}`);
    return false;
  } catch (error) {
    console.log(`❌ FAIL: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function test5_CreateBenchmark() {
  console.log('\n📝 Test 5: Create Performance Benchmark');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/intelligence/benchmarks/create`, {
      benchmarkType: 'platform_average',
      benchmarkName: 'Test Platform Average',
      periodStart: '2025-01-01',
      periodEnd: '2025-10-27',
      averageRoi: 8.5,
      averageCashYield: 6.2,
      averageAppreciation: 2.3,
      medianRoi: 7.8,
      totalProperties: 50,
      totalInvestors: 200,
      totalVolume: 5000000,
      dataSource: 'test_suite'
    });
    
    if (response.data.success && response.data.benchmark) {
      testBenchmarkId = response.data.benchmark.benchmark_id;
      console.log(`✅ PASS: Benchmark created`);
      console.log(`   - Benchmark ID: ${testBenchmarkId}`);
      console.log(`   - Average ROI: ${response.data.benchmark.average_roi}%`);
      console.log(`   - Type: ${response.data.benchmark.benchmark_type}`);
      return true;
    }
    
    console.log(`❌ FAIL: ${response.data.error || 'Unknown error'}`);
    return false;
  } catch (error) {
    console.log(`❌ FAIL: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function test6_GetBenchmark() {
  console.log('\n📝 Test 6: Get Performance Benchmark');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/intelligence/benchmarks/platform_average`);
    
    if (response.data.success) {
      console.log(`✅ PASS: Benchmark retrieved`);
      if (response.data.benchmark) {
        console.log(`   - Benchmark Name: ${response.data.benchmark.benchmark_name}`);
        console.log(`   - Average ROI: ${response.data.benchmark.average_roi}%`);
      } else {
        console.log(`   - No benchmark found (expected for empty database)`);
      }
      return true;
    }
    
    console.log(`❌ FAIL: ${response.data.error || 'Unknown error'}`);
    return false;
  } catch (error) {
    console.log(`❌ FAIL: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function test7_UpdateCohorts() {
  console.log('\n📝 Test 7: Update Investor Cohorts');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/intelligence/cohorts/update`);
    
    if (response.data.success) {
      console.log(`✅ PASS: Cohorts updated`);
      console.log(`   - Message: ${response.data.message}`);
      return true;
    }
    
    console.log(`❌ FAIL: ${response.data.error || 'Unknown error'}`);
    return false;
  } catch (error) {
    console.log(`❌ FAIL: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function test8_ListCohorts() {
  console.log('\n📝 Test 8: List Investor Cohorts');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/intelligence/cohorts/list`, {
      params: { isActive: true }
    });
    
    if (response.data.success && Array.isArray(response.data.cohorts)) {
      console.log(`✅ PASS: Cohorts listed`);
      console.log(`   - Total Cohorts: ${response.data.cohorts.length}`);
      return true;
    }
    
    console.log(`❌ FAIL: ${response.data.error || 'Unknown error'}`);
    return false;
  } catch (error) {
    console.log(`❌ FAIL: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function test9_CreateRiskAssessment() {
  console.log('\n📝 Test 9: Create Risk Assessment');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/intelligence/risk/assess`, {
      assessmentType: 'portfolio_risk',
      investorId: testUserId,
      riskLevel: 'low',
      riskScore: 25.5,
      riskFactors: {
        diversification: 'good',
        marketVolatility: 'low',
        propertyConcentration: 'distributed'
      },
      mitigationStrategies: {
        recommendation: 'Continue current diversification strategy'
      }
    });
    
    if (response.data.success && response.data.assessment) {
      testAssessmentId = response.data.assessment.assessment_id;
      console.log(`✅ PASS: Risk assessment created`);
      console.log(`   - Assessment ID: ${testAssessmentId}`);
      console.log(`   - Risk Level: ${response.data.assessment.risk_level}`);
      console.log(`   - Risk Score: ${response.data.assessment.risk_score}`);
      return true;
    }
    
    console.log(`❌ FAIL: ${response.data.error || 'Unknown error'}`);
    return false;
  } catch (error) {
    console.log(`❌ FAIL: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function test10_ListRiskAssessments() {
  console.log('\n📝 Test 10: List Risk Assessments');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/intelligence/risk/list`, {
      params: {
        investorId: testUserId,
        limit: 10
      }
    });
    
    if (response.data.success && Array.isArray(response.data.assessments)) {
      console.log(`✅ PASS: Risk assessments listed`);
      console.log(`   - Total Assessments: ${response.data.assessments.length}`);
      return true;
    }
    
    console.log(`❌ FAIL: ${response.data.error || 'Unknown error'}`);
    return false;
  } catch (error) {
    console.log(`❌ FAIL: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function test11_GetInvestorInsights() {
  console.log('\n📝 Test 11: Get Investor Insights');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/intelligence/insights/${testUserId}`);
    
    if (response.data.success && response.data.insights) {
      console.log(`✅ PASS: Investor insights retrieved`);
      console.log(`   - Analytics Available: ${response.data.insights.analytics ? 'Yes' : 'No'}`);
      console.log(`   - Projections Count: ${response.data.insights.projections?.length || 0}`);
      if (response.data.insights.insights?.diversificationRecommendation) {
        console.log(`   - Diversification: ${response.data.insights.insights.diversificationRecommendation}`);
      }
      return true;
    }
    
    console.log(`❌ FAIL: ${response.data.error || 'Unknown error'}`);
    return false;
  } catch (error) {
    console.log(`❌ FAIL: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function test12_GetDashboardData() {
  console.log('\n📝 Test 12: Get Dashboard Data');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/intelligence/dashboard/${testUserId}`);
    
    if (response.data.success && response.data.dashboard) {
      console.log(`✅ PASS: Dashboard data retrieved`);
      console.log(`   - Analytics: ${response.data.dashboard.analytics ? 'Available' : 'Not available'}`);
      console.log(`   - Projections: ${response.data.dashboard.projections?.length || 0}`);
      console.log(`   - Risk Assessment: ${response.data.dashboard.riskAssessment ? 'Available' : 'Not available'}`);
      console.log(`   - Benchmark: ${response.data.dashboard.benchmark ? 'Available' : 'Not available'}`);
      return true;
    }
    
    console.log(`❌ FAIL: ${response.data.error || 'Unknown error'}`);
    return false;
  } catch (error) {
    console.log(`❌ FAIL: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Feature #3: Investor Intelligence Suite Tests');
  console.log('═══════════════════════════════════════════════════');
  
  const testData = await setupIntelligenceTestData();
  testUserId = testData.testUserId;
  testPropertyId = testData.propertyId;
  
  const results = {
    'Generate Cash Flow Projection': await test1_GenerateCashFlowProjection(),
    'List Cash Flow Projections': await test2_ListCashFlowProjections(),
    'Calculate Portfolio Analytics': await test3_CalculatePortfolioAnalytics(),
    'Get Portfolio History': await test4_GetPortfolioHistory(),
    'Create Performance Benchmark': await test5_CreateBenchmark(),
    'Get Performance Benchmark': await test6_GetBenchmark(),
    'Update Investor Cohorts': await test7_UpdateCohorts(),
    'List Investor Cohorts': await test8_ListCohorts(),
    'Create Risk Assessment': await test9_CreateRiskAssessment(),
    'List Risk Assessments': await test10_ListRiskAssessments(),
    'Get Investor Insights': await test11_GetInvestorInsights(),
    'Get Dashboard Data': await test12_GetDashboardData()
  };
  
  await cleanupIntelligenceTestData(testUserId);
  
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  TEST RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════');
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}`);
  });
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r).length;
  const passRate = ((passedTests / totalTests) * 100).toFixed(0);
  
  console.log('\n═══════════════════════════════════════════════════');
  console.log(`  ${passedTests}/${totalTests} tests passed (${passRate}%)`);
  console.log('═══════════════════════════════════════════════════');
  
  process.exit(passedTests === totalTests ? 0 : 1);
}

runAllTests().catch(error => {
  console.error('\n💥 Test suite failed:', error);
  process.exit(1);
});
