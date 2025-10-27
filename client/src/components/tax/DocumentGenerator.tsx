import React, { useState } from 'react';

const DocumentGenerator: React.FC = () => {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      setGenerating(true);
      setError(null);
      const response = await fetch(`/api/tax/bulk-generate/${formData.get('investorId')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tax_year: Number(formData.get('year')),
          document_types: Array.from(formData.getAll('docTypes'))
        })
      });

      if (!response.ok) throw new Error('Failed to generate documents');
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">📄 Document Generator</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">✅ Documents generated successfully!</p>
        </div>
      )}

      <form onSubmit={handleGenerate} className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Investor ID</label>
          <input name="investorId" type="number" required className="w-full px-4 py-2 border rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tax Year</label>
          <select name="year" required className="w-full px-4 py-2 border rounded-lg">
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Document Types</label>
          <div className="space-y-2">
            {['1099-DIV', 'K-1', 'annual_statement'].map(type => (
              <label key={type} className="flex items-center">
                <input type="checkbox" name="docTypes" value={type} className="mr-2" />
                <span className="text-sm">{type}</span>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" disabled={generating} className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {generating ? 'Generating...' : 'Generate Documents'}
        </button>
      </form>
    </div>
  );
};

export default DocumentGenerator;
