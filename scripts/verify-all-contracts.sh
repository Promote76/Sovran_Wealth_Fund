#!/bin/bash
# AXIOM - BSCScan Contract Verification Script
# Run this to verify all deployed contracts on BSCScan

echo "🔍 AXIOM - BSCScan Contract Verification"
echo "=========================================="
echo ""

# 1. BasketIndex
echo "1️⃣ Verifying BasketIndex..."
npx hardhat verify --network bsc 0x06b88f3Faa07215F6f5fb0A10A3F058D3f25ecF6
echo ""

# 2. AdvancedStaking
echo "2️⃣ Verifying AdvancedStaking..."
npx hardhat verify --network bsc \
  0x5eE9d1b28c261AE132B6d324b02452bC90750136 \
  "0x83E17aeB148d9b4b7Be0Be7C87dd73531a5a5738" \
  "0x83E17aeB148d9b4b7Be0Be7C87dd73531a5a5738"
echo ""

# 3. EnhancedNFTMarketplace
echo "3️⃣ Verifying EnhancedNFTMarketplace..."
npx hardhat verify --network bsc \
  0xEc973eD81082a1d539F380eF94f6215793410036 \
  "0xE3059F3479AAC2846299664BABe1d5D95C18D1C7"
echo ""

# 4. DynamicAPRController
echo "4️⃣ Verifying DynamicAPRController..."
npx hardhat verify --network bsc \
  0x14dFA6b6785643850e5c09336F7Cd5971458e28d \
  "0x06b88f3Faa07215F6f5fb0A10A3F058D3f25ecF6" \
  "0x0165878A594ca255338adfa4d48449f69242Eb8F" \
  "1500" \
  "0xE3059F3479AAC2846299664BABe1d5D95C18D1C7"
echo ""

echo "✅ Verification complete!"
echo "Check contracts on BSCScan for green checkmark"
