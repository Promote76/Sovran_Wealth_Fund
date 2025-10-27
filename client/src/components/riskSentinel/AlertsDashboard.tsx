import React, { useState, useEffect } from 'react';

interface Alert {
  id: number;
  alert_id: string;
  property_id: number;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  status: string;
  created_at: string;
  address?: string;
  city?: string;
  state?: string;
}

interface AlertsDashboardProps {
  propertyId?: number;
}

const AlertsDashboard: React.FC<AlertsDashboardProps> = ({ propertyId }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({ status: 'new', severity: 'all' });

  useEffect(() => {
    fetchAlerts();
  }, [propertyId, filter]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const endpoint = propertyId 
        ? `/api/risk-sentinel/alerts/${propertyId}?status=${filter.status}`
        : `/api/risk-sentinel/alerts?status=${filter.status}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch alerts');
      
      const data = await response.json();
      setAlerts(data.alerts || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/risk-sentinel/alerts/${alertId}/acknowledge`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 1 }) // TODO: Get from auth context
      });
      
      if (!response.ok) throw new Error('Failed to acknowledge alert');
      fetchAlerts();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/risk-sentinel/alerts/${alertId}/resolve`, {
        method: 'PUT'
      });
      
      if (!response.ok) throw new Error('Failed to resolve alert');
      fetchAlerts();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const getSeverityConfig = (severity: string) => {
    const configs: Record<string, { bg: string; text: string; icon: string }> = {
      info: { bg: 'bg-blue-100', text: 'text-blue-800', icon: 'ℹ️' },
      warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⚠️' },
      critical: { bg: 'bg-orange-100', text: 'text-orange-800', icon: '🚨' },
      urgent: { bg: 'bg-red-100', text: 'text-red-800', icon: '🔴' }
    };
    return configs[severity] || configs.info;
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      value_drop: '📉',
      value_spike: '📈',
      risk_increase: '⚠️',
      market_change: '🔄',
      maintenance_needed: '🔧',
      insurance_claim: '📋',
      tenant_issue: '🏠',
      compliance: '⚖️'
    };
    return icons[type] || '📢';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Error loading alerts: {error}</p>
        <button 
          onClick={fetchAlerts}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          🔔 Alerts Dashboard
        </h2>
        <div className="flex gap-3">
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="new">New</option>
            <option value="sent">Sent</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['info', 'warning', 'critical', 'urgent'].map(severity => {
          const count = alerts.filter(a => a.severity === severity).length;
          const config = getSeverityConfig(severity);
          return (
            <div key={severity} className={`${config.bg} ${config.text} rounded-lg p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium uppercase">{severity}</div>
                  <div className="text-3xl font-bold mt-2">{count}</div>
                </div>
                <div className="text-3xl">{config.icon}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {filter.status.charAt(0).toUpperCase() + filter.status.slice(1)} Alerts ({alerts.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {alerts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              ✅ No {filter.status} alerts at this time
            </div>
          ) : (
            alerts.map(alert => {
              const severityConfig = getSeverityConfig(alert.severity);
              return (
                <div key={alert.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getTypeIcon(alert.alert_type)}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${severityConfig.bg} ${severityConfig.text}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500 uppercase">
                          {alert.alert_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">{alert.title}</h4>
                      <p className="text-gray-700 mb-3">{alert.message}</p>
                      
                      {alert.address && (
                        <p className="text-sm text-gray-600 mb-3">
                          📍 Property: {alert.address}, {alert.city}, {alert.state}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>📅 {new Date(alert.created_at).toLocaleDateString()}</span>
                        <span>🕐 {new Date(alert.created_at).toLocaleTimeString()}</span>
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                          Status: {alert.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      {alert.status === 'new' && (
                        <button
                          onClick={() => acknowledgeAlert(alert.alert_id)}
                          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
                        >
                          Acknowledge
                        </button>
                      )}
                      {(alert.status === 'new' || alert.status === 'acknowledged') && (
                        <button
                          onClick={() => resolveAlert(alert.alert_id)}
                          className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-2">About Alerts</h4>
        <p className="text-blue-800 text-sm">
          The Alert System monitors your property portfolio 24/7 and notifies you of important events. 
          Alerts are triggered by automated risk monitoring, market changes, and property conditions.
        </p>
      </div>
    </div>
  );
};

export default AlertsDashboard;
