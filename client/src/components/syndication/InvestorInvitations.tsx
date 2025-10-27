import React, { useState, useEffect } from 'react';

interface Invitation {
  id: number;
  invitation_id: string;
  investor_id: number;
  email: string;
  suggested_commitment: string;
  status: string;
  created_at: string;
  responded_at: string | null;
}

interface Props {
  syndicateId: string;
}

const InvestorInvitations: React.FC<Props> = ({ syndicateId }) => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);

  useEffect(() => {
    if (syndicateId) fetchInvitations();
  }, [syndicateId]);

  const fetchInvitations = async () => {
    try {
      const response = await fetch(`/api/syndication/syndicates/${syndicateId}/invitations`);
      if (!response.ok) throw new Error('Failed to fetch invitations');
      const data = await response.json();
      setInvitations(data.invitations || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch(`/api/syndication/syndicates/${syndicateId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
          suggested_commitment: Number(formData.get('commitment'))
        })
      });

      if (!response.ok) throw new Error('Failed to send invitation');
      
      setShowInviteForm(false);
      fetchInvitations();
      e.currentTarget.reset();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      sent: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="text-center py-8">Loading invitations...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Error: {error}</p>
        <button 
          onClick={fetchInvitations}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">📬 Investor Invitations</h3>
        <button
          onClick={() => setShowInviteForm(!showInviteForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          {showInviteForm ? 'Cancel' : '+ Invite Investor'}
        </button>
      </div>

      {showInviteForm && (
        <form onSubmit={sendInvitation} className="bg-white border border-gray-300 rounded-lg p-6 space-y-4">
          <h4 className="font-semibold">Send Invitation</h4>
          <input 
            name="email" 
            type="email" 
            placeholder="Investor Email" 
            required 
            className="w-full px-4 py-2 border rounded-lg" 
          />
          <input 
            name="commitment" 
            type="number" 
            placeholder="Suggested Commitment ($)" 
            className="w-full px-4 py-2 border rounded-lg" 
          />
          <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Send Invitation
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-lg">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Suggested Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responded</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invitations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No invitations sent yet. Invite investors to join this syndicate!
                </td>
              </tr>
            ) : (
              invitations.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{inv.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {inv.suggested_commitment ? `$${Number(inv.suggested_commitment).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(inv.status)}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(inv.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {inv.responded_at ? new Date(inv.responded_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvestorInvitations;
