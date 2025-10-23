const hre = require("hardhat");

async function main() {
  console.log("⚡ Deploying Single Contract Test\n");

  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  
  console.log("Deployer:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "BNB\n");

  // Deploy BasketIndex (simplest contract)
  console.log("Deploying BasketIndex...");
  const BasketIndex = await hre.ethers.getContractFactory("BasketIndex");
  const basket = await BasketIndex.deploy("AXIOM Basket", "AXM-BASKET");
  
  console.log("Waiting for deployment...");
  await basket.waitForDeployment();
  
  const address = await basket.getAddress();
  console.log("\n✅ BasketIndex deployed:", address);
  console.log("🔗 https://bscscan.com/address/" + address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
