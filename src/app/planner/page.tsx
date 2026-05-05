"use client";
import { PlannerChat } from '../../components/planner/PlannerChat';

export default function PlannerPage() {
  return (
    <div className="h-[calc(100vh-4rem)] bg-floatchat-bg relative overflow-hidden flex flex-col">
      {/* Background decorations */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="w-full bg-floatchat-primary/50 border-b border-white/[0.08] px-6 py-6 relative z-10 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 mb-2">
            Conversational Project Planner
          </h1>
          <p className="text-slate-400">
            Explain your project, upload documents, and discuss environmental impacts with the Nature Advocate.
          </p>
        </div>
      </div>

      <div className="flex-1 relative z-10 min-h-0">
        <PlannerChat />
      </div>
    </div>
  );
}
