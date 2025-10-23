const { ethers } = require('ethers');
const { getContract } = require('./contractProvider');

class ContractEventListener {
  constructor() {
    this.listeners = new Map();
    this.eventCallbacks = new Map();
    this.isListening = false;
  }

  /**
   * Register a callback for a specific contract event
   * @param {string} contractName - Name of contract (e.g., 'KeyGrow', 'NFTMarketplace')
   * @param {string} eventName - Name of event to listen for
   * @param {Function} callback - Function to call when event occurs
   */
  on(contractName, eventName, callback) {
    const key = `${contractName}:${eventName}`;
    if (!this.eventCallbacks.has(key)) {
      this.eventCallbacks.set(key, []);
    }
    this.eventCallbacks.get(key).push(callback);
    console.log(`[EventListener] Registered callback for ${key}`);
  }

  /**
   * Remove a callback
   */
  off(contractName, eventName, callback) {
    const key = `${contractName}:${eventName}`;
    const callbacks = this.eventCallbacks.get(key);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to all registered callbacks
   */
  emit(contractName, eventName, eventData) {
    const key = `${contractName}:${eventName}`;
    const callbacks = this.eventCallbacks.get(key) || [];
    callbacks.forEach(callback => {
      try {
        callback(eventData);
      } catch (error) {
        console.error(`[EventListener] Error in callback for ${key}:`, error);
      }
    });
  }

  /**
   * Start listening to all contract events
   */
  async startListening(db) {
    if (this.isListening) {
      console.log('[EventListener] Already listening');
      return;
    }

    console.log('[EventListener] Starting event listeners for all contracts...');
    this.isListening = true;
    this.db = db;

    try {
      // KeyGrow Events
      await this.listenToKeyGrow();
      
      // NFT Marketplace Events
      await this.listenToNFTMarketplace();
      
      // Advanced Staking Events
      await this.listenToAdvancedStaking();
      
      // Revenue Router Events
      await this.listenToRevenueRouter();

      console.log('[EventListener] All event listeners started successfully');
    } catch (error) {
      console.error('[EventListener] Error starting listeners:', error);
      this.isListening = false;
      throw error;
    }
  }

  /**
   * Stop all event listeners
   */
  async stopListening() {
    console.log('[EventListener] Stopping all event listeners...');
    
    for (const [key, listener] of this.listeners.entries()) {
      try {
        listener.removeAllListeners();
        console.log(`[EventListener] Stopped listener: ${key}`);
      } catch (error) {
        console.error(`[EventListener] Error stopping ${key}:`, error);
      }
    }
    
    this.listeners.clear();
    this.isListening = false;
    console.log('[EventListener] All listeners stopped');
  }

  /**
   * Listen to KeyGrow (RealEstateAcquisitionFund) events
   */
  async listenToKeyGrow() {
    try {
      const contract = await getContract('RealEstateAcquisitionFund');
      
      // RenterRegistered(address indexed renter, uint8 tier, uint256 timestamp)
      contract.on('RenterRegistered', async (renter, tier, timestamp, event) => {
        const eventData = {
          contractName: 'KeyGrow',
          eventName: 'RenterRegistered',
          renter,
          tier: Number(tier),
          timestamp: Number(timestamp),
          blockNumber: event.log.blockNumber,
          transactionHash: event.log.transactionHash
        };
        
        console.log('[KeyGrow] RenterRegistered:', eventData);
        await this.saveEvent(eventData);
        this.emit('KeyGrow', 'RenterRegistered', eventData);
      });

      // AllocationClaimed(address indexed renter, uint256 amount, uint256 timestamp)
      contract.on('AllocationClaimed', async (renter, amount, timestamp, event) => {
        const eventData = {
          contractName: 'KeyGrow',
          eventName: 'AllocationClaimed',
          renter,
          amount: ethers.formatEther(amount),
          timestamp: Number(timestamp),
          blockNumber: event.log.blockNumber,
          transactionHash: event.log.transactionHash
        };
        
        console.log('[KeyGrow] AllocationClaimed:', eventData);
        await this.saveEvent(eventData);
        this.emit('KeyGrow', 'AllocationClaimed', eventData);
      });

      // TierUpdated(address indexed renter, uint8 oldTier, uint8 newTier)
      contract.on('TierUpdated', async (renter, oldTier, newTier, event) => {
        const eventData = {
          contractName: 'KeyGrow',
          eventName: 'TierUpdated',
          renter,
          oldTier: Number(oldTier),
          newTier: Number(newTier),
          blockNumber: event.log.blockNumber,
          transactionHash: event.log.transactionHash
        };
        
        console.log('[KeyGrow] TierUpdated:', eventData);
        await this.saveEvent(eventData);
        this.emit('KeyGrow', 'TierUpdated', eventData);
      });

      this.listeners.set('KeyGrow', contract);
      console.log('[EventListener] KeyGrow events registered');
    } catch (error) {
      console.error('[EventListener] Error setting up KeyGrow listeners:', error);
    }
  }

  /**
   * Listen to NFT Marketplace events
   */
  async listenToNFTMarketplace() {
    try {
      const contract = await getContract('EnhancedNFTMarketplace');
      
      // ItemListed(uint256 indexed listingId, address indexed seller, address nftContract, uint256 tokenId, uint256 price)
      contract.on('ItemListed', async (listingId, seller, nftContract, tokenId, price, event) => {
        const eventData = {
          contractName: 'NFTMarketplace',
          eventName: 'ItemListed',
          listingId: listingId.toString(),
          seller,
          nftContract,
          tokenId: tokenId.toString(),
          price: ethers.formatEther(price),
          blockNumber: event.log.blockNumber,
          transactionHash: event.log.transactionHash
        };
        
        console.log('[NFTMarketplace] ItemListed:', eventData);
        await this.saveEvent(eventData);
        this.emit('NFTMarketplace', 'ItemListed', eventData);
      });

      // ItemSold(uint256 indexed listingId, address indexed buyer, uint256 price)
      contract.on('ItemSold', async (listingId, buyer, price, event) => {
        const eventData = {
          contractName: 'NFTMarketplace',
          eventName: 'ItemSold',
          listingId: listingId.toString(),
          buyer,
          price: ethers.formatEther(price),
          blockNumber: event.log.blockNumber,
          transactionHash: event.log.transactionHash
        };
        
        console.log('[NFTMarketplace] ItemSold:', eventData);
        await this.saveEvent(eventData);
        this.emit('NFTMarketplace', 'ItemSold', eventData);
      });

      // BidPlaced(uint256 indexed listingId, address indexed bidder, uint256 amount)
      contract.on('BidPlaced', async (listingId, bidder, amount, event) => {
        const eventData = {
          contractName: 'NFTMarketplace',
          eventName: 'BidPlaced',
          listingId: listingId.toString(),
          bidder,
          amount: ethers.formatEther(amount),
          blockNumber: event.log.blockNumber,
          transactionHash: event.log.transactionHash
        };
        
        console.log('[NFTMarketplace] BidPlaced:', eventData);
        await this.saveEvent(eventData);
        this.emit('NFTMarketplace', 'BidPlaced', eventData);
      });

      // ListingCancelled(uint256 indexed listingId)
      contract.on('ListingCancelled', async (listingId, event) => {
        const eventData = {
          contractName: 'NFTMarketplace',
          eventName: 'ListingCancelled',
          listingId: listingId.toString(),
          blockNumber: event.log.blockNumber,
          transactionHash: event.log.transactionHash
        };
        
        console.log('[NFTMarketplace] ListingCancelled:', eventData);
        await this.saveEvent(eventData);
        this.emit('NFTMarketplace', 'ListingCancelled', eventData);
      });

      this.listeners.set('NFTMarketplace', contract);
      console.log('[EventListener] NFT Marketplace events registered');
    } catch (error) {
      console.error('[EventListener] Error setting up NFT Marketplace listeners:', error);
    }
  }

  /**
   * Listen to Advanced Staking events
   */
  async listenToAdvancedStaking() {
    try {
      const contract = await getContract('AdvancedStaking');
      
      // NFTStaked(address indexed user, address indexed nftContract, uint256 indexed tokenId, uint8 tier)
      contract.on('NFTStaked', async (user, nftContract, tokenId, tier, event) => {
        const eventData = {
          contractName: 'AdvancedStaking',
          eventName: 'NFTStaked',
          user,
          nftContract,
          tokenId: tokenId.toString(),
          tier: Number(tier),
          blockNumber: event.log.blockNumber,
          transactionHash: event.log.transactionHash
        };
        
        console.log('[AdvancedStaking] NFTStaked:', eventData);
        await this.saveEvent(eventData);
        this.emit('AdvancedStaking', 'NFTStaked', eventData);
      });

      // NFTUnstaked(address indexed user, uint256 indexed stakeId)
      contract.on('NFTUnstaked', async (user, stakeId, event) => {
        const eventData = {
          contractName: 'AdvancedStaking',
          eventName: 'NFTUnstaked',
          user,
          stakeId: stakeId.toString(),
          blockNumber: event.log.blockNumber,
          transactionHash: event.log.transactionHash
        };
        
        console.log('[AdvancedStaking] NFTUnstaked:', eventData);
        await this.saveEvent(eventData);
        this.emit('AdvancedStaking', 'NFTUnstaked', eventData);
      });

      // RewardsClaimed(address indexed user, uint256 amount)
      contract.on('RewardsClaimed', async (user, amount, event) => {
        const eventData = {
          contractName: 'AdvancedStaking',
          eventName: 'RewardsClaimed',
          user,
          amount: ethers.formatEther(amount),
          blockNumber: event.log.blockNumber,
          transactionHash: event.log.transactionHash
        };
        
        console.log('[AdvancedStaking] RewardsClaimed:', eventData);
        await this.saveEvent(eventData);
        this.emit('AdvancedStaking', 'RewardsClaimed', eventData);
      });

      this.listeners.set('AdvancedStaking', contract);
      console.log('[EventListener] Advanced Staking events registered');
    } catch (error) {
      console.error('[EventListener] Error setting up Advanced Staking listeners:', error);
    }
  }

  /**
   * Listen to Revenue Router events
   */
  async listenToRevenueRouter() {
    try {
      const contract = await getContract('AXIOMRevenueRouter');
      
      // RevenueDistributed(address indexed source, uint256 totalAmount, uint256 treasuryAmount, uint256 keygrowAmount)
      contract.on('RevenueDistributed', async (source, totalAmount, treasuryAmount, keygrowAmount, event) => {
        const eventData = {
          contractName: 'RevenueRouter',
          eventName: 'RevenueDistributed',
          source,
          totalAmount: ethers.formatEther(totalAmount),
          treasuryAmount: ethers.formatEther(treasuryAmount),
          keygrowAmount: ethers.formatEther(keygrowAmount),
          blockNumber: event.log.blockNumber,
          transactionHash: event.log.transactionHash
        };
        
        console.log('[RevenueRouter] RevenueDistributed:', eventData);
        await this.saveEvent(eventData);
        this.emit('RevenueRouter', 'RevenueDistributed', eventData);
      });

      this.listeners.set('RevenueRouter', contract);
      console.log('[EventListener] Revenue Router events registered');
    } catch (error) {
      console.error('[EventListener] Error setting up Revenue Router listeners:', error);
    }
  }

  /**
   * Save event to database
   */
  async saveEvent(eventData) {
    if (!this.db) return;

    try {
      await this.db.query(
        `INSERT INTO contract_events 
        (contract_name, event_name, event_data, block_number, transaction_hash, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          eventData.contractName,
          eventData.eventName,
          JSON.stringify(eventData),
          eventData.blockNumber,
          eventData.transactionHash
        ]
      );
    } catch (error) {
      console.error('[EventListener] Error saving event to database:', error);
    }
  }

  /**
   * Get recent events from database
   */
  async getRecentEvents(contractName = null, eventName = null, limit = 100) {
    if (!this.db) return [];

    try {
      let query = 'SELECT * FROM contract_events WHERE 1=1';
      const params = [];
      let paramCount = 1;

      if (contractName) {
        query += ` AND contract_name = $${paramCount++}`;
        params.push(contractName);
      }

      if (eventName) {
        query += ` AND event_name = $${paramCount++}`;
        params.push(eventName);
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramCount}`;
      params.push(limit);

      const result = await this.db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('[EventListener] Error fetching events:', error);
      return [];
    }
  }

  /**
   * Get events for a specific user
   */
  async getUserEvents(userAddress, limit = 50) {
    if (!this.db) return [];

    try {
      const result = await this.db.query(
        `SELECT * FROM contract_events 
        WHERE event_data::jsonb->>'user' = $1 
        OR event_data::jsonb->>'renter' = $1 
        OR event_data::jsonb->>'seller' = $1 
        OR event_data::jsonb->>'buyer' = $1 
        OR event_data::jsonb->>'bidder' = $1
        ORDER BY created_at DESC 
        LIMIT $2`,
        [userAddress.toLowerCase(), limit]
      );
      return result.rows;
    } catch (error) {
      console.error('[EventListener] Error fetching user events:', error);
      return [];
    }
  }
}

// Singleton instance
const eventListener = new ContractEventListener();

module.exports = { eventListener, ContractEventListener };
