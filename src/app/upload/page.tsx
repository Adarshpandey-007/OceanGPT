"use client";
import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '../../components/ui/ToastProvider';
import { parseNetCDF, convertToCSV, downloadCSV, downloadMultipleCSVs, downloadMergedCSV, NetCDFMetadata, ConversionOptions } from '../../lib/netcdfConverter';

interface FileItem {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  path?: string; // Added to track folder structure
  netcdfMetadata?: NetCDFMetadata; // For NetCDF conversion
}

export default function DataUploadPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [selectedFileForConversion, setSelectedFileForConversion] = useState<FileItem | null>(null);
  const [showBulkDownloadModal, setShowBulkDownloadModal] = useState(false);
  const [bulkDownloadProgress, setBulkDownloadProgress] = useState({ current: 0, total: 0 });
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [isProgressMinimized, setIsProgressMinimized] = useState(false);
  const [bulkDownloadAbortController, setBulkDownloadAbortController] = useState<AbortController | null>(null);
  const [conversionOptions, setConversionOptions] = useState<ConversionOptions>({
    selectedVariables: [],
    includeMetadata: true,
    timestampFormat: 'iso'
  });
  const [isConverting, setIsConverting] = useState(false);
  const [uploadStats, setUploadStats] = useState({
    total: 0,
    completed: 0,
    errors: 0,
    currentBatch: 0,
    totalBatches: 0
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const { push: addToast } = useToast();

  const supportedFormats = {
    'application/x-netcdf': '.nc',
    'text/csv': '.csv',
    'application/json': '.json',
    'application/octet-stream': '.nc' // fallback for .nc files
  };

  const isValidFile = (file: File): boolean => {
    const extension = file.name.toLowerCase().split('.').pop();
    return ['.nc', '.csv', '.json'].includes(`.${extension}`);
  };

  const createFileItem = (file: File, filePath?: string): FileItem => ({
    file,
    id: `${file.name}-${Date.now()}-${Math.random()}`,
    status: 'pending',
    progress: 0,
    path: filePath
  });

  const addFiles = useCallback((newFiles: FileList | File[], basePath?: string) => {
    const validFiles: FileItem[] = [];
    const invalidFiles: string[] = [];

    Array.from(newFiles).forEach(file => {
      if (isValidFile(file)) {
        const filePath = basePath ? `${basePath}/${file.name}` : file.name;
        validFiles.push(createFileItem(file, filePath));
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      addToast({
        type: 'success',
        message: `Added ${validFiles.length} file(s) for upload${basePath ? ` from ${basePath}` : ''}`
      });
    }

    if (invalidFiles.length > 0) {
      addToast({
        type: 'error',
        message: `Skipped ${invalidFiles.length} unsupported file(s): ${invalidFiles.slice(0, 3).join(', ')}${invalidFiles.length > 3 ? '...' : ''}`
      });
    }
  }, [addToast]);

  const DEBUG = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_UPLOAD_DEBUG === '1';

  // Ensure document-level drag cancel to avoid stuck state
  useEffect(() => {
    const cancel = (e: DragEvent) => {
      e.preventDefault();
    };
    document.addEventListener('dragover', cancel);
    document.addEventListener('drop', cancel);
    return () => {
      document.removeEventListener('dragover', cancel);
      document.removeEventListener('drop', cancel);
    };
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (DEBUG) console.log('[upload] drop event', e.dataTransfer.items?.length, e.dataTransfer.files?.length);
    const items = Array.from(e.dataTransfer.items || []);
    const fileItems: { file: File; path: string }[] = [];

    const processEntries = async () => {
      addToast({
        type: 'info',
        message: 'Processing dropped items... This may take a moment for large folders.'
      });

      for (const item of items) {
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            await processEntry(entry, fileItems);
          }
        }
      }
      
      if (fileItems.length > 0) {
        // Convert to our FileItem format
        const newFileItems = fileItems.map(({ file, path }) => createFileItem(file, path));
        
        setFiles(prev => [...prev, ...newFileItems]);
        
        addToast({
          type: 'success',
          message: `Successfully added ${fileItems.length} file(s) from dropped items${
            fileItems.length > 100 ? ' (unlimited folder support enabled)' : ''
          }`
        });
      } else {
        addToast({
          type: 'error',
          message: 'No supported files found in dropped items'
        });
      }
    };

    processEntries().catch(error => {
      console.error('Error processing dropped items:', error);
      addToast({
        type: 'error',
        message: 'Error processing dropped items. Please try again.'
      });
    });
  }, [addToast]);

  const processEntry = async (entry: any, fileItems: { file: File; path: string }[], currentPath: string = ''): Promise<void> => {
    return new Promise((resolve) => {
      if (entry.isFile) {
        entry.file((file: File) => {
          if (isValidFile(file)) {
            // Store file with its full path information
            const fullPath = currentPath ? `${currentPath}/${file.name}` : file.name;
            fileItems.push({ file, path: fullPath });
          }
          resolve();
        });
      } else if (entry.isDirectory) {
        const reader = entry.createReader();
        const readEntries = () => {
          reader.readEntries(async (entries: any[]) => {
            if (entries.length === 0) {
              resolve();
              return;
            }
            
            for (const childEntry of entries) {
              const newPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
              await processEntry(childEntry, fileItems, newPath);
            }
            
            // Continue reading if there are more entries (some browsers limit entries per call)
            readEntries();
          });
        };
        readEntries();
      } else {
        resolve();
      }
    });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  }, [isDragging]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only reset when leaving the container entirely
    if ((e.target as HTMLElement).id === 'upload-dropzone') {
      setIsDragging(false);
    }
  }, []);

  const simulateUpload = async (fileItem: FileItem): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        const formData = new FormData();
        formData.append('files', fileItem.file);

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id 
              ? { ...f, progress: Math.min(f.progress + 15, 90) }
              : f
          ));
        }, 300);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.results?.[0]?.status === 'error') {
          throw new Error(result.results[0].error);
        }

        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'success', progress: 100 }
            : f
        ));
        
        resolve();
      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { 
                ...f, 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Upload failed' 
              }
            : f
        ));
        reject(error);
      }
    });
  };

  const uploadFiles = async () => {
    setIsUploading(true);
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    // Process files in batches to handle large numbers
    const BATCH_SIZE = 50; // Process 50 files at a time
    const totalBatches = Math.ceil(pendingFiles.length / BATCH_SIZE);
    
    setUploadStats({
      total: pendingFiles.length,
      completed: 0,
      errors: 0,
      currentBatch: 0,
      totalBatches
    });

    let completed = 0;
    let errors = 0;

    for (let i = 0; i < totalBatches; i++) {
      const currentBatch = i + 1;
      setUploadStats(prev => ({ ...prev, currentBatch }));
      
      const batchStart = i * BATCH_SIZE;
      const batchEnd = Math.min(batchStart + BATCH_SIZE, pendingFiles.length);
      const batchFiles = pendingFiles.slice(batchStart, batchEnd);
      
      addToast({
        type: 'info',
        message: `Processing batch ${currentBatch} of ${totalBatches} (${batchFiles.length} files)`
      });

      // Process batch files in parallel (but limit concurrent uploads)
      const concurrentPromises = batchFiles.map(async (fileItem) => {
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'uploading' }
            : f
        ));
        
        try {
          await simulateUpload(fileItem);
          completed++;
          setUploadStats(prev => ({ ...prev, completed }));
        } catch (error) {
          errors++;
          setUploadStats(prev => ({ ...prev, errors }));
        }
      });

      // Wait for batch to complete before moving to next
      await Promise.all(concurrentPromises);
      
      // Small delay between batches to prevent overwhelming the server
      if (i < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setIsUploading(false);
    
    addToast({
      type: completed > errors ? 'success' : 'error',
      message: `Upload complete! ${completed} successful, ${errors} failed out of ${pendingFiles.length} total files`
    });
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleConvertToCSV = async (fileItem: FileItem) => {
    if (!fileItem.file.name.toLowerCase().endsWith('.nc')) {
      addToast({
        type: 'error',
        message: 'Only NetCDF (.nc) files can be converted to CSV'
      });
      return;
    }

    try {
      setIsConverting(true);
      addToast({
        type: 'info',
        message: 'Parsing NetCDF file...'
      });

      const metadata = await parseNetCDF(fileItem.file);
      
      // Update file item with metadata
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { ...f, netcdfMetadata: metadata }
          : f
      ));

      // Set default selected variables (exclude coordinate variables)
      const dataVariables = Object.keys(metadata.variables).filter(name => 
        !['time', 'latitude', 'longitude', 'pressure'].includes(name.toLowerCase())
      );
      
      setConversionOptions({
        selectedVariables: ['time', 'pressure', ...dataVariables],
        includeMetadata: true,
        timestampFormat: 'iso'
      });

      setSelectedFileForConversion({ ...fileItem, netcdfMetadata: metadata });
      setShowConversionModal(true);
      
    } catch (error) {
      console.error('Error parsing NetCDF file:', error);
      addToast({
        type: 'error',
        message: 'Failed to parse NetCDF file. Please ensure it is a valid NetCDF file.'
      });
    } finally {
      setIsConverting(false);
    }
  };

  const performConversion = async () => {
    if (!selectedFileForConversion?.netcdfMetadata) return;

    try {
      setIsConverting(true);
      addToast({
        type: 'info',
        message: 'Converting NetCDF to CSV...'
      });

      const csvContent = convertToCSV(selectedFileForConversion.netcdfMetadata, conversionOptions);
      const filename = selectedFileForConversion.file.name.replace(/\.nc$/i, '.csv');
      
      downloadCSV(csvContent, filename);
      
      addToast({
        type: 'success',
        message: `Successfully converted ${selectedFileForConversion.file.name} to CSV format`
      });

      setShowConversionModal(false);
      setSelectedFileForConversion(null);
      
    } catch (error) {
      console.error('Error converting to CSV:', error);
      addToast({
        type: 'error',
        message: 'Failed to convert NetCDF to CSV. Please try again.'
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleBulkDownload = () => {
    const netcdfFiles = files.filter(f => f.file.name.toLowerCase().endsWith('.nc'));
    
    if (netcdfFiles.length === 0) {
      addToast({
        type: 'info',
        message: 'No NetCDF files available for bulk conversion'
      });
      return;
    }

    setShowBulkDownloadModal(true);
  };

  const performBulkDownload = async (downloadType: 'separate' | 'merged') => {
    const netcdfFiles = files.filter(f => f.file.name.toLowerCase().endsWith('.nc'));
    
    if (netcdfFiles.length === 0) return;

    // Create abort controller for this operation
    const abortController = new AbortController();
    setBulkDownloadAbortController(abortController);

    try {
      setIsBulkProcessing(true);
      setBulkDownloadProgress({ current: 0, total: netcdfFiles.length });

      // Only show initial toast
      addToast({
        type: 'info',
        message: `Starting bulk conversion of ${netcdfFiles.length} files...`
      });

      // Parse all NetCDF files first
      const parsedFiles: { file: File; metadata: NetCDFMetadata }[] = [];
      
      for (let i = 0; i < netcdfFiles.length; i++) {
        // Check if operation was aborted
        if (abortController.signal.aborted) {
          addToast({
            type: 'info',
            message: 'Bulk download cancelled'
          });
          return;
        }

        const fileItem = netcdfFiles[i];
        setBulkDownloadProgress({ current: i + 1, total: netcdfFiles.length });
        
        // Only show toast for every 10th file or significant milestones to reduce noise
        if (i === 0 || (i + 1) % 10 === 0 || i === netcdfFiles.length - 1) {
          // No individual file toasts during parsing - progress shown in widget
        }

        try {
          const metadata = await parseNetCDF(fileItem.file);
          parsedFiles.push({ file: fileItem.file, metadata });
        } catch (error) {
          console.error(`Error parsing ${fileItem.file.name}:`, error);
          // Only show error toast for failed files, no success toasts for individual files
        }

        // Small delay to allow UI updates and check for abort
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Check if operation was aborted after parsing
      if (abortController.signal.aborted) {
        addToast({
          type: 'info',
          message: 'Bulk download cancelled'
        });
        return;
      }

      if (parsedFiles.length === 0) {
        addToast({
          type: 'error',
          message: 'No files could be processed'
        });
        return;
      }

      // Set default conversion options for bulk processing
      const bulkOptions: ConversionOptions = {
        selectedVariables: ['time', 'pressure', 'temperature', 'salinity'], // Common ARGO variables
        includeMetadata: true,
        timestampFormat: 'iso'
      };

      if (downloadType === 'separate') {
        // Enhanced downloadMultipleCSVs with abort support
        for (let i = 0; i < parsedFiles.length; i++) {
          if (abortController.signal.aborted) {
            addToast({
              type: 'info',
              message: 'Bulk download cancelled'
            });
            return;
          }

          const { file, metadata } = parsedFiles[i];
          setBulkDownloadProgress({ current: i + 1, total: parsedFiles.length });
          
          const csvContent = convertToCSV(metadata, bulkOptions);
          const filename = file.name.replace(/\.nc$/i, '.csv');
          downloadCSV(csvContent, filename);
          
          // Small delay between downloads
          if (i < parsedFiles.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        addToast({
          type: 'success',
          message: `Downloaded ${parsedFiles.length} CSV files`
        });
      } else {
        const timestamp = new Date().toISOString().split('T')[0];
        const mergedFilename = `merged_argo_data_${timestamp}.csv`;
        
        downloadMergedCSV(parsedFiles, bulkOptions, mergedFilename);

        addToast({
          type: 'success',
          message: `Downloaded: ${mergedFilename}`
        });
      }

      setShowBulkDownloadModal(false);
      setIsProgressMinimized(false);
      
    } catch (error) {
      if (abortController.signal.aborted) {
        addToast({
          type: 'info',
          message: 'Bulk download cancelled'
        });
      } else {
        console.error('Error in bulk download:', error);
        addToast({
          type: 'error',
          message: 'Bulk download failed'
        });
      }
    } finally {
      setIsBulkProcessing(false);
      setBulkDownloadProgress({ current: 0, total: 0 });
      setBulkDownloadAbortController(null);
    }
  };

  const cancelBulkDownload = () => {
    if (bulkDownloadAbortController) {
      bulkDownloadAbortController.abort();
      setShowBulkDownloadModal(false);
      setIsProgressMinimized(false);
    }
  };

  const minimizeProgress = () => {
    setIsProgressMinimized(true);
    setShowBulkDownloadModal(false);
  };

  const restoreProgress = () => {
    setIsProgressMinimized(false);
    setShowBulkDownloadModal(true);
  };

  const clearAll = () => {
    setFiles([]);
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop();
    switch (extension) {
      case 'nc':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
            <span className="text-xs font-bold text-blue-600">NC</span>
          </div>
        );
      case 'csv':
        return (
          <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
            <span className="text-xs font-bold text-green-600">CSV</span>
          </div>
        );
      case 'json':
        return (
          <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
            <span className="text-xs font-bold text-orange-600">JSON</span>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
            <span className="text-xs font-bold text-gray-600">FILE</span>
          </div>
        );
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <main className="min-h-screen">
      {/* Page Header */}
      <div className="relative">
        {/* Reusing PageHeader via dynamic import avoided for now; inline structure to minimize additional imports */}
        <div className="relative overflow-hidden pt-20 pb-16">
          <div className="absolute inset-0 -z-20 bg-gradient-to-b from-floatchat-primary via-floatchat-secondary to-floatchat-primary" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_25%_30%,rgba(0,240,255,0.08),transparent_60%)]" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_70%,rgba(0,240,255,0.04),transparent_70%)]" />
          <div className="max-w-7xl mx-auto px-6 space-y-8">
            <div className="space-y-5 text-center">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">ARGO Data Upload</h1>
              <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">Upload single files or entire folders of NetCDF, CSV, or JSON oceanographic datasets. Convert NetCDF to CSV and perform bulk exports efficiently.</p>
            </div>
          </div>
          <div className="absolute bottom-0 inset-x-0 h-16 pointer-events-none select-none">
            <svg className="w-full h-full text-ocean-900" preserveAspectRatio="none" viewBox="0 0 1440 160" aria-hidden="true">
              <path fill="url(#uploadWaveGrad)" d="M0 80L60 74.7C120 69 240 58 360 69.3C480 80 600 112 720 117.3C840 122 960 101 1080 85.3C1200 69 1320 58 1380 53.3L1440 48V160H1380C1320 160 1200 160 1080 160C960 160 840 160 720 160C600 160 480 160 360 160C240 160 120 160 60 160H0V80Z" />
              <defs>
                <linearGradient id="uploadWaveGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 -mt-2 pb-20 space-y-10">

        {/* Upload Instructions */}
        <div className="rounded-2xl p-8 bg-white/[0.03] backdrop-blur border border-white/[0.08]">
          <h2 className="text-xl font-semibold text-white mb-6 tracking-tight">Supported Formats</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { code: 'NC', title: 'NetCDF Files', desc: 'CF-compliant ocean floats', note: 'Convert to CSV available', color: 'from-ocean-500 to-ocean-600' },
              { code: 'CSV', title: 'CSV Files', desc: 'Tabular measurement data', note: undefined, color: 'from-coral-500 to-coral-600' },
              { code: 'JSON', title: 'JSON Files', desc: 'Structured metadata sets', note: undefined, color: 'from-ocean-400 to-coral-400' }
            ].map(card => (
              <div key={card.code} className="group relative rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-cyan-400/20 transition-all duration-300">
                <div className="h-full rounded-xl p-5 flex flex-col">
                  <div className="w-12 h-12 rounded-lg bg-cyan-400/10 text-cyan-400 font-bold grid place-items-center mb-3 border border-cyan-400/20">{card.code}</div>
                  <h3 className="font-semibold text-white text-sm mb-1 tracking-tight">{card.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed flex-1">{card.desc}</p>
                  {card.note && <p className="mt-2 text-[10px] uppercase tracking-wide text-cyan-400 font-medium">{card.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Drag and Drop Area */}
        <div
          id="upload-dropzone"
          role="region"
          aria-label="File upload dropzone"
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-floatchat-accent ${
            isDragging
              ? 'border-floatchat-accent bg-floatchat-accent/10 scale-[1.01]'
              : 'border-white/[0.15] bg-white/[0.03] hover:bg-white/[0.06]'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              fileInputRef.current?.click();
            }
          }}
        >
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-cyan-400/10 rounded-full flex items-center justify-center border border-cyan-400/20">
              <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">
                {isDragging ? 'Drop files here' : 'Drag & drop files or folders'}
              </h3>
              <p className="text-slate-400 mt-2 text-sm md:text-base leading-relaxed">
                Supports .nc, .csv, and .json files. You can upload individual files or entire folders.
                <br />
                <span className="text-cyan-400 font-medium">NetCDF files can be converted to CSV format for easier analysis.</span>
              </p>
            </div>
            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={() => {
                  if (DEBUG) console.log('[upload] select files click');
                  if (!fileInputRef.current) {
                    addToast({ type: 'error', message: 'File input not ready' });
                    return;
                  }
                  fileInputRef.current.click();
                }}
                className="bg-floatchat-accent text-white px-6 py-3 rounded-lg font-medium hover:brightness-110 transition-colors flex items-center gap-2 shadow-ocean-sm focus-visible:ring-2 focus-visible:ring-white/60"
                aria-label="Select files"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Select Files
              </button>
              <button
                type="button"
                onClick={() => {
                  if (DEBUG) console.log('[upload] select folder click');
                  if (!folderInputRef.current) {
                    addToast({ type: 'error', message: 'Folder input not ready' });
                    return;
                  }
                  folderInputRef.current.click();
                }}
                className="bg-white/[0.08] text-white px-6 py-3 rounded-lg font-medium hover:bg-white/[0.12] transition-colors flex items-center gap-2 border border-white/[0.15] focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                aria-label="Select folder"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                Select Folder
              </button>
            </div>
          </div>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".nc,.csv,.json"
            multiple
            className="hidden"
            aria-hidden="true"
            onChange={(e) => {
              const fl = e.target.files;
              if (DEBUG) console.log('[upload] file input change', fl?.length);
              if (fl && fl.length > 0) addFiles(fl);
              e.target.value = '';
            }}
          />
          <input
            ref={folderInputRef}
            type="file"
            /* @ts-ignore */
            webkitdirectory=""
            multiple
            className="hidden"
            aria-hidden="true"
            onChange={(e) => {
              const fl = e.target.files;
              if (DEBUG) console.log('[upload] folder input change', fl?.length);
              if (fl && fl.length > 0) addFiles(fl);
              e.target.value = '';
            }}
          />
        </div>

        {/* Upload Progress for Large Batches */}
        {isUploading && uploadStats && (
          <div className="bg-ocean-900/40 border border-ocean-500/30 rounded-xl p-6 mb-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white/90 mb-4 tracking-tight">Upload Progress</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-ocean-100/70">Batch Progress:</span>
                <span className="text-ocean-50/90">
                  {uploadStats.currentBatch} of {uploadStats.totalBatches}
                </span>
              </div>
              <div className="w-full bg-ocean-950/40 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-floatchat-gradientFrom to-floatchat-gradientTo h-2 rounded-full transition-all duration-300 shadow-[0_0_0_1px_rgba(255,255,255,0.15)]"
                  style={{ 
                    width: `${(uploadStats.currentBatch / uploadStats.totalBatches) * 100}%` 
                  }}
                />
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-ocean-50 font-semibold">{uploadStats.completed}</div>
                  <div className="text-ocean-100/60">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-coral-400 font-semibold">{uploadStats.errors}</div>
                  <div className="text-ocean-100/60">Errors</div>
                </div>
                <div className="text-center">
                  <div className="text-ocean-100 font-semibold">{uploadStats.total}</div>
                  <div className="text-ocean-100/60">Total</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* File List */}
        {files.length > 0 && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-floatchat-primary/10 shadow-lg">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-floatchat-primary">
                Files to Upload ({files.length})
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={clearAll}
                  disabled={isUploading}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
                >
                  Clear All
                </button>
                {files.some(f => f.file.name.toLowerCase().endsWith('.nc')) && (
                  <button
                    onClick={handleBulkDownload}
                    disabled={isBulkProcessing || isUploading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm relative"
                    title="Bulk convert NetCDF files to CSV"
                  >
                    {isBulkProcessing && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                    )}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {isBulkProcessing ? 'Processing...' : 'Bulk CSV'}
                  </button>
                )}
                <button
                  onClick={uploadFiles}
                  disabled={isUploading || files.filter(f => f.status === 'pending').length === 0}
                  className="bg-floatchat-accent text-white px-6 py-2 rounded-lg font-medium hover:bg-floatchat-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Upload All
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {files.map((fileItem) => (
                <div key={fileItem.id} className="p-4 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center gap-4">
                    {getFileIcon(fileItem.file.name)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {fileItem.file.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {formatFileSize(fileItem.file.size)}
                          </span>
                          {fileItem.status === 'success' && (
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                          {fileItem.status === 'error' && (
                            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )}
                          {fileItem.file.name.toLowerCase().endsWith('.nc') && (
                            <button
                              onClick={() => handleConvertToCSV(fileItem)}
                              disabled={isConverting || fileItem.status === 'uploading'}
                              className="text-blue-600 hover:text-blue-800 disabled:opacity-50 flex items-center gap-1 text-xs bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded"
                              title="Convert NetCDF to CSV"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                              </svg>
                              CSV
                            </button>
                          )}
                          <button
                            onClick={() => removeFile(fileItem.id)}
                            disabled={fileItem.status === 'uploading'}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {fileItem.status === 'uploading' && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-floatchat-secondary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${fileItem.progress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{fileItem.progress}% uploaded</p>
                        </div>
                      )}
                      {fileItem.status === 'error' && fileItem.error && (
                        <p className="text-xs text-red-600 mt-1">{fileItem.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-center">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-floatchat-primary hover:text-floatchat-secondary transition-colors font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Ocean Explorer
          </Link>
        </div>

        {/* Minimized Progress Indicator */}
        {isProgressMinimized && isBulkProcessing && (
          <div className="fixed bottom-4 left-4 z-50">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 min-w-[280px]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-900">Bulk Download</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={restoreProgress}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                    title="Restore window"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </button>
                  <button
                    onClick={cancelBulkDownload}
                    className="p-1.5 text-red-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                    title="Cancel download"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${bulkDownloadProgress.total > 0 ? (bulkDownloadProgress.current / bulkDownloadProgress.total) * 100 : 0}%` 
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{bulkDownloadProgress.current} of {bulkDownloadProgress.total}</span>
                  <span>{bulkDownloadProgress.total > 0 ? Math.round((bulkDownloadProgress.current / bulkDownloadProgress.total) * 100) : 0}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Download Modal */}
        {showBulkDownloadModal && !isProgressMinimized && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Bulk CSV Download</h3>
                    <p className="text-sm text-gray-600">
                      {files.filter(f => f.file.name.toLowerCase().endsWith('.nc')).length} NetCDF files ready
                    </p>
                  </div>
                </div>

                {isBulkProcessing ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-blue-600">
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Processing files...</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={minimizeProgress}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Minimize window"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <button
                          onClick={cancelBulkDownload}
                          className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Cancel download"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${bulkDownloadProgress.total > 0 ? (bulkDownloadProgress.current / bulkDownloadProgress.total) * 100 : 0}%` 
                        }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 text-center">
                      {bulkDownloadProgress.current} of {bulkDownloadProgress.total} files processed
                    </p>
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500 text-center">
                        You can minimize this window and continue working. The download will continue in the background.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Choose how you would like to download your converted CSV files:
                    </p>
                    
                    <div className="space-y-3">
                      <button
                        onClick={() => performBulkDownload('separate')}
                        className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Download Separately</h4>
                            <p className="text-sm text-gray-600">Individual CSV file for each NetCDF</p>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => performBulkDownload('merged')}
                        className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.581 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.581 4 8 4s8-1.79 8-4M4 7c0-2.21 3.581-4 8-4s8 1.79 8 4" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Download Merged</h4>
                            <p className="text-sm text-gray-600">Single CSV with all data combined</p>
                          </div>
                        </div>
                      </button>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={() => setShowBulkDownloadModal(false)}
                        className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* NetCDF to CSV Conversion Modal */}
        {showConversionModal && selectedFileForConversion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Convert NetCDF to CSV
                  </h3>
                  <button
                    onClick={() => setShowConversionModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Converting: {selectedFileForConversion.file.name}
                </p>
              </div>
              
              <div className="p-6 max-h-96 overflow-y-auto">
                {selectedFileForConversion.netcdfMetadata && (
                  <div className="space-y-4">
                    {/* Variable Selection */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Select Variables to Export</h4>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        {Object.entries(selectedFileForConversion.netcdfMetadata.variables).map(([name, variable]) => (
                          <label key={name} className="flex items-center space-x-2 text-sm">
                            <input
                              type="checkbox"
                              checked={conversionOptions.selectedVariables.includes(name)}
                              onChange={(e) => {
                                const newSelected = e.target.checked
                                  ? [...conversionOptions.selectedVariables, name]
                                  : conversionOptions.selectedVariables.filter(v => v !== name);
                                setConversionOptions(prev => ({
                                  ...prev,
                                  selectedVariables: newSelected
                                }));
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-gray-700">{name}</span>
                            <span className="text-xs text-gray-500">({variable.attributes.units || 'N/A'})</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Conversion Options */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={conversionOptions.includeMetadata}
                            onChange={(e) => setConversionOptions(prev => ({
                              ...prev,
                              includeMetadata: e.target.checked
                            }))}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Include metadata as comments</span>
                        </label>
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Timestamp Format</label>
                        <select
                          value={conversionOptions.timestampFormat}
                          onChange={(e) => setConversionOptions(prev => ({
                            ...prev,
                            timestampFormat: e.target.value as 'iso' | 'unix' | 'original'
                          }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-1 text-sm"
                        >
                          <option value="iso">ISO 8601 (YYYY-MM-DD)</option>
                          <option value="unix">Unix Timestamp</option>
                          <option value="original">Original Format</option>
                        </select>
                      </div>
                    </div>

                    {/* File Info */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h5 className="font-medium text-gray-900 mb-2">File Information</h5>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Dimensions: {Object.entries(selectedFileForConversion.netcdfMetadata.dimensions).map(([name, size]) => `${name}(${size})`).join(', ')}</div>
                        <div>Variables: {Object.keys(selectedFileForConversion.netcdfMetadata.variables).length}</div>
                        <div>Global Attributes: {Object.keys(selectedFileForConversion.netcdfMetadata.globalAttributes).length}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowConversionModal(false)}
                  disabled={isConverting}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={performConversion}
                  disabled={isConverting || conversionOptions.selectedVariables.length === 0}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isConverting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Converting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download CSV
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}