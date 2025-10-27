import React from 'react';

export const SyndicationInfo: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-8">
        <h2 className="text-3xl font-bold mb-3">🤝 Co-Investment Syndication Portal</h2>
        <p className="text-blue-100 text-lg">
          Create and manage investment syndicates with institutional-grade waterfall distributions, 
          preferred returns, carried interest, and automated revenue sharing.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">What is Co-Investment Syndication?</h3>
        <p className="text-gray-700 mb-4">
          Co-investment syndication allows a lead investor to pool capital from multiple investors to 
          participate in larger real estate deals. The platform handles complex distribution structures, 
          investor management, and automated profit sharing according to customizable waterfall terms.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl mb-2">💼</div>
            <h4 className="font-semibold text-gray-900 mb-2">Access Larger Deals</h4>
            <p className="text-sm text-gray-600">
              Pool capital to invest in properties that would be out of reach individually
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl mb-2">📊</div>
            <h4 className="font-semibold text-gray-900 mb-2">Professional Structure</h4>
            <p className="text-sm text-gray-600">
              Institutional-grade waterfall distributions with preferred returns and carried interest
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl mb-2">⚡</div>
            <h4 className="font-semibold text-gray-900 mb-2">Automated Management</h4>
            <p className="text-sm text-gray-600">
              Automatic revenue distribution, investor reporting, and compliance tracking
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">How It Works</h3>
        
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Create a Syndicate</h4>
              <p className="text-gray-600">
                Define your investment strategy, target raise amount, minimum commitments, and waterfall structure. 
                Choose between deal-specific syndicates (single property), blind pools (multiple opportunities), 
                or permanent funds.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Configure Waterfall Terms</h4>
              <p className="text-gray-600">
                Set up multi-tier distribution structures with preferred returns, catch-up provisions, and 
                carried interest. Define how profits flow to investors and sponsors at different return thresholds.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Invite Co-Investors</h4>
              <p className="text-gray-600">
                Send personalized invitations to qualified investors. Track invitation status, commitments, 
                and manage your investor roster with built-in compliance checks.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
              4
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Automated Distribution</h4>
              <p className="text-gray-600">
                When the property generates income or is sold, the platform automatically calculates and 
                distributes proceeds according to your waterfall terms. All distributions are tracked and 
                reported for tax purposes.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Syndicate Types</h3>
        
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Deal-Specific Syndicate</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Best for: Single property acquisitions with clear exit timelines
                </p>
                <p className="text-sm text-gray-600">
                  Raise capital for a specific property or portfolio. Investors know exactly what they're 
                  investing in before committing. The syndicate dissolves when the property is sold.
                </p>
                <div className="mt-2 text-sm text-blue-600 font-medium">
                  Example: $2M raise for a 24-unit apartment building in downtown Chicago
                </div>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Blind Pool Syndicate</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Best for: Opportunistic investing with experienced operators
                </p>
                <p className="text-sm text-gray-600">
                  Raise capital based on your investment thesis and track record. Deploy across multiple 
                  deals that meet your criteria. Investors commit based on trust in the lead investor.
                </p>
                <div className="mt-2 text-sm text-purple-600 font-medium">
                  Example: $10M blind pool for value-add multifamily in Sun Belt markets
                </div>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Permanent Fund</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Best for: Long-term wealth building with continuous deployment
                </p>
                <p className="text-sm text-gray-600">
                  Evergreen structure that continuously raises capital and deploys into deals. Investors 
                  can enter and exit at predetermined intervals (quarterly or annually).
                </p>
                <div className="mt-2 text-sm text-green-600 font-medium">
                  Example: Perpetual fund targeting 12-15% IRR with quarterly liquidity windows
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Understanding Waterfall Structures</h3>
        
        <p className="text-gray-700 mb-6">
          A waterfall distribution defines how profits are split between investors and sponsors at different 
          levels of returns. The platform supports four professional structures:
        </p>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">🔹 Tiered Distribution</h4>
            <p className="text-sm text-gray-700 mb-3">
              Profits are split differently at various return thresholds, incentivizing performance.
            </p>
            <div className="bg-white rounded p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Tier 1 (0-8% return):</span>
                <span className="font-medium">100% to investors</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tier 2 (8-15% return):</span>
                <span className="font-medium">80% investors / 20% sponsor</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tier 3 (15%+ return):</span>
                <span className="font-medium">70% investors / 30% sponsor</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">🔹 Preferred Return (Pref)</h4>
            <p className="text-sm text-gray-700 mb-3">
              Investors receive a minimum return before sponsors participate in profits.
            </p>
            <div className="bg-white rounded p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Until 8% IRR:</span>
                <span className="font-medium">100% to investors</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Above 8% IRR:</span>
                <span className="font-medium">80% investors / 20% sponsor</span>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Most common structure. Protects investors with guaranteed minimum return.
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">🔹 Carried Interest (Carry)</h4>
            <p className="text-sm text-gray-700 mb-3">
              Sponsor earns a performance fee (carry) on profits above the preferred return.
            </p>
            <div className="bg-white rounded p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Return of capital:</span>
                <span className="font-medium">100% to investors</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">8% preferred return:</span>
                <span className="font-medium">100% to investors</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Remaining profits:</span>
                <span className="font-medium">20% carry to sponsor</span>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">🔹 Catch-Up Provision</h4>
            <p className="text-sm text-gray-700 mb-3">
              After preferred return, sponsor gets 100% of next profits until reaching their target carry percentage.
            </p>
            <div className="bg-white rounded p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">8% pref to investors:</span>
                <span className="font-medium">100% to investors</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Catch-up phase:</span>
                <span className="font-medium">100% to sponsor until 20/80 split</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Thereafter:</span>
                <span className="font-medium">80% investors / 20% sponsor</span>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Accelerates sponsor compensation for high-performing deals.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Key Terms & Definitions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-semibold text-gray-900 mb-1">Target Raise</h4>
            <p className="text-sm text-gray-600">
              The total amount of capital the syndicate aims to raise from all investors combined.
            </p>
          </div>

          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-semibold text-gray-900 mb-1">Minimum Commitment</h4>
            <p className="text-sm text-gray-600">
              The smallest investment amount an individual investor can contribute to the syndicate.
            </p>
          </div>

          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-semibold text-gray-900 mb-1">Maximum Commitment</h4>
            <p className="text-sm text-gray-600">
              The largest amount any single investor can contribute, ensuring diversified ownership.
            </p>
          </div>

          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-semibold text-gray-900 mb-1">Lead Investor</h4>
            <p className="text-sm text-gray-600">
              The person or entity who creates the syndicate, sources the deal, and manages operations.
            </p>
          </div>

          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-semibold text-gray-900 mb-1">Preferred Return (Pref)</h4>
            <p className="text-sm text-gray-600">
              A minimum return investors receive before the sponsor participates in profits, typically 6-10% annually.
            </p>
          </div>

          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-semibold text-gray-900 mb-1">Carried Interest (Carry)</h4>
            <p className="text-sm text-gray-600">
              The sponsor's share of profits above the preferred return, typically 15-25% of excess returns.
            </p>
          </div>

          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-semibold text-gray-900 mb-1">Waterfall Distribution</h4>
            <p className="text-sm text-gray-600">
              The sequential order in which profits are distributed to investors and sponsors at different return levels.
            </p>
          </div>

          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-semibold text-gray-900 mb-1">IRR (Internal Rate of Return)</h4>
            <p className="text-sm text-gray-600">
              The annualized rate of return on the investment, accounting for timing of cash flows.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Best Practices</h3>
        
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-shrink-0 text-green-600 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-gray-900">Set Realistic Minimum Commitments</h4>
              <p className="text-sm text-gray-600">
                Balance accessibility with fundraising efficiency. $10,000-$50,000 is common for most syndicates.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 text-green-600 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-gray-900">Align Interests with Preferred Returns</h4>
              <p className="text-sm text-gray-600">
                An 8% preferred return aligns sponsor and investor interests, ensuring sponsors focus on performance.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 text-green-600 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-gray-900">Use Clear, Simple Structures</h4>
              <p className="text-sm text-gray-600">
                Complex waterfalls can confuse investors. Start with a simple preferred return + carry structure.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 text-green-600 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-gray-900">Provide Detailed Deal Information</h4>
              <p className="text-sm text-gray-600">
                Include property details, market analysis, financial projections, and exit strategy in your description.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 text-green-600 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-gray-900">Set Appropriate Visibility</h4>
              <p className="text-sm text-gray-600">
                Use "Private" for invite-only deals with accredited investors. Use "Public" for broader marketing.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 text-green-600 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-gray-900">Maintain Regular Communication</h4>
              <p className="text-sm text-gray-600">
                Send quarterly updates on property performance, distributions, and market conditions.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6">
        <h3 className="text-2xl font-bold mb-3">Ready to Create Your First Syndicate?</h3>
        <p className="text-blue-100 mb-4">
          Start by clicking the "Create Syndicate" button in the Syndicate Manager tab. 
          Follow the guided form to set up your investment structure and start raising capital.
        </p>
        <div className="flex gap-4">
          <div className="bg-white/20 rounded-lg p-3 text-sm">
            <div className="font-semibold mb-1">Need Help?</div>
            <div className="text-blue-100">Contact support for personalized assistance</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3 text-sm">
            <div className="font-semibold mb-1">Legal Compliance</div>
            <div className="text-blue-100">Ensure all offerings comply with securities regulations</div>
          </div>
        </div>
      </div>
    </div>
  );
};
