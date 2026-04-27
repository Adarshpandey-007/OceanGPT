interface ProfileMeasurement {
  depth: number;
  temperature?: number;
  salinity?: number;
}

export function downloadProfileAsCSV(
  measurements: ProfileMeasurement[], 
  filename?: string
) {
  if (!measurements || measurements.length === 0) {
    throw new Error('No measurements to export');
  }

  // Create CSV header
  const headers = ['depth_m', 'temperature_c', 'salinity_psu'];
  
  // Create CSV rows
  const rows = measurements.map(m => [
    m.depth.toString(),
    m.temperature !== undefined ? m.temperature.toString() : '',
    m.salinity !== undefined ? m.salinity.toString() : ''
  ]);

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename || 'profile_data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export function formatProfileFilename(floatId?: string, cycle?: number): string {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  if (floatId && cycle) {
    return `float_${floatId}_cycle_${cycle}_${timestamp}.csv`;
  } else if (floatId) {
    return `float_${floatId}_${timestamp}.csv`;
  } else {
    return `profile_data_${timestamp}.csv`;
  }
}