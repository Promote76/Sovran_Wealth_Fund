/**
 * Feature #5: Property Risk Sentinel API
 * Real-time property valuation and risk monitoring system
 */

const express = require('express');
const router = express.Router();
const riskSentinelService = require('../services/riskSentinelService');

// =====================================================
// PROPERTY VALUATIONS ENDPOINTS
// =====================================================

/**
 * Create a new property valuation
 * POST /api/risk-sentinel/valuations
 */
router.post('/valuations', async (req, res) => {
  try {
    const { property_id, valuation_type, estimated_value, value_low, value_high, confidence_score, data_source, provider_response } = req.body;
    
    if (!property_id || !valuation_type || !estimated_value) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['property_id', 'valuation_type', 'estimated_value']
      });
    }

    const valuation = await riskSentinelService.createPropertyValuation({
      property_id,
      valuation_type,
      estimated_value,
      value_low,
      value_high,
      confidence_score,
      data_source,
      provider_response
    });

    res.status(201).json({ 
      success: true,
      valuation
    });
  } catch (error) {
    console.error('Error creating property valuation:', error);
    res.status(500).json({ error: 'Failed to create property valuation', details: error.message });
  }
});

/**
 * Get valuations for a property
 * GET /api/risk-sentinel/valuations/:propertyId
 */
router.get('/valuations/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const valuations = await riskSentinelService.getPropertyValuations(propertyId, { limit, offset });

    res.json({ 
      success: true,
      count: valuations.length,
      valuations
    });
  } catch (error) {
    console.error('Error fetching property valuations:', error);
    res.status(500).json({ error: 'Failed to fetch property valuations', details: error.message });
  }
});

/**
 * Get latest valuation for a property
 * GET /api/risk-sentinel/valuations/:propertyId/latest
 */
router.get('/valuations/:propertyId/latest', async (req, res) => {
  try {
    const { propertyId } = req.params;

    const valuation = await riskSentinelService.getLatestValuation(propertyId);

    if (!valuation) {
      return res.status(404).json({ error: 'No valuation found for this property' });
    }

    res.json({ 
      success: true,
      valuation
    });
  } catch (error) {
    console.error('Error fetching latest valuation:', error);
    res.status(500).json({ error: 'Failed to fetch latest valuation', details: error.message });
  }
});

/**
 * Get valuation history with trend analysis
 * GET /api/risk-sentinel/valuations/:propertyId/history
 */
router.get('/valuations/:propertyId/history', async (req, res) => {
  try {
    const { propertyId } = req.params;

    const history = await riskSentinelService.getValuationHistory(propertyId);

    res.json({ 
      success: true,
      count: history.valuations.length,
      trend: history.trend,
      valuations: history.valuations
    });
  } catch (error) {
    console.error('Error fetching valuation history:', error);
    res.status(500).json({ error: 'Failed to fetch valuation history', details: error.message });
  }
});

// =====================================================
// RISK MONITORING ENDPOINTS
// =====================================================

/**
 * Create a risk monitoring event
 * POST /api/risk-sentinel/risks
 */
router.post('/risks', async (req, res) => {
  try {
    const { property_id, event_type, severity, risk_score, description, source, source_data, impact_assessment } = req.body;
    
    if (!property_id || !event_type || !severity || !description) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['property_id', 'event_type', 'severity', 'description']
      });
    }

    const riskEvent = await riskSentinelService.createRiskEvent({
      property_id,
      event_type,
      severity,
      risk_score,
      description,
      source,
      source_data,
      impact_assessment
    });

    res.status(201).json({ 
      success: true,
      riskEvent
    });
  } catch (error) {
    console.error('Error creating risk event:', error);
    res.status(500).json({ error: 'Failed to create risk event', details: error.message });
  }
});

/**
 * Get risk events for a property
 * GET /api/risk-sentinel/risks/:propertyId
 */
router.get('/risks/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { status, severity, limit = 20, offset = 0 } = req.query;

    const risks = await riskSentinelService.getPropertyRisks(propertyId, { status, severity, limit, offset });

    res.json({ 
      success: true,
      count: risks.length,
      risks
    });
  } catch (error) {
    console.error('Error fetching property risks:', error);
    res.status(500).json({ error: 'Failed to fetch property risks', details: error.message });
  }
});

/**
 * Get active risk events across all properties
 * GET /api/risk-sentinel/risks
 */
router.get('/risks', async (req, res) => {
  try {
    const { severity, status = 'active', limit = 50, offset = 0 } = req.query;

    const risks = await riskSentinelService.getAllActiveRisks({ severity, status, limit, offset });

    res.json({ 
      success: true,
      count: risks.length,
      risks
    });
  } catch (error) {
    console.error('Error fetching active risks:', error);
    res.status(500).json({ error: 'Failed to fetch active risks', details: error.message });
  }
});

/**
 * Update risk event status
 * PUT /api/risk-sentinel/risks/:eventId/status
 */
router.put('/risks/:eventId/status', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status, resolution_notes } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const updatedEvent = await riskSentinelService.updateRiskStatus(eventId, status, resolution_notes);

    res.json({ 
      success: true,
      riskEvent: updatedEvent
    });
  } catch (error) {
    console.error('Error updating risk status:', error);
    res.status(500).json({ error: 'Failed to update risk status', details: error.message });
  }
});

// =====================================================
// MARKET CONDITIONS ENDPOINTS
// =====================================================

/**
 * Create market condition snapshot
 * POST /api/risk-sentinel/market
 */
router.post('/market', async (req, res) => {
  try {
    const { geographic_area, property_type, period_start, period_end, market_data } = req.body;
    
    if (!geographic_area || !period_start || !period_end) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['geographic_area', 'period_start', 'period_end']
      });
    }

    const marketCondition = await riskSentinelService.createMarketCondition({
      geographic_area,
      property_type,
      period_start,
      period_end,
      ...market_data
    });

    res.status(201).json({ 
      success: true,
      marketCondition
    });
  } catch (error) {
    console.error('Error creating market condition:', error);
    res.status(500).json({ error: 'Failed to create market condition', details: error.message });
  }
});

/**
 * Get market conditions for an area
 * GET /api/risk-sentinel/market/:area
 */
router.get('/market/:area', async (req, res) => {
  try {
    const { area } = req.params;
    const { limit = 12, offset = 0 } = req.query;

    const conditions = await riskSentinelService.getMarketConditions(area, { limit, offset });

    res.json({ 
      success: true,
      count: conditions.length,
      area,
      conditions
    });
  } catch (error) {
    console.error('Error fetching market conditions:', error);
    res.status(500).json({ error: 'Failed to fetch market conditions', details: error.message });
  }
});

/**
 * Get latest market trend for an area
 * GET /api/risk-sentinel/market/:area/trend
 */
router.get('/market/:area/trend', async (req, res) => {
  try {
    const { area } = req.params;

    const trend = await riskSentinelService.getMarketTrend(area);

    res.json({ 
      success: true,
      area,
      trend
    });
  } catch (error) {
    console.error('Error fetching market trend:', error);
    res.status(500).json({ error: 'Failed to fetch market trend', details: error.message });
  }
});

// =====================================================
// PROPERTY ALERTS ENDPOINTS
// =====================================================

/**
 * Create a property alert
 * POST /api/risk-sentinel/alerts
 */
router.post('/alerts', async (req, res) => {
  try {
    const { property_id, alert_type, severity, title, message, current_value, threshold_value, recommended_action } = req.body;
    
    if (!property_id || !alert_type || !severity || !title || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['property_id', 'alert_type', 'severity', 'title', 'message']
      });
    }

    const alert = await riskSentinelService.createAlert({
      property_id,
      alert_type,
      severity,
      title,
      message,
      current_value,
      threshold_value,
      recommended_action
    });

    res.status(201).json({ 
      success: true,
      alert
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ error: 'Failed to create alert', details: error.message });
  }
});

/**
 * Get alerts for a property
 * GET /api/risk-sentinel/alerts/:propertyId
 */
router.get('/alerts/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { status, severity, limit = 20, offset = 0 } = req.query;

    const alerts = await riskSentinelService.getPropertyAlerts(propertyId, { status, severity, limit, offset });

    res.json({ 
      success: true,
      count: alerts.length,
      alerts
    });
  } catch (error) {
    console.error('Error fetching property alerts:', error);
    res.status(500).json({ error: 'Failed to fetch property alerts', details: error.message });
  }
});

/**
 * Get all active alerts
 * GET /api/risk-sentinel/alerts
 */
router.get('/alerts', async (req, res) => {
  try {
    const { status = 'new', severity, limit = 50, offset = 0 } = req.query;

    const alerts = await riskSentinelService.getAllAlerts({ status, severity, limit, offset });

    res.json({ 
      success: true,
      count: alerts.length,
      alerts
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts', details: error.message });
  }
});

/**
 * Acknowledge an alert
 * PUT /api/risk-sentinel/alerts/:alertId/acknowledge
 */
router.put('/alerts/:alertId/acknowledge', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { user_id } = req.body;

    const alert = await riskSentinelService.acknowledgeAlert(alertId, user_id);

    res.json({ 
      success: true,
      alert
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert', details: error.message });
  }
});

/**
 * Resolve an alert
 * PUT /api/risk-sentinel/alerts/:alertId/resolve
 */
router.put('/alerts/:alertId/resolve', async (req, res) => {
  try {
    const { alertId } = req.params;

    const alert = await riskSentinelService.resolveAlert(alertId);

    res.json({ 
      success: true,
      alert
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ error: 'Failed to resolve alert', details: error.message });
  }
});

// =====================================================
// ENVIRONMENTAL RISKS ENDPOINTS
// =====================================================

/**
 * Create environmental risk assessment
 * POST /api/risk-sentinel/environmental
 */
router.post('/environmental', async (req, res) => {
  try {
    const { property_id, risk_category, risk_level, probability_score, impact_score, fema_zone, insurance_required, estimated_annual_loss, data_provider } = req.body;
    
    if (!property_id || !risk_category || !risk_level) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['property_id', 'risk_category', 'risk_level']
      });
    }

    const envRisk = await riskSentinelService.createEnvironmentalRisk({
      property_id,
      risk_category,
      risk_level,
      probability_score,
      impact_score,
      fema_zone,
      insurance_required,
      estimated_annual_loss,
      data_provider
    });

    res.status(201).json({ 
      success: true,
      environmentalRisk: envRisk
    });
  } catch (error) {
    console.error('Error creating environmental risk:', error);
    res.status(500).json({ error: 'Failed to create environmental risk', details: error.message });
  }
});

/**
 * Get environmental risks for a property
 * GET /api/risk-sentinel/environmental/:propertyId
 */
router.get('/environmental/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;

    const risks = await riskSentinelService.getEnvironmentalRisks(propertyId);

    res.json({ 
      success: true,
      count: risks.length,
      risks
    });
  } catch (error) {
    console.error('Error fetching environmental risks:', error);
    res.status(500).json({ error: 'Failed to fetch environmental risks', details: error.message });
  }
});

/**
 * Get environmental risk summary
 * GET /api/risk-sentinel/environmental/:propertyId/summary
 */
router.get('/environmental/:propertyId/summary', async (req, res) => {
  try {
    const { propertyId } = req.params;

    const summary = await riskSentinelService.getEnvironmentalRiskSummary(propertyId);

    res.json({ 
      success: true,
      summary
    });
  } catch (error) {
    console.error('Error fetching environmental risk summary:', error);
    res.status(500).json({ error: 'Failed to fetch environmental risk summary', details: error.message });
  }
});

// =====================================================
// MONITORING SCHEDULES ENDPOINTS
// =====================================================

/**
 * Create monitoring schedule
 * POST /api/risk-sentinel/schedules
 */
router.post('/schedules', async (req, res) => {
  try {
    const { property_id, monitor_type, frequency, configuration } = req.body;
    
    if (!property_id || !monitor_type || !frequency) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['property_id', 'monitor_type', 'frequency']
      });
    }

    const schedule = await riskSentinelService.createMonitoringSchedule({
      property_id,
      monitor_type,
      frequency,
      configuration
    });

    res.status(201).json({ 
      success: true,
      schedule
    });
  } catch (error) {
    console.error('Error creating monitoring schedule:', error);
    res.status(500).json({ error: 'Failed to create monitoring schedule', details: error.message });
  }
});

/**
 * Get monitoring schedules for a property
 * GET /api/risk-sentinel/schedules/:propertyId
 */
router.get('/schedules/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;

    const schedules = await riskSentinelService.getMonitoringSchedules(propertyId);

    res.json({ 
      success: true,
      count: schedules.length,
      schedules
    });
  } catch (error) {
    console.error('Error fetching monitoring schedules:', error);
    res.status(500).json({ error: 'Failed to fetch monitoring schedules', details: error.message });
  }
});

/**
 * Update monitoring schedule
 * PUT /api/risk-sentinel/schedules/:scheduleId
 */
router.put('/schedules/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { is_active, frequency, configuration } = req.body;

    const schedule = await riskSentinelService.updateMonitoringSchedule(scheduleId, {
      is_active,
      frequency,
      configuration
    });

    res.json({ 
      success: true,
      schedule
    });
  } catch (error) {
    console.error('Error updating monitoring schedule:', error);
    res.status(500).json({ error: 'Failed to update monitoring schedule', details: error.message });
  }
});

// =====================================================
// DASHBOARD & ANALYTICS ENDPOINTS
// =====================================================

/**
 * Get comprehensive risk dashboard for a property
 * GET /api/risk-sentinel/dashboard/:propertyId
 */
router.get('/dashboard/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;

    const dashboard = await riskSentinelService.getPropertyDashboard(propertyId);

    res.json({ 
      success: true,
      dashboard
    });
  } catch (error) {
    console.error('Error fetching risk dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch risk dashboard', details: error.message });
  }
});

/**
 * Get portfolio-wide risk metrics
 * GET /api/risk-sentinel/portfolio/metrics
 */
router.get('/portfolio/metrics', async (req, res) => {
  try {
    const metrics = await riskSentinelService.getPortfolioMetrics();

    res.json({ 
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Error fetching portfolio metrics:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio metrics', details: error.message });
  }
});

module.exports = router;
