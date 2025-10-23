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
  console.log("\n🏡 AXIOM KeyGrow - Deploy AXIOMRevenueRouter (8/9)");
  console.log("=====================================================\n");

  const [deployer] = await hre.ethers.getSigners();
  const provider = deployer.provider;
  const balance = await provider.getBalance(deployer.address);
  
  console.log("Deployer:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "BNB");
  console.log("Balance USD: ~$" + (parseFloat(hre.ethers.formatEther(balance)) * 600).toFixed(2));
  console.log("");
  
  // Constructor arguments
  const TREASURY = deployer.address; // Temporary - change to multisig later
  const REAL_ESTATE_FUND = "0x0000000000000000000000000000000000000000"; // Will update after fund deployment
  
  console.log("📋 Constructor Arguments:");
  console.log(`   Treasury: ${TREASURY}`);
  console.log(`   Real Estate Fund: ${REAL_ESTATE_FUND} (placeholder)`);
  console.log(`   Revenue Split: 80% Treasury / 20% KeyGrow`);
  console.log("");
  
  // Estimate gas
  const Factory = await hre.ethers.getContractFactory("AXIOMRevenueRouter");
  const deployTx = await Factory.getDeployTransaction(TREASURY, REAL_ESTATE_FUND);
  
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
    process.exit(1);
  }
  
  console.log("✅ Sufficient balance - proceeding\n");
  console.log("=".repeat(70));
  console.log("📦 Deploying: AXIOMRevenueRouter");
  console.log("   Routes 80% to Treasury, 20% to KeyGrow Real Estate Fund");
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
  console.log("Contract: AXIOMRevenueRouter");
  console.log("Address:", receipt.contractAddress);
  console.log("TX Hash:", tx.hash);
  console.log("");
  console.log("🔗 View Contract: https://bscscan.com/address/" + receipt.contractAddress);
  console.log("🔗 View TX: https://bscscan.com/tx/" + tx.hash);
  console.log("");
  
  const newBalance = await provider.getBalance(deployer.address);
  const spent = balance - newBalance;
  console.log("💰 Gas Spent:", hre.ethers.formatEther(spent), "BNB (~$" + (parseFloat(hre.ethers.formatEther(spent)) * 600).toFixed(2) + ")");
  console.log("💰 Remaining Balance:", hre.ethers.formatEther(newBalance), "BNB");
  console.log("");
  
  console.log("⚠️  IMPORTANT: Update Real Estate Fund address after deployment!");
  console.log("   Call: updateRealEstateFund(address) on this contract");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error.message);
    process.exit(1);
  });
