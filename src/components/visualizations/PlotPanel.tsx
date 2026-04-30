"use client";
import { useEffect, useState, useMemo, useRef } from 'react';
import { fetchRealProfiles } from '../../lib/real/fetchRealProfile';
import { Skeleton } from '../ui/Skeleton';
import { ProfileSummary } from './ProfileSummary';
import CycleOverlaySelector from './CycleOverlaySelector';
import { useChatStore } from '../../store/chatStore';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

import type { RealProfile, Measurement } from '../../types/argo';
interface ProfileMeasurement { depth: number; temperature?: number; salinity?: number; }
interface Profile { id: string; cycle?: number; measurements: ProfileMeasurement[]; }

export function PlotPanel() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mockError, setMockError] = useState<string | null>(null);
  const real = useChatStore((s: any) => s.realProfiles);
  const setLoading = useChatStore((s: any) => s.setRealProfilesLoading);
  const setData = useChatStore((s: any) => s.setRealProfilesData);
  const setErr = useChatStore((s: any) => s.setRealProfilesError);
  const selectCycle = useChatStore((s: any) => s.selectProfileCycle);
  const [floatIdInput, setFloatIdInput] = useState('5900001');
  const [mode, setMode] = useState<'mock' | 'real'>('mock');
  const realLoadControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (mode === 'mock') {
      // Use local mock data that includes measurements arrays
      import('../../data/mock/profiles.json')
        .then((mod) => {
          const data = mod.default || mod;
          if (data.profiles && data.profiles.length > 0) {
            setProfile(data.profiles[0]);
            setMockError(null);
          } else {
            setProfile(null);
            setMockError('No mock profile data available.');
          }
        })
        .catch((e: any) => {
          setProfile(null);
          setMockError('Could not load mock profile data.');
        });
    }
  }, [mode]);

  useEffect(() => {
    return () => {
      realLoadControllerRef.current?.abort();
    };
  }, []);

  async function loadReal() {
    realLoadControllerRef.current?.abort();
    const controller = new AbortController();
    realLoadControllerRef.current = controller;

    try {
      setLoading(floatIdInput);
      const payload = await fetchRealProfiles(floatIdInput, {
        signal: controller.signal,
        timeoutMs: 10000
      });
      // Pick first profile for now
      if (payload.profiles && payload.profiles.length > 0) {
        setData(payload.floatId, payload.profiles as RealProfile[]);
        const first = payload.profiles[0];
  setProfile({ id: `${payload.floatId}-${first.cycle}`, cycle: first.cycle, measurements: first.measurements.map((m: Measurement) => ({ depth: m.depth, temperature: m.temperature ?? undefined, salinity: m.salinity ?? undefined })) });
      } else { setProfile(null); setData(payload.floatId, [] as any); }
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        return;
      }
      setErr(e.message || 'Load failed');
    }
  }

  const activeProfile = useMemo(() => {
    if (mode === 'real' && real?.profiles && real.selectedCycle != null) {
      const rp: RealProfile | undefined = (real.profiles as RealProfile[]).find((p: RealProfile) => p.cycle === real.selectedCycle);
      if (rp) {
        return {
          id: `${real.floatId}-${rp.cycle}`,
          cycle: rp.cycle,
          measurements: rp.measurements.map(m => ({ depth: m.depth, temperature: m.temperature ?? undefined, salinity: m.salinity ?? undefined }))
        } as Profile;
      }
    }
    return profile;
  }, [mode, real, profile]);

  if (mode === 'real' && real?.loading) {
    return <div className="p-4 h-full">
      <div className="mb-3 text-xs text-floatchat-ink/70">Loading real profiles for {real.floatId}...</div>
      <Skeleton className="h-5 w-40 mb-4" />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-64" />
    </div>;
  }
  if (!activeProfile) return (
    <div className="p-4 text-sm text-floatchat-ink/60 space-y-3">
      <div>{mockError ?? 'No profile loaded yet.'}</div>
      <div className="flex items-center gap-2">
        <input className="border rounded px-2 py-1 text-xs" value={floatIdInput} onChange={e => setFloatIdInput(e.target.value)} placeholder="Float ID" />
        <button onClick={() => { setMode('real'); loadReal(); }} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Load Real</button>
        <button onClick={() => { setMode('mock'); }} className="text-xs bg-slate-500 text-white px-2 py-1 rounded">Mock</button>
      </div>
    </div>
  );

  if (!activeProfile.measurements || activeProfile.measurements.length === 0) {
    return (
      <div className="p-4 text-sm text-floatchat-ink/60 space-y-3">
        <div>Profile loaded but no measurement data available for plotting.</div>
        <div className="flex items-center gap-2">
          <input className="border rounded px-2 py-1 text-xs" value={floatIdInput} onChange={e => setFloatIdInput(e.target.value)} placeholder="Float ID" />
          <button onClick={() => { setMode('real'); loadReal(); }} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Load Real</button>
          <button onClick={() => { setMode('mock'); }} className="text-xs bg-slate-500 text-white px-2 py-1 rounded">Mock</button>
        </div>
      </div>
    );
  }

  const depths = activeProfile.measurements.map(m => m.depth);
  const temps = activeProfile.measurements.map(m => m.temperature ?? null);
  const sals = activeProfile.measurements.map(m => m.salinity ?? null);

  const headerControls = (
    <div className="flex items-center gap-2 mb-2 text-xs">
      <span className="font-medium">Mode:</span>
      <button onClick={() => { setMode('mock'); }} className={`px-2 py-0.5 rounded ${mode==='mock'?'bg-blue-600 text-white':'bg-slate-200'}`}>Mock</button>
      <button onClick={() => { setMode('real'); loadReal(); }} className={`px-2 py-0.5 rounded ${mode==='real'?'bg-blue-600 text-white':'bg-slate-200'}`}>Real</button>
      <input className="border rounded px-2 py-0.5" style={{width:120}} value={floatIdInput} onChange={e=>setFloatIdInput(e.target.value)} />
      {mode==='real' && real?.profiles?.length>1 && (
        <select
          className="border rounded px-2 py-0.5"
          value={real.selectedCycle}
          onChange={e => selectCycle(Number(e.target.value))}
        >
          {real.profiles.map((p: RealProfile) => (
            <option key={p.cycle} value={p.cycle}>Cycle {p.cycle}</option>
          ))}
        </select>
      )}
      <button onClick={() => loadReal()} className="px-2 py-0.5 rounded bg-emerald-600 text-white">Reload</button>
      {real?.error && <span className="text-red-600">{real.error}</span>}
    </div>
  );

  return (
    <div className="p-2 h-full">
      {headerControls}
      <ProfileSummary 
        measurements={activeProfile.measurements} 
        floatId={mode === 'real' ? real?.floatId : undefined}
        cycle={activeProfile.cycle}
      />
      <CycleOverlaySelector />
      <Plot
          data={[
            // Main profile
            {
              x: temps,
              y: depths,
              type: 'scatter',
              mode: 'lines+markers',
              name: `Temperature (°C) - Cycle ${activeProfile.cycle}`,
              line: { color: '#FF6B35', width: 3 },
              marker: { size: 4 }
            },
            {
              x: sals,
              y: depths,
              type: 'scatter',
              mode: 'lines+markers',
              name: `Salinity (PSU) - Cycle ${activeProfile.cycle}`,
              xaxis: 'x2',
              line: { color: '#004466', width: 3 },
              marker: { size: 4 }
            },
            // Overlay profiles
            ...(mode === 'real' && real?.profiles && real?.selectedCycles ? real.selectedCycles.flatMap((cycleNum: number, index: number) => {
              const overlayProfile = (real.profiles as RealProfile[]).find((p: RealProfile) => p.cycle === cycleNum);
              if (!overlayProfile || cycleNum === real.selectedCycle) return [];
              
              const cycleColors = ['#8B5CF6', '#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#F97316'];
              const color = cycleColors[index % cycleColors.length];
              
              const overlayDepths = overlayProfile.measurements.map(m => m.depth);
              const overlayTemps = overlayProfile.measurements.map(m => m.temperature ?? null);
              const overlaySals = overlayProfile.measurements.map(m => m.salinity ?? null);
              
              return [
                {
                  x: overlayTemps,
                  y: overlayDepths,
                  type: 'scatter',
                  mode: 'lines',
                  name: `Temperature - Cycle ${cycleNum}`,
                  line: { color, width: 2, dash: 'dot' },
                  opacity: 0.7
                },
                {
                  x: overlaySals,
                  y: overlayDepths,
                  type: 'scatter',
                  mode: 'lines',
                  name: `Salinity - Cycle ${cycleNum}`,
                  xaxis: 'x2',
                  line: { color, width: 2, dash: 'dot' },
                  opacity: 0.7
                }
              ];
            }) : [])
          ]}
          layout={{
            autosize: true,
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            margin: { l: 60, r: 60, t: 30, b: 40 },
            yaxis: { title: 'Depth (m)', autorange: 'reversed' },
            xaxis: { title: 'Temperature (°C)', domain: [0, 0.48] },
            xaxis2: { title: 'Salinity (PSU)', domain: [0.52, 1], anchor: 'y' },
            showlegend: true,
            legend: { orientation: 'h', y: -0.2 }
          }}
          style={{ width: '100%', height: '100%' }}
          config={{ displayModeBar: false }}
        />
    </div>
  );
}
