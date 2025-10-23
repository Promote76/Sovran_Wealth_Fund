const WebSocket = require('ws');
const { eventListener } = require('../services/contractEventListener');

class EventBroadcaster {
  constructor() {
    this.wss = null;
    this.clients = new Map();
  }

  /**
   * Initialize WebSocket server
   */
  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws/events'
    });

    this.wss.on('connection', (ws, req) => {
      const clientId = Math.random().toString(36).substring(7);
      console.log(`[WebSocket] Client connected: ${clientId}`);
      
      // Store client with metadata
      this.clients.set(clientId, {
        ws,
        subscriptions: new Set(),
        userAddress: null
      });

      // Handle incoming messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleClientMessage(clientId, data);
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        console.log(`[WebSocket] Client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`[WebSocket] Error for client ${clientId}:`, error);
      });

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'connected',
        clientId,
        message: 'Connected to AXIOM Event Stream'
      });
    });

    // Subscribe to all contract events
    this.subscribeToContractEvents();

    console.log('[WebSocket] Event broadcaster initialized');
  }

  /**
   * Handle messages from clients
   */
  handleClientMessage(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (data.type) {
      case 'subscribe':
        // Subscribe to specific contract events
        if (data.contractName && data.eventName) {
          const subscription = `${data.contractName}:${data.eventName}`;
          client.subscriptions.add(subscription);
          console.log(`[WebSocket] Client ${clientId} subscribed to ${subscription}`);
          
          this.sendToClient(clientId, {
            type: 'subscribed',
            subscription
          });
        }
        break;

      case 'subscribe_all':
        // Subscribe to all events from a contract
        if (data.contractName) {
          client.subscriptions.add(`${data.contractName}:*`);
          console.log(`[WebSocket] Client ${clientId} subscribed to all ${data.contractName} events`);
        }
        break;

      case 'set_user':
        // Set user address for personalized events
        client.userAddress = data.userAddress?.toLowerCase();
        console.log(`[WebSocket] Client ${clientId} set user address: ${client.userAddress}`);
        break;

      case 'unsubscribe':
        if (data.contractName && data.eventName) {
          const subscription = `${data.contractName}:${data.eventName}`;
          client.subscriptions.delete(subscription);
          console.log(`[WebSocket] Client ${clientId} unsubscribed from ${subscription}`);
        }
        break;

      case 'ping':
        this.sendToClient(clientId, { type: 'pong' });
        break;

      default:
        console.log(`[WebSocket] Unknown message type: ${data.type}`);
    }
  }

  /**
   * Subscribe to contract events and broadcast to clients
   */
  subscribeToContractEvents() {
    // KeyGrow events
    eventListener.on('KeyGrow', 'RenterRegistered', (eventData) => {
      this.broadcastEvent('KeyGrow', 'RenterRegistered', eventData);
    });

    eventListener.on('KeyGrow', 'AllocationClaimed', (eventData) => {
      this.broadcastEvent('KeyGrow', 'AllocationClaimed', eventData);
    });

    eventListener.on('KeyGrow', 'TierUpdated', (eventData) => {
      this.broadcastEvent('KeyGrow', 'TierUpdated', eventData);
    });

    // NFT Marketplace events
    eventListener.on('NFTMarketplace', 'ItemListed', (eventData) => {
      this.broadcastEvent('NFTMarketplace', 'ItemListed', eventData);
    });

    eventListener.on('NFTMarketplace', 'ItemSold', (eventData) => {
      this.broadcastEvent('NFTMarketplace', 'ItemSold', eventData);
    });

    eventListener.on('NFTMarketplace', 'BidPlaced', (eventData) => {
      this.broadcastEvent('NFTMarketplace', 'BidPlaced', eventData);
    });

    eventListener.on('NFTMarketplace', 'ListingCancelled', (eventData) => {
      this.broadcastEvent('NFTMarketplace', 'ListingCancelled', eventData);
    });

    // Advanced Staking events
    eventListener.on('AdvancedStaking', 'NFTStaked', (eventData) => {
      this.broadcastEvent('AdvancedStaking', 'NFTStaked', eventData);
    });

    eventListener.on('AdvancedStaking', 'NFTUnstaked', (eventData) => {
      this.broadcastEvent('AdvancedStaking', 'NFTUnstaked', eventData);
    });

    eventListener.on('AdvancedStaking', 'RewardsClaimed', (eventData) => {
      this.broadcastEvent('AdvancedStaking', 'RewardsClaimed', eventData);
    });

    // Revenue Router events
    eventListener.on('RevenueRouter', 'RevenueDistributed', (eventData) => {
      this.broadcastEvent('RevenueRouter', 'RevenueDistributed', eventData);
    });

    console.log('[WebSocket] Subscribed to all contract events');
  }

  /**
   * Broadcast event to subscribed clients
   */
  broadcastEvent(contractName, eventName, eventData) {
    const message = {
      type: 'contract_event',
      contractName,
      eventName,
      data: eventData,
      timestamp: Date.now()
    };

    let sentCount = 0;

    for (const [clientId, client] of this.clients.entries()) {
      // Check if client is subscribed to this event
      const specificSubscription = `${contractName}:${eventName}`;
      const wildcardSubscription = `${contractName}:*`;
      
      const isSubscribed = 
        client.subscriptions.has(specificSubscription) ||
        client.subscriptions.has(wildcardSubscription);

      if (!isSubscribed) continue;

      // Check if event is relevant to user (for personalized filtering)
      if (client.userAddress) {
        const isUserEvent = this.isEventForUser(eventData, client.userAddress);
        if (!isUserEvent) continue;
      }

      // Send event to client
      this.sendToClient(clientId, message);
      sentCount++;
    }

    if (sentCount > 0) {
      console.log(`[WebSocket] Broadcast ${contractName}.${eventName} to ${sentCount} clients`);
    }
  }

  /**
   * Check if event is relevant to a specific user
   */
  isEventForUser(eventData, userAddress) {
    const lowerAddress = userAddress.toLowerCase();
    
    // Check common address fields
    const addressFields = ['user', 'renter', 'seller', 'buyer', 'bidder', 'staker'];
    
    for (const field of addressFields) {
      if (eventData[field]?.toLowerCase() === lowerAddress) {
        return true;
      }
    }

    return false;
  }

  /**
   * Send message to specific client
   */
  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      client.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error(`[WebSocket] Error sending to client ${clientId}:`, error);
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcastToAll(message) {
    for (const [clientId] of this.clients.entries()) {
      this.sendToClient(clientId, message);
    }
  }

  /**
   * Get connection stats
   */
  getStats() {
    const stats = {
      connectedClients: this.clients.size,
      subscriptions: {}
    };

    for (const [clientId, client] of this.clients.entries()) {
      for (const subscription of client.subscriptions) {
        stats.subscriptions[subscription] = (stats.subscriptions[subscription] || 0) + 1;
      }
    }

    return stats;
  }
}

// Singleton instance
const broadcaster = new EventBroadcaster();

module.exports = { broadcaster, EventBroadcaster };
