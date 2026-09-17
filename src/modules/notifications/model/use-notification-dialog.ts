import { create } from 'zustand';

import { NotificationItem } from './notifications.types';

interface NotificationDialogStore {
  selectedNotification: NotificationItem | null;
  isOpen: boolean;
  openDialog: (notification: NotificationItem) => void;
  closeDialog: () => void;
}

export const useNotificationDialog = create<NotificationDialogStore>((set) => ({
  selectedNotification: null,
  isOpen: false,
  openDialog: (notification) =>
    set({ selectedNotification: notification, isOpen: true }),
  closeDialog: () =>
    set({ selectedNotification: null, isOpen: false }),
}));
