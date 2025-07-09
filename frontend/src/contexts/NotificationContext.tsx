import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Notification, NotificationType } from './NotificationTypes';
// If the import fails, try '../contexts/NotificationTypes' or adjust as needed.

interface NotificationContextType {
  notifications: Notification[];
  notify: (message: string, type?: NotificationType) => void;
  remove: (id: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const idRef = React.useRef(0);

  const remove = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, type: NotificationType = 'info') => {
      const id = ++idRef.current;
      setNotifications((notifs) => [...notifs, { id, message, type }]);
      setTimeout(() => remove(id), 4000);
    },
    [remove]
  );

  return (
    <NotificationContext.Provider value={{ notifications, notify, remove }}>
      {children}
    </NotificationContext.Provider>
  );
};

const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
};

export { NotificationProvider, useNotification };
