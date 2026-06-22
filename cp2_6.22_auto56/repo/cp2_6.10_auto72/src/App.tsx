import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import LockRing from './components/LockRing';
import FeedbackPanel from './components/FeedbackPanel';
import StoneDoor from './components/StoneDoor';
import ResetButton from './components/ResetButton';
import { useGameStore } from './store/useGameStore';

const App: React.FC = () => {
  const initializeGame = useGameStore((state) => state.initializeGame);
  const isLocked = useGameStore((state) => state.isLocked);
  const lockTimer = useGameStore((state) => state.lockTimer);
  const unlockRings = useGameStore((state) => state.unlockRings);
  const setLockTimer = useGameStore((state) => state.setLockTimer);
  const rings = useGameStore((state) => state.rings);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  useEffect(() => {
    if (isLocked && lockTimer > 0) {
      const timer = setInterval(() => {
        setLockTimer(lockTimer - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (isLocked && lockTimer === 0) {
      unlockRings();
    }
  }, [isLocked, lockTimer, unlockRings, setLockTimer]);

  const ringSizes = [
    { outer: 360, inner: 320 },
    { outer: 280, inner: 240 },
    { outer: 200, inner: 160 },
  ];

  return (
    <div
      className="app-container"
      style={{
        minHeight: '100vh',
        minWidth: '100vw',
        background: `
          radial-gradient(ellipse at center, rgba(44, 62, 80, 0.8) 0%, #1a1a2e 50%, #0a0a14 100%),
          repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(0, 0, 0, 0.1) 10px,
            rgba(0, 0, 0, 0.1) 20px
          )
        `,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        className="wall-texture"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(139, 111, 71, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(139, 111, 71, 0.05) 0%, transparent 50%)
          `,
          pointerEvents: 'none',
        }}
      />

      <motion.div
        className="title"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        style={{
          fontFamily: "'ZCOOL XiaoWei', 'Noto Serif SC', serif",
          fontSize: '42px',
          color: '#d4a76a',
          letterSpacing: '12px',
          marginBottom: '10px',
          textShadow: `
            0 0 20px rgba(212, 167, 106, 0.5),
            0 4px 8px rgba(0, 0, 0, 0.5)
          `,
        }}
      >
        连 环 锁 开 解
      </motion.div>

      <motion.div
        className="subtitle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        style={{
          fontFamily: "'Noto Serif SC', serif",
          fontSize: '14px',
          color: 'rgba(212, 167, 106, 0.6)',
          letterSpacing: '4px',
          marginBottom: '40px',
        }}
      >
        ━━━ 明代机关秘术 ━━━
      </motion.div>

      <div
        className="lock-container"
        style={{
          position: 'relative',
          width: '400px',
          height: '400px',
          minWidth: '400px',
          minHeight: '400px',
        }}
      >
        <StoneDoor />

        {rings.length > 0 &&
          ringSizes.map((size, index) => (
            <LockRing
              key={index}
              ringId={index}
              size={size.outer}
              innerSize={size.inner}
            />
          ))}

        <div
          className="center-pillar"
          style={{
            position: 'absolute',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #8b6f47 0%, #5c4033 100%)',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            boxShadow: `
              inset 0 2px 4px rgba(255, 255, 255, 0.2),
              inset 0 -2px 4px rgba(0, 0, 0, 0.5),
              0 4px 8px rgba(0, 0, 0, 0.5)
            `,
            border: '2px solid #d4a76a',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #d4a76a 0%, #8b6f47 100%)',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.3)',
            }}
          />
        </div>
      </div>

      <FeedbackPanel />

      <ResetButton />

      <motion.div
        className="footer-hint"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        style={{
          position: 'absolute',
          bottom: '20px',
          fontFamily: "'Noto Serif SC', serif",
          fontSize: '12px',
          color: 'rgba(212, 167, 106, 0.4)',
          letterSpacing: '2px',
        }}
      >
        拖拽青铜锁环旋转，对齐正确符号组合以开启机关
      </motion.div>
    </div>
  );
};

export default App;
