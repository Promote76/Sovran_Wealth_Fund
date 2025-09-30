import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Wallet, Coins, Droplet, RefreshCw, Vote } from 'lucide-react';

interface IntroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const IntroModal: React.FC<IntroModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [animate, setAnimate] = useState(false);

  // Define the steps in the introduction flow
  const steps = [
    {
      title: "Welcome to Sovran Wealth Fund",
      description: "We'll guide you through 5 simple steps to get started with the SWF ecosystem.",
      icon: <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
        <svg viewBox="0 0 100 100" width="48" height="48">
          <path d="M50 10 L90 90 L10 90 Z" fill="#4a00e0" />
        </svg>
      </div>
    },
    {
      title: "Step 1: Connect Your Wallet",
      description: "First, connect your wallet to access the SWF platform and manage your tokens securely.",
      icon: <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
        <Wallet className="w-8 h-8 text-blue-600" />
      </div>
    },
    {
      title: "Step 2: Stake Your Tokens",
      description: "Stake your SWF tokens to earn up to 30% APR while supporting the ecosystem.",
      icon: <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
        <Coins className="w-8 h-8 text-green-600" />
      </div>
    },
    {
      title: "Step 3: Add Liquidity",
      description: "Provide liquidity to SWF pools to earn trading fees and boost your returns.",
      icon: <div className="w-16 h-16 rounded-full bg-cyan-100 flex items-center justify-center">
        <Droplet className="w-8 h-8 text-cyan-600" />
      </div>
    },
    {
      title: "Step 4: Swap Tokens",
      description: "Easily swap between SWF and other tokens with optimal routing and low slippage.",
      icon: <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-orange-600" />
      </div>
    },
    {
      title: "Step 5: Participate in Governance",
      description: "Vote on proposals and help shape the future of the Sovran Wealth Fund ecosystem.",
      icon: <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
        <Vote className="w-8 h-8 text-purple-600" />
      </div>
    }
  ];

  // Reset to first step when modal is opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      // Start animation after a short delay
      setTimeout(() => setAnimate(true), 100);
    } else {
      setAnimate(false);
    }

    // Store that user has seen intro in local storage
    if (isOpen) {
      localStorage.setItem('swf-intro-seen', 'true');
    }
  }, [isOpen]);

  // Advance to next step
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setAnimate(false);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setAnimate(true);
      }, 300);
    } else {
      onClose();
    }
  };

  // Skip tutorial
  const skipTutorial = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          {/* Progress indicator */}
          <div className="flex mb-6 justify-center">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1 w-6 mx-1 rounded-full ${
                  index <= currentStep ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className={`transition-opacity duration-300 ${animate ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex flex-col items-center text-center mb-6">
              {steps[currentStep].icon}
              <h2 className="text-xl font-bold mt-4 mb-2">{steps[currentStep].title}</h2>
              <p className="text-gray-600">{steps[currentStep].description}</p>
            </div>

            {/* Buttons */}
            <div className="flex justify-between mt-8">
              <button
                onClick={skipTutorial}
                className="text-gray-500 hover:text-gray-700"
              >
                Skip
              </button>
              <button
                onClick={nextStep}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                <ArrowRight className="ml-2 w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook to check if it's the user's first visit
 * @returns {boolean} True if this is the first visit
 */
export const useFirstVisit = (): [boolean, () => void] => {
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  
  useEffect(() => {
    // Check if user has seen intro before
    const hasSeenIntro = localStorage.getItem('swf-intro-seen');
    setIsFirstVisit(!hasSeenIntro);
  }, []);
  
  const markAsVisited = () => {
    localStorage.setItem('swf-intro-seen', 'true');
    setIsFirstVisit(false);
  };
  
  return [isFirstVisit, markAsVisited];
};

export default IntroModal;