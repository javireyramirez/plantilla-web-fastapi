export type ImportFormat = 'excel' | 'csv';

export type ImportMode = 'atomic' | 'partial';

export interface RowError {
  row: number;
  field: string;
  message: string;
  value?: any;
}

export interface ImportResult {
  total_rows: number;
  imported_rows: number;
  failed_rows: number;
  total_errors: number;
  truncated: boolean;
  errors_file_key: string | null;
  mode: ImportMode;
  dry_run: boolean;
  errors: RowError[];
}

export interface ImportUploadOptions {
  mode?: ImportMode;
  dryRun?: boolean;
}
