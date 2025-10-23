const axios = require('axios');

async function main() {
  const wallet = "0xE3059F3479AAC2846299664BABe1d5D95C18D1C7";
  const apiKey = process.env.BSCSCAN_API_KEY || "";
  
  console.log("🔍 Fetching deployed contracts from BSCScan API\n");
  
  try {
    // Get recent transactions
    const url = `https://api.bscscan.com/api?module=account&action=txlist&address=${wallet}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${apiKey}`;
    
    const response = await axios.get(url);
    
    if (response.data.status === "1" && Array.isArray(response.data.result)) {
      const txs = response.data.result;
      
      console.log(`📋 Found ${txs.length} recent transactions\n`);
      
      // Filter contract creations
      const contractCreations = txs.filter(tx => tx.contractAddress && tx.contractAddress !== '');
      
      console.log(`✅ Contract Deployments: ${contractCreations.length}\n`);
      
      contractCreations.forEach((tx, i) => {
        const timestamp = new Date(tx.timeStamp * 1000).toLocaleString();
        const gasUsed = parseInt(tx.gasUsed);
        const gasCost = (parseInt(tx.gasPrice) * gasUsed / 1e18).toFixed(6);
        
        console.log(`${i + 1}. Contract Address: ${tx.contractAddress}`);
        console.log(`   TX Hash: ${tx.hash}`);
        console.log(`   Time: ${timestamp}`);
        console.log(`   Gas Used: ${gasUsed.toLocaleString()}`);
        console.log(`   Gas Cost: ${gasCost} BNB`);
        console.log(`   Status: ${tx.isError === '0' ? '✅ Success' : '❌ Failed'}`);
        console.log(`   🔗 https://bscscan.com/address/${tx.contractAddress}`);
        console.log("");
      });
      
      // Save to file
      const fs = require('fs');
      const data = {
        wallet,
        timestamp: new Date().toISOString(),
        contracts: contractCreations.map(tx => ({
          address: tx.contractAddress,
          txHash: tx.hash,
          blockNumber: tx.blockNumber,
          timestamp: new Date(tx.timeStamp * 1000).toISOString(),
          gasUsed: tx.gasUsed,
          gasCost: (parseInt(tx.gasPrice) * parseInt(tx.gasUsed) / 1e18).toString()
        }))
      };
      
      fs.writeFileSync('deployments/latest-contracts.json', JSON.stringify(data, null, 2));
      console.log("💾 Saved to: deployments/latest-contracts.json\n");
      
    } else {
      console.log("API Error:", response.data.message);
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
