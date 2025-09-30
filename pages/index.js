export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-5xl font-bold mb-6">Sovran Wealth Fund</h1>
      <p className="text-lg text-gray-700 mb-4">
        Building the first asset-backed DeFi platform with transparency, compliance,
        and real-world integration.
      </p>
      <ul className="list-disc pl-6 text-gray-700 space-y-2">
        <li>View <a href="/transparency-reports" className="text-indigo-600 hover:underline">Transparency Reports</a></li>
        <li>Learn more <a href="/about-us" className="text-indigo-600 hover:underline">About Us</a></li>
        <li>Check our <a href="/roadmap" className="text-indigo-600 hover:underline">Roadmap</a></li>
        <li>Review our <a href="/tokenomics" className="text-indigo-600 hover:underline">Tokenomics</a></li>
      </ul>
    </div>
  );
}