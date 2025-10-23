const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0xd070776c3603138a1d4b93a2f668d604a4a99e34";
  
  console.log("🔍 Identifying Contract:", contractAddress);
  console.log("🔗 https://bscscan.com/address/" + contractAddress);
  console.log("");

  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
  
  const code = await provider.getCode(contractAddress);
  console.log("✅ Contract exists - bytecode size:", code.length, "characters\n");

  // Try LiquidityVault
  try {
    const abi = [
      "function lpToken() view returns (address)",
      "function totalStaked() view returns (uint256)",
      "function owner() view returns (address)"
    ];
    
    const contract = new ethers.Contract(contractAddress, abi, provider);
    
    const lpToken = await contract.lpToken();
    const totalStaked = await contract.totalStaked();
    const owner = await contract.owner();
    
    console.log("✅ IDENTIFIED: LiquidityVault\n");
    console.log("Contract Data:");
    console.log(`  - LP Token: ${lpToken}`);
    console.log(`  - Total Staked: ${totalStaked}`);
    console.log(`  - Owner: ${owner}`);
    console.log("");
    return;
  } catch (e) {
    console.log("❌ Not LiquidityVault");
  }

  // Try GovernanceDividendPool
  try {
    const abi = [
      "function swfToken() view returns (address)",
      "function totalStaked() view returns (uint256)",
      "function rewardRate() view returns (uint256)"
    ];
    
    const contract = new ethers.Contract(contractAddress, abi, provider);
    
    const swfToken = await contract.swfToken();
    const totalStaked = await contract.totalStaked();
    const rewardRate = await contract.rewardRate();
    
    console.log("✅ IDENTIFIED: GovernanceDividendPool\n");
    console.log("Contract Data:");
    console.log(`  - Token: ${swfToken}`);
    console.log(`  - Total Staked: ${totalStaked}`);
    console.log(`  - Reward Rate: ${rewardRate}`);
    console.log("");
    return;
  } catch (e) {
    console.log("❌ Not GovernanceDividendPool");
  }

  // Try SWFVaultAdapter
  try {
    const abi = [
      "function swf() view returns (address)",
      "function vault() view returns (address)",
      "function totalDeposits() view returns (uint256)"
    ];
    
    const contract = new ethers.Contract(contractAddress, abi, provider);
    
    const swf = await contract.swf();
    const vault = await contract.vault();
    const totalDeposits = await contract.totalDeposits();
    
    console.log("✅ IDENTIFIED: SWFVaultAdapter\n");
    console.log("Contract Data:");
    console.log(`  - SWF Token: ${swf}`);
    console.log(`  - Vault: ${vault}`);
    console.log(`  - Total Deposits: ${totalDeposits}`);
    console.log("");
    return;
  } catch (e) {
    console.log("❌ Not SWFVaultAdapter");
  }

  console.log("\n⚠️  Could not identify contract type");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
