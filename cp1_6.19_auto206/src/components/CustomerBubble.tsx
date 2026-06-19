import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTavernStore } from '../store';

const EXPRESSIONS = [
  { key: 'idle', eyes: '·', mouth: '—', tilt: 0 },
  { key: 'blink', eyes: '−', mouth: '—', tilt: 0 },
  { key: 'happy', eyes: '^', mouth: '▽', tilt: -4 },
  { key: 'sad', eyes: '×', mouth: '︵', tilt: 4 },
  { key: 'nod', eyes: '·', mouth: '—', tilt: -8 },
  { key: 'shake', eyes: '·', mouth: '︵', tilt: 6 },
];

export default function CustomerBubble() {
  const emotion = useTavernStore(s => s.currentEmotion);
  const customerName = useTavernStore(s => s.customerName);
  const colors = useTavernStore(s => s.customerColors);
  const lastMatchScore = useTavernStore(s => s.lastMatchScore);
  const resetCustomer = useTavernStore(s => s.resetCustomer);

  const [expression, setExpression] = useState('idle');
  const [showBubble, setShowBubble] = useState(true);

  useEffect(() => {
    setShowBubble(false);
    const t1 = setTimeout(() => setShowBubble(true), 200);
    return () => clearTimeout(t1);
  }, [emotion.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (lastMatchScore !== null) return;
      const r = Math.random();
      if (r < 0.15) {
        setExpression('blink');
        setTimeout(() => setExpression('idle'), 150);
      } else if (r < 0.25) {
        setExpression('happy');
        setTimeout(() => setExpression('idle'), 500);
      }
    }, 1800);
    return () => clearInterval(interval);
  }, [lastMatchScore]);

  useEffect(() => {
    if (lastMatchScore === null) {
      setExpression('idle');
      return;
    }
    if (lastMatchScore >= 0.7) {
      setExpression('nod');
      setTimeout(() => setExpression('happy'), 600);
    } else {
      setExpression('shake');
      setTimeout(() => setExpression('sad'), 600);
    }
  }, [lastMatchScore]);

  const exp = EXPRESSIONS.find(e => e.key === expression) ?? EXPRESSIONS[0];
  const isMatch = lastMatchScore !== null ? lastMatchScore >= 0.7 : null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 24,
        left: 28,
        zIndex: 15,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16,
      }}
    >
      <motion.div
        animate={{ rotate: exp.tilt }}
        transition={{ type: 'spring', stiffness: 200, damping: 12 }}
        style={{
          width: 84,
          height: 84,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
          boxShadow: `0 0 30px ${colors[0]}66, 0 0 60px ${colors[1]}33`,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 3,
            borderRadius: '50%',
            background: `linear-gradient(180deg, rgba(255,255,255,0.15), rgba(0,0,0,0.2))`,
          }}
        />
        <div
          style={{
            position: 'relative',
            width: 56,
            height: 46,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 0',
          }}
        >
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ color: '#fff', fontSize: 18, fontWeight: 900, textShadow: '0 0 6px rgba(0,0,0,0.5)', lineHeight: 1 }}>
              {exp.eyes}
            </span>
            <span style={{ color: '#fff', fontSize: 18, fontWeight: 900, textShadow: '0 0 6px rgba(0,0,0,0.5)', lineHeight: 1 }}>
              {exp.eyes}
            </span>
          </div>
          <span style={{ color: '#fff', fontSize: 16, fontWeight: 900, textShadow: '0 0 6px rgba(0,0,0,0.5)', lineHeight: 1 }}>
            {exp.mouth}
          </span>
        </div>
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 14,
            width: 20,
            height: 12,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.25)',
            filter: 'blur(2px)',
          }}
        />
      </motion.div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div
          style={{
            fontSize: 12,
            color: '#B388FF',
            letterSpacing: 1.5,
            paddingLeft: 4,
            fontFamily: "'ZCOOL KuaiLe', sans-serif",
          }}
        >
          ◆ {customerName}
        </div>

        <AnimatePresence mode="wait">
          {showBubble && (
            <motion.div
              key={emotion.id}
              initial={{ opacity: 0, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{
                padding: '14px 18px',
                background: '#2A1A4ACC',
                borderRadius: 12,
                border: '1px solid rgba(179,136,255,0.35)',
                boxShadow: `
                  0 0 24px rgba(179,136,255,0.2),
                  inset 0 1px 0 rgba(179,136,255,0.15)
                `,
                backdropFilter: 'blur(6px)',
                minWidth: 200,
                maxWidth: 280,
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: -8,
                  top: 22,
                  width: 0,
                  height: 0,
                  borderTop: '8px solid transparent',
                  borderBottom: '8px solid transparent',
                  borderRight: '10px solid #2A1A4ACC',
                }}
              />
              <div
                style={{
                  fontSize: 10,
                  color: '#6B4F9E',
                  letterSpacing: 2,
                  marginBottom: 6,
                }}
              >
                EMOTION REQUEST
              </div>
              <div
                style={{
                  fontSize: 17,
                  color: '#B388FF',
                  letterSpacing: 1,
                  textShadow: '0 0 12px rgba(179,136,255,0.5)',
                  fontFamily: "'ZCOOL KuaiLe', sans-serif",
                }}
              >
                「{emotion.label}」
              </div>

              {lastMatchScore !== null && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ delay: 0.3 }}
                  style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(179,136,255,0.15)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#6B4F9E' }}>匹配度</span>
                    <span
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: isMatch ? '#00E5FF' : '#FF5252',
                        textShadow: isMatch ? '0 0 12px rgba(0,229,255,0.6)' : '0 0 12px rgba(255,82,82,0.6)',
                        fontFamily: "'Orbitron', sans-serif",
                      }}
                    >
                      {Math.round(lastMatchScore * 100)}%
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      marginTop: 4,
                      color: isMatch ? '#69F0AE' : '#FF80AB',
                      fontFamily: "'ZCOOL KuaiLe', sans-serif",
                    }}
                  >
                    {isMatch
                      ? '✨ 完美契合灵魂！'
                      : lastMatchScore >= 0.5
                        ? '嗯……还差一点感觉'
                        : '……这完全不是我想要的'}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {lastMatchScore !== null && (
          <motion.button
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetCustomer}
            style={{
              alignSelf: 'flex-start',
              padding: '6px 14px',
              background: 'rgba(0,229,255,0.12)',
              border: '1px solid rgba(0,229,255,0.4)',
              borderRadius: 6,
              color: '#00E5FF',
              cursor: 'pointer',
              fontSize: 12,
              letterSpacing: 1,
              fontFamily: "'Orbitron', sans-serif",
            }}
          >
            → 下一位顾客
          </motion.button>
        )}
      </div>
    </div>
  );
}
