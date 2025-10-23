import { useEffect, useRef, useState, useCallback } from 'react';
import { useWallet } from '../contexts/WalletContext';

export interface ContractEvent {
  type: string;
  contractName: string;
  eventName: string;
  data: any;
  timestamp: number;
}

interface UseContractEventsOptions {
  /**
   * Automatically subscribe to events for the connected user's address
   */
  personalEventsOnly?: boolean;
  
  /**
   * Callback when a new event is received
   */
  onEvent?: (event: ContractEvent) => void;
  
  /**
   * Automatically reconnect on disconnect
   */
  autoReconnect?: boolean;
}

export function useContractEvents(
  contractName?: string,
  eventName?: string,
  options: UseContractEventsOptions = {}
) {
  const { account, isConnected } = useWallet();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [latestEvent, setLatestEvent] = useState<ContractEvent | null>(null);
  const [eventHistory, setEventHistory] = useState<ContractEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const {
    personalEventsOnly = false,
    onEvent,
    autoReconnect = true
  } = options;

  // Get WebSocket URL
  const getWebSocketUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws/events`;
  };

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[ContractEvents] Already connected');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const wsUrl = getWebSocketUrl();
      console.log('[ContractEvents] Connecting to:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[ContractEvents] WebSocket connected');
        setIsConnecting(false);
        setIsSocketConnected(true);
        setError(null);

        // Subscribe to specific events
        if (contractName && eventName) {
          ws.send(JSON.stringify({
            type: 'subscribe',
            contractName,
            eventName
          }));
          console.log(`[ContractEvents] Subscribed to ${contractName}.${eventName}`);
        } else if (contractName) {
          ws.send(JSON.stringify({
            type: 'subscribe_all',
            contractName
          }));
          console.log(`[ContractEvents] Subscribed to all ${contractName} events`);
        }

        // Set user address for personalized events
        if (personalEventsOnly && account) {
          ws.send(JSON.stringify({
            type: 'set_user',
            userAddress: account
          }));
          console.log(`[ContractEvents] Set user filter: ${account}`);
        }

        // Start heartbeat
        const heartbeat = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);

        ws.addEventListener('close', () => {
          clearInterval(heartbeat);
        });
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'contract_event') {
            const contractEvent: ContractEvent = {
              type: message.type,
              contractName: message.contractName,
              eventName: message.eventName,
              data: message.data,
              timestamp: message.timestamp
            };

            console.log('[ContractEvents] Received event:', contractEvent);
            
            setLatestEvent(contractEvent);
            setEventHistory(prev => [contractEvent, ...prev].slice(0, 100)); // Keep last 100 events

            // Call callback if provided
            if (onEvent) {
              onEvent(contractEvent);
            }
          } else if (message.type === 'connected') {
            console.log('[ContractEvents]', message.message);
          } else if (message.type === 'subscribed') {
            console.log('[ContractEvents] Subscription confirmed:', message.subscription);
          }
        } catch (error) {
          console.error('[ContractEvents] Error parsing message:', error);
        }
      };

      ws.onerror = (event) => {
        console.error('[ContractEvents] WebSocket error:', event);
        setError('WebSocket connection error');
      };

      ws.onclose = () => {
        console.log('[ContractEvents] WebSocket disconnected');
        setIsSocketConnected(false);
        setIsConnecting(false);

        // Attempt to reconnect
        if (autoReconnect) {
          console.log('[ContractEvents] Reconnecting in 5 seconds...');
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 5000);
        }
      };

    } catch (error) {
      console.error('[ContractEvents] Connection error:', error);
      setError('Failed to connect to event stream');
      setIsConnecting(false);
    }
  }, [contractName, eventName, account, personalEventsOnly, onEvent, autoReconnect]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsSocketConnected(false);
  }, []);

  // Subscribe to additional events
  const subscribe = useCallback((contractName: string, eventName?: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('[ContractEvents] Cannot subscribe: not connected');
      return;
    }

    if (eventName) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        contractName,
        eventName
      }));
    } else {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe_all',
        contractName
      }));
    }
  }, []);

  // Unsubscribe from events
  const unsubscribe = useCallback((contractName: string, eventName: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('[ContractEvents] Cannot unsubscribe: not connected');
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'unsubscribe',
      contractName,
      eventName
    }));
  }, []);

  // Clear event history
  const clearHistory = useCallback(() => {
    setEventHistory([]);
    setLatestEvent(null);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Update user filter when account changes
  useEffect(() => {
    if (personalEventsOnly && account && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'set_user',
        userAddress: account
      }));
      console.log(`[ContractEvents] Updated user filter: ${account}`);
    }
  }, [account, personalEventsOnly]);

  return {
    isConnected: isSocketConnected,
    isConnecting,
    error,
    latestEvent,
    eventHistory,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    clearHistory
  };
}

/**
 * Hook for listening to specific contract events
 */
export function useKeygrowEvents(options?: UseContractEventsOptions) {
  return useContractEvents('KeyGrow', undefined, options);
}

export function useNFTMarketplaceEvents(options?: UseContractEventsOptions) {
  return useContractEvents('NFTMarketplace', undefined, options);
}

export function useAdvancedStakingEvents(options?: UseContractEventsOptions) {
  return useContractEvents('AdvancedStaking', undefined, options);
}

export function useRevenueRouterEvents(options?: UseContractEventsOptions) {
  return useContractEvents('RevenueRouter', undefined, options);
}
