import { useEffect, useRef } from 'react';
import { useGlobalState } from '@/context/GlobalState';
import { EMOTION_LABELS } from '@/bottle';
import { motion, AnimatePresence } from 'framer-motion';

const containerStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  width: '100%',
  height: '30px',
  backgroundColor: 'rgba(26, 43, 76, 0.85)',
  overflow: 'hidden',
  zIndex: 50,
  display: 'flex',
  alignItems: 'center',
};

const scrollStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '40px',
  whiteSpace: 'nowrap',
  fontSize: '12px',
  color: 'rgba(255, 255, 255, 0.8)',
  animation: 'scrollLeft 30s linear infinite',
};

export default function CurrentIndicator() {
  const { state } = useGlobalState();
  const { currentEvents } = state;
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes scrollLeft {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
    `;
    document.head.appendChild(style);
    styleRef.current = style;
    return () => {
      style.remove();
    };
  }, []);

  const items = currentEvents.map(e => ({
    id: e.id,
    text: `${e.time} · ${EMOTION_LABELS[e.emotion as keyof typeof EMOTION_LABELS] || e.emotion}`,
    isNew: e.isNew,
  }));

  const doubled = [...items, ...items];

  return (
    <div style={containerStyle}>
      <div style={scrollStyle}>
        {doubled.map((item, i) => (
          <AnimatePresence key={`${item.id}-${i}`}>
            <motion.span
              initial={item.isNew && i < items.length ? { opacity: 0, textShadow: '0 0 12px #4A90D9' } : {}}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {item.isNew && i < items.length && (
                <motion.span
                  initial={{ opacity: 1, textShadow: '0 0 8px #4A90D9' }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#4A90D9',
                  }}
                />
              )}
              {item.text}
            </motion.span>
          </AnimatePresence>
        ))}
        {items.length === 0 && (
          <span style={{ opacity: 0.4 }}>洋流平静，暂无漂流瓶动态...</span>
        )}
      </div>
    </div>
  );
}
