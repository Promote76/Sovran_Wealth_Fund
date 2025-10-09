export default function Team() {
  const members = [
    { name: "Clarence Fuqua Bey", role: "Founder & Visionary" },
    { name: "Advisory Council", role: "Blockchain, Real Estate, and Compliance Experts" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-6">Our Team</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {members.map((m, i) => (
          <div key={i} className="border rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold">{m.name}</h2>
            <p className="text-gray-600">{m.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
}