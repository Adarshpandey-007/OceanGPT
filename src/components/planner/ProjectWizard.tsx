"use client";
import { useState } from 'react';
import type { AssessmentResult } from './ImpactAssessment';

export function ProjectWizard({ onComplete }: { onComplete: (res: AssessmentResult) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    projectType: 'Port Expansion',
    description: '',
    scale: '',
    lat: '',
    lon: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/planner/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          lat: parseFloat(formData.lat),
          lon: parseFloat(formData.lon)
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate assessment');
      }

      onComplete(data.assessment);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const projectTypes = [
    'Port Expansion',
    'Desalination Plant',
    'Offshore Wind Farm',
    'Coastal Highway',
    'Marine Protected Area',
    'Aquaculture Facility'
  ];

  return (
    <div className="bg-slate-900/50 rounded-2xl p-8 border border-white/[0.08] backdrop-blur-xl max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Plan a Coastal Project</h2>
        <p className="text-slate-400">Describe your proposed project to receive a Nature Advocate sustainability assessment based on real oceanographic data.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Project Name</label>
            <input 
              required
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/30"
              placeholder="e.g. Mumbai Port Phase II"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Project Type</label>
            <select 
              name="projectType"
              value={formData.projectType}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-white/[0.1] rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/30"
            >
              {projectTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Latitude (N)</label>
            <input 
              required
              type="number" 
              step="any"
              name="lat"
              value={formData.lat}
              onChange={handleChange}
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/30"
              placeholder="e.g. 18.9"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Longitude (E)</label>
            <input 
              required
              type="number" 
              step="any"
              name="lon"
              value={formData.lon}
              onChange={handleChange}
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/30"
              placeholder="e.g. 72.8"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Scale / Budget (Optional)</label>
          <input 
            type="text" 
            name="scale"
            value={formData.scale}
            onChange={handleChange}
            className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/30"
            placeholder="e.g. $50M, 200 Hectares"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Project Description</label>
          <textarea 
            rows={4}
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/30 resize-none"
            placeholder="Describe the main activities, construction methods, or expected output..."
          />
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
            {error}
          </div>
        )}

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
              Analyzing Impact...
            </>
          ) : (
            'Generate Sustainability Assessment'
          )}
        </button>
      </form>
    </div>
  );
}
