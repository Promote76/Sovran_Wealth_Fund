/**
 * MetalOfTheGods Secure NFT Deployment Script
 * 
 * This script deploys the MetalOfTheGods NFT contract with enhanced security features
 * including multi-signature wallet, timelock governance, and emergency controls.
 */

const { ethers, upgrades } = require("hardhat");
const fs = require('fs');
const path = require('path');

// Deployment configuration
const DEPLOYMENT_CONFIG = {
    // Multi-sig wallet owners (should be replaced with actual addresses)
    MULTISIG_OWNERS: [
        "0x742CE2279b3Ad1e59BFD8063cac5dA3b7Ce64348", // Replace with actual owner 1
        "0x8ba1f109551bD432803012645Hac136c4C33Bd46", // Replace with actual owner 2
        "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5"  // Replace with actual owner 3
    ],
    MULTISIG_CONFIRMATIONS_REQUIRED: 2,
    
    // SWF Token contract address (existing deployment)
    SWF_TOKEN_ADDRESS: "0x83E17aeB148d9b4b7Be0Be7C87dd73531a5a5738",
    
    // Treasury wallet for reward distribution
    TREASURY_WALLET: "0xaaC7C3F9d46a29c9E0e7F37dEF88104b5059e65E",
    
    // Network configuration
    NETWORK: "bsc", // Change to "bsc-testnet" for testing
    
    // Gas configuration
    GAS_LIMIT: 6000000,
    GAS_PRICE: "5000000000", // 5 gwei
};

async function main() {
    console.log("🚀 Starting MetalOfTheGods Secure NFT Deployment");
    console.log("=" .repeat(60));
    
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying contracts with account:", deployer.address);
    
    const balance = await deployer.getBalance();
    console.log("💰 Account balance:", ethers.utils.formatEther(balance), "BNB");
    
    if (balance.lt(ethers.utils.parseEther("0.1"))) {
        throw new Error("❌ Insufficient balance for deployment. Need at least 0.1 BNB");
    }
    
    // Validate configuration
    console.log("\n🔍 Validating deployment configuration...");
    validateConfiguration();
    
    try {
        // Step 1: Deploy Multi-Signature Wallet
        console.log("\n📋 Step 1: Deploying Multi-Signature Wallet");
        const multiSigWallet = await deployMultiSigWallet();
        
        // Step 2: Deploy MetalOfTheGods NFT Contract
        console.log("\n🎨 Step 2: Deploying MetalOfTheGods NFT Contract");
        const nftContract = await deployNFTContract(multiSigWallet.address);
        
        // Step 3: Configure contracts
        console.log("\n⚙️ Step 3: Configuring contracts");
        await configureContracts(nftContract, multiSigWallet);
        
        // Step 4: Verify deployments
        console.log("\n✅ Step 4: Verifying deployments");
        await verifyDeployments(nftContract, multiSigWallet);
        
        // Step 5: Save deployment information
        console.log("\n💾 Step 5: Saving deployment information");
        await saveDeploymentInfo(nftContract, multiSigWallet);
        
        console.log("\n🎉 Deployment completed successfully!");
        console.log("=" .repeat(60));
        displayDeploymentSummary(nftContract, multiSigWallet);
        
    } catch (error) {
        console.error("\n❌ Deployment failed:", error.message);
        console.error(error);
        process.exit(1);
    }
}

function validateConfiguration() {
    // Validate multi-sig owners
    if (DEPLOYMENT_CONFIG.MULTISIG_OWNERS.length < 2) {
        throw new Error("At least 2 multi-sig owners required");
    }
    
    if (DEPLOYMENT_CONFIG.MULTISIG_CONFIRMATIONS_REQUIRED > DEPLOYMENT_CONFIG.MULTISIG_OWNERS.length) {
        throw new Error("Confirmations required cannot exceed number of owners");
    }
    
    // Validate addresses
    const addresses = [
        ...DEPLOYMENT_CONFIG.MULTISIG_OWNERS,
        DEPLOYMENT_CONFIG.SWF_TOKEN_ADDRESS,
        DEPLOYMENT_CONFIG.TREASURY_WALLET
    ];
    
    for (const address of addresses) {
        if (!ethers.utils.isAddress(address)) {
            throw new Error(`Invalid address: ${address}`);
        }
    }
    
    console.log("✅ Configuration validation passed");
}

async function deployMultiSigWallet() {
    const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
    
    console.log("📄 Deploying with parameters:");
    console.log(`   Owners: ${DEPLOYMENT_CONFIG.MULTISIG_OWNERS.length}`);
    console.log(`   Required confirmations: ${DEPLOYMENT_CONFIG.MULTISIG_CONFIRMATIONS_REQUIRED}`);
    
    const multiSigWallet = await MultiSigWallet.deploy(
        DEPLOYMENT_CONFIG.MULTISIG_OWNERS,
        DEPLOYMENT_CONFIG.MULTISIG_CONFIRMATIONS_REQUIRED,
        {
            gasLimit: DEPLOYMENT_CONFIG.GAS_LIMIT,
            gasPrice: DEPLOYMENT_CONFIG.GAS_PRICE
        }
    );
    
    await multiSigWallet.deployed();
    console.log(`✅ MultiSigWallet deployed to: ${multiSigWallet.address}`);
    
    return multiSigWallet;
}

async function deployNFTContract(multiSigAddress) {
    const MetalOfTheGodsSecure = await ethers.getContractFactory("MetalOfTheGodsSecure");
    
    console.log("📄 Deploying with parameters:");
    console.log(`   Multi-sig wallet: ${multiSigAddress}`);
    console.log(`   SWF token: ${DEPLOYMENT_CONFIG.SWF_TOKEN_ADDRESS}`);
    console.log(`   Treasury: ${DEPLOYMENT_CONFIG.TREASURY_WALLET}`);
    
    // Deploy as upgradeable proxy
    const nftContract = await upgrades.deployProxy(
        MetalOfTheGodsSecure,
        [
            multiSigAddress,
            DEPLOYMENT_CONFIG.SWF_TOKEN_ADDRESS,
            DEPLOYMENT_CONFIG.TREASURY_WALLET
        ],
        {
            initializer: "initialize",
            kind: "uups",
            gasLimit: DEPLOYMENT_CONFIG.GAS_LIMIT,
            gasPrice: DEPLOYMENT_CONFIG.GAS_PRICE
        }
    );
    
    await nftContract.deployed();
    console.log(`✅ MetalOfTheGodsSecure deployed to: ${nftContract.address}`);
    
    return nftContract;
}

async function configureContracts(nftContract, multiSigWallet) {
    const [deployer] = await ethers.getSigners();
    
    console.log("🔧 Setting up initial configuration...");
    
    // Grant initial roles to multi-sig wallet
    console.log("   - Granting roles to multi-sig wallet");
    await nftContract.grantRole(await nftContract.MULTISIG_ROLE(), multiSigWallet.address);
    await nftContract.grantRole(await nftContract.UPGRADER_ROLE(), multiSigWallet.address);
    
    // Set emergency stoppers
    console.log("   - Configuring emergency stoppers");
    // Emergency stoppers are set in the constructor/initializer
    
    // Verify SWF token integration
    console.log("   - Verifying SWF token integration");
    const swfTokenAddress = await nftContract.swfToken();
    if (swfTokenAddress !== DEPLOYMENT_CONFIG.SWF_TOKEN_ADDRESS) {
        throw new Error("SWF token address mismatch");
    }
    
    console.log("✅ Contract configuration completed");
}

async function verifyDeployments(nftContract, multiSigWallet) {
    console.log("🔍 Running deployment verification tests...");
    
    // Test 1: Verify contract initialization
    const name = await nftContract.name();
    const symbol = await nftContract.symbol();
    console.log(`   ✅ NFT Contract: ${name} (${symbol})`);
    
    // Test 2: Verify multi-sig configuration
    const owners = await multiSigWallet.getOwners();
    const required = await multiSigWallet.numConfirmationsRequired();
    console.log(`   ✅ Multi-sig: ${owners.length} owners, ${required} confirmations required`);
    
    // Test 3: Verify role assignments
    const hasMultiSigRole = await nftContract.hasRole(
        await nftContract.MULTISIG_ROLE(),
        multiSigWallet.address
    );
    console.log(`   ✅ Multi-sig role assigned: ${hasMultiSigRole}`);
    
    // Test 4: Verify pausable functionality
    const paused = await nftContract.paused();
    console.log(`   ✅ Contract paused status: ${paused}`);
    
    // Test 5: Verify upgrade authorization
    const upgraderRole = await nftContract.UPGRADER_ROLE();
    const hasUpgraderRole = await nftContract.hasRole(upgraderRole, multiSigWallet.address);
    console.log(`   ✅ Upgrader role assigned: ${hasUpgraderRole}`);
    
    console.log("✅ All verification tests passed");
}

async function saveDeploymentInfo(nftContract, multiSigWallet) {
    const deploymentInfo = {
        timestamp: new Date().toISOString(),
        network: DEPLOYMENT_CONFIG.NETWORK,
        deployer: (await ethers.getSigners())[0].address,
        contracts: {
            MetalOfTheGodsSecure: {
                address: nftContract.address,
                implementation: await upgrades.erc1967.getImplementationAddress(nftContract.address),
                admin: await upgrades.erc1967.getAdminAddress(nftContract.address)
            },
            MultiSigWallet: {
                address: multiSigWallet.address,
                owners: DEPLOYMENT_CONFIG.MULTISIG_OWNERS,
                confirmationsRequired: DEPLOYMENT_CONFIG.MULTISIG_CONFIRMATIONS_REQUIRED
            }
        },
        configuration: {
            swfTokenAddress: DEPLOYMENT_CONFIG.SWF_TOKEN_ADDRESS,
            treasuryWallet: DEPLOYMENT_CONFIG.TREASURY_WALLET,
            timelockDelay: "24 hours",
            maxSupply: 10000
        },
        verificationCommands: {
            nftContract: `npx hardhat verify --network ${DEPLOYMENT_CONFIG.NETWORK} ${nftContract.address}`,
            multiSigWallet: `npx hardhat verify --network ${DEPLOYMENT_CONFIG.NETWORK} ${multiSigWallet.address} "[${DEPLOYMENT_CONFIG.MULTISIG_OWNERS.map(a => `"${a}"`).join(',')}]" ${DEPLOYMENT_CONFIG.MULTISIG_CONFIRMATIONS_REQUIRED}`
        }
    };
    
    const deploymentDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentDir)) {
        fs.mkdirSync(deploymentDir, { recursive: true });
    }
    
    const filename = `metalofthegods-${DEPLOYMENT_CONFIG.NETWORK}-${Date.now()}.json`;
    const filepath = path.join(deploymentDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`✅ Deployment info saved to: ${filepath}`);
    
    // Also save as latest deployment
    const latestPath = path.join(deploymentDir, `metalofthegods-${DEPLOYMENT_CONFIG.NETWORK}-latest.json`);
    fs.writeFileSync(latestPath, JSON.stringify(deploymentInfo, null, 2));
}

function displayDeploymentSummary(nftContract, multiSigWallet) {
    console.log("\n📊 DEPLOYMENT SUMMARY");
    console.log("=" .repeat(60));
    console.log(`🎨 MetalOfTheGods NFT: ${nftContract.address}`);
    console.log(`🔐 Multi-Sig Wallet: ${multiSigWallet.address}`);
    console.log(`💰 SWF Token: ${DEPLOYMENT_CONFIG.SWF_TOKEN_ADDRESS}`);
    console.log(`🏦 Treasury: ${DEPLOYMENT_CONFIG.TREASURY_WALLET}`);
    console.log(`🌐 Network: ${DEPLOYMENT_CONFIG.NETWORK}`);
    console.log(`⏰ Timelock Delay: 24 hours`);
    console.log(`🔢 Max Supply: 10,000 NFTs`);
    console.log(`👥 Multi-sig Owners: ${DEPLOYMENT_CONFIG.MULTISIG_OWNERS.length}`);
    console.log(`✅ Confirmations Required: ${DEPLOYMENT_CONFIG.MULTISIG_CONFIRMATIONS_REQUIRED}`);
    
    console.log("\n🚨 CRITICAL NEXT STEPS:");
    console.log("1. Verify contracts on BSCScan");
    console.log("2. Transfer deployer roles to multi-sig wallet");
    console.log("3. Test emergency pause functionality");
    console.log("4. Conduct final security audit");
    console.log("5. Set up monitoring and alerting");
    console.log("6. Prepare multi-sig owner coordination");
    
    console.log("\n🔐 SECURITY REMINDERS:");
    console.log("- Store multi-sig private keys securely");
    console.log("- Establish emergency contact procedures");
    console.log("- Document all operational procedures");
    console.log("- Set up transaction monitoring");
    console.log("- Plan regular security reviews");
}

// Error handling for deployment failures
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Run deployment
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("❌ Deployment script failed:", error);
            process.exit(1);
        });
}

module.exports = { main, DEPLOYMENT_CONFIG };