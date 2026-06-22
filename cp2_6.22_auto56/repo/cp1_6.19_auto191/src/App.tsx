import { useState, useEffect, useCallback } from 'react';
import { Panel } from './components/Panel';
import { Preview } from './components/Preview';
import { useAppStore } from './store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const { replaceFavorite } = useAppStore();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showReplaceHint, setShowReplaceHint] = useState(false);

  const showToast = useCallback((message: string, isError = false) => {
    setToast({ message, type: isError ? 'error' : 'success' });
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleFavoriteAddResult = useCallback(
    (message: string, isError = false) => {
      if (message.includes('收藏夹已满')) {
        setShowReplaceHint(true);
        setTimeout(() => {
          setShowReplaceHint(false);
        }, 5000);
      }
      showToast(message, isError);
    },
    [showToast]
  );

  const handleReplaceFavorite = useCallback(
    (index: number) => {
      replaceFavorite(index);
      setShowReplaceHint(false);
      showToast('已替换收藏');
    },
    [replaceFavorite, showToast]
  );

  return (
    <div className="app">
      <motion.header
        className="app-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="app-title">手工皮具定制预览</h1>
        <p className="app-subtitle">社区手作工坊 · 自由搭配木材与金属配件</p>
      </motion.header>

      <div className="main-layout">
        <Panel onFavoriteAddResult={handleFavoriteAddResult} />
        <Preview
          showReplaceHint={showReplaceHint}
          onReplaceFavorite={handleReplaceFavorite}
        />
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            className={`toast ${toast.type}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
