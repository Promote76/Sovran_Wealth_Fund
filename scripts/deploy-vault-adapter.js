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
  console.log("\n⚡ AXIOM - Deploy SWFVaultAdapter (7/7) - FINAL CONTRACT!");
  console.log("==========================================================\n");

  const [deployer] = await hre.ethers.getSigners();
  const provider = deployer.provider;
  const balance = await provider.getBalance(deployer.address);
  
  console.log("Deployer:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "BNB");
  console.log("Balance USD: ~$" + (parseFloat(hre.ethers.formatEther(balance)) * 600).toFixed(2));
  console.log("");
  
  const AXM_TOKEN = "0x83E17aeB148d9b4b7Be0Be7C87dd73531a5a5738";
  const VAULT_ADDRESS = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707"; // Existing Basket Vault
  
  console.log("📋 Constructor Arguments:");
  console.log(`   AXM Token: ${AXM_TOKEN}`);
  console.log(`   Vault: ${VAULT_ADDRESS}`);
  console.log("");
  
  // Estimate gas
  const Factory = await hre.ethers.getContractFactory("contracts/CombinedStakingContracts.sol:SWFVaultAdapter");
  const deployTx = await Factory.getDeployTransaction(AXM_TOKEN, VAULT_ADDRESS);
  
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
  console.log("📦 Deploying: SWFVaultAdapter");
  console.log("   Vault integration adapter");
  console.log("=".repeat(70));
  
  console.log("✓ Contract factory created");
  console.log("⏳ Sending transaction...");
  
  const tx = await deployer.sendTransaction(deployTx);
  console.log("✓ Transaction sent!");
  console.log("");
  
  const receipt = await waitForConfirmation(provider, tx.hash);
  
  console.log("\n" + "=".repeat(70));
  console.log("✅ DEPLOYMENT SUCCESS! ALL 7 CONTRACTS COMPLETE!");
  console.log("=".repeat(70));
  console.log("");
  console.log("Contract: SWFVaultAdapter");
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
  
  console.log("🎯 ALL 7 AXIOM CONTRACTS DEPLOYED:");
  console.log("================================");
  console.log("1. BasketIndex: 0x06b88f3Faa07215F6f5fb0A10A3F058D3f25ecF6");
  console.log("2. AdvancedStaking: 0x5eE9d1b28c261AE132B6d324b02452bC90750136");
  console.log("3. EnhancedNFTMarketplace: 0xEc973eD81082a1d539F380eF94f6215793410036");
  console.log("4. DynamicAPRController: 0x14dFA6b6785643850e5c09336F7Cd5971458e28d");
  console.log("5. LiquidityVault: 0xd070776c3603138a1d4b93a2f668d604a4a99e34");
  console.log("6. GovernanceDividendPool: 0x63df9De7F74c15dE702De7D2fC7eB8205bfAC0B8");
  console.log("7. SWFVaultAdapter: " + receipt.contractAddress);
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error.message);
    process.exit(1);
  });
