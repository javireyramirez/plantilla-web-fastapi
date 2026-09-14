import {
  Archive,
  ExternalLink,
  File,
  FileArchive,
  FileImage,
  FileJson,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Presentation,
} from 'lucide-react';

import type { Option } from '@/types/data-table';

// ─── Helpers & Types ──────────────────────────────────────────────────────────

export interface StorageTypeDefinition {
  value: string;
  typeCode: string;
  categoryCode: string;
  icon: any;
  mimeTypes: string[];
}

export interface StorageTypeOption extends Option {
  mimeTypes: string[];
}

export const STORAGE_TYPE_DEFINITIONS: StorageTypeDefinition[] = [
  // Documentos
  {
    value: 'pdf',
    typeCode: 'pdf',
    categoryCode: 'documents',
    icon: FileText,
    mimeTypes: ['application/pdf'],
  },
  {
    value: 'word',
    typeCode: 'word',
    categoryCode: 'documents',
    icon: FileText,
    mimeTypes: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.oasis.opendocument.text',
    ],
  },
  {
    value: 'text',
    typeCode: 'text',
    categoryCode: 'documents',
    icon: FileText,
    mimeTypes: ['text/plain', 'text/markdown', 'application/rtf'],
  },

  // Hojas de Cálculo
  {
    value: 'excel',
    typeCode: 'excel',
    categoryCode: 'spreadsheets',
    icon: FileSpreadsheet,
    mimeTypes: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.oasis.opendocument.spreadsheet',
    ],
  },
  {
    value: 'csv',
    typeCode: 'csv',
    categoryCode: 'spreadsheets',
    icon: FileSpreadsheet,
    mimeTypes: ['text/csv', 'text/tab-separated-values'],
  },

  // Presentaciones
  {
    value: 'powerpoint',
    typeCode: 'powerpoint',
    categoryCode: 'presentations',
    icon: Presentation,
    mimeTypes: [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.oasis.opendocument.presentation',
    ],
  },

  // Imágenes
  {
    value: 'png',
    typeCode: 'png',
    categoryCode: 'images',
    icon: FileImage,
    mimeTypes: ['image/png'],
  },
  {
    value: 'jpeg',
    typeCode: 'jpeg',
    categoryCode: 'images',
    icon: FileImage,
    mimeTypes: ['image/jpeg'],
  },
  {
    value: 'webp',
    typeCode: 'webp',
    categoryCode: 'images',
    icon: FileImage,
    mimeTypes: ['image/webp'],
  },
  {
    value: 'gif',
    typeCode: 'gif',
    categoryCode: 'images',
    icon: FileImage,
    mimeTypes: ['image/gif'],
  },

  // Archivos Comprimidos
  {
    value: 'archive',
    typeCode: 'archive',
    categoryCode: 'archives',
    icon: Archive,
    mimeTypes: [
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/x-tar',
      'application/gzip',
    ],
  },

  // Código y Datos
  {
    value: 'json',
    typeCode: 'json',
    categoryCode: 'code',
    icon: FileJson,
    mimeTypes: ['application/json', 'application/xml', 'text/xml'],
  },
];

export const CONTENT_TYPE_OPTIONS: StorageTypeOption[] = STORAGE_TYPE_DEFINITIONS.map((def) => ({
  value: def.value,
  label: def.typeCode,
  group: def.categoryCode,
  icon: def.icon,
  mimeTypes: def.mimeTypes,
}));

export function getStorageTypeOptions(t: (key: string, options?: any) => string): Option[] {
  return STORAGE_TYPE_DEFINITIONS.map((def) => ({
    value: def.value,
    label: t(`storage.types.${def.typeCode}`, { defaultValue: def.value.toUpperCase() }),
    group: t(`storage.categories.${def.categoryCode}`, { defaultValue: def.categoryCode }),
    icon: def.icon,
  }));
}

export function getContentTypeIcon(contentType: string) {
  if (
    contentType === 'application/x-external-url' ||
    contentType.includes('url') ||
    contentType.includes('link')
  ) {
    return ExternalLink;
  }
  if (contentType === 'application/pdf') return FileText;
  if (contentType.startsWith('image/')) return FileImage;
  if (contentType.startsWith('video/')) return FileVideo;
  if (
    contentType.includes('spreadsheet') ||
    contentType.includes('excel') ||
    contentType.includes('csv')
  ) {
    return FileSpreadsheet;
  }
  if (contentType.includes('presentation') || contentType.includes('powerpoint')) {
    return Presentation;
  }
  if (
    contentType.includes('zip') ||
    contentType.includes('archive') ||
    contentType.includes('tar') ||
    contentType.includes('compressed')
  ) {
    return FileArchive;
  }
  if (contentType.includes('json') || contentType.includes('xml')) return FileJson;
  return File;
}

export function getContentTypeLabel(contentType: string) {
  if (
    contentType === 'application/x-external-url' ||
    contentType.includes('url') ||
    contentType.includes('link')
  ) {
    return 'URL';
  }
  if (contentType === 'application/pdf') return 'PDF';
  if (contentType === 'image/png') return 'PNG';
  if (contentType === 'image/jpeg') return 'JPEG';
  if (contentType === 'image/webp') return 'WebP';
  if (contentType === 'image/gif') return 'GIF';
  if (contentType.startsWith('image/')) return 'Image';
  if (contentType.startsWith('video/')) return 'Video';
  if (contentType.includes('zip') || contentType.includes('archive')) return 'ZIP';
  if (contentType.includes('csv')) return 'CSV';
  if (contentType.includes('excel') || contentType.includes('spreadsheet')) return 'Excel';
  if (contentType.includes('word') || contentType.includes('document')) return 'Word';
  if (contentType.includes('powerpoint') || contentType.includes('presentation')) return 'PowerPoint';
  return contentType.split('/')[1]?.toUpperCase() ?? 'File';
}

