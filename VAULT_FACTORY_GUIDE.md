# VaultFactory - Multi-Pair LP Staking System

## 🎯 Overview

The **VaultFactory** system lets you deploy and manage multiple isolated LP staking vaults from a single factory contract. Each LP token pair gets its own vault with customizable parameters.

### Why Factory Pattern?

✅ **Easy Deployment** - One function call creates a new vault  
✅ **Isolated Security** - Each pair has its own contract  
✅ **Customizable** - Different APY/lock periods per pair  
✅ **Central Registry** - Track all vaults in one place  
✅ **Professional** - Standard DeFi architecture  

## 🏗️ Architecture

```
VaultFactory (0x...)
├── SWF-WBNB Vault (0x...) → 31.5% APY, 7 day lock
├── SWF-BUSD Vault (0x...) → 25% APY, 14 day lock
├── AXM-BNB Vault (0x...) → 40% APY, 30 day lock
└── ... (unlimited vaults)
```

**Each vault is:**
- A separate LiquidityRewardsVault contract
- Independently funded with rewards
- Customized for its LP token pair
- Fully isolated from other vaults

## 📋 Deployment Steps

### Step 1: Deploy the Factory

```bash
npx hardhat run scripts/deploy-vault-factory.js --network bsc
```

This will:
1. Deploy VaultFactory contract
2. Automatically create first vault (SWF-WBNB LP)
3. Save deployment info to `vault-factory-deployment.json`

**Output:**
```
🏭 Deploying VaultFactory to BSC Mainnet...
✅ VaultFactory deployed to: 0x...
✅ First vault created at: 0x...
📊 Vault APY: 31.50 %
```

### Step 2: Verify Contracts on BSCScan

```bash
# Verify factory
npx hardhat verify --network bsc FACTORY_ADDRESS "SWF_TOKEN_ADDRESS"

# Verify first vault
npx hardhat verify --network bsc VAULT_ADDRESS \
  "LP_TOKEN" "REWARD_TOKEN" "REWARD_RATE" "LOCK_PERIOD" "MIN_STAKE"
```

### Step 3: Create Additional Vaults

**Option A: Via Script**

Create a new script `scripts/create-vault.js`:

```javascript
const { ethers } = require("hardhat");

async function main() {
  const FACTORY_ADDRESS = "YOUR_FACTORY_ADDRESS";
  
  // Configuration for new vault
  const LP_TOKEN = "0x..."; // Your LP token address
  const REWARD_RATE = ethers.parseEther("0.00001"); // Rewards per second
  const LOCK_PERIOD = 14 * 24 * 60 * 60; // 14 days
  const MIN_STAKE = ethers.parseEther("0.1");
  
  const factory = await ethers.getContractAt("VaultFactory", FACTORY_ADDRESS);
  
  console.log("Creating new vault...");
  const tx = await factory.createVault(LP_TOKEN, REWARD_RATE, LOCK_PERIOD, MIN_STAKE);
  const receipt = await tx.wait();
  
  // Get new vault address
  const newVault = await factory.getVault(LP_TOKEN);
  console.log("✅ Vault created:", newVault);
}

main();
```

**Option B: Direct Contract Interaction**

```javascript
// Using ethers.js
const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);

await factory.createVault(
  "0xYourLPToken",     // LP token to stake
  "0.00001 ether",     // Reward rate (per second)
  7 * 24 * 60 * 60,    // Lock period (seconds)
  "0.1 ether"          // Minimum stake
);
```

### Step 4: Fund Vaults with Rewards

Each vault needs SWF tokens to distribute as rewards:

```javascript
const SWF = new ethers.Contract(SWF_ADDRESS, ERC20_ABI, signer);
const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);

// Approve vault to receive SWF
await SWF.approve(VAULT_ADDRESS, ethers.parseEther("100000"));

// Fund vault
await vault.fundRewards(ethers.parseEther("100000"));
```

## 🔧 Backend Integration

### Query All Vaults

```javascript
const vaultFactoryService = require('./services/vaultFactoryService');

// Get all vaults with stats
const vaults = await vaultFactoryService.getAllVaults();
console.log(vaults);
/* Returns:
[
  {
    lpToken: "0x3aA970...",
    vaultAddress: "0xabc...",
    totalStaked: "1234.56",
    apy: "31.50",
    lockPeriodDays: "7.0",
    ...
  },
  ...
]
*/
```

### Query Specific Vault

```javascript
// Get vault for specific LP token
const vault = await vaultFactoryService.getVaultForLP("0xYourLPToken");

if (!vault) {
  console.log("No vault exists for this LP token");
} else {
  console.log("Vault address:", vault.vaultAddress);
  console.log("APY:", vault.apy, "%");
}
```

### Query User Stakes Across All Vaults

```javascript
const userAddress = "0x...";
const allVaults = await vaultFactoryService.getAllVaults();

for (const vault of allVaults) {
  const stake = await vaultFactoryService.getUserStakeInVault(
    vault.vaultAddress,
    userAddress
  );
  
  if (stake.isStaking) {
    console.log(`Staked ${stake.amount} in ${vault.vaultAddress}`);
    console.log(`Pending rewards: ${stake.pendingRewards}`);
  }
}
```

## 🎨 Frontend Integration

### Display All Available Vaults

```typescript
import { useEffect, useState } from 'react';

function VaultList() {
  const [vaults, setVaults] = useState([]);
  
  useEffect(() => {
    fetch('/api/vaults/all')
      .then(res => res.json())
      .then(data => setVaults(data));
  }, []);
  
  return (
    <div>
      <h2>LP Staking Vaults</h2>
      {vaults.map(vault => (
        <VaultCard key={vault.vaultAddress} vault={vault} />
      ))}
    </div>
  );
}

function VaultCard({ vault }) {
  return (
    <div className="vault-card">
      <h3>{vault.lpToken}</h3>
      <p>APY: {vault.apy}%</p>
      <p>Total Staked: {vault.totalStaked}</p>
      <p>Lock Period: {vault.lockPeriodDays} days</p>
      <button>Stake LP Tokens</button>
    </div>
  );
}
```

### Interact with Specific Vault

```typescript
// User selects a vault from the list
const vaultAddress = selectedVault.vaultAddress;
const vaultContract = new ethers.Contract(vaultAddress, VAULT_ABI, signer);

// Stake in that vault
const amount = ethers.parseEther("10");
await vaultContract.stake(amount);
```

## 📊 Example Vault Configurations

### Conservative (Low Risk)
```javascript
{
  lpToken: "SWF-BUSD LP",
  rewardRate: "0.000005 SWF/sec",  // ~15% APY
  lockPeriod: 3 days,
  minimumStake: "0.01 LP"
}
```

### Moderate (Balanced)
```javascript
{
  lpToken: "SWF-WBNB LP",
  rewardRate: "0.00001 SWF/sec",  // ~31% APY
  lockPeriod: 7 days,
  minimumStake: "0.1 LP"
}
```

### Aggressive (High Reward)
```javascript
{
  lpToken: "AXM-BNB LP",
  rewardRate: "0.00002 SWF/sec",  // ~63% APY
  lockPeriod: 30 days,
  minimumStake: "1.0 LP"
}
```

## 🛠️ Factory Management Functions

### Owner Functions

```javascript
// Create new vault
factory.createVault(lpToken, rewardRate, lockPeriod, minStake);

// Update default reward token for future vaults
factory.setDefaultRewardToken(newTokenAddress);

// Transfer factory ownership
factory.transferOwnership(newOwner);
```

### View Functions

```javascript
// Get vault for LP token
factory.getVault(lpTokenAddress);

// Get all vault addresses
factory.getAllVaults();

// Get vault count
factory.vaultCount();

// Get detailed info about all vaults
factory.getVaultDetails();

// Check if address is a valid vault
factory.isVault(address);
```

## 🚀 API Routes (Recommended)

Add these endpoints to your Express server:

```javascript
// Get all vaults
app.get('/api/vaults/all', async (req, res) => {
  const vaults = await vaultFactoryService.getAllVaults();
  res.json(vaults);
});

// Get vault for specific LP token
app.get('/api/vaults/lp/:lpToken', async (req, res) => {
  const vault = await vaultFactoryService.getVaultForLP(req.params.lpToken);
  res.json(vault);
});

// Get user stakes across all vaults
app.get('/api/vaults/user/:address', async (req, res) => {
  const vaults = await vaultFactoryService.getAllVaults();
  const stakes = await Promise.all(
    vaults.map(v => vaultFactoryService.getUserStakeInVault(v.vaultAddress, req.params.address))
  );
  res.json(stakes.filter(s => s.isStaking));
});

// Get factory info
app.get('/api/vaults/factory', async (req, res) => {
  const info = await vaultFactoryService.getFactoryInfo();
  res.json(info);
});
```

## 📈 Scaling Strategy

### Phase 1: Core Pairs (Week 1)
- Deploy SWF-WBNB vault (31% APY, 7 days)
- Deploy SWF-BUSD vault (25% APY, 14 days)

### Phase 2: Popular Pairs (Week 2-4)
- Deploy AXM-BNB vault (40% APY, 30 days)
- Deploy governance token pairs

### Phase 3: Community Requests (Ongoing)
- Add vaults based on user demand
- Adjust APYs based on performance
- Monitor TVL and adjust rewards

## 🎯 Benefits vs Single Vault Deployment

| Feature | Single Vault | Factory System |
|---------|--------------|----------------|
| Deploy New Pair | Redeploy everything | One function call |
| Track Vaults | Manual tracking | Automatic registry |
| Different APYs | Not possible | ✅ Per vault |
| Security Isolation | N/A | ✅ Each vault isolated |
| Frontend Integration | Complex | ✅ Loop through registry |
| Gas Efficiency | ⚠️ Redeployment costly | ✅ Efficient |

## 🔐 Security Features

✅ **Owner-Only Deployment** - Only factory owner can create vaults  
✅ **One Vault Per LP** - Prevents duplicate vaults for same pair  
✅ **Isolated Vaults** - Each vault is independent contract  
✅ **No Migration Risk** - Users interact directly with vaults  
✅ **Verified Vaults** - Factory tracks all legitimate vaults  

## 📝 Summary

**Files Created:**
- `contracts/VaultFactory.sol` - Factory contract
- `scripts/deploy-vault-factory.js` - Deployment script
- `server/services/vaultFactoryService.js` - Backend integration

**Next Steps:**
1. Deploy factory to BSC mainnet
2. Create vaults for your LP pairs
3. Fund vaults with SWF rewards
4. Update frontend to display all vaults
5. Monitor and adjust APYs as needed

**Result:**
A professional, scalable multi-vault LP staking system that grows with your platform! 🚀
