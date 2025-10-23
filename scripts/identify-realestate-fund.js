const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0xe097881D32D67ED1Dd9df8203F188CD186f345dc";
  
  console.log("🔍 Identifying Contract:", contractAddress);
  console.log("🔗 https://bscscan.com/address/" + contractAddress);
  console.log("");

  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
  
  const abi = [
    "function advancedStakingContract() view returns (address)",
    "function axmTokenContract() view returns (address)",
    "function totalFundBalance() view returns (uint256)",
    "function totalRenters() view returns (uint256)",
    "function currentDistributionPeriod() view returns (uint256)",
    "function owner() view returns (address)"
  ];
  
  try {
    const contract = new ethers.Contract(contractAddress, abi, provider);
    
    const staking = await contract.advancedStakingContract();
    const token = await contract.axmTokenContract();
    const balance = await contract.totalFundBalance();
    const renters = await contract.totalRenters();
    const period = await contract.currentDistributionPeriod();
    const owner = await contract.owner();
    
    console.log("✅ IDENTIFIED: RealEstateAcquisitionFund\n");
    console.log("Contract Data:");
    console.log(`  - Staking Contract: ${staking}`);
    console.log(`  - AXM Token: ${token}`);
    console.log(`  - Fund Balance: ${balance}`);
    console.log(`  - Total Renters: ${renters}`);
    console.log(`  - Current Period: ${period}`);
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
