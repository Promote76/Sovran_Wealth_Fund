import React, { useEffect, useState } from 'react';
import { ContractEvent } from '../hooks/useContractEvents';

interface EventToastProps {
  event: ContractEvent;
  onClose: () => void;
  autoHideDuration?: number;
}

export function EventToast({ event, onClose, autoHideDuration = 5000 }: EventToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, autoHideDuration);

    return () => clearTimeout(timer);
  }, [autoHideDuration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  if (!isVisible) return null;

  const getEventIcon = () => {
    switch (event.eventName) {
      case 'RenterRegistered':
        return '🏠';
      case 'AllocationClaimed':
        return '💰';
      case 'TierUpdated':
        return '⬆️';
      case 'ItemListed':
        return '🎨';
      case 'ItemSold':
        return '✅';
      case 'BidPlaced':
        return '🔨';
      case 'ListingCancelled':
        return '❌';
      case 'NFTStaked':
        return '🔒';
      case 'NFTUnstaked':
        return '🔓';
      case 'RewardsClaimed':
        return '🎁';
      case 'RevenueDistributed':
        return '💸';
      default:
        return '⚡';
    }
  };

  const getEventTitle = () => {
    switch (event.eventName) {
      case 'RenterRegistered':
        return 'New Renter Registered';
      case 'AllocationClaimed':
        return 'Allocation Claimed';
      case 'TierUpdated':
        return 'Tier Updated';
      case 'ItemListed':
        return 'NFT Listed';
      case 'ItemSold':
        return 'NFT Sold';
      case 'BidPlaced':
        return 'New Bid Placed';
      case 'ListingCancelled':
        return 'Listing Cancelled';
      case 'NFTStaked':
        return 'NFT Staked';
      case 'NFTUnstaked':
        return 'NFT Unstaked';
      case 'RewardsClaimed':
        return 'Rewards Claimed';
      case 'RevenueDistributed':
        return 'Revenue Distributed';
      default:
        return 'Blockchain Event';
    }
  };

  const getEventMessage = () => {
    const { data } = event;

    switch (event.eventName) {
      case 'RenterRegistered':
        return `Tier ${data.tier} registration completed`;
      case 'AllocationClaimed':
        return `${parseFloat(data.amount).toFixed(4)} BNB claimed`;
      case 'TierUpdated':
        return `Tier changed from ${data.oldTier} to ${data.newTier}`;
      case 'ItemListed':
        return `NFT #${data.tokenId} listed for ${parseFloat(data.price).toFixed(4)} BNB`;
      case 'ItemSold':
        return `Sold for ${parseFloat(data.price).toFixed(4)} BNB`;
      case 'BidPlaced':
        return `Bid of ${parseFloat(data.amount).toFixed(4)} BNB placed`;
      case 'ListingCancelled':
        return `Listing #${data.listingId} cancelled`;
      case 'NFTStaked':
        return `NFT #${data.tokenId} staked at tier ${data.tier}`;
      case 'NFTUnstaked':
        return `Stake #${data.stakeId} unstaked`;
      case 'RewardsClaimed':
        return `${parseFloat(data.amount).toFixed(2)} AXM claimed`;
      case 'RevenueDistributed':
        return `${parseFloat(data.totalAmount).toFixed(4)} BNB distributed`;
      default:
        return 'Event received';
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 max-w-sm w-full bg-white rounded-lg shadow-2xl border-2 border-blue-500 overflow-hidden z-50 transition-all duration-300 ${
        isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      }`}
    >
      {/* Progress bar */}
      <div className="h-1 bg-blue-500 origin-left animate-shrink"></div>
      
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="text-3xl flex-shrink-0">{getEventIcon()}</div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-800 mb-1">
              {getEventTitle()}
            </h4>
            <p className="text-sm text-gray-600 mb-2">
              {getEventMessage()}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                {event.contractName}
              </span>
              {event.data.transactionHash && (
                <a
                  href={`https://bscscan.com/tx/${event.data.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View TX →
                </a>
              )}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes shrink {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
        .animate-shrink {
          animation: shrink ${autoHideDuration}ms linear forwards;
        }
      `}</style>
    </div>
  );
}

interface EventToastContainerProps {
  events: ContractEvent[];
  onRemove: (index: number) => void;
}

export function EventToastContainer({ events, onRemove }: EventToastContainerProps) {
  return (
    <div className="fixed top-0 right-0 p-4 space-y-4 z-50 pointer-events-none">
      {events.map((event, index) => (
        <div key={`${event.timestamp}-${index}`} className="pointer-events-auto">
          <EventToast event={event} onClose={() => onRemove(index)} />
        </div>
      ))}
    </div>
  );
}
