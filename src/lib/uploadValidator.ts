/**
 * Upload file validation utilities
 */

export const SUPPORTED_EXTENSIONS = ['.nc', '.csv', '.json'] as const;
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
export const MAX_BATCH_SIZE = 50;

export type SupportedExtension = typeof SUPPORTED_EXTENSIONS[number];

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Check if file extension is supported
 */
export function isValidExtension(filename: string): boolean {
  const ext = filename.toLowerCase().split('.').pop();
  return SUPPORTED_EXTENSIONS.includes(`.${ext}` as SupportedExtension);
}

/**
 * Validate a single file for upload
 */
export function validateFile(file: File): ValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (!isValidExtension(file.name)) {
    return {
      valid: false,
      error: `Unsupported file type. Allowed: ${SUPPORTED_EXTENSIONS.join(', ')}`
    };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024} MB`
    };
  }

  return { valid: true };
}

/**
 * Validate a batch of files for upload
 */
export function validateBatch(files: File[]): ValidationResult {
  if (!files || files.length === 0) {
    return { valid: false, error: 'No files provided' };
  }

  if (files.length > MAX_BATCH_SIZE) {
    return {
      valid: false,
      error: `Batch exceeds maximum of ${MAX_BATCH_SIZE} files. Please upload in smaller batches.`
    };
  }

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const maxBatchBytes = MAX_FILE_SIZE * 2; // Allow 2x single file limit for batch

  if (totalSize > maxBatchBytes) {
    return {
      valid: false,
      error: `Total batch size exceeds ${maxBatchBytes / 1024 / 1024} MB`
    };
  }

  return { valid: true };
}

/**
 * Filter valid files from a batch and return invalid ones separately
 */
export function separateValidFiles(files: File[]): {
  valid: File[];
  invalid: { file: File; reason: string }[];
} {
  const valid: File[] = [];
  const invalid: { file: File; reason: string }[] = [];

  files.forEach((file) => {
    const result = validateFile(file);
    if (result.valid) {
      valid.push(file);
    } else {
      invalid.push({ file, reason: result.error || 'Unknown error' });
    }
  });

  return { valid, invalid };
}
