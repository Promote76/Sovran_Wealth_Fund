const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0xe1aDcfF45c50b45781C6143A067B7eadEFfe99C1";
  
  console.log("🔍 Checking if BasketIndex:", contractAddress);
  console.log("");

  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
  
  // Try BasketIndex functions
  try {
    const abi = [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function BASIS_POINTS() view returns (uint256)",
      "function totalSupply() view returns (uint256)"
    ];
    
    const contract = new ethers.Contract(contractAddress, abi, provider);
    
    const name = await contract.name();
    const symbol = await contract.symbol();
    const basisPoints = await contract.BASIS_POINTS();
    const totalSupply = await contract.totalSupply();
    
    console.log("✅ IDENTIFIED: BasketIndex\n");
    console.log("Contract Data:");
    console.log(`  - Name: ${name}`);
    console.log(`  - Symbol: ${symbol}`);
    console.log(`  - BASIS_POINTS: ${basisPoints}`);
    console.log(`  - Total Supply: ${totalSupply}`);
    console.log("");
    console.log("🔗 https://bscscan.com/address/" + contractAddress);
    
  } catch (error) {
    console.log("❌ Not a BasketIndex");
    console.log("Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
