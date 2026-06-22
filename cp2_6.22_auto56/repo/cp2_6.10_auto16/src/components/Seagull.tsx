import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface SeagullProps {
  count?: number;
  enabled?: boolean;
}

export function Seagull({ count = 3, enabled = false }: SeagullProps) {
  const seagulls = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      delay: i * 2,
      duration: 15 + Math.random() * 10,
      top: 10 + Math.random() * 30,
      size: 20 + Math.random() * 15
    }));
  }, [count]);

  if (!enabled) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 10
      }}
    >
      {seagulls.map((seagull) => (
        <motion.div
          key={seagull.id}
          initial={{ x: -100, y: seagull.top + '%' }}
          animate={{ x: 'calc(100vw + 100px)' }}
          transition={{
            duration: seagull.duration,
            delay: seagull.delay,
            repeat: Infinity,
            ease: 'linear'
          }}
          style={{
            position: 'absolute',
            top: seagull.top + '%',
            width: seagull.size,
            height: seagull.size,
            zIndex: 10
          }}
        >
          <svg
            viewBox="0 0 50 30"
            width={seagull.size}
            height={seagull.size}
            style={{
              filter: 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.3))'
            }}
          >
            <g style={{ transformOrigin: '25px 15px' }}>
              <motion.path
                d="M 5 15 Q 15 5 25 15 Q 35 5 45 15"
                fill="none"
                stroke="#2a1a0a"
                strokeWidth="3"
                strokeLinecap="round"
                animate={{
                  d: [
                    "M 5 15 Q 15 5 25 15 Q 35 5 45 15",
                    "M 5 15 Q 15 12 25 15 Q 35 12 45 15",
                    "M 5 15 Q 15 5 25 15 Q 35 5 45 15"
                  ]
                }}
                transition={{
                  duration: 0.4,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
              <circle cx="25" cy="13" r="3" fill="#2a1a0a" />
              <circle cx="26" cy="12" r="1" fill="#ffffff" />
            </g>
          </svg>
        </motion.div>
      ))}
    </div>
  );
}
