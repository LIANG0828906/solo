import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useCabinetStore from '../store/useCabinetStore';

const typeConfig = {
  success: { bg: 'rgba(39, 174, 96, 0.9)', icon: 'OK' },
  error: { bg: 'rgba(231, 76, 60, 0.9)', icon: 'ERR' },
  warning: { bg: 'rgba(230, 126, 34, 0.9)', icon: 'WARN' },
  info: { bg: 'rgba(52, 152, 219, 0.9)', icon: 'INFO' },
};

export default function NotificationBar() {
  const { notifications } = useCabinetStore();

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column-reverse',
      alignItems: 'center',
      gap: 8,
      padding: '12px 16px',
      background: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(0,0,0,0.05)',
    }}>
      <AnimatePresence>
        {notifications.map((n) => {
          const config = typeConfig[n.type] || typeConfig.info;
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              style={{
                background: config.bg,
                color: '#fff',
                padding: '10px 20px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                maxWidth: 500,
                width: '100%',
              }}
            >
              <span style={{
                background: 'rgba(255,255,255,0.25)',
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 700,
                flexShrink: 0,
              }}>
                {config.icon}
              </span>
              <span>{n.message}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
