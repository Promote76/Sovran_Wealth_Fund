#!/bin/bash

# Display banner
echo "-----------------------------------------"
echo "SWF Manual Deployment Script"
echo "-----------------------------------------"

# Make the script executable
chmod +x deploy-manual.sh

# Check if hardhat is installed
if ! command -v npx &> /dev/null; then
  echo "Installing dependencies..."
  npm install --quiet
fi

# Display network information
echo "Target network: Polygon Mainnet (Chain ID: 137)"
echo "Contract: contracts/SovranWealthFund.sol:SovranWealthFund"
echo "-----------------------------------------"

# Confirm before proceeding
echo "This script will deploy the SWF contract to Polygon mainnet."
echo "Make sure you have sufficient POL in your wallet."
read -p "Continue with deployment? (y/n): " confirm
if [[ "$confirm" != "y" ]]; then
  echo "Deployment cancelled."
  exit 0
fi

# Run the deployment
echo "Starting deployment process..."
npx hardhat run scripts/deploySimple.js --network polygon

# Check the result
if [ $? -eq 0 ]; then
  echo "-----------------------------------------"
  echo "Deployment completed successfully!"
  echo "See the transaction details above for contract address."
else
  echo "-----------------------------------------"
  echo "Deployment failed. Check the error messages above."
fi

echo "The web server continues to run regardless of deployment status."
echo "You can access it at port 5000."