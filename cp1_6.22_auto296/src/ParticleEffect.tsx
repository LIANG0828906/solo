import React, { useEffect, useState } from 'react';
import { Particle, ShockwaveState, ColorShakeState, DamageNumber } from './types';

interface ParticleEffectProps {
  particles: Particle[];
  shockwave: ShockwaveState;
  colorShake: ColorShakeState;
  damageNumbers: DamageNumber[];
  gridSize: number;
  onParticleExpire: (id: number) => void;
  onDamageExpire: (id: number) => void;
  onShockwaveEnd: () => void;
  onColorShakeEnd: () => void;
}

const PARTICLE_DURATION = 400;
const SHOCKWAVE_DURATION = 1200;
const COLOR_SHAKE_DURATION = 500;
const DAMAGE_DURATION = 1200;

const ParticleEffect: React.FC<ParticleEffectProps> = ({
  particles,
  shockwave,
  colorShake,
  damageNumbers,
  gridSize,
  onParticleExpire,
  onDamageExpire,
  onShockwaveEnd,
  onColorShakeEnd,
}) => {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      particles.forEach((p) => {
        if (now - p.createdAt > PARTICLE_DURATION) {
          onParticleExpire(p.id);
        }
      });
      damageNumbers.forEach((d) => {
        if (now - d.createdAt > DAMAGE_DURATION) {
          onDamageExpire(d.id);
        }
      });
      if (shockwave.active && now - shockwave.startedAt > SHOCKWAVE_DURATION) {
        onShockwaveEnd();
      }
      if (colorShake.active && now - colorShake.startedAt > COLOR_SHAKE_DURATION) {
        onColorShakeEnd();
      }
      forceUpdate((n) => n + 1);
    }, 50);
    return () => clearInterval(interval);
  }, [particles, damageNumbers, shockwave, colorShake, onParticleExpire, onDamageExpire, onShockwaveEnd, onColorShakeEnd]);

  return (
    <>
      {colorShake.active && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: colorShake.color,
            opacity: 0.15,
            pointerEvents: 'none',
            zIndex: 999,
            animation: `colorShake ${COLOR_SHAKE_DURATION}ms ease-in-out forwards`,
          }}
        />
      )}

      {particles.map((p) => {
        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: p.color,
              boxShadow: `0 0 15px ${p.color}, 0 0 25px ${p.color}`,
              pointerEvents: 'none',
              zIndex: 50,
              ['--start-x' as string]: `${p.startX - gridSize / 2}px`,
              ['--start-y' as string]: `${p.startY - gridSize / 2}px`,
              ['--end-x' as string]: `${p.endX - gridSize / 2 - 5}px`,
              ['--end-y' as string]: `${p.endY - gridSize / 2 - 5}px`,
              transform: `translate(${p.startX - gridSize / 2}px, ${p.startY - gridSize / 2}px)`,
              animation: `particleFly ${PARTICLE_DURATION}ms ease-out forwards`,
            } as React.CSSProperties}
          />
        );
      })}

      {shockwave.active && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            border: `8px solid ${shockwave.color}`,
            boxShadow: `0 0 30px ${shockwave.color}, inset 0 0 30px ${shockwave.color}`,
            pointerEvents: 'none',
            zIndex: 60,
            transformStyle: 'preserve-3d',
            animation: `shockwaveExpand ${SHOCKWAVE_DURATION}ms cubic-bezier(0.1, 0.8, 0.2, 1) forwards`,
          }}
        />
      )}

      {damageNumbers.map((d) => (
        <div
          key={d.id}
          style={{
            position: 'absolute',
            left: `${d.x}px`,
            top: `${d.y}px`,
            transform: 'translate(-50%, -50%)',
            color: '#ff4444',
            fontSize: '24px',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            textShadow: '0 0 10px #ff0000, 0 0 20px #ff0000, 2px 2px 0 #000',
            pointerEvents: 'none',
            zIndex: 100,
            animation: `damageFloat ${DAMAGE_DURATION}ms ease-out forwards`,
          }}
        >
          -{d.value}
        </div>
      ))}
    </>
  );
};

export default ParticleEffect;
