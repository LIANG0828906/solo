import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Card } from '../utils/cardData';
import { ELEMENT_COLORS, RARITY_COLORS } from '../utils/cardData';
import { ElementIcon } from './GameCard';
import { useCardStore } from '../store/cardStore';

interface SynthesisAnimationProps {
  leftCard: Card;
  rightCard: Card;
  onComplete: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export function SynthesisAnimation({ leftCard, rightCard, onComplete }: SynthesisAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const progressRef = useRef(0);
  const startTimeRef = useRef(Date.now());

  const leftColor = leftCard.element === 'composite' ? ELEMENT_COLORS.fire : ELEMENT_COLORS[leftCard.element];
  const rightColor = rightCard.element === 'composite' ? ELEMENT_COLORS.water : ELEMENT_COLORS[rightCard.element];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const duration = 1000;
    startTimeRef.current = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      progressRef.current = Math.min(elapsed / duration, 1);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      const leftStartX = 120;
      const rightStartX = canvas.width - 120;
      const startY = centerY;

      const progress = progressRef.current;
      const eased = 1 - Math.pow(1 - progress, 3);

      const leftX = leftStartX + (centerX - leftStartX) * eased;
      const rightX = rightStartX + (centerX - rightStartX) * eased;
      const yOffset = Math.sin(progress * Math.PI * 4) * 20 * progress;

      const scale = 1 - progress * 0.3;
      const rotation = progress * Math.PI * 4;

      ctx.save();
      ctx.translate(leftX, startY + yOffset);
      ctx.rotate(rotation);
      ctx.scale(scale, scale);
      ctx.fillStyle = leftColor;
      ctx.globalAlpha = 0.9;
      ctx.fillRect(-40, -55, 80, 110);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-40, -55, 80, 110);
      ctx.globalAlpha = 1;
      ctx.restore();

      ctx.save();
      ctx.translate(rightX, startY - yOffset);
      ctx.rotate(-rotation);
      ctx.scale(scale, scale);
      ctx.fillStyle = rightColor;
      ctx.globalAlpha = 0.9;
      ctx.fillRect(-40, -55, 80, 110);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-40, -55, 80, 110);
      ctx.globalAlpha = 1;
      ctx.restore();

      if (progress > 0.3) {
        const particleProgress = (progress - 0.3) / 0.7;
        const particleCount = Math.floor(particleProgress * 8);
        for (let i = 0; i < particleCount; i++) {
          const color = Math.random() > 0.5 ? leftColor : rightColor;
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 3 + 2;
          particlesRef.current.push({
            x: centerX + (Math.random() - 0.5) * 40,
            y: centerY + (Math.random() - 0.5) * 40,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            maxLife: 1,
            color,
            size: Math.random() * 4 + 2,
          });
        }
      }

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.life -= 0.02;

        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      if (progress > 0.7) {
        const glowProgress = (progress - 0.7) / 0.3;
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 100 * glowProgress);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.3, leftColor + '80');
        gradient.addColorStop(0.6, rightColor + '80');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 100 * glowProgress, 0, Math.PI * 2);
        ctx.fill();
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          onComplete();
        }, 200);
      }
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [leftCard, rightCard, leftColor, rightColor, onComplete]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={300}
      className="w-full max-w-xl"
    />
  );
}

interface SynthesisResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: { success: boolean; resultCardId: string | null } | null;
}

export function SynthesisResultModal({ isOpen, onClose, result }: SynthesisResultModalProps) {
  const { cardList } = useCardStore();
  const resultCard = result?.resultCardId 
    ? cardList.find(c => c.id === result.resultCardId) 
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative glass-bg rounded-3xl p-8 max-w-md w-full border border-white/10 shadow-2xl overflow-hidden"
          >
            {result?.success && resultCard && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: '120%', opacity: [0, 1, 0.3] }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="absolute w-32 top-1/2 -translate-y-1/2"
                  style={{
                    background: `linear-gradient(to top, transparent, ${RARITY_COLORS[resultCard.rarity]}80, transparent)`,
                    filter: 'blur(10px)',
                  }}
                />
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: '100%', opacity: [0, 0.8, 0.2] }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                  className="absolute w-16 top-1/2 -translate-y-1/2"
                  style={{
                    background: `linear-gradient(to top, transparent, #ffffff, transparent)`,
                    filter: 'blur(4px)',
                  }}
                />
              </div>
            )}

            <div className="relative z-10 text-center">
              <motion.h2
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-display font-bold mb-6"
                style={{ color: result?.success ? RARITY_COLORS[resultCard?.rarity || 'legendary'] : '#9ca3af' }}
              >
                {result?.success ? '合成成功！' : '合成失败'}
              </motion.h2>

              {result?.success && resultCard ? (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: 'spring', damping: 20 }}
                  className="flex flex-col items-center mb-6"
                >
                  <div
                    className="w-32 h-44 rounded-2xl flex flex-col items-center justify-center mb-4 animate-breathe"
                    style={{
                      border: `3px solid ${RARITY_COLORS[resultCard.rarity]}`,
                      background: `linear-gradient(135deg, #1a1a3e, #0a0a2a)`,
                      boxShadow: `0 0 30px ${RARITY_COLORS[resultCard.rarity]}60`,
                    }}
                  >
                    <ElementIcon element={resultCard.element} size={56} />
                    <div className="mt-2 font-display font-bold text-white text-lg">
                      {resultCard.name}
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-red-400 font-bold text-xl">{resultCard.attack}</div>
                      <div className="text-white/50">攻击</div>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-400 font-bold text-xl">{resultCard.defense}</div>
                      <div className="text-white/50">防御</div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-white/70 max-w-xs text-center">
                    {resultCard.description}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mb-6"
                >
                  <div className="text-6xl mb-4">💨</div>
                  <p className="text-white/70">
                    两种元素未能融合，再试试其他组合吧！
                  </p>
                </motion.div>
              )}

              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4, ease: 'easeOut' }}
                style={{ transformOrigin: 'center' }}
              >
                <button
                  onClick={onClose}
                  className="w-full py-3 px-6 rounded-xl font-bold text-white transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: result?.success
                      ? `linear-gradient(90deg, ${RARITY_COLORS[resultCard?.rarity || 'legendary']}, ${RARITY_COLORS[resultCard?.rarity || 'legendary']}aa)`
                      : 'linear-gradient(90deg, #6b7280, #4b5563)',
                    boxShadow: result?.success
                      ? `0 0 20px ${RARITY_COLORS[resultCard?.rarity || 'legendary']}40`
                      : 'none',
                  }}
                >
                  确认
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
