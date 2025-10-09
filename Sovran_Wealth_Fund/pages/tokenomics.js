import TokenomicsPieChart from "../components/TokenomicsPieChart";

const data = [
  { name: "Community", value: 50 },
  { name: "Treasury", value: 20 },
  { name: "Team", value: 15 },
  { name: "Advisors", value: 10 },
  { name: "Liquidity", value: 5 },
];

export default function TokenomicsPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-6">Tokenomics</h1>
      <TokenomicsPieChart data={data} />
    </div>
  );
}