const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Getting Contract Addresses from Transactions\n");

  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
  
  // Transaction hashes from BSCScan
  const txHashes = [
    "0xfd322da248b",  // Need full hash - user to provide
    "0x7382dba78ef",  // Need full hash
    "0x06ac7f08c7c"   // Need full hash
  ];

  // Let me try to get recent transactions from the wallet
  const wallet = "0xE3059F3479AAC2846299664BABe1d5D95C18D1C7";
  
  // Get latest block
  const latestBlock = await provider.getBlockNumber();
  console.log("Latest block:", latestBlock);
  console.log("");
  
  // Get recent blocks and find contract creation txs
  console.log("Scanning recent blocks for contract creations...\n");
  
  for (let i = 0; i < 20; i++) {
    const blockNum = latestBlock - i;
    const block = await provider.getBlock(blockNum, true);
    
    if (block && block.transactions) {
      for (const tx of block.transactions) {
        if (typeof tx === 'object' && tx.from && tx.from.toLowerCase() === wallet.toLowerCase()) {
          const receipt = await provider.getTransactionReceipt(tx.hash);
          
          if (receipt && receipt.contractAddress) {
            console.log("✅ Contract Deployment Found!");
            console.log("   TX Hash:", tx.hash);
            console.log("   Contract:", receipt.contractAddress);
            console.log("   Block:", blockNum);
            console.log("   Gas Used:", receipt.gasUsed.toString());
            console.log("   🔗 https://bscscan.com/address/" + receipt.contractAddress);
            console.log("");
          }
        }
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
