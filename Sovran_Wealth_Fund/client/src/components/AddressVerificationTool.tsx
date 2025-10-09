import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  InformationCircleIcon,
  ArrowCircleRightIcon
} from '@heroicons/react/outline';

// SWF Wallet Roles
enum WalletRole {
  UNKNOWN = "Unknown",
  TREASURY = "Treasury Wallet",
  DEVELOPMENT = "Development Wallet",
  MARKETING = "Marketing Wallet",
  LIQUIDITY = "Liquidity Pool Wallet",
  BANK = "Bank Wallet",
  SGCF_BUILDER = "SGCF Builder Grants",
  SGCF_STABILITY = "SGCF Stability Reserve",
  SGCF_COMMUNITY = "SGCF Community Rewards",
  HOLDER = "SWF Holder",
  STAKER = "SWF Staker"
}

// SWF Address Database
// These are the known special addresses in the SWF ecosystem
const SWF_ADDRESSES: Record<string, { role: WalletRole; description: string }> = {
  "0x26A8401287cE33CC4aeb5a106cd6D282a92Cf51d": {
    role: WalletRole.TREASURY,
    description: "Main treasury wallet holding long-term reserves"
  },
  "0x3F4EF4Caa6382EA9F260E4c88a698449E955B339": {
    role: WalletRole.DEVELOPMENT,
    description: "Technical development and infrastructure funding"
  },
  "0x7BA6D3D6902e14fb486F9F7f9C8c652025Ed9fF9": {
    role: WalletRole.MARKETING,
    description: "Marketing initiatives and community outreach"
  },
  "0x4dfb9909a36580e8e6f126acf189a965740f7b35": {
    role: WalletRole.LIQUIDITY,
    description: "SWF/BNB Liquidity Pool"
  },
  "0x5Ac30825dA8fCEEFCC8AC1e29df82eC866050e94": {
    role: WalletRole.LIQUIDITY,
    description: "SWF/ETH Liquidity Pool"
  },
  "0xEcDdb7dFF2f61E1caC7AC767337A38E1aD851eD6": {
    role: WalletRole.BANK,
    description: "Auto-funding of operational wallets"
  },
  "0x8D91C4e70F821A7b8Fe0A51ca1C29cB75bF2D7F9": {
    role: WalletRole.SGCF_BUILDER,
    description: "Project development grants"
  },
  "0x9D4fc963e66Cb7f97D0dD2429E86D5c536A33c48": {
    role: WalletRole.SGCF_STABILITY,
    description: "Market stabilization reserve"
  },
  "0xA4E57c3216F98E60F3D0fDcAc3DB1eDBc333E7bE": {
    role: WalletRole.SGCF_COMMUNITY,
    description: "Community incentives and rewards"
  }
};

// SWF Token Contract Details
const SWF_TOKEN_ADDRESS = "0x7e243288B287BEe84A7D40E8520444f47af88335";
const SWF_TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

// SWF Staking Contract Address - Updated for BSC Mainnet
const SWF_STAKING_ADDRESS = "0x7e243288B287BEe84A7D40E8520444f47af88335"; // Using main SWF token contract
const SWF_STAKING_ABI = [
  "function balanceOf(address) view returns (uint256)"
];

interface AddressVerificationToolProps {
  provider?: ethers.providers.Web3Provider;
}

const AddressVerificationTool: React.FC<AddressVerificationToolProps> = ({ provider }) => {
  const [address, setAddress] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [verificationResult, setVerificationResult] = useState<{
    role: WalletRole;
    description: string;
    balance: string;
    stakedBalance: string;
    verified: boolean;
    transactions?: number;
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [exampleAddress, setExampleAddress] = useState<string>('');

  // Function to get a random example address from the known wallets
  useEffect(() => {
    const addresses = Object.keys(SWF_ADDRESSES);
    const randomIndex = Math.floor(Math.random() * addresses.length);
    setExampleAddress(addresses[randomIndex]);
  }, []);
  
  // Function to validate the Ethereum address format
  const validateAddress = (address: string): boolean => {
    return ethers.utils.isAddress(address);
  };

  // Function to check if an address has a special role
  const checkSpecialRole = (address: string): { role: WalletRole; description: string } => {
    const normalizedAddress = address.toLowerCase();
    
    for (const [knownAddress, details] of Object.entries(SWF_ADDRESSES)) {
      if (knownAddress.toLowerCase() === normalizedAddress) {
        return details;
      }
    }
    
    return { 
      role: WalletRole.UNKNOWN, 
      description: "No special role in the SWF ecosystem" 
    };
  };

  // Function to check if an address is a staker
  const checkStaker = async (
    provider: ethers.providers.Web3Provider,
    address: string
  ): Promise<string> => {
    try {
      const stakingContract = new ethers.Contract(
        SWF_STAKING_ADDRESS, 
        SWF_STAKING_ABI, 
        provider
      );
      
      const stakedBalance = await stakingContract.balanceOf(address);
      return ethers.utils.formatUnits(stakedBalance, 18);
    } catch (error) {
      console.error("Error checking staked balance:", error);
      return "0";
    }
  };

  // Function to check the SWF balance of an address
  const checkBalance = async (
    provider: ethers.providers.Web3Provider,
    address: string
  ): Promise<string> => {
    try {
      const tokenContract = new ethers.Contract(
        SWF_TOKEN_ADDRESS, 
        SWF_TOKEN_ABI, 
        provider
      );
      
      const balance = await tokenContract.balanceOf(address);
      const decimals = await tokenContract.decimals();
      return ethers.utils.formatUnits(balance, decimals);
    } catch (error) {
      console.error("Error checking token balance:", error);
      return "0";
    }
  };

  // Function to get transaction count (to determine if address is active)
  const getTransactionCount = async (
    provider: ethers.providers.Web3Provider,
    address: string
  ): Promise<number> => {
    try {
      return await provider.getTransactionCount(address);
    } catch (error) {
      console.error("Error getting transaction count:", error);
      return 0;
    }
  };

  // Function to determine the role of the address
  const determineRole = (
    specialRoleInfo: { role: WalletRole; description: string },
    balance: string,
    stakedBalance: string
  ): { role: WalletRole; description: string } => {
    // If the address has a special role, return that
    if (specialRoleInfo.role !== WalletRole.UNKNOWN) {
      return specialRoleInfo;
    }
    
    // If the address is staking, it's a staker
    if (parseFloat(stakedBalance) > 0) {
      return {
        role: WalletRole.STAKER,
        description: `SWF Staker with ${stakedBalance} SWF staked`
      };
    }
    
    // If the address holds SWF tokens, it's a holder
    if (parseFloat(balance) > 0) {
      return {
        role: WalletRole.HOLDER,
        description: `SWF Holder with ${balance} SWF tokens`
      };
    }
    
    // Otherwise, it's an unknown address
    return {
      role: WalletRole.UNKNOWN,
      description: "Address has no known role in the SWF ecosystem"
    };
  };

  // Function to trigger address verification
  const verifyAddress = async () => {
    // Reset previous results
    setVerificationResult(null);
    setError(null);
    
    // Validate address format
    const addressIsValid = validateAddress(address);
    setIsValid(addressIsValid);
    
    if (!addressIsValid) {
      setError("Invalid Ethereum address format");
      return;
    }
    
    // Check if we have a provider
    if (!provider) {
      setError("No Web3 provider available. Please connect your wallet first.");
      return;
    }
    
    setIsVerifying(true);
    
    try {
      const normalizedAddress = ethers.utils.getAddress(address);
      
      // Check if the address has a special role
      const specialRoleInfo = checkSpecialRole(normalizedAddress);
      
      // Get the token balance
      const balance = await checkBalance(provider, normalizedAddress);
      
      // Get staked balance
      const stakedBalance = await checkStaker(provider, normalizedAddress);
      
      // Get transaction count
      const txCount = await getTransactionCount(provider, normalizedAddress);
      
      // Determine the role
      const roleInfo = determineRole(specialRoleInfo, balance, stakedBalance);
      
      // Set the verification result
      setVerificationResult({
        role: roleInfo.role,
        description: roleInfo.description,
        balance,
        stakedBalance,
        verified: true,
        transactions: txCount
      });
    } catch (err: any) {
      console.error("Error during address verification:", err);
      setError(err.message || "An error occurred during verification");
    } finally {
      setIsVerifying(false);
    }
  };

  // Function to fill in example address
  const fillExampleAddress = () => {
    setAddress(exampleAddress);
    setIsValid(true);
  };

  // Function to handle input change
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddress(value);
    
    if (value === '') {
      setIsValid(null);
    } else {
      setIsValid(validateAddress(value));
    }
    
    // Reset verification result when input changes
    setVerificationResult(null);
    setError(null);
  };

  // Get the status color based on the role
  const getRoleStatusColor = (role: WalletRole): string => {
    switch (role) {
      case WalletRole.TREASURY:
      case WalletRole.DEVELOPMENT:
      case WalletRole.MARKETING:
      case WalletRole.BANK:
        return 'text-indigo-700 bg-indigo-100 border-indigo-300';
      case WalletRole.SGCF_BUILDER:
      case WalletRole.SGCF_STABILITY:
      case WalletRole.SGCF_COMMUNITY:
        return 'text-green-700 bg-green-100 border-green-300';
      case WalletRole.LIQUIDITY:
        return 'text-purple-700 bg-purple-100 border-purple-300';
      case WalletRole.STAKER:
        return 'text-blue-700 bg-blue-100 border-blue-300';
      case WalletRole.HOLDER:
        return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  return (
    <div className="address-verification-tool max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6 mt-4 border border-gray-200">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Address Verification Tool</h2>
        <p className="text-gray-600 mb-4">
          Verify any Ethereum address to check its role in the Sovran Wealth Fund ecosystem, 
          token balances, and transaction history.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="flex-grow">
            <div className="relative">
              <input
                type="text"
                value={address}
                onChange={handleAddressChange}
                placeholder="Enter Ethereum address (0x...)"
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  isValid === true 
                    ? 'border-green-300 focus:ring-green-200' 
                    : isValid === false 
                    ? 'border-red-300 focus:ring-red-200' 
                    : 'border-gray-300 focus:ring-blue-200'
                }`}
              />
              {isValid === true && (
                <CheckCircleIcon className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />
              )}
              {isValid === false && (
                <XCircleIcon className="absolute right-3 top-2.5 h-5 w-5 text-red-500" />
              )}
            </div>
            
            <div className="mt-1 flex justify-between text-xs">
              <span 
                className="text-blue-600 cursor-pointer hover:underline flex items-center"
                onClick={fillExampleAddress}
              >
                <ArrowCircleRightIcon className="h-3 w-3 mr-1" />
                Try an example address
              </span>
              
              <span className="text-gray-500">
                {isValid === false && "Invalid address format"}
              </span>
            </div>
          </div>
          
          <button
            onClick={verifyAddress}
            disabled={isVerifying || !isValid}
            className={`px-4 py-2 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              isVerifying
                ? 'bg-indigo-400 cursor-not-allowed'
                : isValid
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isVerifying ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </div>
            ) : (
              'Verify Address'
            )}
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start mt-4">
            <XCircleIcon className="h-5 w-5 mr-2 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        
        {!provider && !error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md flex items-start mt-4">
            <InformationCircleIcon className="h-5 w-5 mr-2 mt-0.5" />
            <span>Connect your wallet to use the address verification tool.</span>
          </div>
        )}
      </div>
      
      {/* Verification Results */}
      {verificationResult && (
        <div className="mt-6 pb-2 border-t border-gray-200 pt-4 transition-opacity duration-300 ease-in-out opacity-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Verification Results</h3>
          
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="sm:w-1/2">
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Address</h4>
                <div className="font-mono text-sm bg-gray-100 p-2 rounded break-all">
                  {ethers.utils.getAddress(address)}
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Role</h4>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRoleStatusColor(verificationResult.role)}`}>
                  {verificationResult.role}
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
                <p className="text-gray-700">
                  {verificationResult.description}
                </p>
              </div>
            </div>
            
            <div className="sm:w-1/2">
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500 mb-1">SWF Balance</h4>
                <div className="text-lg font-semibold text-gray-800">
                  {verificationResult.balance} <span className="text-xs text-gray-500">SWF</span>
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Staked Balance</h4>
                <div className="text-lg font-semibold text-gray-800">
                  {verificationResult.stakedBalance} <span className="text-xs text-gray-500">SWF</span>
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Transaction Count</h4>
                <div className="text-lg font-semibold text-gray-800">
                  {verificationResult.transactions} <span className="text-xs text-gray-500">transactions</span>
                </div>
              </div>
              
              <div className="mt-4">
                <a 
                  href={`https://bscscan.com/address/${address}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center transition-colors"
                >
                  <span>View on BscScan</span>
                  <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressVerificationTool;