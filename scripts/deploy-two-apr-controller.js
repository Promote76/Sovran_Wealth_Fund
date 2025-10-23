const hre = require("hardhat");

async function waitForConfirmation(provider, txHash) {
  console.log(`   TX Hash: ${txHash}`);
  console.log(`   🔗 https://bscscan.com/tx/${txHash}`);
  console.log(`   ⏳ Waiting for confirmation...`);
  
  const maxAttempts = 25;
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const receipt = await provider.getTransactionReceipt(txHash);
      
      if (receipt && receipt.contractAddress) {
        console.log(`\n   ✅ CONFIRMED in block ${receipt.blockNumber}!`);
        console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
        console.log(`   Contract Address: ${receipt.contractAddress}`);
        return receipt;
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      process.stdout.write(`   Checking... (${i + 1}/${maxAttempts})\r`);
      
    } catch (error) {
      // Continue polling
    }
  }
  
  throw new Error(`Timeout waiting for confirmation`);
}

async function main() {
  console.log("\n⚡ AXIOM - Deploy DynamicAPRController");
  console.log("=======================================\n");

  const [deployer] = await hre.ethers.getSigners();
  const provider = deployer.provider;
  const balance = await provider.getBalance(deployer.address);
  
  console.log("Deployer:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "BNB");
  console.log("Balance USD: ~$" + (parseFloat(hre.ethers.formatEther(balance)) * 600).toFixed(2));
  console.log("");
  
  const BASKET_INDEX = "0x06b88f3Faa07215F6f5fb0A10A3F058D3f25ecF6";
  const EXISTING_STAKING = "0x0165878A594ca255338adfa4d48449f69242Eb8F";
  const INITIAL_APR = 1500; // 15% initial APR
  
  console.log("📋 Constructor Arguments:");
  console.log(`   Basket Vault: ${BASKET_INDEX}`);
  console.log(`   Staking Contract: ${EXISTING_STAKING}`);
  console.log(`   Initial APR: ${INITIAL_APR} (15%)`);
  console.log(`   Admin: ${deployer.address}`);
  console.log("");
  
  // Estimate gas first
  const Factory = await hre.ethers.getContractFactory("DynamicAPRController");
  const deployTx = await Factory.getDeployTransaction(
    BASKET_INDEX,
    EXISTING_STAKING,
    INITIAL_APR,
    deployer.address
  );
  
  const gasEstimate = await provider.estimateGas({
    ...deployTx,
    from: deployer.address
  });
  
  const feeData = await provider.getFeeData();
  const gasCost = gasEstimate * feeData.gasPrice;
  
  console.log("📊 Deployment Estimate:");
  console.log(`   Gas Limit: ${gasEstimate.toString()}`);
  console.log(`   Gas Price: ${hre.ethers.formatUnits(feeData.gasPrice, 'gwei')} gwei`);
  console.log(`   Est. Cost: ${hre.ethers.formatEther(gasCost)} BNB (~$${(parseFloat(hre.ethers.formatEther(gasCost)) * 600).toFixed(2)})`);
  console.log("");
  
  if (gasCost > balance) {
    console.log("❌ INSUFFICIENT FUNDS");
    console.log(`   Need: ${hre.ethers.formatEther(gasCost)} BNB`);
    console.log(`   Have: ${hre.ethers.formatEther(balance)} BNB`);
    process.exit(1);
  }
  
  console.log("✅ Sufficient balance - proceeding with deployment\n");
  console.log("=".repeat(70));
  console.log("📦 Deploying: DynamicAPRController");
  console.log("   Automatic APR adjustment (10-30%)");
  console.log("=".repeat(70));
  
  console.log("✓ Contract factory created");
  console.log("⏳ Sending transaction...");
  
  const tx = await deployer.sendTransaction(deployTx);
  console.log("✓ Transaction sent!");
  console.log("");
  
  const receipt = await waitForConfirmation(provider, tx.hash);
  
  console.log("\n" + "=".repeat(70));
  console.log("✅ DEPLOYMENT SUCCESS!");
  console.log("=".repeat(70));
  console.log("");
  console.log("Contract: DynamicAPRController");
  console.log("Address:", receipt.contractAddress);
  console.log("TX Hash:", tx.hash);
  console.log("");
  console.log("🔗 View Contract: https://bscscan.com/address/" + receipt.contractAddress);
  console.log("🔗 View TX: https://bscscan.com/tx/" + tx.hash);
  console.log("");
  
  const newBalance = await provider.getBalance(deployer.address);
  const spent = balance - newBalance;
  console.log("💰 Gas Spent:", hre.ethers.formatEther(spent), "BNB");
  console.log("💰 Remaining Balance:", hre.ethers.formatEther(newBalance), "BNB");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error.message);
    process.exit(1);
  });
