#!/bin/bash

# Deployment script for Polygon Mainnet that properly handles environment variables
echo "Starting SWF deployment to Polygon Mainnet..."

# Create a temporary .env file with the correct secrets
cat > .env.deployment << EOL
# Deployment configuration
PRIVATE_KEY=$PRIVATE_KEY
ALCHEMY_API_KEY=$ALCHEMY_API_KEY
POLYGONSCAN_API_KEY=$POLYGONSCAN_API_KEY

# Network configuration
NETWORK=polygon
POLYGON_RPC=https://polygon-rpc.com

# SWF token contract address on Polygon mainnet
SWF_TOKEN_ADDRESS=0x15AD65Fb62CD9147Aa4443dA89828A693228b5F7

# Main distributor wallet for SWF tokens
MAIN_DISTRIBUTOR_ADDRESS=0xCe36333A88c2EA01f28f63131fA7dfa80AD021F6

# Treasury wallet
TREASURY_WALLET=0x26a8401287ce33cc4AEb5a106cD6D282a9c2f51D

# SWF Modules settings
# LP token address for LiquidityVault (required for deployment)
# SWF/ETH LP token address
LP_TOKEN_ADDRESS=0xb23F5d348fa157393E75Bc80C92516F81786Fc28

# SWF/USDC LP token address (alternative)
LP_TOKEN_ADDRESS_USDC=0x7f47199A8a5ff683FeDb86c782adb80eF598D5E0

# LP pair name for LiquidityVault
LP_PAIR_NAME="SWF/ETH"

# Vault address for SWFVaultAdapter (defaults to Treasury if not provided)
VAULT_ADDRESS=0x26a8401287ce33cc4AEb5a106cD6D282a9c2f51D

# Reward rate for GovernanceDividendPool (1e16 = 1% monthly)
MONTHLY_REWARD_RATE=10000000000000000
EOL

# Move temporary file
mv .env.deployment .env

# Run the deployment script
npx hardhat run scripts/deploy-qualified.js --network polygon

# Check if deployment was successful
if [ $? -eq 0 ]; then
  echo "Deployment completed successfully!"
  echo "You can now verify the contracts on PolygonScan by running:"
  echo "./verify-contracts.sh"
else
  echo "Deployment failed. Please check the error messages above."
  exit 1
fi