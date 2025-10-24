const hre = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🏗️  Manual RealEstateInvestor Deployment");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deployer:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(balance), "BNB\n");

  const feeRecipient = "0xd070776c3603138a1d4b93a2f668d604a4a99e34";

  try {
    console.log("📦 Getting contract factory...");
    const RealEstateInvestor = await hre.ethers.getContractFactory("RealEstateInvestor");
    
    console.log("🚀 Deploying contract...");
    const tx = await RealEstateInvestor.getDeployTransaction(feeRecipient);
    
    console.log("📤 Sending transaction...");
    const sentTx = await deployer.sendTransaction(tx);
    
    console.log("📨 Transaction hash:", sentTx.hash);
    console.log("⏳ Waiting for confirmation (this may take 1-2 minutes)...");
    
    const receipt = await sentTx.wait(2); // Wait for 2 confirmations
    
    console.log("✅ Transaction confirmed!");
    console.log("📍 Contract address:", receipt.contractAddress);
    
    // Save deployment info
    const deploymentInfo = {
      network: "bsc-mainnet",
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      txHash: sentTx.hash,
      contracts: {
        RealEstateInvestor: {
          address: receipt.contractAddress,
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

    console.log("\n🎉 Deployment successful!");
    console.log("\n📊 Contract Details:");
    console.log("  - Address:", receipt.contractAddress);
    console.log("  - Transaction:", sentTx.hash);
    console.log("  - Platform Fee: 2.5%");
    console.log("  - Min Investment: 0.05 BNB");
    
    console.log("\n🔗 View on BSCScan:");
    console.log("  https://bscscan.com/address/" + receipt.contractAddress);
    console.log("  https://bscscan.com/tx/" + sentTx.hash);
    
  } catch (error) {
    console.error("\n❌ Deployment error:");
    console.error(error.message);
    
    if (error.transaction) {
      console.log("\n📨 Transaction was sent:");
      console.log("  Hash:", error.transaction.hash || error.hash);
      console.log("\n🔍 Check transaction status:");
      console.log("  https://bscscan.com/tx/" + (error.transaction.hash || error.hash));
      console.log("\n⏳ The contract might still deploy. Check BSCScan in 1-2 minutes.");
    }
    
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n💥 Fatal error - but check BSCScan, contract might be deployed!");
    process.exit(1);
  });
