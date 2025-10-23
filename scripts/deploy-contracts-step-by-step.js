const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function deployContract(contractName, args = [], description = "") {
  console.log(`\n📦 Deploying ${contractName}...`);
  if (description) console.log(`   ${description}`);
  
  try {
    const Contract = await hre.ethers.getContractFactory(contractName);
    
    // Deploy with explicit gas settings
    const contract = await Contract.deploy(...args, {
      gasLimit: 5000000, // 5M gas limit
      gasPrice: ethers.parseUnits("3", "gwei") // 3 gwei
    });
    
    console.log(`   ⏳ Transaction sent, waiting for confirmation...`);
    
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    const txHash = contract.deploymentTransaction()?.hash;
    
    console.log(`   ✅ Deployed at: ${address}`);
    console.log(`   📋 TX Hash: ${txHash}`);
    console.log(`   🔗 BSCScan: https://bscscan.com/address/${address}`);
    
    return {
      success: true,
      address,
      txHash,
      args
    };
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

async function main() {
  console.log("========================================");
  console.log("⚡ AXIOM PROTOCOL - BSC DEPLOYMENT");
  console.log("========================================\n");

  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  
  console.log("📋 Deployment Information:");
  console.log("├─ Network:", hre.network.name);
  console.log("├─ Chain ID:", (await hre.ethers.provider.getNetwork()).chainId);
  console.log("├─ Deployer:", deployer.address);
  console.log("├─ Balance:", hre.ethers.formatEther(balance), "BNB");
  console.log("");

  const AXM_TOKEN = "0x83E17aeB148d9b4b7Be0Be7C87dd73531a5a5738";
  const EXISTING_STAKING = "0x0165878A594ca255338adfa4d48449f69242Eb8F";
  const EXISTING_BASKET_VAULT = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";
  
  console.log("🪙 Using existing AXM Token:", AXM_TOKEN);
  console.log("");

  const deployments = {};

  // 1. BasketIndex
  const basketIndex = await deployContract(
    "BasketIndex",
    ["AXIOM Basket Index", "AXM-BASKET"],
    "Multi-token weighted basket"
  );
  if (basketIndex.success) deployments.BasketIndex = basketIndex;

  // 2. AdvancedStaking
  const advancedStaking = await deployContract(
    "AdvancedStaking",
    [AXM_TOKEN, AXM_TOKEN],
    "Multi-tier NFT staking with governance"
  );
  if (advancedStaking.success) deployments.AdvancedStaking = advancedStaking;

  // 3. EnhancedNFTMarketplace
  const nftMarketplace = await deployContract(
    "EnhancedNFTMarketplace",
    [deployer.address],
    "NFT marketplace with auctions"
  );
  if (nftMarketplace.success) deployments.EnhancedNFTMarketplace = nftMarketplace;

  // 4. DynamicAPRController
  const basketVaultAddr = basketIndex.success ? basketIndex.address : EXISTING_BASKET_VAULT;
  const aprController = await deployContract(
    "DynamicAPRController",
    [basketVaultAddr, EXISTING_STAKING, 1500, deployer.address],
    "Automatic APR adjustment (10-30%)"
  );
  if (aprController.success) deployments.DynamicAPRController = aprController;

  // 5. CombinedStakingContracts
  const combinedStaking = await deployContract(
    "CombinedStakingContracts",
    [AXM_TOKEN],
    "Unified multi-pool staking"
  );
  if (combinedStaking.success) deployments.CombinedStakingContracts = combinedStaking;

  // Summary
  console.log("\n========================================");
  console.log("✅ DEPLOYMENT SUMMARY");
  console.log("========================================\n");
  
  const successful = Object.keys(deployments).length;
  console.log(`✅ Successfully deployed: ${successful}/5 contracts\n`);
  
  Object.entries(deployments).forEach(([name, data]) => {
    console.log(`${name}:`);
    console.log(`  Address: ${data.address}`);
    console.log(`  BSCScan: https://bscscan.com/address/${data.address}`);
    console.log("");
  });

  // Save deployment data
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentData = {
    network: hre.network.name,
    chainId: Number((await hre.ethers.provider.getNetwork()).chainId),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: deployments,
    references: {
      AXM_TOKEN,
      EXISTING_STAKING,
      EXISTING_BASKET_VAULT
    }
  };

  const filename = `axiom-deployment-${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentData, null, 2));
  
  console.log("💾 Deployment saved to:", filename);
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Critical error:");
    console.error(error);
    process.exit(1);
  });
