"use client";

interface StatCardsProps {
  metrics: {
    totalFloats: number;
    totalProjects: number;
    totalZones: number;
    anomaliesDetected: number;
  } | null;
}

export function StatCards({ metrics }: StatCardsProps) {
  const cards = [
    { title: 'Active ARGO Floats', value: metrics?.totalFloats ?? '-', icon: '📡', color: 'from-blue-500/20 to-cyan-500/5', border: 'border-blue-500/30' },
    { title: 'Planned Projects', value: metrics?.totalProjects ?? '-', icon: '🏗️', color: 'from-emerald-500/20 to-teal-500/5', border: 'border-emerald-500/30' },
    { title: 'Protected Zones', value: metrics?.totalZones ?? '-', icon: '🛡️', color: 'from-purple-500/20 to-pink-500/5', border: 'border-purple-500/30' },
    { title: 'Recent Anomalies', value: metrics?.anomaliesDetected ?? '-', icon: '⚠️', color: 'from-red-500/20 to-orange-500/5', border: 'border-red-500/30' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, i) => (
        <div key={i} className={`rounded-2xl p-6 bg-gradient-to-br ${card.color} border ${card.border} backdrop-blur-xl transition-all duration-300 hover:scale-[1.02]`}>
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-slate-300">{card.title}</h3>
            <span className="text-2xl">{card.icon}</span>
          </div>
          <div className="text-4xl font-bold text-white tracking-tight">
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}
