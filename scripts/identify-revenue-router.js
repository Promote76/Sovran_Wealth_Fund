const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0xfFFb71e13c6cd5ce12612D1c7293BF0BAbcdab73";
  
  console.log("🔍 Identifying Contract:", contractAddress);
  console.log("🔗 https://bscscan.com/address/" + contractAddress);
  console.log("");

  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
  
  const abi = [
    "function treasury() view returns (address)",
    "function realEstateAcquisitionFund() view returns (address)",
    "function realEstateAllocation() view returns (uint256)",
    "function totalBNBDistributed() view returns (uint256)",
    "function totalBNBToRealEstate() view returns (uint256)",
    "function totalBNBToTreasury() view returns (uint256)",
    "function owner() view returns (address)"
  ];
  
  try {
    const contract = new ethers.Contract(contractAddress, abi, provider);
    
    const treasury = await contract.treasury();
    const fund = await contract.realEstateAcquisitionFund();
    const allocation = await contract.realEstateAllocation();
    const totalDistributed = await contract.totalBNBDistributed();
    const toRealEstate = await contract.totalBNBToRealEstate();
    const toTreasury = await contract.totalBNBToTreasury();
    const owner = await contract.owner();
    
    console.log("✅ IDENTIFIED: AXIOMRevenueRouter\n");
    console.log("Contract Data:");
    console.log(`  - Treasury: ${treasury}`);
    console.log(`  - Real Estate Fund: ${fund}`);
    console.log(`  - Allocation: ${allocation} basis points (${allocation/100}%)`);
    console.log(`  - Total Distributed: ${totalDistributed}`);
    console.log(`  - To Real Estate: ${toRealEstate}`);
    console.log(`  - To Treasury: ${toTreasury}`);
    console.log(`  - Owner: ${owner}`);
    console.log("");
    console.log("🏡 KeyGrow is LIVE! 20% of platform revenue → homeownership");
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
