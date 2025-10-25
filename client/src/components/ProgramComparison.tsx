import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

interface ProgramComparisonProps {
  onClose?: () => void;
}

export const ProgramComparison: React.FC<ProgramComparisonProps> = ({ onClose }) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          📊 KeyGrow vs Real Estate Investor
        </h1>
        <p className="text-xl text-gray-600 max-w-4xl mx-auto">
          Two powerful pathways to real estate ownership. Choose the right program for your goals, 
          or use both together to accelerate your wealth building.
        </p>
      </div>

      {/* Quick Comparison Table */}
      <Card className="border-2 border-blue-500">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle className="text-2xl">🔍 Quick Comparison</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="p-4 font-bold text-gray-700">Feature</th>
                  <th className="p-4 font-bold text-green-700 bg-green-50">🏠 KeyGrow Rent-to-Own</th>
                  <th className="p-4 font-bold text-blue-700 bg-blue-50">🏢 Real Estate Investor</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="p-4 font-semibold">Best For</td>
                  <td className="p-4 bg-green-50">Renters wanting to own their first home</td>
                  <td className="p-4 bg-blue-50">Investors wanting rental income & appreciation</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="p-4 font-semibold">Entry Cost</td>
                  <td className="p-4 bg-green-50"><strong>$500 one-time</strong> enrollment fee</td>
                  <td className="p-4 bg-blue-50"><strong>0.05 BNB minimum</strong> (~$30) per property</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="p-4 font-semibold">Your Property</td>
                  <td className="p-4 bg-green-50">You choose YOUR dream home</td>
                  <td className="p-4 bg-blue-50">Invest in properties listed by others</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="p-4 font-semibold">Ownership</td>
                  <td className="p-4 bg-green-50"><strong>100% ownership</strong> after 24 months</td>
                  <td className="p-4 bg-blue-50"><strong>Fractional ownership</strong> based on investment</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="p-4 font-semibold">Monthly Benefit</td>
                  <td className="p-4 bg-green-50">Allocations toward YOUR down payment</td>
                  <td className="p-4 bg-blue-50">Rental income from tenants (claimable anytime)</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="p-4 font-semibold">Timeline</td>
                  <td className="p-4 bg-green-50"><strong>24-month program</strong> to homeownership</td>
                  <td className="p-4 bg-blue-50"><strong>Ongoing</strong> - hold as long as you want</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="p-4 font-semibold">Income Source</td>
                  <td className="p-4 bg-green-50">20% of platform revenue split among renters</td>
                  <td className="p-4 bg-blue-50">Tenant rent payments (proportional to shares)</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="p-4 font-semibold">Property Value</td>
                  <td className="p-4 bg-green-50">Typical: $150K-$300K (single-family homes)</td>
                  <td className="p-4 bg-blue-50">Any size: $50K-$5M+ (apartments, farms, commercial)</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="p-4 font-semibold">Flexibility</td>
                  <td className="p-4 bg-green-50">Move in & own YOUR home</td>
                  <td className="p-4 bg-blue-50">Diversify across multiple properties</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="p-4 font-semibold">Exit Strategy</td>
                  <td className="p-4 bg-green-50">Live in it, sell it, or rent it out</td>
                  <td className="p-4 bg-blue-50">Receive share of sale proceeds when property sells</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Breakdown */}
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* KeyGrow Program */}
        <Card className="border-4 border-green-500">
          <CardHeader className="bg-gradient-to-br from-green-600 to-green-700 text-white">
            <CardTitle className="text-2xl">🏠 KeyGrow 2-Year Rent-to-Own</CardTitle>
            <p className="text-green-100 mt-2">Your path from renting to owning YOUR home</p>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">💡 How It Works</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li><strong>Pay $500</strong> one-time enrollment (Stripe or BNB)</li>
                <li><strong>Choose your tier</strong> (Bronze, Silver, Gold, Platinum)</li>
                <li><strong>Receive monthly allocations</strong> from platform revenue (20% split)</li>
                <li><strong>Track your progress</strong> toward down payment goal</li>
                <li><strong>Select your property</strong> with personalized coaching</li>
                <li><strong>Close in 24 months</strong> and move into YOUR home</li>
              </ol>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-bold text-green-800 mb-2">💰 Monthly Allocations</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Bronze (1.0x): Standard share</li>
                <li>• Silver (1.25x): 25% more per month</li>
                <li>• Gold (1.5x): 50% more per month</li>
                <li>• Platinum (2.0x): 2x the allocations</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">✅ Best For</h3>
              <ul className="space-y-1 text-gray-700">
                <li>✓ Currently renting and want to own</li>
                <li>✓ Struggling to save for down payment</li>
                <li>✓ First-time homebuyers</li>
                <li>✓ Need coaching & support</li>
                <li>✓ Want YOUR own place in 2 years</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-lg">
              <h4 className="font-bold text-yellow-800 mb-1">📍 Example Use Case</h4>
              <p className="text-sm text-gray-700">
                <strong>Sarah</strong> pays $1,500/month rent. She enrolls in KeyGrow (Platinum tier), 
                receives $400/month in allocations, saves $300 herself = <strong>$700/month toward 
                down payment</strong>. After 24 months: <strong>$16,800 saved</strong> = 20% down on 
                an $84,000 home or 10% on a $168,000 home.
              </p>
            </div>

            <Button 
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
              onClick={() => {
                navigate('/keygrow-dashboard');
                if (onClose) onClose();
              }}
            >
              🏠 Join KeyGrow Program
            </Button>
          </CardContent>
        </Card>

        {/* Real Estate Investor */}
        <Card className="border-4 border-blue-500">
          <CardHeader className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
            <CardTitle className="text-2xl">🏢 Real Estate Investor</CardTitle>
            <p className="text-blue-100 mt-2">Fractional ownership • Rental income • Appreciation</p>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">💡 How It Works</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li><strong>Browse properties</strong> - Single-family, farms, apartments, commercial</li>
                <li><strong>Invest as little as 0.05 BNB</strong> (~$30) per property</li>
                <li><strong>Receive rental income</strong> monthly (proportional to shares)</li>
                <li><strong>Benefit from appreciation</strong> as property value increases</li>
                <li><strong>Diversify</strong> across multiple properties</li>
                <li><strong>Exit anytime</strong> or hold long-term</li>
              </ol>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-bold text-blue-800 mb-2">💰 5 Earning Mechanisms</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• <strong>Rental Income</strong> - Monthly distributions</li>
                <li>• <strong>Property Appreciation</strong> - Value increases</li>
                <li>• <strong>Portfolio Diversification</strong> - Spread risk</li>
                <li>• <strong>Exit Profits</strong> - Share in sale proceeds</li>
                <li>• <strong>Low Entry Barrier</strong> - Start with $30</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">✅ Best For</h3>
              <ul className="space-y-1 text-gray-700">
                <li>✓ Building passive income portfolio</li>
                <li>✓ Want rental income NOW</li>
                <li>✓ Diversifying across properties</li>
                <li>✓ Can't afford full property alone</li>
                <li>✓ Accessing large commercial deals</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-lg">
              <h4 className="font-bold text-yellow-800 mb-1">📍 Example Use Case</h4>
              <p className="text-sm text-gray-700">
                <strong>John</strong> invests 1 BNB (~$600) in a $5M Tennessee farm (346 acres). 
                He owns 0.012% of the property. Farm rents for $15K/month. John receives 
                <strong> ~$1.80/month rental income</strong> + appreciation as land value rises. 
                He invests in 10 more properties = diversified real estate portfolio.
              </p>
            </div>

            <Button 
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              onClick={() => {
                navigate('/real-estate-investor');
                if (onClose) onClose();
              }}
            >
              🏢 Browse Investment Properties
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Combined Strategy */}
      <Card className="border-4 border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="text-2xl text-purple-900">🚀 The Ultimate Strategy: Use BOTH Together</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg text-gray-700">
            Smart wealth builders combine <strong>KeyGrow</strong> (homeownership goal) with 
            <strong> Real Estate Investor</strong> (passive income) for maximum results.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg border border-purple-300">
              <h4 className="font-bold text-purple-900 mb-2">📈 Strategy 1: "Accelerate Your Down Payment"</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                <li>Join KeyGrow ($500) - Start receiving allocations</li>
                <li>Invest 1-2 BNB in RE Investor properties</li>
                <li>Use rental income to boost your down payment savings</li>
                <li>Reach homeownership 30-50% faster</li>
              </ol>
            </div>

            <div className="bg-white p-4 rounded-lg border border-purple-300">
              <h4 className="font-bold text-purple-900 mb-2">🏆 Strategy 2: "Own + Invest"</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                <li>Complete KeyGrow - Own your primary home</li>
                <li>No more rent payments = extra cash flow</li>
                <li>Invest savings into RE Investor properties</li>
                <li>Build passive income portfolio while living in YOUR home</li>
              </ol>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-100 to-blue-100 p-6 rounded-lg text-center">
            <p className="text-2xl font-bold text-gray-900 mb-2">
              💡 KeyGrow Allocations + RE Investor Income = Financial Freedom
            </p>
            <p className="text-gray-700">
              Stop paying rent forever. Build equity in YOUR home. Earn passive income from rentals. 
              Diversify across multiple properties. This is how generational wealth is built.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Property Size Guidance */}
      <Card className="border-2 border-gray-300">
        <CardHeader>
          <CardTitle className="text-xl">🏘️ Which Program for Which Property?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-bold text-green-800">KeyGrow = Your Primary Residence</h4>
              <p className="text-sm text-gray-700 mt-1">
                <strong>Ideal for:</strong> $100K-$400K single-family homes, condos, townhouses where YOU will live
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Examples: 3BR/2BA house ($200K), 2BR condo ($150K), 4BR family home ($350K)
              </p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-bold text-blue-800">RE Investor = Income-Producing Property</h4>
              <p className="text-sm text-gray-700 mt-1">
                <strong>Ideal for:</strong> ANY property that generates rental income (houses, apartments, farms, commercial)
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Examples: $50K duplex, $5M Tennessee farm (346 acres), $2M apartment building, $800K retail space
              </p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-300">
              <p className="text-sm text-gray-800">
                <strong>💡 Pro Tip:</strong> That $5M Tennessee farm is perfect for <strong>Real Estate Investor</strong> 
                (fractional crowdfunding), NOT KeyGrow. Submit it as an investment property, invite others to co-invest, 
                collect rental income from tenants. Meanwhile, use KeyGrow to buy YOUR personal home to live in.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="text-center space-y-4">
        <h3 className="text-2xl font-bold text-gray-900">Ready to Get Started?</h3>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg"
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8"
            onClick={() => {
              navigate('/keygrow-dashboard');
              if (onClose) onClose();
            }}
          >
            🏠 Join KeyGrow ($500)
          </Button>
          <Button 
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8"
            onClick={() => {
              navigate('/real-estate-investor');
              if (onClose) onClose();
            }}
          >
            🏢 Browse Properties (Start at $30)
          </Button>
        </div>
      </div>

      {onClose && (
        <div className="text-center">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      )}
    </div>
  );
};
