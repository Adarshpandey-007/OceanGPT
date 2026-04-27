"use client";
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import { useChatStore } from '../../store/chatStore';
import type { LatLngExpression } from 'leaflet';
import { MapSearchBar } from './MapSearchBar';
import { Skeleton } from '../ui/Skeleton';

interface FloatSummary { id: string; lat: number; lon: number; lastObs: string; }

// Dynamically import react-leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-100 flex items-center justify-center text-sm text-gray-600">Loading map...</div>
});
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });

// Component to handle map events inside MapContainer
function MapController() {
  const { targetCenter } = useChatStore();
  
  // This will be imported dynamically when the map is ready
  const [useMap, setUseMap] = useState<any>(null);
  
  useEffect(() => {
    import('react-leaflet').then(m => setUseMap(() => m.useMap));
  }, []);
  
  const map = useMap?.();
  
  useEffect(() => {
    if (targetCenter && map) {
      try {
        map.setView([targetCenter.lat, targetCenter.lon], 6, { animate: true });
      } catch (error) {
        console.warn('Map view update failed:', error);
      }
    }
  }, [targetCenter, map]);
  
  return null;
}

export function MapPanel() {
  const [floats, setFloats] = useState<FloatSummary[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { focusedFloatId, targetCenter } = useChatStore();
  
  const center: LatLngExpression = targetCenter ? [targetCenter.lat, targetCenter.lon] : [12, 75];

  useEffect(() => {
    setIsClient(true);
    const controller = new AbortController();

    fetch('/api/floats', { signal: controller.signal })
      .then(r => {
        if (!r.ok) {
          throw new Error(`Failed to load map floats (${r.status})`);
        }
        return r.json();
      })
      .then(data => {
        setFloats(data.floats || []);
        setLoadError(null);
      })
      .catch(error => {
        if (error?.name === 'AbortError') return;
        setLoadError('Map data could not be loaded. Please refresh.');
      });

    return () => controller.abort();
  }, []);

  // Create icons safely
  const createIcon = (highlighted: boolean) => {
    if (!isClient) return undefined;
    
    try {
      if (highlighted) {
        return L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
          className: 'focused-float-marker'
        });
      }
      return undefined;
    } catch (error) {
      console.warn('Failed to create icon:', error);
      return undefined;
    }
  };

  if (!isClient) {
    return (
      <div className="absolute inset-0 p-4">
        <Skeleton className="h-full w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <MapSearchBar floats={floats} />
      {loadError && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-[1000] rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 shadow-sm">
          {loadError}
        </div>
      )}
      <MapContainer 
        center={center} 
        zoom={targetCenter ? 6 : 4} 
        style={{ height: '100%', width: '100%' }}
        attributionControl={true}
        zoomControl={true}
      >
        <MapController />
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          attribution="&copy; OpenStreetMap contributors" 
        />
        {floats.map(f => {
          const highlighted = f.id === focusedFloatId;
          const icon = createIcon(highlighted);
          
          return (
            <Marker 
              key={f.id} 
              position={[f.lat, f.lon]} 
              {...(icon ? { icon } : {})}
              eventHandlers={{
                click: (e) => {
                  e.originalEvent?.stopPropagation();
                }
              }}
            >
              <Popup>
                <div className="text-xs">
                  <div className="font-semibold">{f.id}</div>
                  <div>{f.lat.toFixed(2)}, {f.lon.toFixed(2)}</div>
                  <div className="text-[10px]">{new Date(f.lastObs).toUTCString()}</div>
                  {highlighted && <div className="mt-1 text-[10px] text-floatchat-secondary font-semibold">Focused</div>}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
