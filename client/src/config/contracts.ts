/**
 * Smart Contract Configuration
 * Central repository for all deployed contract addresses and ABIs
 */

import SWFVaultAdapterABI from '../abis/SWFVaultAdapter.json';
import GovernanceDividendPoolABI from '../abis/GovernanceDividendPool.json';
import AXIOMRevenueRouterABI from '../abis/AXIOMRevenueRouter.json';
import RealEstateAcquisitionFundABI from '../abis/RealEstateAcquisitionFund.json';

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
    WBNB_TOKEN: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    BUSD_TOKEN: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    LP_PAIRS: {
      SWF_WBNB: '0x3aA970cD91f792427CF28Bc687B4713Ee26e2090'
    },
    VAULT_ADAPTER: {
      address: '0xeAFF0dB435DABB6f142A934e17123bfa752dbbd5',
      abi: SWFVaultAdapterABI
    },
    GOVERNANCE_DIVIDEND_POOL: {
      address: '0x63df9De7F74c15dE702De7D2fC7eB8205bfAC0B8',
      abi: GovernanceDividendPoolABI
    },
    REVENUE_ROUTER: {
      address: '0xfFFb71e13c6cd5ce12612D1c7293BF0BAbcdab73',
      abi: AXIOMRevenueRouterABI
    },
    REAL_ESTATE_FUND: {
      address: '0xe097881D32D67ED1Dd9df8203F188CD186f345dc',
      abi: RealEstateAcquisitionFundABI.abi
    },
    BASKET_INDEX: '0x06b88f3Faa07215F6f5fb0A10A3F058D3f25ecF6',
    ADVANCED_STAKING: '0x5eE9d1b28c261AE132B6d324b02452bC90750136',
    NFT_MARKETPLACE: '0xEc973eD81082a1d539F380eF94f6215793410036',
    DYNAMIC_APR_CONTROLLER: '0x14dFA6b6785643850e5c09336F7Cd5971458e28d',
    LIQUIDITY_VAULT: '0xd070776c3603138a1d4b93a2f668d604a4a99e34'
  }
} as const;

// Helper to get current network contracts
export const getContractConfig = (network: 'BSC_MAINNET' = 'BSC_MAINNET') => {
  return CONTRACTS[network];
};
