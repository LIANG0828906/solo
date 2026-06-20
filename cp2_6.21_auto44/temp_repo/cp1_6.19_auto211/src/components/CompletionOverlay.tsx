import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { NOTE_COLORS, CORRECT_ORDER } from '@/constants';

export default function CompletionOverlay() {
  const isComplete = useGameStore((state) => state.isComplete);
  const resetGame = useGameStore((state) => state.resetGame);

  if (!isComplete) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        backdropFilter: 'blur(4px)',
      }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
        style={{
          textAlign: 'center',
          color: '#FFFFFF',
          padding: 48,
          borderRadius: 24,
          background: 'linear-gradient(135deg, rgba(26, 29, 51, 0.95) 0%, rgba(11, 13, 23, 0.95) 100%)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 60px rgba(255, 215, 0, 0.2)',
        }}
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          style={{ fontSize: 64, marginBottom: 16 }}
        >
          🎵
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{
            fontSize: 36,
            fontWeight: 700,
            marginBottom: 16,
            background: 'linear-gradient(90deg, #FF4136, #FF851B, #FFDC00, #2ECC40, #0074D9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          旋律完成！
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{
            fontSize: 18,
            opacity: 0.8,
            marginBottom: 32,
          }}
        >
          你成功收集了所有音符，奏响了美妙的旋律
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 12,
            marginBottom: 32,
          }}
        >
          {CORRECT_ORDER.map((color, index) => (
            <motion.div
              key={color}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: 0.5 + index * 0.15,
                duration: 0.5,
                type: 'spring',
                bounce: 0.5,
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: NOTE_COLORS[color],
                boxShadow: `0 0 20px ${NOTE_COLORS[color]}80`,
              }}
            />
          ))}
        </motion.div>

        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          whileHover={{ scale: 1.05, backgroundColor: '#555' }}
          whileTap={{ scale: 0.95 }}
          onClick={resetGame}
          style={{
            padding: '14px 48px',
            fontSize: 16,
            fontWeight: 600,
            backgroundColor: '#333',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 12,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          再来一局
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
