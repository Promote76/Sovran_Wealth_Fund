const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x5eE9d1b28c261AE132B6d324b02452bC90750136";
  
  console.log("🔍 Identifying Contract:", contractAddress);
  console.log("🔗 https://bscscan.com/address/" + contractAddress);
  console.log("");

  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
  
  const code = await provider.getCode(contractAddress);
  console.log("✅ Contract exists - bytecode size:", code.length, "characters\n");

  const allTests = {
    "AdvancedStaking": {
      functions: [
        { sig: "function nftContract() view returns (address)", name: "nftContract" },
        { sig: "function rewardToken() view returns (address)", name: "rewardToken" },
        { sig: "function ADMIN_ROLE() view returns (bytes32)", name: "ADMIN_ROLE" },
        { sig: "function dailyRewardRate() view returns (uint256)", name: "dailyRewardRate" }
      ]
    },
    "EnhancedNFTMarketplace": {
      functions: [
        { sig: "function marketplaceFee() view returns (uint256)", name: "marketplaceFee" },
        { sig: "function MAX_FEE() view returns (uint256)", name: "MAX_FEE" },
        { sig: "function feeRecipient() view returns (address)", name: "feeRecipient" }
      ]
    },
    "CombinedStakingContracts": {
      functions: [
        { sig: "function stakingToken() view returns (address)", name: "stakingToken" }
      ]
    },
    "DynamicAPRController": {
      functions: [
        { sig: "function currentAPR() view returns (uint256)", name: "currentAPR" },
        { sig: "function minAPR() view returns (uint256)", name: "minAPR" },
        { sig: "function maxAPR() view returns (uint256)", name: "maxAPR" },
        { sig: "function basketVault() view returns (address)", name: "basketVault" }
      ]
    }
  };

  for (const [contractName, testData] of Object.entries(allTests)) {
    console.log(`Testing: ${contractName}...`);
    const results = {};
    let matchCount = 0;
    
    for (const func of testData.functions) {
      try {
        const contract = new ethers.Contract(contractAddress, [func.sig], provider);
        const result = await contract[func.name]();
        results[func.name] = result.toString();
        matchCount++;
      } catch (e) {
        // Function doesn't exist
      }
    }
    
    if (matchCount > 0) {
      console.log(`  ✅ Match! (${matchCount}/${testData.functions.length} functions found)`);
      
      if (matchCount >= testData.functions.length * 0.5) {
        console.log("");
        console.log(`🎯 IDENTIFIED AS: ${contractName}\n`);
        console.log("Contract Data:");
        for (const [key, value] of Object.entries(results)) {
          console.log(`  - ${key}: ${value}`);
        }
        console.log("");
        return;
      }
    } else {
      console.log(`  ❌ No match`);
    }
  }
  
  console.log("\n⚠️  Could not identify automatically");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
