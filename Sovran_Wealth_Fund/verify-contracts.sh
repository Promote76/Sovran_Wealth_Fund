#!/bin/bash

# Sovran Wealth Fund (SWF) - Contract Verification Script
# Runs the verification script for all contracts deployed on Polygon Mainnet

echo "Starting Sovran Wealth Fund contract verification on Polygon Mainnet..."

# Check if POLYGONSCAN_API_KEY is set
if [ -z "$POLYGONSCAN_API_KEY" ]; then
    echo "Error: POLYGONSCAN_API_KEY environment variable is not set."
    echo "Please set it in your .env file or export it before running this script."
    exit 1
fi

# Run the verification script
npx hardhat run verify-contracts.js --network polygon

# Check if verification was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Contract verification completed successfully!"
    echo "All contracts should now be verified on Polygonscan."
    echo ""
    echo "You can view them at:"
    echo "https://polygonscan.com/token/0x15AD65Fb62CD9147Aa4443dA89828A693228b5F7"
    echo ""
else
    echo ""
    echo "❌ Contract verification encountered errors."
    echo "Please check the output above for details."
    echo ""
fi