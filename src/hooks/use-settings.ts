import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import instance from '@/config/api';

export interface FileCategory {
  code: string;
  name: string;
  icon?: string;
  extensions: string[];
  mimes: string[];
}

export type PublicSettings = Record<string, any>;

export const SETTINGS_KEYS = {
  APP_NAME: 'app.name',
  APP_MAINTENANCE_MODE: 'app.maintenance_mode',
  STORAGE_MAX_UPLOAD_SIZE: 'storage.max_upload_size_bytes',
  STORAGE_MAX_ZIP_TOTAL_BYTES: 'storage.max_zip_total_bytes',
  STORAGE_MAX_ZIP_FILE_COUNT: 'storage.max_zip_file_count',
  STORAGE_ZIP_ASYNC_THRESHOLD_BYTES: 'storage.zip_async_threshold_bytes',
  EXPORTS_ASYNC_THRESHOLD_ROWS: 'exports.async_threshold_rows',
  EXPORTS_ASYNC_THRESHOLD_EXCEL_ROWS: 'exports.async_threshold_excel_rows',
  STORAGE_PRESIGNED_EXPIRY_SECONDS: 'storage.presigned_expiry_seconds',
  STORAGE_ALLOWED_MIMETYPES: 'storage.allowed_mimetypes',
  STORAGE_ALLOWED_EXTENSIONS: 'storage.allowed_extensions',
  STORAGE_FILE_CATEGORIES: 'storage.file_categories',
  PAGINATION_DEFAULT_PAGE_SIZE: 'pagination.default_page_size',
  PAGINATION_PAGE_SIZE_OPTIONS: 'pagination.page_size_options',
  PAGINATION_MAX_PAGE_SIZE: 'pagination.max_page_size',
} as const;

export const DEFAULT_MAX_UPLOAD_SIZE_BYTES = 52428800; // 50 MB
export const DEFAULT_MAX_ZIP_TOTAL_BYTES = 104857600; // 100 MB
export const DEFAULT_MAX_ZIP_FILE_COUNT = 100;
export const DEFAULT_STORAGE_ZIP_ASYNC_THRESHOLD_BYTES = 52428800; // 50 MB
export const DEFAULT_EXPORTS_ASYNC_THRESHOLD_ROWS = 5000;
export const DEFAULT_EXPORTS_ASYNC_THRESHOLD_EXCEL_ROWS = 2000;
export const DEFAULT_PRESIGNED_EXPIRY_SECONDS = 3600;
export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
export const DEFAULT_MAX_PAGE_SIZE = 100;

export const DEFAULT_FILE_CATEGORIES: FileCategory[] = [
  {
    code: 'images',
    name: 'Imágenes',
    icon: 'image',
    extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'],
    mimes: ['image/*', 'image/png', 'image/jpeg', 'image/gif', 'image/webp'],
  },
  {
    code: 'documents',
    name: 'Documentos',
    icon: 'file-text',
    extensions: ['pdf', 'doc', 'docx', 'txt'],
    mimes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ],
  },
  {
    code: 'spreadsheets',
    name: 'Hojas de cálculo',
    icon: 'file-spreadsheet',
    extensions: ['xls', 'xlsx', 'csv'],
    mimes: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ],
  },
  {
    code: 'presentations',
    name: 'Presentaciones',
    icon: 'presentation',
    extensions: ['ppt', 'pptx'],
    mimes: [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
  },
  {
    code: 'archives',
    name: 'Archivos comprimidos',
    icon: 'archive',
    extensions: ['zip', 'rar', '7z'],
    mimes: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
  },
];

function deriveCategoriesFromSettings(
  allowedMimes: string[],
  allowedExts: string[]
): FileCategory[] {
  if (allowedMimes.length === 0 && allowedExts.length === 0) {
    return DEFAULT_FILE_CATEGORIES;
  }

  const normalizedExts = new Set(allowedExts.map((e) => e.toLowerCase().replace(/^\./, '')));
  const normalizedMimes = new Set(allowedMimes.map((m) => m.toLowerCase()));

  const derived: FileCategory[] = [];

  for (const template of DEFAULT_FILE_CATEGORIES) {
    const matchedExts = template.extensions.filter((ext) =>
      normalizedExts.size > 0 ? normalizedExts.has(ext.toLowerCase()) : true
    );
    const matchedMimes = template.mimes.filter((mime) =>
      normalizedMimes.size > 0
        ? normalizedMimes.has(mime.toLowerCase()) ||
          normalizedMimes.has(mime.split('/')[0] + '/*')
        : true
    );

    if (matchedExts.length > 0 || matchedMimes.length > 0) {
      derived.push({
        ...template,
        extensions: matchedExts.length > 0 ? matchedExts : template.extensions,
        mimes: matchedMimes.length > 0 ? matchedMimes : template.mimes,
      });
    }
  }

  return derived.length > 0 ? derived : DEFAULT_FILE_CATEGORIES;
}

export async function fetchPublicSettings(): Promise<PublicSettings> {
  const { data } = await instance.get<PublicSettings>('/settings/public');
  return data ?? {};
}

export function useSettings() {
  const {
    data: settings = {},
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<PublicSettings>({
    queryKey: ['settings', 'public'],
    queryFn: fetchPublicSettings,
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 60 * 60 * 1000, // 1 hora
  });

  const getSetting = useCallback(
    <T>(key: string, defaultValue: T): T => {
      if (settings && key in settings && settings[key] !== null && settings[key] !== undefined) {
        return settings[key] as T;
      }
      return defaultValue;
    },
    [settings]
  );

  const maxUploadSizeBytes = useMemo(() => {
    return getSetting<number>(
      SETTINGS_KEYS.STORAGE_MAX_UPLOAD_SIZE,
      DEFAULT_MAX_UPLOAD_SIZE_BYTES
    );
  }, [getSetting]);

  const maxZipTotalBytes = useMemo(() => {
    return getSetting<number>(
      SETTINGS_KEYS.STORAGE_MAX_ZIP_TOTAL_BYTES,
      DEFAULT_MAX_ZIP_TOTAL_BYTES
    );
  }, [getSetting]);

  const maxZipFileCount = useMemo(() => {
    return getSetting<number>(
      SETTINGS_KEYS.STORAGE_MAX_ZIP_FILE_COUNT,
      DEFAULT_MAX_ZIP_FILE_COUNT
    );
  }, [getSetting]);

  const presignedExpirySeconds = useMemo(() => {
    return getSetting<number>(
      SETTINGS_KEYS.STORAGE_PRESIGNED_EXPIRY_SECONDS,
      DEFAULT_PRESIGNED_EXPIRY_SECONDS
    );
  }, [getSetting]);

  const allowedMimetypes = useMemo(() => {
    return getSetting<string[]>(SETTINGS_KEYS.STORAGE_ALLOWED_MIMETYPES, []);
  }, [getSetting]);

  const allowedExtensions = useMemo(() => {
    return getSetting<string[]>(SETTINGS_KEYS.STORAGE_ALLOWED_EXTENSIONS, []);
  }, [getSetting]);

  const fileCategories = useMemo((): FileCategory[] => {
    const rawCategories = getSetting<FileCategory[] | null>(
      SETTINGS_KEYS.STORAGE_FILE_CATEGORIES,
      null
    );
    if (rawCategories && Array.isArray(rawCategories) && rawCategories.length > 0) {
      return rawCategories;
    }
    return deriveCategoriesFromSettings(allowedMimetypes, allowedExtensions);
  }, [getSetting, allowedMimetypes, allowedExtensions]);

  const appName = useMemo(() => {
    return getSetting<string>(SETTINGS_KEYS.APP_NAME, 'FastAPI Plantilla');
  }, [getSetting]);

  const isMaintenance = useMemo(() => {
    return getSetting<boolean>(SETTINGS_KEYS.APP_MAINTENANCE_MODE, false);
  }, [getSetting]);

  const defaultPageSize = useMemo(() => {
    return getSetting<number>(SETTINGS_KEYS.PAGINATION_DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE);
  }, [getSetting]);

  const pageSizeOptions = useMemo(() => {
    return getSetting<number[]>(
      SETTINGS_KEYS.PAGINATION_PAGE_SIZE_OPTIONS,
      DEFAULT_PAGE_SIZE_OPTIONS
    );
  }, [getSetting]);

  const maxPageSize = useMemo(() => {
    return getSetting<number>(SETTINGS_KEYS.PAGINATION_MAX_PAGE_SIZE, DEFAULT_MAX_PAGE_SIZE);
  }, [getSetting]);

  return {
    settings,
    getSetting,
    maxUploadSizeBytes,
    maxZipTotalBytes,
    maxZipFileCount,
    presignedExpirySeconds,
    allowedMimetypes,
    allowedExtensions,
    fileCategories,
    appName,
    isMaintenance,
    defaultPageSize,
    pageSizeOptions,
    maxPageSize,
    isLoading,
    isError,
    error,
    refetch,
  };
}

export function usePaginationConfig() {
  const { defaultPageSize, pageSizeOptions, maxPageSize, settings, isLoading } = useSettings();
  return { defaultPageSize, pageSizeOptions, maxPageSize, settings, isLoading };
}

export function useTablePagination(initialPage = 1) {
  const { defaultPageSize, pageSizeOptions, maxPageSize } = usePaginationConfig();
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(defaultPageSize);

  return {
    page,
    setPage,
    limit,
    setLimit,
    defaultPageSize,
    pageSizeOptions,
    maxPageSize,
  };
}

export function useExportConfig() {
  const { getSetting } = useSettings();

  const asyncThresholdRows = useMemo(() => {
    return getSetting<number>(
      SETTINGS_KEYS.EXPORTS_ASYNC_THRESHOLD_ROWS,
      DEFAULT_EXPORTS_ASYNC_THRESHOLD_ROWS
    );
  }, [getSetting]);

  const asyncThresholdExcelRows = useMemo(() => {
    return getSetting<number>(
      SETTINGS_KEYS.EXPORTS_ASYNC_THRESHOLD_EXCEL_ROWS,
      DEFAULT_EXPORTS_ASYNC_THRESHOLD_EXCEL_ROWS
    );
  }, [getSetting]);

  const zipAsyncThresholdBytes = useMemo(() => {
    return getSetting<number>(
      SETTINGS_KEYS.STORAGE_ZIP_ASYNC_THRESHOLD_BYTES,
      DEFAULT_STORAGE_ZIP_ASYNC_THRESHOLD_BYTES
    );
  }, [getSetting]);

  return {
    asyncThresholdRows,
    asyncThresholdExcelRows,
    zipAsyncThresholdBytes,
  };
}

export const usePublicSettings = useSettings;

export default useSettings;
