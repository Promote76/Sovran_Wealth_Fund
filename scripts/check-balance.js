const hre = require("hardhat");

async function main() {
  console.log("========================================");
  console.log("💰 BSC Wallet Balance Checker");
  console.log("========================================\n");

  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  const balanceBNB = hre.ethers.formatEther(balance);
  
  console.log("📋 Wallet Information:");
  console.log("├─ Network:", hre.network.name);
  console.log("├─ Chain ID:", network.chainId);
  console.log("├─ Wallet Address:", deployer.address);
  console.log("├─ BNB Balance:", balanceBNB, "BNB");
  console.log("└─ Balance (Wei):", balance.toString());
  console.log("");

  const balanceNum = parseFloat(balanceBNB);
  
  if (balanceNum === 0) {
    console.log("❌ No BNB Found!");
    console.log("   You need BNB to deploy contracts and pay for gas fees.");
    console.log("");
    console.log("💡 How to get BNB:");
    console.log("   1. Send BNB to your wallet address:", deployer.address);
    console.log("   2. Use a crypto exchange (Binance, Coinbase, etc.)");
    console.log("   3. Use a bridge if you have tokens on other chains");
    console.log("");
  } else if (balanceNum < 0.01) {
    console.log("⚠️  Low BNB Balance!");
    console.log("   Recommended: At least 0.05 BNB for safe deployment");
    console.log("   Current balance may only cover 1-2 small deployments");
    console.log("");
  } else if (balanceNum < 0.05) {
    console.log("⚠️  Moderate BNB Balance");
    console.log("   You have enough for a few deployments");
    console.log("   Recommended: Add more BNB for multiple contracts");
    console.log("");
  } else {
    console.log("✅ Good BNB Balance!");
    console.log("   You have enough BNB to deploy multiple contracts");
    console.log("");
  }

  console.log("📊 Estimated Deployment Costs:");
  console.log("├─ Simple Token: ~0.01-0.02 BNB");
  console.log("├─ Staking Contract: ~0.02-0.03 BNB");
  console.log("├─ Vault Contract: ~0.02-0.03 BNB");
  console.log("└─ Full System (4 contracts): ~0.08-0.12 BNB");
  console.log("");
  
  const estimatedDeployments = Math.floor(balanceNum / 0.02);
  console.log(`💡 With current balance, you can deploy approximately ${estimatedDeployments} contracts`);
  console.log("");
  
  console.log("🔗 View on BSCScan:");
  console.log(`   https://bscscan.com/address/${deployer.address}`);
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:");
    console.error(error);
    process.exit(1);
  });
