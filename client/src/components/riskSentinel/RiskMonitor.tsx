import React, { useState, useEffect } from 'react';

interface RiskEvent {
  id: number;
  event_id: string;
  property_id: number;
  event_type: string;
  severity: string;
  risk_score: number;
  description: string;
  status: string;
  detected_at: string;
  address?: string;
  city?: string;
  state?: string;
}

interface RiskMonitorProps {
  propertyId?: number;
}

const RiskMonitor: React.FC<RiskMonitorProps> = ({ propertyId }) => {
  const [risks, setRisks] = useState<RiskEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({ severity: 'all', status: 'active' });

  useEffect(() => {
    fetchRisks();
  }, [propertyId, filter]);

  const fetchRisks = async () => {
    try {
      setLoading(true);
      const endpoint = propertyId 
        ? `/api/risk-sentinel/risks/${propertyId}?status=${filter.status}`
        : `/api/risk-sentinel/risks?status=${filter.status}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch risks');
      
      const data = await response.json();
      setRisks(data.risks || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateRiskStatus = async (eventId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/risk-sentinel/risks/${eventId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) throw new Error('Failed to update risk status');
      
      fetchRisks();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      low: 'bg-blue-100 text-blue-800 border-blue-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      critical: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[severity] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getRiskIcon = (eventType: string) => {
    const icons: Record<string, string> = {
      flood_risk: '🌊',
      fire_risk: '🔥',
      earthquake_risk: '🏚️',
      market_decline: '📉',
      vacancy: '🏚️',
      delinquency: '⚠️',
      regulatory_change: '📋',
      environmental: '🌿',
      structural: '🏗️'
    };
    return icons[eventType] || '⚠️';
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
        <p className="text-red-800">Error loading risks: {error}</p>
        <button 
          onClick={fetchRisks}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          🛡️ Risk Monitor
        </h2>
        <div className="flex gap-3">
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">Active</option>
            <option value="monitoring">Monitoring</option>
            <option value="mitigated">Mitigated</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['low', 'medium', 'high', 'critical'].map(severity => {
          const count = risks.filter(r => r.severity === severity).length;
          return (
            <div key={severity} className={`${getSeverityColor(severity)} border-2 rounded-lg p-4`}>
              <div className="text-sm font-medium uppercase">{severity} Risk</div>
              <div className="text-3xl font-bold mt-2">{count}</div>
            </div>
          );
        })}
      </div>

      {/* Risk Events List */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Active Risk Events ({risks.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {risks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              ✅ No {filter.status} risks found. Portfolio is healthy!
            </div>
          ) : (
            risks.map(risk => (
              <div key={risk.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getRiskIcon(risk.event_type)}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(risk.severity)} border-2`}>
                        {risk.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {risk.event_type.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-gray-900 font-medium mb-2">{risk.description}</p>
                    
                    {risk.address && (
                      <p className="text-sm text-gray-600">
                        📍 {risk.address}, {risk.city}, {risk.state}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span>🎯 Risk Score: {risk.risk_score?.toFixed(1) || 'N/A'}</span>
                      <span>📅 {new Date(risk.detected_at).toLocaleDateString()}</span>
                      <span className="px-2 py-1 bg-gray-100 rounded">Status: {risk.status}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {risk.status === 'active' && (
                      <>
                        <button
                          onClick={() => updateRiskStatus(risk.event_id, 'monitoring')}
                          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Monitor
                        </button>
                        <button
                          onClick={() => updateRiskStatus(risk.event_id, 'mitigated')}
                          className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Mitigate
                        </button>
                      </>
                    )}
                    {risk.status === 'monitoring' && (
                      <button
                        onClick={() => updateRiskStatus(risk.event_id, 'resolved')}
                        className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RiskMonitor;
