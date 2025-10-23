// PancakeSwap V2 Contract Addresses on BSC Mainnet
export const PANCAKESWAP_CONFIG = {
  ROUTER_V2: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
  FACTORY: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
  
  // Common Token Addresses
  WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
  USDT: '0x55d398326f99059fF775485246999027B3197955',
  USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  ETH: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
  BTCB: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
  CAKE: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
  
  // Default Settings
  DEFAULT_SLIPPAGE: 0.5, // 0.5%
  DEFAULT_DEADLINE_MINUTES: 15,
  
  // Supported Pairs for AXM
  SUPPORTED_PAIRS: [
    {
      name: 'AXM/BNB',
      tokenA: '0x83E17aeB148d9b4b7Be0Be7C87dd73531a5a5738', // AXM (SWF)
      tokenB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
      isNative: true, // BNB is native, requires addLiquidityETH
      symbol: 'AXM-BNB LP'
    },
    {
      name: 'AXM/BUSD',
      tokenA: '0x83E17aeB148d9b4b7Be0Be7C87dd73531a5a5738', // AXM (SWF)
      tokenB: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', // BUSD
      isNative: false, // BUSD is ERC20, requires addLiquidity
      symbol: 'AXM-BUSD LP'
    },
    {
      name: 'AXM/USDT',
      tokenA: '0x83E17aeB148d9b4b7Be0Be7C87dd73531a5a5738', // AXM (SWF)
      tokenB: '0x55d398326f99059fF775485246999027B3197955', // USDT
      isNative: false,
      symbol: 'AXM-USDT LP'
    },
    {
      name: 'AXM/USDC',
      tokenA: '0x83E17aeB148d9b4b7Be0Be7C87dd73531a5a5738', // AXM (SWF)
      tokenB: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC
      isNative: false,
      symbol: 'AXM-USDC LP'
    },
    {
      name: 'AXM/ETH',
      tokenA: '0x83E17aeB148d9b4b7Be0Be7C87dd73531a5a5738', // AXM (SWF)
      tokenB: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', // ETH
      isNative: false,
      symbol: 'AXM-ETH LP'
    },
    {
      name: 'AXM/BTCB',
      tokenA: '0x83E17aeB148d9b4b7Be0Be7C87dd73531a5a5738', // AXM (SWF)
      tokenB: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', // BTCB (Binance-Peg Bitcoin)
      isNative: false,
      symbol: 'AXM-BTCB LP'
    },
    {
      name: 'AXM/CAKE',
      tokenA: '0x83E17aeB148d9b4b7Be0Be7C87dd73531a5a5738', // AXM (SWF)
      tokenB: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', // CAKE
      isNative: false,
      symbol: 'AXM-CAKE LP'
    }
  ]
};

export const AXM_TOKEN_ADDRESS = '0x83E17aeB148d9b4b7Be0Be7C87dd73531a5a5738';
