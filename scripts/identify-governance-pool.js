const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x63df9De7F74c15dE702De7D2fC7eB8205bfAC0B8";
  
  console.log("🔍 Identifying Contract:", contractAddress);
  console.log("🔗 https://bscscan.com/address/" + contractAddress);
  console.log("");

  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
  
  const abi = [
    "function swfToken() view returns (address)",
    "function totalStaked() view returns (uint256)",
    "function rewardRate() view returns (uint256)",
    "function owner() view returns (address)"
  ];
  
  try {
    const contract = new ethers.Contract(contractAddress, abi, provider);
    
    const swfToken = await contract.swfToken();
    const totalStaked = await contract.totalStaked();
    const rewardRate = await contract.rewardRate();
    const owner = await contract.owner();
    
    console.log("✅ IDENTIFIED: GovernanceDividendPool\n");
    console.log("Contract Data:");
    console.log(`  - Token: ${swfToken}`);
    console.log(`  - Total Staked: ${totalStaked}`);
    console.log(`  - Reward Rate: ${ethers.formatEther(rewardRate)} BNB per 30 days`);
    console.log(`  - Owner: ${owner}`);
    console.log("");
  } catch (error) {
    console.log("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
