import { ColumnDef } from '@tanstack/react-table';

export interface Document {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  url: string;
  createdAt: string;
  updatedAt: string;
  isTrash: boolean;
}

export interface DocumentsTableProps {
  entityType: string;
  entityId: string;
  isTrash?: boolean;
  columns: ColumnDef<Document>[];
}

export interface DocumentsTableComponentProps extends Omit<DocumentsTableProps, 'columns'> {}
