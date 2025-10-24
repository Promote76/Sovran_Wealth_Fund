const { ethers } = require("hardhat");

async function main() {
  console.log("🏭 Deploying VaultFactory to BSC Mainnet...\n");

  // Configuration
  const SWF_TOKEN = "0x83E17aeB148d9b4b7Be0Be7C87dd73531a5a5738"; // Default reward token

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "BNB\n");

  // Deploy VaultFactory
  console.log("🚀 Deploying VaultFactory...");
  const VaultFactory = await ethers.getContractFactory("VaultFactory");
  const factory = await VaultFactory.deploy(SWF_TOKEN);
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("✅ VaultFactory deployed to:", factoryAddress);
  console.log("🪙 Default reward token:", SWF_TOKEN, "(SWF)\n");

  // Example: Create first vault for SWF-WBNB LP
  const SWF_WBNB_LP = "0x3aA970cD91f792427CF28Bc687B4713Ee26e2090";
  const REWARD_RATE = ethers.parseEther("0.00001"); // ~31.5% APY
  const LOCK_PERIOD = 7 * 24 * 60 * 60; // 7 days
  const MINIMUM_STAKE = ethers.parseEther("0.1"); // 0.1 LP tokens

  console.log("🏗️  Creating first vault for SWF-WBNB LP...");
  const tx = await factory.createVault(
    SWF_WBNB_LP,
    REWARD_RATE,
    LOCK_PERIOD,
    MINIMUM_STAKE
  );
  
  const receipt = await tx.wait();
  
  // Get vault address from event
  const event = receipt.logs.find(
    log => log.fragment && log.fragment.name === 'VaultCreated'
  );
  
  let vaultAddress;
  if (event) {
    vaultAddress = event.args.vault;
    console.log("✅ First vault created at:", vaultAddress);
  } else {
    // Fallback: query from factory
    vaultAddress = await factory.getVault(SWF_WBNB_LP);
    console.log("✅ First vault deployed at:", vaultAddress);
  }

  // Get vault stats
  const LiquidityRewardsVault = await ethers.getContractFactory("LiquidityRewardsVault");
  const vault = LiquidityRewardsVault.attach(vaultAddress);
  
  const apy = await vault.calculateAPY();
  console.log("📊 Vault APY:", (Number(apy) / 100).toFixed(2), "%");
  console.log("🔒 Lock period:", LOCK_PERIOD / 86400, "days");
  console.log("💎 Minimum stake:", ethers.formatEther(MINIMUM_STAKE), "LP tokens\n");

  // Save deployment info
  const fs = require('fs');
  const deploymentInfo = {
    network: "BSC Mainnet",
    timestamp: new Date().toISOString(),
    factory: {
      address: factoryAddress,
      defaultRewardToken: SWF_TOKEN,
      vaultCount: 1
    },
    vaults: [
      {
        lpToken: SWF_WBNB_LP,
        lpTokenName: "SWF-WBNB LP",
        address: vaultAddress,
        rewardRate: REWARD_RATE.toString(),
        lockPeriod: LOCK_PERIOD,
        minimumStake: MINIMUM_STAKE.toString(),
        apy: (Number(apy) / 100).toFixed(2)
      }
    ]
  };

  const filename = 'vault-factory-deployment.json';
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment info saved to:", filename, "\n");

  console.log("📋 Next Steps:");
  console.log("1. Verify factory on BSCScan:");
  console.log(`   npx hardhat verify --network bsc ${factoryAddress} "${SWF_TOKEN}"`);
  console.log("\n2. Verify first vault on BSCScan:");
  console.log(`   npx hardhat verify --network bsc ${vaultAddress} "${SWF_WBNB_LP}" "${SWF_TOKEN}" "${REWARD_RATE}" "${LOCK_PERIOD}" "${MINIMUM_STAKE}"`);
  console.log("\n3. Fund vault with rewards:");
  console.log(`   Transfer SWF to vault: ${vaultAddress}`);
  console.log("\n4. Create more vaults:");
  console.log(`   factory.createVault(lpToken, rewardRate, lockPeriod, minimumStake)`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
