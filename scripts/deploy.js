const hre = require("hardhat");

async function main() {
  // Get the network information
  const network = hre.network;
  console.log(`Deploying to network: ${network.name}`);
  console.log(`Chain ID: ${network.config.chainId}`);
  
  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  
  // Check deployer balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${hre.ethers.formatEther(balance)} BNB`);
  
  // Get contract factory
  console.log("Getting contract factory...");
  const SWFCore = await hre.ethers.getContractFactory("SWFCoreUpgradeable");
  
  // Deploy contract
  console.log("Deploying SWFCoreUpgradeable...");
  const contract = await SWFCore.deploy();
  
  // Wait for deployment (ethers v6 compatible)
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  
  console.log(`SWFCoreUpgradeable deployed to: ${contractAddress}`);
  
  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    contractAddress: contractAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    transactionHash: contract.deploymentTransaction()?.hash
  };
  
  console.log("Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  // If on BSC mainnet, show BSCScan link
  if (network.config.chainId === 56) {
    console.log(`View on BSCScan: https://bscscan.com/address/${contractAddress}`);
  }
  
  return contractAddress;
}

// Execute deployment with proper error handling
main()
  .then((address) => {
    console.log(`Deployment successful! Contract address: ${address}`);
    process.exitCode = 0;
  })
  .catch((error) => {
    console.error("Deployment failed:");
    console.error(error);
    process.exitCode = 1;
  });