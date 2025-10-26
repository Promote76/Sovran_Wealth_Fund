import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import AdminLoginForm from '../components/AdminLoginForm';

const IELAIntakePage: React.FC = () => {
  const { user, loading, error, login, logout, isAdmin, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    source: 'manual',
    rawText: ''
  });
  const [dealResult, setDealResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated()) {
    return <AdminLoginForm onLogin={login} loading={loading} error={error} />;
  }

  // Not admin
  if (!isAdmin()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            Admin privileges required to access IELA Intake.
          </p>
          <button
            onClick={logout}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            🔓 Logout
          </button>
        </div>
      </div>
    );
  }

  const loadExample = () => {
    setFormData({
      source: 'test',
      rawText: '247 Howell Drive Southwest, Atlanta GA 30331. Asking 103k, ARV 215k. Contact John 404-555-1234. 3 bed, 2 bath, 1450 sqft. Built 1968.'
    });
  };

  const handleIngestAndEnrich = async () => {
    setIsProcessing(true);
    setErrorMessage('');
    setDealResult(null);

    try {
      // Step 1: Ingest deal
      const ingestResponse = await fetch('/api/deals/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!ingestResponse.ok) {
        throw new Error('Failed to ingest deal');
      }

      const ingestData = await ingestResponse.json();
      const dealId = ingestData.data.id;

      // Step 2: Enrich deal
      const enrichResponse = await fetch(`/api/deals/${dealId}/enrich`, {
        method: 'POST'
      });

      if (!enrichResponse.ok) {
        throw new Error('Failed to enrich deal');
      }

      const enrichData = await enrichResponse.json();

      // Step 3: Analyze deal
      const analyzeResponse = await fetch(`/api/deals/${dealId}/analyze`, {
        method: 'POST'
      });

      if (!analyzeResponse.ok) {
        throw new Error('Failed to analyze deal');
      }

      const analyzeData = await analyzeResponse.json();
      setDealResult(analyzeData.data);

    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process deal');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-purple-800 mb-2">
                🏠 IELA Deal Intake
              </h1>
              <p className="text-gray-600">
                Ingest → Enrich → Analyze → List wholesale real estate deals
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                Admin: <span className="font-medium">{user?.firstName} {user?.lastName}</span>
              </div>
              <button
                onClick={logout}
                className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                🔓 Logout
              </button>
            </div>
          </div>
        </div>

        {/* Intake Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📥 Create New Deal</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source
            </label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({...formData, source: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="manual">Manual Entry</option>
              <option value="sms">SMS</option>
              <option value="email">Email</option>
              <option value="investorlift">InvestorLift</option>
              <option value="test">Test</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property Details (Free-form text)
            </label>
            <textarea
              value={formData.rawText}
              onChange={(e) => setFormData({...formData, rawText: e.target.value})}
              placeholder="Example: 247 Howell Drive SW, Atlanta GA 30331. Asking 103k, ARV 215k. Contact John 404-555-1234. 3 bed, 2 bath, 1450 sqft."
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={loadExample}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium"
            >
              📋 Load Example
            </button>
            <button
              onClick={handleIngestAndEnrich}
              disabled={isProcessing || !formData.rawText}
              className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? '⏳ Processing...' : '🚀 Ingest & Enrich'}
            </button>
          </div>

          {errorMessage && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">❌ {errorMessage}</p>
            </div>
          )}
        </div>

        {/* Results */}
        {dealResult && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-green-800 mb-4">✅ Deal Processed Successfully!</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Property Info */}
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-bold text-lg mb-3">📍 Property</h3>
                <p className="text-sm mb-1"><strong>Address:</strong> {dealResult.parsed?.address}</p>
                <p className="text-sm mb-1"><strong>City:</strong> {dealResult.parsed?.city}, {dealResult.parsed?.state} {dealResult.parsed?.zip}</p>
                <p className="text-sm mb-1"><strong>Asking:</strong> ${dealResult.parsed?.asking?.toLocaleString()}</p>
                <p className="text-sm mb-1"><strong>ARV:</strong> ${dealResult.parsed?.arv?.toLocaleString()}</p>
              </div>

              {/* Financial Analysis */}
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-bold text-lg mb-3">💰 Analysis</h3>
                <p className="text-sm mb-1"><strong>Repair Est:</strong> ${dealResult.repairs?.estMid?.toLocaleString()}</p>
                <p className="text-sm mb-1"><strong>MAO (1.0x):</strong> ${dealResult.analysis?.maoByRepair?.[1]?.mao?.toLocaleString()}</p>
                <p className="text-sm mb-1"><strong>Profit Margin:</strong> ${dealResult.analysis?.maoByRepair?.[1]?.profit?.toLocaleString()}</p>
                <p className="text-sm mb-1"><strong>RTO Badge:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-bold ${
                    dealResult.analysis?.rtoBadge === 'green' ? 'bg-green-500 text-white' :
                    dealResult.analysis?.rtoBadge === 'yellow' ? 'bg-yellow-500 text-black' :
                    'bg-red-500 text-white'
                  }`}>
                    {dealResult.analysis?.rtoBadge?.toUpperCase()}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-4">
              <a
                href="/admin/iela/dashboard"
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
              >
                📊 View in Dashboard
              </a>
              <button
                onClick={() => setDealResult(null)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium"
              >
                ➕ Create Another Deal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IELAIntakePage;
