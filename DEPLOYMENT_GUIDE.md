# 🚀 BSC Smart Contract Deployment Guide

This guide will help you deploy and verify your smart contracts on Binance Smart Chain directly from Replit - **no need for Remix IDE!**

---

## ✅ Prerequisites Checklist

Before deploying, make sure you have:

- [ ] **BNB for gas fees** - At least 0.05 BNB in your deployer wallet
- [ ] **Private key** - Set in Replit Secrets as `PRIVATE_KEY`
- [ ] **BSC RPC URL** - Set in Replit Secrets as `BSC_RPC_URL` (from Alchemy)
- [ ] **BSCScan API key** - Set in Replit Secrets as `BSCSCAN_API_KEY` (for verification)

---

## 🔐 Setup Your Secrets

All sensitive information is already configured in **Replit Secrets**:

1. `PRIVATE_KEY` - Your wallet private key (starts with `0x`)
2. `BSC_RPC_URL` - Your Alchemy BSC endpoint
3. `BSCSCAN_API_KEY` - Your BSCScan API key

**Never share these values with anyone!**

---

## 📦 Available Smart Contracts

### 1. **SWFToken** - Main ERC20 Token
The core token with minting, burning, and role-based access control.

**Deploy Command:**
```bash
npx hardhat run scripts/deploy-bsc.js --network bsc
```

**Verify Command:**
```bash
node scripts/verify-bsc.js <CONTRACT_ADDRESS>
```

---

### 2. **SoloMethodEngine** - Staking Contract
Dynamic APR staking with 10-30% rewards.

**Deploy Command:**
```bash
npx hardhat run scripts/deploy-bsc.js --network bsc -- 2 <SWF_TOKEN_ADDRESS>
```

**Example:**
```bash
npx hardhat run scripts/deploy-bsc.js --network bsc -- 2 0x83E17aeB148d9b4b7Be0Be7C87dd73531a5a5738
```

**Verify Command:**
```bash
node scripts/verify-bsc.js <CONTRACT_ADDRESS> <SWF_TOKEN_ADDRESS>
```

---

### 3. **SWFBasketVault** - Token Vault
Token deposit vault with 1:1 basket token minting.

**Deploy Command:**
```bash
npx hardhat run scripts/deploy-bsc.js --network bsc -- 3 <SWF_TOKEN_ADDRESS>
```

**Verify Command:**
```bash
node scripts/verify-bsc.js <CONTRACT_ADDRESS> <SWF_TOKEN_ADDRESS>
```

---

### 4. **DynamicAPRController** - APR Manager
Automated APR adjustment based on vault deposits.

**Deploy Command:**
```bash
npx hardhat run scripts/deploy-bsc.js --network bsc -- 4 <STAKING_ADDRESS> <VAULT_ADDRESS>
```

**Verify Command:**
```bash
node scripts/verify-bsc.js <CONTRACT_ADDRESS> <STAKING_ADDRESS> <VAULT_ADDRESS>
```

---

## 📝 Step-by-Step Deployment Process

### Step 1: Deploy SWF Token
```bash
npx hardhat run scripts/deploy-bsc.js --network bsc
```

**Expected Output:**
```
🚀 BSC Smart Contract Deployment Tool
📋 Deployment Information:
├─ Network: bsc
├─ Chain ID: 56
├─ Deployer Address: 0x...
├─ Deployer Balance: 0.5 BNB

🔨 Deploying: SWFToken
✅ Deployment Successful!
📍 Contract Address: 0x...
🔗 BSCScan: https://bscscan.com/address/0x...
```

**Copy the contract address** - you'll need it for the next steps!

---

### Step 2: Verify on BSCScan
Wait 30-60 seconds, then run:
```bash
node scripts/verify-bsc.js <YOUR_CONTRACT_ADDRESS>
```

**Expected Output:**
```
🔍 BSC Contract Verification Tool
✅ Verification Successful!
🔗 View on BSCScan: https://bscscan.com/address/0x...#code
```

---

### Step 3: Deploy Staking Contract (Optional)
```bash
npx hardhat run scripts/deploy-bsc.js --network bsc -- 2 <SWF_TOKEN_ADDRESS>
```

Then verify:
```bash
node scripts/verify-bsc.js <STAKING_CONTRACT_ADDRESS> <SWF_TOKEN_ADDRESS>
```

---

### Step 4: Deploy Vault (Optional)
```bash
npx hardhat run scripts/deploy-bsc.js --network bsc -- 3 <SWF_TOKEN_ADDRESS>
```

Then verify:
```bash
node scripts/verify-bsc.js <VAULT_CONTRACT_ADDRESS> <SWF_TOKEN_ADDRESS>
```

---

### Step 5: Deploy APR Controller (Optional)
```bash
npx hardhat run scripts/deploy-bsc.js --network bsc -- 4 <STAKING_ADDRESS> <VAULT_ADDRESS>
```

Then verify:
```bash
node scripts/verify-bsc.js <APR_CONTROLLER_ADDRESS> <STAKING_ADDRESS> <VAULT_ADDRESS>
```

---

## 📊 Deployment Records

All deployments are automatically saved to the `deployments/` folder with:
- Contract address
- Deployer address
- Transaction hash
- Constructor arguments
- Timestamp

These records make verification easy - the script auto-detects deployment info!

---

## 🔧 Troubleshooting

### ❌ "Insufficient funds for gas"
**Solution:** Add more BNB to your deployer wallet (at least 0.05 BNB)

### ❌ "Invalid API Key" during verification
**Solution:** Check that `BSCSCAN_API_KEY` is correctly set in Replit Secrets

### ❌ "Contract source code already verified"
**Solution:** This is good! Your contract is already verified on BSCScan

### ❌ "Transaction timeout"
**Solution:** BSC network might be congested. Wait a few minutes and try again

### ❌ "Nonce too low"
**Solution:** Clear transaction cache: `rm -rf cache/ artifacts/` then try again

---

## 🎯 Quick Reference Commands

| Action | Command |
|--------|---------|
| **Deploy SWF Token** | `npx hardhat run scripts/deploy-bsc.js --network bsc` |
| **Deploy Staking** | `npx hardhat run scripts/deploy-bsc.js --network bsc -- 2 <TOKEN>` |
| **Deploy Vault** | `npx hardhat run scripts/deploy-bsc.js --network bsc -- 3 <TOKEN>` |
| **Deploy APR Controller** | `npx hardhat run scripts/deploy-bsc.js --network bsc -- 4 <STAKING> <VAULT>` |
| **Verify Contract** | `node scripts/verify-bsc.js <ADDRESS> [args...]` |
| **Check Balance** | `npx hardhat run scripts/check-balance.js --network bsc` |

---

## 🌐 BSC Network Information

| Parameter | Value |
|-----------|-------|
| **Network Name** | BNB Smart Chain Mainnet |
| **Chain ID** | 56 |
| **Currency** | BNB |
| **Block Explorer** | https://bscscan.com |
| **RPC URL** | Your Alchemy endpoint |

---

## 🔒 Security Best Practices

1. ✅ **Never commit secrets** to Git
2. ✅ **Use Replit Secrets** for all sensitive data
3. ✅ **Verify contracts** on BSCScan for transparency
4. ✅ **Test on BSC Testnet** before mainnet deployment
5. ✅ **Keep private keys secure** - never share them

---

## 💡 What's Better Than Remix IDE?

**Replit Deployment Advantages:**
- ✅ **Automated verification** - One command verifies on BSCScan
- ✅ **Deployment records** - All deployments tracked automatically
- ✅ **Secure secrets** - Keys stored safely in Replit Secrets
- ✅ **Version control** - Git integration for contract history
- ✅ **Multi-network support** - BSC, Polygon, and more
- ✅ **Script automation** - Deploy entire systems with one command

---

## 📞 Need Help?

- **BSCScan Support:** https://bscscan.com/contactus
- **Hardhat Docs:** https://hardhat.org/docs
- **BSC Docs:** https://docs.bnbchain.org

---

**Ready to deploy? Start with Step 1 above! 🚀**
