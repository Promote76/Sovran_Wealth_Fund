import RoadmapTimeline from "../components/RoadmapTimeline";

const milestones = [
  { title: "Phase 1: Foundation", date: "Q1 2025", description: "Core contracts, transparency dashboard, and reporting system.", status: "completed" },
  { title: "Phase 2: Expansion", date: "Q2 2025", description: "Real estate tokenization and institutional onboarding.", status: "in-progress" },
  { title: "Phase 3: Adoption", date: "Q3 2025", description: "Community rollout, Sovran Bank PMA integration.", status: "upcoming" },
];

export default function RoadmapPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-6">Roadmap</h1>
      <RoadmapTimeline milestones={milestones} />
    </div>
  );
}