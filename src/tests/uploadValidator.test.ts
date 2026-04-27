import {
  isValidExtension,
  validateFile,
  validateBatch,
  separateValidFiles,
  SUPPORTED_EXTENSIONS,
  MAX_FILE_SIZE,
  MAX_BATCH_SIZE
} from '../lib/uploadValidator';

describe('uploadValidator', () => {
  describe('isValidExtension', () => {
    it('should accept .nc files', () => {
      expect(isValidExtension('data.nc')).toBe(true);
      expect(isValidExtension('PROFILE.NC')).toBe(true);
    });

    it('should accept .csv files', () => {
      expect(isValidExtension('export.csv')).toBe(true);
    });

    it('should accept .json files', () => {
      expect(isValidExtension('metadata.json')).toBe(true);
    });

    it('should reject unsupported extensions', () => {
      expect(isValidExtension('document.pdf')).toBe(false);
      expect(isValidExtension('image.png')).toBe(false);
      expect(isValidExtension('script.js')).toBe(false);
    });

    it('should reject files without extension', () => {
      expect(isValidExtension('noextension')).toBe(false);
    });
  });

  describe('validateFile', () => {
    const createMockFile = (name: string, size: number): File => {
      const blob = new Blob([new ArrayBuffer(size)]);
      return new File([blob], name);
    };

    it('should validate a proper file', () => {
      const file = createMockFile('data.nc', 1024);
      const result = validateFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty files', () => {
      const file = createMockFile('data.nc', 0);
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should reject files exceeding max size', () => {
      const file = createMockFile('huge.nc', MAX_FILE_SIZE + 1);
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum size');
    });

    it('should reject unsupported file types', () => {
      const file = createMockFile('image.png', 1024);
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported file type');
    });
  });

  describe('validateBatch', () => {
    const createMockFile = (name: string, size: number): File => {
      const blob = new Blob([new ArrayBuffer(size)]);
      return new File([blob], name);
    };

    it('should validate a proper batch', () => {
      const files = [
        createMockFile('file1.nc', 1024),
        createMockFile('file2.csv', 2048)
      ];
      const result = validateBatch(files);
      expect(result.valid).toBe(true);
    });

    it('should reject empty batch', () => {
      const result = validateBatch([]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('No files');
    });

    it('should reject batches exceeding max count', () => {
      const files = Array.from({ length: MAX_BATCH_SIZE + 1 }, (_, i) =>
        createMockFile(`file${i}.nc`, 1024)
      );
      const result = validateBatch(files);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum');
    });

    it('should reject batches with excessive total size', () => {
      const files = [
        createMockFile('big1.nc', MAX_FILE_SIZE),
        createMockFile('big2.nc', MAX_FILE_SIZE),
        createMockFile('big3.nc', 1024) // Over 2x limit
      ];
      const result = validateBatch(files);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Total batch size exceeds');
    });
  });

  describe('separateValidFiles', () => {
    const createMockFile = (name: string, size: number): File => {
      const blob = new Blob([new ArrayBuffer(size)]);
      return new File([blob], name);
    };

    it('should separate valid and invalid files', () => {
      const files = [
        createMockFile('valid.nc', 1024),
        createMockFile('invalid.pdf', 1024),
        createMockFile('empty.csv', 0),
        createMockFile('good.json', 2048)
      ];

      const { valid, invalid } = separateValidFiles(files);

      expect(valid).toHaveLength(2);
      expect(valid.map(f => f.name)).toEqual(['valid.nc', 'good.json']);

      expect(invalid).toHaveLength(2);
      expect(invalid[0].file.name).toBe('invalid.pdf');
      expect(invalid[0].reason).toContain('Unsupported');
      expect(invalid[1].file.name).toBe('empty.csv');
      expect(invalid[1].reason).toContain('empty');
    });

    it('should handle all valid files', () => {
      const files = [
        createMockFile('file1.nc', 1024),
        createMockFile('file2.csv', 2048)
      ];

      const { valid, invalid } = separateValidFiles(files);

      expect(valid).toHaveLength(2);
      expect(invalid).toHaveLength(0);
    });

    it('should handle all invalid files', () => {
      const files = [
        createMockFile('bad.exe', 1024),
        createMockFile('empty.nc', 0)
      ];

      const { valid, invalid } = separateValidFiles(files);

      expect(valid).toHaveLength(0);
      expect(invalid).toHaveLength(2);
    });
  });
});
