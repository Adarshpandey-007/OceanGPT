export interface Measurement {
  depth: number;
  temperature: number | null;
  salinity: number | null;
  // Extend with oxygen, nitrate, etc.
}

export interface ProfileStats {
  meanTemp?: number;
  meanSalinity?: number;
  surfaceTemp?: number;
  mixedLayerDepth?: number;
}

export interface RealProfile {
  cycle: number;
  timestamp: string | null;
  latitude: number | null;
  longitude: number | null;
  minDepth: number;
  maxDepth: number;
  measurements: Measurement[];
  stats?: ProfileStats;
}

export interface FloatProfilesPayload {
  floatId: string;
  generatedAt: string;
  sourceFileCount?: number;
  profiles: RealProfile[];
}

export interface ProfilesQueryParams {
  floatId?: string;
  limit?: number;
}
