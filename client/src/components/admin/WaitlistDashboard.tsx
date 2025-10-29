import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface WaitlistEntry {
  id: number;
  email: string;
  name: string | null;
  country: string | null;
  role: string;
  investorType: string | null;
  investmentRange: string | null;
  companyName: string | null;
  marketsServed: string | null;
  avgMonthlyDeals: number | null;
  assignmentFeePercent: number | null;
  entityType: string | null;
  hasEin: boolean | null;
  hasEoInsurance: boolean | null;
  tags: string | null;
  status: string;
  foundingMember: boolean;
  source: string | null;
  createdAt: string;
  confirmedAt: string | null;
  convertedAt: string | null;
  notes: string | null;
}

const WaitlistDashboard: React.FC = () => {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, [roleFilter, statusFilter, searchQuery]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery.trim()) params.append('search', searchQuery);
      
      const response = await axios.get(`/api/waitlist/admin?${params.toString()}`);
      
      if (response.data.success) {
        setEntries(response.data.entries);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch waitlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (roleFilter !== 'all') params.append('role', roleFilter);
    if (statusFilter !== 'all') params.append('status', statusFilter);
    
    window.location.href = `/api/waitlist/admin/export?${params.toString()}`;
  };

  const handleUpdateEntry = async (id: number, updates: Partial<WaitlistEntry>) => {
    try {
      setUpdating(true);
      const response = await axios.put(`/api/waitlist/admin/${id}`, updates);
      
      if (response.data.success) {
        fetchEntries();
        setSelectedEntry(null);
      }
    } catch (error) {
      console.error('Failed to update entry:', error);
      alert('Failed to update entry');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      investor: 'bg-blue-100 text-blue-800',
      wholesaler: 'bg-purple-100 text-purple-800',
      both: 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[role] || 'bg-gray-100 text-gray-800'}`}>
        {role}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      qualified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      converted: 'bg-blue-100 text-blue-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Waitlist Management</h1>
        <p className="text-gray-600">Manage investor and wholesaler signups</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Signups</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">
              {stats.byRole?.investor || 0}
            </div>
            <div className="text-sm text-gray-600">Investors</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-purple-600">
              {stats.byRole?.wholesaler || 0}
            </div>
            <div className="text-sm text-gray-600">Wholesalers</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.byRole?.both || 0}
            </div>
            <div className="text-sm text-gray-600">Both</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.byStatus?.pending || 0}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by email, name, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="investor">Investor</option>
              <option value="wholesaler">Wholesaler</option>
              <option value="both">Both</option>
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="qualified">Qualified</option>
              <option value="rejected">Rejected</option>
              <option value="converted">Converted</option>
            </select>
            
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition whitespace-nowrap"
            >
              Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading...
          </div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No entries found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type/Company</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Founding</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{entry.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{entry.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{entry.name || '-'}</td>
                    <td className="px-4 py-3 text-sm">{getRoleBadge(entry.role)}</td>
                    <td className="px-4 py-3 text-sm">{getStatusBadge(entry.status)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {entry.role === 'investor' || entry.role === 'both' ? (
                        <div className="text-xs">
                          <div>{entry.investorType}</div>
                          <div className="text-gray-500">{entry.investmentRange}</div>
                        </div>
                      ) : null}
                      {entry.role === 'wholesaler' || entry.role === 'both' ? (
                        <div className="text-xs">
                          <div>{entry.companyName}</div>
                          <div className="text-gray-500">{entry.avgMonthlyDeals} deals/mo</div>
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {entry.foundingMember ? (
                        <span className="text-green-600 font-medium">✓</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(entry.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => {
                          setSelectedEntry(entry);
                          setEditingNotes(entry.notes || '');
                        }}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Entry Details</h2>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900">{selectedEntry.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="text-sm text-gray-900">{selectedEntry.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Country</label>
                    <p className="text-sm text-gray-900">{selectedEntry.country || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <div className="mt-1">{getRoleBadge(selectedEntry.role)}</div>
                  </div>
                </div>

                {(selectedEntry.role === 'investor' || selectedEntry.role === 'both') && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Investor Info</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <p className="text-sm text-gray-900">{selectedEntry.investorType || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Range</label>
                        <p className="text-sm text-gray-900">{selectedEntry.investmentRange || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {(selectedEntry.role === 'wholesaler' || selectedEntry.role === 'both') && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Wholesaler Info</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Company</label>
                        <p className="text-sm text-gray-900">{selectedEntry.companyName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Markets</label>
                        <p className="text-sm text-gray-900">{selectedEntry.marketsServed || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Avg Deals/Mo</label>
                        <p className="text-sm text-gray-900">{selectedEntry.avgMonthlyDeals || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Assignment Fee</label>
                        <p className="text-sm text-gray-900">{selectedEntry.assignmentFeePercent ? `${selectedEntry.assignmentFeePercent}%` : 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Entity Type</label>
                        <p className="text-sm text-gray-900">{selectedEntry.entityType || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">EIN / E&O Insurance</label>
                        <p className="text-sm text-gray-900">
                          {selectedEntry.hasEin !== null ? (selectedEntry.hasEin ? 'Has EIN' : 'No EIN') : 'N/A'} / {' '}
                          {selectedEntry.hasEoInsurance !== null ? (selectedEntry.hasEoInsurance ? 'Has E&O' : 'No E&O') : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        value={selectedEntry.status}
                        onChange={(e) => handleUpdateEntry(selectedEntry.id, { status: e.target.value })}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                        disabled={updating}
                      >
                        <option value="pending">Pending</option>
                        <option value="qualified">Qualified</option>
                        <option value="rejected">Rejected</option>
                        <option value="converted">Converted</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Founding Member</label>
                      <select
                        value={selectedEntry.foundingMember ? 'true' : 'false'}
                        onChange={(e) => handleUpdateEntry(selectedEntry.id, { foundingMember: e.target.value === 'true' })}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                        disabled={updating}
                      >
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Tags</label>
                      <p className="text-sm text-gray-900">{selectedEntry.tags || 'None'}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={editingNotes}
                    onChange={(e) => setEditingNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Add internal notes..."
                  />
                  <button
                    onClick={() => handleUpdateEntry(selectedEntry.id, { notes: editingNotes })}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    disabled={updating}
                  >
                    {updating ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>

                <div className="border-t pt-4 text-sm text-gray-600">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block font-medium">Created</label>
                      {formatDate(selectedEntry.createdAt)}
                    </div>
                    <div>
                      <label className="block font-medium">Confirmed</label>
                      {formatDate(selectedEntry.confirmedAt)}
                    </div>
                    <div>
                      <label className="block font-medium">Converted</label>
                      {formatDate(selectedEntry.convertedAt)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaitlistDashboard;
