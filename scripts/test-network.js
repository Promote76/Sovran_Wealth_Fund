const hre = require("hardhat");

async function main() {
  try {
    console.log("Testing BSC Mainnet connection...");
    console.log(`Network: ${hre.network.name}`);
    console.log(`Chain ID: ${hre.network.config.chainId}`);
    
    // Get the provider
    const provider = hre.ethers.provider;
    
    // Test network connection
    const network = await provider.getNetwork();
    console.log(`Connected to chain ID: ${network.chainId}`);
    
    // Get latest block
    const blockNumber = await provider.getBlockNumber();
    console.log(`Latest block: ${blockNumber}`);
    
    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);
    
    // Check balance
    const balance = await provider.getBalance(deployer.address);
    console.log(`Balance: ${hre.ethers.formatEther(balance)} BNB`);
    
    console.log("✅ Network connection successful!");
    
  } catch (error) {
    console.error("❌ Network connection failed:");
    console.error(error.message);
    process.exitCode = 1;
  }
}

main();