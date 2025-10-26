const { getContractProvider } = require('./contractProvider');
const { db } = require('../db');
const { keygrowRenters, keygrowAllocations, keygrowProperties } = require('../../shared/schema');
const { eq, desc } = require('drizzle-orm');

class KeyGrowService {
  constructor() {
    this.contractProvider = getContractProvider();
  }

  async getRenterInfo(walletAddress) {
    try {
      const fundContract = this.contractProvider.getContract('RealEstateAcquisitionFund');
      
      const renterInfo = await fundContract.getRenterInfo(walletAddress);
      const tier = await fundContract.getUserTier(walletAddress);

      const dbRenter = await db.select()
        .from(keygrowRenters)
        .where(eq(keygrowRenters.walletAddress, walletAddress.toLowerCase()))
        .limit(1);

      return {
        walletAddress,
        tier: this.tierToString(tier),
        tierNumber: Number(tier),
        isRegistered: renterInfo.isActive || false,
        totalClaimed: renterInfo.totalClaimed ? this.contractProvider.formatEther(renterInfo.totalClaimed) : '0',
        lastClaimPeriod: Number(renterInfo.lastClaimPeriod || 0),
        active: dbRenter[0]?.active || false,
        registeredAt: dbRenter[0]?.registeredAt || null
      };
    } catch (error) {
      console.error('❌ getRenterInfo error:', error);
      return {
        walletAddress,
        tier: 'None',
        tierNumber: 0,
        isRegistered: false,
        totalClaimed: '0',
        lastClaimPeriod: 0,
        active: false,
        registeredAt: null
      };
    }
  }

  async getPendingAllocations(walletAddress) {
    try {
      const fundContract = this.contractProvider.getContract('RealEstateAcquisitionFund');
      const currentPeriod = await fundContract.currentDistributionPeriod();
      const renterInfo = await this.getRenterInfo(walletAddress);

      const pendingPeriods = [];
      for (let period = renterInfo.lastClaimPeriod + 1; period <= Number(currentPeriod); period++) {
        try {
          const allocation = await fundContract.calculateAllocation(walletAddress, period);
          if (allocation > 0n) {
            pendingPeriods.push({
              period,
              amount: this.contractProvider.formatEther(allocation),
              claimable: true
            });
          }
        } catch (err) {
          console.warn(`⚠️ Could not calculate allocation for period ${period}:`, err.message);
        }
      }

      return {
        currentPeriod: Number(currentPeriod),
        pendingCount: pendingPeriods.length,
        allocations: pendingPeriods,
        totalPending: pendingPeriods.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(8)
      };
    } catch (error) {
      console.error('❌ getPendingAllocations error:', error);
      return {
        currentPeriod: 0,
        pendingCount: 0,
        allocations: [],
        totalPending: '0'
      };
    }
  }

  async getFundStats() {
    try {
      const fundContract = this.contractProvider.getContract('RealEstateAcquisitionFund');
      const currentPeriod = await fundContract.currentDistributionPeriod();
      
      const provider = this.contractProvider.getProvider();
      const fundAddress = this.contractProvider.getAddress('RealEstateAcquisitionFund');
      const balance = await provider.getBalance(fundAddress);

      const dbStats = await db.select()
        .from(keygrowRenters)
        .where(eq(keygrowRenters.active, true));

      return {
        fundBalance: this.contractProvider.formatEther(balance),
        currentPeriod: Number(currentPeriod),
        activeRenters: dbStats.length,
        fundAddress
      };
    } catch (error) {
      console.error('❌ getFundStats error:', error);
      return {
        fundBalance: '0',
        currentPeriod: 0,
        activeRenters: 0,
        fundAddress: this.contractProvider.getAddress('RealEstateAcquisitionFund')
      };
    }
  }

  async getProperties(walletAddress) {
    try {
      const properties = await db.select()
        .from(keygrowProperties)
        .where(eq(keygrowProperties.renterId, 
          (await db.select().from(keygrowRenters).where(eq(keygrowRenters.walletAddress, walletAddress.toLowerCase())).limit(1))[0]?.id
        ))
        .orderBy(desc(keygrowProperties.createdAt));

      return properties;
    } catch (error) {
      console.error('❌ getProperties error:', error);
      throw error;
    }
  }

  tierToString(tierNumber) {
    const tiers = ['None', 'Bronze', 'Silver', 'Gold', 'Platinum'];
    return tiers[Number(tierNumber)] || 'Unknown';
  }

  async registerRenter(walletAddress, tier = 0) {
    try {
      const existing = await db.select()
        .from(keygrowRenters)
        .where(eq(keygrowRenters.walletAddress, walletAddress.toLowerCase()))
        .limit(1);

      if (existing.length > 0) {
        return existing[0];
      }

      const [newRenter] = await db.insert(keygrowRenters)
        .values({
          walletAddress: walletAddress.toLowerCase(),
          tier: this.tierToString(tier),
          active: true,
          totalAllocated: '0',
          totalClaimed: '0',
          lastClaimPeriod: 0
        })
        .returning();

      return newRenter;
    } catch (error) {
      console.error('❌ registerRenter error:', error);
      throw error;
    }
  }

  async buildRegisterRenterTx(walletAddress, tier) {
    try {
      return this.contractProvider.buildTransactionData(
        'RealEstateAcquisitionFund',
        'registerAsRenter',
        []
      );
    } catch (error) {
      console.error('❌ buildRegisterRenterTx error:', error);
      throw error;
    }
  }

  async buildClaimAllocationTx(walletAddress) {
    try {
      const fundContract = this.contractProvider.getContract('RealEstateAcquisitionFund');
      const currentPeriod = await fundContract.currentDistributionPeriod();
      
      return this.contractProvider.buildTransactionData(
        'RealEstateAcquisitionFund',
        'claimAllocation',
        [Number(currentPeriod)]
      );
    } catch (error) {
      console.error('❌ buildClaimAllocationTx error:', error);
      throw error;
    }
  }

  async recordClaim(walletAddress, period, amount, txHash) {
    try {
      const { sql } = require('drizzle-orm');
      const [allocation] = await db.insert(keygrowAllocations)
        .values({
          walletAddress: walletAddress.toLowerCase(),
          period: period.toString(),
          amount: amount.toString(),
          claimed: true,
          txHash
        })
        .returning();

      await db.update(keygrowRenters)
        .set({
          totalClaimed: sql`CAST(${keygrowRenters.totalClaimed} AS DECIMAL) + ${amount}`,
          updatedAt: new Date()
        })
        .where(eq(keygrowRenters.walletAddress, walletAddress.toLowerCase()));

      return allocation;
    } catch (error) {
      console.error('❌ recordClaim error:', error);
      throw error;
    }
  }

  async buildUpdateTierTx(walletAddress, newTier) {
    try {
      return this.contractProvider.buildTransactionData(
        'RealEstateAcquisitionFund',
        'updateRenterTier',
        [walletAddress, newTier]
      );
    } catch (error) {
      console.error('❌ buildUpdateTierTx error:', error);
      throw error;
    }
  }

  analyzePropertyAcquisition(propertyData, renterProfile = {}) {
    try {
      const price = parseFloat(propertyData.price);
      const arv = parseFloat(propertyData.arv || propertyData.price);
      const beds = parseInt(propertyData.beds || 3);
      const baths = parseFloat(propertyData.baths || 1);
      const sqft = parseInt(propertyData.sqft || 1000);
      const location = propertyData.location || 'Unknown';

      if (isNaN(price) || price <= 0) {
        throw new Error('Valid property price is required');
      }

      const monthlyIncome = parseFloat(renterProfile.monthlyIncome || 4000);
      const currentSavings = Math.max(0, parseFloat(renterProfile.currentSavings || 0));
      const monthlySavings = Math.max(0, parseFloat(renterProfile.monthlySavings || 300));
      const creditScore = parseInt(renterProfile.creditScore || 650);
      const tier = Math.max(0, Math.min(3, parseInt(renterProfile.tier || 0)));

      if (isNaN(monthlyIncome) || monthlyIncome <= 0) {
        throw new Error('Valid monthly income is required');
      }

      const downPaymentPercent = 0.20;
      const downPaymentNeeded = price * downPaymentPercent;
      const closingCosts = price * 0.03;
      const totalUpfrontNeeded = downPaymentNeeded + closingCosts;

      const loanAmount = price - downPaymentNeeded;
      const interestRate = creditScore >= 720 ? 0.065 : creditScore >= 680 ? 0.075 : 0.085;
      const loanTermYears = 30;
      const monthlyRate = interestRate / 12;
      const numPayments = loanTermYears * 12;
      const monthlyMortgage = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);

      const propertyTaxRate = 0.01;
      const monthlyPropertyTax = (price * propertyTaxRate) / 12;
      const monthlyInsurance = price * 0.0035 / 12;
      const monthlyHOA = 0;
      const totalMonthlyPayment = monthlyMortgage + monthlyPropertyTax + monthlyInsurance + monthlyHOA;

      const estimatedMonthlyRent = this.estimateRent(beds, baths, sqft, location);
      const monthlyRentalIncome = estimatedMonthlyRent;

      const platformMonthlyRevenue = 50000;
      const keygrowAllocationPercent = 0.20;
      const monthlyKeygrowFund = platformMonthlyRevenue * keygrowAllocationPercent;

      const activeRenters = 10;
      const tierMultipliers = [1.0, 1.25, 1.5, 2.0];
      const userMultiplier = tierMultipliers[tier] || 1.0;
      
      const totalWeightedShares = activeRenters * 1.2;
      const userShare = userMultiplier / totalWeightedShares;
      const monthlyKeygrowContribution = monthlyKeygrowFund * userShare;

      const combinedMonthlySavings = monthlySavings + monthlyKeygrowContribution;
      
      if (combinedMonthlySavings <= 0) {
        throw new Error('Combined monthly savings must be greater than zero. Check monthly savings and KeyGrow tier settings.');
      }

      const remainingNeeded = Math.max(0, totalUpfrontNeeded - currentSavings);
      const monthsToDownPayment = remainingNeeded > 0 ? Math.ceil(remainingNeeded / combinedMonthlySavings) : 0;
      const yearsToDownPayment = (monthsToDownPayment / 12).toFixed(1);

      const totalKeygrowContribution = Math.min(
        monthlyKeygrowContribution * monthsToDownPayment,
        remainingNeeded * (monthlyKeygrowContribution / combinedMonthlySavings)
      );
      const personalContribution = Math.min(
        monthlySavings * monthsToDownPayment,
        remainingNeeded * (monthlySavings / combinedMonthlySavings)
      );
      const keygrowPercentOfDownPayment = remainingNeeded > 0 
        ? (totalKeygrowContribution / remainingNeeded * 100).toFixed(1)
        : '0.0';

      const dti = (totalMonthlyPayment / monthlyIncome * 100).toFixed(1);
      const isAffordable = dti <= 43;
      const affordabilityRating = dti <= 28 ? 'Excellent' : dti <= 36 ? 'Good' : dti <= 43 ? 'Fair' : 'Challenging';

      const renovationCost = arv > price ? (arv - price) * 0.7 : 0;
      const potentialEquity = arv - price;
      const roi = price > 0 ? (potentialEquity / price * 100).toFixed(1) : 0;

      return {
        property: {
          address: location,
          price: price.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
          priceRaw: price,
          arv: arv.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
          arvRaw: arv,
          beds,
          baths,
          sqft,
          estimatedRent: estimatedMonthlyRent.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
          type: propertyData.type || 'Single-Family',
          yearBuilt: propertyData.yearBuilt || 'Unknown',
          lotSize: propertyData.lotSize || 'Unknown'
        },
        acquisition: {
          downPayment: {
            percent: (downPaymentPercent * 100).toFixed(0) + '%',
            amount: downPaymentNeeded.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
            raw: downPaymentNeeded
          },
          closingCosts: {
            amount: closingCosts.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
            raw: closingCosts
          },
          totalUpfront: {
            amount: totalUpfrontNeeded.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
            raw: totalUpfrontNeeded
          },
          renovationEstimate: {
            amount: renovationCost.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
            raw: renovationCost
          }
        },
        financing: {
          loanAmount: loanAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
          interestRate: (interestRate * 100).toFixed(2) + '%',
          loanTerm: loanTermYears + ' years',
          monthlyMortgage: monthlyMortgage.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
          monthlyPropertyTax: monthlyPropertyTax.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
          monthlyInsurance: monthlyInsurance.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
          monthlyHOA: monthlyHOA.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
          totalMonthlyPayment: totalMonthlyPayment.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
          totalMonthlyPaymentRaw: totalMonthlyPayment
        },
        keygrow: {
          userTier: this.tierToString(tier),
          tierMultiplier: userMultiplier + 'x',
          platformMonthlyRevenue: platformMonthlyRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
          keygrowAllocation: (keygrowAllocationPercent * 100) + '%',
          monthlyKeygrowFund: monthlyKeygrowFund.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
          monthlyUserContribution: monthlyKeygrowContribution.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
          monthlyUserContributionRaw: monthlyKeygrowContribution,
          totalKeygrowContribution: totalKeygrowContribution.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
          keygrowPercentOfDownPayment: keygrowPercentOfDownPayment + '%'
        },
        timeline: {
          personalMonthlySavings: monthlySavings.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
          keygrowMonthlySavings: monthlyKeygrowContribution.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
          combinedMonthlySavings: combinedMonthlySavings.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
          monthsToDownPayment,
          yearsToDownPayment,
          personalContribution: personalContribution.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
          keygrowContribution: totalKeygrowContribution.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
          currentSavings: currentSavings.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
          remainingNeeded: remainingNeeded.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
          totalRequired: totalUpfrontNeeded.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
        },
        affordability: {
          monthlyIncome: monthlyIncome.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
          totalMonthlyPayment: totalMonthlyPayment.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
          dtiRatio: dti + '%',
          isAffordable,
          affordabilityRating,
          creditScore
        },
        investment: {
          estimatedRent: monthlyRentalIncome.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
          monthlyCashFlow: (monthlyRentalIncome - totalMonthlyPayment).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
          potentialEquity: potentialEquity.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
          roi: roi + '%',
          capRate: price > 0 ? ((monthlyRentalIncome * 12) / price * 100).toFixed(2) + '%' : '0%'
        },
        recommendations: this.generateRecommendations(
          isAffordable,
          parseFloat(dti),
          monthsToDownPayment,
          tier,
          creditScore,
          potentialEquity
        )
      };
    } catch (error) {
      console.error('❌ analyzePropertyAcquisition error:', error);
      throw error;
    }
  }

  estimateRent(beds, baths, sqft, location) {
    let baseRent = 800;
    
    baseRent += beds * 300;
    baseRent += baths * 150;
    baseRent += (sqft / 100) * 50;

    if (location.toLowerCase().includes('atlanta')) {
      baseRent *= 1.15;
    }

    return Math.round(baseRent);
  }

  generateRecommendations(isAffordable, dti, monthsToGoal, tier, creditScore, potentialEquity) {
    const recommendations = [];

    if (!isAffordable) {
      recommendations.push({
        type: 'warning',
        title: 'DTI Too High',
        message: 'Your debt-to-income ratio exceeds recommended limits. Consider increasing income or reducing the target price.'
      });
    }

    if (monthsToGoal > 36) {
      recommendations.push({
        type: 'info',
        title: 'Long Timeline',
        message: `It will take ${Math.ceil(monthsToGoal / 12)} years to save for this property. Consider upgrading your KeyGrow tier for faster accumulation.`
      });
    }

    if (tier === 0) {
      recommendations.push({
        type: 'success',
        title: 'Upgrade Your Tier',
        message: 'Joining KeyGrow Bronze tier (1.25x) or higher can significantly accelerate your down payment savings.'
      });
    }

    if (creditScore < 680) {
      recommendations.push({
        type: 'warning',
        title: 'Improve Credit Score',
        message: 'Improving your credit score to 680+ can reduce your interest rate and monthly payments by $100-$200.'
      });
    }

    if (potentialEquity > 50000) {
      recommendations.push({
        type: 'success',
        title: 'Strong Investment Opportunity',
        message: `This property has excellent potential equity of $${(potentialEquity / 1000).toFixed(0)}K. Consider renovation financing.`
      });
    }

    if (monthsToGoal <= 24 && isAffordable) {
      recommendations.push({
        type: 'success',
        title: 'Achievable Goal',
        message: 'This property is financially achievable within 2 years with KeyGrow assistance. Great choice!'
      });
    }

    return recommendations;
  }

  async crawlProperty(url) {
    const axios = require('axios');
    const cheerio = require('cheerio');

    try {
      console.log('🕷️ Fetching property data from:', url);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);

      const price = this.extractPrice($);
      const arv = this.extractARV($);
      const beds = this.extractBeds($);
      const baths = this.extractBaths($);
      const sqft = this.extractSqft($);
      const location = this.extractLocation($);
      const type = this.extractType($);
      const yearBuilt = this.extractYearBuilt($);
      const lotSize = this.extractLotSize($);

      return {
        url,
        price,
        arv,
        beds,
        baths,
        sqft,
        location,
        type,
        yearBuilt,
        lotSize,
        crawledAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Property crawl failed:', error.message);
      throw new Error('Unable to crawl property. Please provide data manually.');
    }
  }

  extractPrice($) {
    const priceText = $('*:contains("Price")').first().parent().text() || 
                     $('*:contains("$")').first().text();
    const match = priceText.match(/\$([0-9,]+)/);
    return match ? parseInt(match[1].replace(/,/g, '')) : null;
  }

  extractARV($) {
    const arvText = $('*:contains("ARV")').first().parent().text();
    const match = arvText.match(/\$([0-9,]+)/);
    return match ? parseInt(match[1].replace(/,/g, '')) : null;
  }

  extractBeds($) {
    const bedsText = $('*:contains("Beds")').first().text() || 
                    $('*:contains("Bed")').first().text();
    const match = bedsText.match(/(\d+)\s*Bed/i);
    return match ? parseInt(match[1]) : null;
  }

  extractBaths($) {
    const bathsText = $('*:contains("Baths")').first().text() || 
                     $('*:contains("Bath")').first().text();
    const match = bathsText.match(/(\d+(?:\.\d+)?)\s*Bath/i);
    return match ? parseFloat(match[1]) : null;
  }

  extractSqft($) {
    const sqftText = $('*:contains("Sq")').first().text() || 
                    $('*:contains("Sq.Ft")').first().text();
    const match = sqftText.match(/([0-9,]+)\s*Sq/i);
    return match ? parseInt(match[1].replace(/,/g, '')) : null;
  }

  extractLocation($) {
    return $('*:contains("County")').first().text() || 
           $('h1').first().text() || 
           'Unknown Location';
  }

  extractType($) {
    const typeText = $('*:contains("Type")').first().parent().text();
    return typeText.includes('Single') ? 'Single-Family' : 
           typeText.includes('Multi') ? 'Multi-Family' : 
           'Single-Family';
  }

  extractYearBuilt($) {
    const yearText = $('*:contains("Built")').first().parent().text();
    const match = yearText.match(/\b(19|20)\d{2}\b/);
    return match ? match[0] : null;
  }

  extractLotSize($) {
    const lotText = $('*:contains("Lot")').first().parent().text() || 
                   $('*:contains("acre")').first().text();
    const match = lotText.match(/(\d+(?:\.\d+)?)\s*acre/i);
    return match ? match[1] + ' acres' : null;
  }
}

module.exports = new KeyGrowService();
