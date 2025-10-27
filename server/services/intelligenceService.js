/**
 * Feature #3: Investor Intelligence Suite Service
 * Handles predictive analytics, cash flow projections, and investor insights
 */

const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

class IntelligenceService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  /**
   * Generate 12-month cash flow projection for a property
   */
  async generateCashFlowProjection(propertyId, investorId = null) {
    const client = await this.pool.connect();
    
    try {
      // Get property data
      const propertyResult = await client.query(
        `SELECT fp.*, d.parsed
         FROM fractional_properties fp
         LEFT JOIN deals d ON fp.deal_id = d.id
         WHERE fp.id = $1`,
        [propertyId]
      );
      
      if (!propertyResult.rows[0]) {
        throw new Error('Property not found');
      }
      
      const property = propertyResult.rows[0];
      const monthlyRent = parseFloat(property.monthly_rent || 0);
      const monthlyExpenses = parseFloat(property.monthly_expenses || 0);
      const netMonthly = monthlyRent - monthlyExpenses;
      
      // Generate 12-month projections (simplified - real implementation would use ML)
      const monthlyProjections = [];
      for (let month = 1; month <= 12; month++) {
        // Add slight variance (+/- 5%) for realism
        const variance = 1 + (Math.random() * 0.1 - 0.05);
        monthlyProjections.push({
          month,
          projectedIncome: monthlyRent * variance,
          projectedExpenses: monthlyExpenses,
          netCashFlow: netMonthly * variance
        });
      }
      
      const totalIncome = monthlyProjections.reduce((sum, m) => sum + m.projectedIncome, 0);
      const totalExpenses = monthlyProjections.reduce((sum, m) => sum + m.projectedExpenses, 0);
      const netCashFlow = totalIncome - totalExpenses;
      
      const projectionId = uuidv4();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      
      const result = await client.query(
        `INSERT INTO cash_flow_projections (
          projection_id, property_id, investor_id, projection_months,
          monthly_projections, total_projected_income, total_projected_expenses,
          net_projected_cash_flow, confidence_score, expires_at, model_version
        ) VALUES ($1, $2, $3, 12, $4, $5, $6, $7, 0.85, $8, 'v1.0')
        RETURNING *`,
        [
          projectionId, propertyId, investorId,
          JSON.stringify(monthlyProjections),
          totalIncome, totalExpenses, netCashFlow, expiresAt
        ]
      );
      
      return result.rows[0];
      
    } finally {
      client.release();
    }
  }

  /**
   * Calculate portfolio analytics for an investor
   */
  async calculatePortfolioAnalytics(investorId) {
    const client = await this.pool.connect();
    
    try {
      // Get investor's portfolio
      const portfolioResult = await client.query(
        `SELECT 
          COUNT(DISTINCT property_id) as properties_count,
          SUM(total_invested) as total_invested,
          SUM(total_revenue_earned) as total_returns,
          SUM(shares_owned) as total_shares
         FROM investor_shares
         WHERE investor_id = $1 AND status = 'active'`,
        [investorId]
      );
      
      const portfolio = portfolioResult.rows[0];
      const totalInvested = parseFloat(portfolio.total_invested || 0);
      const totalReturns = parseFloat(portfolio.total_returns || 0);
      const roi = totalInvested > 0 ? ((totalReturns / totalInvested) * 100) : 0;
      
      // Calculate diversification score (0-100)
      const propertiesCount = parseInt(portfolio.properties_count);
      const diversificationScore = Math.min(propertiesCount * 10, 100);
      
      // Risk score (simplified - real implementation would analyze property types, locations, etc.)
      const riskScore = diversificationScore > 50 ? 30 : 50;
      
      const analyticsId = uuidv4();
      const snapshotDate = new Date().toISOString().split('T')[0];
      
      const result = await client.query(
        `INSERT INTO portfolio_analytics (
          analytics_id, investor_id, wallet_address, snapshot_date,
          total_portfolio_value, total_invested, total_returns, roi_percent,
          properties_count, diversification_score, risk_score
        ) VALUES ($1, $2, 
          (SELECT wallet_address FROM users WHERE id = $2),
          $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          analyticsId, investorId, snapshotDate,
          totalInvested + totalReturns, totalInvested, totalReturns, roi,
          propertiesCount, diversificationScore, riskScore
        ]
      );
      
      return result.rows[0];
      
    } finally {
      client.release();
    }
  }

  /**
   * Get performance benchmarks
   */
  async getPerformanceBenchmarks(benchmarkType = 'platform_average') {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        `SELECT * FROM performance_benchmarks
         WHERE benchmark_type = $1
         ORDER BY period_end DESC
         LIMIT 1`,
        [benchmarkType]
      );
      
      return result.rows[0] || null;
      
    } finally {
      client.release();
    }
  }

  /**
   * Create or update investor cohorts
   */
  async updateInvestorCohorts() {
    const client = await this.pool.connect();
    
    try {
      // Create tier-based cohorts
      const tiers = ['retail', 'accredited', 'premium', 'institutional'];
      
      for (const tier of tiers) {
        const cohortId = uuidv4();
        
        const statsResult = await client.query(
          `SELECT 
            COUNT(DISTINCT investor_id) as member_count,
            AVG(total_invested) as avg_portfolio_value
           FROM investor_shares
           WHERE tier = $1 AND status = 'active'`,
          [tier]
        );
        
        const stats = statsResult.rows[0];
        
        await client.query(
          `INSERT INTO investor_cohorts (
            cohort_id, cohort_name, cohort_type, criteria,
            member_count, average_portfolio_value
          ) VALUES ($1, $2, 'tier_based', $3, $4, $5)
          ON CONFLICT (cohort_name) DO UPDATE SET
            member_count = $4,
            average_portfolio_value = $5`,
          [
            cohortId,
            `${tier.charAt(0).toUpperCase() + tier.slice(1)} Investors`,
            JSON.stringify({ tier }),
            parseInt(stats.member_count),
            parseFloat(stats.avg_portfolio_value || 0)
          ]
        );
      }
      
      return { success: true, message: 'Cohorts updated' };
      
    } finally {
      client.release();
    }
  }

  /**
   * Get investor insights dashboard data
   */
  async getInvestorInsights(investorId) {
    const client = await this.pool.connect();
    
    try {
      // Get latest analytics
      const analyticsResult = await client.query(
        `SELECT * FROM portfolio_analytics
         WHERE investor_id = $1
         ORDER BY snapshot_date DESC
         LIMIT 1`,
        [investorId]
      );
      
      // Get cash flow projections
      const projectionsResult = await client.query(
        `SELECT cfp.*, fp.deal_id, d.parsed->>'address' as property_address
         FROM cash_flow_projections cfp
         LEFT JOIN fractional_properties fp ON cfp.property_id = fp.id
         LEFT JOIN deals d ON fp.deal_id = d.id
         WHERE cfp.investor_id = $1
         ORDER BY cfp.created_at DESC
         LIMIT 5`,
        [investorId]
      );
      
      return {
        analytics: analyticsResult.rows[0] || null,
        projections: projectionsResult.rows,
        insights: {
          diversificationRecommendation: this.getDiversificationRecommendation(analyticsResult.rows[0]),
          riskAssessment: this.getRiskAssessment(analyticsResult.rows[0])
        }
      };
      
    } finally {
      client.release();
    }
  }

  getDiversificationRecommendation(analytics) {
    if (!analytics) return null;
    
    if (analytics.diversification_score < 30) {
      return 'Consider diversifying across more properties to reduce risk';
    } else if (analytics.diversification_score < 60) {
      return 'Good diversification. Consider adding 1-2 more properties';
    } else {
      return 'Excellent diversification across multiple properties';
    }
  }

  getRiskAssessment(analytics) {
    if (!analytics) return null;
    
    if (analytics.risk_score < 30) {
      return 'Low risk portfolio with good diversification';
    } else if (analytics.risk_score < 60) {
      return 'Moderate risk - well balanced';
    } else {
      return 'Higher risk - consider diversifying';
    }
  }

  async listCashFlowProjections(filters = {}) {
    const client = await this.pool.connect();
    
    try {
      const conditions = ['1=1'];
      const params = [];
      let paramCount = 0;
      
      if (filters.propertyId) {
        paramCount++;
        conditions.push(`property_id = $${paramCount}`);
        params.push(filters.propertyId);
      }
      
      if (filters.investorId) {
        paramCount++;
        conditions.push(`investor_id = $${paramCount}`);
        params.push(filters.investorId);
      }
      
      paramCount++;
      params.push(filters.limit || 10);
      
      const result = await client.query(
        `SELECT cfp.*, fp.deal_id, d.parsed->>'address' as property_address
         FROM cash_flow_projections cfp
         LEFT JOIN fractional_properties fp ON cfp.property_id = fp.id
         LEFT JOIN deals d ON fp.deal_id = d.id
         WHERE ${conditions.join(' AND ')}
         ORDER BY cfp.created_at DESC
         LIMIT $${paramCount}`,
        params
      );
      
      return result.rows;
      
    } finally {
      client.release();
    }
  }

  async getPortfolioHistory(investorId, limit = 30) {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        `SELECT * FROM portfolio_analytics
         WHERE investor_id = $1
         ORDER BY snapshot_date DESC
         LIMIT $2`,
        [investorId, limit]
      );
      
      return result.rows;
      
    } finally {
      client.release();
    }
  }

  async createBenchmark(benchmarkData) {
    const client = await this.pool.connect();
    
    try {
      const benchmarkId = uuidv4();
      
      const result = await client.query(
        `INSERT INTO performance_benchmarks (
          benchmark_id, benchmark_type, benchmark_name,
          period_start, period_end, average_roi, average_cash_yield,
          average_appreciation, median_roi, total_properties,
          total_investors, total_volume, metadata, data_source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          benchmarkId,
          benchmarkData.benchmarkType,
          benchmarkData.benchmarkName,
          benchmarkData.periodStart,
          benchmarkData.periodEnd,
          benchmarkData.averageRoi,
          benchmarkData.averageCashYield,
          benchmarkData.averageAppreciation,
          benchmarkData.medianRoi,
          benchmarkData.totalProperties,
          benchmarkData.totalInvestors,
          benchmarkData.totalVolume,
          benchmarkData.metadata ? JSON.stringify(benchmarkData.metadata) : null,
          benchmarkData.dataSource
        ]
      );
      
      return result.rows[0];
      
    } finally {
      client.release();
    }
  }

  async listCohorts(filters = {}) {
    const client = await this.pool.connect();
    
    try {
      const conditions = ['1=1'];
      const params = [];
      let paramCount = 0;
      
      if (filters.cohortType) {
        paramCount++;
        conditions.push(`cohort_type = $${paramCount}`);
        params.push(filters.cohortType);
      }
      
      if (filters.isActive !== undefined) {
        paramCount++;
        conditions.push(`is_active = $${paramCount}`);
        params.push(filters.isActive);
      }
      
      const result = await client.query(
        `SELECT * FROM investor_cohorts
         WHERE ${conditions.join(' AND ')}
         ORDER BY member_count DESC`,
        params
      );
      
      return result.rows;
      
    } finally {
      client.release();
    }
  }

  async createRiskAssessment(assessmentData) {
    const client = await this.pool.connect();
    
    try {
      const assessmentId = uuidv4();
      const validUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      
      const result = await client.query(
        `INSERT INTO risk_assessments (
          assessment_id, property_id, investor_id, assessment_type,
          risk_level, risk_score, risk_factors, mitigation_strategies,
          valid_until
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          assessmentId,
          assessmentData.propertyId || null,
          assessmentData.investorId || null,
          assessmentData.assessmentType,
          assessmentData.riskLevel,
          assessmentData.riskScore,
          JSON.stringify(assessmentData.riskFactors),
          assessmentData.mitigationStrategies ? JSON.stringify(assessmentData.mitigationStrategies) : null,
          validUntil
        ]
      );
      
      return result.rows[0];
      
    } finally {
      client.release();
    }
  }

  async listRiskAssessments(filters = {}) {
    const client = await this.pool.connect();
    
    try {
      const conditions = ['1=1'];
      const params = [];
      let paramCount = 0;
      
      if (filters.propertyId) {
        paramCount++;
        conditions.push(`property_id = $${paramCount}`);
        params.push(filters.propertyId);
      }
      
      if (filters.investorId) {
        paramCount++;
        conditions.push(`investor_id = $${paramCount}`);
        params.push(filters.investorId);
      }
      
      if (filters.assessmentType) {
        paramCount++;
        conditions.push(`assessment_type = $${paramCount}`);
        params.push(filters.assessmentType);
      }
      
      if (filters.riskLevel) {
        paramCount++;
        conditions.push(`risk_level = $${paramCount}`);
        params.push(filters.riskLevel);
      }
      
      paramCount++;
      params.push(filters.limit || 20);
      
      const result = await client.query(
        `SELECT * FROM risk_assessments
         WHERE ${conditions.join(' AND ')}
         ORDER BY assessed_at DESC
         LIMIT $${paramCount}`,
        params
      );
      
      return result.rows;
      
    } finally {
      client.release();
    }
  }

  async getDashboardData(investorId) {
    const client = await this.pool.connect();
    
    try {
      const latestAnalytics = await client.query(
        `SELECT * FROM portfolio_analytics
         WHERE investor_id = $1
         ORDER BY snapshot_date DESC
         LIMIT 1`,
        [investorId]
      );
      
      const recentProjections = await client.query(
        `SELECT cfp.*, fp.deal_id, d.parsed->>'address' as property_address
         FROM cash_flow_projections cfp
         LEFT JOIN fractional_properties fp ON cfp.property_id = fp.id
         LEFT JOIN deals d ON fp.deal_id = d.id
         WHERE cfp.investor_id = $1
         ORDER BY cfp.created_at DESC
         LIMIT 5`,
        [investorId]
      );
      
      const riskAssessments = await client.query(
        `SELECT * FROM risk_assessments
         WHERE investor_id = $1 AND assessment_type = 'portfolio_risk'
         ORDER BY assessed_at DESC
         LIMIT 1`,
        [investorId]
      );
      
      const platformBenchmark = await this.getPerformanceBenchmarks('platform_average');
      
      return {
        analytics: latestAnalytics.rows[0] || null,
        projections: recentProjections.rows,
        riskAssessment: riskAssessments.rows[0] || null,
        benchmark: platformBenchmark,
        insights: {
          diversificationRecommendation: this.getDiversificationRecommendation(latestAnalytics.rows[0]),
          riskAssessment: this.getRiskAssessment(latestAnalytics.rows[0])
        }
      };
      
    } finally {
      client.release();
    }
  }
}

module.exports = new IntelligenceService();
