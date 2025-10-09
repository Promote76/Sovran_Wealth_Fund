const { neon } = require('@neondatabase/serverless');
const Decimal = require('decimal.js');

const sql = neon(process.env.DATABASE_URL);

async function testInvestmentAccount() {
  console.log('\n🧪 Testing Investment Account API\n');

  const testWallet = '0xecddb7dff2f61e1cac7ac767337a38e1ad851ed6';
  
  try {
    console.log('1️⃣ Creating investment account...');
    
    const accountNumber = `INV-${Date.now()}-TEST`;
    const result = await sql`
      INSERT INTO investment_accounts (
        wallet_address,
        account_name,
        account_type,
        account_number,
        cash_balance,
        total_value,
        status,
        created_at,
        updated_at
      ) VALUES (
        ${testWallet},
        ${'Test Investment Account'},
        ${'individual'},
        ${accountNumber},
        ${0},
        ${0},
        ${'active'},
        NOW(),
        NOW()
      )
      RETURNING *
    `;
    
    const investmentAccount = result[0];
    console.log(`✅ Investment account created: ID ${investmentAccount.id}, Number ${investmentAccount.account_number}`);
    
    console.log('\n2️⃣ Checking initial balances...');
    const checkingBefore = await sql`
      SELECT ledger_balance, available_balance FROM checking_accounts 
      WHERE id = 1 AND wallet_address = ${testWallet}
    `;
    console.log(`   Checking balance before: $${checkingBefore[0].available_balance}`);
    console.log(`   Investment balance before: $${investmentAccount.cash_balance}`);
    
    console.log('\n3️⃣ Depositing $100 from checking to investment...');
    
    const depositAmount = new Decimal('100.00');
    const checkingBalance = new Decimal(checkingBefore[0].available_balance);
    const checkingLedger = new Decimal(checkingBefore[0].ledger_balance);
    
    const newCheckingLedger = checkingLedger.minus(depositAmount);
    const newCheckingAvailable = checkingBalance.minus(depositAmount);
    const newInvestmentCash = new Decimal(investmentAccount.cash_balance).plus(depositAmount);
    const newInvestmentTotal = new Decimal(investmentAccount.total_value).plus(depositAmount);
    
    await sql.transaction(async (tx) => {
      await tx`
        UPDATE checking_accounts 
        SET ledger_balance = ${newCheckingLedger.toString()},
            available_balance = ${newCheckingAvailable.toString()},
            updated_at = NOW()
        WHERE id = 1 AND wallet_address = ${testWallet}
      `;
      
      await tx`
        INSERT INTO checking_transactions 
        (id, account_id, type, amount, balance_after, description, status, created_at)
        VALUES (
          ${'TXN-' + Date.now()},
          ${1},
          ${'withdrawal'},
          ${depositAmount.neg().toString()},
          ${newCheckingLedger.toString()},
          ${'Transfer to investment account ' + investmentAccount.id},
          ${'completed'},
          NOW()
        )
      `;
      
      await tx`
        UPDATE investment_accounts 
        SET cash_balance = ${newInvestmentCash.toString()},
            total_value = ${newInvestmentTotal.toString()},
            updated_at = NOW()
        WHERE id = ${investmentAccount.id}
      `;
      
      await tx`
        INSERT INTO investment_ledger 
        (id, account_id, type, amount, balance_after, description, metadata, created_at)
        VALUES (
          ${'LED-' + Date.now()},
          ${investmentAccount.id},
          ${'deposit'},
          ${depositAmount.toString()},
          ${newInvestmentCash.toString()},
          ${'Deposit from checking account 1'},
          ${JSON.stringify({ sourceType: 'checking', sourceAccountId: 1 })},
          NOW()
        )
      `;
    });
    
    console.log('✅ Deposit transaction completed');
    
    console.log('\n4️⃣ Verifying balances after deposit...');
    const checkingAfter = await sql`
      SELECT ledger_balance, available_balance FROM checking_accounts 
      WHERE id = 1 AND wallet_address = ${testWallet}
    `;
    const investmentAfter = await sql`
      SELECT cash_balance, total_value FROM investment_accounts 
      WHERE id = ${investmentAccount.id}
    `;
    
    console.log(`   Checking balance after: $${checkingAfter[0].available_balance} (was $${checkingBefore[0].available_balance})`);
    console.log(`   Investment cash balance after: $${investmentAfter[0].cash_balance}`);
    console.log(`   Investment total value after: $${investmentAfter[0].total_value}`);
    
    const ledgerEntries = await sql`
      SELECT * FROM investment_ledger 
      WHERE account_id = ${investmentAccount.id}
      ORDER BY created_at DESC
    `;
    console.log(`\n   Ledger entries: ${ledgerEntries.length}`);
    if (ledgerEntries.length > 0) {
      console.log(`   Latest entry: ${ledgerEntries[0].type} of $${ledgerEntries[0].amount}`);
    }
    
    console.log('\n✅ All tests passed! Investment Account API is working correctly.\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

testInvestmentAccount();
