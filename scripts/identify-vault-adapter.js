const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0xeAFF0dB435DABB6f142A934e17123bfa752dbbd5";
  
  console.log("🔍 Identifying Contract:", contractAddress);
  console.log("🔗 https://bscscan.com/address/" + contractAddress);
  console.log("");

  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
  
  const abi = [
    "function swf() view returns (address)",
    "function vault() view returns (address)",
    "function totalDeposits() view returns (uint256)",
    "function owner() view returns (address)"
  ];
  
  try {
    const contract = new ethers.Contract(contractAddress, abi, provider);
    
    const swf = await contract.swf();
    const vault = await contract.vault();
    const totalDeposits = await contract.totalDeposits();
    const owner = await contract.owner();
    
    console.log("✅ IDENTIFIED: SWFVaultAdapter\n");
    console.log("Contract Data:");
    console.log(`  - SWF/AXM Token: ${swf}`);
    console.log(`  - Vault: ${vault}`);
    console.log(`  - Total Deposits: ${totalDeposits}`);
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
