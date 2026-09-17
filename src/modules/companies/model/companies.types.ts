export const SECTOR_OPTIONS = [
  {
    label: 'Tecnología',
    value: 'tecnologia',
  },
  {
    label: 'Banca',
    value: 'banca',
  },
  {
    label: 'Seguros',
    value: 'seguros',
  },
];

export interface CompanyNotifyPayload {
  recipient_id: string;
  title: string;
  comment: string;
  notification_type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'SYSTEM';
  action_url?: string;
  data?: Record<string, any>;
}

