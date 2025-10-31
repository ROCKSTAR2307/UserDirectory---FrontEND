/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { NotificationItem, NotificationKind } from '../types';

interface NotificationContextValue {
  notifications: NotificationItem[];
  showNotification: (message: string, type?: NotificationKind, duration?: number) => number;
  removeNotification: (id: number) => void;
  success: (message: string, duration?: number) => number;
  error: (message: string, duration?: number) => number;
  warning: (message: string, duration?: number) => number;
  info: (message: string, duration?: number) => number;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export const useNotification = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps): JSX.Element => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const timeoutRefs = useRef<Record<number, number>>({});

  const removeNotification = useCallback((id: number) => {
    if (timeoutRefs.current[id]) {
      window.clearTimeout(timeoutRefs.current[id]);
      delete timeoutRefs.current[id];
    }
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  }, []);

  const showNotification = useCallback(
    (message: string, type: NotificationKind = 'info', duration = 4000) => {
      const id = Date.now() + Math.random();
      const entry: NotificationItem = { id, message, type, duration };

      setNotifications((prev) => [...prev, entry]);

      if (duration > 0) {
        const timeoutId = window.setTimeout(() => {
          removeNotification(id);
        }, duration);
        timeoutRefs.current[id] = timeoutId;
      }

      return id;
    },
    [removeNotification]
  );

  const success = useCallback(
    (message: string, duration?: number) => showNotification(message, 'success', duration),
    [showNotification]
  );
  const error = useCallback(
    (message: string, duration?: number) => showNotification(message, 'error', duration),
    [showNotification]
  );
  const warning = useCallback(
    (message: string, duration?: number) => showNotification(message, 'warning', duration),
    [showNotification]
  );
  const info = useCallback(
    (message: string, duration?: number) => showNotification(message, 'info', duration),
    [showNotification]
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
        removeNotification,
        success,
        error,
        warning,
        info
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;



