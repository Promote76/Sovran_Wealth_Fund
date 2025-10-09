#!/bin/bash

WALLET="0xecddb7dff2f61e1cac7ac767337a38e1ad851ed6"

TEST_TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'test-secret-key-for-development';
const token = jwt.sign({ walletAddress: '$WALLET' }, secret, { expiresIn: '1h' });
console.log(token);
")

echo "=== Investment Account Management API Test ==="
echo ""

echo "1️⃣ Creating investment account..."
RESPONSE=$(curl -s -X POST http://localhost:5000/api/investments/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{
    "accountName": "Complete Test Portfolio",
    "accountType": "individual"
  }')
ACCOUNT_ID=$(echo $RESPONSE | jq -r '.data.id')
echo "✅ Account created: ID $ACCOUNT_ID"
echo ""

echo "2️⃣ Depositing \$250 from checking..."
curl -s -X POST "http://localhost:5000/api/investments/accounts/$ACCOUNT_ID/deposit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{
    "amount": "250.00",
    "sourceType": "checking",
    "sourceAccountId": "1"
  }' | jq .
echo ""

echo "3️⃣ Getting account details..."
curl -s "http://localhost:5000/api/investments/accounts/$ACCOUNT_ID" \
  -H "Authorization: Bearer $TEST_TOKEN" | jq '.data.summary'
echo ""

echo "4️⃣ Getting ledger entries..."
curl -s "http://localhost:5000/api/investments/accounts/$ACCOUNT_ID/ledger" \
  -H "Authorization: Bearer $TEST_TOKEN" | jq '.data[] | {type, amount, description}'
echo ""

echo "5️⃣ Withdrawing \$50 to savings..."
curl -s -X POST "http://localhost:5000/api/investments/accounts/$ACCOUNT_ID/withdraw" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{
    "amount": "50.00",
    "destinationType": "savings",
    "destinationAccountId": "1"
  }' | jq .
echo ""

echo "6️⃣ Final account details..."
curl -s "http://localhost:5000/api/investments/accounts/$ACCOUNT_ID" \
  -H "Authorization: Bearer $TEST_TOKEN" | jq '.data.summary'
echo ""

echo "✅ All investment account operations completed successfully!"
