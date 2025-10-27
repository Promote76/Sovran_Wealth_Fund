/**
 * Feature #5: Property Risk Sentinel Service
 * Real-time property valuation and risk monitoring
 */

const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

class RiskSentinelService {
  constructor() {
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }

  // =====================================================
  // PROPERTY VALUATIONS
  // =====================================================

  async createPropertyValuation(data) {
    const client = await this.pool.connect();
    try {
      const valuationId = uuidv4();
      
      // Get previous valuation for change calculation
      const prevResult = await client.query(
        `SELECT estimated_value, id FROM property_valuations 
         WHERE property_id = $1 
         ORDER BY valuation_date DESC, created_at DESC 
         LIMIT 1`,
        [data.property_id]
      );

      let valueChangeAmount = null;
      let valueChangePercent = null;
      let previousValuationId = null;

      if (prevResult.rows.length > 0) {
        const prevValue = parseFloat(prevResult.rows[0].estimated_value);
        const newValue = parseFloat(data.estimated_value);
        valueChangeAmount = newValue - prevValue;
        valueChangePercent = ((newValue - prevValue) / prevValue) * 100;
        previousValuationId = prevResult.rows[0].id;
      }

      const result = await client.query(
        `INSERT INTO property_valuations (
          valuation_id, property_id, valuation_date, valuation_type,
          estimated_value, value_low, value_high, confidence_score,
          data_source, provider_response, comparable_properties,
          valuation_factors, previous_valuation_id, value_change_amount,
          value_change_percent
        ) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          valuationId, data.property_id, data.valuation_type,
          data.estimated_value, data.value_low, data.value_high,
          data.confidence_score || 0.75, data.data_source || 'system',
          data.provider_response, data.comparable_properties,
          data.valuation_factors, previousValuationId,
          valueChangeAmount, valueChangePercent
        ]
      );
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getPropertyValuations(propertyId, filters = {}) {
    const client = await this.pool.connect();
    try {
      const limit = parseInt(filters.limit) || 10;
      const offset = parseInt(filters.offset) || 0;

      const result = await client.query(
        `SELECT * FROM property_valuations 
         WHERE property_id = $1 
         ORDER BY valuation_date DESC, created_at DESC 
         LIMIT $2 OFFSET $3`,
        [propertyId, limit, offset]
      );
      
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getLatestValuation(propertyId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM property_valuations 
         WHERE property_id = $1 
         ORDER BY valuation_date DESC, created_at DESC 
         LIMIT 1`,
        [propertyId]
      );
      
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async getValuationHistory(propertyId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM property_valuations 
         WHERE property_id = $1 
         ORDER BY valuation_date ASC`,
        [propertyId]
      );

      const valuations = result.rows;
      
      // Calculate trend
      let trend = 'stable';
      if (valuations.length >= 2) {
        const latest = valuations[valuations.length - 1];
        if (latest.value_change_percent) {
          if (latest.value_change_percent > 5) trend = 'increasing';
          else if (latest.value_change_percent < -5) trend = 'decreasing';
        }
      }
      
      return { valuations, trend };
    } finally {
      client.release();
    }
  }

  // =====================================================
  // RISK MONITORING
  // =====================================================

  async createRiskEvent(data) {
    const client = await this.pool.connect();
    try {
      const eventId = uuidv4();
      
      const result = await client.query(
        `INSERT INTO risk_monitoring_events (
          event_id, property_id, event_type, severity, risk_score,
          description, source, source_data, impact_assessment,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
        RETURNING *`,
        [
          eventId, data.property_id, data.event_type, data.severity,
          data.risk_score, data.description, data.source,
          data.source_data, data.impact_assessment
        ]
      );
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getPropertyRisks(propertyId, filters = {}) {
    const client = await this.pool.connect();
    try {
      let query = `SELECT * FROM risk_monitoring_events WHERE property_id = $1`;
      const params = [propertyId];
      let paramIndex = 2;

      if (filters.status) {
        query += ` AND status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }

      if (filters.severity) {
        query += ` AND severity = $${paramIndex}`;
        params.push(filters.severity);
        paramIndex++;
      }

      query += ` ORDER BY detected_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(filters.limit) || 20, parseInt(filters.offset) || 0);

      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getAllActiveRisks(filters = {}) {
    const client = await this.pool.connect();
    try {
      let query = `SELECT r.*, p.address, p.city, p.state 
                   FROM risk_monitoring_events r
                   LEFT JOIN fractional_properties p ON r.property_id = p.id
                   WHERE r.status = $1`;
      const params = [filters.status || 'active'];
      let paramIndex = 2;

      if (filters.severity) {
        query += ` AND r.severity = $${paramIndex}`;
        params.push(filters.severity);
        paramIndex++;
      }

      query += ` ORDER BY r.detected_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(filters.limit) || 50, parseInt(filters.offset) || 0);

      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async updateRiskStatus(eventId, status, resolutionNotes) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `UPDATE risk_monitoring_events 
         SET status = $1, resolution_notes = $2,
             resolved_at = CASE WHEN $1 IN ('mitigated', 'resolved', 'false_alarm') 
                               THEN NOW() ELSE NULL END
         WHERE event_id = $3
         RETURNING *`,
        [status, resolutionNotes, eventId]
      );
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // =====================================================
  // MARKET CONDITIONS
  // =====================================================

  async createMarketCondition(data) {
    const client = await this.pool.connect();
    try {
      const conditionId = uuidv4();
      
      const result = await client.query(
        `INSERT INTO market_conditions (
          condition_id, geographic_area, property_type, period_start,
          period_end, median_sale_price, median_rent, inventory_count,
          days_on_market, sale_to_list_ratio, price_trend,
          price_change_percent, rent_yield_percent, vacancy_rate,
          absorption_rate, market_temperature, data_source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *`,
        [
          conditionId, data.geographic_area, data.property_type,
          data.period_start, data.period_end, data.median_sale_price,
          data.median_rent, data.inventory_count, data.days_on_market,
          data.sale_to_list_ratio, data.price_trend, data.price_change_percent,
          data.rent_yield_percent, data.vacancy_rate, data.absorption_rate,
          data.market_temperature, data.data_source
        ]
      );
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getMarketConditions(area, filters = {}) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM market_conditions 
         WHERE geographic_area = $1 
         ORDER BY period_start DESC 
         LIMIT $2 OFFSET $3`,
        [area, parseInt(filters.limit) || 12, parseInt(filters.offset) || 0]
      );
      
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getMarketTrend(area) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM market_conditions 
         WHERE geographic_area = $1 
         ORDER BY period_start DESC 
         LIMIT 6`,
        [area]
      );

      const conditions = result.rows;
      
      return {
        current: conditions[0] || null,
        historical: conditions,
        trend: conditions[0]?.price_trend || 'unknown',
        priceChange: conditions[0]?.price_change_percent || 0
      };
    } finally {
      client.release();
    }
  }

  // =====================================================
  // PROPERTY ALERTS
  // =====================================================

  async createAlert(data) {
    const client = await this.pool.connect();
    try {
      const alertId = uuidv4();
      
      const result = await client.query(
        `INSERT INTO property_alerts (
          alert_id, property_id, alert_type, severity, title,
          message, current_value, threshold_value, recommended_action,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'new')
        RETURNING *`,
        [
          alertId, data.property_id, data.alert_type, data.severity,
          data.title, data.message, data.current_value, data.threshold_value,
          data.recommended_action
        ]
      );
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getPropertyAlerts(propertyId, filters = {}) {
    const client = await this.pool.connect();
    try {
      let query = `SELECT * FROM property_alerts WHERE property_id = $1`;
      const params = [propertyId];
      let paramIndex = 2;

      if (filters.status) {
        query += ` AND status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }

      if (filters.severity) {
        query += ` AND severity = $${paramIndex}`;
        params.push(filters.severity);
        paramIndex++;
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(filters.limit) || 20, parseInt(filters.offset) || 0);

      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getAllAlerts(filters = {}) {
    const client = await this.pool.connect();
    try {
      let query = `SELECT a.*, p.address, p.city, p.state 
                   FROM property_alerts a
                   LEFT JOIN fractional_properties p ON a.property_id = p.id
                   WHERE a.status = $1`;
      const params = [filters.status || 'new'];
      let paramIndex = 2;

      if (filters.severity) {
        query += ` AND a.severity = $${paramIndex}`;
        params.push(filters.severity);
        paramIndex++;
      }

      query += ` ORDER BY a.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(filters.limit) || 50, parseInt(filters.offset) || 0);

      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async acknowledgeAlert(alertId, userId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `UPDATE property_alerts 
         SET status = 'acknowledged', acknowledged_by = $1, acknowledged_at = NOW()
         WHERE alert_id = $2
         RETURNING *`,
        [userId, alertId]
      );
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async resolveAlert(alertId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `UPDATE property_alerts 
         SET status = 'resolved', resolved_at = NOW()
         WHERE alert_id = $1
         RETURNING *`,
        [alertId]
      );
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // =====================================================
  // ENVIRONMENTAL RISKS
  // =====================================================

  async createEnvironmentalRisk(data) {
    const client = await this.pool.connect();
    try {
      const riskId = uuidv4();
      
      // Calculate next assessment date based on risk level
      const nextAssessmentMonths = {
        'minimal': 12,
        'low': 12,
        'moderate': 6,
        'high': 3,
        'extreme': 1
      };
      
      const result = await client.query(
        `INSERT INTO environmental_risks (
          risk_id, property_id, risk_category, risk_level,
          probability_score, impact_score, fema_zone, insurance_required,
          estimated_annual_loss, data_provider, next_assessment_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW() + INTERVAL '${nextAssessmentMonths[data.risk_level] || 12} months')
        RETURNING *`,
        [
          riskId, data.property_id, data.risk_category, data.risk_level,
          data.probability_score, data.impact_score, data.fema_zone,
          data.insurance_required, data.estimated_annual_loss, data.data_provider
        ]
      );
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getEnvironmentalRisks(propertyId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM environmental_risks 
         WHERE property_id = $1 
         ORDER BY risk_level DESC, last_assessed_at DESC`,
        [propertyId]
      );
      
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getEnvironmentalRiskSummary(propertyId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT 
          risk_level,
          COUNT(*) as count,
          AVG(probability_score) as avg_probability,
          AVG(impact_score) as avg_impact,
          SUM(estimated_annual_loss) as total_annual_loss
         FROM environmental_risks 
         WHERE property_id = $1 
         GROUP BY risk_level`,
        [propertyId]
      );
      
      return {
        byLevel: result.rows,
        highestRisk: result.rows.find(r => r.risk_level === 'extreme' || r.risk_level === 'high')
      };
    } finally {
      client.release();
    }
  }

  // =====================================================
  // MONITORING SCHEDULES
  // =====================================================

  async createMonitoringSchedule(data) {
    const client = await this.pool.connect();
    try {
      const scheduleId = uuidv4();
      
      // Calculate next run time based on frequency
      const intervals = {
        'daily': '1 day',
        'weekly': '7 days',
        'monthly': '1 month',
        'quarterly': '3 months',
        'annual': '1 year'
      };
      
      const result = await client.query(
        `INSERT INTO monitoring_schedules (
          schedule_id, property_id, monitor_type, frequency,
          next_run_at, is_active, configuration
        ) VALUES ($1, $2, $3, $4, NOW() + INTERVAL '${intervals[data.frequency]}', true, $5)
        RETURNING *`,
        [scheduleId, data.property_id, data.monitor_type, data.frequency, data.configuration]
      );
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getMonitoringSchedules(propertyId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM monitoring_schedules 
         WHERE property_id = $1 
         ORDER BY next_run_at ASC`,
        [propertyId]
      );
      
      return result.rows;
    } finally {
      client.release();
    }
  }

  async updateMonitoringSchedule(scheduleId, updates) {
    const client = await this.pool.connect();
    try {
      const setClauses = [];
      const params = [];
      let paramIndex = 1;

      if (updates.is_active !== undefined) {
        setClauses.push(`is_active = $${paramIndex}`);
        params.push(updates.is_active);
        paramIndex++;
      }

      if (updates.frequency) {
        setClauses.push(`frequency = $${paramIndex}`);
        params.push(updates.frequency);
        paramIndex++;
      }

      if (updates.configuration) {
        setClauses.push(`configuration = $${paramIndex}`);
        params.push(updates.configuration);
        paramIndex++;
      }

      params.push(scheduleId);

      const result = await client.query(
        `UPDATE monitoring_schedules 
         SET ${setClauses.join(', ')}
         WHERE schedule_id = $${paramIndex}
         RETURNING *`,
        params
      );
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // =====================================================
  // DASHBOARD & ANALYTICS
  // =====================================================

  async getPropertyDashboard(propertyId) {
    const client = await this.pool.connect();
    try {
      // Get latest valuation
      const valuationResult = await client.query(
        `SELECT * FROM property_valuations 
         WHERE property_id = $1 
         ORDER BY valuation_date DESC LIMIT 1`,
        [propertyId]
      );

      // Get active risks
      const risksResult = await client.query(
        `SELECT severity, COUNT(*) as count 
         FROM risk_monitoring_events 
         WHERE property_id = $1 AND status = 'active'
         GROUP BY severity`,
        [propertyId]
      );

      // Get recent alerts
      const alertsResult = await client.query(
        `SELECT * FROM property_alerts 
         WHERE property_id = $1 AND status IN ('new', 'sent')
         ORDER BY created_at DESC LIMIT 5`,
        [propertyId]
      );

      // Get environmental risks
      const envRisksResult = await client.query(
        `SELECT risk_category, risk_level 
         FROM environmental_risks 
         WHERE property_id = $1`,
        [propertyId]
      );

      return {
        currentValuation: valuationResult.rows[0] || null,
        activeRisks: risksResult.rows,
        recentAlerts: alertsResult.rows,
        environmentalRisks: envRisksResult.rows
      };
    } finally {
      client.release();
    }
  }

  async getPortfolioMetrics() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          COUNT(DISTINCT p.id) as total_properties,
          COUNT(DISTINCT r.id) as active_risk_events,
          COUNT(DISTINCT a.id) as pending_alerts,
          AVG(v.estimated_value) as avg_property_value
        FROM fractional_properties p
        LEFT JOIN risk_monitoring_events r ON p.id = r.property_id AND r.status = 'active'
        LEFT JOIN property_alerts a ON p.id = a.property_id AND a.status IN ('new', 'sent')
        LEFT JOIN LATERAL (
          SELECT estimated_value 
          FROM property_valuations 
          WHERE property_id = p.id 
          ORDER BY valuation_date DESC 
          LIMIT 1
        ) v ON true
      `);
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Legacy methods for backward compatibility
  async monitorPropertyRisks(propertyId) {
    return this.getEnvironmentalRisks(propertyId);
  }

  async createRiskAlert(propertyId, alertType, severity, message) {
    return this.createAlert({
      property_id: propertyId,
      alert_type: alertType,
      severity,
      title: `Risk Alert: ${alertType}`,
      message
    });
  }
}

module.exports = new RiskSentinelService();
