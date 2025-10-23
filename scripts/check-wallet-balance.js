const { ethers } = require("hardhat");

async function main() {
  console.log("========================================");
  console.log("💰 Checking Wallet Balances on BSC");
  console.log("========================================\n");

  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
  
  // User's wallet
  const userWallet = "0xE3059F3479AAC2846299664BABe1d5D95C18D1C7";
  const userBalance = await provider.getBalance(userWallet);
  
  // Current deployer wallet
  const deployerWallet = "0xEcDdb7dFF2f61E1caC7AC767337A38E1aD851eD6";
  const deployerBalance = await provider.getBalance(deployerWallet);
  
  console.log("📊 Your Wallet:");
  console.log("├─ Address:", userWallet);
  console.log("├─ Balance:", ethers.formatEther(userBalance), "BNB");
  console.log("");
  
  console.log("📊 Current Deployer Wallet:");
  console.log("├─ Address:", deployerWallet);
  console.log("├─ Balance:", ethers.formatEther(deployerBalance), "BNB");
  console.log("");
  
  if (parseFloat(ethers.formatEther(userBalance)) > 0) {
    console.log("✅ Your wallet has BNB!");
    console.log("");
    console.log("🔄 Next Steps:");
    console.log("Option 1: Transfer 0.05-0.1 BNB from your wallet to deployer:");
    console.log(`   To: ${deployerWallet}`);
    console.log("");
    console.log("Option 2: Update PRIVATE_KEY secret to use your wallet's private key");
    console.log("   (More secure - you control the deployer address)");
    console.log("");
  } else {
    console.log("⚠️  Your wallet appears to have 0 BNB");
    console.log("   Please add BNB to:", userWallet);
    console.log("");
  }
  
  console.log("========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
