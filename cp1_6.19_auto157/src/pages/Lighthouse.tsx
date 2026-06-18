import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGlobalState, Bottle } from '@/context/GlobalState';
import { getArchivedBottles, filterByEmotion } from '@/archive';
import { EMOTION_LABELS, EMOTION_COLORS, EMOTIONS } from '@/bottle';
import { Emotion } from '@/eventBus';
import WaveAnimation from '@/components/WaveAnimation';

const EMOTION_FILTER_ALL = 'all' as const;
type EmotionFilter = Emotion | typeof EMOTION_FILTER_ALL;

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  paddingBottom: '40px',
};

const lighthouseBodyStyle: React.CSSProperties = {
  width: '200px',
  height: '400px',
  background: 'linear-gradient(180deg, #D3D3D3, #A9A9A9)',
  borderRadius: '100px 100px 8px 8px',
  position: 'relative',
  boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
};

const SmallBottleSVG = ({ emotion, x, y, angle }: { emotion: Emotion; x: number; y: number; angle: number }) => (
  <div
    style={{
      position: 'absolute',
      left: `${x}px`,
      top: `${y}px`,
      transform: `rotate(${angle}deg)`,
      cursor: 'pointer',
    }}
  >
    <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
      <rect x="4" y="0" width="4" height="3" rx="1" fill="#8B6914" />
      <path d="M3 3 C3 3, 1 6, 1 9 L1 16 C1 18, 3 20, 6 20 C9 20, 11 18, 11 16 L11 9 C11 6, 9 3, 9 3 Z" fill={EMOTION_COLORS[emotion]} />
    </svg>
  </div>
);

export default function Lighthouse() {
  const { state } = useGlobalState();
  const navigate = useNavigate();
  const [selectedBottle, setSelectedBottle] = useState<Bottle | null>(null);
  const [filter, setFilter] = useState<EmotionFilter>(EMOTION_FILTER_ALL);
  const [resonance, setResonance] = useState(false);

  const archived = useMemo(() => {
    const all = getArchivedBottles(state.bottles);
    return filterByEmotion(all, filter);
  }, [state.bottles, filter]);

  const orbitBottles = useMemo(() => {
    return state.bottles
      .filter(b => b.isArchived)
      .slice(0, 20)
      .map((b, i) => {
        const angle = (i / 20) * 360;
        const radius = 160 + Math.random() * 80;
        const rad = (angle * Math.PI) / 180;
        return {
          bottle: b,
          x: Math.cos(rad) * radius,
          y: Math.sin(rad) * radius * 0.6,
          angle: Math.random() * 30 - 15,
        };
      });
  }, [state.bottles]);

  const handleBottleClick = useCallback((bottle: Bottle) => {
    setSelectedBottle(bottle);
    setResonance(true);
    setTimeout(() => setResonance(false), 800);
  }, []);

  const lines = selectedBottle ? selectedBottle.text.split('\n') : [];

  return (
    <motion.div
      style={pageStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
    >
      <WaveAnimation />

      <motion.button
        onClick={() => navigate('/')}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          backgroundColor: 'rgba(26,43,76,0.7)',
          border: '1px solid #D4AF37',
          borderRadius: '8px',
          padding: '8px 16px',
          color: '#D4AF37',
          cursor: 'pointer',
          fontSize: '13px',
          fontFamily: "'Noto Serif SC', serif",
          zIndex: 10,
        }}
        whileHover={{ scale: 1.05 }}
      >
        ← 返回码头
      </motion.button>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', zIndex: 2 }}>
        <button
          onClick={() => setFilter(EMOTION_FILTER_ALL)}
          style={{
            padding: '4px 12px',
            backgroundColor: filter === EMOTION_FILTER_ALL ? 'rgba(212,175,55,0.3)' : 'transparent',
            border: `1px solid ${filter === EMOTION_FILTER_ALL ? '#D4AF37' : 'rgba(255,255,255,0.2)'}`,
            borderRadius: '12px',
            color: filter === EMOTION_FILTER_ALL ? '#D4AF37' : 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            fontSize: '11px',
            fontFamily: "'Noto Serif SC', serif",
          }}
        >
          全部
        </button>
        {EMOTIONS.map(e => (
          <button
            key={e}
            onClick={() => setFilter(e)}
            style={{
              padding: '4px 12px',
              backgroundColor: filter === e ? `${EMOTION_COLORS[e]}33` : 'transparent',
              border: `1px solid ${filter === e ? EMOTION_COLORS[e] : 'rgba(255,255,255,0.2)'}`,
              borderRadius: '12px',
              color: filter === e ? EMOTION_COLORS[e] : 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: "'Noto Serif SC', serif",
            }}
          >
            {EMOTION_LABELS[e]}
          </button>
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 2 }}>
        <motion.div
          style={lighthouseBodyStyle}
          animate={resonance ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            style={{
              position: 'absolute',
              top: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60px',
              height: '20px',
              borderRadius: '4px',
              background: 'linear-gradient(90deg, #ff4444, #ffffff, #ff4444, #ffffff, #ff4444)',
              backgroundSize: '200% 100%',
            }}
            animate={{
              backgroundPosition: ['0% 0%', '200% 0%'],
              opacity: [1, 0.3, 1],
            }}
            transition={{
              backgroundPosition: { duration: 2, repeat: Infinity, ease: 'linear' },
              opacity: { duration: 2, repeat: Infinity },
            }}
          />

          <motion.div
            style={{
              position: 'absolute',
              top: '0',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              backgroundColor: '#ff4444',
              boxShadow: '0 0 20px 8px rgba(255,68,68,0.6), 0 0 60px 20px rgba(255,68,68,0.2)',
            }}
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
              style={{ position: 'relative', width: '320px', height: '240px', marginLeft: '-160px', marginTop: '-120px' }}
            >
              {orbitBottles.map((item, i) => (
                <motion.div
                  key={item.bottle.id}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    cursor: 'pointer',
                  }}
                  initial={{ x: item.x, y: item.y }}
                  animate={{ x: item.x, y: item.y }}
                  onClick={() => handleBottleClick(item.bottle)}
                  whileHover={{ scale: 2 }}
                >
                  <SmallBottleSVG emotion={item.bottle.emotion} x={0} y={0} angle={item.angle} />
                </motion.div>
              ))}
            </motion.div>
          </div>

          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '12px',
            color: '#0B192C',
            fontFamily: "'ZCOOL QingKe HuangYou', sans-serif",
            whiteSpace: 'nowrap',
            opacity: 0.7,
          }}>
            回声灯塔
          </div>
        </motion.div>

        <div style={{
          marginTop: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          justifyContent: 'center',
          maxWidth: '600px',
        }}>
          {archived.slice(0, 30).map(b => (
            <motion.div
              key={b.id}
              style={{
                padding: '4px 10px',
                backgroundColor: `${EMOTION_COLORS[b.emotion]}22`,
                border: `1px solid ${EMOTION_COLORS[b.emotion]}44`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '11px',
                color: EMOTION_COLORS[b.emotion],
                fontFamily: "'Noto Serif SC', serif",
              }}
              whileHover={{ scale: 1.1, boxShadow: `0 0 8px ${EMOTION_COLORS[b.emotion]}44` }}
              onClick={() => handleBottleClick(b)}
            >
              {b.text.slice(0, 12)}...
            </motion.div>
          ))}
          {archived.length === 0 && (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
              灯塔中暂无归档的漂流瓶...
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedBottle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
            }}
            onClick={() => setSelectedBottle(null)}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '320px',
                minHeight: '200px',
                backgroundColor: '#F5E6D0',
                borderRadius: '4px',
                padding: '24px',
                color: '#0B192C',
                fontSize: '15px',
                lineHeight: '24px',
                fontFamily: "'Noto Serif SC', serif",
                position: 'relative',
                boxShadow: resonance ? `0 0 30px ${EMOTION_COLORS[selectedBottle.emotion]}44` : '0 8px 32px rgba(0,0,0,0.3)',
              }}
            >
              <div style={{ fontSize: '11px', color: EMOTION_COLORS[selectedBottle.emotion], marginBottom: '12px', opacity: 0.7 }}>
                {EMOTION_LABELS[selectedBottle.emotion]} · {new Date(selectedBottle.createdAt).toLocaleDateString('zh-CN')}
              </div>
              {lines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15, duration: 0.3 }}
                  style={{ minHeight: line ? 'auto' : '12px' }}
                >
                  {line || '\u00A0'}
                </motion.div>
              ))}
              {selectedBottle.echoes.length > 0 && (
                <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid rgba(11,25,44,0.1)' }}>
                  {selectedBottle.echoes.map(echo => (
                    <div key={echo.id} style={{ fontSize: '12px', color: '#4A90D9', fontStyle: 'italic', marginBottom: '4px' }}>
                      ♪ {echo.text}
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setSelectedBottle(null)}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#0B192C',
                  opacity: 0.4,
                }}
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
