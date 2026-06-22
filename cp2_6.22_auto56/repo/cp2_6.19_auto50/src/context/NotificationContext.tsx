import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Notification from '../components/Notification';
import { useJobStore } from '../store/useJobStore';

interface NotificationData {
  id: string;
  candidateName: string;
  jobId: string;
  bonus: number;
}

interface NotificationContextType {
  showNotification: (data: Omit<NotificationData, 'id'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const getJobById = useJobStore((state) => state.getJobById);

  const showNotification = useCallback((data: Omit<NotificationData, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const notification: NotificationData = {
      id,
      candidateName: data.candidateName,
      jobId: data.jobId,
      bonus: data.bonus,
    };
    setNotifications((prev) => [...prev, notification]);
  }, []);

  const handleClose = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notifications.map((notification) => {
        const job = getJobById(notification.jobId);
        return (
          <Notification
            key={notification.id}
            candidateName={notification.candidateName}
            jobTitle={job?.title || '该职位'}
            bonus={notification.bonus}
            redirectTo="/rewards"
            onClose={() => handleClose(notification.id)}
          />
        );
      })}
    </NotificationContext.Provider>
  );
};
