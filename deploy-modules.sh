#!/bin/bash

echo "======================================================="
echo "    Sovran Wealth Fund Module System Deployment"
echo "======================================================="
echo ""
echo "This script will guide you through the deployment of the SWF module system."
echo ""

# Check if environment variables are set
if [ -z "$PRIVATE_KEY" ] || [ -z "$ALCHEMY_API_KEY" ] || [ -z "$POLYGONSCAN_API_KEY" ]; then
  echo "Warning: Key environment variables are not set in the current session!"
  echo "We'll need to collect them to add to your .env file."
  echo ""

  # Collect Alchemy API Key
  if [ -z "$ALCHEMY_API_KEY" ]; then
    read -p "Enter your Alchemy API Key: " ALCHEMY_API_KEY
    echo "ALCHEMY_API_KEY=$ALCHEMY_API_KEY" >> .env
  fi

  # Collect Polygonscan API Key
  if [ -z "$POLYGONSCAN_API_KEY" ]; then
    read -p "Enter your Polygonscan API Key: " POLYGONSCAN_API_KEY
    echo "POLYGONSCAN_API_KEY=$POLYGONSCAN_API_KEY" >> .env
  fi

  # Collect Private Key (warning about security)
  if [ -z "$PRIVATE_KEY" ]; then
    echo ""
    echo "SECURITY WARNING: We need your wallet private key for deployment."
    echo "This key will be stored in your .env file which should never be shared."
    echo "For maximum security, use a dedicated wallet with only enough MATIC for deployment."
    echo ""
    read -p "Enter your wallet private key (starts with 0x): " PRIVATE_KEY
    echo "PRIVATE_KEY=$PRIVATE_KEY" >> .env
  fi
  
  echo ""
fi

# Collect LP token address (required)
if [ -z "$LP_TOKEN_ADDRESS" ]; then
  echo "LP Token address is required for the LiquidityVault module."
  read -p "Enter the LP token address (e.g., SWF-MATIC QuickSwap pair): " LP_TOKEN_ADDRESS
  echo "LP_TOKEN_ADDRESS=$LP_TOKEN_ADDRESS" >> .env
  echo ""
fi

echo "Environment variables set. Ready to deploy."
echo ""
echo "Estimated deployment costs:"
echo "- Each contract: ~2M gas"
echo "- Total for 4 contracts: ~8M gas"
echo "- At 50 gwei: ~0.4 MATIC"
echo ""

read -p "Do you want to proceed with deployment to Polygon mainnet? (y/n): " PROCEED

if [ "$PROCEED" = "y" ] || [ "$PROCEED" = "Y" ]; then
  echo ""
  echo "Starting deployment..."
  echo ""
  
  # Run the Hardhat deployment script
  npx hardhat run scripts/deployModules.js --network polygon
  
  echo ""
  echo "Deployment complete!"
  echo ""
  echo "Please save the contract addresses from above and update your .env file."
  echo ""
else
  echo ""
  echo "Deployment cancelled."
  echo ""
fi