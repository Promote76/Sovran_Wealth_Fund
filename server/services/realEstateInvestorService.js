const { getContractProvider } = require('./contractProvider');
const { db } = require('../db');

class RealEstateInvestorService {
  constructor() {
    this.contractProvider = getContractProvider();
  }

  async getAllProperties() {
    try {
      const contract = this.contractProvider.getContract('RealEstateInvestor');
      
      // Get platform stats
      const stats = await contract.getPlatformStats();
      const propertyCount = Number(stats[0]);
      
      if (propertyCount === 0) {
        return [];
      }

      // Get all properties
      const allProps = await contract.getAllProperties();
      
      const properties = [];
      for (let i = 0; i < propertyCount; i++) {
        const prop = await contract.properties(i + 1);
        
        properties.push({
          id: Number(prop.id),
          propertyAddress: prop.propertyAddress,
          purchasePrice: this.contractProvider.formatEther(prop.purchasePrice),
          currentValue: this.contractProvider.formatEther(prop.currentValue),
          monthlyRent: this.contractProvider.formatEther(prop.monthlyRent),
          totalShares: Number(prop.totalShares),
          sharesIssued: Number(prop.sharesIssued),
          pricePerShare: this.contractProvider.formatEther(prop.pricePerShare),
          targetRaise: this.contractProvider.formatEther(prop.targetRaise),
          currentRaise: this.contractProvider.formatEther(prop.currentRaise),
          isFunded: prop.isFunded,
          isActive: prop.isActive,
          metadataURI: prop.metadataURI
        });
      }

      return properties;
    } catch (error) {
      console.error('❌ getAllProperties error:', error);
      return [];
    }
  }

  async getInvestorPortfolio(walletAddress) {
    try {
      const contract = this.contractProvider.getContract('RealEstateInvestor');
      
      // Get investor stats
      const stats = await contract.investorStats(walletAddress);
      
      // Get investor properties
      const propIds = await contract.investorProperties(walletAddress);
      
      const investments = [];
      for (const propId of propIds) {
        const inv = await contract.investments(walletAddress, propId);
        const prop = await contract.properties(propId);
        
        if (Number(inv.sharesOwned) > 0) {
          const pendingRental = await contract.pendingRentalIncome(walletAddress, propId);
          const appreciation = await contract.getInvestorAppreciation(walletAddress, propId);
          
          // Calculate current value of investment
          const currentValue = (Number(prop.currentValue) * Number(inv.sharesOwned)) / Number(prop.totalShares);
          
          investments.push({
            propertyId: Number(propId),
            sharesOwned: Number(inv.sharesOwned),
            investedAmount: this.contractProvider.formatEther(inv.investedAmount),
            currentValue: this.contractProvider.formatEther(currentValue),
            pendingRental: this.contractProvider.formatEther(pendingRental),
            appreciation: this.contractProvider.formatEther(appreciation),
            investmentDate: Number(inv.investmentDate)
          });
        }
      }

      const portfolioValue = await contract.getPortfolioValue(walletAddress);
      const totalPendingRental = await contract.getTotalPendingRental(walletAddress);

      return {
        investments,
        stats: {
          totalInvested: this.contractProvider.formatEther(stats.totalInvested),
          totalRentalEarned: this.contractProvider.formatEther(stats.totalRentalEarned),
          portfolioValue: this.contractProvider.formatEther(portfolioValue),
          totalPendingRental: this.contractProvider.formatEther(totalPendingRental),
          propertyCount: Number(stats.propertyCount)
        }
      };
    } catch (error) {
      console.error('❌ getInvestorPortfolio error:', error);
      return {
        investments: [],
        stats: {
          totalInvested: '0',
          totalRentalEarned: '0',
          portfolioValue: '0',
          totalPendingRental: '0',
          propertyCount: 0
        }
      };
    }
  }

  async buildInvestTx(walletAddress, propertyId, amount) {
    try {
      const value = this.contractProvider.parseEther(amount.toString());
      
      return this.contractProvider.buildTransactionData(
        'RealEstateInvestor',
        'invest',
        [propertyId],
        value
      );
    } catch (error) {
      console.error('❌ buildInvestTx error:', error);
      throw error;
    }
  }

  async buildClaimRentalTx(walletAddress, propertyId) {
    try {
      if (propertyId === 'all') {
        return this.contractProvider.buildTransactionData(
          'RealEstateInvestor',
          'claimAllRentalIncome',
          []
        );
      } else {
        return this.contractProvider.buildTransactionData(
          'RealEstateInvestor',
          'claimRentalIncome',
          [propertyId]
        );
      }
    } catch (error) {
      console.error('❌ buildClaimRentalTx error:', error);
      throw error;
    }
  }

  async getPlatformStats() {
    try {
      const contract = this.contractProvider.getContract('RealEstateInvestor');
      const stats = await contract.getPlatformStats();

      return {
        propertyCount: Number(stats[0]),
        totalInvestors: Number(stats[1]),
        totalBNBInvested: this.contractProvider.formatEther(stats[2]),
        totalRentalDistributed: this.contractProvider.formatEther(stats[3]),
        totalFeesCollected: this.contractProvider.formatEther(stats[4])
      };
    } catch (error) {
      console.error('❌ getPlatformStats error:', error);
      return {
        propertyCount: 0,
        totalInvestors: 0,
        totalBNBInvested: '0',
        totalRentalDistributed: '0',
        totalFeesCollected: '0'
      };
    }
  }
}

module.exports = new RealEstateInvestorService();
