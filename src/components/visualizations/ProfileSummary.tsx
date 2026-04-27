"use client";
import React from 'react';
import { downloadProfileAsCSV, formatProfileFilename } from '../../lib/csvExport';
import { useToast } from '../ui/ToastProvider';

interface ProfileMeasurement {
  depth: number;
  temperature?: number;
  salinity?: number;
}

interface ProfileSummaryProps {
  measurements: ProfileMeasurement[];
  floatId?: string;
  cycle?: number;
}

export function ProfileSummary({ measurements, floatId, cycle }: ProfileSummaryProps) {
  const { push: showToast } = useToast();
  
  if (!measurements || measurements.length === 0) {
    return null;
  }

  // Calculate summary statistics
  const validTemps = measurements.map(m => m.temperature).filter(t => t !== undefined && t !== null) as number[];
  const validSalinities = measurements.map(m => m.salinity).filter(s => s !== undefined && s !== null) as number[];
  
  const surfaceTemp = validTemps.length > 0 ? validTemps[0] : null; // First measurement (shallow)
  const meanTemp = validTemps.length > 0 ? validTemps.reduce((a, b) => a + b, 0) / validTemps.length : null;
  const meanSalinity = validSalinities.length > 0 ? validSalinities.reduce((a, b) => a + b, 0) / validSalinities.length : null;
  
  const maxDepth = Math.max(...measurements.map(m => m.depth));
  const measurementCount = measurements.length;
  
  // Find mixed layer depth (simplified: depth where temp drops 0.2°C from surface)
  const mixedLayerDepth = (() => {
    if (validTemps.length < 2 || surfaceTemp === null) return null;
    for (let i = 1; i < measurements.length; i++) {
      const temp = measurements[i].temperature;
      if (temp !== undefined && temp !== null && Math.abs(temp - surfaceTemp) > 0.2) {
        return measurements[i].depth;
      }
    }
    return null;
  })();

  const chips = [
    ...(floatId ? [{ label: 'Float', value: floatId, type: 'info' as const }] : []),
    ...(cycle ? [{ label: 'Cycle', value: cycle.toString(), type: 'info' as const }] : []),
    { label: 'Measurements', value: measurementCount.toString(), type: 'info' as const },
    { label: 'Max Depth', value: `${maxDepth.toFixed(0)}m`, type: 'info' as const },
    ...(surfaceTemp !== null ? [{ label: 'Surface Temp', value: `${surfaceTemp.toFixed(1)}°C`, type: 'temperature' as const }] : []),
    ...(meanTemp !== null ? [{ label: 'Mean Temp', value: `${meanTemp.toFixed(1)}°C`, type: 'temperature' as const }] : []),
    ...(meanSalinity !== null ? [{ label: 'Mean Salinity', value: `${meanSalinity.toFixed(2)} PSU`, type: 'salinity' as const }] : []),
    ...(mixedLayerDepth !== null ? [{ label: 'Mixed Layer', value: `${mixedLayerDepth.toFixed(0)}m`, type: 'depth' as const }] : []),
  ];

  const getChipStyle = (type: string) => {
    switch (type) {
      case 'temperature':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'salinity':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'depth':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'info':
      default:
        return 'bg-floatchat-panel border-floatchat-border text-floatchat-ink';
    }
  };

  const handleExportCSV = () => {
    try {
      const filename = formatProfileFilename(floatId, cycle);
      downloadProfileAsCSV(measurements, filename);
      showToast({
        type: 'success',
        message: `Profile data exported as ${filename}`
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Export failed',
        message: 'Could not export profile data'
      });
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-3 p-2 bg-floatchat-bg/50 rounded-lg border border-floatchat-border">
      <div className="flex flex-wrap gap-2 flex-1">
        {chips.map((chip, index) => (
          <div
            key={index}
            className={`px-2 py-1 rounded text-xs font-medium border ${getChipStyle(chip.type)}`}
          >
            <span className="opacity-70">{chip.label}:</span> {chip.value}
          </div>
        ))}
      </div>
      <button
        onClick={handleExportCSV}
        className="px-3 py-1 text-xs bg-floatchat-secondary text-white rounded hover:brightness-110 border border-floatchat-secondary"
        title="Export profile data as CSV"
      >
        📥 CSV
      </button>
    </div>
  );
}