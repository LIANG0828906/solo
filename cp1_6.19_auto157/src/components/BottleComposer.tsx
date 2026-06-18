import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalState } from '@/context/GlobalState';
import { EMOTIONS, EMOTION_LABELS, EMOTION_COLORS } from '@/bottle';
import { Emotion } from '@/eventBus';

const composerStyle: React.CSSProperties = {
  width: '400px',
  height: '320px',
  backgroundColor: '#DEB887',
  borderRadius: '16px',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  position: 'relative',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
};

const textAreaStyle: React.CSSProperties = {
  width: '360px',
  height: '180px',
  backgroundColor: '#FEF9E7',
  borderRadius: '8px',
  padding: '12px',
  fontSize: '16px',
  color: '#0B192C',
  border: '2px solid transparent',
  outline: 'none',
  resize: 'none',
  fontFamily: "'Noto Serif SC', serif",
  lineHeight: '1.6',
  transition: 'border-color 0.4s ease',
};

const throwBtnStyle: React.CSSProperties = {
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  backgroundColor: '#E6B800',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(230, 184, 0, 0.4)',
};

const sliderContainerStyle: React.CSSProperties = {
  width: '280px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px',
};

const emotionDotsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  width: '100%',
  padding: '0 4px',
};

const BottleSVG = () => (
  <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
    <rect x="15" y="2" width="10" height="6" rx="2" fill="#C8A200" />
    <rect x="17" y="0" width="6" height="4" rx="1" fill="#8B6914" />
    <path d="M14 8 C14 8, 10 12, 10 18 L10 28 C10 32, 14 36, 20 36 C26 36, 30 32, 30 28 L30 18 C30 12, 26 8, 26 8 Z" fill="url(#bottleGrad)" />
    <path d="M14 8 C14 8, 12 12, 12 16 L12 26 C12 30, 16 34, 20 34 C20 34, 14 32, 14 28 L14 16 C14 12, 14 8, 14 8 Z" fill="rgba(255,255,255,0.15)" />
    <defs>
      <linearGradient id="bottleGrad" x1="10" y1="8" x2="30" y2="36">
        <stop offset="0%" stopColor="#E6C200" />
        <stop offset="100%" stopColor="#8B6914" />
      </linearGradient>
    </defs>
  </svg>
);

export default function BottleComposer() {
  const { throwBottle } = useGlobalState();
  const [text, setText] = useState('');
  const [emotion, setEmotion] = useState<number>(0);
  const [isFocused, setIsFocused] = useState(false);
  const [isThrowing, setIsThrowing] = useState(false);

  const currentEmotion = EMOTIONS[emotion] as Emotion;

  const handleThrow = useCallback(() => {
    if (!text.trim() || isThrowing) return;
    setIsThrowing(true);
    throwBottle(text.trim(), currentEmotion);
    setTimeout(() => {
      setText('');
      setIsThrowing(false);
    }, 600);
  }, [text, currentEmotion, isThrowing, throwBottle]);

  const emotionIdx = Math.round(emotion);

  return (
    <div style={composerStyle}>
      <textarea
        style={{
          ...textAreaStyle,
          borderImage: isFocused
            ? 'linear-gradient(90deg, #FFD700, #FF6F61) 1'
            : 'none',
          border: isFocused ? '2px solid' : '2px solid transparent',
        }}
        value={text}
        onChange={e => setText(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="写下你的心情，装入漂流瓶..."
        maxLength={500}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '12px' }}>
        <AnimatePresence mode="wait">
          {isThrowing ? (
            <motion.div
              key="flying"
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 0.2, opacity: 0, y: -80, x: 200 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeIn' }}
              style={throwBtnStyle}
            >
              <span style={{ fontSize: '18px' }}>🪵</span>
            </motion.div>
          ) : (
            <motion.button
              key="bottle"
              style={throwBtnStyle}
              onClick={handleThrow}
              whileHover={{ rotate: 15, scale: 0.95 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <BottleSVG />
            </motion.button>
          )}
        </AnimatePresence>

        <div style={sliderContainerStyle}>
          <input
            type="range"
            min={0}
            max={3}
            step={1}
            value={emotion}
            onChange={e => setEmotion(Number(e.target.value))}
            style={{
              width: '100%',
              accentColor: EMOTION_COLORS[currentEmotion],
              cursor: 'pointer',
            }}
          />
          <div style={emotionDotsStyle}>
            {EMOTIONS.map((e, i) => (
              <span
                key={e}
                style={{
                  fontSize: '10px',
                  color: i === emotionIdx ? EMOTION_COLORS[e] : 'rgba(11,25,44,0.4)',
                  fontWeight: i === emotionIdx ? 700 : 400,
                  transition: 'all 0.3s ease',
                }}
              >
                {EMOTION_LABELS[e]}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
