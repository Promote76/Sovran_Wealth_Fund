const { db } = require('../../db');
const { deals } = require('../../../shared/schema');
const { eq } = require('drizzle-orm');

class InvestorMatchingService {
  constructor() {
    this.investorCriteria = new Map();
  }

  registerInvestor(investorId, criteria) {
    this.investorCriteria.set(investorId, {
      id: investorId,
      minPrice: criteria.minPrice || 0,
      maxPrice: criteria.maxPrice || 1000000,
      minARV: criteria.minARV || 0,
      maxARV: criteria.maxARV || 2000000,
      minMargin: criteria.minMargin || 0,
      states: criteria.states || [],
      cities: criteria.cities || [],
      propertyTypes: criteria.propertyTypes || [],
      maxRepairs: criteria.maxRepairs || 100000,
      minBeds: criteria.minBeds || 0,
      minBaths: criteria.minBaths || 0,
      minSqFt: criteria.minSqFt || 0,
      requiresGoodRTO: criteria.requiresGoodRTO || false,
      email: criteria.email || null,
      phone: criteria.phone || null,
      notifyByEmail: criteria.notifyByEmail !== false,
      notifyBySMS: criteria.notifyBySMS || false
    });

    console.log(`✅ Registered investor ${investorId} with criteria`);
    return true;
  }

  unregisterInvestor(investorId) {
    this.investorCriteria.delete(investorId);
    console.log(`✅ Unregistered investor ${investorId}`);
    return true;
  }

  async matchDeal(deal) {
    const matches = [];

    for (const [investorId, criteria] of this.investorCriteria.entries()) {
      if (this.doesDealMatchCriteria(deal, criteria)) {
        matches.push({
          investorId,
          criteria,
          matchScore: this.calculateMatchScore(deal, criteria),
          matchedCriteria: this.getMatchedCriteria(deal, criteria)
        });
      }
    }

    matches.sort((a, b) => b.matchScore - a.matchScore);

    console.log(`🎯 Found ${matches.length} investor matches for deal ${deal.id}`);
    return matches;
  }

  doesDealMatchCriteria(deal, criteria) {
    const parsed = deal.parsed || {};
    const analysis = deal.analysis || {};
    const propertyFacts = deal.propertyFacts || {};

    if (parsed.asking < criteria.minPrice || parsed.asking > criteria.maxPrice) {
      return false;
    }

    if (parsed.arv && (parsed.arv < criteria.minARV || parsed.arv > criteria.maxARV)) {
      return false;
    }

    if (criteria.states.length > 0 && !criteria.states.includes(parsed.state)) {
      return false;
    }

    if (criteria.cities.length > 0 && !criteria.cities.includes(parsed.city)) {
      return false;
    }

    if (criteria.propertyTypes.length > 0 && propertyFacts.propertyType) {
      if (!criteria.propertyTypes.includes(propertyFacts.propertyType)) {
        return false;
      }
    }

    if (deal.repairs?.estMid && deal.repairs.estMid > criteria.maxRepairs) {
      return false;
    }

    if (propertyFacts.bedrooms && propertyFacts.bedrooms < criteria.minBeds) {
      return false;
    }

    if (propertyFacts.bathrooms && propertyFacts.bathrooms < criteria.minBaths) {
      return false;
    }

    if (propertyFacts.squareFeet && propertyFacts.squareFeet < criteria.minSqFt) {
      return false;
    }

    const margin = analysis.maoByRepair?.[1]?.mao - parsed.asking || 0;
    if (margin < criteria.minMargin) {
      return false;
    }

    if (criteria.requiresGoodRTO && analysis.rtoBadge !== 'green') {
      return false;
    }

    return true;
  }

  calculateMatchScore(deal, criteria) {
    let score = 100;

    const margin = (deal.analysis?.maoByRepair?.[1]?.mao || 0) - (deal.parsed?.asking || 0);
    const marginPct = deal.parsed?.asking ? (margin / deal.parsed.asking) * 100 : 0;
    
    if (marginPct > 30) score += 50;
    else if (marginPct > 20) score += 30;
    else if (marginPct > 10) score += 15;

    if (deal.analysis?.rtoBadge === 'green') score += 25;
    else if (deal.analysis?.rtoBadge === 'yellow') score += 10;

    if (criteria.states.includes(deal.parsed?.state)) score += 10;
    if (criteria.cities.includes(deal.parsed?.city)) score += 15;

    const priceMid = (criteria.minPrice + criteria.maxPrice) / 2;
    const priceDeviation = Math.abs(deal.parsed?.asking - priceMid) / priceMid;
    score += Math.max(0, 20 * (1 - priceDeviation));

    return Math.round(score);
  }

  getMatchedCriteria(deal, criteria) {
    const matched = [];

    if (deal.parsed?.asking >= criteria.minPrice && deal.parsed?.asking <= criteria.maxPrice) {
      matched.push('price_range');
    }

    if (criteria.states.includes(deal.parsed?.state)) {
      matched.push('location');
    }

    const margin = (deal.analysis?.maoByRepair?.[1]?.mao || 0) - (deal.parsed?.asking || 0);
    if (margin >= criteria.minMargin) {
      matched.push('profit_margin');
    }

    if (deal.analysis?.rtoBadge === 'green') {
      matched.push('rto_quality');
    }

    return matched;
  }

  async assignDealToInvestor(dealId, investorId) {
    try {
      await db
        .update(deals)
        .set({
          assignedTo: investorId,
          assignedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(deals.id, dealId));

      console.log(`✅ Assigned deal ${dealId} to investor ${investorId}`);
      return true;
    } catch (error) {
      console.error('Failed to assign deal:', error);
      return false;
    }
  }

  getInvestorCriteria(investorId) {
    return this.investorCriteria.get(investorId);
  }

  getAllInvestors() {
    return Array.from(this.investorCriteria.values());
  }
}

module.exports = new InvestorMatchingService();
