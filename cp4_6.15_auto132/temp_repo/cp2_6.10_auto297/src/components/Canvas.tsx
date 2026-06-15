import React, { useRef, useEffect, useCallback } from 'react';
import type { Ripple, Particle, InstrumentType, RecordedPulse } from '../types';
import { INSTRUMENT_CONFIGS, PITCH_MAP } from '../types';
import { audioEngine } from '../utils/audioEngine';
import {
  getRippleRadius,
  getRippleAlpha,
  isRippleExpired,
  checkCollision,
  generateId,
  RIPPLE_LIFETIME,
  MAX_RIPPLES,
  RING_WIDTH
} from '../utils/rippleUtils';

interface CanvasProps {
  instrument: InstrumentType;
  bpm: number;
  isRecording: boolean;
  recordedPulses: RecordedPulse[];
  onPitchChange: (pitch: string) => void;
  onRecordPulse: (pulse: RecordedPulse) => void;
  onReset: () => void;
  playbackPulses: RecordedPulse[] | null;
}

const Canvas: React.FC<CanvasProps> = ({
  instrument,
  bpm,
  isRecording,
  recordedPulses,
  onPitchChange,
  onRecordPulse,
  onReset,
  playbackPulses
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>(0);
  const lastCollisionRef = useRef<Set<string>>(new Set());
  const shakeRef = useRef<{ x: number; y: number; intensity: number }>({ x: 0, y: 0, intensity: 0 });
  const recordingStartTimeRef = useRef<number>(0);
  const lastKeyPressRef = useRef<Set<string>>(new Set());

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }, []);

  const createParticles = useCallback((x: number, y: number, color: string) => {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 3;
      particlesRef.current.push({
        id: generateId(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2 + Math.random() * 3,
        life: 1,
        maxLife: 60 + Math.random() * 30
      });
    }
  }, []);

  const triggerShake = useCallback((intensity: number) => {
    shakeRef.current.intensity = intensity;
  }, []);

  const createRipple = useCallback((x: number, y: number, pitchKey: string) => {
    audioEngine.init();
    const pitchInfo = PITCH_MAP[pitchKey];
    const pitch = pitchInfo ? pitchInfo.name : 'C4';
    const frequency = pitchInfo ? pitchInfo.freq : 261.63;
    const config = INSTRUMENT_CONFIGS[instrument];

    audioEngine.playNote(instrument, frequency);
    onPitchChange(pitch);

    const ripple: Ripple = {
      id: generateId(),
      x,
      y,
      startTime: performance.now(),
      frequency,
      amplitude: 1,
      color: config.gradient,
      instrument,
      pitch,
      lifetime: RIPPLE_LIFETIME
    };

    ripplesRef.current.push(ripple);
    if (ripplesRef.current.length > MAX_RIPPLES) {
      ripplesRef.current.shift();
    }

    if (isRecording) {
      const pulse: RecordedPulse = {
        id: generateId(),
        x,
        y,
        instrument,
        pitch,
        timestamp: recordingStartTimeRef.current > 0
          ? performance.now() - recordingStartTimeRef.current
          : 0
      };
      onRecordPulse(pulse);
    }

    createParticles(x, y, config.gradient[0]);
    triggerShake(3);
  }, [instrument, isRecording, onPitchChange, onRecordPulse, createParticles, triggerShake]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const keys = Object.keys(PITCH_MAP);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    createRipple(x, y, randomKey);
  }, [createRipple]);

  useEffect(() => {
    if (isRecording && recordedPulses.length === 0) {
      recordingStartTimeRef.current = performance.now();
    }
  }, [isRecording, recordedPulses.length]);

  useEffect(() => {
    if (playbackPulses && playbackPulses.length > 0) {
      onReset();
      ripplesRef.current = [];
      particlesRef.current = [];

      playbackPulses.forEach((pulse, index) => {
        setTimeout(() => {
          const pitchKey = Object.keys(PITCH_MAP).find(k => PITCH_MAP[k].name === pulse.pitch) || 'a';
          const prevInstrument = instrument;
          const tempInstrument = pulse.instrument;
          
          const config = INSTRUMENT_CONFIGS[tempInstrument];
          const pitchInfo = PITCH_MAP[pitchKey];
          
          audioEngine.init();
          audioEngine.playNote(tempInstrument, pitchInfo ? pitchInfo.freq : 261.63);
          onPitchChange(pulse.pitch);

          const ripple: Ripple = {
            id: generateId(),
            x: pulse.x,
            y: pulse.y,
            startTime: performance.now(),
            frequency: pitchInfo ? pitchInfo.freq : 261.63,
            amplitude: 1,
            color: config.gradient,
            instrument: tempInstrument,
            pitch: pulse.pitch,
            lifetime: RIPPLE_LIFETIME
          };

          ripplesRef.current.push(ripple);
          createParticles(pulse.x, pulse.y, config.gradient[0]);
          triggerShake(3);
        }, pulse.timestamp);
      });
    }
  }, [playbackPulses, onReset, onPitchChange, createParticles, triggerShake]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      
      const key = e.key.toLowerCase();
      if (lastKeyPressRef.current.has(key)) return;
      lastKeyPressRef.current.add(key);

      if (PITCH_MAP[key]) {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = rect.width / 2 + (Math.random() - 0.5) * 200;
        const y = rect.height / 2 + (Math.random() - 0.5) * 200;
        createRipple(x, y, key);
      }

      if (e.code === 'Space') {
        e.preventDefault();
        onReset();
        ripplesRef.current = [];
        particlesRef.current = [];
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      lastKeyPressRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [createRipple, onReset]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [resizeCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      const currentTime = performance.now();
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      if (shakeRef.current.intensity > 0.5) {
        shakeRef.current.x = (Math.random() - 0.5) * shakeRef.current.intensity;
        shakeRef.current.y = (Math.random() - 0.5) * shakeRef.current.intensity;
        shakeRef.current.intensity *= 0.9;
      } else {
        shakeRef.current.x = 0;
        shakeRef.current.y = 0;
        shakeRef.current.intensity = 0;
      }

      ctx.save();
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, width, height);

      ctx.translate(shakeRef.current.x, shakeRef.current.y);

      ripplesRef.current = ripplesRef.current.filter(
        ripple => !isRippleExpired(ripple, currentTime)
      );

      for (let i = 0; i < ripplesRef.current.length; i++) {
        for (let j = i + 1; j < ripplesRef.current.length; j++) {
          const r1 = ripplesRef.current[i];
          const r2 = ripplesRef.current[j];
          const collisionKey = `${r1.id}-${r2.id}`;

          if (checkCollision(r1, r2, currentTime) && !lastCollisionRef.current.has(collisionKey)) {
            const dx = r2.x - r1.x;
            const dy = r2.y - r1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const midX = r1.x + dx / 2;
            const midY = r1.y + dy / 2;

            for (let p = 0; p < 4; p++) {
              const angle = Math.atan2(dy, dx) + Math.PI / 2 + (Math.random() - 0.5) * 0.5;
              const speed = 3 + Math.random() * 4;
              particlesRef.current.push({
                id: generateId(),
                x: midX,
                y: midY,
                vx: Math.cos(angle) * speed * (p % 2 === 0 ? 1 : -1),
                vy: Math.sin(angle) * speed * (p % 2 === 0 ? 1 : -1),
                color: r1.color[0],
                size: 3 + Math.random() * 4,
                life: 1,
                maxLife: 40 + Math.random() * 20
              });
            }

            lastCollisionRef.current.add(collisionKey);
            triggerShake(2);

            setTimeout(() => {
              lastCollisionRef.current.delete(collisionKey);
            }, 200);
          }
        }
      }

      ctx.globalCompositeOperation = 'lighter';

      ripplesRef.current.forEach(ripple => {
        const radius = getRippleRadius(ripple, currentTime);
        const alpha = getRippleAlpha(ripple, currentTime);

        for (let ring = 0; ring < 3; ring++) {
          const ringRadius = radius - ring * 15;
          if (ringRadius <= 0) continue;

          const ringAlpha = alpha * (1 - ring * 0.3);
          if (ringAlpha <= 0) continue;

          const gradient = ctx.createRadialGradient(
            ripple.x, ripple.y, ringRadius - RING_WIDTH,
            ripple.x, ripple.y, ringRadius + RING_WIDTH
          );
          gradient.addColorStop(0, `${ripple.color[0]}00`);
          gradient.addColorStop(0.5, `${ripple.color[0]}${Math.floor(ringAlpha * 255).toString(16).padStart(2, '0')}`);
          gradient.addColorStop(0.75, `${ripple.color[1]}${Math.floor(ringAlpha * 200).toString(16).padStart(2, '0')}`);
          gradient.addColorStop(1, `${ripple.color[1]}00`);

          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, ringRadius + RING_WIDTH, 0, Math.PI * 2);
          ctx.arc(ripple.x, ripple.y, ringRadius - RING_WIDTH, 0, Math.PI * 2, true);
          ctx.fillStyle = gradient;
          ctx.fill();
        }
      });

      ctx.globalCompositeOperation = 'source-over';

      particlesRef.current = particlesRef.current.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.98;
        particle.vy *= 0.98;
        particle.life -= 1 / particle.maxLife;

        if (particle.life <= 0) return false;

        const alpha = Math.min(1, particle.life * 2);
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
        ctx.fillStyle = `${particle.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();

        return true;
      });

      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [triggerShake]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{
          display: 'block',
          cursor: 'crosshair',
          touchAction: 'none'
        }}
      />
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'rgba(255,255,255,0.4)',
        fontSize: '12px',
        pointerEvents: 'none',
        textAlign: 'center'
      }}>
        点击画布或按键盘 A/W/S/E/D/F/T/G/Y/H/U/J/K 触发脉冲 · 空格键重置
      </div>
    </div>
  );
};

export default Canvas;
