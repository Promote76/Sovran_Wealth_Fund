/**
 * Feature #6: Co-Investment Syndication Portal API Tests
 */

const BASE_URL = 'http://localhost:5000';
let testSyndicateId = null;
let testMemberId = null;
let testTierId = null;
let testInvitationId = null;
let testDistributionId = null;

async function testEndpoint(name, method, endpoint, body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
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
  console.log('🧪 Running Syndication Portal API Tests...\n');
  
  let passed = 0;
  let failed = 0;

  // =====================================================
  // SYNDICATES TESTS
  // =====================================================
  console.log('🤝 SYNDICATES TESTS:');
  
  let result = await testEndpoint(
    'Create Syndicate',
    'POST',
    '/api/syndication/syndicates',
    {
      lead_investor_id: 1,
      syndicate_name: 'Test Real Estate Syndicate',
      syndicate_type: 'deal_specific',
      target_raise: 5000000,
      minimum_commitment: 50000,
      maximum_commitment: 500000,
      waterfall_structure: 'tiered',
      description: 'Test syndicate for API validation'
    }
  );
  if (result.success) {
    passed++;
    testSyndicateId = result.data.syndicate.syndicate_id;
  } else failed++;

  result = await testEndpoint('Get All Syndicates', 'GET', '/api/syndication/syndicates?limit=50');
  result.success ? passed++ : failed++;

  if (testSyndicateId) {
    result = await testEndpoint('Get Syndicate by ID', 'GET', `/api/syndication/syndicates/${testSyndicateId}`);
    result.success ? passed++ : failed++;

    result = await testEndpoint('Update Syndicate Status', 'PUT', `/api/syndication/syndicates/${testSyndicateId}/status`, { status: 'active' });
    result.success ? passed++ : failed++;
  }

  // =====================================================
  // SYNDICATE MEMBERS TESTS
  // =====================================================
  console.log('\n👥 SYNDICATE MEMBERS TESTS:');

  if (testSyndicateId) {
    result = await testEndpoint(
      'Add Member to Syndicate',
      'POST',
      `/api/syndication/syndicates/${testSyndicateId}/members`,
      {
        investor_id: 2,
        commitment_amount: 100000,
        role: 'member'
      }
    );
    if (result.success) {
      passed++;
      testMemberId = result.data.member.id;
    } else failed++;

    result = await testEndpoint('Get Syndicate Members', 'GET', `/api/syndication/syndicates/${testSyndicateId}/members`);
    result.success ? passed++ : failed++;

    if (testMemberId) {
      result = await testEndpoint('Update Member Status', 'PUT', `/api/syndication/members/${testMemberId}/status`, { status: 'funded' });
      result.success ? passed++ : failed++;
    }
  }

  // =====================================================
  // WATERFALL TIERS TESTS
  // =====================================================
  console.log('\n💧 WATERFALL TIERS TESTS:');

  if (testSyndicateId) {
    result = await testEndpoint(
      'Create Waterfall Tier',
      'POST',
      `/api/syndication/syndicates/${testSyndicateId}/waterfall`,
      {
        tier_name: 'Preferred Return',
        tier_order: 0,
        tier_type: 'preferred_return',
        allocation_percentage: 100,
        preferred_return: 8
      }
    );
    if (result.success) {
      passed++;
      testTierId = result.data.tier.id;
    } else failed++;

    result = await testEndpoint('Get Waterfall Tiers', 'GET', `/api/syndication/syndicates/${testSyndicateId}/waterfall`);
    result.success ? passed++ : failed++;

    if (testTierId) {
      result = await testEndpoint(
        'Update Waterfall Tier',
        'PUT',
        `/api/syndication/waterfall/${testTierId}`,
        { preferred_return: 10 }
      );
      result.success ? passed++ : failed++;
    }
  }

  // =====================================================
  // DISTRIBUTIONS TESTS
  // =====================================================
  console.log('\n💰 DISTRIBUTIONS TESTS:');

  if (testSyndicateId) {
    result = await testEndpoint(
      'Create Distribution',
      'POST',
      `/api/syndication/syndicates/${testSyndicateId}/distributions`,
      {
        distribution_type: 'rental_income',
        total_amount: 50000,
        distribution_date: new Date().toISOString(),
        notes: 'Q4 rental income distribution'
      }
    );
    if (result.success) {
      passed++;
      testDistributionId = result.data.distribution.distribution_id;
    } else failed++;

    result = await testEndpoint('Get Distributions', 'GET', `/api/syndication/syndicates/${testSyndicateId}/distributions`);
    result.success ? passed++ : failed++;

    if (testDistributionId) {
      result = await testEndpoint('Calculate Distribution', 'POST', `/api/syndication/distributions/${testDistributionId}/calculate`);
      result.success ? passed++ : failed++;

      result = await testEndpoint('Execute Distribution', 'PUT', `/api/syndication/distributions/${testDistributionId}/execute`);
      result.success ? passed++ : failed++;
    }
  }

  // =====================================================
  // INVITATIONS TESTS
  // =====================================================
  console.log('\n📬 INVITATIONS TESTS:');

  if (testSyndicateId) {
    result = await testEndpoint(
      'Send Invitation',
      'POST',
      `/api/syndication/syndicates/${testSyndicateId}/invitations`,
      {
        email: 'test.investor@example.com',
        suggested_commitment: 75000
      }
    );
    if (result.success) {
      passed++;
      testInvitationId = result.data.invitation.invitation_id;
    } else failed++;

    result = await testEndpoint('Get Invitations', 'GET', `/api/syndication/syndicates/${testSyndicateId}/invitations`);
    result.success ? passed++ : failed++;

    if (testInvitationId) {
      result = await testEndpoint('Respond to Invitation', 'PUT', `/api/syndication/invitations/${testInvitationId}/respond`, { response: 'accepted' });
      result.success ? passed++ : failed++;
    }
  }

  // =====================================================
  // FEES TESTS
  // =====================================================
  console.log('\n💵 FEES TESTS:');

  if (testSyndicateId) {
    result = await testEndpoint(
      'Create Fee',
      'POST',
      `/api/syndication/syndicates/${testSyndicateId}/fees`,
      {
        fee_type: 'management',
        fee_percentage: 2,
        description: 'Annual management fee'
      }
    );
    result.success ? passed++ : failed++;

    result = await testEndpoint('Get Fees', 'GET', `/api/syndication/syndicates/${testSyndicateId}/fees`);
    result.success ? passed++ : failed++;
  }

  // =====================================================
  // ANALYTICS & REPORTING TESTS
  // =====================================================
  console.log('\n📊 ANALYTICS & REPORTING TESTS:');

  if (testSyndicateId) {
    result = await testEndpoint('Get Syndicate Summary', 'GET', `/api/syndication/syndicates/${testSyndicateId}/summary`);
    result.success ? passed++ : failed++;

    result = await testEndpoint('Get Investor Syndicates', 'GET', '/api/syndication/investor/2/syndicates');
    result.success ? passed++ : failed++;
  }

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
    console.log('\n🎉 All tests passed! Syndication Portal API is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the API implementation.');
  }
}

runTests().catch(console.error);
