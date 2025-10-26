const { db } = require('../../db');
const { deals } = require('../../../shared/schema');
const { eq } = require('drizzle-orm');
const { parseMessage } = require('../parsing/smsParser');
const { analyzeProfitability } = require('../analysis/profitability');
const { analyzeRTOSuitability } = require('../analysis/rtoSuitability');
const enrichmentService = require('./enrichmentService');
const mlPredictions = require('../ml/predictions');
const notificationService = require('./notificationService');
const investorMatching = require('./investorMatchingService');
const { propertyScraperService } = require('./propertyScraperService');
const { randomUUID } = require('crypto');

const DEFAULT_REPAIRS = {
  estLow: 15000,
  estMid: 30000,
  estHigh: 45000,
  notes: ['Default estimate - update based on property inspection']
};

class DealService {
  async ingestDeal(request, userId) {
    const { source = 'manual', rawText, url } = request;

    const { parsed, confidence, warnings } = parseMessage(rawText, url);

    const compliance = {
      consentLog: [
        `Received ${source} message at ${new Date().toISOString()}`,
        confidence === 'low' ? `Low confidence parse: ${warnings.join(', ')}` : 'Parsed successfully'
      ],
      tosMode: 'manual_upload',
      optOutDetected: parsed.optOut,
      processedAt: new Date().toISOString()
    };

    if (parsed.optOut) {
      compliance.consentLog.push('Opt-out keyword detected in message text');
    }

    const dealId = randomUUID();

    const dealData = {
      id: dealId,
      source,
      rawText,
      parsed,
      repairs: DEFAULT_REPAIRS,
      media: [],
      compliance,
      status: 'draft',
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.insert(deals).values(dealData);

    const [insertedDeal] = await db
      .select()
      .from(deals)
      .where(eq(deals.id, dealId));

    const mappedDeal = this.mapToDeal(insertedDeal);

    await notificationService.sendNewDealNotification(mappedDeal);

    const matches = await investorMatching.matchDeal(mappedDeal);
    if (matches.length > 0) {
      console.log(`🎯 Auto-matched deal to ${matches.length} investors`);
    }

    return mappedDeal;
  }

  async enrichDeal(dealId, options) {
    const [deal] = await db
      .select()
      .from(deals)
      .where(eq(deals.id, dealId));

    if (!deal) {
      throw new Error(`Deal not found: ${dealId}`);
    }

    console.log(`🔄 IELA: Enriching deal ${dealId}...`);

    const enrichments = await enrichmentService.enrichDeal(deal);

    let scrapedMedia = [];
    
    // Add Dropbox images from parsed data
    if (deal.parsed?.imageUrls && deal.parsed.imageUrls.length > 0) {
      scrapedMedia = deal.parsed.imageUrls.map(url => ({
        type: 'image',
        url: url,
        source: 'dropbox',
        addedAt: new Date().toISOString()
      }));
      console.log(`✅ Added ${scrapedMedia.length} Dropbox images from parsed data`);
    }
    
    // Also try to scrape from property listing URL
    if (deal.rawText && (deal.rawText.includes('http://') || deal.rawText.includes('https://'))) {
      const urlMatch = deal.rawText.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        const url = urlMatch[0];
        // Skip Dropbox image URLs (already handled above) - only scrape folders
        const isDropboxImageFile = url.includes('dropbox.com') && url.match(/\.(jpg|jpeg|png|gif|webp)/i);
        if (!isDropboxImageFile) {
          console.log(`📸 Scraping property listing: ${url}`);
          const scraped = await propertyScraperService.scrapePropertyListing(url);
          const scrapedImages = scraped.images.map(img => ({
            type: 'image',
            url: img,
            source: 'scraped',
            scrapedAt: new Date().toISOString()
          }));
          scrapedMedia = [...scrapedMedia, ...scrapedImages];
          console.log(`✅ Scraped ${scrapedImages.length} images from listing`);
        } else {
          console.log(`⏭️  Skipping Puppeteer scrape - Dropbox image already extracted`);
        }
      }
    }

    const repairPrediction = await mlPredictions.predictRepairCost(
      enrichments.propertyFacts,
      enrichments.marketData,
      enrichments.propertyFacts?.condition || 'Fair',
      deal.parsed?.zip
    );

    const repairs = {
      estLow: repairPrediction.low,
      estMid: repairPrediction.estimated,
      estHigh: repairPrediction.high,
      mlConfidence: repairPrediction.confidence,
      notes: [
        repairPrediction.note,
        `Based on: ${repairPrediction.factors.size} sqft, ${repairPrediction.factors.age} years old, ${repairPrediction.factors.condition} condition`
      ]
    };

    const rentPrediction = mlPredictions.predictRent(
      enrichments.propertyFacts,
      enrichments.marketData,
      enrichments.geocoding
    );

    const rents = {
      marketRentEst: rentPrediction.estimated,
      marketRentLow: rentPrediction.low,
      marketRentHigh: rentPrediction.high,
      mlConfidence: rentPrediction.confidence,
      source: 'ml_prediction',
      confidence: rentPrediction.confidence
    };

    const appreciationPrediction = mlPredictions.predictAppreciation(
      enrichments.marketData,
      enrichments.neighborhoodScore,
      enrichments.propertyFacts
    );

    await db
      .update(deals)
      .set({
        geocode: enrichments.geocoding,
        facts: enrichments.propertyFacts,
        finance: {
          marketData: enrichments.marketData,
          neighborhoodScore: enrichments.neighborhoodScore,
          predictions: {
            appreciation: appreciationPrediction,
            rentEstimate: rentPrediction,
            repairCost: repairPrediction
          }
        },
        repairs,
        rents,
        media: scrapedMedia.length > 0 ? scrapedMedia : (deal.media || []),
        updatedAt: new Date()
      })
      .where(eq(deals.id, dealId));

    const [updated] = await db
      .select()
      .from(deals)
      .where(eq(deals.id, dealId));

    console.log(`✅ IELA: Deal enriched ${dealId} with ML predictions`);

    return this.mapToDeal(updated);
  }

  async analyzeDeal(dealId, customRepairs) {
    const [deal] = await db
      .select()
      .from(deals)
      .where(eq(deals.id, dealId));

    if (!deal) {
      throw new Error(`Deal not found: ${dealId}`);
    }

    const parsed = deal.parsed;
    const currentRepairs = deal.repairs;

    if (!parsed.asking || !parsed.arv) {
      throw new Error('Cannot analyze deal: missing asking price or ARV');
    }

    const repairs = {
      low: customRepairs?.low ?? currentRepairs.estLow,
      mid: customRepairs?.mid ?? currentRepairs.estMid,
      high: customRepairs?.high ?? currentRepairs.estHigh
    };

    const profitability = analyzeProfitability({
      asking: parsed.asking,
      arv: parsed.arv,
      repairs
    });

    const rents = deal.rents;
    const rtoAnalysis = analyzeRTOSuitability({
      monthlyRent: rents?.marketRentEst
    });

    const analysis = {
      ...profitability,
      ...rtoAnalysis,
      dscrByRent: rtoAnalysis.dscrByRent,
      rtoBadge: rtoAnalysis.badge
    };

    await db
      .update(deals)
      .set({
        analysis,
        status: 'analyzed',
        updatedAt: new Date()
      })
      .where(eq(deals.id, dealId));

    const [updated] = await db
      .select()
      .from(deals)
      .where(eq(deals.id, dealId));

    console.log(`✅ IELA: Deal ${dealId} analyzed and ready for manual publishing`);

    return this.mapToDeal(updated);
  }

  async publishDeal(dealId, target) {
    const [deal] = await db
      .select()
      .from(deals)
      .where(eq(deals.id, dealId));

    if (!deal) {
      throw new Error(`Deal not found: ${dealId}`);
    }

    if (!deal.analysis) {
      throw new Error('Deal must be analyzed before publishing');
    }

    await db
      .update(deals)
      .set({
        status: 'published',
        publishedTarget: target,
        publishedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(deals.id, dealId));

    console.log(`📤 IELA: Deal ${dealId} published to marketplace for ${target}`);

    return {
      cardUrl: `/deals/${dealId}`,
      publishedAt: new Date().toISOString(),
      target
    };
  }

  async getDeal(dealId) {
    const [deal] = await db
      .select()
      .from(deals)
      .where(eq(deals.id, dealId));

    return deal ? this.mapToDeal(deal) : null;
  }

  async listDeals(filters) {
    let query = db.select().from(deals);

    if (filters?.status) {
      query = query.where(eq(deals.status, filters.status));
    }

    const result = await query.limit(filters?.limit || 50).offset(filters?.offset || 0);

    return result.map(d => this.mapToDeal(d));
  }

  async updateDealStatus(dealId, status) {
    await db
      .update(deals)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(deals.id, dealId));

    return this.getDeal(dealId);
  }

  async deleteDeal(dealId) {
    const [deal] = await db
      .select()
      .from(deals)
      .where(eq(deals.id, dealId));

    if (!deal) {
      throw new Error(`Deal not found: ${dealId}`);
    }

    await db
      .delete(deals)
      .where(eq(deals.id, dealId));

    console.log(`🗑️ IELA: Deal ${dealId} permanently deleted`);

    return { success: true, deletedId: dealId };
  }

  mapToDeal(row) {
    return {
      id: row.id,
      source: row.source,
      rawText: row.rawText,
      parsed: row.parsed,
      geocode: row.geocode,
      facts: row.facts,
      finance: row.finance,
      rents: row.rents,
      repairs: row.repairs,
      analysis: row.analysis,
      media: row.media || [],
      compliance: row.compliance,
      status: row.status,
      createdBy: row.createdBy,
      assignedTo: row.assignedTo,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString()
    };
  }
}

const dealService = new DealService();

module.exports = {
  DealService,
  dealService
};
