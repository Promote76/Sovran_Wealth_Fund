"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dealService = exports.DealService = void 0;
const db_1 = require("../../db");
const schema_1 = require("../../../shared/schema");
const drizzle_orm_1 = require("drizzle-orm");
const smsParser_1 = require("../parsing/smsParser");
const profitability_1 = require("../analysis/profitability");
const rtoSuitability_1 = require("../analysis/rtoSuitability");
const crypto_1 = require("crypto");
const DEFAULT_REPAIRS = {
    estLow: 15000,
    estMid: 30000,
    estHigh: 45000,
    notes: ['Default estimate - update based on property inspection']
};
class DealService {
    async ingestDeal(request, userId) {
        const { source, rawText, url } = request;
        const { parsed, confidence, warnings } = (0, smsParser_1.parseMessage)(rawText, url);
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
            compliance.consentLog.push('Opt-out detected - message marked as suppressed');
        }
        const dealId = (0, crypto_1.randomUUID)();
        const dealData = {
            id: dealId,
            source,
            rawText,
            parsed: parsed,
            repairs: DEFAULT_REPAIRS,
            media: [],
            compliance: compliance,
            status: 'draft',
            createdBy: userId,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await db_1.db.insert(schema_1.deals).values(dealData);
        const [insertedDeal] = await db_1.db
            .select()
            .from(schema_1.deals)
            .where((0, drizzle_orm_1.eq)(schema_1.deals.id, dealId));
        return this.mapToDeal(insertedDeal);
    }
    async enrichDeal(dealId, options) {
        const [deal] = await db_1.db
            .select()
            .from(schema_1.deals)
            .where((0, drizzle_orm_1.eq)(schema_1.deals.id, dealId));
        if (!deal) {
            throw new Error(`Deal not found: ${dealId}`);
        }
        console.log('⚠️ IELA Enrichment: Geocoding and property data APIs not configured');
        console.log('To enable: Set GEOCODER_PROVIDER and GEOCODER_API_KEY environment variables');
        await db_1.db
            .update(schema_1.deals)
            .set({
            updatedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.deals.id, dealId));
        const [updated] = await db_1.db
            .select()
            .from(schema_1.deals)
            .where((0, drizzle_orm_1.eq)(schema_1.deals.id, dealId));
        return this.mapToDeal(updated);
    }
    async analyzeDeal(dealId, customRepairs) {
        const [deal] = await db_1.db
            .select()
            .from(schema_1.deals)
            .where((0, drizzle_orm_1.eq)(schema_1.deals.id, dealId));
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
        const profitability = (0, profitability_1.analyzeProfitability)({
            asking: parsed.asking,
            arv: parsed.arv,
            repairs
        });
        const rents = deal.rents;
        const rtoAnalysis = (0, rtoSuitability_1.analyzeRTOSuitability)({
            monthlyRent: rents?.marketRentEst
        });
        const analysis = {
            ...profitability,
            ...rtoAnalysis,
            dscrByRent: rtoAnalysis.dscrByRent,
            rtoBadge: rtoAnalysis.badge
        };
        await db_1.db
            .update(schema_1.deals)
            .set({
            analysis: analysis,
            updatedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.deals.id, dealId));
        const [updated] = await db_1.db
            .select()
            .from(schema_1.deals)
            .where((0, drizzle_orm_1.eq)(schema_1.deals.id, dealId));
        return this.mapToDeal(updated);
    }
    async publishDeal(dealId, target) {
        const [deal] = await db_1.db
            .select()
            .from(schema_1.deals)
            .where((0, drizzle_orm_1.eq)(schema_1.deals.id, dealId));
        if (!deal) {
            throw new Error(`Deal not found: ${dealId}`);
        }
        const newStatus = target === 'investor' ? 'listed_investor' : 'listed_rto';
        await db_1.db
            .update(schema_1.deals)
            .set({
            status: newStatus,
            updatedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.deals.id, dealId));
        return {
            cardUrl: `/deals/${dealId}/card/${target}`,
            publishedAt: new Date().toISOString()
        };
    }
    async getDeal(dealId) {
        const [deal] = await db_1.db
            .select()
            .from(schema_1.deals)
            .where((0, drizzle_orm_1.eq)(schema_1.deals.id, dealId));
        return deal ? this.mapToDeal(deal) : null;
    }
    async listDeals(filters) {
        let query = db_1.db.select().from(schema_1.deals);
        if (filters?.status) {
            query = query.where((0, drizzle_orm_1.eq)(schema_1.deals.status, filters.status));
        }
        const result = await query.limit(filters?.limit || 50).offset(filters?.offset || 0);
        return result.map(d => this.mapToDeal(d));
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
exports.DealService = DealService;
exports.dealService = new DealService();
