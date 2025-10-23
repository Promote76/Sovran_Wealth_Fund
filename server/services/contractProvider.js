const { ethers } = require('ethers');
const path = require('path');

class ContractProvider {
  constructor(network = 'bsc-mainnet') {
    this.config = require('../../contracts-config.json');
    this.network = network;
    this.provider = new ethers.JsonRpcProvider(this.config.rpc);
    this.contracts = {};
    this.abis = {};
  }

  /**
   * Load ABI from file
   */
  loadABI(contractName) {
    if (!this.abis[contractName]) {
      try {
        const abiPath = path.join(__dirname, '../../client/src/abis', `${contractName}.json`);
        this.abis[contractName] = require(abiPath);
      } catch (error) {
        console.error(`❌ Failed to load ABI for ${contractName}:`, error.message);
        throw new Error(`ABI not found for ${contractName}`);
      }
    }
    return this.abis[contractName];
  }

  /**
   * Get contract instance (read-only)
   */
  getContract(contractName) {
    if (!this.contracts[contractName]) {
      const address = this.config.contracts[contractName];
      if (!address) {
        throw new Error(`Contract address not found for ${contractName}`);
      }

      const abi = this.loadABI(contractName);
      this.contracts[contractName] = new ethers.Contract(address, abi, this.provider);
    }
    return this.contracts[contractName];
  }

  /**
   * Get contract instance with signer (for write operations)
   */
  getContractWithSigner(contractName, privateKey) {
    const address = this.config.contracts[contractName];
    if (!address) {
      throw new Error(`Contract address not found for ${contractName}`);
    }

    const abi = this.loadABI(contractName);
    const wallet = new ethers.Wallet(privateKey, this.provider);
    return new ethers.Contract(address, abi, wallet);
  }

  /**
   * Get all contract addresses
   */
  getAddresses() {
    return this.config.contracts;
  }

  /**
   * Get specific contract address
   */
  getAddress(contractName) {
    return this.config.contracts[contractName];
  }

  /**
   * Call contract method with retry logic
   */
  async callWithRetry(contractName, methodName, params = [], maxRetries = 3) {
    const contract = this.getContract(contractName);
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await contract[methodName](...params);
        return result;
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Attempt ${attempt}/${maxRetries} failed for ${contractName}.${methodName}:`, error.message);
        
        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw new Error(`Failed to call ${contractName}.${methodName} after ${maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Get current block number
   */
  async getBlockNumber() {
    return await this.provider.getBlockNumber();
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash) {
    return await this.provider.getTransactionReceipt(txHash);
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(txHash, confirmations = 1) {
    return await this.provider.waitForTransaction(txHash, confirmations);
  }

  /**
   * Format ether amount
   */
  formatEther(value) {
    return ethers.formatEther(value);
  }

  /**
   * Parse ether amount
   */
  parseEther(value) {
    return ethers.parseEther(value.toString());
  }

  /**
   * Get provider
   */
  getProvider() {
    return this.provider;
  }

  /**
   * Build transaction data for a contract method
   */
  buildTransactionData(contractName, methodName, params = []) {
    try {
      const abi = this.loadABI(contractName);
      const contract = new ethers.Interface(abi);
      const data = contract.encodeFunctionData(methodName, params);
      
      return {
        to: this.getAddress(contractName),
        data,
        value: '0',
        chainId: 56
      };
    } catch (error) {
      console.error(`❌ Failed to build transaction data for ${contractName}.${methodName}:`, error);
      throw error;
    }
  }
}

// Singleton instance
let instance = null;

function getContractProvider(network = 'bsc-mainnet') {
  if (!instance) {
    instance = new ContractProvider(network);
    console.log('✅ ContractProvider initialized for', network);
  }
  return instance;
}

module.exports = { ContractProvider, getContractProvider };
