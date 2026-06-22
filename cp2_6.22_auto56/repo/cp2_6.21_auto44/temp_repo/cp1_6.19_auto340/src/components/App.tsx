import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useParticleStore } from '../store/particleStore';
import type { Particle, FireworkConfig } from '../utils/physicsEngine';
import ControlPanel from './ControlPanel';

const SOCKET_URL = '/';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const particlesRef = useRef<Map<string, Particle>>(new Map());
  const animationFrameRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);
  const fpsUpdateTimeRef = useRef<number>(performance.now());

  const [fps, setFps] = useState<number>(60);
  const [particleCount, setParticleCount] = useState<number>(0);
  const [lowFps, setLowFps] = useState<boolean>(false);

  const {
    particles,
    fireworkType,
    selectedColor,
    radius,
    speed,
    clientId,
    setParticles,
    addParticles,
    setClientId,
    resetParticles
  } = useParticleStore();

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('init', (data: { clientId: string; particles: Particle[] }) => {
      setClientId(data.clientId);
      particlesRef.current.clear();
      data.particles.forEach((p) => particlesRef.current.set(p.id, p));
      setParticles(data.particles);
      setParticleCount(data.particles.length);
    });

    socket.on('particlesAdded', (newParticles: Particle[]) => {
      newParticles.forEach((p) => particlesRef.current.set(p.id, { ...p, trail: [] }));
      addParticles(newParticles);
    });

    socket.on('particlesUpdated', (updatedParticles: Particle[]) => {
      updatedParticles.forEach((p) => {
        const existing = particlesRef.current.get(p.id);
        if (existing) {
          const newTrail = [...existing.trail, { x: existing.x, y: existing.y }];
          if (newTrail.length > 18) newTrail.shift();
          particlesRef.current.set(p.id, { ...p, trail: newTrail });
        } else {
          particlesRef.current.set(p.id, { ...p, trail: [] });
        }
      });
    });

    socket.on('particlesRemoved', (removedIds: string[]) => {
      removedIds.forEach((id) => particlesRef.current.delete(id));
    });

    socket.on('clientDisconnected', (disconnectedId: string) => {
      const toRemove: string[] = [];
      particlesRef.current.forEach((p, id) => {
        if (p.clientId === disconnectedId) toRemove.push(id);
      });
      toRemove.forEach((id) => particlesRef.current.delete(id));
    });

    socket.on('canvasReset', () => {
      particlesRef.current.clear();
      resetParticles();
      setParticleCount(0);
    });

    return () => {
      socket.disconnect();
    };
  }, [setClientId, setParticles, addParticles, resetParticles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const render = () => {
      const now = performance.now();
      frameCountRef.current++;

      if (now - fpsUpdateTimeRef.current >= 1000) {
        const currentFps = Math.round(
          (frameCountRef.current * 1000) / (now - fpsUpdateTimeRef.current)
        );
        setFps(currentFps);
        setLowFps(currentFps < 40);
        frameCountRef.current = 0;
        fpsUpdateTimeRef.current = now;
      }

      lastFrameTimeRef.current = now;

      ctx.fillStyle = 'rgba(13, 13, 13, 0.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const allParticles = Array.from(particlesRef.current.values());
      setParticleCount(allParticles.length);

      for (const particle of allParticles) {
        if (particle.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
          for (let i = 1; i < particle.trail.length; i++) {
            ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
          }
          ctx.strokeStyle = particle.trailColor + Math.floor(particle.alpha * 120).toString(16).padStart(2, '0');
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = particle.color + Math.floor(particle.alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 5, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          5
        );
        gradient.addColorStop(0, particle.color + Math.floor(particle.alpha * 200).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, particle.color + '00');
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || !socketRef.current) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const config: FireworkConfig = {
        color: selectedColor,
        radius,
        speed,
        type: fireworkType
      };

      let adjustedConfig = config;
      if (fps < 40) {
        adjustedConfig = { ...config, speed: speed * 0.7 };
      }

      socketRef.current.emit('createFirework', { x, y, config: adjustedConfig });
    },
    [selectedColor, radius, speed, fireworkType, fps]
  );

  const handleReset = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('resetCanvas');
    }
  }, []);

  const getFpsColor = () => {
    if (fps >= 55) return '#69F0AE';
    if (fps >= 40) return '#EEFF41';
    return '#FF5252';
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: '#0D0D0D',
        position: 'relative'
      }}
    >
      <div
        style={{
          width: '85%',
          height: '100%',
          position: 'relative',
          marginLeft: '8px',
          marginTop: '8px',
          marginBottom: '8px'
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '8px',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: lowFps
              ? '0 0 20px 4px rgba(255, 82, 82, 0.6), inset 0 0 20px 4px rgba(255, 82, 82, 0.3)'
              : 'none',
            animation: lowFps ? 'glowPulse 2s ease-in-out infinite' : 'none'
          }}
        >
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              cursor: 'crosshair',
              background: '#0D0D0D'
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '16px',
              color: '#fff',
              fontSize: '14px',
              fontFamily: 'monospace',
              pointerEvents: 'none',
              textShadow: '0 0 4px rgba(0,0,0,0.8)'
            }}
          >
            <div>粒子数: <span style={{ color: '#40C4FF' }}>{particleCount}</span></div>
            <div style={{ marginTop: '4px' }}>
              FPS: <span style={{ color: getFpsColor() }}>{fps}</span>
            </div>
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              color: '#fff',
              fontSize: '28px',
              pointerEvents: 'none',
              opacity: 0.6
            }}
          >
            {fireworkType === 'circle' ? '●' : '⟐'}
          </div>
        </div>
      </div>

      <ControlPanel onReset={handleReset} />

      <style>{`
        @keyframes glowPulse {
          0%, 100% {
            box-shadow: 0 0 15px 3px rgba(255, 82, 82, 0.4), inset 0 0 15px 3px rgba(255, 82, 82, 0.2);
          }
          50% {
            box-shadow: 0 0 30px 6px rgba(255, 82, 82, 0.7), inset 0 0 30px 6px rgba(255, 82, 82, 0.4);
          }
        }
      `}</style>
    </div>
  );
};

export default App;
