import React, { useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Cookie } from 'lucide-react';
import { useSnackStore } from './store/snackStore.tsx';
import SnackCard from './components/SnackCard';
import DetailPanel from './components/DetailPanel';
import SuggestionPanel from './components/SuggestionPanel';
import AddSnackModal from './components/AddSnackModal';

const App: React.FC = () => {
  const { state, dispatch } = useSnackStore();
  const { snacks, selectedSnackId, highlightedSnackId } = state;
  const [newestSnackId, setNewestSnackId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (snacks.length > 0) {
      const latestSnack = snacks[0];
      if (Date.now() - latestSnack.createdAt < 1000) {
        setNewestSnackId(latestSnack.id);
        const timer = setTimeout(() => setNewestSnackId(null), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [snacks]);

  const handleAddClick = useCallback(() => {
    dispatch({ type: 'TOGGLE_MODAL', payload: true });
  }, [dispatch]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const pulseAnimation = {
    scale: [1, 1.1, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: '#FDF5E6', fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif" }}
    >
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <motion.nav
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="h-[60px] w-full flex items-center justify-center sticky top-0 z-40"
        style={{
          backgroundColor: '#4A2F1A',
          transition: 'background-color 0.3s ease',
        }}
      >
        <div className="w-full max-w-[900px] px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cookie size={28} className="text-white" />
            <h1 className="text-white text-lg font-bold tracking-wide">零食仓库</h1>
          </div>
          <div className="text-white/80 text-sm">
            共 {snacks.length} 样零食
          </div>
        </div>
      </motion.nav>

      <main className="relative">
        <div className="mx-auto max-w-[900px] px-6 py-8">
          <AnimatePresence mode="popLayout">
            {snacks.length > 0 ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid gap-6 justify-center"
                style={{
                  gridTemplateColumns: 'repeat(auto-fill, 200px)',
                }}
              >
                {snacks.map((snack, index) => (
                  <SnackCard
                    key={snack.id}
                    snack={snack}
                    index={index}
                    isNew={snack.id === newestSnackId}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <Cookie size={64} className="text-[#4A2F1A]/30 mb-4" />
                <h3 className="text-xl font-bold text-[#4A2F1A]/60 mb-2">
                  零食仓库空空如也
                </h3>
                <p className="text-sm text-[#4A2F1A]/40">
                  点击右下角按钮添加你的第一样零食吧
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <SuggestionPanel />
        <DetailPanel />
        <AddSnackModal />
      </main>

      <motion.button
        onClick={handleAddClick}
        animate={pulseAnimation}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.95 }}
        className="fixed z-40 flex items-center justify-center shadow-lg"
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#6C5CE7',
          bottom: isMobile ? '110px' : '30px',
          right: isMobile ? '50%' : '30px',
          transform: isMobile ? 'translateX(50%)' : 'none',
          boxShadow: '0 4px 20px rgba(108, 92, 231, 0.4)',
        }}
      >
        <Plus size={28} className="text-white" strokeWidth={2.5} />
      </motion.button>
    </div>
  );
};

export default App;
