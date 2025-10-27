import React, { useState, useEffect } from 'react';

interface Statement {
  id: number;
  statement_id: string;
  statement_type: string;
  period_start: string;
  period_end: string;
  total_income: string;
  total_distributions: string;
  status: string;
  file_url: string;
}

interface Props {
  investorId: number;
}

const AnnualStatements: React.FC<Props> = ({ investorId }) => {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (investorId) fetchStatements();
  }, [investorId]);

  const fetchStatements = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tax/statements/${investorId}`);
      if (!response.ok) throw new Error('Failed to fetch statements');
      const data = await response.json();
      setStatements(data.statements || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Error: {error}</p>
        <button onClick={fetchStatements} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">📊 Annual Statements</h2>
      
      <div className="grid grid-cols-1 gap-6">
        {statements.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">No annual statements found</div>
        ) : (
          statements.map(stmt => (
            <div key={stmt.id} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{stmt.statement_type.replace(/_/g, ' ').toUpperCase()}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(stmt.period_start).toLocaleDateString()} - {new Date(stmt.period_end).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs ${stmt.status === 'generated' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {stmt.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Total Income</p>
                  <p className="text-xl font-bold text-green-600">${Number(stmt.total_income).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Distributions</p>
                  <p className="text-xl font-bold text-blue-600">${Number(stmt.total_distributions).toLocaleString()}</p>
                </div>
              </div>
              
              {stmt.file_url && (
                <a href={stmt.file_url} className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  Download PDF
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AnnualStatements;
