const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("========================================");
  console.log("🚀 BSC Smart Contract Deployment Tool");
  console.log("========================================\n");

  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  
  console.log("📋 Deployment Information:");
  console.log("├─ Network:", hre.network.name);
  console.log("├─ Chain ID:", (await hre.ethers.provider.getNetwork()).chainId);
  console.log("├─ Deployer Address:", deployer.address);
  console.log("├─ Deployer Balance:", hre.ethers.formatEther(balance), "BNB");
  console.log("");

  if (parseFloat(hre.ethers.formatEther(balance)) < 0.01) {
    console.log("⚠️  WARNING: Low BNB balance!");
    console.log("    You need at least 0.01 BNB to deploy contracts.");
    console.log("    Please add BNB to:", deployer.address);
    console.log("");
    process.exit(1);
  }

  console.log("📦 Available Contracts:");
  console.log("1. SWFToken - Main ERC20 token with minting/burning");
  console.log("2. SoloMethodEngine - Staking contract with dynamic APR");
  console.log("3. SWFBasketVault - Token vault with basket mechanism");
  console.log("4. DynamicAPRController - Automated APR adjustment");
  console.log("");

  const contractChoice = process.argv[2] || "1";
  
  let contractName, constructorArgs = [];
  
  switch(contractChoice) {
    case "1":
    case "SWFToken":
      contractName = "SWFToken";
      console.log("🔨 Deploying: SWFToken");
      break;
    case "2":
    case "SoloMethodEngine":
      contractName = "SoloMethodEngine";
      console.log("🔨 Deploying: SoloMethodEngine");
      const swfTokenAddress = process.argv[3];
      if (!swfTokenAddress) {
        console.log("❌ Error: SoloMethodEngine requires SWF token address");
        console.log("   Usage: node scripts/deploy-bsc.js 2 <SWF_TOKEN_ADDRESS>");
        process.exit(1);
      }
      constructorArgs = [swfTokenAddress];
      break;
    case "3":
    case "SWFBasketVault":
      contractName = "SWFBasketVault";
      console.log("🔨 Deploying: SWFBasketVault");
      const basketTokenAddress = process.argv[3];
      if (!basketTokenAddress) {
        console.log("❌ Error: SWFBasketVault requires SWF token address");
        console.log("   Usage: node scripts/deploy-bsc.js 3 <SWF_TOKEN_ADDRESS>");
        process.exit(1);
      }
      constructorArgs = [basketTokenAddress];
      break;
    case "4":
    case "DynamicAPRController":
      contractName = "DynamicAPRController";
      console.log("🔨 Deploying: DynamicAPRController");
      const stakingAddress = process.argv[3];
      const vaultAddress = process.argv[4];
      if (!stakingAddress || !vaultAddress) {
        console.log("❌ Error: DynamicAPRController requires staking and vault addresses");
        console.log("   Usage: node scripts/deploy-bsc.js 4 <STAKING_ADDRESS> <VAULT_ADDRESS>");
        process.exit(1);
      }
      constructorArgs = [stakingAddress, vaultAddress];
      break;
    default:
      console.log("❌ Invalid contract choice");
      process.exit(1);
  }

  console.log("");
  console.log("⏳ Compiling contracts...");
  await hre.run("compile");
  
  console.log("⏳ Deploying contract...");
  const Contract = await hre.ethers.getContractFactory(contractName);
  const contract = await Contract.deploy(...constructorArgs);
  
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  
  console.log("");
  console.log("✅ Deployment Successful!");
  console.log("========================================");
  console.log("📍 Contract Address:", contractAddress);
  console.log("🔗 BSCScan:", `https://bscscan.com/address/${contractAddress}`);
  console.log("========================================");
  console.log("");

  const deploymentData = {
    network: hre.network.name,
    chainId: Number((await hre.ethers.provider.getNetwork()).chainId),
    contractName: contractName,
    contractAddress: contractAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    constructorArgs: constructorArgs,
    txHash: contract.deploymentTransaction()?.hash || "N/A"
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `${contractName}-${hre.network.name}-${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentData, null, 2));
  
  console.log("💾 Deployment info saved to:", filepath);
  console.log("");
  console.log("🔍 Next Steps:");
  console.log("1. Verify your contract on BSCScan:");
  console.log(`   npx hardhat verify --network bsc ${contractAddress}`);
  console.log("");
  console.log("2. View your contract on BSCScan:");
  console.log(`   https://bscscan.com/address/${contractAddress}`);
  console.log("");

  return deploymentData;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment Failed:");
    console.error(error);
    process.exit(1);
  });
