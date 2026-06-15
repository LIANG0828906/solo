import { motion, AnimatePresence } from 'framer-motion';

interface TokenBadgeProps {
  count: number;
  isNew?: boolean;
}

export function TokenBadge({ count, isNew = false }: TokenBadgeProps) {
  const tokens = Array.from({ length: count }, (_, i) => i);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      style={{
        padding: '16px',
        backgroundColor: 'var(--color-canvas)',
        border: '3px solid var(--color-copper-gold)',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
      }}
    >
      <div
        style={{
          textAlign: 'center',
          fontSize: '16px',
          fontWeight: 'bold',
          color: 'var(--color-deep-wood)',
          marginBottom: '12px',
          fontFamily: 'serif'
        }}
      >
        太平航海令牌
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        <AnimatePresence>
          {tokens.length === 0 ? (
            <div
              style={{
                fontSize: '12px',
                color: 'var(--color-deep-wood)',
                opacity: 0.6,
                fontStyle: 'italic'
              }}
            >
              保持航向稳定60秒即可获得
            </div>
          ) : (
            tokens.map((index) => (
              <motion.div
                key={index}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                  delay: index * 0.1
                }}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 30% 30%, #e8c89a, #cd7f32 40%, #8b4513 100%)',
                  border: '2px solid #b8860b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, transparent 50%, rgba(0, 0, 0, 0.2) 100%)',
                    pointerEvents: 'none'
                  }}
                />
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#8b0000',
                    fontFamily: 'serif',
                    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
                    zIndex: 1
                  }}
                >
                  太平
                </span>
              </motion.div>
            ))
          )}
        </AnimatePresence>

        {isNew && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
              repeat: Infinity,
              repeatType: 'reverse',
              duration: 0.5
            }}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              padding: '4px 8px',
              backgroundColor: 'var(--color-gold)',
              color: 'var(--color-deep-wood)',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: 'bold',
              boxShadow: '0 2px 8px rgba(255, 215, 0, 0.6)'
            }}
          >
            新获得！
          </motion.div>
        )}
      </div>

      {count >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            marginTop: '12px',
            padding: '8px',
            backgroundColor: 'rgba(139, 0, 0, 0.1)',
            borderRadius: '4px',
            textAlign: 'center',
            border: '1px solid var(--color-warning-red)'
          }}
        >
          <span
            style={{
              fontSize: '12px',
              color: 'var(--color-warning-red)',
              fontWeight: 'bold'
            }}
          >
            🏆 已解锁风暴海模式！
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
