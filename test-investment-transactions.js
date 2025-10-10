const investmentService = require('./services/investmentService');

async function runTests() {
  try {
    console.log('🧪 Testing Investment Transaction Engine\n');
    
    const testAccountId = 5;
    const testWallet = '0xecddb7dff2f61e1cac7ac767337a38e1ad851ed6';
    
    // Test 1: Buy AAPL stock
    console.log('📈 Test 1: Buying 10 shares of AAPL...');
    const buyResult = await investmentService.executeBuyOrder(
      testAccountId,
      'AAPL',
      10,
      'MARKET',
      null,
      testWallet
    );
    console.log('✅ Buy Order Result:');
    console.log('  - Order ID:', buyResult.order.id);
    console.log('  - Execution Price:', buyResult.execution.fillPrice);
    console.log('  - Total Cost:', buyResult.totalCost);
    console.log('  - Fees:', buyResult.fees);
    console.log('  - New Cash Balance:', buyResult.newCashBalance);
    console.log('  - Position Quantity:', buyResult.position.quantity);
    console.log('  - Avg Cost:', buyResult.position.avgCost);
    
    // Test 2: Buy more AAPL (test average cost calculation)
    console.log('\n📈 Test 2: Buying 5 more shares of AAPL...');
    const buyResult2 = await investmentService.executeBuyOrder(
      testAccountId,
      'AAPL',
      5,
      'MARKET',
      null,
      testWallet
    );
    console.log('✅ Second Buy Order Result:');
    console.log('  - New Position Quantity:', buyResult2.position.quantity);
    console.log('  - New Avg Cost:', buyResult2.position.avgCost);
    console.log('  - New Cash Balance:', buyResult2.newCashBalance);
    
    // Test 3: Buy BTC (crypto)
    console.log('\n📈 Test 3: Buying 0.01 BTC...');
    const buyBTC = await investmentService.executeBuyOrder(
      testAccountId,
      'BTC',
      0.01,
      'MARKET',
      null,
      testWallet
    );
    console.log('✅ BTC Buy Order Result:');
    console.log('  - Execution Price:', buyBTC.execution.fillPrice);
    console.log('  - Total Cost:', buyBTC.totalCost);
    console.log('  - Position Quantity:', buyBTC.position.quantity);
    
    // Test 4: Buy TLT (bond)
    console.log('\n📈 Test 4: Buying 20 shares of TLT (bond)...');
    const buyBond = await investmentService.executeBuyOrder(
      testAccountId,
      'TLT',
      20,
      'MARKET',
      null,
      testWallet
    );
    console.log('✅ Bond Buy Order Result:');
    console.log('  - Instrument Type: bond');
    console.log('  - Total Cost:', buyBond.totalCost);
    console.log('  - Position Quantity:', buyBond.position.quantity);
    
    // Test 5: Get all positions
    console.log('\n📊 Test 5: Fetching all positions...');
    const positions = await investmentService.getAccountPositions(testAccountId);
    console.log('✅ Current Positions:');
    positions.forEach(pos => {
      console.log(`  - ${pos.symbol} (${pos.type}): ${pos.quantity} shares @ $${pos.avgCost}`);
      console.log(`    Market Value: $${pos.marketValue}, Unrealized P&L: $${pos.unrealizedPnl} (${pos.unrealizedPnlPercent}%)`);
    });
    
    // Test 6: Sell some AAPL
    console.log('\n📉 Test 6: Selling 5 shares of AAPL...');
    const sellResult = await investmentService.executeSellOrder(
      testAccountId,
      'AAPL',
      5,
      'MARKET',
      null,
      testWallet
    );
    console.log('✅ Sell Order Result:');
    console.log('  - Execution Price:', sellResult.execution.fillPrice);
    console.log('  - Net Proceeds:', sellResult.netProceeds);
    console.log('  - Realized P&L:', sellResult.realizedPnl);
    console.log('  - Remaining Quantity:', sellResult.position.quantity);
    console.log('  - New Cash Balance:', sellResult.newCashBalance);
    
    // Test 7: Get order history
    console.log('\n📜 Test 7: Fetching order history...');
    const orders = await investmentService.getOrderHistory(testAccountId, 10);
    console.log(`✅ Found ${orders.length} orders:`);
    orders.slice(0, 3).forEach(order => {
      console.log(`  - ${order.side} ${order.quantity} ${order.instrument?.symbol || 'N/A'} @ $${order.avgFillPrice} (${order.status})`);
    });
    
    // Test 8: Get account summary
    console.log('\n💰 Test 8: Generating account summary...');
    const summary = await investmentService.getAccountSummary(testAccountId);
    console.log('✅ Account Summary:');
    console.log('  - Account Number:', summary.accountNumber);
    console.log('  - Cash Balance: $' + summary.cashBalance);
    console.log('  - Total Market Value: $' + summary.totalMarketValue);
    console.log('  - Total Account Value: $' + summary.totalAccountValue);
    console.log('  - Total Cost Basis: $' + summary.totalCostBasis);
    console.log('  - Total Unrealized P&L: $' + summary.totalUnrealizedPnl);
    console.log('  - Total Realized P&L: $' + summary.totalRealizedPnl);
    console.log('  - Total P&L: $' + summary.totalPnl + ' (' + summary.totalPnlPercent + '%)');
    console.log('  - Positions Count:', summary.positionsCount);
    
    console.log('\n✅ ALL TESTS PASSED!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runTests();
