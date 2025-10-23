const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x14dFA6b6785643850e5c09336F7Cd5971458e28d";
  
  console.log("🔍 Verifying Contract:", contractAddress);
  console.log("🔗 https://bscscan.com/address/" + contractAddress);
  console.log("");

  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
  
  const abi = [
    "function currentAPR() view returns (uint256)",
    "function minAPR() view returns (uint256)",
    "function maxAPR() view returns (uint256)",
    "function basketVault() view returns (address)",
    "function stakingContract() view returns (address)"
  ];
  
  try {
    const contract = new ethers.Contract(contractAddress, abi, provider);
    
    const currentAPR = await contract.currentAPR();
    const minAPR = await contract.minAPR();
    const maxAPR = await contract.maxAPR();
    const basketVault = await contract.basketVault();
    const stakingContract = await contract.stakingContract();
    
    console.log("✅ IDENTIFIED: DynamicAPRController\n");
    console.log("Contract Data:");
    console.log(`  - Current APR: ${currentAPR} (${parseFloat(currentAPR) / 100}%)`);
    console.log(`  - Min APR: ${minAPR} (${parseFloat(minAPR) / 100}%)`);
    console.log(`  - Max APR: ${maxAPR} (${parseFloat(maxAPR) / 100}%)`);
    console.log(`  - Basket Vault: ${basketVault}`);
    console.log(`  - Staking Contract: ${stakingContract}`);
    console.log("");
    
  } catch (error) {
    console.log("❌ Not a DynamicAPRController or error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
