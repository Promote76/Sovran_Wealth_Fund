const hre = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🏗️  Deploying RealEstateInvestor to BSC Mainnet...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "BNB");

  // Fee recipient (Treasury or platform wallet)
  const feeRecipient = "0xd070776c3603138a1d4b93a2f668d604a4a99e34";

  console.log("\n🚀 Deploying RealEstateInvestor...");
  const RealEstateInvestor = await hre.ethers.getContractFactory("RealEstateInvestor");
  
  console.log("📤 Sending deployment transaction...");
  const investor = await RealEstateInvestor.deploy(feeRecipient);
  
  console.log("⏳ Waiting for deployment...");
  const deployedContract = await investor.waitForDeployment();
  const investorAddress = await investor.getAddress();

  console.log("✅ RealEstateInvestor deployed to:", investorAddress);

  // Save deployment info
  const deploymentInfo = {
    network: "bsc-mainnet",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      RealEstateInvestor: {
        address: investorAddress,
        feeRecipient: feeRecipient,
        minimumInvestment: "0.05 BNB",
        platformFee: "2.5%"
      }
    }
  };

  fs.writeFileSync(
    'real-estate-investor-deployment.json',
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n📄 Deployment info saved to real-estate-investor-deployment.json");
  console.log("\n🎉 Deployment complete!");
  console.log("\n📊 Contract Details:");
  console.log("  - Address:", investorAddress);
  console.log("  - Platform Fee: 2.5%");
  console.log("  - Min Investment: 0.05 BNB");
  console.log("  - Fee Recipient:", feeRecipient);
  
  console.log("\n🔗 View on BSCScan:");
  console.log("  https://bscscan.com/address/" + investorAddress);
  
  console.log("\n✅ Contract ready to use!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
