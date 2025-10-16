const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("\n🔍 VERIFYING 5 SMART CONTRACTS ON BSCSCAN");
  console.log("=".repeat(70));

  // Load deployment data
  if (!fs.existsSync("deployment-all-5-contracts.json")) {
    console.error("❌ Deployment file not found. Deploy contracts first!");
    process.exit(1);
  }

  const deploymentData = JSON.parse(fs.readFileSync("deployment-all-5-contracts.json", "utf8"));
  const contracts = deploymentData.contracts;

  // You'll need to provide the actual constructor arguments
  const NFT_CONTRACT = "0x0000000000000000000000000000000000000001"; // REPLACE
  const REWARD_TOKEN = "0x83E17aeB148d9b4b7Be0Be7C87dd73531a5a5738";
  const BASKET_NAME = "SWF Basket Index";
  const BASKET_SYMBOL = "SWFBASKET";
  const LP_TOKEN = "0x0000000000000000000000000000000000000002"; // REPLACE
  const SWF_TOKEN = "0x83E17aeB148d9b4b7Be0Be7C87dd73531a5a5738";
  const REWARD_RATE = "100000000000000000000"; // 100 * 10^18
  const VAULT_ADDRESS = "0x0000000000000000000000000000000000000003"; // REPLACE
  const BASKET_VAULT = "0x0000000000000000000000000000000000000004"; // REPLACE
  const SOLO_METHOD_ENGINE_V2 = "0x0000000000000000000000000000000000000005"; // REPLACE
  const INITIAL_APR = 2000;
  const DEPLOYER = deploymentData.deployer;
  const FEE_RECIPIENT = DEPLOYER;

  // =============================================================================
  // 1. VERIFY ADVANCED STAKING
  // =============================================================================
  console.log("\n1️⃣  Verifying AdvancedStaking...");
  try {
    await hre.run("verify:verify", {
      address: contracts.advancedStaking,
      constructorArguments: [NFT_CONTRACT, REWARD_TOKEN]
    });
    console.log("✅ AdvancedStaking verified!");
  } catch (error) {
    console.log("⚠️  AdvancedStaking verification:", error.message);
  }

  // =============================================================================
  // 2. VERIFY BASKET INDEX
  // =============================================================================
  console.log("\n2️⃣  Verifying BasketIndex...");
  try {
    await hre.run("verify:verify", {
      address: contracts.basketIndex,
      constructorArguments: [BASKET_NAME, BASKET_SYMBOL]
    });
    console.log("✅ BasketIndex verified!");
  } catch (error) {
    console.log("⚠️  BasketIndex verification:", error.message);
  }

  // =============================================================================
  // 3. VERIFY LIQUIDITY VAULT
  // =============================================================================
  console.log("\n3️⃣  Verifying LiquidityVault...");
  try {
    await hre.run("verify:verify", {
      address: contracts.liquidityVault,
      constructorArguments: [LP_TOKEN],
      contract: "contracts/CombinedStakingContracts.sol:LiquidityVault"
    });
    console.log("✅ LiquidityVault verified!");
  } catch (error) {
    console.log("⚠️  LiquidityVault verification:", error.message);
  }

  // =============================================================================
  // 4. VERIFY GOVERNANCE DIVIDEND POOL
  // =============================================================================
  console.log("\n4️⃣  Verifying GovernanceDividendPool...");
  try {
    await hre.run("verify:verify", {
      address: contracts.governancePool,
      constructorArguments: [SWF_TOKEN, REWARD_RATE],
      contract: "contracts/CombinedStakingContracts.sol:GovernanceDividendPool"
    });
    console.log("✅ GovernanceDividendPool verified!");
  } catch (error) {
    console.log("⚠️  GovernanceDividendPool verification:", error.message);
  }

  // =============================================================================
  // 5. VERIFY SWF VAULT ADAPTER
  // =============================================================================
  console.log("\n5️⃣  Verifying SWFVaultAdapter...");
  try {
    await hre.run("verify:verify", {
      address: contracts.vaultAdapter,
      constructorArguments: [SWF_TOKEN, VAULT_ADDRESS],
      contract: "contracts/CombinedStakingContracts.sol:SWFVaultAdapter"
    });
    console.log("✅ SWFVaultAdapter verified!");
  } catch (error) {
    console.log("⚠️  SWFVaultAdapter verification:", error.message);
  }

  // =============================================================================
  // 6. VERIFY DYNAMIC APR CONTROLLER
  // =============================================================================
  console.log("\n6️⃣  Verifying DynamicAPRController...");
  try {
    await hre.run("verify:verify", {
      address: contracts.aprController,
      constructorArguments: [BASKET_VAULT, SOLO_METHOD_ENGINE_V2, INITIAL_APR, DEPLOYER]
    });
    console.log("✅ DynamicAPRController verified!");
  } catch (error) {
    console.log("⚠️  DynamicAPRController verification:", error.message);
  }

  // =============================================================================
  // 7. VERIFY ENHANCED NFT MARKETPLACE
  // =============================================================================
  console.log("\n7️⃣  Verifying EnhancedNFTMarketplace...");
  try {
    await hre.run("verify:verify", {
      address: contracts.nftMarketplace,
      constructorArguments: [FEE_RECIPIENT]
    });
    console.log("✅ EnhancedNFTMarketplace verified!");
  } catch (error) {
    console.log("⚠️  EnhancedNFTMarketplace verification:", error.message);
  }

  console.log("\n" + "=".repeat(70));
  console.log("✅ VERIFICATION PROCESS COMPLETE!");
  console.log("=".repeat(70));
  console.log("\nCheck BSCScan for verified contract source code:");
  console.log("https://bscscan.com/address/" + contracts.advancedStaking);
  console.log("https://bscscan.com/address/" + contracts.basketIndex);
  console.log("https://bscscan.com/address/" + contracts.liquidityVault);
  console.log("https://bscscan.com/address/" + contracts.governancePool);
  console.log("https://bscscan.com/address/" + contracts.vaultAdapter);
  console.log("https://bscscan.com/address/" + contracts.aprController);
  console.log("https://bscscan.com/address/" + contracts.nftMarketplace);
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ VERIFICATION FAILED:", error);
    process.exit(1);
  });
