const { getContractProvider } = require('./contractProvider');
const { db } = require('../db');
const { propertySubmissions } = require('../../shared/schema');
const { eq, and, desc } = require('drizzle-orm');

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

  // ==== PROPERTY SUBMISSION METHODS ====

  async createPropertySubmission(submissionData) {
    try {
      const [submission] = await db.insert(propertySubmissions)
        .values({
          submitterWalletAddress: submissionData.submitterWalletAddress,
          submitterName: submissionData.submitterName || null,
          submitterEmail: submissionData.submitterEmail || null,
          submitterPhone: submissionData.submitterPhone || null,
          propertyName: submissionData.propertyName,
          propertyAddress: submissionData.propertyAddress,
          city: submissionData.city,
          state: submissionData.state,
          zipCode: submissionData.zipCode,
          country: submissionData.country || 'United States',
          propertyDescription: submissionData.propertyDescription || null,
          propertyType: submissionData.propertyType || null,
          bedrooms: submissionData.bedrooms || null,
          bathrooms: submissionData.bathrooms || null,
          squareFeet: submissionData.squareFeet || null,
          lotSize: submissionData.lotSize || null,
          yearBuilt: submissionData.yearBuilt || null,
          purchasePrice: submissionData.purchasePrice.toString(),
          monthlyRent: submissionData.monthlyRent.toString(),
          totalShares: submissionData.totalShares,
          pricePerShare: submissionData.pricePerShare.toString(),
          estimatedAnnualRent: submissionData.estimatedAnnualRent?.toString() || null,
          estimatedAppreciation: submissionData.estimatedAppreciation?.toString() || null,
          estimatedROI: submissionData.estimatedROI?.toString() || null,
          rentalYield: submissionData.rentalYield?.toString() || null,
          occupancyRate: submissionData.occupancyRate?.toString() || '100.00',
          managementCompany: submissionData.managementCompany || null,
          propertyManager: submissionData.propertyManager || null,
          currentTenant: submissionData.currentTenant || false,
          leaseEndDate: submissionData.leaseEndDate || null,
          images: submissionData.images || null,
          documents: submissionData.documents || null,
          virtualTourUrl: submissionData.virtualTourUrl || null,
          metadataURI: submissionData.metadataURI || null,
          status: 'pending'
        })
        .returning();

      console.log('✅ Property submission created:', submission.id);
      return submission;
    } catch (error) {
      console.error('❌ createPropertySubmission error:', error);
      throw error;
    }
  }

  async getPropertySubmissions(status = null, submitterWallet = null) {
    try {
      let query = db.select().from(propertySubmissions);
      
      const conditions = [];
      if (status) {
        conditions.push(eq(propertySubmissions.status, status));
      }
      if (submitterWallet) {
        conditions.push(eq(propertySubmissions.submitterWalletAddress, submitterWallet.toLowerCase()));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const submissions = await query.orderBy(desc(propertySubmissions.submittedAt));
      return submissions;
    } catch (error) {
      console.error('❌ getPropertySubmissions error:', error);
      throw error;
    }
  }

  async getPropertySubmissionById(id) {
    try {
      const [submission] = await db.select()
        .from(propertySubmissions)
        .where(eq(propertySubmissions.id, parseInt(id)));
      
      return submission || null;
    } catch (error) {
      console.error('❌ getPropertySubmissionById error:', error);
      throw error;
    }
  }

  async approvePropertySubmission(id, reviewedBy, approvalNotes = null, metadataURI = null) {
    try {
      const [submission] = await db.update(propertySubmissions)
        .set({
          status: 'approved',
          reviewedBy: parseInt(reviewedBy),
          reviewedAt: new Date(),
          approvalNotes,
          metadataURI: metadataURI || null,
          updatedAt: new Date()
        })
        .where(eq(propertySubmissions.id, parseInt(id)))
        .returning();

      console.log('✅ Property submission approved:', id);
      return submission;
    } catch (error) {
      console.error('❌ approvePropertySubmission error:', error);
      throw error;
    }
  }

  async rejectPropertySubmission(id, reviewedBy, rejectionReason) {
    try {
      const [submission] = await db.update(propertySubmissions)
        .set({
          status: 'rejected',
          reviewedBy: parseInt(reviewedBy),
          reviewedAt: new Date(),
          rejectionReason,
          updatedAt: new Date()
        })
        .where(eq(propertySubmissions.id, parseInt(id)))
        .returning();

      console.log('✅ Property submission rejected:', id);
      return submission;
    } catch (error) {
      console.error('❌ rejectPropertySubmission error:', error);
      throw error;
    }
  }

  async buildListPropertyTx(submissionId, adminWallet) {
    try {
      const submission = await this.getPropertySubmissionById(submissionId);
      
      if (!submission) {
        throw new Error('Submission not found');
      }

      if (submission.status !== 'approved') {
        throw new Error('Submission must be approved before listing');
      }

      if (!submission.metadataURI) {
        throw new Error('Metadata URI is required for listing');
      }

      const purchasePrice = this.contractProvider.parseEther(submission.purchasePrice);
      const monthlyRent = this.contractProvider.parseEther(submission.monthlyRent);
      const pricePerShare = this.contractProvider.parseEther(submission.pricePerShare);

      return this.contractProvider.buildTransactionData(
        'RealEstateInvestor',
        'listProperty',
        [
          purchasePrice,
          monthlyRent,
          submission.totalShares,
          pricePerShare,
          submission.metadataURI
        ]
      );
    } catch (error) {
      console.error('❌ buildListPropertyTx error:', error);
      throw error;
    }
  }

  async markSubmissionAsListed(id, onChainPropertyId, txHash) {
    try {
      const [submission] = await db.update(propertySubmissions)
        .set({
          status: 'listed',
          onChainPropertyId: parseInt(onChainPropertyId),
          listingTxHash: txHash,
          listedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(propertySubmissions.id, parseInt(id)))
        .returning();

      console.log('✅ Property submission marked as listed:', id);
      return submission;
    } catch (error) {
      console.error('❌ markSubmissionAsListed error:', error);
      throw error;
    }
  }
}

module.exports = new RealEstateInvestorService();
