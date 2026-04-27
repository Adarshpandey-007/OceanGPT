"use client";

import { useChatStore } from '../../store/chatStore';

export default function CycleOverlaySelector() {
  const { realProfiles, toggleCycleOverlay } = useChatStore();

  if (!realProfiles?.profiles || realProfiles.profiles.length <= 1) {
    return null;
  }

  const availableCycles = realProfiles.profiles.map((p: any) => p.cycle);
  
  // Color palette for different cycles
  const cycleColors = [
    '#FF6B35', // FloatChat accent
    '#00A79A', // FloatChat secondary
    '#8B5CF6', // Purple
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#F97316', // Orange
  ];

  return (
    <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
      <h4 className="text-sm font-medium text-gray-300 mb-2">
        Overlay Multiple Cycles
      </h4>
      <div className="flex flex-wrap gap-2">
        {availableCycles.map((cycle: number, index: number) => {
          const isSelected = realProfiles?.selectedCycles?.includes(cycle) || false;
          const color = cycleColors[index % cycleColors.length];
          
          return (
            <label
              key={cycle}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleCycleOverlay(cycle)}
                className="sr-only"
              />
              <div
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium
                  transition-all duration-200 border
                  ${isSelected 
                    ? 'bg-white/10 border-white/20 text-white' 
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }
                `}
              >
                <div
                  className={`
                    w-3 h-3 rounded-full border-2 transition-all duration-200
                    ${isSelected ? 'border-white' : 'border-gray-500'}
                  `}
                  style={{ 
                    backgroundColor: isSelected ? color : 'transparent',
                    boxShadow: isSelected ? `0 0 8px ${color}40` : 'none'
                  }}
                />
                Cycle {cycle}
              </div>
            </label>
          );
        })}
      </div>
      {realProfiles?.selectedCycles && realProfiles.selectedCycles.length > 0 && (
        <p className="text-xs text-gray-400 mt-2">
          {realProfiles.selectedCycles.length} cycle{realProfiles.selectedCycles.length > 1 ? 's' : ''} selected for overlay
        </p>
      )}
    </div>
  );
}