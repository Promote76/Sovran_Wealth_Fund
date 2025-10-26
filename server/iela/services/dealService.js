import { db } from '../../db';
import { deals } from '../../../shared/schema';
import { eq } from 'drizzle-orm';
import { Deal, IngestRequest, ParsedFields, RepairEstimate, ComplianceLog } from '../models/types';
import { parseMessage } from '../parsing/smsParser';
import { analyzeProfitability } from '../analysis/profitability';
import { analyzeRTOSuitability } from '../analysis/rtoSuitability';
import { randomUUID } from 'crypto';

const DEFAULT_REPAIRS: RepairEstimate = {
  estLow: 15000,
  estMid: 30000,
  estHigh: 45000,
  notes: ['Default estimate - update based on property inspection']
};

export class DealService {
  async ingestDeal(request: IngestRequest, userId?: string): Promise<Deal> {
    const { source, rawText, url } = request;

    const { parsed, confidence, warnings } = parseMessage(rawText, url);

    const compliance: ComplianceLog = {
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

    const dealId = randomUUID();

    const dealData = {
      id: dealId,
      source,
      rawText,
      parsed: parsed as any,
      repairs: DEFAULT_REPAIRS as any,
      media: [],
      compliance: compliance as any,
      status: 'draft' as const,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.insert(deals).values(dealData);

    const [insertedDeal] = await db
      .select()
      .from(deals)
      .where(eq(deals.id, dealId));

    return this.mapToDeal(insertedDeal);
  }

  async enrichDeal(dealId: string, options?: {
    geocode?: boolean;
    propertyFacts?: boolean;
    rentData?: boolean;
  }): Promise<Deal> {
    const [deal] = await db
      .select()
      .from(deals)
      .where(eq(deals.id, dealId));

    if (!deal) {
      throw new Error(`Deal not found: ${dealId}`);
    }

    console.log('⚠️ IELA Enrichment: Geocoding and property data APIs not configured');
    console.log('To enable: Set GEOCODER_PROVIDER and GEOCODER_API_KEY environment variables');

    await db
      .update(deals)
      .set({
        updatedAt: new Date()
      })
      .where(eq(deals.id, dealId));

    const [updated] = await db
      .select()
      .from(deals)
      .where(eq(deals.id, dealId));

    return this.mapToDeal(updated);
  }

  async analyzeDeal(dealId: string, customRepairs?: {
    low?: number;
    mid?: number;
    high?: number;
  }): Promise<Deal> {
    const [deal] = await db
      .select()
      .from(deals)
      .where(eq(deals.id, dealId));

    if (!deal) {
      throw new Error(`Deal not found: ${dealId}`);
    }

    const parsed = deal.parsed as any as ParsedFields;
    const currentRepairs = deal.repairs as any as RepairEstimate;

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

    const rents = deal.rents as any;
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
        analysis: analysis as any,
        updatedAt: new Date()
      })
      .where(eq(deals.id, dealId));

    const [updated] = await db
      .select()
      .from(deals)
      .where(eq(deals.id, dealId));

    return this.mapToDeal(updated);
  }

  async publishDeal(dealId: string, target: 'investor' | 'rto'): Promise<{
    cardUrl: string;
    publishedAt: string;
  }> {
    const [deal] = await db
      .select()
      .from(deals)
      .where(eq(deals.id, dealId));

    if (!deal) {
      throw new Error(`Deal not found: ${dealId}`);
    }

    const newStatus = target === 'investor' ? 'listed_investor' : 'listed_rto';

    await db
      .update(deals)
      .set({
        status: newStatus as any,
        updatedAt: new Date()
      })
      .where(eq(deals.id, dealId));

    return {
      cardUrl: `/deals/${dealId}/card/${target}`,
      publishedAt: new Date().toISOString()
    };
  }

  async getDeal(dealId: string): Promise<Deal | null> {
    const [deal] = await db
      .select()
      .from(deals)
      .where(eq(deals.id, dealId));

    return deal ? this.mapToDeal(deal) : null;
  }

  async listDeals(filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Deal[]> {
    let query = db.select().from(deals);

    if (filters?.status) {
      query = query.where(eq(deals.status, filters.status as any)) as any;
    }

    const result = await query.limit(filters?.limit || 50).offset(filters?.offset || 0);

    return result.map(d => this.mapToDeal(d));
  }

  private mapToDeal(row: any): Deal {
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

export const dealService = new DealService();
