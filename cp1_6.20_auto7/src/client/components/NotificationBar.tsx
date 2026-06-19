import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, AlertTriangle, X } from 'lucide-react';
import type { NotificationItem } from '../types';
import { cn } from '../lib/utils';

interface NotificationBarProps {
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
}

export const NotificationBar: React.FC<NotificationBarProps> = ({
  notifications,
  onDismiss
}) => {
  const [visibleNotifications, setVisibleNotifications] = useState<NotificationItem[]>([]);
  const [shaking, setShaking] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      setVisibleNotifications((prev) => [latest, ...prev].slice(0, 5));
      setShaking(true);
      
      setTimeout(() => setShaking(false), 500);

      if (containerRef.current) {
        containerRef.current.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }

      setTimeout(() => {
        onDismiss(latest.id);
      }, 5000);
    }
  }, [notifications, onDismiss]);

  const getNotificationStyle = (type: string) => {
    return type === 'feedback'
      ? 'border-l-green-400 bg-green-400/10'
      : 'border-l-yellow-400 bg-yellow-400/10';
  };

  const getNotificationIcon = (type: string) => {
    return type === 'feedback' ? (
      <MessageSquare className="w-4 h-4 text-green-400" />
    ) : (
      <AlertTriangle className="w-4 h-4 text-yellow-400" />
    );
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 max-h-64 overflow-y-auto',
        shaking && 'animate-shake'
      )}
    >
      <div className="p-4 space-y-2">
        {visibleNotifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              'mx-auto max-w-4xl rounded-lg border-l-4 p-4 shadow-lg',
              'animate-fadeIn transform transition-all duration-300',
              getNotificationStyle(notification.type)
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {getNotificationIcon(notification.type)}
                <div>
                  <div className="font-medium text-white">
                    {notification.demoTitle}
                  </div>
                  <div className="text-sm text-gray-400">
                    {notification.message}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(notification.timestamp).toLocaleTimeString('zh-CN')}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onDismiss(notification.id)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};
