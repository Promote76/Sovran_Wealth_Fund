/**
 * Feature #3: Investor Intelligence Suite API Routes
 * REST API endpoints for predictive analytics and investor insights
 */

const express = require('express');
const router = express.Router();
const intelligenceService = require('../services/intelligenceService');

router.post('/projections/generate', async (req, res) => {
  try {
    const { propertyId, investorId } = req.body;
    
    if (!propertyId) {
      return res.status(400).json({
        success: false,
        error: 'Property ID is required'
      });
    }
    
    const projection = await intelligenceService.generateCashFlowProjection(
      propertyId,
      investorId || null
    );
    
    res.json({
      success: true,
      projection
    });
  } catch (error) {
    console.error('Error generating cash flow projection:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/projections/list', async (req, res) => {
  try {
    const { propertyId, investorId, limit = 10 } = req.query;
    
    const projections = await intelligenceService.listCashFlowProjections({
      propertyId: propertyId ? parseInt(propertyId) : null,
      investorId: investorId ? parseInt(investorId) : null,
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      projections
    });
  } catch (error) {
    console.error('Error listing projections:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/analytics/calculate', async (req, res) => {
  try {
    const { investorId } = req.body;
    
    if (!investorId) {
      return res.status(400).json({
        success: false,
        error: 'Investor ID is required'
      });
    }
    
    const analytics = await intelligenceService.calculatePortfolioAnalytics(investorId);
    
    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Error calculating portfolio analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/analytics/history/:investorId', async (req, res) => {
  try {
    const { investorId } = req.params;
    const { limit = 30 } = req.query;
    
    const history = await intelligenceService.getPortfolioHistory(
      parseInt(investorId),
      parseInt(limit)
    );
    
    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Error fetching analytics history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/benchmarks/:benchmarkType', async (req, res) => {
  try {
    const { benchmarkType } = req.params;
    
    const validTypes = ['reit_index', 'property_type', 'geographic', 'tier_cohort', 'platform_average'];
    if (!validTypes.includes(benchmarkType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid benchmark type. Must be one of: ${validTypes.join(', ')}`
      });
    }
    
    const benchmark = await intelligenceService.getPerformanceBenchmarks(benchmarkType);
    
    res.json({
      success: true,
      benchmark
    });
  } catch (error) {
    console.error('Error fetching benchmarks:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/benchmarks/create', async (req, res) => {
  try {
    const {
      benchmarkType,
      benchmarkName,
      periodStart,
      periodEnd,
      averageRoi,
      averageCashYield,
      averageAppreciation,
      medianRoi,
      totalProperties,
      totalInvestors,
      totalVolume,
      metadata,
      dataSource
    } = req.body;
    
    if (!benchmarkType || !benchmarkName || !periodStart || !periodEnd) {
      return res.status(400).json({
        success: false,
        error: 'Benchmark type, name, period start, and period end are required'
      });
    }
    
    const benchmark = await intelligenceService.createBenchmark({
      benchmarkType,
      benchmarkName,
      periodStart,
      periodEnd,
      averageRoi,
      averageCashYield,
      averageAppreciation,
      medianRoi,
      totalProperties,
      totalInvestors,
      totalVolume,
      metadata,
      dataSource
    });
    
    res.json({
      success: true,
      benchmark
    });
  } catch (error) {
    console.error('Error creating benchmark:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/cohorts/list', async (req, res) => {
  try {
    const { cohortType, isActive } = req.query;
    
    const cohorts = await intelligenceService.listCohorts({
      cohortType: cohortType || null,
      isActive: isActive === 'true'
    });
    
    res.json({
      success: true,
      cohorts
    });
  } catch (error) {
    console.error('Error listing cohorts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/cohorts/update', async (req, res) => {
  try {
    const result = await intelligenceService.updateInvestorCohorts();
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error updating cohorts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/insights/:investorId', async (req, res) => {
  try {
    const { investorId } = req.params;
    
    const insights = await intelligenceService.getInvestorInsights(parseInt(investorId));
    
    res.json({
      success: true,
      insights
    });
  } catch (error) {
    console.error('Error fetching investor insights:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/risk/assess', async (req, res) => {
  try {
    const {
      assessmentType,
      propertyId,
      investorId,
      riskLevel,
      riskScore,
      riskFactors,
      mitigationStrategies
    } = req.body;
    
    if (!assessmentType || !riskLevel || !riskScore || !riskFactors) {
      return res.status(400).json({
        success: false,
        error: 'Assessment type, risk level, risk score, and risk factors are required'
      });
    }
    
    const assessment = await intelligenceService.createRiskAssessment({
      assessmentType,
      propertyId,
      investorId,
      riskLevel,
      riskScore,
      riskFactors,
      mitigationStrategies
    });
    
    res.json({
      success: true,
      assessment
    });
  } catch (error) {
    console.error('Error creating risk assessment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/risk/list', async (req, res) => {
  try {
    const { propertyId, investorId, assessmentType, riskLevel, limit = 20 } = req.query;
    
    const assessments = await intelligenceService.listRiskAssessments({
      propertyId: propertyId ? parseInt(propertyId) : null,
      investorId: investorId ? parseInt(investorId) : null,
      assessmentType: assessmentType || null,
      riskLevel: riskLevel || null,
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      assessments
    });
  } catch (error) {
    console.error('Error listing risk assessments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/dashboard/:investorId', async (req, res) => {
  try {
    const { investorId } = req.params;
    
    const dashboard = await intelligenceService.getDashboardData(parseInt(investorId));
    
    res.json({
      success: true,
      dashboard
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
