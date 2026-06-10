import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { COLORS, ZHU_COUNT } from '../utils/constants';

export const DiceCast = () => {
  const { zhus, castZhus, hasCasted, phase, currentPlayer, isAIThinking } = useGameStore();

  const canCast = phase === 'playing' && !hasCasted && !isAIThinking && currentPlayer === 'tiger';

  const zhuWidth = 8;
  const zhuHeight = 60;

  const handleCast = () => {
    if (canCast) {
      castZhus();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        backgroundColor: COLORS.inkBlack,
        padding: '20px',
        borderRadius: '8px',
        minWidth: '160px',
        border: `4px solid ${COLORS.darkGold}`,
        boxShadow: `0 0 20px rgba(184, 134, 11, 0.3), inset 0 0 30px rgba(0,0,0,0.5)`,
        fontFamily: '"SimSun", "STSong", serif',
      }}
    >
      <h3
        style={{
          color: COLORS.darkGold,
          fontSize: '18px',
          margin: '0 0 20px 0',
          textAlign: 'center',
          letterSpacing: '3px',
        }}
      >
        投箸区
      </h3>

      <div
        style={{
          position: 'relative',
          height: '200px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          marginBottom: '20px',
        }}
      >
        <AnimatePresence>
          {zhus.map((zhu, index) => {
            const isCasting = zhu.animateState === 'casting';
            const isLanded = zhu.animateState === 'landed';
            const baseX = (index - (ZHU_COUNT - 1) / 2) * (zhuWidth + 6);

            return (
              <motion.div
                key={zhu.id}
                initial={false}
                animate={
                  isCasting
                    ? {
                        x: zhu.flyX,
                        y: zhu.flyY,
                        rotate: zhu.rotation,
                        opacity: [1, 0.8, 1],
                      }
                    : isLanded
                    ? {
                        x: baseX + (Math.random() - 0.5) * 30,
                        y: -20 + (Math.random() - 0.5) * 40,
                        rotate: zhu.isUp ? 0 : 180,
                      }
                    : {
                        x: baseX,
                        y: 0,
                        rotate: 0,
                      }
                }
                transition={{
                  x: { duration: isCasting ? 0.8 : 0.3, ease: 'easeOut' },
                  y: {
                    duration: isCasting ? 0.8 : 0.3,
                    ease: isCasting ? [0.25, 0.46, 0.45, 0.94] : 'easeOut',
                  },
                  rotate: { duration: isCasting ? 0.8 : 0.3, ease: 'easeOut' },
                }}
                style={{
                  position: 'absolute',
                  bottom: '0px',
                  width: zhuWidth,
                  height: zhuHeight,
                  borderRadius: '3px',
                  cursor: canCast ? 'pointer' : 'default',
                  transformStyle: 'preserve-3d',
                  transformOrigin: 'center bottom',
                }}
                onClick={handleCast}
              >
                <div
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backgroundColor: zhu.isUp ? COLORS.tigerRed : '#8B7355',
                    borderRadius: '3px',
                    backfaceVisibility: 'hidden',
                    boxShadow: 'inset 0 0 5px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: 'rotateY(0deg)',
                  }}
                >
                  {zhu.isUp && (
                    <span
                      style={{
                        color: '#FFD700',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        writingMode: 'vertical-rl',
                        textOrientation: 'upright',
                      }}
                    >
                      刻
                    </span>
                  )}
                </div>
                <div
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#8B7355',
                    borderRadius: '3px',
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    boxShadow: 'inset 0 0 5px rgba(0,0,0,0.3)',
                  }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <motion.button
        whileHover={canCast ? { scale: 1.05, backgroundColor: COLORS.bronzeYellow } : {}}
        whileTap={canCast ? { scale: 0.95 } : {}}
        onClick={handleCast}
        disabled={!canCast}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: canCast ? COLORS.bronzeGreen : '#444',
          color: 'white',
          border: `2px solid ${COLORS.darkGold}`,
          borderRadius: '4px',
          fontSize: '16px',
          cursor: canCast ? 'pointer' : 'not-allowed',
          fontFamily: '"SimSun", "STSong", serif',
          letterSpacing: '4px',
          boxShadow: canCast ? `0 0 10px rgba(74, 124, 89, 0.5)` : 'none',
          transition: 'all 0.3s ease',
        }}
      >
        {hasCasted ? '等待移动' : '投箸'}
      </motion.button>

      {isAIThinking && currentPlayer === 'leopard' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            marginTop: '15px',
            textAlign: 'center',
            color: COLORS.leopardBlue,
            fontSize: '14px',
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{
              display: 'inline-block',
              marginRight: '8px',
            }}
          >
            🎲
          </motion.div>
          AI思考中...
        </motion.div>
      )}
    </motion.div>
  );
};
