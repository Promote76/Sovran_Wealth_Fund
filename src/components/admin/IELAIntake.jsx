import React, { useState } from 'react';

const IELAIntake = () => {
  const [rawText, setRawText] = useState('');
  const [url, setUrl] = useState('');
  const [source, setSource] = useState('manual');
  const [parsedData, setParsedData] = useState(null);
  const [dealId, setDealId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleIngest = async () => {
    if (!rawText.trim()) {
      setError('Please enter deal text');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/deals/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, rawText, url: url || undefined })
      });

      const data = await response.json();

      if (data.success) {
        setParsedData(data.data);
        setDealId(data.data.id);
      } else {
        setError(data.error || 'Failed to ingest deal');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!dealId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/deals/${dealId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const data = await response.json();
      if (data.success) {
        setParsedData(data.data);
      }
    } catch (err) {
      setError('Analysis failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setRawText('');
    setUrl('');
    setParsedData(null);
    setDealId(null);
    setError(null);
  };

  const exampleText = `Hi, Clarence. New off-market property in 247 Howell Drive Southwest, Atlanta, GA 30331 is available on Investorlift. Asking 103k. ARV 165k. Contact Charlie Martinez 323-701-0293 for more information.`;

  const loadExample = () => {
    setRawText(exampleText);
    setUrl('https://investorlift.com/p/281467');
  };

  const formatCurrency = (value) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">IELA Deal Intake</h1>
          <p className="text-gray-600">Paste SMS, email, or property details to automatically extract and analyze</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Deal Information</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="manual">Manual Entry</option>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="webhook">Webhook</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deal Text / Message
                <button
                  onClick={loadExample}
                  className="ml-2 text-xs text-blue-600 hover:text-blue-700"
                >
                  Load Example
                </button>
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={8}
                placeholder="Paste SMS message, email, or property details here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Listing URL (optional)
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://investorlift.com/p/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleIngest}
                disabled={loading || !rawText.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Processing...' : 'Ingest Deal'}
              </button>
              {parsedData && (
                <button
                  onClick={handleReset}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Output Panel */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Parsed Data</h2>

            {!parsedData ? (
              <div className="text-center py-12 text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No data yet</p>
                <p className="text-sm mt-1">Enter deal text and click "Ingest Deal"</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Property Info */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Property</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Address</p>
                        <p className="text-sm font-medium text-gray-900">
                          {parsedData.parsed?.address || 'Not found'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Location</p>
                        <p className="text-sm font-medium text-gray-900">
                          {parsedData.parsed?.city}, {parsedData.parsed?.state} {parsedData.parsed?.zip}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Pricing</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Asking Price</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(parsedData.parsed?.asking)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">ARV</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(parsedData.parsed?.arv)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact */}
                {parsedData.parsed?.contactName && (
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact</h3>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900">{parsedData.parsed.contactName}</p>
                      <p className="text-sm text-gray-600">{parsedData.parsed.contactPhone}</p>
                      {parsedData.parsed.contactEmail && (
                        <p className="text-sm text-gray-600">{parsedData.parsed.contactEmail}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Analysis */}
                {parsedData.analysis ? (
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Analysis</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">MAO (Mid Repair)</p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(parsedData.analysis.maoByRepair?.[1]?.mao)}
                        </p>
                        <p className="text-xs text-gray-600">
                          vs Asking: {formatCurrency(parsedData.analysis.maoByRepair?.[1]?.mao - parsedData.parsed.asking)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Price-to-ARV Ratio</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {parsedData.analysis.priceToArvPctWithRepairs?.[1]?.pct.toFixed(1)}%
                        </p>
                      </div>
                      {parsedData.analysis.rtoBadge && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">RTO Suitability</p>
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                            parsedData.analysis.rtoBadge === 'green' ? 'bg-green-100 text-green-800' :
                            parsedData.analysis.rtoBadge === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {parsedData.analysis.rtoBadge === 'green' ? '🟢 Excellent' :
                             parsedData.analysis.rtoBadge === 'yellow' ? '🟡 Moderate' :
                             '🔴 Challenging'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="pb-4">
                    <button
                      onClick={handleAnalyze}
                      disabled={loading}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 transition-colors"
                    >
                      {loading ? 'Analyzing...' : 'Run Analysis'}
                    </button>
                  </div>
                )}

                {/* Deal ID */}
                <div className="pt-2">
                  <p className="text-xs text-gray-500">Deal ID</p>
                  <p className="text-xs font-mono text-gray-600">{dealId}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IELAIntake;
