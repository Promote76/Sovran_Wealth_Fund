#!/bin/bash

# Display banner
echo "-----------------------------------------"
echo "SWF Simple Deployment Script"
echo "-----------------------------------------"

# Make the script executable
chmod +x deploy-simple.sh

# Check if hardhat is installed
if ! command -v npx &> /dev/null; then
  echo "Installing dependencies..."
  npm install --quiet
fi

# Display network information
echo "Target network: Polygon Mainnet (Chain ID: 137)"
echo "Deployment method: Using explicit contract reference"
echo "Contract: contracts/SovranWealthFund.sol:SovranWealthFund"
echo "-----------------------------------------"

# Run the deployment
echo "Starting deployment process..."
npx hardhat run scripts/deploySimple.js --network polygon

# Check the result
if [ $? -eq 0 ]; then
  echo "-----------------------------------------"
  echo "Deployment completed successfully!"
  echo "Starting dashboard server on port 5000..."
  node deployment-ready-server.js
else
  echo "-----------------------------------------"
  echo "Deployment failed. Starting fallback dashboard server..."
  node deployment-ready-server.js
fi