"use client";
import { useState } from 'react';
import { extractLatLon } from '../../lib/intentRouter';
import { useChatStore } from '../../store/chatStore';
import { useToast } from '../ui/ToastProvider';

interface MapSearchBarProps {
  floats: Array<{ id: string; lat: number; lon: number; lastObs: string }>;
}

export function MapSearchBar({ floats }: MapSearchBarProps) {
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setFocus } = useChatStore();
  const { push: showToast } = useToast();

  const handleSearch = async () => {
    if (!searchInput.trim()) return;
    
    setIsLoading(true);
    const query = searchInput.trim();

    try {
      // Case 1: Search by Float ID (exact match)
      const floatMatch = floats.find(f => f.id === query);
      if (floatMatch) {
        setFocus(floatMatch.id, floatMatch.lat, floatMatch.lon);
        showToast({
          type: 'success',
          message: `Found float ${floatMatch.id} at ${floatMatch.lat.toFixed(2)}, ${floatMatch.lon.toFixed(2)}`
        });
        setSearchInput('');
        setIsLoading(false);
        return;
      }

      // Case 2: Search by coordinates (multiple formats)
      const coords = extractLatLon(query);
      if (coords.lat !== undefined && coords.lon !== undefined) {
        setFocus(null, coords.lat, coords.lon);
        showToast({
          type: 'success', 
          message: `Centered map on ${coords.lat.toFixed(2)}, ${coords.lon.toFixed(2)}`
        });
        setSearchInput('');
        setIsLoading(false);
        return;
      }

      // Case 2b: Try parsing decimal coordinates (lat, lon)
      const decimalMatch = query.match(/^(-?\d+(?:\.\d+)?),?\s*(-?\d+(?:\.\d+)?)$/);
      if (decimalMatch) {
        const lat = parseFloat(decimalMatch[1]);
        const lon = parseFloat(decimalMatch[2]);
        if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
          setFocus(null, lat, lon);
          showToast({
            type: 'success',
            message: `Centered map on ${lat.toFixed(2)}, ${lon.toFixed(2)}`
          });
          setSearchInput('');
          setIsLoading(false);
          return;
        }
      }

      // Case 3: Partial float ID search
      const partialMatches = floats.filter(f => f.id.toLowerCase().includes(query.toLowerCase()));
      if (partialMatches.length === 1) {
        const match = partialMatches[0];
        setFocus(match.id, match.lat, match.lon);
        showToast({
          type: 'success',
          message: `Found float ${match.id} at ${match.lat.toFixed(2)}, ${match.lon.toFixed(2)}`
        });
        setSearchInput('');
        setIsLoading(false);
        return;
      } else if (partialMatches.length > 1) {
        showToast({
          type: 'info',
          title: 'Multiple matches',
          message: `Found ${partialMatches.length} floats matching "${query}". Try a more specific search.`
        });
        setIsLoading(false);
        return;
      }

      // No matches found
      showToast({
        type: 'error',
        title: 'No results',
        message: `No float or coordinates found for "${query}". Try a float ID (e.g., 5900001) or coordinates (12N 75W or 12.5, 75.2).`
      });
      
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Search error',
        message: 'Failed to process search query'
      });
    }
    
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-[1000] flex gap-2">
      <div className="flex-1 flex gap-2 bg-white/90 backdrop-blur border border-floatchat-border rounded-lg px-3 py-2 shadow-sm">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Search float ID or coordinates (e.g., 5900001, 12N 75W, or 12.5, 75.2)"
          className="flex-1 text-sm bg-transparent border-none outline-none placeholder-floatchat-inkMuted text-floatchat-ink"
          disabled={isLoading}
        />
        <button
          onClick={handleSearch}
          disabled={isLoading || !searchInput.trim()}
          className="px-3 py-1 text-xs bg-floatchat-primary text-white rounded hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '...' : 'Search'}
        </button>
      </div>
      <div className="text-xs text-floatchat-inkMuted bg-white/90 backdrop-blur rounded-lg px-2 py-2 border border-floatchat-border">
        {floats.length} floats
      </div>
    </div>
  );
}