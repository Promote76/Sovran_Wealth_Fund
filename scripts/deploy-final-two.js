const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Manual transaction polling for BSC
async function waitWithFallback(provider, txHash, contractName) {
  console.log(`   TX Hash: ${txHash}`);
  console.log(`   🔗 https://bscscan.com/tx/${txHash}`);
  console.log(`   ⏳ Polling for confirmation...`);
  
  const maxAttempts = 20;
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const receipt = await provider.getTransactionReceipt(txHash);
      
      if (receipt && receipt.contractAddress) {
        console.log(`   ✅ Confirmed after ${(i + 1) * 3}s!`);
        console.log(`   Contract Address: ${receipt.contractAddress}`);
        return receipt.contractAddress;
      }
      
      process.stdout.write(`   Attempt ${i + 1}/${maxAttempts}...\r`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      // Continue polling
    }
  }
  
  throw new Error(`Could not confirm deployment after 60s`);
}

async function deployContract(contractName, args, description) {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`📦 Deploying: ${contractName}`);
  console.log(`   ${description}`);
  console.log("=".repeat(70));
  
  try {
    const [deployer] = await hre.ethers.getSigners();
    const provider = deployer.provider;
    
    const Factory = await hre.ethers.getContractFactory(contractName);
    console.log("✓ Contract factory created");
    
    console.log("⏳ Sending deployment transaction...");
    const deployTx = await Factory.getDeployTransaction(...args);
    
    const tx = await deployer.sendTransaction(deployTx);
    console.log("✓ Transaction sent!");
    
    const contractAddress = await waitWithFallback(provider, tx.hash, contractName);
    
    console.log("\n✅ SUCCESS!");
    console.log(`   Contract: ${contractName}`);
    console.log(`   Address: ${contractAddress}`);
    console.log(`   🔗 https://bscscan.com/address/${contractAddress}`);
    
    return { success: true, address: contractAddress, contractName, txHash: tx.hash };
    
  } catch (error) {
    console.log(`\n❌ FAILED: ${error.message}`);
    return { success: false, error: error.message, contractName };
  }
}

async function main() {
  console.log("\n⚡ AXIOM - Deploy Final 2 Contracts");
  console.log("===================================\n");

  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  
  console.log("Deployer:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "BNB");
  console.log("Balance USD: ~$" + (parseFloat(hre.ethers.formatEther(balance)) * 600).toFixed(2));
  console.log("Network: BSC Mainnet (Chain ID 56)\n");
  
  const BASKET_INDEX = "0x06b88f3Faa07215F6f5fb0A10A3F058D3f25ecF6";
  const EXISTING_STAKING = "0x0165878A594ca255338adfa4d48449f69242Eb8F";
  
  const deployments = [];

  // 1. EnhancedNFTMarketplace
  const nftMarket = await deployContract(
    "EnhancedNFTMarketplace",
    [deployer.address],
    "NFT marketplace with auctions and royalties"
  );
  if (nftMarket.success) deployments.push(nftMarket);
  
  if (nftMarket.success) {
    console.log("\n⏸️  Waiting 15 seconds before next deployment...\n");
    await new Promise(resolve => setTimeout(resolve, 15000));
  }

  // 2. DynamicAPRController
  const aprController = await deployContract(
    "DynamicAPRController",
    [BASKET_INDEX, EXISTING_STAKING, 1500, deployer.address],
    "Automatic APR adjustment (10-30%)"
  );
  if (aprController.success) deployments.push(aprController);

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("✅ DEPLOYMENT COMPLETE");
  console.log("=".repeat(70));
  console.log(`\nSuccessfully deployed: ${deployments.length}/2 contracts\n`);
  
  if (deployments.length > 0) {
    deployments.forEach((dep, i) => {
      console.log(`${i + 1}. ${dep.contractName}`);
      console.log(`   Address: ${dep.address}`);
      console.log(`   TX: https://bscscan.com/tx/${dep.txHash}`);
      console.log(`   Contract: https://bscscan.com/address/${dep.address}\n`);
    });
  }

  // All deployed contracts summary
  console.log("\n" + "=".repeat(70));
  console.log("📊 ALL AXIOM CONTRACTS ON BSC");
  console.log("=".repeat(70));
  console.log("\n1. BasketIndex");
  console.log("   0x06b88f3Faa07215F6f5fb0A10A3F058D3f25ecF6");
  console.log("\n2. AdvancedStaking");
  console.log("   0x5eE9d1b28c261AE132B6d324b02452bC90750136");
  
  if (nftMarket.success) {
    console.log("\n3. EnhancedNFTMarketplace");
    console.log(`   ${nftMarket.address}`);
  }
  
  if (aprController.success) {
    console.log("\n4. DynamicAPRController");
    console.log(`   ${aprController.address}`);
  }
  
  console.log("");

  // Save deployment data
  const data = {
    network: "bsc-mainnet",
    chainId: 56,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      BasketIndex: "0x06b88f3Faa07215F6f5fb0A10A3F058D3f25ecF6",
      AdvancedStaking: "0x5eE9d1b28c261AE132B6d324b02452bC90750136",
      EnhancedNFTMarketplace: nftMarket.success ? nftMarket.address : null,
      DynamicAPRController: aprController.success ? aprController.address : null
    },
    newDeployments: deployments
  };
  
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const filename = `axiom-final-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(data, null, 2)
  );
  
  console.log(`💾 Deployment data saved to: deployments/${filename}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Critical error:", error);
    process.exit(1);
  });
