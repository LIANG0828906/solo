import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { Sparkles, RotateCcw } from 'lucide-react';

const WinPanel = () => {
  const { gameStatus, totalMoves, resetGame } = useGameStore();

  const isVisible = gameStatus === 'won';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="pointer-events-auto"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            style={{
              background: 'rgba(255, 215, 0, 0.15)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid #ffd700',
              borderRadius: '24px',
              padding: '48px 64px',
              textAlign: 'center',
              boxShadow: '0 0 60px rgba(255, 215, 0, 0.4)',
            }}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
                className="mb-4 flex justify-center"
              >
                <Sparkles size={48} color="#ffd700" />
              </motion.div>
              <h2
                className="text-3xl font-bold mb-4"
                style={{
                  color: '#ffd700',
                  fontFamily: "'Cinzel Decorative', serif",
                  textShadow: '0 0 20px rgba(255, 215, 0, 0.8)',
                }}
              >
                封印已解封！
              </h2>
              <p
                className="text-xl mb-2"
                style={{
                  color: '#ffd700',
                  fontFamily: "'Cinzel Decorative', serif",
                }}
              >
                魔力增幅！
              </p>
              <p
                className="text-lg mb-8"
                style={{ color: '#f5deb3' }}
              >
                总步数：<span style={{ color: '#ffd700', fontWeight: 'bold' }}>{totalMoves}</span> 步
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetGame}
                className="flex items-center justify-center gap-2 mx-auto px-8 py-3 rounded-full font-bold text-lg"
                style={{
                  background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
                  color: '#2f1a0e',
                  boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)',
                }}
              >
                <RotateCcw size={20} />
                再来一局
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WinPanel;
