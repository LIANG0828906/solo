import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ToastNotification } from '@/types';

interface ToastProps {
  notifications: ToastNotification[];
  onRemove: (id: string) => void;
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export default function Toast({ notifications, onRemove }: ToastProps) {
  const [visibleList, setVisibleList] = useState<ToastNotification[]>([]);

  useEffect(() => {
    setVisibleList(notifications.slice(-3));
  }, [notifications]);

  return (
    <div
      className="fixed z-50 flex flex-col gap-2"
      style={{ bottom: '24px', right: '24px' }}
    >
      <AnimatePresence mode="popLayout">
        {visibleList.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastItemProps {
  toast: ToastNotification;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <motion.div
      layout
      initial={{ x: '120%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '120%', opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col justify-center bg-white"
      style={{
        width: '300px',
        height: '60px',
        borderRadius: '8px',
        borderLeft: '2px solid #4FC3F7',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        padding: '0 16px',
      }}
    >
      <div className="text-sm font-medium text-gray-800 truncate">
        新匹配：{toast.itemName}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {formatTime(toast.timestamp)}
      </div>
    </motion.div>
  );
}
