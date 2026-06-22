import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import DraftPool from './DraftPool';
import CalendarGrid from './CalendarGrid';
import { useCalendarStore } from './store';
import { draftsApi, scheduleApi } from './api';

export default function App() {
  const setDrafts = useCalendarStore((s) => s.setDrafts);
  const setSchedule = useCalendarStore((s) => s.setSchedule);
  const toasts = useCalendarStore((s) => s.toasts);
  const removeToast = useCalendarStore((s) => s.removeToast);

  useEffect(() => {
    (async () => {
      try {
        const [drafts, schedule] = await Promise.all([
          draftsApi.getAll(),
          scheduleApi.getAll()
        ]);
        setDrafts(drafts);
        setSchedule(schedule);
      } catch (e) {
        console.error('Failed to load initial data:', e);
      }
    })();
  }, [setDrafts, setSchedule]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: '#121212'
      }}
    >
      <header
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid #2a2a3e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <h1
          style={{
            fontSize: 20,
            fontWeight: 600,
            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          社交媒体内容日历
        </h1>
        <div style={{ fontSize: 13, color: '#888' }}>
          拖拽草稿到日历完成排期
        </div>
      </header>

      <div className="app-layout">
        <DraftPool />
        <CalendarGrid />
      </div>

      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, right: 24 }}
            animate={{ opacity: 1, y: 0, right: 24 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            onClick={() => removeToast(toast.id)}
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              padding: '12px 20px',
              borderRadius: 8,
              backgroundColor:
                toast.type === 'success'
                  ? '#4caf50'
                  : toast.type === 'error'
                  ? '#f44336'
                  : '#2196f3',
              color: '#fff',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              zIndex: 9999,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
