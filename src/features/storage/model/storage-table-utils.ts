import {
  Archive,
  File,
  FileArchive,
  FileImage,
  FileJson,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Presentation,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const CONTENT_TYPE_OPTIONS = [
  {
    label: 'Documentos',
    value: 'document',
    icon: FileText,
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.oasis.opendocument.text',
      'text/plain',
      'text/markdown',
      'application/rtf',
    ],
  },
  {
    label: 'Hojas de Cálculo',
    value: 'spreadsheet',
    icon: FileSpreadsheet,
    mimeTypes: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.oasis.opendocument.spreadsheet',
      'text/csv',
      'text/tab-separated-values',
    ],
  },
  {
    label: 'Presentaciones',
    value: 'presentation',
    icon: Presentation,
    mimeTypes: [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.oasis.opendocument.presentation',
    ],
  },
  {
    label: 'Imágenes',
    value: 'image',
    icon: FileImage,
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/avif',
      'image/tiff',
      'image/bmp',
    ],
  },
  {
    label: 'Datos',
    value: 'data',
    icon: FileJson,
    mimeTypes: ['application/json', 'application/xml', 'text/xml'],
  },
  {
    label: 'Archivos',
    value: 'archive',
    icon: Archive,
    mimeTypes: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
  },
];

export function getContentTypeIcon(contentType: string) {
  if (contentType === 'application/pdf') return FileText;
  if (contentType.startsWith('image/')) return FileImage;
  if (contentType.startsWith('video/')) return FileVideo;
  if (contentType.includes('zip') || contentType.includes('archive')) return FileArchive;
  return File;
}

export function getContentTypeLabel(contentType: string) {
  if (contentType === 'application/pdf') return 'PDF';
  if (contentType.startsWith('image/')) return 'Image';
  if (contentType.startsWith('video/')) return 'Video';
  if (contentType.includes('zip') || contentType.includes('archive')) return 'ZIP';
  return contentType.split('/')[1]?.toUpperCase() ?? 'File';
}
