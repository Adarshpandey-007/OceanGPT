export async function geocodeLocation(locationName: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json&limit=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FloatChat-Coastal-Planner/1.0'
      }
    });

    if (!response.ok) {
      console.error(`Geocoding failed with status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error geocoding location:', error);
    return null;
  }
}
