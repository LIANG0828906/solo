import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalState } from '@/context/GlobalState';
import { Bottle } from '@/context/GlobalState';
import { EMOTION_LABELS, EMOTION_COLORS } from '@/bottle';
import { selectRandomBottle } from '@/receive';

const receiverStyle: React.CSSProperties = {
  width: '400px',
  height: '320px',
  backgroundColor: 'rgba(26, 43, 76, 0.85)',
  borderRadius: '16px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
};

const BottleBodySVG = ({ hovering }: { hovering: boolean }) => (
  <svg width="100" height="200" viewBox="0 0 80 160" fill="none" style={{ filter: hovering ? 'drop-shadow(0 0 8px rgba(74,144,217,0.5))' : 'none' }}>
    <defs>
      <linearGradient id="recvBottleGrad" x1="20" y1="0" x2="60" y2="160">
        <stop offset="0%" stopColor="#4A90D9" />
        <stop offset="100%" stopColor="#8A5C00" />
      </linearGradient>
      <linearGradient id="corkGrad" x1="30" y1="0" x2="50" y2="20">
        <stop offset="0%" stopColor="#DEB887" />
        <stop offset="100%" stopColor="#8B6914" />
      </linearGradient>
    </defs>
    <rect x="32" y="4" width="16" height="14" rx="3" fill="url(#corkGrad)" />
    <path d="M28 18 C28 18, 18 35, 18 55 L18 120 C18 140, 28 155, 40 155 C52 155, 62 140, 62 120 L62 55 C62 35, 52 18, 52 18 Z" fill="url(#recvBottleGrad)" />
    <path d="M28 18 C28 18, 22 35, 22 50 L22 115 C22 135, 32 150, 40 150 C40 150, 28 145, 28 130 L28 50 C28 35, 28 18, 28 18 Z" fill="rgba(255,255,255,0.12)" />
    {hovering && (
      <>
        <line x1="30" y1="60" x2="38" y2="75" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        <line x1="50" y1="80" x2="55" y2="95" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        <line x1="35" y1="100" x2="42" y2="115" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      </>
    )}
  </svg>
);

const letterStyle: React.CSSProperties = {
  width: '300px',
  minHeight: '200px',
  backgroundColor: '#F5E6D0',
  borderRadius: '4px',
  padding: '20px',
  color: '#0B192C',
  fontSize: '15px',
  lineHeight: '24px',
  fontFamily: "'Noto Serif SC', serif",
  position: 'relative',
  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
};

export default function BottleReceiver() {
  const { state, receiveBottle, openBottle, sendEcho } = useGlobalState();
  const { currentBottle, bottles } = state;
  const [hovering, setHovering] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [corkFlying, setCorkFlying] = useState(false);
  const [echoText, setEchoText] = useState('');
  const [showEcho, setShowEcho] = useState(false);

  useEffect(() => {
    if (!currentBottle && bottles.filter(b => !b.isArchived).length > 0) {
      receiveBottle();
    }
  }, []);

  const handleBottleClick = useCallback(() => {
    if (!currentBottle || isOpen) return;
    setCorkFlying(true);
    setTimeout(() => {
      setCorkFlying(false);
      setIsOpen(true);
      openBottle(currentBottle.id);
    }, 400);
  }, [currentBottle, isOpen, openBottle]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setShowEcho(false);
    setEchoText('');
    const next = selectRandomBottle(bottles);
    if (next) {
      setTimeout(() => receiveBottle(), 300);
    }
  }, [bottles, receiveBottle]);

  const handleSendEcho = useCallback(() => {
    if (!echoText.trim() || !currentBottle) return;
    sendEcho(currentBottle.id, echoText.trim());
    setEchoText('');
    setShowEcho(false);
  }, [echoText, currentBottle, sendEcho]);

  const lines = currentBottle ? currentBottle.text.split('\n') : [];

  return (
    <div style={receiverStyle}>
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.div
            key="bottle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, -2, 0] }}
            transition={{ y: { repeat: Infinity, duration: 2, ease: 'easeInOut' }, opacity: { duration: 0.3 } }}
            style={{ cursor: 'pointer', position: 'relative' }}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            onClick={handleBottleClick}
          >
            <motion.div
              animate={hovering ? { scale: 1.1 } : { scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <BottleBodySVG hovering={hovering} />
            </motion.div>

            <AnimatePresence>
              {corkFlying && (
                <motion.div
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 0, y: -60, rotate: 30 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  style={{ position: 'absolute', top: '4px', left: '50%', transform: 'translateX(-50%)' }}
                >
                  <div style={{ width: '16px', height: '14px', backgroundColor: '#DEB887', borderRadius: '3px' }} />
                </motion.div>
              )}
            </AnimatePresence>

            {currentBottle && (
              <div style={{
                position: 'absolute',
                bottom: '-8px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '10px',
                color: EMOTION_COLORS[currentBottle.emotion],
                whiteSpace: 'nowrap',
              }}>
                {EMOTION_LABELS[currentBottle.emotion]}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="letter"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4 }}
          >
            <div style={letterStyle}>
              <div style={{ marginBottom: '12px', fontSize: '11px', color: EMOTION_COLORS[currentBottle?.emotion || 'happy'], opacity: 0.7 }}>
                {currentBottle && EMOTION_LABELS[currentBottle.emotion]}
              </div>
              {lines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.2, duration: 0.3 }}
                  style={{ minHeight: line ? 'auto' : '12px' }}
                >
                  {line || '\u00A0'}
                </motion.div>
              ))}

              {currentBottle && currentBottle.echoes.length > 0 && (
                <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid rgba(11,25,44,0.1)' }}>
                  {currentBottle.echoes.map(echo => (
                    <div key={echo.id} style={{ fontSize: '12px', color: '#4A90D9', fontStyle: 'italic', marginBottom: '4px' }}>
                      ♪ {echo.text}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                {!showEcho ? (
                  <>
                    <button
                      onClick={() => setShowEcho(true)}
                      style={{
                        padding: '6px 14px',
                        backgroundColor: '#4A90D9',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontFamily: "'Noto Serif SC', serif",
                      }}
                    >
                      留下回响
                    </button>
                    <button
                      onClick={handleClose}
                      style={{
                        padding: '6px 14px',
                        backgroundColor: 'transparent',
                        color: '#0B192C',
                        border: '1px solid rgba(11,25,44,0.2)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontFamily: "'Noto Serif SC', serif",
                      }}
                    >
                      放回大海
                    </button>
                  </>
                ) : (
                  <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                    <input
                      value={echoText}
                      onChange={e => setEchoText(e.target.value)}
                      placeholder="你的回响..."
                      maxLength={200}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        border: '1px solid rgba(11,25,44,0.2)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        outline: 'none',
                        fontFamily: "'Noto Serif SC', serif",
                      }}
                      onKeyDown={e => e.key === 'Enter' && handleSendEcho()}
                    />
                    <button
                      onClick={handleSendEcho}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#2ECC71',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      发送
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!currentBottle && !isOpen && (
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
          海面平静，暂无漂流瓶...
        </div>
      )}
    </div>
  );
}
