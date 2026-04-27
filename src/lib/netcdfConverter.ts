// NetCDF to CSV conversion utilities
export interface NetCDFVariable {
  name: string;
  type: string;
  dimensions: string[];
  attributes: Record<string, any>;
  shape: number[];
  data?: any[];
}

export interface NetCDFMetadata {
  dimensions: Record<string, number>;
  variables: Record<string, NetCDFVariable>;
  globalAttributes: Record<string, any>;
}

export interface ConversionOptions {
  selectedVariables: string[];
  includeMetadata: boolean;
  timestampFormat: 'iso' | 'unix' | 'original';
}

// Mock NetCDF parser for demonstration
// In a real implementation, you'd use a library like netcdf4-js or similar
export const parseNetCDF = async (file: File): Promise<NetCDFMetadata> => {
  return new Promise((resolve) => {
    // Mock parsing - in reality this would use a proper NetCDF library
    setTimeout(() => {
      const mockMetadata: NetCDFMetadata = {
        dimensions: {
          'time': 100,
          'pressure': 50,
          'latitude': 1,
          'longitude': 1
        },
        variables: {
          'time': {
            name: 'time',
            type: 'float64',
            dimensions: ['time'],
            shape: [100],
            attributes: {
              units: 'days since 1950-01-01T00:00:00Z',
              long_name: 'Time'
            }
          },
          'pressure': {
            name: 'pressure',
            type: 'float32',
            dimensions: ['pressure'],
            shape: [50],
            attributes: {
              units: 'decibar',
              long_name: 'Pressure'
            }
          },
          'temperature': {
            name: 'temperature',
            type: 'float32',
            dimensions: ['time', 'pressure'],
            shape: [100, 50],
            attributes: {
              units: 'degree_Celsius',
              long_name: 'Temperature'
            }
          },
          'salinity': {
            name: 'salinity',
            type: 'float32',
            dimensions: ['time', 'pressure'],
            shape: [100, 50],
            attributes: {
              units: 'PSU',
              long_name: 'Practical Salinity'
            }
          },
          'latitude': {
            name: 'latitude',
            type: 'float64',
            dimensions: ['latitude'],
            shape: [1],
            attributes: {
              units: 'degrees_north',
              long_name: 'Latitude'
            }
          },
          'longitude': {
            name: 'longitude',
            type: 'float64',
            dimensions: ['longitude'],
            shape: [1],
            attributes: {
              units: 'degrees_east',
              long_name: 'Longitude'
            }
          }
        },
        globalAttributes: {
          title: 'ARGO Float Profile Data',
          institution: 'Ocean Data Center',
          source: 'ARGO Float',
          conventions: 'CF-1.6'
        }
      };

      // Generate mock data
      Object.keys(mockMetadata.variables).forEach(varName => {
        const variable = mockMetadata.variables[varName];
        const totalSize = variable.shape.reduce((acc, dim) => acc * dim, 1);
        
        if (varName === 'time') {
          variable.data = Array.from({ length: totalSize }, (_, i) => 
            new Date(Date.now() - (totalSize - i) * 24 * 60 * 60 * 1000).toISOString()
          );
        } else if (varName === 'pressure') {
          variable.data = Array.from({ length: totalSize }, (_, i) => i * 10);
        } else if (varName === 'temperature') {
          variable.data = Array.from({ length: totalSize }, () => 
            15 + Math.random() * 10
          );
        } else if (varName === 'salinity') {
          variable.data = Array.from({ length: totalSize }, () => 
            34 + Math.random() * 2
          );
        } else if (varName === 'latitude') {
          variable.data = [35.5 + Math.random() * 0.1];
        } else if (varName === 'longitude') {
          variable.data = [-12.3 + Math.random() * 0.1];
        }
      });

      resolve(mockMetadata);
    }, 1000);
  });
};

export const convertToCSV = (
  metadata: NetCDFMetadata, 
  options: ConversionOptions
): string => {
  const { selectedVariables, includeMetadata } = options;
  
  let csvContent = '';
  
  // Add metadata as comments if requested
  if (includeMetadata) {
    csvContent += '# NetCDF to CSV Conversion\n';
    csvContent += `# Original file global attributes:\n`;
    Object.entries(metadata.globalAttributes).forEach(([key, value]) => {
      csvContent += `# ${key}: ${value}\n`;
    });
    csvContent += '#\n';
  }

  // Get selected variables
  const variables = selectedVariables.map(name => metadata.variables[name]).filter(Boolean);
  
  if (variables.length === 0) {
    return csvContent + '# No variables selected for conversion\n';
  }

  // Create header
  const headers: string[] = [];
  const dataColumns: any[][] = [];

  variables.forEach(variable => {
    if (variable.dimensions.length === 1) {
      // 1D variable - add as single column
      headers.push(`${variable.name} (${variable.attributes.units || 'N/A'})`);
      dataColumns.push(variable.data || []);
    } else if (variable.dimensions.length === 2) {
      // 2D variable - flatten or handle specially
      const [dim1, dim2] = variable.shape;
      const data = variable.data || [];
      
      // For 2D data, create columns for each depth/pressure level
      for (let j = 0; j < dim2; j++) {
        headers.push(`${variable.name}_${j} (${variable.attributes.units || 'N/A'})`);
        const column = [];
        for (let i = 0; i < dim1; i++) {
          column.push(data[i * dim2 + j]);
        }
        dataColumns.push(column);
      }
    }
  });

  // Add variable metadata as comments
  if (includeMetadata) {
    variables.forEach(variable => {
      csvContent += `# Variable: ${variable.name}\n`;
      csvContent += `#   Dimensions: ${variable.dimensions.join(', ')}\n`;
      csvContent += `#   Shape: ${variable.shape.join(' x ')}\n`;
      Object.entries(variable.attributes).forEach(([key, value]) => {
        csvContent += `#   ${key}: ${value}\n`;
      });
      csvContent += '#\n';
    });
  }

  // Add CSV header
  csvContent += headers.join(',') + '\n';

  // Add data rows
  const maxRows = Math.max(...dataColumns.map(col => col.length));
  for (let i = 0; i < maxRows; i++) {
    const row = dataColumns.map(col => {
      const value = col[i];
      if (value === undefined || value === null) return '';
      if (typeof value === 'number') return value.toFixed(6);
      return String(value);
    });
    csvContent += row.join(',') + '\n';
  }

  return csvContent;
};

export const downloadCSV = (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

export const downloadMultipleCSVs = async (
  files: { file: File; metadata: NetCDFMetadata }[],
  options: ConversionOptions,
  onProgress?: (current: number, total: number) => void
) => {
  for (let i = 0; i < files.length; i++) {
    const { file, metadata } = files[i];
    
    if (onProgress) {
      onProgress(i + 1, files.length);
    }
    
    const csvContent = convertToCSV(metadata, options);
    const filename = file.name.replace(/\.nc$/i, '.csv');
    
    downloadCSV(csvContent, filename);
    
    // Small delay between downloads to prevent browser overwhelm
    if (i < files.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
};

export const downloadMergedCSV = (
  files: { file: File; metadata: NetCDFMetadata }[],
  options: ConversionOptions,
  mergedFilename: string = 'merged_data.csv'
) => {
  let mergedContent = '';
  
  // Add global header with file information
  mergedContent += '# Merged NetCDF Data Export\n';
  mergedContent += `# Generated on: ${new Date().toISOString()}\n`;
  mergedContent += `# Number of files: ${files.length}\n`;
  mergedContent += '# Files included:\n';
  
  files.forEach(({ file }, index) => {
    mergedContent += `#   ${index + 1}. ${file.name}\n`;
  });
  mergedContent += '#\n';
  
  // Process each file
  files.forEach(({ file, metadata }, fileIndex) => {
    mergedContent += `\n# === FILE ${fileIndex + 1}: ${file.name} ===\n`;
    
    if (options.includeMetadata) {
      mergedContent += `# File global attributes:\n`;
      Object.entries(metadata.globalAttributes).forEach(([key, value]) => {
        mergedContent += `# ${key}: ${value}\n`;
      });
      mergedContent += '#\n';
    }
    
    // Get file-specific CSV content (without global comments)
    const fileOptions = { ...options, includeMetadata: false };
    const fileCSV = convertToCSV(metadata, fileOptions);
    
    // Add file identifier column
    const lines = fileCSV.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      // Modify header to include file identifier
      const header = lines[0];
      const modifiedHeader = `file_id,file_name,${header}`;
      mergedContent += modifiedHeader + '\n';
      
      // Add data rows with file identifier
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          mergedContent += `${fileIndex + 1},"${file.name}",${lines[i]}\n`;
        }
      }
    }
  });
  
  downloadCSV(mergedContent, mergedFilename);
};