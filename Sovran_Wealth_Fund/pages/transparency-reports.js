import TransparencyReportsTable from "../components/TransparencyReportsTable";
import ProofOfReserves from "../components/ProofOfReserves";
import ReservesSummary from "../components/ReservesSummary";
import ReservesHistoryChart from "../components/ReservesHistoryChart";
import GrowthMetric from "../components/GrowthMetric";
import ExportButtons from "../components/ExportButtons";
import DownloadPDF from "../components/DownloadPDF";

export default function TransparencyReportsPage() {
  const investor = { email: null, code: null }; // Replace with session data if needed

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8">Transparency Reports</h1>
      <ReservesSummary fetchUrl="/api/reports/proof-of-reserves" />
      <GrowthMetric fetchUrl="/api/reports/reserves-history" />
      <ReservesHistoryChart fetchUrl="/api/reports/reserves-history" />
      <ExportButtons fetchUrl="/api/reports/reserves-history" />
      <DownloadPDF email={investor.email} code={investor.code} />
      <ProofOfReserves fetchUrl="/api/reports/proof-of-reserves" />
      <TransparencyReportsTable fetchReportsUrl="/api/reports/transparency-reports" />
    </div>
  );
}