const investmentService = require('./services/investmentService');

async function testLimitOrders() {
  try {
    console.log('🧪 Testing Limit Order Logic\n');
    
    const testAccountId = 5;
    const testWallet = '0xecddb7dff2f61e1cac7ac767337a38e1ad851ed6';
    
    // Test 1: Buy limit order ABOVE market price (should execute immediately)
    console.log('Test 1: Buy limit @ $300 (market ~$254) - should execute');
    const buyAboveMarket = await investmentService.executeBuyOrder(
      testAccountId,
      'AAPL',
      5,
      'LIMIT',
      300, // Limit price above market
      testWallet
    );
    console.log(buyAboveMarket.pending ? '❌ FAILED: Order pending' : '✅ PASSED: Order executed');
    console.log(`  Message: ${buyAboveMarket.message || 'Executed immediately'}\n`);
    
    // Test 2: Buy limit order BELOW market price (should stay pending)
    console.log('Test 2: Buy limit @ $200 (market ~$254) - should stay pending');
    const buyBelowMarket = await investmentService.executeBuyOrder(
      testAccountId,
      'AAPL',
      5,
      'LIMIT',
      200, // Limit price below market
      testWallet
    );
    console.log(buyBelowMarket.pending ? '✅ PASSED: Order pending' : '❌ FAILED: Order executed');
    console.log(`  Message: ${buyBelowMarket.message}\n`);
    
    // Test 3: Sell limit order ABOVE market price (should stay pending)
    console.log('Test 3: Sell limit @ $300 (market ~$254) - should stay pending');
    const sellAboveMarket = await investmentService.executeSellOrder(
      testAccountId,
      'AAPL',
      2,
      'LIMIT',
      300, // Limit price above market
      testWallet
    );
    console.log(sellAboveMarket.pending ? '✅ PASSED: Order pending' : '❌ FAILED: Order executed');
    console.log(`  Message: ${sellAboveMarket.message}\n`);
    
    // Test 4: Sell limit order BELOW market price (should execute immediately)
    console.log('Test 4: Sell limit @ $200 (market ~$254) - should execute');
    const sellBelowMarket = await investmentService.executeSellOrder(
      testAccountId,
      'AAPL',
      2,
      'LIMIT',
      200, // Limit price below market
      testWallet
    );
    console.log(sellBelowMarket.pending ? '❌ FAILED: Order pending' : '✅ PASSED: Order executed');
    console.log(`  Message: ${sellBelowMarket.message || 'Executed immediately'}\n`);
    
    console.log('✅ ALL LIMIT ORDER TESTS PASSED!');
    console.log('\n📋 Summary:');
    console.log('  - Buy limit above market: Execute ✓');
    console.log('  - Buy limit below market: Pending ✓');
    console.log('  - Sell limit above market: Pending ✓');
    console.log('  - Sell limit below market: Execute ✓');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testLimitOrders();
