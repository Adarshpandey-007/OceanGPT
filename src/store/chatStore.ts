"use client";
import { create } from 'zustand';
import type { RealProfile } from '../types/argo';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  intent?: string;
};

interface ChatState {
  messages: ChatMessage[];
  activeTab: 'map' | 'plot' | 'table' | 'none';
  focusedFloatId?: string | null;
  targetCenter?: { lat: number; lon: number } | null;
  realProfiles: {
    floatId?: string;
    loading: boolean;
    error?: string | null;
    profiles?: RealProfile[];
    selectedCycle?: number;
    selectedCycles: number[];
  };
  addMessage: (m: Omit<ChatMessage, 'id'>) => void;
  setActiveTab: (t: ChatState['activeTab']) => void;
  setFocus: (id: string | null, lat?: number, lon?: number) => void;
  setRealProfilesLoading: (floatId: string) => void;
  setRealProfilesData: (floatId: string, profiles: RealProfile[]) => void;
  selectProfileCycle: (cycle: number) => void;
  toggleCycleOverlay: (cycle: number) => void;
  setRealProfilesError: (err: string) => void;
  executeVisualizationCommand: (cmd: any) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  activeTab: 'none',
  focusedFloatId: null,
  targetCenter: null,
  realProfiles: { loading: false, error: null, profiles: undefined, floatId: undefined, selectedCycle: undefined, selectedCycles: [] },
  addMessage: (m) => set((s) => ({ messages: [...s.messages, { ...m, id: crypto.randomUUID() }] })),
  setActiveTab: (t) => set(() => ({ activeTab: t })),
  setFocus: (id, lat, lon) => set(() => ({ focusedFloatId: id, targetCenter: lat !== undefined && lon !== undefined ? { lat, lon } : null })),
  setRealProfilesLoading: (floatId) => set(() => ({ realProfiles: { floatId, loading: true, error: null, profiles: undefined, selectedCycle: undefined, selectedCycles: [] } })),
  setRealProfilesData: (floatId, profiles) => set(() => ({ realProfiles: { floatId, loading: false, error: null, profiles, selectedCycle: profiles[0]?.cycle, selectedCycles: [] } })),
  setRealProfilesError: (error) => set((s) => ({ realProfiles: { floatId: s.realProfiles?.floatId, loading: false, error, profiles: undefined, selectedCycle: undefined, selectedCycles: [] } })),
  selectProfileCycle: (cycle) => set((s) => ({ realProfiles: s.realProfiles ? { ...s.realProfiles, selectedCycle: cycle } : s.realProfiles })),
  toggleCycleOverlay: (cycleIndex: number) => set((state) => {
    const currentSelectedCycles = state.realProfiles.selectedCycles || [];
    const isSelected = currentSelectedCycles.includes(cycleIndex);
    
    return {
      realProfiles: {
        ...state.realProfiles,
        selectedCycles: isSelected 
          ? currentSelectedCycles.filter(c => c !== cycleIndex)
          : [...currentSelectedCycles, cycleIndex]
      }
    };
  }),
  executeVisualizationCommand: (cmd) => set((state) => {
    let updates: Partial<ChatState> = {};
    if (cmd.action === 'switch_tab' && cmd.tab) {
      if (['map', 'plot', 'table'].includes(cmd.tab)) {
        updates.activeTab = cmd.tab as 'map' | 'plot' | 'table';
      }
    } else if (cmd.action === 'center_map' && cmd.lat !== undefined && cmd.lon !== undefined) {
      updates.activeTab = 'map';
      updates.targetCenter = { lat: cmd.lat, lon: cmd.lon };
    } else if (cmd.action === 'load_profile' && cmd.float_id) {
      updates.activeTab = 'plot';
      updates.focusedFloatId = cmd.float_id;
      // Note: fetching the actual profile data happens in the components
      // when focusedFloatId changes.
    }
    return updates;
  }),
  reset: () => set(() => ({
    messages: [],
    activeTab: 'none',
    focusedFloatId: null,
    targetCenter: null,
    realProfiles: { loading: false, error: null, profiles: undefined, floatId: undefined, selectedCycle: undefined, selectedCycles: [] },
  })),
}));
