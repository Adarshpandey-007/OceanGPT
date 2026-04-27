"use client";
import dynamic from 'next/dynamic';
import { PlotPanel } from './visualizations/PlotPanel';
import { TablePanel } from './visualizations/TablePanel';
import MapErrorBoundary from './ui/MapErrorBoundary';

const MapPanel = dynamic(() => import('./visualizations/MapPanel').then(m => ({ default: m.MapPanel })), { 
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-floatchat-primary flex items-center justify-center">
      <div className="text-sm text-slate-500 animate-pulse">Loading map...</div>
    </div>
  )
});

export function VisualizationTabs({ activeTab, onChange }: { activeTab: 'map' | 'plot' | 'table' | 'none'; onChange: (t: any) => void }) {
  const tabs: { key: 'map' | 'plot' | 'table'; label: string }[] = [
    { key: 'map', label: 'Map' },
    { key: 'plot', label: 'Plot' },
    { key: 'table', label: 'Table' }
  ];
  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 border-b border-white/[0.08] px-4 py-2 bg-floatchat-primary/80 backdrop-blur-lg">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`px-4 py-1.5 text-sm rounded-full border transition-all ${
              activeTab === t.key 
                ? 'bg-cyan-400 text-slate-900 border-cyan-400 font-medium' 
                : 'bg-white/[0.05] border-white/[0.1] text-slate-400 hover:text-white hover:border-white/[0.2]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 relative bg-floatchat-bg">
        {activeTab === 'map' && (
          <MapErrorBoundary>
            <MapPanel />
          </MapErrorBoundary>
        )}
        {activeTab === 'plot' && <PlotPanel />}
        {activeTab === 'table' && <TablePanel />}
        {activeTab === 'none' && <div className="p-6 text-sm text-slate-500">Ask something like: &quot;nearest floats&quot;, &quot;salinity profile&quot;, or &quot;summary&quot;.</div>}
      </div>
    </div>
  );
}
