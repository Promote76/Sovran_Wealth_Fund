#!/bin/bash

WALLET="0xecddb7dff2f61e1cac7ac767337a38e1ad851ed6"

# Generate a test JWT token (for testing only)
# Note: In real usage, this would come from wallet authentication
TEST_TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'test-secret-key-for-development';
const token = jwt.sign({ walletAddress: '$WALLET' }, secret, { expiresIn: '1h' });
console.log(token);
")

echo "Testing Investment Account API"
echo "=============================="
echo ""

echo "1. Create investment account..."
RESPONSE=$(curl -s -X POST http://localhost:5000/api/investments/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{
    "accountName": "My Growth Portfolio",
    "accountType": "individual"
  }')
echo $RESPONSE | jq .
ACCOUNT_ID=$(echo $RESPONSE | jq -r '.data.id')
echo "Created account ID: $ACCOUNT_ID"
echo ""

echo "2. Get investment accounts..."
curl -s http://localhost:5000/api/investments/accounts \
  -H "Authorization: Bearer $TEST_TOKEN" | jq .
echo ""

echo "3. Deposit \$100 from checking (ID: 1)..."
curl -s -X POST "http://localhost:5000/api/investments/accounts/$ACCOUNT_ID/deposit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{
    "amount": "100.00",
    "sourceType": "checking",
    "sourceAccountId": "1"
  }' | jq .
echo ""

echo "4. Get account details..."
curl -s "http://localhost:5000/api/investments/accounts/$ACCOUNT_ID" \
  -H "Authorization: Bearer $TEST_TOKEN" | jq .
