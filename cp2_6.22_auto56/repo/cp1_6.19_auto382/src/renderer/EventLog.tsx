import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

const TYPE_COLORS: Record<string, string> = {
  success: '#4CAF50',
  warning: '#F44336',
  info: '#2196F3',
};

const ICON_MAP: Record<string, string> = {
  check: '✓',
  exclamation: '!',
  arrow: '→',
  moon: '🌙',
  sun: '☀',
  person: '👤',
};

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

const EventLog: React.FC = React.memo(() => {
  const eventLog = useGameStore((s) => s.eventLog);

  const panelStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.18)',
    backdropFilter: 'blur(12px)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    maxHeight: 150,
    overflowY: 'auto',
    width: '100%',
  };

  return (
    <div style={panelStyle}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>
        事件日志
      </div>
      <AnimatePresence mode="popLayout">
        {eventLog.map((entry) => (
          <motion.div
            key={entry.id}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 0',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <span
              style={{
                color: TYPE_COLORS[entry.type] ?? '#fff',
                fontWeight: 700,
                fontSize: 12,
                width: 16,
                textAlign: 'center',
              }}
            >
              {ICON_MAP[entry.icon] ?? entry.icon}
            </span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
              {formatTime(entry.timestamp)}
            </span>
            <span style={{ fontSize: 12, color: TYPE_COLORS[entry.type] ?? '#fff', flex: 1 }}>
              {entry.message}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});
EventLog.displayName = 'EventLog';

export default EventLog;
