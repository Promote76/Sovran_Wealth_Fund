// PancakeSwap V2 Contract Addresses on BSC Mainnet
export const PANCAKESWAP_CONFIG = {
  ROUTER_V2: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
  FACTORY: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
  
  // Common Token Addresses
  WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
  
  // Default Settings
  DEFAULT_SLIPPAGE: 0.5, // 0.5%
  DEFAULT_DEADLINE_MINUTES: 15,
  
  // Supported Pairs for AXM
  SUPPORTED_PAIRS: [
    {
      name: 'AXM/BNB',
      tokenA: '0x83E17aEB148d9b4B7Be0BE7c87dD73531A5A5738', // AXM
      tokenB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
      isNative: true, // BNB is native, requires addLiquidityETH
      symbol: 'AXM-BNB LP'
    },
    {
      name: 'AXM/BUSD',
      tokenA: '0x83E17aEB148d9b4B7Be0BE7c87dD73531A5A5738', // AXM
      tokenB: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', // BUSD
      isNative: false, // BUSD is ERC20, requires addLiquidity
      symbol: 'AXM-BUSD LP'
    }
  ]
};

export const AXM_TOKEN_ADDRESS = '0x83E17aEB148d9b4B7Be0BE7c87dD73531A5A5738';
