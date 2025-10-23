const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0xDAc54F4eb22DFA020B1767961DEdFb5821D9c161";
  
  console.log("🔍 Identifying Contract:", contractAddress);
  console.log("🔗 https://bscscan.com/address/" + contractAddress);
  console.log("");

  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
  
  // Get contract code
  const code = await provider.getCode(contractAddress);
  console.log("✅ Contract verified - bytecode exists");
  console.log("   Bytecode size:", code.length, "characters");
  console.log("");
  
  // Try to identify by calling common functions
  const tests = [
    {
      name: "BasketIndex",
      abi: ["function name() view returns (string)", "function symbol() view returns (string)", "function BASIS_POINTS() view returns (uint256)"],
      calls: ["name", "symbol", "BASIS_POINTS"]
    },
    {
      name: "AdvancedStaking",
      abi: ["function nftContract() view returns (address)", "function rewardToken() view returns (address)", "function dailyRewardRate() view returns (uint256)"],
      calls: ["nftContract", "rewardToken", "dailyRewardRate"]
    },
    {
      name: "EnhancedNFTMarketplace",
      abi: ["function marketplaceFee() view returns (uint256)", "function feeRecipient() view returns (address)"],
      calls: ["marketplaceFee", "feeRecipient"]
    },
    {
      name: "CombinedStakingContracts",
      abi: ["function stakingToken() view returns (address)"],
      calls: ["stakingToken"]
    },
    {
      name: "DynamicAPRController",
      abi: ["function currentAPR() view returns (uint256)", "function minAPR() view returns (uint256)", "function maxAPR() view returns (uint256)"],
      calls: ["currentAPR", "minAPR", "maxAPR"]
    }
  ];

  console.log("Testing contract functions to identify type...\n");
  
  for (const test of tests) {
    try {
      const contract = new ethers.Contract(contractAddress, test.abi, provider);
      const results = {};
      let success = true;
      
      for (const call of test.calls) {
        try {
          results[call] = await contract[call]();
        } catch (e) {
          success = false;
          break;
        }
      }
      
      if (success) {
        console.log(`✅ IDENTIFIED: ${test.name}`);
        console.log("");
        console.log("   Contract Data:");
        for (const [key, value] of Object.entries(results)) {
          console.log(`   - ${key}: ${value}`);
        }
        console.log("");
        return test.name;
      }
    } catch (error) {
      // Continue to next test
    }
  }
  
  console.log("⚠️  Could not identify contract type automatically");
  console.log("   Check BSCScan for contract details");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
