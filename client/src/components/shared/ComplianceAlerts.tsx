/**
 * Feature #2: Smart Compliance Orchestrator - Alerts Center
 * Notification center for compliance alerts with severity filtering
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Alert {
  alertId: string;
  alertType: string;
  severity: string;
  investorId: number;
  investorEmail: string;
  investorName: string;
  title: string;
  description: string;
  actionRequired: boolean;
  actionDeadline: string | null;
  status: string;
  assignedTo: number | null;
  resolvedAt: string | null;
  createdAt: string;
}

const ComplianceAlerts: React.FC<{ investorId?: number; adminView?: boolean }> = ({ investorId, adminView = false }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, [investorId, severityFilter, statusFilter]);

  const loadAlerts = async () => {
    try {
      const params = new URLSearchParams();
      if (investorId) params.append('investorId', investorId.toString());
      if (severityFilter !== 'all') params.append('severity', severityFilter);
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', '100');

      const res = await axios.get(`/api/compliance/alerts?${params.toString()}`);
      setAlerts(res.data.alerts || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    const notes = prompt('Enter resolution notes:');
    if (!notes) return;

    setResolvingId(alertId);
    try {
      await axios.post(`/api/compliance/alerts/${alertId}/resolve`, {
        resolvedBy: 1,
        resolutionNotes: notes
      });
      alert('Alert resolved successfully');
      loadAlerts();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to resolve alert');
    } finally {
      setResolvingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSeverityBadge = (severity: string) => {
    const configs: Record<string, { color: string; icon: string }> = {
      urgent: { color: 'bg-red-100 text-red-800 border-red-300', icon: '🚨' },
      critical: { color: 'bg-orange-100 text-orange-800 border-orange-300', icon: '⚠️' },
      warning: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: '⚡' },
      info: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: 'ℹ️' }
    };
    const config = configs[severity?.toLowerCase()] || { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: '📋' };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
        {config.icon} {severity}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-red-100 text-red-800',
      acknowledged: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      dismissed: 'bg-gray-100 text-gray-800'
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const groupedAlerts = alerts.reduce((acc, alert) => {
    const severity = alert.severity;
    if (!acc[severity]) acc[severity] = [];
    acc[severity].push(alert);
    return acc;
  }, {} as Record<string, Alert[]>);

  const severityOrder = ['urgent', 'critical', 'warning', 'info'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Compliance Alerts</h1>
        <p className="text-gray-600">Monitor and manage compliance notifications and actions</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
          <div className="flex gap-2">
            {['all', 'urgent', 'critical', 'warning', 'info'].map((severity) => (
              <button
                key={severity}
                onClick={() => setSeverityFilter(severity)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  severityFilter === severity
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {severity.charAt(0).toUpperCase() + severity.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <div className="flex gap-2">
            {['open', 'resolved', 'acknowledged'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-5xl mb-4">✓</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Alerts</h3>
          <p className="text-gray-600">
            {statusFilter === 'open' ? 'All compliance alerts have been resolved!' : 'No alerts match your filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {severityOrder.map((severity) => {
            const severityAlerts = groupedAlerts[severity] || [];
            if (severityAlerts.length === 0) return null;

            return (
              <div key={severity} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 capitalize">{severity} Alerts</h3>
                    <span className="text-sm text-gray-600">{severityAlerts.length} alerts</span>
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {severityAlerts.map((alert) => (
                    <div key={alert.alertId} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getSeverityBadge(alert.severity)}
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(alert.status)}`}>
                              {alert.status}
                            </span>
                            {alert.actionRequired && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                                Action Required
                              </span>
                            )}
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">{alert.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Created: {formatDate(alert.createdAt)}</span>
                            {alert.actionDeadline && (
                              <span className="text-red-600">⏰ Deadline: {formatDate(alert.actionDeadline)}</span>
                            )}
                            {adminView && alert.investorName && (
                              <span>Investor: {alert.investorName}</span>
                            )}
                          </div>
                        </div>

                        {alert.status === 'open' && (
                          <button
                            onClick={() => handleResolveAlert(alert.alertId)}
                            disabled={resolvingId === alert.alertId}
                            className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm"
                          >
                            {resolvingId === alert.alertId ? 'Resolving...' : 'Resolve'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ComplianceAlerts;
