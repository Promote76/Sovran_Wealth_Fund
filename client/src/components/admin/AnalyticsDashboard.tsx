import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface FunnelMetrics {
  totalStarted: number;
  steps: {
    personal: { completed: number; conversionRate: string };
    financial: { completed: number; conversionRate: string };
    risk: { completed: number; conversionRate: string };
    kyc: { completed: number; conversionRate: string };
  };
  completedRegistrations: number;
  overallConversionRate: string;
  avgTimeSpent: number;
  abandonedCount: number;
  abandonmentRate: string;
  programEnrollments: Array<{
    programType: string;
    count: number;
  }>;
}

export const AnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<FunnelMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/unified-registration-admin/analytics/funnel', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }

      const data = await response.json();
      setMetrics(data);
    } catch (err: any) {
      console.error('Error fetching metrics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p className="font-medium">Error loading analytics</p>
            <p className="text-sm mt-1">{error || 'No data available'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total Started</p>
              <p className="text-3xl font-bold text-blue-600">{metrics.totalStarted}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-600">{metrics.completedRegistrations}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Conversion Rate</p>
              <p className="text-3xl font-bold text-purple-600">{metrics.overallConversionRate}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Abandoned</p>
              <p className="text-3xl font-bold text-red-600">{metrics.abandonmentRate}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Registration Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Started */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Started Registration</span>
                <span className="text-sm text-gray-600">{metrics.totalStarted} users</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-8">
                <div className="bg-blue-600 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ width: '100%' }}>
                  100%
                </div>
              </div>
            </div>

            {/* Personal Profile */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Personal Profile</span>
                <span className="text-sm text-gray-600">{metrics.steps.personal.completed} users ({metrics.steps.personal.conversionRate}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-8">
                <div className="bg-purple-600 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ width: `${metrics.steps.personal.conversionRate}%` }}>
                  {metrics.steps.personal.conversionRate}%
                </div>
              </div>
            </div>

            {/* Financial Profile */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Financial Profile</span>
                <span className="text-sm text-gray-600">{metrics.steps.financial.completed} users ({metrics.steps.financial.conversionRate}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-8">
                <div className="bg-indigo-600 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ width: `${metrics.steps.financial.conversionRate}%` }}>
                  {metrics.steps.financial.conversionRate}%
                </div>
              </div>
            </div>

            {/* Risk Profile */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Risk Profile</span>
                <span className="text-sm text-gray-600">{metrics.steps.risk.completed} users ({metrics.steps.risk.conversionRate}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-8">
                <div className="bg-pink-600 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ width: `${metrics.steps.risk.conversionRate}%` }}>
                  {metrics.steps.risk.conversionRate}%
                </div>
              </div>
            </div>

            {/* Completed */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Completed Registration</span>
                <span className="text-sm text-gray-600">{metrics.completedRegistrations} users ({metrics.overallConversionRate}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-8">
                <div className="bg-green-600 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ width: `${metrics.overallConversionRate}%` }}>
                  {metrics.overallConversionRate}%
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Program Enrollments */}
      <Card>
        <CardHeader>
          <CardTitle>Program Enrollments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {metrics.programEnrollments.map((program, idx) => (
              <div key={idx} className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{program.count}</p>
                <p className="text-sm text-gray-600 mt-1">{program.programType}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Time Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Time Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Average Time Spent</p>
              <p className="text-2xl font-bold">{Math.round(metrics.avgTimeSpent / 60)} minutes</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Abandoned Registrations</p>
              <p className="text-2xl font-bold text-red-600">{metrics.abandonedCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
