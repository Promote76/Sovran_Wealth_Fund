const { ethers } = require("hardhat");

async function main() {
  console.log("========================================");
  console.log("🔍 Verifying BNB Balance (Multiple RPCs)");
  console.log("========================================\n");

  const wallet = "0xE3059F3479AAC2846299664BABe1d5D95C18D1C7";
  
  // Try multiple BSC RPC endpoints
  const rpcEndpoints = [
    "https://bsc-dataseed.binance.org/",
    "https://bsc-dataseed1.defibit.io/",
    "https://bsc-dataseed1.ninicoin.io/",
    "https://bsc.rpc.blxrbdn.com/"
  ];
  
  console.log("Wallet:", wallet);
  console.log("Network: BSC Mainnet (Chain ID 56)\n");
  
  for (const rpc of rpcEndpoints) {
    try {
      const provider = new ethers.JsonRpcProvider(rpc);
      const balance = await provider.getBalance(wallet);
      const network = await provider.getNetwork();
      
      console.log(`✓ ${rpc}`);
      console.log(`  Chain ID: ${network.chainId}`);
      console.log(`  Balance: ${ethers.formatEther(balance)} BNB`);
      console.log("");
      
      if (parseFloat(ethers.formatEther(balance)) > 0) {
        console.log("✅ BNB DETECTED!");
        console.log(`   You have ${ethers.formatEther(balance)} BNB`);
        console.log("   Ready to deploy contracts!");
        return;
      }
    } catch (error) {
      console.log(`✗ ${rpc} - Error: ${error.message}`);
      console.log("");
    }
  }
  
  console.log("⚠️  No BNB found on any RPC endpoint");
  console.log("");
  console.log("Please verify:");
  console.log("1. Check on BSCScan: https://bscscan.com/address/" + wallet);
  console.log("2. Make sure you sent BNB to BSC Mainnet (not BSC Testnet)");
  console.log("3. Wait a few minutes if transaction just sent");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
