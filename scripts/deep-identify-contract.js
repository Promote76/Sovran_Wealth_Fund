const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x06b88f3Faa07215F6f5fb0A10A3F058D3f25ecF6";
  
  console.log("🔍 Deep Analysis of Contract:", contractAddress);
  console.log("");

  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
  
  // Test all possible function signatures
  const allTests = {
    "BasketIndex": {
      functions: [
        { sig: "function name() view returns (string)", name: "name" },
        { sig: "function symbol() view returns (string)", name: "symbol" },
        { sig: "function totalSupply() view returns (uint256)", name: "totalSupply" },
        { sig: "function BASIS_POINTS() view returns (uint256)", name: "BASIS_POINTS" }
      ]
    },
    "AdvancedStaking": {
      functions: [
        { sig: "function nftContract() view returns (address)", name: "nftContract" },
        { sig: "function rewardToken() view returns (address)", name: "rewardToken" },
        { sig: "function ADMIN_ROLE() view returns (bytes32)", name: "ADMIN_ROLE" }
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
      console.log("");
      
      if (matchCount >= testData.functions.length * 0.5) { // At least 50% match
        console.log(`🎯 IDENTIFIED AS: ${contractName}\n`);
        console.log("Contract Data:");
        for (const [key, value] of Object.entries(results)) {
          console.log(`  - ${key}: ${value}`);
        }
        return;
      }
    } else {
      console.log(`  ❌ No match`);
    }
  }
  
  console.log("\n⚠️  Could not identify - may be a duplicate or different contract");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
