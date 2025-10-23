# PancakeSwap Liquidity Provision Fixes

## Problem Summary
Users were experiencing "Failed to add liquidity: Internal JSON-RPC error" when attempting to add liquidity to PancakeSwap pools through the AXIOM platform.

## Root Cause Analysis

### Critical Issue: Incorrect Decimal Handling
The code was using `ethers.utils.parseEther()` for all tokens, which assumes 18 decimals. This caused amounts to be orders of magnitude wrong for tokens with different decimal places:
- **SWF Token**: Has specific decimals (not necessarily 18)
- **USDT/USDC**: Typically 6 decimals
- **BTCB**: 8 decimals

When the wrong amount was sent to PancakeSwap Router, the `transferFrom` call would revert, surfacing as the cryptic "Internal JSON-RPC error."

### Additional Issues Found
1. **Address Checksum Validation**: Addresses weren't normalized before contract interactions
2. **Poor Error Handling**: Generic error messages didn't surface the actual revert reason
3. **Allowance Checks**: Used parseEther for comparisons, making approval checks unreliable

## Fixes Implemented

### 1. Token-Specific Decimal Handling ✅
**File**: `client/src/components/ProvideLiquidity.tsx`

**Before**:
```typescript
const amountADesired = ethers.utils.parseEther(amountA);
const amountBDesired = ethers.utils.parseEther(amountB);
```

**After**:
```typescript
const decimalsA = pairInfo.decimalsA || 18;
const decimalsB = pairInfo.decimalsB || 18;

const amountADesired = ethers.utils.parseUnits(amountA, decimalsA);
const amountBDesired = ethers.utils.parseUnits(amountB, decimalsB);
```

**Impact**: Amounts are now calculated correctly for any token, regardless of decimals.

### 2. Address Normalization ✅
**File**: `client/src/components/ProvideLiquidity.tsx`

**Added**:
```typescript
const routerAddress = ethers.utils.getAddress(PANCAKESWAP_CONFIG.ROUTER_V2);
const tokenAAddress = ethers.utils.getAddress(selectedPair.tokenA);
const tokenBAddress = ethers.utils.getAddress(selectedPair.tokenB);
```

**Impact**: All addresses are properly checksummed before use, preventing validation errors.

### 3. Enhanced Error Handling ✅
**File**: `client/src/components/ProvideLiquidity.tsx`

**Added**:
```typescript
let errorMessage = 'Unknown error';
if (error?.error?.data?.message) {
  errorMessage = error.error.data.message;
} else if (error?.error?.message) {
  errorMessage = error.error.message;
} else if (error?.data?.message) {
  errorMessage = error.data.message;
} else if (error?.message) {
  errorMessage = error.message;
}

// Check for common error patterns
if (errorMessage.includes('insufficient')) {
  errorMessage = 'Insufficient balance. Please check your token balances.';
} else if (errorMessage.includes('allowance')) {
  errorMessage = 'Approval required. Please approve tokens first.';
}
// ... more patterns
```

**Impact**: Users now see actionable error messages instead of generic JSON-RPC errors.

### 4. Fixed Allowance Checks ✅
**File**: `client/src/components/ProvideLiquidity.tsx`

**Before**:
```typescript
const amountAWei = ethers.utils.parseEther(amountA || '0');
setNeedsApprovalA(allowanceA.lt(amountAWei));
```

**After**:
```typescript
const decimalsA = pairInfo.decimalsA || 18;
const amountAWei = ethers.utils.parseUnits(amountA || '0', decimalsA);
setNeedsApprovalA(allowanceA.lt(amountAWei));
```

**Impact**: Approval checks now work correctly for all token types.

## Testing Checklist

- [x] Fixed decimal handling with parseUnits
- [x] Added address normalization
- [x] Improved error messages
- [x] Fixed allowance comparisons
- [ ] User testing with actual liquidity provision
- [ ] Test with different token pairs (18 decimals, 6 decimals, 8 decimals)

## Expected Behavior Now

1. **SWF-WBNB**: Should work with correct decimal handling
2. **SWF-BUSD**: Should work if BUSD has correct decimals in pairInfo
3. **All Pairs**: Clear error messages if transactions fail
4. **Approvals**: Accurate detection of when approvals are needed

## Prevention Measures

1. **Always use `parseUnits` with token decimals** - Never assume 18 decimals
2. **Always normalize addresses** with `ethers.utils.getAddress()` before contract calls
3. **Extract detailed error info** from blockchain errors
4. **Validate pairInfo exists** before processing transactions

## Related Files
- `client/src/components/ProvideLiquidity.tsx` - Main liquidity component
- `client/src/config/pancakeswap.ts` - PancakeSwap configuration
- `client/src/config/contracts.ts` - Contract addresses
- `server/services/pancakePoolService.js` - Backend pair info service

## Date: October 23, 2025
**Status**: ✅ Fixes implemented and deployed
**Next Steps**: User testing required
