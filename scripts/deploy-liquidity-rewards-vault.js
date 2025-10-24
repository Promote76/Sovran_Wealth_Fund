const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying LiquidityRewardsVault to BSC Mainnet...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "BNB\n");

  // Contract addresses on BSC Mainnet
  const LP_TOKEN = "0x3aA970cD91f792427CF28Bc687B4713Ee26e2090"; // SWF-WBNB V2 LP pair
  const REWARD_TOKEN = "0x83E17aeB148d9b4b7Be0BE7C87dd73531a5a5738"; // SWF token
  
  // Staking parameters
  const REWARD_RATE = ethers.utils.parseEther("0.00001"); // ~0.00001 SWF per second per token staked
  // This equals roughly: 0.864 SWF per day per token = 315 SWF per year per token
  // For 100 LP tokens staked = 31,500 SWF/year = ~31.5% APY
  
  const LOCK_PERIOD = 7 * 24 * 60 * 60; // 7 days in seconds
  const MINIMUM_STAKE = ethers.utils.parseEther("0.1"); // 0.1 LP tokens minimum

  console.log("📋 Deployment Parameters:");
  console.log("   LP Token:", LP_TOKEN);
  console.log("   Reward Token:", REWARD_TOKEN);
  console.log("   Reward Rate:", ethers.utils.formatEther(REWARD_RATE), "per second per token");
  console.log("   Lock Period:", LOCK_PERIOD / 86400, "days");
  console.log("   Minimum Stake:", ethers.utils.formatEther(MINIMUM_STAKE), "LP tokens\n");

  // Deploy contract
  const LiquidityRewardsVault = await ethers.getContractFactory("LiquidityRewardsVault");
  
  console.log("⏳ Deploying contract...");
  const vault = await LiquidityRewardsVault.deploy(
    LP_TOKEN,
    REWARD_TOKEN,
    REWARD_RATE,
    LOCK_PERIOD,
    MINIMUM_STAKE
  );

  await vault.deployed();
  
  console.log("✅ LiquidityRewardsVault deployed to:", vault.address);
  console.log("🔗 View on BSCScan:", `https://bscscan.com/address/${vault.address}\n`);

  // Calculate estimated APY
  const apy = await vault.calculateAPY();
  console.log("📊 Current APY:", (apy / 100).toFixed(2), "%");

  // Verification info
  console.log("\n📝 Contract Verification Info:");
  console.log("   Constructor Arguments:");
  console.log("   [");
  console.log(`     "${LP_TOKEN}",`);
  console.log(`     "${REWARD_TOKEN}",`);
  console.log(`     "${REWARD_RATE.toString()}",`);
  console.log(`     "${LOCK_PERIOD}",`);
  console.log(`     "${MINIMUM_STAKE.toString()}"`);
  console.log("   ]");

  console.log("\n⚠️  IMPORTANT NEXT STEPS:");
  console.log("   1. Fund the vault with reward tokens:");
  console.log(`      vault.fundRewards(amount)`);
  console.log("   2. Update client/src/config/contracts.ts:");
  console.log(`      LIQUIDITY_VAULT: '${vault.address}'`);
  console.log("   3. Verify contract on BSCScan");
  console.log("   4. Test stake/withdraw/claim functions");
  console.log("   5. Consider migrating users from old vault\n");

  // Save deployment info
  const deployment = {
    network: "bsc-mainnet",
    contractAddress: vault.address,
    lpToken: LP_TOKEN,
    rewardToken: REWARD_TOKEN,
    rewardRate: REWARD_RATE.toString(),
    lockPeriod: LOCK_PERIOD,
    minimumStake: MINIMUM_STAKE.toString(),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    estimatedAPY: (apy / 100).toFixed(2) + "%"
  };

  const fs = require('fs');
  fs.writeFileSync(
    'liquidity-rewards-vault-deployment.json',
    JSON.stringify(deployment, null, 2)
  );

  console.log("💾 Deployment info saved to: liquidity-rewards-vault-deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
