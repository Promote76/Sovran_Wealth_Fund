/**
 * Feature #8: Multi-chain Deployment Orchestrator API Tests
 */

const BASE_URL = 'http://localhost:5000';
let testDeploymentId = null;
let testBridgeId = null;
let testTransactionId = null;

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
  console.log('🧪 Running Multi-chain Deployment Orchestrator API Tests...\n');
  
  let passed = 0, failed = 0;

  console.log('⛓️  SUPPORTED CHAINS TESTS:');
  let result = await testEndpoint('Get All Chains', 'GET', '/api/multichain/chains');
  result.success ? passed++ : failed++;

  result = await testEndpoint('Get Chain by ID', 'GET', '/api/multichain/chains/1');
  result.success ? passed++ : failed++;

  console.log('\n📝 DEPLOYED CONTRACTS TESTS:');
  result = await testEndpoint('Deploy Contract', 'POST', '/api/multichain/contracts', {
    contract_name: 'TestToken',
    contract_type: 'ERC20',
    chain_id: '56',
    contract_address: '0x1234567890123456789012345678901234567890',
    deployer_address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    deployment_tx_hash: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'
  });
  if (result.success) {
    passed++;
    testDeploymentId = result.data.contract.deployment_id;
  } else failed++;

  result = await testEndpoint('Get All Contracts', 'GET', '/api/multichain/contracts?limit=50');
  result.success ? passed++ : failed++;

  if (testDeploymentId) {
    result = await testEndpoint('Get Contract by ID', 'GET', `/api/multichain/contracts/${testDeploymentId}`);
    result.success ? passed++ : failed++;

    result = await testEndpoint('Verify Contract', 'PUT', `/api/multichain/contracts/${testDeploymentId}/verify`, {
      verification_url: 'https://bscscan.com/address/0x1234567890123456789012345678901234567890#code'
    });
    result.success ? passed++ : failed++;
  }

  console.log('\n🌉 CROSS-CHAIN BRIDGES TESTS:');
  result = await testEndpoint('Create Bridge', 'POST', '/api/multichain/bridges', {
    bridge_name: 'BSC-ETH Bridge',
    source_chain_id: '56',
    destination_chain_id: '1',
    bridge_contract_address: '0xbridgebridgebridgebridgebridgebridgebridge1',
    fee_percentage: 0.3
  });
  if (result.success) {
    passed++;
    testBridgeId = result.data.bridge.bridge_id;
  } else failed++;

  result = await testEndpoint('Get All Bridges', 'GET', '/api/multichain/bridges');
  result.success ? passed++ : failed++;

  console.log('\n🔄 BRIDGE TRANSACTIONS TESTS:');
  if (testBridgeId) {
    result = await testEndpoint('Create Bridge Transaction', 'POST', '/api/multichain/bridge-transactions', {
      bridge_id: testBridgeId,
      sender_address: '0xsendersendersendersendersendersendersender01',
      recipient_address: '0xreciprecipreciprecipreciprecipreciprecip01',
      amount: 1000,
      source_tx_hash: '0xtxhash1txhash1txhash1txhash1txhash1txhash1txhash1txhash1txhash1'
    });
    if (result.success) {
      passed++;
      testTransactionId = result.data.transaction.transaction_id;
    } else failed++;

    result = await testEndpoint('Get Bridge Transactions', 'GET', '/api/multichain/bridge-transactions?limit=50');
    result.success ? passed++ : failed++;

    if (testTransactionId) {
      result = await testEndpoint('Complete Bridge Transaction', 'PUT', `/api/multichain/bridge-transactions/${testTransactionId}/complete`, {
        destination_tx_hash: '0xdesttx1desttx1desttx1desttx1desttx1desttx1desttx1desttx1desttx1',
        gas_used: 150000
      });
      result.success ? passed++ : failed++;
    }
  }

  console.log('\n📋 DEPLOYMENT TEMPLATES TESTS:');
  result = await testEndpoint('Create Template', 'POST', '/api/multichain/templates', {
    template_name: 'Standard ERC20',
    contract_type: 'ERC20',
    template_code: 'pragma solidity ^0.8.0; contract Token {}',
    description: 'Standard ERC20 token template'
  });
  result.success ? passed++ : failed++;

  result = await testEndpoint('Get Templates', 'GET', '/api/multichain/templates');
  result.success ? passed++ : failed++;

  console.log('\n📊 CHAIN MONITORING TESTS:');
  result = await testEndpoint('Record Monitoring Metric', 'POST', '/api/multichain/monitoring', {
    chain_id: '56',
    metric_type: 'block_time',
    metric_value: 3.2,
    threshold_value: 5.0
  });
  result.success ? passed++ : failed++;

  result = await testEndpoint('Get Monitoring Metrics', 'GET', '/api/multichain/monitoring/56?limit=50');
  result.success ? passed++ : failed++;

  console.log('\n⛽ GAS PRICE HISTORY TESTS:');
  result = await testEndpoint('Record Gas Price', 'POST', '/api/multichain/gas-prices', {
    chain_id: '56',
    gas_price_gwei: 5.5,
    gas_price_usd: 0.002,
    block_number: 12345678
  });
  result.success ? passed++ : failed++;

  result = await testEndpoint('Get Gas Price History', 'GET', '/api/multichain/gas-prices/56?hours=24&limit=100');
  result.success ? passed++ : failed++;

  console.log('\n📊 ANALYTICS TESTS:');
  result = await testEndpoint('Get Platform Summary', 'GET', '/api/multichain/analytics/summary');
  result.success ? passed++ : failed++;

  result = await testEndpoint('Get Chain Stats', 'GET', '/api/multichain/analytics/chain/56/stats');
  result.success ? passed++ : failed++;

  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(50));

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Multi-chain Deployment API is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the API implementation.');
  }
}

runTests().catch(console.error);
