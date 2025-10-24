# LiquidityRewardsVault - Deployment & Migration Guide

## 🎯 What Was Built

A **full-featured LP token staking vault** with:
- ✅ **Staking Rewards** - Time-weighted reward distribution
- ✅ **APY Calculation** - Real-time APY based on reward rate
- ✅ **Lock Periods** - Configurable stake lock periods (default: 7 days)
- ✅ **Minimum Stakes** - Minimum stake requirements
- ✅ **Claim Rewards** - Separate reward claiming without unstaking
- ✅ **Emergency Controls** - Pause functionality and emergency withdrawals
- ✅ **Owner Management** - Adjustable reward rates, lock periods, and minimums
- ✅ **Security Features** - ReentrancyGuard, Pausable, proper access controls
- ✅ **Event Emissions** - Full event tracking for staking history

##Contract Features

### User Functions
1. **stake(uint256 amount)** - Stake LP tokens to earn rewards
2. **withdraw(uint256 amount)** - Unstake LP tokens (after lock period)
3. **claimRewards()** - Claim accumulated rewards without unstaking
4. **exit(uint256 amount)** - Withdraw and claim in one transaction
5. **pendingRewards(address)** - View pending unclaimed rewards
6. **getUserStake(address)** - Get complete stake information

### Owner Functions
1. **setRewardRate(uint256)** - Adjust reward rate
2. **setLockPeriod(uint256)** - Change lock period
3. **setMinimumStake(uint256)** - Update minimum stake
4. **fundRewards(uint256)** - Add reward tokens to vault
5. **pause() / unpause()** - Emergency controls
6. **recoverERC20()** - Recover accidentally sent tokens

### View Functions
1. **calculateAPY()** - Get current APY percentage
2. **rewardPerToken()** - Current reward per token value
3. **earned(address)** - Calculate earned rewards for user

## 📋 Deployment Steps

### Prerequisites
1. BSC mainnet RPC endpoint configured
2. Deployer wallet with BNB for gas
3. BSCScan API key for verification
4. SWF tokens to fund rewards

### Step 1: Configure Deployment Parameters

Edit `scripts/deploy-liquidity-rewards-vault.js` if needed:

```javascript
const LP_TOKEN = "0x3aA970cD91f792427CF28Bc687B4713Ee26e2090"; // Your LP pair
const REWARD_TOKEN = "0x83E17aeB148d9b4b7Be0BE7C87dd73531a5a5738"; // SWF token
const REWARD_RATE = ethers.utils.parseEther("0.00001"); // Rewards per second
const LOCK_PERIOD = 7 * 24 * 60 * 60; // 7 days
const MINIMUM_STAKE = ethers.utils.parseEther("0.1"); // 0.1 LP tokens
```

### Step 2: Deploy to BSC Mainnet

```bash
npx hardhat run scripts/deploy-liquidity-rewards-vault.js --network bsc
```

**Expected Output:**
```
🚀 Deploying LiquidityRewardsVault to BSC Mainnet...
✅ LiquidityRewardsVault deployed to: 0x... 
📊 Current APY: 31.50 %
💾 Deployment info saved to: liquidity-rewards-vault-deployment.json
```

### Step 3: Fund the Vault with Rewards

The vault needs SWF tokens to distribute as rewards:

```javascript
// Connect as owner
const vault = await ethers.getContractAt("LiquidityRewardsVault", VAULT_ADDRESS);
const swfToken = await ethers.getContractAt("IERC20", SWF_TOKEN_ADDRESS);

// Approve vault to receive rewards
await swfToken.approve(vault.address, rewardAmount);

// Fund vault (requires SWF tokens)
await vault.fundRewards(ethers.utils.parseEther("100000")); // 100k SWF
```

**Recommended Initial Funding:**
- For ~30% APY: Fund with 3-6 months of rewards upfront
- Example: If expecting 100 LP tokens staked → ~31,500 SWF/year → Fund ~15,000 SWF for 6 months

### Step 4: Verify Contract on BSCScan

```bash
npx hardhat verify --network bsc VAULT_ADDRESS \
  "LP_TOKEN_ADDRESS" \
  "REWARD_TOKEN_ADDRESS" \
  "REWARD_RATE" \
  "LOCK_PERIOD" \
  "MINIMUM_STAKE"
```

### Step 5: Update Application Configuration

#### A. Update Backend Service

Edit `server/services/liquidityVaultService.js` or create router to use new service:

```javascript
// OLD (points to simple vault)
const LIQUIDITY_VAULT_ADDRESS = '0xd070776c3603138a1d4b93a2f668d604a4a99e34';

// NEW (points to rewards vault)
const LIQUIDITY_VAULT_ADDRESS = 'YOUR_NEW_VAULT_ADDRESS';
```

Or switch to use the new service:
```javascript
const vaultService = require('./liquidityRewardsVaultService');
```

#### B. Update Frontend Configuration

Edit `client/src/config/contracts.ts`:

```typescript
export const CONTRACTS = {
  BSC_MAINNET: {
    // ... other contracts
    LIQUIDITY_VAULT: 'YOUR_NEW_VAULT_ADDRESS',  // Update this
    // Remove or update duplicates:
    // REVENUE_ROUTER and REAL_ESTATE_FUND should NOT share this address
  }
}
```

#### C. Import New ABI in Frontend

The ABI is already copied to `client/src/abis/LiquidityRewardsVault.json`

Update imports where needed:
```typescript
import LiquidityRewardsVaultABI from '../abis/LiquidityRewardsVault.json';
```

### Step 6: Update Frontend Components

The existing `LiquidityVaultPage.tsx` already has:
- ✅ Stake/Unstake handlers
- ✅ Approve flow
- ✅ Loading states
- ⚠️ Needs: Claim rewards button implementation

Add claim rewards handler in `client/src/pages/LiquidityVaultPage.tsx`:

```typescript
const handleClaimRewards = async () => {
  if (!account) return;
  
  setIsClaiming(true);
  setTxError('');
  setTxMessage('');
  
  try {
    const signer = await getSigner();
    const vaultAddress = ethers.utils.getAddress(CONTRACTS.BSC_MAINNET.LIQUIDITY_VAULT);
    const vaultContract = new ethers.Contract(vaultAddress, LiquidityRewardsVaultABI, signer);
    
    const tx = await vaultContract.claimRewards();
    setTxMessage('⏳ Claiming rewards... waiting for confirmation');
    
    await tx.wait();
    setTxMessage('✅ Rewards claimed successfully!');
    
    await Promise.all([loadUserStake(), loadStats(), loadHistory()]);
    setTimeout(() => setTxMessage(''), 5000);
  } catch (error: any) {
    console.error('Claim error:', error);
    setTxError(`Failed to claim rewards: ${error?.message || 'Unknown error'}`);
  } finally {
    setIsClaiming(false);
  }
};
```

Then add the button (it already exists, just needs onClick):
```typescript
<Button 
  onClick={handleClaimRewards}
  className="bg-green-600 hover:bg-green-700 text-white"
  disabled={isClaiming}
>
  {isClaiming ? '⏳ Claiming...' : 'Claim Rewards'}
</Button>
```

## 🔄 User Migration Strategy

You have users who already staked in the OLD simple vault. Here's how to migrate them:

### Option 1: Manual Migration (Recommended)

**Communicate to users:**
1. "New vault launched with staking rewards!"
2. "Unstake from old vault" (give them the address)
3. "Stake in new vault" (give them new address)
4. No loss of LP tokens, just transfer between vaults

**Benefits:**
- Clean separation
- Users control their migration
- No complex smart contract migration logic

### Option 2: Automated Migration Contract

Create a migration helper contract:
```solidity
contract VaultMigrator {
    function migrate(uint256 amount) external {
        oldVault.withdraw(amount);  // Withdraw from old
        lpToken.approve(newVault, amount);
        newVault.stake(amount);  // Stake in new
    }
}
```

### Option 3: Keep Both Running

- Old vault = No rewards, simple custody
- New vault = With rewards
- Let users choose when to migrate
- Eventually sunset old vault after most migrate

**Recommended: Option 1 with clear communication**

##APY & Reward Calculations

### Current Configuration
```
Reward Rate: 0.00001 SWF per second per token
= 0.864 SWF per day per token
= 315.36 SWF per year per token
= ~31.5% APY
```

### Adjusting APY

To change APY after deployment:
```javascript
// Example: Increase to ~50% APY
const newRate = ethers.utils.parseEther("0.000016"); // ~50% APY
await vault.setRewardRate(newRate);
```

**APY Formula:**
```
APY = (rewardRate * 365 days * 100) / totalStaked
```

## 🧪 Testing Checklist

Before announcing to users:

### Smart Contract Tests
- [ ] Stake LP tokens successfully
- [ ] Cannot withdraw before lock period
- [ ] Can withdraw after lock period
- [ ] Rewards accumulate over time
- [ ] Claim rewards without unstaking
- [ ] Exit (withdraw + claim) works
- [ ] Owner can adjust reward rate
- [ ] Owner can pause in emergency
- [ ] Emergency withdraw works when paused

### Frontend Tests
- [ ] Stats display correctly
- [ ] APY shows accurate percentage
- [ ] User stake amount displays
- [ ] Pending rewards update in real-time
- [ ] Approve button appears when needed
- [ ] Stake button works
- [ ] Unstake button respects lock period
- [ ] Claim button works
- [ ] Transaction messages appear
- [ ] Data refreshes after transactions

### Integration Tests
- [ ] Backend API returns correct stats
- [ ] Staking history populates
- [ ] WebSocket events fire for staking actions
- [ ] Multiple users can stake simultaneously

## 📊 Monitoring

After deployment, monitor:

1. **Total Staked**: Should grow as users migrate
2. **Reward Token Balance**: Should decrease as rewards are claimed
3. **APY**: Should remain stable unless reward rate changes
4. **Lock Period Compliance**: Users shouldn't be able to withdraw early
5. **Event Emissions**: All staking events should be captured

## 🚨 Emergency Procedures

If something goes wrong:

### Pause the Vault
```javascript
await vault.pause();
```

### Allow Emergency Withdrawals
When paused, users can call:
```javascript
await vault.emergencyWithdraw();
```
This returns their LP tokens but forfeits unclaimed rewards.

### Recover Misent Tokens
```javascript
await vault.recoverERC20(tokenAddress, amount);
```

## 📝 Next Steps Summary

1. **Deploy** contract to BSC mainnet
2. **Fund** vault with reward tokens (100k+ SWF recommended)
3. **Verify** on BSCScan
4. **Update** backend service address
5. **Update** frontend contract address
6. **Add** claim rewards button handler
7. **Test** thoroughly with small amounts
8. **Announce** to users with migration instructions
9. **Monitor** vault performance and reward distribution

## 🎉 Success Metrics

Your vault is successful when:
- ✅ Users can stake and earn rewards
- ✅ APY is attractive and sustainable
- ✅ Rewards are claimed regularly
- ✅ No security issues or exploits
- ✅ Total value locked (TVL) grows
- ✅ User satisfaction is high

---

**Contract File**: `contracts/LiquidityRewardsVault.sol`  
**Deployment Script**: `scripts/deploy-liquidity-rewards-vault.js`  
**Backend Service**: `server/services/liquidityRewardsVaultService.js`  
**Frontend ABI**: `client/src/abis/LiquidityRewardsVault.json`

**Status**: ✅ Ready to Deploy  
**Estimated Deployment Time**: ~30 minutes  
**Estimated Migration Time**: 1-2 weeks for user adoption
