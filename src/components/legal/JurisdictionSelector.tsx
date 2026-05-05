"use client";

const JURISDICTIONS = [
  { id: 'All', name: 'Global / All Jurisdictions' },
  { id: 'India', name: 'India (CRZ, EPA, WPA)' },
  { id: 'United Nations', name: 'United Nations (UNCLOS)' },
  { id: 'International', name: 'International Treaties (CBD, MARPOL)' }
];

export function JurisdictionSelector({ 
  selected, 
  onChange 
}: { 
  selected: string, 
  onChange: (j: string) => void 
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {JURISDICTIONS.map(j => (
        <button
          key={j.id}
          onClick={() => onChange(j.id)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
            selected === j.id 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' 
              : 'bg-white/[0.05] text-slate-400 border-white/[0.1] hover:bg-white/[0.1] hover:text-white'
          }`}
        >
          {j.name}
        </button>
      ))}
    </div>
  );
}
