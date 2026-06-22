import { motion } from 'framer-motion';
import { Trophy, ShieldAlert, RotateCcw } from 'lucide-react';

interface ResultModalProps {
  winner: 'player' | 'enemy';
  onRestart: () => void;
}

export const ResultModal = ({ winner, onRestart }: ResultModalProps) => {
  const isVictory = winner === 'player';
  const themeColor = isVictory ? '#4CAF50' : '#F44336';
  const Icon = isVictory ? Trophy : ShieldAlert;
  const title = isVictory ? '胜利！' : '失败...';
  const subtitle = isVictory
    ? '敌方飞船已被彻底摧毁！'
    : '我方飞船遭受重创，再接再厉！';

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />
      
      <motion.div
        className="relative z-10 rounded-2xl p-8 max-w-md w-full mx-4 text-center"
        style={{
          backgroundColor: '#2a2a3e',
          border: `3px solid ${themeColor}`,
          boxShadow: `0 0 60px ${themeColor}40, inset 0 0 30px ${themeColor}15`,
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <motion.div
          className="mx-auto mb-4 rounded-full p-4 w-20 h-20 flex items-center justify-center"
          style={{ backgroundColor: `${themeColor}20` }}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', delay: 0.2 }}
        >
          <Icon size={48} style={{ color: themeColor }} />
        </motion.div>

        <motion.h2
          className="text-3xl font-bold mb-2"
          style={{ color: themeColor, fontFamily: 'Orbitron, sans-serif' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {title}
        </motion.h2>

        <motion.p
          className="text-[#E0E0E0] mb-6 opacity-80"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {subtitle}
        </motion.p>

        <motion.div
          className="text-6xl mb-6"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', delay: 0.5 }}
        >
          {isVictory ? '🏆' : '💥'}
        </motion.div>

        <motion.button
          onClick={onRestart}
          className="px-8 py-3 rounded-lg font-bold text-white flex items-center gap-2 mx-auto hover:scale-105 active:scale-95 transition-transform"
          style={{
            backgroundColor: themeColor,
            boxShadow: `0 4px 20px ${themeColor}60`,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <RotateCcw size={20} />
          再来一局
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default ResultModal;
