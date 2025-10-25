import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { marked } from 'marked';

interface Script {
  id: string;
  title: string;
  filename: string;
  duration: string;
  audience: string;
  style: string;
  preview: string;
}

interface Template {
  name: string;
  duration: string;
  purpose: string;
  structure: string;
}

interface MarketingHubPageProps {
  standalone?: boolean;
}

const MarketingHubPage: React.FC<MarketingHubPageProps> = ({ standalone = true }) => {
  const [activeTab, setActiveTab] = useState<'library' | 'generator'>('library');
  const [scripts, setScripts] = useState<Script[]>([]);
  const [templates, setTemplates] = useState<Record<string, Template>>({});
  const [selectedScript, setSelectedScript] = useState<string | null>(null);
  const [scriptContent, setScriptContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const [formData, setFormData] = useState({
    template: 'explainer',
    topic: '',
    feature: '',
    duration: '',
    audience: '',
    tone: 'Professional and empowering',
    keyPoints: '',
    callToAction: ''
  });
  
  const [generatedScript, setGeneratedScript] = useState<string>('');

  useEffect(() => {
    fetchLibrary();
    fetchTemplates();
  }, []);

  const fetchLibrary = async () => {
    try {
      const response = await fetch('/api/marketing-scripts/library');
      const data = await response.json();
      if (data.success) {
        setScripts(data.scripts);
      }
    } catch (error) {
      console.error('Error fetching script library:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/marketing-scripts/templates');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const viewScript = async (filename: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/marketing-scripts/library/${filename}`);
      const data = await response.json();
      if (data.success) {
        setScriptContent(data.content);
        setSelectedScript(filename);
      }
    } catch (error) {
      console.error('Error fetching script:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateScript = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const response = await fetch('/api/marketing-scripts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      if (data.success) {
        setGeneratedScript(data.script);
      } else {
        alert('Error generating script: ' + data.error);
      }
    } catch (error) {
      console.error('Error generating script:', error);
      alert('Failed to generate script');
    } finally {
      setGenerating(false);
    }
  };

  const downloadScript = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    alert('Script copied to clipboard!');
  };

  const content = (
    <div className={standalone ? "min-h-screen bg-gradient-to-br from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8" : ""}>
      <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Marketing Hub
            </h1>
            <p className="text-xl text-gray-600">
              Professional video scripts for AXIOM platform marketing
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('library')}
                  className={`px-8 py-4 text-lg font-medium border-b-2 transition-colors ${
                    activeTab === 'library'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Script Library
                </button>
                <button
                  onClick={() => setActiveTab('generator')}
                  className={`px-8 py-4 text-lg font-medium border-b-2 transition-colors ${
                    activeTab === 'generator'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  AI Script Generator
                </button>
              </nav>
            </div>

            <div className="p-8">
              {activeTab === 'library' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      Available Scripts
                    </h2>
                    <div className="space-y-4">
                      {scripts.map((script) => (
                        <div
                          key={script.id}
                          className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedScript === script.filename
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                          onClick={() => viewScript(script.filename)}
                        >
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {script.title}
                          </h3>
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                            <div>
                              <span className="font-semibold">Duration:</span> {script.duration}
                            </div>
                            <div>
                              <span className="font-semibold">Style:</span> {script.style}
                            </div>
                            <div className="col-span-2">
                              <span className="font-semibold">Audience:</span> {script.audience}
                            </div>
                          </div>
                          <div className="text-blue-600 text-sm font-medium">
                            Click to view full script →
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    {selectedScript ? (
                      <>
                        <div className="flex justify-between items-center mb-6">
                          <h2 className="text-2xl font-bold text-gray-900">
                            Script Preview
                          </h2>
                          <div className="flex gap-2">
                            <button
                              onClick={() => copyToClipboard(scriptContent)}
                              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                              Copy
                            </button>
                            <button
                              onClick={() => downloadScript(scriptContent, selectedScript)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Download
                            </button>
                          </div>
                        </div>
                        {loading ? (
                          <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                          </div>
                        ) : (
                          <div className="prose max-w-none bg-gray-50 p-6 rounded-lg overflow-auto max-h-[600px]">
                            <div
                              dangerouslySetInnerHTML={{
                                __html: marked.parse(scriptContent, { async: false }) as string
                              }}
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col justify-center items-center h-64 text-gray-400">
                        <svg
                          className="w-20 h-20 mb-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <p className="text-lg">Select a script to preview</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      Generate Custom Script
                    </h2>
                    <form onSubmit={generateScript} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Script Template
                        </label>
                        <select
                          value={formData.template}
                          onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {Object.entries(templates).map(([key, template]) => (
                            <option key={key} value={key}>
                              {template.name} - {template.duration}
                            </option>
                          ))}
                        </select>
                        {formData.template && templates[formData.template] && (
                          <p className="mt-2 text-sm text-gray-600">
                            {templates[formData.template].purpose}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Topic / Title *
                        </label>
                        <input
                          type="text"
                          value={formData.topic}
                          onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                          placeholder="e.g., Why KeyGrow is Better Than Traditional Savings"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Feature Focus (Optional)
                        </label>
                        <input
                          type="text"
                          value={formData.feature}
                          onChange={(e) => setFormData({ ...formData, feature: e.target.value })}
                          placeholder="e.g., KeyGrow, Real Estate Investor, Staking"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Duration
                          </label>
                          <input
                            type="text"
                            value={formData.duration}
                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                            placeholder="e.g., 60 seconds"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tone
                          </label>
                          <select
                            value={formData.tone}
                            onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option>Professional and empowering</option>
                            <option>Casual and friendly</option>
                            <option>Technical and detailed</option>
                            <option>Emotional and inspiring</option>
                            <option>Fast-paced and energetic</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Target Audience
                        </label>
                        <input
                          type="text"
                          value={formData.audience}
                          onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                          placeholder="e.g., First-time crypto investors, Renters"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Key Points to Include (Optional)
                        </label>
                        <textarea
                          value={formData.keyPoints}
                          onChange={(e) => setFormData({ ...formData, keyPoints: e.target.value })}
                          placeholder="Comma-separated list of important points"
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Call to Action
                        </label>
                        <input
                          type="text"
                          value={formData.callToAction}
                          onChange={(e) => setFormData({ ...formData, callToAction: e.target.value })}
                          placeholder="e.g., Sign up today for free"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={generating}
                        className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg font-semibold"
                      >
                        {generating ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating Script...
                          </span>
                        ) : (
                          'Generate Script with AI'
                        )}
                      </button>
                    </form>
                  </div>

                  <div>
                    {generatedScript ? (
                      <>
                        <div className="flex justify-between items-center mb-6">
                          <h2 className="text-2xl font-bold text-gray-900">
                            Generated Script
                          </h2>
                          <div className="flex gap-2">
                            <button
                              onClick={() => copyToClipboard(generatedScript)}
                              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                              Copy
                            </button>
                            <button
                              onClick={() => downloadScript(generatedScript, 'generated-script.md')}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Download
                            </button>
                          </div>
                        </div>
                        <div className="prose max-w-none bg-gray-50 p-6 rounded-lg overflow-auto max-h-[600px]">
                          <div
                            dangerouslySetInnerHTML={{
                              __html: marked.parse(generatedScript, { async: false }) as string
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col justify-center items-center h-64 text-gray-400">
                        <svg
                          className="w-20 h-20 mb-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                        <p className="text-lg">Fill out the form and generate your script</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

        <div className="mt-12 bg-blue-50 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            About Marketing Hub
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
            <div>
              <h4 className="font-semibold mb-2">Script Library</h4>
              <p>
                Access professionally written video marketing scripts for all major AXIOM features.
                Each script includes voiceover dialogue, visual direction, production notes, and timing.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">AI Generator</h4>
              <p>
                Create custom marketing scripts instantly using AI. Choose a template, specify your
                requirements, and get a professional script tailored to your needs in seconds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return standalone ? <Layout>{content}</Layout> : content;
};

export default MarketingHubPage;
