const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

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

  if (parseFloat(hre.ethers.formatEther(balance)) < 0.01) {
    console.log("⚠️  WARNING: Low BNB balance!");
    process.exit(1);
  }

  // Existing AXM Token address
  const AXM_TOKEN = "0x83E17aeB148d9b4b7Be0Be7C87dd73531a5a5738";
  console.log("🪙 Using existing AXM Token:", AXM_TOKEN);
  console.log("");

  const deployedContracts = {
    network: hre.network.name,
    chainId: Number((await hre.ethers.provider.getNetwork()).chainId),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {}
  };

  // ========================================
  // 1. Deploy BasketIndex
  // ========================================
  console.log("📦 [1/5] Deploying BasketIndex...");
  try {
    const BasketIndex = await hre.ethers.getContractFactory("BasketIndex");
    const basketIndex = await BasketIndex.deploy("AXIOM Basket Index", "AXM-BASKET");
    await basketIndex.waitForDeployment();
    const basketIndexAddress = await basketIndex.getAddress();
    
    deployedContracts.contracts.BasketIndex = {
      address: basketIndexAddress,
      name: "AXIOM Basket Index",
      symbol: "AXM-BASKET",
      txHash: basketIndex.deploymentTransaction()?.hash
    };
    
    console.log("✅ BasketIndex deployed:", basketIndexAddress);
    console.log("");
  } catch (error) {
    console.log("❌ BasketIndex deployment failed:", error.message);
    console.log("");
  }

  // ========================================
  // 2. Deploy AdvancedStaking
  // ========================================
  console.log("📦 [2/5] Deploying AdvancedStaking...");
  try {
    // For now, we'll use AXM token as both NFT contract and reward token
    // You can update the NFT contract address later
    const AdvancedStaking = await hre.ethers.getContractFactory("AdvancedStaking");
    const advancedStaking = await AdvancedStaking.deploy(
      AXM_TOKEN, // nftContract (placeholder)
      AXM_TOKEN  // rewardToken
    );
    await advancedStaking.waitForDeployment();
    const advancedStakingAddress = await advancedStaking.getAddress();
    
    deployedContracts.contracts.AdvancedStaking = {
      address: advancedStakingAddress,
      nftContract: AXM_TOKEN,
      rewardToken: AXM_TOKEN,
      txHash: advancedStaking.deploymentTransaction()?.hash
    };
    
    console.log("✅ AdvancedStaking deployed:", advancedStakingAddress);
    console.log("");
  } catch (error) {
    console.log("❌ AdvancedStaking deployment failed:", error.message);
    console.log("");
  }

  // ========================================
  // 3. Deploy EnhancedNFTMarketplace
  // ========================================
  console.log("📦 [3/5] Deploying EnhancedNFTMarketplace...");
  try {
    const EnhancedNFTMarketplace = await hre.ethers.getContractFactory("EnhancedNFTMarketplace");
    const nftMarketplace = await EnhancedNFTMarketplace.deploy(
      deployer.address // feeRecipient
    );
    await nftMarketplace.waitForDeployment();
    const nftMarketplaceAddress = await nftMarketplace.getAddress();
    
    deployedContracts.contracts.EnhancedNFTMarketplace = {
      address: nftMarketplaceAddress,
      feeRecipient: deployer.address,
      txHash: nftMarketplace.deploymentTransaction()?.hash
    };
    
    console.log("✅ EnhancedNFTMarketplace deployed:", nftMarketplaceAddress);
    console.log("");
  } catch (error) {
    console.log("❌ EnhancedNFTMarketplace deployment failed:", error.message);
    console.log("");
  }

  // ========================================
  // 4. Deploy DynamicAPRController
  // ========================================
  console.log("📦 [4/5] Deploying DynamicAPRController...");
  try {
    const DynamicAPRController = await hre.ethers.getContractFactory("DynamicAPRController");
    
    // We need basket vault address - use the one we just deployed or existing one
    const basketVaultAddress = deployedContracts.contracts.BasketIndex?.address || "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";
    const stakingEngineAddress = "0x0165878A594ca255338adfa4d48449f69242Eb8F"; // Existing staking engine
    
    const aprController = await DynamicAPRController.deploy(
      basketVaultAddress,    // basketVault
      stakingEngineAddress,  // stakingContract
      1500,                  // initialAPR (15%)
      deployer.address       // initialOwner
    );
    await aprController.waitForDeployment();
    const aprControllerAddress = await aprController.getAddress();
    
    deployedContracts.contracts.DynamicAPRController = {
      address: aprControllerAddress,
      basketVault: basketVaultAddress,
      stakingContract: stakingEngineAddress,
      initialAPR: 1500,
      txHash: aprController.deploymentTransaction()?.hash
    };
    
    console.log("✅ DynamicAPRController deployed:", aprControllerAddress);
    console.log("");
  } catch (error) {
    console.log("❌ DynamicAPRController deployment failed:", error.message);
    console.log("");
  }

  // ========================================
  // 5. Deploy CombinedStakingContracts
  // ========================================
  console.log("📦 [5/5] Deploying CombinedStakingContracts...");
  try {
    const CombinedStakingContracts = await hre.ethers.getContractFactory("CombinedStakingContracts");
    const combinedStaking = await CombinedStakingContracts.deploy(AXM_TOKEN);
    await combinedStaking.waitForDeployment();
    const combinedStakingAddress = await combinedStaking.getAddress();
    
    deployedContracts.contracts.CombinedStakingContracts = {
      address: combinedStakingAddress,
      stakingToken: AXM_TOKEN,
      txHash: combinedStaking.deploymentTransaction()?.hash
    };
    
    console.log("✅ CombinedStakingContracts deployed:", combinedStakingAddress);
    console.log("");
  } catch (error) {
    console.log("❌ CombinedStakingContracts deployment failed:", error.message);
    console.log("");
  }

  // ========================================
  // Summary
  // ========================================
  console.log("========================================");
  console.log("✅ DEPLOYMENT COMPLETE!");
  console.log("========================================\n");
  
  console.log("📍 Deployed Contracts:");
  Object.entries(deployedContracts.contracts).forEach(([name, data]) => {
    console.log(`├─ ${name}: ${data.address}`);
  });
  console.log("");

  // Save deployment data
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `axiom-contracts-${hre.network.name}-${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deployedContracts, null, 2));
  
  console.log("💾 Deployment data saved to:", filename);
  console.log("");

  console.log("🔍 Next Steps:");
  console.log("1. Verify contracts on BSCScan");
  console.log("2. Update frontend with new addresses");
  console.log("3. Test contract interactions");
  console.log("");
  
  console.log("📋 BSCScan Links:");
  Object.entries(deployedContracts.contracts).forEach(([name, data]) => {
    console.log(`├─ ${name}: https://bscscan.com/address/${data.address}`);
  });
  console.log("");

  return deployedContracts;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment Failed:");
    console.error(error);
    process.exit(1);
  });
