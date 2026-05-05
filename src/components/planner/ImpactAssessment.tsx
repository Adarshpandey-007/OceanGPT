"use client";

export interface AssessmentResult {
  sustainabilityScore: number;
  ecosystemImpact: string;
  redFlags: string[];
  recommendations: string[];
}

export function ImpactAssessment({ assessment, onReset }: { assessment: AssessmentResult, onReset: () => void }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/30';
    if (score >= 50) return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Assessment Results</h2>
        <button 
          onClick={onReset}
          className="text-sm text-slate-400 hover:text-white underline underline-offset-4"
        >
          Plan Another Project
        </button>
      </div>

      <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/[0.08] backdrop-blur-xl">
        <div className="flex flex-col items-center justify-center p-6 mb-8 border-b border-white/[0.08]">
          <div className="text-sm text-slate-400 mb-2 uppercase tracking-wider font-semibold">Sustainability Score</div>
          <div className={`text-6xl font-bold tracking-tighter ${getScoreColor(assessment.sustainabilityScore)}`}>
            {assessment.sustainabilityScore}
            <span className="text-2xl text-slate-500 font-normal">/100</span>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-cyan-400 flex items-center gap-2 mb-3">
              <span>🌊</span> Ecosystem Impact
            </h3>
            <p className="text-slate-300 leading-relaxed">
              {assessment.ecosystemImpact}
            </p>
          </div>

          {assessment.redFlags && assessment.redFlags.length > 0 && (
            <div className={`rounded-xl p-5 border ${getScoreBg(30)}`}>
              <h3 className="text-lg font-semibold text-red-400 flex items-center gap-2 mb-3">
                <span>⚠️</span> Critical Red Flags
              </h3>
              <ul className="space-y-2">
                {assessment.redFlags.map((flag, idx) => (
                  <li key={idx} className="flex gap-3 text-red-200">
                    <span className="text-red-500">•</span>
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {assessment.recommendations && assessment.recommendations.length > 0 && (
            <div className={`rounded-xl p-5 border ${getScoreBg(90)}`}>
              <h3 className="text-lg font-semibold text-emerald-400 flex items-center gap-2 mb-3">
                <span>✅</span> Recommendations & Alternatives
              </h3>
              <ul className="space-y-2">
                {assessment.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex gap-3 text-emerald-200">
                    <span className="text-emerald-500">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
