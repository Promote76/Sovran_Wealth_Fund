import React, { useState } from 'react';
import { marked } from 'marked';

interface ManuscriptMetadata {
  subject: string;
  pageLength: string;
  estimatedPages: number;
  characterCount: number;
  wordCount: number;
  codebaseLOC: number;
  contractsAnalyzed: number;
  componentsAnalyzed: number;
  endpointsAnalyzed: number;
  generatedAt: string;
}

const ManuscriptGenerator: React.FC = () => {
  const [formData, setFormData] = useState({
    subject: '',
    pageLength: 'medium',
    audience: 'mixed',
    includeCodeExamples: true,
    includeArchitectureDiagrams: true,
    customInstructions: ''
  });

  const [generating, setGenerating] = useState(false);
  const [manuscript, setManuscript] = useState<string>('');
  const [metadata, setMetadata] = useState<ManuscriptMetadata | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);

    try {
      const response = await fetch('/api/marketing-scripts/generate-manuscript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setManuscript(data.manuscript);
        setMetadata(data.metadata);
      } else {
        alert('Error generating manuscript: ' + data.error);
      }
    } catch (error) {
      console.error('Error generating manuscript:', error);
      alert('Failed to generate manuscript');
    } finally {
      setGenerating(false);
    }
  };

  const downloadManuscript = (content: string, format: 'md' | 'txt') => {
    const blob = new Blob([content], { 
      type: format === 'md' ? 'text/markdown' : 'text/plain' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AXIOM-Manuscript-${formData.subject.replace(/\s+/g, '-')}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    alert('Manuscript copied to clipboard!');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Form */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          📚 Generate Professional Manuscript
        </h2>

        <form onSubmit={handleGenerate} className="space-y-6">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject / Topic *
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g., Complete Technical Architecture Guide, Investment Platform Manual"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="mt-2 text-sm text-gray-600">
              The AI will scan the entire AXIOM platform and generate comprehensive documentation on this subject
            </p>
          </div>

          {/* Page Length */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Manuscript Length
            </label>
            <select
              value={formData.pageLength}
              onChange={(e) => setFormData({ ...formData, pageLength: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="short">📄 Short Manual (25-50 pages)</option>
              <option value="medium">📖 Comprehensive Guide (50-150 pages)</option>
              <option value="long">📚 Gold Standard Book (150-300 pages)</option>
            </select>
            <p className="mt-2 text-sm text-gray-600">
              {formData.pageLength === 'short' && 'Quick technical manual or overview'}
              {formData.pageLength === 'medium' && 'Detailed comprehensive documentation'}
              {formData.pageLength === 'long' && 'Publication-quality professional book - The Gold Standard'}
            </p>
          </div>

          {/* Audience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Audience
            </label>
            <select
              value={formData.audience}
              onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="technical">👨‍💻 Technical (Developers & Engineers)</option>
              <option value="business">💼 Business (Investors & Executives)</option>
              <option value="mixed">🎯 Mixed (Technical & Business)</option>
            </select>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.includeCodeExamples}
                onChange={(e) => setFormData({ ...formData, includeCodeExamples: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-3 text-sm text-gray-700">
                Include code examples & smart contract snippets
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.includeArchitectureDiagrams}
                onChange={(e) => setFormData({ ...formData, includeArchitectureDiagrams: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-3 text-sm text-gray-700">
                Include architecture diagrams & system flows
              </span>
            </label>
          </div>

          {/* Custom Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Instructions (Optional)
            </label>
            <textarea
              value={formData.customInstructions}
              onChange={(e) => setFormData({ ...formData, customInstructions: e.target.value })}
              placeholder="Specific requirements, focus areas, or detailed direction for the AI..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-2 text-sm text-gray-600">
              Provide detailed instructions to guide the AI's content generation
            </p>
          </div>

          {/* Generate Button */}
          <button
            type="submit"
            disabled={generating}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all text-lg font-semibold shadow-lg"
          >
            {generating ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                🤖 Scanning Entire Codebase & Generating Manuscript...
              </span>
            ) : (
              '📚 Generate Professional Manuscript'
            )}
          </button>

          {generating && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>AI is analyzing:</strong>
                <br />• Smart contracts (.sol files)
                <br />• React components & pages
                <br />• API routes & endpoints
                <br />• Database schemas
                <br />• Enterprise features
                <br />
                <br />This may take 30-60 seconds for comprehensive manuscripts...
              </p>
            </div>
          )}
        </form>
      </div>

      {/* Preview */}
      <div>
        {manuscript ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Generated Manuscript
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(manuscript)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  📋 Copy
                </button>
                <button
                  onClick={() => downloadManuscript(manuscript, 'md')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  ⬇️ Markdown
                </button>
                <button
                  onClick={() => downloadManuscript(manuscript, 'txt')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  ⬇️ Text
                </button>
              </div>
            </div>

            {/* Metadata */}
            {metadata && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-bold text-gray-900 mb-2">📊 Manuscript Analytics</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Estimated Pages:</span>
                    <span className="ml-2 text-gray-900">{metadata.estimatedPages}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Word Count:</span>
                    <span className="ml-2 text-gray-900">{metadata.wordCount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Codebase LOC:</span>
                    <span className="ml-2 text-gray-900">{metadata.codebaseLOC.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Contracts:</span>
                    <span className="ml-2 text-gray-900">{metadata.contractsAnalyzed}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Components:</span>
                    <span className="ml-2 text-gray-900">{metadata.componentsAnalyzed}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">API Endpoints:</span>
                    <span className="ml-2 text-gray-900">{metadata.endpointsAnalyzed}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="prose prose-sm max-w-none bg-white border border-gray-200 p-6 rounded-lg overflow-auto max-h-[700px] shadow-inner">
              <div
                dangerouslySetInnerHTML={{
                  __html: marked.parse(manuscript, { async: false }) as string
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col justify-center items-center h-full text-gray-400">
            <svg
              className="w-24 h-24 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <p className="text-lg font-medium mb-2">No Manuscript Generated Yet</p>
            <p className="text-sm text-center max-w-md">
              Fill out the form and click "Generate Professional Manuscript" to create
              a comprehensive 25-300 page technical document about any aspect of the AXIOM platform.
            </p>
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
              <p className="text-sm text-blue-800">
                <strong>🤖 AI-Powered Platform Scanner:</strong>
                <br />The generator will automatically scan your entire codebase including:
                smart contracts, React components, API routes, database schemas,
                and all enterprise features to create professional documentation.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManuscriptGenerator;
