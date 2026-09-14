import { ColumnDef } from '@tanstack/react-table';

export interface Document {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  url: string;
  externalUrl?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  isTrash: boolean;
  entityType?: string;
  entityId?: string;
  modulePrincipalEntity?: {
    code: string;
    name: string;
    entity_name?: string | null;
    entity_id?: string | null;
  } | null;
}

export interface DocumentsTableProps {
  entityType?: string;
  entityId?: string;
  isTrash?: boolean;
  columns: ColumnDef<Document>[];
}

export interface DocumentsTableComponentProps extends Omit<DocumentsTableProps, 'columns'> {
  className?: string;
}
