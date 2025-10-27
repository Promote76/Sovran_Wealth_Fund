import React, { useState, useEffect } from 'react';

interface Invitation {
  invitation_id: string;
  syndicate_id: string;  // UUID string
  invitee_email: string;
  invitee_wallet?: string;
  proposed_commitment?: number;
  custom_message?: string;
  status: string;
  invitation_code: string;
  invited_by: number;
  invited_at: string;
  expires_at: string;
  responded_at?: string;
  syndicate_name?: string;
  target_raise?: string;
}

export const InvestorInvitations: React.FC = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);

  const [formData, setFormData] = useState({
    syndicate_id: '',
    investor_email: '',
    investor_name: '',
    message: ''
  });

  const [syndicates, setSyndicates] = useState<any[]>([]);

  useEffect(() => {
    fetchSyndicates();
    fetchInvitations();
  }, []);

  const fetchSyndicates = async () => {
    try {
      const response = await fetch('/api/syndication/syndicates?status=fundraising');
      const data = await response.json();
      if (data.success) {
        setSyndicates(data.syndicates || []);
      }
    } catch (err) {
      console.error('Failed to fetch syndicates:', err);
    }
  };

  const fetchInvitations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/syndication/invitations');
      const data = await response.json();
      
      if (data.success) {
        setInvitations(data.invitations || []);
      } else {
        setError(data.error || 'Failed to load invitations');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Correct API endpoint includes syndicate ID in path
      const response = await fetch(`/api/syndication/syndicates/${formData.syndicate_id}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.investor_email,
          investor_name: formData.investor_name,
          message: formData.message
        })
      });

      const data = await response.json();

      if (data.success) {
        setShowInviteForm(false);
        setFormData({
          syndicate_id: '',
          investor_email: '',
          investor_name: '',
          message: ''
        });
        fetchInvitations();
        alert('Invitation sent successfully!');
      } else {
        setError(data.error || 'Failed to send invitation');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Investor Invitations</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage and track syndicate member invitations
          </p>
        </div>
        <button
          onClick={() => setShowInviteForm(!showInviteForm)}
          disabled={syndicates.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {showInviteForm ? 'Cancel' : '+ Send Invitation'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {syndicates.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          No active syndicates available. Create a syndicate first before sending invitations.
        </div>
      )}

      {showInviteForm && syndicates.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Investor Invitation</h3>
          <form onSubmit={handleSendInvitation} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Syndicate *
              </label>
              <select
                required
                value={formData.syndicate_id}
                onChange={(e) => setFormData({ ...formData, syndicate_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a syndicate...</option>
                {syndicates.map((syndicate) => (
                  <option key={syndicate.syndicate_id} value={syndicate.syndicate_id}>
                    {syndicate.syndicate_name} - ${syndicate.target_raise.toLocaleString()} target
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Investor Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.investor_name}
                  onChange={(e) => setFormData({ ...formData, investor_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.investor_email}
                  onChange={(e) => setFormData({ ...formData, investor_email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Personal Message (Optional)
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add a personal note to the invitation..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowInviteForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Invitation History</h3>
        </div>

        {loading && !invitations.length ? (
          <div className="p-8 text-center text-gray-500">
            Loading invitations...
          </div>
        ) : invitations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No invitations sent yet. Send your first invitation to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Investor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Syndicate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invitations.map((invitation) => (
                  <tr key={invitation.invitation_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {invitation.invitee_email}
                        </div>
                        {invitation.invitee_wallet && (
                          <div className="text-xs text-gray-500">
                            {invitation.invitee_wallet.substring(0, 10)}...
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invitation.syndicate_name || `Syndicate #${invitation.syndicate_id}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(invitation.status)}`}>
                        {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invitation.invited_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {invitation.status === 'pending' && (
                        <button className="text-blue-600 hover:text-blue-700">
                          Resend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
