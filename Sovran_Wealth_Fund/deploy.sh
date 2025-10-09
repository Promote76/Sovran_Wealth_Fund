#!/bin/bash

# Display banner
echo "-----------------------------------------"
echo "SWF Polygon Mainnet Deployment"
echo "-----------------------------------------"

# Build phase - install necessary dependencies
echo "Installing dependencies..."
npm install express dotenv cors

# Run phase - start the deployment server
echo "Starting SWF Deployment Server..."
echo "Server will be available at port 5000"
node deployment-ready-server.js