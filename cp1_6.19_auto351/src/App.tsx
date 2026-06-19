import { useEffect, useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import StatusBar from '@/components/StatusBar';
import BackpackPanel from '@/components/BackpackPanel';
import Workbench from '@/components/Workbench';
import CraftHistory from '@/components/CraftHistory';

export default function App() {
  const toast = useGameStore((s) => s.toast);
  const setToast = useGameStore((s) => s.setToast);
  const tickSurvival = useGameStore((s) => s.tickSurvival);

  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    if (toast) {
      setToastVisible(true);
      const timer = setTimeout(() => {
        setToastVisible(false);
        setTimeout(() => setToast(null), 300);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [toast, setToast]);

  useEffect(() => {
    const interval = setInterval(() => {
      tickSurvival();
    }, 5000);
    return () => clearInterval(interval);
  }, [tickSurvival]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <StatusBar />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="w-full md:w-[40%] h-[45%] md:h-full border-r-0 md:border-r-[2px] border-[#424242] overflow-hidden bg-[#1e1e1e]">
          <BackpackPanel />
        </div>

        <div className="w-full md:w-[60%] h-[55%] md:h-full overflow-hidden bg-[#1e1e1e]">
          <Workbench />
        </div>
      </div>

      <CraftHistory />

      <AnimatePresence>
        {toast && toastVisible && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg"
            style={{
              backgroundColor: toast.type === 'error' ? '#c62828' : '#2e7d32',
              color: '#fff',
              border: toast.type === 'error' ? '1px solid #e53935' : '1px solid #4caf50',
            }}
          >
            {toast.type === 'error' ? '⚠️' : '✓'} {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
