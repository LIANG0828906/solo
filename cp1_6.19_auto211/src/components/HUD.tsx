import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { NOTE_COLORS, CORRECT_ORDER } from '@/constants';

export default function HUD() {
  const collectedNotes = useGameStore((state) => state.collectedNotes);
  const isComplete = useGameStore((state) => state.isComplete);
  const isPlaying = useGameStore((state) => state.isPlaying);
  const resetGame = useGameStore((state) => state.resetGame);

  const progress = (collectedNotes.length / CORRECT_ORDER.length) * 100;

  return (
    <div
      className="hud-container"
      style={{
        width: 240,
        backgroundColor: 'rgba(26, 26, 26, 0.8)',
        borderRadius: 12,
        padding: 16,
        color: '#FFFFFF',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, marginBottom: 8, opacity: 0.8 }}>
          已收集音符
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CORRECT_ORDER.map((color, index) => {
            const isCollected = collectedNotes.some((n) => n.color === color);
            return (
              <motion.div
                key={color}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: isCollected ? NOTE_COLORS[color] : '#555',
                  boxShadow: isCollected
                    ? `0 0 8px 2px ${NOTE_COLORS[color]}80`
                    : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                }}
                animate={{
                  scale: isCollected ? 1 : 0.8,
                  opacity: isCollected ? 1 : 0.5,
                }}
                transition={{ duration: 0.3 }}
              >
                {index + 1}
              </motion.div>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, marginBottom: 8, opacity: 0.8 }}>
          收集进度
        </div>
        <div
          style={{
            width: '100%',
            height: 8,
            backgroundColor: '#555',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <motion.div
            style={{
              height: '100%',
              background:
                'linear-gradient(90deg, #FF4136 0%, #FF851B 25%, #FFDC00 50%, #2ECC40 75%, #0074D9 100%)',
              borderRadius: 4,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      <div style={{ marginBottom: 16, minHeight: 24 }}>
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ color: '#FFDC00', fontSize: 14, fontWeight: 600 }}
          >
            🎵 旋律收集完成！播放中...
          </motion.div>
        )}
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ color: '#2ECC40', fontSize: 14, fontWeight: 600 }}
          >
            🎉 恭喜通关！旋律演奏完成！
          </motion.div>
        )}
        {!isPlaying && !isComplete && collectedNotes.length > 0 && (
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            提示：按红→橙→黄→绿→蓝顺序收集
          </div>
        )}
        {!isPlaying && !isComplete && collectedNotes.length === 0 && (
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            使用 WASD 或方向键移动
          </div>
        )}
      </div>

      <motion.button
        onClick={resetGame}
        whileHover={{ backgroundColor: '#555', scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
        style={{
          width: '100%',
          padding: '10px 16px',
          backgroundColor: '#333',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        重新开始
      </motion.button>
    </div>
  );
}
