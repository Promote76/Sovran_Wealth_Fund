import React, { useState } from 'react';

interface ComplianceFramework {
  title: string;
  description: string;
  status: 'Compliant' | 'In Progress' | 'Planned' | 'Under Review';
  details: string[];
  lastUpdated: string;
}

interface LegalDocument {
  title: string;
  type: string;
  lastUpdated: string;
  version: string;
  description: string;
}

const CompliancePage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'overview' | 'frameworks' | 'documents' | 'reports'>('overview');

  const complianceFrameworks: ComplianceFramework[] = [
    {
      title: 'Know Your Customer (KYC)',
      description: 'User identity verification and anti-money laundering procedures',
      status: 'Compliant',
      details: [
        'Multi-tier identity verification system implemented',
        'Document verification with real-time validation',
        'Enhanced due diligence for high-risk users',
        'Ongoing monitoring and periodic re-verification',
        'Integration with leading KYC service providers'
      ],
      lastUpdated: 'January 15, 2025'
    },
    {
      title: 'Anti-Money Laundering (AML)',
      description: 'Comprehensive AML program to prevent financial crimes',
      status: 'Compliant',
      details: [
        'Transaction monitoring and suspicious activity reporting',
        'Risk-based customer due diligence procedures',
        'Sanctions screening against global watchlists',
        'Regular AML training for all personnel',
        'Independent AML compliance officer appointed'
      ],
      lastUpdated: 'January 10, 2025'
    },
    {
      title: 'General Data Protection Regulation (GDPR)',
      description: 'EU data protection and privacy compliance',
      status: 'Compliant',
      details: [
        'Privacy-by-design architecture implementation',
        'User consent management system',
        'Data subject rights fulfillment procedures',
        'Regular data protection impact assessments',
        'GDPR-compliant data processing agreements'
      ],
      lastUpdated: 'December 20, 2024'
    },
    {
      title: 'Securities Regulations',
      description: 'Compliance with global securities and investment laws',
      status: 'Under Review',
      details: [
        'Token classification analysis under various jurisdictions',
        'Investment adviser registration evaluation',
        'Disclosure requirements for tokenized assets',
        'Accredited investor verification procedures',
        'Cross-border offering compliance assessment'
      ],
      lastUpdated: 'January 5, 2025'
    },
    {
      title: 'Financial Action Task Force (FATF)',
      description: 'Compliance with international money laundering standards',
      status: 'In Progress',
      details: [
        'Travel Rule implementation for crypto transactions',
        'Virtual Asset Service Provider (VASP) registration',
        'Cross-border transaction reporting procedures',
        'Enhanced customer due diligence for high-risk jurisdictions',
        'Beneficial ownership identification requirements'
      ],
      lastUpdated: 'January 8, 2025'
    },
    {
      title: 'Operational Risk Management',
      description: 'Comprehensive risk management framework',
      status: 'Compliant',
      details: [
        'Business continuity and disaster recovery plans',
        'Cybersecurity framework implementation',
        'Third-party risk management procedures',
        'Regular internal risk assessments',
        'Board-level risk oversight and reporting'
      ],
      lastUpdated: 'January 12, 2025'
    }
  ];

  const legalDocuments: LegalDocument[] = [
    {
      title: 'Terms of Service',
      type: 'Legal Agreement',
      lastUpdated: 'January 15, 2025',
      version: '2.1',
      description: 'Comprehensive terms governing platform usage and user obligations'
    },
    {
      title: 'Privacy Policy',
      type: 'Privacy Document',
      lastUpdated: 'January 15, 2025',
      version: '2.0',
      description: 'Detailed privacy practices and data handling procedures'
    },
    {
      title: 'Risk Disclosure Statement',
      type: 'Risk Document',
      lastUpdated: 'January 10, 2025',
      version: '1.5',
      description: 'Comprehensive risk warnings for DeFi and crypto investments'
    },
    {
      title: 'AML/CTF Policy',
      type: 'Compliance Policy',
      lastUpdated: 'January 8, 2025',
      version: '1.3',
      description: 'Anti-money laundering and counter-terrorism financing procedures'
    },
    {
      title: 'Data Protection Policy',
      type: 'Privacy Policy',
      lastUpdated: 'December 20, 2024',
      version: '1.2',
      description: 'GDPR-compliant data protection and privacy procedures'
    },
    {
      title: 'Cookie Policy',
      type: 'Privacy Document',
      lastUpdated: 'December 15, 2024',
      version: '1.1',
      description: 'Website cookie usage and user tracking disclosure'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Compliant':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Under Review':
        return 'bg-yellow-100 text-yellow-800';
      case 'Planned':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Compliant':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'In Progress':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'Under Review':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Regulatory Compliance</h1>
            <p className="text-xl text-gray-100 max-w-3xl mx-auto">
              Comprehensive compliance framework ensuring regulatory adherence across all jurisdictions
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Compliance Overview' },
                { id: 'frameworks', label: 'Regulatory Frameworks' },
                { id: 'documents', label: 'Legal Documents' },
                { id: 'reports', label: 'Compliance Reports' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeSection === tab.id
                      ? 'border-gray-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Section */}
        {activeSection === 'overview' && (
          <div className="space-y-8">
            {/* Compliance Summary */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Compliance Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">4</div>
                  <div className="text-sm text-gray-600 mt-1">Compliant Frameworks</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">1</div>
                  <div className="text-sm text-gray-600 mt-1">In Progress</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-600">1</div>
                  <div className="text-sm text-gray-600 mt-1">Under Review</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">95%</div>
                  <div className="text-sm text-gray-600 mt-1">Overall Compliance</div>
                </div>
              </div>
            </div>

            {/* Key Highlights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Compliance Updates</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">KYC System Enhancement</p>
                      <p className="text-xs text-gray-500">January 15, 2025</p>
                      <p className="text-sm text-gray-600 mt-1">Enhanced identity verification with biometric authentication</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">GDPR Compliance Audit</p>
                      <p className="text-xs text-gray-500">January 10, 2025</p>
                      <p className="text-sm text-gray-600 mt-1">Annual GDPR compliance review completed successfully</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Securities Review Initiated</p>
                      <p className="text-xs text-gray-500">January 5, 2025</p>
                      <p className="text-sm text-gray-600 mt-1">Comprehensive securities law compliance review in progress</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Regulatory Contacts</h3>
                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900">Chief Compliance Officer</h4>
                    <p className="text-sm text-gray-600">compliance@sovranwealthfund.org</p>
                    <p className="text-xs text-gray-500 mt-1">Primary regulatory liaison</p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900">Legal Department</h4>
                    <p className="text-sm text-gray-600">legal@sovranwealthfund.org</p>
                    <p className="text-xs text-gray-500 mt-1">Legal inquiries and document requests</p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900">Data Protection Officer</h4>
                    <p className="text-sm text-gray-600">privacy@sovranwealthfund.org</p>
                    <p className="text-xs text-gray-500 mt-1">Privacy and data protection matters</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Frameworks Section */}
        {activeSection === 'frameworks' && (
          <div className="space-y-6">
            {complianceFrameworks.map((framework, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    {getStatusIcon(framework.status)}
                    <h3 className="text-lg font-bold text-gray-900 ml-3">{framework.title}</h3>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(framework.status)}`}>
                    {framework.status}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{framework.description}</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Implementation Details</h4>
                    <ul className="space-y-1">
                      {framework.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="text-sm text-gray-600 flex items-start">
                          <span className="text-gray-400 mr-2">•</span>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Last Updated</p>
                      <p className="text-sm font-medium text-gray-900">{framework.lastUpdated}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Documents Section */}
        {activeSection === 'documents' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Legal Documents Repository</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {legalDocuments.map((document, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{document.title}</h4>
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                        v{document.version}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{document.description}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">{document.type}</p>
                        <p className="text-xs text-gray-500">Updated: {document.lastUpdated}</p>
                      </div>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        View Document
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Document Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">6</div>
                  <div className="text-sm text-gray-600 mt-1">Active Documents</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">100%</div>
                  <div className="text-sm text-gray-600 mt-1">Up to Date</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">Q1</div>
                  <div className="text-sm text-gray-600 mt-1">Next Review</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports Section */}
        {activeSection === 'reports' && (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Compliance Reports</h3>
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Annual Compliance Report 2024</h4>
                      <p className="text-sm text-gray-600">Comprehensive compliance review and assessment</p>
                      <p className="text-xs text-gray-500 mt-1">Generated: January 15, 2025</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View</button>
                      <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">Download</button>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Q4 2024 AML Report</h4>
                      <p className="text-sm text-gray-600">Anti-money laundering monitoring and reporting</p>
                      <p className="text-xs text-gray-500 mt-1">Generated: January 10, 2025</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View</button>
                      <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">Download</button>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">GDPR Compliance Audit 2024</h4>
                      <p className="text-sm text-gray-600">Data protection and privacy compliance assessment</p>
                      <p className="text-xs text-gray-500 mt-1">Generated: December 20, 2024</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View</button>
                      <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">Download</button>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Operational Risk Assessment 2024</h4>
                      <p className="text-sm text-gray-600">Comprehensive operational risk evaluation and mitigation</p>
                      <p className="text-xs text-gray-500 mt-1">Generated: December 15, 2024</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View</button>
                      <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">Download</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Regulatory Submissions</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-green-900">All regulatory filings current</p>
                    <p className="text-sm text-green-700">No pending submissions or overdue reports</p>
                  </div>
                  <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Upcoming Compliance Deadlines</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Q1 2025 AML Report</p>
                    <p className="text-sm text-gray-600">Due: April 15, 2025</p>
                  </div>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Scheduled</span>
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Annual GDPR Review</p>
                    <p className="text-sm text-gray-600">Due: December 31, 2025</p>
                  </div>
                  <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">Planned</span>
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Securities Registration Review</p>
                    <p className="text-sm text-gray-600">Due: TBD (pending legal analysis)</p>
                  </div>
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Under Review</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
  );
};

export default CompliancePage;