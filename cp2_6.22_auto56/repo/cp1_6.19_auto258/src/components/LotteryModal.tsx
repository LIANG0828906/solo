import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AVATAR_COLORS } from '@/types';
import useAppStore from '@/store';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

function generateRandomCode(): string {
  const n = Math.floor(Math.random() * 10000);
  const digits = String(n).padStart(4, '0');
  const check = digits.split('').reduce((s, d) => s + parseInt(d, 10), 0) % 10;
  return digits + String(check);
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default function LotteryModal() {
  const lotteryState = useAppStore((s) => s.lotteryState);
  const guests = useAppStore((s) => s.guests);
  const endLottery = useAppStore((s) => s.endLottery);
  const resetLottery = useAppStore((s) => s.resetLottery);

  const [displayCode, setDisplayCode] = useState('-----');
  const [showWinner, setShowWinner] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const animRef = useRef<number>(0);
  const particleAnimRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const hasStarted = useRef(false);

  const winner = guests.find((g) => g.id === lotteryState.winnerId);
  const winnerCode = winner?.code ?? '';

  const triggerParticles = useCallback(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 180;
      newParticles.push({
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 4 + Math.random() * 2,
        alpha: 1,
      });
    }
    setParticles(newParticles);

    const particleStart = performance.now();
    const duration = 800;

    const animateParticles = (now: number) => {
      const elapsed = now - particleStart;
      const progress = Math.min(elapsed / duration, 1);
      const alpha = 1 - progress;

      setParticles((prev) =>
        prev.map((p) => ({
          ...p,
          x: p.x + p.vx * (16 / 1000),
          y: p.y + p.vy * (16 / 1000),
          alpha,
        }))
      );

      if (progress < 1) {
        particleAnimRef.current = requestAnimationFrame(animateParticles);
      } else {
        setParticles([]);
      }
    };

    particleAnimRef.current = requestAnimationFrame(animateParticles);
  }, []);

  useEffect(() => {
    if (!lotteryState.isActive || lotteryState.isComplete || !winnerCode) {
      return;
    }

    if (hasStarted.current) return;
    hasStarted.current = true;

    const sequence: string[] = [];
    for (let i = 0; i < 30; i++) {
      sequence.push(generateRandomCode());
    }
    sequence.push(winnerCode);

    startTimeRef.current = 0;
    const totalDuration = 1500;
    let lastSeqIndex = -1;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === 0) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / totalDuration, 1);
      const eased = easeOutCubic(progress);
      const index = Math.min(Math.floor(eased * (sequence.length - 1)), sequence.length - 1);

      if (index !== lastSeqIndex) {
        lastSeqIndex = index;
        setDisplayCode(sequence[index]);
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayCode(winnerCode);
        endLottery(lotteryState.winnerId!);
        setTimeout(() => {
          setShowWinner(true);
          triggerParticles();
        }, 300);
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (particleAnimRef.current) cancelAnimationFrame(particleAnimRef.current);
    };
  }, [lotteryState.isActive, lotteryState.isComplete, winnerCode, endLottery, lotteryState.winnerId, triggerParticles]);

  useEffect(() => {
    if (!lotteryState.isActive) {
      hasStarted.current = false;
      setShowWinner(false);
      setDisplayCode('-----');
      setParticles([]);
    }
  }, [lotteryState.isActive]);

  const avatarColor =
    winner && AVATAR_COLORS
      ? AVATAR_COLORS[winner.name.charCodeAt(0) % AVATAR_COLORS.length]
      : '#F1C40F';

  return (
    <AnimatePresence>
      {lotteryState.isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.85)',
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{
              position: 'relative',
              background: 'linear-gradient(135deg, #0F171E, #1A252F)',
              borderRadius: 24,
              padding: '60px 80px',
              minWidth: 480,
              textAlign: 'center',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                fontSize: 56,
                fontFamily: 'monospace',
                letterSpacing: 12,
                color: '#fff',
                textShadow: showWinner
                  ? '0 0 20px #F1C40F, 0 0 40px #F1C40F'
                  : '0 0 10px rgba(255,255,255,0.3)',
                transition: 'text-shadow 0.3s',
              }}
            >
              {displayCode}
            </div>

            {showWinner && winner && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                style={{ marginTop: 32 }}
              >
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 'bold',
                    color: '#F1C40F',
                    textShadow: '0 0 20px rgba(241,196,15,0.5)',
                  }}
                >
                  {winner.name}
                </div>
                <div
                  style={{
                    fontSize: 20,
                    color: 'rgba(241,196,15,0.7)',
                    marginTop: 8,
                  }}
                >
                  {winner.company}
                </div>
              </motion.div>
            )}

            {particles.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  pointerEvents: 'none',
                }}
              >
                {particles.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: p.x,
                      top: p.y,
                      width: p.radius * 2,
                      height: p.radius * 2,
                      borderRadius: '50%',
                      background: '#F1C40F',
                      opacity: p.alpha,
                      boxShadow: `0 0 ${p.radius * 2}px #F1C40F`,
                    }}
                  />
                ))}
              </div>
            )}

            <button
              onClick={resetLottery}
              style={{
                marginTop: 40,
                padding: '12px 40px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                fontSize: 16,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  'rgba(255,255,255,0.15)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  'rgba(255,255,255,0.08)';
              }}
            >
              关闭
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
