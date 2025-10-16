const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("========================================");
  console.log("🔍 BSC Contract Verification Tool");
  console.log("========================================\n");

  const contractAddress = process.argv[2];
  const constructorArgsRaw = process.argv.slice(3);

  if (!contractAddress) {
    console.log("❌ Error: Contract address required");
    console.log("   Usage: node scripts/verify-bsc.js <CONTRACT_ADDRESS> [constructor_args...]");
    console.log("");
    console.log("📖 Examples:");
    console.log("   node scripts/verify-bsc.js 0x1234...");
    console.log("   node scripts/verify-bsc.js 0x1234... 0xTokenAddress");
    console.log("   node scripts/verify-bsc.js 0x1234... 0xStaking 0xVault");
    console.log("");
    process.exit(1);
  }

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  let deploymentData = null;
  let contractName = null;
  let constructorArgs = constructorArgsRaw;

  if (fs.existsSync(deploymentsDir)) {
    const files = fs.readdirSync(deploymentsDir)
      .filter(f => f.endsWith('.json'))
      .sort((a, b) => {
        const statA = fs.statSync(path.join(deploymentsDir, a));
        const statB = fs.statSync(path.join(deploymentsDir, b));
        return statB.mtimeMs - statA.mtimeMs;
      });

    for (const file of files) {
      const data = JSON.parse(fs.readFileSync(path.join(deploymentsDir, file), 'utf8'));
      if (data.contractAddress.toLowerCase() === contractAddress.toLowerCase()) {
        deploymentData = data;
        contractName = data.contractName;
        if (constructorArgs.length === 0 && data.constructorArgs) {
          constructorArgs = data.constructorArgs;
        }
        break;
      }
    }
  }

  if (!contractName) {
    console.log("⚠️  Contract not found in deployment records");
    console.log("   Please specify the contract name:");
    contractName = process.argv[3];
    if (!contractName) {
      console.log("   Available contracts: SWFToken, SoloMethodEngine, SWFBasketVault, DynamicAPRController");
      process.exit(1);
    }
  }

  console.log("📋 Verification Information:");
  console.log("├─ Network:", hre.network.name);
  console.log("├─ Contract Name:", contractName);
  console.log("├─ Contract Address:", contractAddress);
  console.log("├─ Constructor Args:", constructorArgs.length > 0 ? constructorArgs.join(", ") : "None");
  console.log("");

  console.log("⏳ Verifying contract on BSCScan...");
  console.log("   This may take a minute...");
  console.log("");

  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArgs,
    });

    console.log("");
    console.log("✅ Verification Successful!");
    console.log("========================================");
    console.log("🔗 View on BSCScan:");
    console.log(`   https://bscscan.com/address/${contractAddress}#code`);
    console.log("========================================");
    console.log("");

  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("");
      console.log("✅ Contract Already Verified!");
      console.log("========================================");
      console.log("🔗 View on BSCScan:");
      console.log(`   https://bscscan.com/address/${contractAddress}#code`);
      console.log("========================================");
      console.log("");
    } else {
      console.log("");
      console.log("❌ Verification Failed:");
      console.log(error.message);
      console.log("");
      console.log("💡 Troubleshooting:");
      console.log("1. Wait 30-60 seconds after deployment before verifying");
      console.log("2. Ensure constructor arguments are correct");
      console.log("3. Check that BSCSCAN_API_KEY is set in Replit Secrets");
      console.log("4. Verify the contract was compiled with the same settings");
      console.log("");
      process.exit(1);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:");
    console.error(error);
    process.exit(1);
  });
