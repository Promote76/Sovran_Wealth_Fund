import React, { useState, useEffect } from 'react';

interface LogFile {
  name: string;
  size: string;
  date: string;
  type: 'application' | 'security' | 'transaction' | 'system';
  description: string;
}

const DownloadLogsPage: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({ username: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [downloadProgress, setDownloadProgress] = useState<{ [key: string]: number }>({});

  // Mock log files data
  const logFiles: LogFile[] = [
    {
      name: 'application-2024-12-28.log',
      size: '15.2 MB',
      date: '2024-12-28',
      type: 'application',
      description: 'Main application logs including user actions, API calls, and system events'
    },
    {
      name: 'security-2024-12-28.log',
      size: '3.8 MB',
      date: '2024-12-28',
      type: 'security',
      description: 'Security events, authentication attempts, and access control logs'
    },
    {
      name: 'transactions-2024-12-28.log',
      size: '45.7 MB',
      date: '2024-12-28',
      type: 'transaction',
      description: 'Blockchain transaction logs, wallet connections, and DeFi operations'
    },
    {
      name: 'system-2024-12-28.log',
      size: '8.1 MB',
      date: '2024-12-28',
      type: 'system',
      description: 'System performance metrics, database operations, and infrastructure logs'
    },
    {
      name: 'application-2024-12-27.log',
      size: '14.8 MB',
      date: '2024-12-27',
      type: 'application',
      description: 'Previous day application logs'
    },
    {
      name: 'security-2024-12-27.log',
      size: '4.2 MB',
      date: '2024-12-27',
      type: 'security',
      description: 'Previous day security logs'
    },
    {
      name: 'transactions-2024-12-27.log',
      size: '52.3 MB',
      date: '2024-12-27',
      type: 'transaction',
      description: 'Previous day transaction logs'
    },
    {
      name: 'system-2024-12-27.log',
      size: '7.9 MB',
      date: '2024-12-27',
      type: 'system',
      description: 'Previous day system logs'
    }
  ];

  const logTypes = [
    { id: 'all', name: 'All Logs', icon: '📋', count: logFiles.length },
    { id: 'application', name: 'Application', icon: '📱', count: logFiles.filter(f => f.type === 'application').length },
    { id: 'security', name: 'Security', icon: '🔒', count: logFiles.filter(f => f.type === 'security').length },
    { id: 'transaction', name: 'Transactions', icon: '💸', count: logFiles.filter(f => f.type === 'transaction').length },
    { id: 'system', name: 'System', icon: '⚙️', count: logFiles.filter(f => f.type === 'system').length }
  ];

  const filteredLogs = selectedType === 'all' ? logFiles : logFiles.filter(log => log.type === selectedType);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    // Mock authentication - replace with real authentication
    if (adminCredentials.username === 'Admin' && adminCredentials.password === 'Promote9') {
      setIsAuthenticated(true);
    } else {
      setAuthError('Invalid admin credentials');
    }
  };

  const handleDownload = (fileName: string) => {
    // Mock download with progress
    setDownloadProgress(prev => ({ ...prev, [fileName]: 0 }));
    
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        const current = prev[fileName] || 0;
        if (current >= 100) {
          clearInterval(interval);
          // Remove progress after completion
          setTimeout(() => {
            setDownloadProgress(prev => {
              const { [fileName]: removed, ...rest } = prev;
              return rest;
            });
          }, 2000);
          return prev;
        }
        return { ...prev, [fileName]: current + 10 };
      });
    }, 200);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'application': return 'bg-blue-100 text-blue-800';
      case 'security': return 'bg-red-100 text-red-800';
      case 'transaction': return 'bg-green-100 text-green-800';
      case 'system': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAuthenticated) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white py-12">
          <div className="container mx-auto px-4 max-w-md">
            
            {/* Admin Login Form */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
              <div className="text-center mb-8">
                <div className="text-4xl mb-4">🔐</div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Admin Access Required</h1>
                <p className="text-gray-600">Enter admin credentials to access system logs</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  <input
                    type="text"
                    value={adminCredentials.username}
                    onChange={(e) => setAdminCredentials(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter admin username"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    value={adminCredentials.password}
                    onChange={(e) => setAdminCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter admin password"
                    required
                  />
                </div>

                {authError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">{authError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium"
                >
                  🚀 Access Admin Panel
                </button>
              </form>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Security Notice:</strong> This area contains sensitive system information. 
                  Access is logged and monitored for security purposes.
                </p>
              </div>
            </div>

          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-blue-800 mb-6">
              📋 System Logs Download
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Access and download system logs for debugging, auditing, and compliance purposes. 
              All download activities are logged for security.
            </p>
            <div className="mt-4 flex items-center justify-center space-x-4">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                ✅ Authenticated as Admin
              </span>
              <button
                onClick={() => setIsAuthenticated(false)}
                className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium hover:bg-red-200 transition-colors"
              >
                🚪 Logout
              </button>
            </div>
          </div>

          {/* Log Type Filters */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">📁 Filter by Log Type</h2>
            <div className="flex flex-wrap gap-4">
              {logTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedType === type.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span>{type.icon}</span>
                    <span>{type.name}</span>
                    <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                      {type.count}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Log Files Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">Available Log Files</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLogs.map((log, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.name}</div>
                          <div className="text-sm text-gray-500">{log.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(log.type)}`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{log.size}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{log.date}</td>
                      <td className="px-6 py-4">
                        {downloadProgress[log.name] !== undefined ? (
                          <div className="w-24">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Downloading</span>
                              <span>{downloadProgress[log.name]}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${downloadProgress[log.name]}%` }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleDownload(log.name)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                          >
                            📥 Download
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🎛️ Bulk Actions</h3>
            <div className="flex flex-wrap gap-4">
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-medium">
                📦 Download All ({selectedType === 'all' ? 'All Types' : selectedType})
              </button>
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors font-medium">
                🗜️ Download as ZIP
              </button>
              <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors font-medium">
                📊 Generate Report
              </button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-4">⚠️ Security & Compliance Notice</h3>
            <div className="text-sm text-red-700 space-y-2">
              <p>• All log download activities are monitored and logged for security audit purposes</p>
              <p>• Log files may contain sensitive information - handle according to data protection policies</p>
              <p>• Ensure secure transmission and storage of downloaded log files</p>
              <p>• Access to this functionality is restricted to authorized administrators only</p>
              <p>• Report any suspicious activity or unauthorized access attempts immediately</p>
            </div>
          </div>

        </div>
      </div>
  );
};

export default DownloadLogsPage;