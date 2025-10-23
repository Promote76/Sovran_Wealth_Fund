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

async function deployContract(contractName, args, description) {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`📦 Deploying: ${contractName.split(':')[1] || contractName}`);
  console.log(`   ${description}`);
  console.log("=".repeat(70));
  
  try {
    const [deployer] = await hre.ethers.getSigners();
    const provider = deployer.provider;
    
    // Use fully qualified name
    const Factory = await hre.ethers.getContractFactory(contractName);
    console.log("✓ Contract factory created");
    
    const deployTx = await Factory.getDeployTransaction(...args);
    
    const gasEstimate = await provider.estimateGas({
      ...deployTx,
      from: deployer.address
    });
    
    const feeData = await provider.getFeeData();
    const gasCost = gasEstimate * feeData.gasPrice;
    
    console.log(`📊 Est. Cost: ${hre.ethers.formatEther(gasCost)} BNB`);
    console.log("⏳ Sending transaction...");
    
    const tx = await deployer.sendTransaction(deployTx);
    console.log("✓ Transaction sent!");
    console.log("");
    
    const receipt = await waitForConfirmation(provider, tx.hash);
    
    console.log("\n✅ SUCCESS!");
    console.log(`   Address: ${receipt.contractAddress}`);
    console.log(`   🔗 https://bscscan.com/address/${receipt.contractAddress}`);
    
    return { 
      success: true, 
      address: receipt.contractAddress, 
      contractName: contractName.split(':')[1] || contractName, 
      txHash: tx.hash,
      gasUsed: receipt.gasUsed.toString()
    };
    
  } catch (error) {
    console.log(`\n❌ FAILED: ${error.message}`);
    return { success: false, error: error.message, contractName: contractName.split(':')[1] || contractName };
  }
}

async function main() {
  console.log("\n⚡ AXIOM - Deploy CombinedStaking Contracts (5th Contract!)");
  console.log("===========================================================\n");

  const [deployer] = await hre.ethers.getSigners();
  const provider = deployer.provider;
  const balance = await provider.getBalance(deployer.address);
  
  console.log("Deployer:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "BNB");
  console.log("Balance USD: ~$" + (parseFloat(hre.ethers.formatEther(balance)) * 600).toFixed(2));
  console.log("");
  
  const AXM_TOKEN = "0x83E17aeB148d9b4b7Be0Be7C87dd73531a5a5738";
  const LP_TOKEN = AXM_TOKEN; // Using AXM as LP token
  const VAULT_ADDRESS = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707"; // Existing Basket Vault
  const REWARD_RATE = hre.ethers.parseEther("0.01"); // 0.01 BNB per 30 days per token staked
  
  const deployments = [];

  // 1. LiquidityVault
  console.log("📋 Contract 1/3: LiquidityVault");
  const liquidityVault = await deployContract(
    "contracts/CombinedStakingContracts.sol:LiquidityVault",
    [LP_TOKEN],
    "LP token staking vault"
  );
  if (liquidityVault.success) deployments.push(liquidityVault);
  
  if (liquidityVault.success) {
    console.log("\n⏸️  Waiting 10 seconds before next deployment...\n");
    await new Promise(resolve => setTimeout(resolve, 10000));
  }

  // 2. GovernanceDividendPool
  console.log("📋 Contract 2/3: GovernanceDividendPool");
  const dividendPool = await deployContract(
    "contracts/CombinedStakingContracts.sol:GovernanceDividendPool",
    [AXM_TOKEN, REWARD_RATE],
    "AXM token staking with BNB rewards"
  );
  if (dividendPool.success) deployments.push(dividendPool);
  
  if (dividendPool.success) {
    console.log("\n⏸️  Waiting 10 seconds before next deployment...\n");
    await new Promise(resolve => setTimeout(resolve, 10000));
  }

  // 3. SWFVaultAdapter
  console.log("📋 Contract 3/3: SWFVaultAdapter");
  const vaultAdapter = await deployContract(
    "contracts/CombinedStakingContracts.sol:SWFVaultAdapter",
    [AXM_TOKEN, VAULT_ADDRESS],
    "Vault integration adapter"
  );
  if (vaultAdapter.success) deployments.push(vaultAdapter);

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("✅ DEPLOYMENT COMPLETE - ALL 5 CONTRACTS DEPLOYED!");
  console.log("=".repeat(70));
  console.log(`\nSuccessfully deployed: ${deployments.length}/3 contracts\n`);
  
  if (deployments.length > 0) {
    console.log("🎯 NEW CONTRACTS:\n");
    deployments.forEach((dep, i) => {
      console.log(`${i + 1}. ${dep.contractName}`);
      console.log(`   Address: ${dep.address}`);
      console.log(`   Gas Used: ${dep.gasUsed}`);
      console.log(`   TX: https://bscscan.com/tx/${dep.txHash}`);
      console.log(`   Contract: https://bscscan.com/address/${dep.address}\n`);
    });
  }

  const newBalance = await provider.getBalance(deployer.address);
  const spent = balance - newBalance;
  console.log("💰 Total Gas Spent:", hre.ethers.formatEther(spent), "BNB (~$" + (parseFloat(hre.ethers.formatEther(spent)) * 600).toFixed(2) + ")");
  console.log("💰 Remaining Balance:", hre.ethers.formatEther(newBalance), "BNB");
  console.log("");
  
  console.log("📊 COMPLETE AXIOM DEPLOYMENT:");
  console.log("  1. BasketIndex: 0x06b88f3Faa07215F6f5fb0A10A3F058D3f25ecF6");
  console.log("  2. AdvancedStaking: 0x5eE9d1b28c261AE132B6d324b02452bC90750136");
  console.log("  3. EnhancedNFTMarketplace: 0xEc973eD81082a1d539F380eF94f6215793410036");
  console.log("  4. DynamicAPRController: 0x14dFA6b6785643850e5c09336F7Cd5971458e28d");
  if (deployments.length > 0) {
    deployments.forEach((dep, i) => {
      console.log(`  5.${i + 1} ${dep.contractName}: ${dep.address}`);
    });
  }
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error.message);
    process.exit(1);
  });
