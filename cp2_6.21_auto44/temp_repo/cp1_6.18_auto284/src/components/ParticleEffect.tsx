import React, { useEffect, useRef, useState } from 'react';
import { useGameStore, Particle, ScorePopup } from '../store/gameStore';

const PARTICLE_SIZE = 3;
const PARTICLE_RADIUS = 20;
const PARTICLE_LIFETIME = 600;
const POPUP_LIFETIME = 1000;
const POPUP_TRAVEL = 50;

interface ParticleVisualProps {
  particles: Particle[];
  scorePopups: ScorePopup[];
}

const ParticleEffect: React.FC<ParticleVisualProps> = ({
  particles,
  scorePopups,
}) => {
  const clearExpiredEffects = useGameStore((s) => s.clearExpiredEffects);
  const rafRef = useRef<number | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    let lastTime = performance.now();
    let clearCounter = 0;

    const animate = (now: number) => {
      const dt = now - lastTime;
      if (dt >= 16) {
        lastTime = now;
        setTick((t) => (t + 1) % 1000000);
        clearCounter += 1;
        if (clearCounter >= 3) {
          clearExpiredEffects();
          clearCounter = 0;
        }
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [clearExpiredEffects]);

  const now = performance.now();

  return (
    <>
      {particles.map((p) => {
        const age = (now - p.createdAt) / PARTICLE_LIFETIME;
        if (age >= 1) return null;
        const distance = PARTICLE_RADIUS * Math.min(1, age * 1.5);
        const x = p.originX + Math.cos(p.angle) * distance;
        const y = p.originY + Math.sin(p.angle) * distance;
        const scale = Math.max(0, 1 - age * 0.8);
        const opacity = Math.max(0, 1 - age);
        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: x - PARTICLE_SIZE / 2,
              top: y - PARTICLE_SIZE / 2,
              width: PARTICLE_SIZE,
              height: PARTICLE_SIZE,
              borderRadius: '50%',
              backgroundColor: p.color,
              opacity,
              transform: `scale(${scale})`,
              pointerEvents: 'none',
              boxShadow: `0 0 ${4 * opacity}px ${p.color}`,
              willChange: 'transform, opacity',
            }}
          />
        );
      })}

      {scorePopups.map((popup) => {
        const age = (now - popup.createdAt) / POPUP_LIFETIME;
        if (age >= 1) return null;
        const offsetY = -POPUP_TRAVEL * age;
        const opacity = Math.max(0, 1 - age);
        return (
          <div
            key={popup.id}
            style={{
              position: 'absolute',
              left: popup.x,
              top: popup.y + offsetY,
              transform: 'translate(-50%, -50%)',
              color: '#FFD700',
              fontSize: 18,
              fontWeight: 800,
              fontFamily: 'Menlo, Consolas, monospace',
              textShadow: '0 0 8px rgba(255, 215, 0, 0.8)',
              opacity,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              willChange: 'transform, opacity',
            }}
          >
            +{popup.value}
          </div>
        );
      })}
    </>
  );
};

export default React.memo(ParticleEffect);
