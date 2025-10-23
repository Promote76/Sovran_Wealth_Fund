const axios = require('axios');

async function main() {
  const wallet = "0xE3059F3479AAC2846299664BABe1d5D95C18D1C7";
  const apiKey = process.env.BSCSCAN_API_KEY || "";
  
  console.log("🔍 Checking recent transactions for:", wallet);
  console.log("");
  
  try {
    const url = `https://api.bscscan.com/api?module=account&action=txlist&address=${wallet}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${apiKey}`;
    
    const response = await axios.get(url);
    const txs = response.data.result;
    
    if (txs && txs.length > 0) {
      console.log(`📋 Last ${txs.length} transactions:\n`);
      
      txs.forEach((tx, i) => {
        const timestamp = new Date(tx.timeStamp * 1000).toLocaleString();
        console.log(`${i + 1}. ${tx.hash}`);
        console.log(`   Time: ${timestamp}`);
        console.log(`   From: ${tx.from}`);
        console.log(`   To: ${tx.to || 'CONTRACT CREATION'}`);
        console.log(`   Value: ${(tx.value / 1e18).toFixed(6)} BNB`);
        console.log(`   Status: ${tx.isError === '0' ? '✅ Success' : '❌ Failed'}`);
        if (tx.contractAddress) {
          console.log(`   📍 Contract: ${tx.contractAddress}`);
          console.log(`   🔗 https://bscscan.com/address/${tx.contractAddress}`);
        }
        console.log("");
      });
    } else {
      console.log("No transactions found");
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
