const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("\n🚀 DEPLOYING 5 SMART CONTRACTS TO BSC MAINNET");
  console.log("=".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log("\n📍 Deploying from account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "BNB");
  
  if (balance < ethers.parseEther("0.05")) {
    console.error("❌ Insufficient BNB for deployment. Need at least 0.05 BNB");
    process.exit(1);
  }

  const deployedContracts = {};

  // =============================================================================
  // 1. DEPLOY ADVANCED STAKING
  // =============================================================================
  console.log("\n" + "=".repeat(70));
  console.log("1️⃣  DEPLOYING ADVANCED STAKING");
  console.log("=".repeat(70));
  
  // You'll need to provide these addresses - using placeholders for now
  const NFT_CONTRACT = "0x0000000000000000000000000000000000000001"; // REPLACE WITH REAL NFT CONTRACT
  const REWARD_TOKEN = "0x83E17aeB148d9b4b7Be0Be7C87dd73531a5a5738"; // SWF Token BSC Mainnet
  
  console.log("📝 Constructor params:");
  console.log("   - NFT Contract:", NFT_CONTRACT);
  console.log("   - Reward Token:", REWARD_TOKEN);
  
  const AdvancedStaking = await ethers.getContractFactory("AdvancedStaking");
  const advancedStaking = await AdvancedStaking.deploy(NFT_CONTRACT, REWARD_TOKEN);
  await advancedStaking.waitForDeployment();
  deployedContracts.advancedStaking = await advancedStaking.getAddress();
  
  console.log("✅ AdvancedStaking deployed to:", deployedContracts.advancedStaking);

  // =============================================================================
  // 2. DEPLOY BASKET INDEX
  // =============================================================================
  console.log("\n" + "=".repeat(70));
  console.log("2️⃣  DEPLOYING BASKET INDEX");
  console.log("=".repeat(70));
  
  const BASKET_NAME = "SWF Basket Index";
  const BASKET_SYMBOL = "SWFBASKET";
  
  console.log("📝 Constructor params:");
  console.log("   - Name:", BASKET_NAME);
  console.log("   - Symbol:", BASKET_SYMBOL);
  
  const BasketIndex = await ethers.getContractFactory("BasketIndex");
  const basketIndex = await BasketIndex.deploy(BASKET_NAME, BASKET_SYMBOL);
  await basketIndex.waitForDeployment();
  deployedContracts.basketIndex = await basketIndex.getAddress();
  
  console.log("✅ BasketIndex deployed to:", deployedContracts.basketIndex);

  // =============================================================================
  // 3. DEPLOY COMBINED STAKING CONTRACTS (3 contracts in one file)
  // =============================================================================
  console.log("\n" + "=".repeat(70));
  console.log("3️⃣  DEPLOYING COMBINED STAKING CONTRACTS");
  console.log("=".repeat(70));
  
  const LP_TOKEN = "0x0000000000000000000000000000000000000002"; // REPLACE WITH REAL LP TOKEN
  const SWF_TOKEN = "0x83E17aeB148d9b4b7Be0Be7C87dd73531a5a5738"; // SWF Token BSC Mainnet
  const REWARD_RATE = ethers.parseEther("100"); // 100 tokens per 30 days
  const VAULT_ADDRESS = "0x0000000000000000000000000000000000000003"; // REPLACE WITH REAL VAULT
  
  // Deploy LiquidityVault
  console.log("\n📦 Deploying LiquidityVault...");
  console.log("   - LP Token:", LP_TOKEN);
  const LiquidityVault = await ethers.getContractFactory("LiquidityVault");
  const liquidityVault = await LiquidityVault.deploy(LP_TOKEN);
  await liquidityVault.waitForDeployment();
  deployedContracts.liquidityVault = await liquidityVault.getAddress();
  console.log("✅ LiquidityVault deployed to:", deployedContracts.liquidityVault);
  
  // Deploy GovernanceDividendPool
  console.log("\n📦 Deploying GovernanceDividendPool...");
  console.log("   - SWF Token:", SWF_TOKEN);
  console.log("   - Reward Rate:", ethers.formatEther(REWARD_RATE), "per 30 days");
  console.log("⚠️  NOTE: Contract needs BNB funding for rewards after deployment!");
  const GovernanceDividendPool = await ethers.getContractFactory("GovernanceDividendPool");
  const governancePool = await GovernanceDividendPool.deploy(SWF_TOKEN, REWARD_RATE);
  await governancePool.waitForDeployment();
  deployedContracts.governancePool = await governancePool.getAddress();
  console.log("✅ GovernanceDividendPool deployed to:", deployedContracts.governancePool);
  
  // Deploy SWFVaultAdapter
  console.log("\n📦 Deploying SWFVaultAdapter...");
  console.log("   - SWF Token:", SWF_TOKEN);
  console.log("   - Vault:", VAULT_ADDRESS);
  const SWFVaultAdapter = await ethers.getContractFactory("SWFVaultAdapter");
  const vaultAdapter = await SWFVaultAdapter.deploy(SWF_TOKEN, VAULT_ADDRESS);
  await vaultAdapter.waitForDeployment();
  deployedContracts.vaultAdapter = await vaultAdapter.getAddress();
  console.log("✅ SWFVaultAdapter deployed to:", deployedContracts.vaultAdapter);

  // =============================================================================
  // 4. DEPLOY DYNAMIC APR CONTROLLER
  // =============================================================================
  console.log("\n" + "=".repeat(70));
  console.log("4️⃣  DEPLOYING DYNAMIC APR CONTROLLER");
  console.log("=".repeat(70));
  
  // These contracts should already be deployed on BSC
  const BASKET_VAULT = "0x0000000000000000000000000000000000000004"; // REPLACE WITH SWFBasketVault address
  const SOLO_METHOD_ENGINE_V2 = "0x0000000000000000000000000000000000000005"; // REPLACE WITH SoloMethodEngineV2 address
  const INITIAL_APR = 2000; // 20% APR in basis points
  
  console.log("📝 Constructor params:");
  console.log("   - Basket Vault:", BASKET_VAULT);
  console.log("   - Staking Contract:", SOLO_METHOD_ENGINE_V2);
  console.log("   - Initial APR:", INITIAL_APR / 100, "%");
  console.log("   - Owner:", deployer.address);
  console.log("⚠️  NOTE: This contract needs APR_MANAGER_ROLE granted on SoloMethodEngineV2!");
  
  const DynamicAPRController = await ethers.getContractFactory("DynamicAPRController");
  const aprController = await DynamicAPRController.deploy(
    BASKET_VAULT,
    SOLO_METHOD_ENGINE_V2,
    INITIAL_APR,
    deployer.address
  );
  await aprController.waitForDeployment();
  deployedContracts.aprController = await aprController.getAddress();
  
  console.log("✅ DynamicAPRController deployed to:", deployedContracts.aprController);

  // =============================================================================
  // 5. DEPLOY ENHANCED NFT MARKETPLACE
  // =============================================================================
  console.log("\n" + "=".repeat(70));
  console.log("5️⃣  DEPLOYING ENHANCED NFT MARKETPLACE");
  console.log("=".repeat(70));
  
  const FEE_RECIPIENT = deployer.address; // Can be changed later
  
  console.log("📝 Constructor params:");
  console.log("   - Fee Recipient:", FEE_RECIPIENT);
  
  const EnhancedNFTMarketplace = await ethers.getContractFactory("EnhancedNFTMarketplace");
  const nftMarketplace = await EnhancedNFTMarketplace.deploy(FEE_RECIPIENT);
  await nftMarketplace.waitForDeployment();
  deployedContracts.nftMarketplace = await nftMarketplace.getAddress();
  
  console.log("✅ EnhancedNFTMarketplace deployed to:", deployedContracts.nftMarketplace);

  // =============================================================================
  // DEPLOYMENT SUMMARY
  // =============================================================================
  console.log("\n" + "=".repeat(70));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(70));
  
  console.log("\n📋 CONTRACT ADDRESSES:\n");
  console.log("1. AdvancedStaking:          ", deployedContracts.advancedStaking);
  console.log("2. BasketIndex:              ", deployedContracts.basketIndex);
  console.log("3. LiquidityVault:           ", deployedContracts.liquidityVault);
  console.log("4. GovernanceDividendPool:   ", deployedContracts.governancePool);
  console.log("5. SWFVaultAdapter:          ", deployedContracts.vaultAdapter);
  console.log("6. DynamicAPRController:     ", deployedContracts.aprController);
  console.log("7. EnhancedNFTMarketplace:   ", deployedContracts.nftMarketplace);
  
  console.log("\n⚠️  POST-DEPLOYMENT ACTIONS REQUIRED:");
  console.log("=".repeat(70));
  console.log("1. Grant APR_MANAGER_ROLE to DynamicAPRController on SoloMethodEngineV2");
  console.log("2. Fund GovernanceDividendPool with BNB for reward distribution");
  console.log("3. Set basket assets and weights on BasketIndex");
  console.log("4. Configure NFT contract address on AdvancedStaking (if placeholder used)");
  console.log("5. Verify all contracts on BSCScan");
  
  // Save deployment info to file
  const fs = require("fs");
  const deploymentData = {
    network: "BSC Mainnet",
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: deployedContracts
  };
  
  fs.writeFileSync(
    "deployment-all-5-contracts.json",
    JSON.stringify(deploymentData, null, 2)
  );
  console.log("\n💾 Deployment data saved to deployment-all-5-contracts.json");
  
  console.log("\n✨ Next step: Run verification script");
  console.log("npx hardhat run scripts/verify-all-5-contracts.js --network bsc\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ DEPLOYMENT FAILED:", error);
    process.exit(1);
  });
