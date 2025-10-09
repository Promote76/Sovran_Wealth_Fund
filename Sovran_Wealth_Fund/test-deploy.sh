#!/bin/bash

# Display banner
echo "-----------------------------------------"
echo "SWF TEST Deployment Script"
echo "-----------------------------------------"

# Run phase - start the test deployment server
echo "Starting SWF Test Deployment Server..."
echo "Server will be available at port 5001"
node test-deploy.js