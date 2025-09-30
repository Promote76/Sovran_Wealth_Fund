const hre = require("hardhat");

async function main() {
  // Get the network information
  const network = hre.network;
  console.log(`Deploying SWF Token to network: ${network.name}`);
  console.log(`Chain ID: ${network.config.chainId}`);
  
  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  
  // Check deployer balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${hre.ethers.formatEther(balance)} BNB`);
  
  // Ensure sufficient balance for deployment
  const minBalance = hre.ethers.parseEther("0.01"); // 0.01 BNB minimum
  if (balance < minBalance) {
    throw new Error(`Insufficient balance. Need at least 0.01 BNB, have ${hre.ethers.formatEther(balance)} BNB`);
  }
  
  // Get contract factory
  console.log("Getting SWFToken contract factory...");
  const SWFToken = await hre.ethers.getContractFactory("SWFToken");
  
  // Deploy contract
  console.log("Deploying SWFToken...");
  console.log("Initial supply: 1,000,000 SWF tokens");
  
  const contract = await SWFToken.deploy();
  
  // Wait for deployment (ethers v6 compatible)
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  
  console.log(`SWFToken deployed to: ${contractAddress}`);
  
  // Get deployment transaction details
  const deployTx = contract.deploymentTransaction();
  console.log(`Transaction hash: ${deployTx.hash}`);
  console.log(`Gas used: ${deployTx.gasLimit}`);
  console.log(`Gas price: ${hre.ethers.formatUnits(deployTx.gasPrice, "gwei")} gwei`);
  
  // Verify initial state
  const name = await contract.name();
  const symbol = await contract.symbol();
  const totalSupply = await contract.totalSupply();
  const decimals = await contract.decimals();
  const owner = await contract.owner();
  
  console.log("\n=== Contract Details ===");
  console.log(`Name: ${name}`);
  console.log(`Symbol: ${symbol}`);
  console.log(`Decimals: ${decimals}`);
  console.log(`Total Supply: ${hre.ethers.formatEther(totalSupply)} SWF`);
  console.log(`Owner: ${owner}`);
  console.log(`Initial holder balance: ${hre.ethers.formatEther(await contract.balanceOf(deployer.address))} SWF`);
  
  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    contractAddress: contractAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    transactionHash: deployTx.hash,
    gasUsed: deployTx.gasLimit.toString(),
    gasPrice: hre.ethers.formatUnits(deployTx.gasPrice, "gwei") + " gwei",
    contractDetails: {
      name: name,
      symbol: symbol,
      decimals: Number(decimals),
      totalSupply: hre.ethers.formatEther(totalSupply) + " SWF",
      owner: owner
    }
  };
  
  console.log("\n=== Deployment Summary ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  // If on BSC mainnet, show BSCScan link
  if (network.config.chainId === 56) {
    console.log(`\nView on BSCScan: https://bscscan.com/address/${contractAddress}`);
    console.log(`Transaction: https://bscscan.com/tx/${deployTx.hash}`);
    
    console.log("\n=== Verification Command ===");
    console.log(`npx hardhat verify --network bscMainnet ${contractAddress}`);
  }
  
  // Update environment variables for integration
  console.log("\n=== Integration Instructions ===");
  console.log("Add to .env file:");
  console.log(`SWF_TOKEN_CONTRACT=${contractAddress}`);
  console.log(`CONTRACT_ADDRESS=${contractAddress}`);
  
  return {
    contractAddress,
    deploymentInfo
  };
}

// Execute deployment with proper error handling
main()
  .then((result) => {
    console.log(`\nDeployment successful! SWF Token address: ${result.contractAddress}`);
    process.exitCode = 0;
  })
  .catch((error) => {
    console.error("Deployment failed:");
    console.error(error);
    process.exitCode = 1;
  });