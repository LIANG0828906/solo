import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLogStore, downloadFile } from '../store/logStore';
import type { LogType } from '../core/types';

const TYPE_COLORS: Record<LogType, { bg: string; border: string; text: string; label: string }> = {
  env: { bg: '#1565C0', border: '#42A5F5', text: '#E3F2FD', label: '环境' },
  breed: { bg: '#6A1B9A', border: '#AB47BC', text: '#F3E5F5', label: '育种' },
  stage: { bg: '#2E7D32', border: '#66BB6A', text: '#E8F5E9', label: '阶段' },
};

export function LogPanel() {
  const [expanded, setExpanded] = useState(false);
  const entries = useLogStore((s) => s.entries);
  const exportJSON = useLogStore((s) => s.exportJSON);
  const exportCSV = useLogStore((s) => s.exportCSV);
  const globalTime = useLogStore((s) => s.globalTime);

  const handleExportJSON = () => {
    const content = exportJSON();
    downloadFile(content, `plant-logs-${Date.now()}.json`, 'application/json');
  };

  const handleExportCSV = () => {
    const content = exportCSV();
    downloadFile(content, `plant-logs-${Date.now()}.csv`, 'text/csv');
  };

  const unread = entries.length;

  return (
    <>
      <AnimatePresence initial={false}>
        {!expanded && (
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setExpanded(true)}
            style={{
              position: 'fixed', right: 12, bottom: 12, zIndex: 35,
              background: 'rgba(33, 33, 33, 0.92)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 24, padding: '8px 16px',
              display: 'flex', alignItems: 'center', gap: 8,
              cursor: 'pointer', color: '#fff',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            }}
          >
            <span style={{ fontSize: 16 }}>📋</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>生长日志</span>
            {unread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
                style={{
                  background: '#4CAF50', color: '#fff',
                  fontSize: 11, fontWeight: 700,
                  borderRadius: 10, padding: '1px 7px',
                  minWidth: 18, textAlign: 'center',
                }}
              >
                {unread > 200 ? '200+' : unread}
              </motion.span>
            )}
            <span style={{ fontSize: 11, color: '#90A4AE', marginLeft: 4 }}>
              {globalTime.toFixed(1)}s
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {expanded && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{
              position: 'fixed', right: 12, bottom: 12, zIndex: 35,
              width: 360, maxWidth: 'calc(100vw - 24px)',
              maxHeight: '70vh',
              background: 'rgba(33, 33, 33, 0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', padding: '10px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📋</span>
                <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
                  生长日志
                </span>
                <span style={{
                  background: '#4CAF5022', color: '#81C784',
                  fontSize: 11, padding: '2px 8px', borderRadius: 10,
                  border: '1px solid #4CAF5033',
                }}>
                  {entries.length}条
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleExportJSON}
                  title="导出JSON"
                  style={{
                    background: '#1565C022', border: '1px solid #42A5F533',
                    color: '#64B5F6',
                    padding: '5px 10px', borderRadius: 4,
                    cursor: 'pointer', fontSize: 11, fontWeight: 500,
                  }}
                >
                  JSON
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleExportCSV}
                  title="导出CSV"
                  style={{
                    background: '#2E7D3222', border: '1px solid #66BB6A33',
                    color: '#81C784',
                    padding: '5px 10px', borderRadius: 4,
                    cursor: 'pointer', fontSize: 11, fontWeight: 500,
                  }}
                >
                  CSV
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setExpanded(false)}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: '#90A4AE',
                    padding: '5px 10px', borderRadius: 4,
                    cursor: 'pointer', fontSize: 12,
                  }}
                >
                  ✕
                </motion.button>
              </div>
            </div>

            <div style={{
              flex: 1, overflowY: 'auto', padding: '6px 8px',
            }}>
              {entries.length === 0 && (
                <div style={{
                  padding: 32, textAlign: 'center',
                  color: '#546E7A', fontSize: 12,
                }}>
                  暂无日志记录，调节环境参数或操作植物来生成日志
                </div>
              )}
              {entries.map((e) => {
                const tc = TYPE_COLORS[e.type];
                return (
                  <motion.div
                  key={e.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    style={{
                      padding: '8px 10px',
                      margin: '4px 2px',
                      borderRadius: 6,
                      background: 'rgba(255,255,255,0.02)',
                      borderLeft: `3px solid ${tc.border}`,
                      display: 'flex',
                      gap: 8,
                      alignItems: 'flex-start',
                    }}
                  >
                    <span style={{
                      background: tc.bg, color: tc.text,
                      fontSize: 10, fontWeight: 700,
                      padding: '2px 6px', borderRadius: 3,
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}>
                      {tc.label}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        color: '#E0E0E0', fontSize: 12,
                        lineHeight: 1.5, wordBreak: 'break-word',
                      }}>
                        {e.message}
                      </div>
                    </div>
                    <span style={{
                      color: '#546E7A', fontSize: 10,
                      fontFamily: 'monospace', flexShrink: 0,
                      paddingTop: 2,
                    }}>
                      {e.time.toFixed(1)}s
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
