/**
 * Smart Contract Configuration
 * Central repository for all deployed contract addresses and ABIs
 */

import SWFVaultAdapterABI from '../abis/SWFVaultAdapter.json';
import GovernanceDividendPoolABI from '../abis/GovernanceDividendPool.json';

export const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function transfer(address to, uint256 amount) external returns (bool)'
];

export const CONTRACTS = {
  BSC_MAINNET: {
    AXM_TOKEN: '0x83E17aeB148d9b4b7Be0BE7C87dd73531a5a5738',
    VAULT_ADAPTER: {
      address: '0xeAFF0dB435DABB6f142A934e17123bfa752dbbd5',
      abi: SWFVaultAdapterABI
    },
    GOVERNANCE_DIVIDEND_POOL: {
      address: '0x63df9De7F74c15dE702De7D2fC7eB8205bfAC0B8',
      abi: GovernanceDividendPoolABI
    },
    BASKET_INDEX: '0x06b88f3Faa07215F6f5fb0A10A3F058D3f25ecF6',
    ADVANCED_STAKING: '0x5eE9d1b28c261AE132B6d324b02452bC90750136',
    NFT_MARKETPLACE: '0xEc973eD81082a1d539F380eF94f6215793410036',
    DYNAMIC_APR_CONTROLLER: '0x14dFA6b6785643850e5c09336F7Cd5971458e28d',
    LIQUIDITY_VAULT: '0xd070776c3603138a1d4b93a2f668d604a4a99e34',
    REAL_ESTATE_FUND: '0xd070776c3603138a1d4b93a2f668d604a4a99e34'
  }
} as const;

// Helper to get current network contracts
export const getContractConfig = (network: 'BSC_MAINNET' = 'BSC_MAINNET') => {
  return CONTRACTS[network];
};
