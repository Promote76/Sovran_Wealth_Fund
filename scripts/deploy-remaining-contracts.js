const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function deployAndWait(contractName, args, description) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📦 Deploying: ${contractName}`);
  console.log(`   ${description}`);
  console.log("=".repeat(60));
  
  try {
    const Factory = await hre.ethers.getContractFactory(contractName);
    console.log("✓ Contract factory created");
    
    console.log("⏳ Sending deployment transaction...");
    const contract = await Factory.deploy(...args);
    console.log("✓ Transaction sent");
    
    console.log("⏳ Waiting for deployment confirmation (this may take 30-60 seconds)...");
    
    // Wait for deployment with timeout
    const deploymentPromise = contract.waitForDeployment();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout waiting for deployment")), 120000)
    );
    
    await Promise.race([deploymentPromise, timeoutPromise]);
    
    const address = await contract.getAddress();
    console.log("\n✅ SUCCESS!");
    console.log(`   Contract: ${contractName}`);
    console.log(`   Address: ${address}`);
    console.log(`   🔗 https://bscscan.com/address/${address}`);
    
    return { success: true, address, contractName };
  } catch (error) {
    console.log(`\n❌ FAILED: ${error.message}`);
    return { success: false, error: error.message, contractName };
  }
}

async function main() {
  console.log("\n⚡ AXIOM - Deploy Remaining 4 Contracts");
  console.log("========================================\n");

  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  
  console.log("Deployer:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "BNB");
  
  const AXM_TOKEN = "0x83E17aeB148d9b4b7Be0Be7C87dd73531a5a5738";
  const BASKET_INDEX = "0x06b88f3Faa07215F6f5fb0A10A3F058D3f25ecF6";
  const EXISTING_STAKING = "0x0165878A594ca255338adfa4d48449f69242Eb8F";
  
  const deployments = [];

  // 1. AdvancedStaking
  const advStaking = await deployAndWait(
    "AdvancedStaking",
    [AXM_TOKEN, AXM_TOKEN],
    "Multi-tier NFT staking with governance"
  );
  if (advStaking.success) deployments.push(advStaking);
  
  // Wait 10 seconds between deployments
  console.log("\n⏸️  Waiting 10 seconds before next deployment...\n");
  await new Promise(resolve => setTimeout(resolve, 10000));

  // 2. EnhancedNFTMarketplace
  const nftMarket = await deployAndWait(
    "EnhancedNFTMarketplace",
    [deployer.address],
    "NFT marketplace with auctions and royalties"
  );
  if (nftMarket.success) deployments.push(nftMarket);
  
  console.log("\n⏸️  Waiting 10 seconds before next deployment...\n");
  await new Promise(resolve => setTimeout(resolve, 10000));

  // 3. CombinedStakingContracts
  const combStaking = await deployAndWait(
    "CombinedStakingContracts",
    [AXM_TOKEN],
    "Unified multi-pool staking system"
  );
  if (combStaking.success) deployments.push(combStaking);
  
  console.log("\n⏸️  Waiting 10 seconds before next deployment...\n");
  await new Promise(resolve => setTimeout(resolve, 10000));

  // 4. DynamicAPRController
  const aprController = await deployAndWait(
    "DynamicAPRController",
    [BASKET_INDEX, EXISTING_STAKING, 1500, deployer.address],
    "Automatic APR adjustment (10-30%)"
  );
  if (aprController.success) deployments.push(aprController);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("✅ DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
  console.log(`\n✅ Successfully deployed: ${deployments.length}/4 contracts\n`);
  
  deployments.forEach((dep, i) => {
    console.log(`${i + 1}. ${dep.contractName}`);
    console.log(`   ${dep.address}`);
    console.log(`   https://bscscan.com/address/${dep.address}\n`);
  });

  // Save
  const data = {
    network: "bsc",
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    deployments,
    existing: { AXM_TOKEN, BASKET_INDEX, EXISTING_STAKING }
  };
  
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir, { recursive: true });
  
  fs.writeFileSync(
    path.join(deploymentsDir, `remaining-contracts-${Date.now()}.json`),
    JSON.stringify(data, null, 2)
  );
  
  console.log("💾 Deployment data saved\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Critical error:", error);
    process.exit(1);
  });
