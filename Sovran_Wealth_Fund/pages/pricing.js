export default function Pricing() {
  const tiers = [
    { name: "Basic", price: "$0", features: ["View Transparency Reports", "Basic Analytics"] },
    { name: "Investor", price: "$99/mo", features: ["All Reports", "Download Data", "Priority Support"] },
    { name: "Institutional", price: "Custom", features: ["Custom Integrations", "Audit Data Access", "Dedicated Liaison"] },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-6">Pricing</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((t, i) => (
          <div key={i} className="border rounded-lg shadow-sm p-6 text-center">
            <h2 className="text-xl font-semibold">{t.name}</h2>
            <p className="text-2xl font-bold mb-4">{t.price}</p>
            <ul className="text-gray-600 space-y-2">
              {t.features.map((f, j) => <li key={j}>• {f}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}