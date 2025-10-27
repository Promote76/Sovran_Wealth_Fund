import React, { useState, useEffect } from 'react';

interface TaxDocument {
  id: number;
  document_id: string;
  document_type: string;
  tax_year: number;
  income_amount: string;
  status: string;
  generated_at: string;
  file_url: string;
}

interface Props {
  investorId: number;
}

const TaxCenter: React.FC<Props> = ({ investorId }) => {
  const [documents, setDocuments] = useState<TaxDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (investorId) fetchDocuments();
  }, [investorId, selectedYear]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tax/documents/${investorId}?tax_year=${selectedYear}`);
      if (!response.ok) throw new Error('Failed to fetch tax documents');
      const data = await response.json();
      setDocuments(data.documents || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      generated: 'bg-blue-100 text-blue-800',
      sent: 'bg-green-100 text-green-800',
      filed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Error: {error}</p>
        <button onClick={fetchDocuments} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">📋 Tax Center</h2>
        <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="px-4 py-2 border rounded-lg">
          {years.map(year => <option key={year} value={year}>{year}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['1099-DIV', 'K-1', 'Annual Statement'].map(type => {
          const count = documents.filter(d => d.document_type === type).length;
          return (
            <div key={type} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm text-gray-600">{type}</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{count}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Tax Documents ({documents.length})</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Income</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {documents.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No tax documents for {selectedYear}</td></tr>
            ) : (
              documents.map(doc => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium">{doc.document_type}</td>
                  <td className="px-6 py-4 text-sm">{doc.tax_year}</td>
                  <td className="px-6 py-4 text-sm text-right">${Number(doc.income_amount).toLocaleString()}</td>
                  <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(doc.status)}`}>{doc.status}</span></td>
                  <td className="px-6 py-4">
                    {doc.file_url && <a href={doc.file_url} className="text-blue-600 hover:text-blue-800 text-sm">Download PDF</a>}
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

export default TaxCenter;
