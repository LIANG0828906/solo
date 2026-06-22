import React, { useRef, useEffect, useCallback } from 'react';
import { useStore } from '@/store';

const CHAR_RAMP = ' .:-=+*#%@';
const FONT_SIZE = 10;
const CHAR_W = 6;
const CHAR_H = 10;
const TARGET_FPS = 15;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

interface FrameBuffer {
  data: string;
  timestamp: number;
}

const Screen: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameBuffersRef = useRef<FrameBuffer[]>([]);
  const lastFrameTimeRef = useRef<number>(0);
  const frameAngleRef = useRef<number>(0);
  const animIdRef = useRef<number>(0);

  const frameIndex = useStore((s) => s.frameIndex);
  const isPlaying = useStore((s) => s.isPlaying);
  const scanlineDensity = useStore((s) => s.scanlineDensity);
  const chromaAberration = useStore((s) => s.chromaAberration);
  const phosphorPersistence = useStore((s) => s.phosphorPersistence);
  const selectedPreset = useStore((s) => s.selectedPreset);
  const presets = useStore((s) => s.presets);
  const nextFrame = useStore((s) => s.nextFrame);

  const currentFrameData = presets[selectedPreset].frames[frameIndex];

  const persistenceToHalfLife = useCallback((p: number): number => {
    return 0.5 + (p / 100) * 2.5;
  }, []);

  const drawASCII = useCallback((
    ctx: CanvasRenderingContext2D,
    frameData: string,
    jitter: boolean
  ) => {
    const lines = frameData.split('\n');
    ctx.font = `${FONT_SIZE}px "Courier New", monospace`;
    ctx.textBaseline = 'top';

    for (let y = 0; y < lines.length && y < 40; y++) {
      const line = lines[y];
      for (let x = 0; x < line.length && x < 60; x++) {
        const ch = line[x];
        const charIdx = CHAR_RAMP.indexOf(ch);
        if (charIdx <= 0) continue;

        const brightness = charIdx / (CHAR_RAMP.length - 1);
        const jitterFactor = jitter ? 1 + (Math.random() - 0.5) * 0.1 : 1;
        const r = Math.floor(brightness * jitterFactor * 0);
        const g = Math.floor(brightness * jitterFactor * 255);
        const b = Math.floor(brightness * jitterFactor * (0x41 / 255) * 255);

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillText(ch, x * CHAR_W, y * CHAR_H);
      }
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasW = 60 * CHAR_W;
    const canvasH = 40 * CHAR_H;
    canvas.width = canvasW;
    canvas.height = canvasH;

    const renderLoop = (timestamp: number) => {
      animIdRef.current = requestAnimationFrame(renderLoop);

      if (timestamp - lastFrameTimeRef.current < FRAME_INTERVAL) return;
      lastFrameTimeRef.current = timestamp;

      const now = performance.now();
      const halfLife = persistenceToHalfLife(phosphorPersistence) * 1000;

      if (phosphorPersistence > 0) {
        frameBuffersRef.current = frameBuffersRef.current.filter(
          (fb) => now - fb.timestamp < halfLife * 5
        );
      }

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvasW, canvasH);

      if (phosphorPersistence > 0) {
        for (let i = 0; i < frameBuffersRef.current.length; i++) {
          const fb = frameBuffersRef.current[i];
          const age = now - fb.timestamp;
          const decay = Math.pow(0.5, age / halfLife);
          if (decay < 0.01) continue;
          ctx.globalAlpha = decay * 0.6;
          drawASCII(ctx, fb.data, false);
        }
        ctx.globalAlpha = 1;
      }

      drawASCII(ctx, currentFrameData, true);

      if (isPlaying) {
        frameBuffersRef.current.push({
          data: currentFrameData,
          timestamp: now,
        });
        nextFrame();
      }

      frameAngleRef.current += 0.5;
      const chromaShift = (chromaAberration / 100) * 3;
      if (chromaShift > 0.1) {
        const angle = (frameAngleRef.current * Math.PI) / 180;
        const ox = Math.cos(angle) * chromaShift;
        const oy = Math.sin(angle) * chromaShift;

        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.15;
        ctx.drawImage(canvas, ox, 0, canvasW, canvasH);
        ctx.drawImage(canvas, -ox, 0, canvasW, canvasH);
        ctx.globalAlpha = 0.1;
        ctx.drawImage(canvas, 0, oy, canvasW, canvasH);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }

      if (scanlineDensity > 0) {
        const alpha = (scanlineDensity / 100) * 0.6;
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        for (let y = 0; y < canvasH; y += 2) {
          ctx.fillRect(0, y, canvasW, 1);
        }
      }
    };

    animIdRef.current = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animIdRef.current);
  }, [currentFrameData, scanlineDensity, chromaAberration, phosphorPersistence, isPlaying, nextFrame, persistenceToHalfLife, drawASCII]);

  const ledClass = isPlaying ? 'led-on' : 'led-blink';

  return (
    <div className="crt-screen-wrapper">
      <div className="crt-bezel">
        <div className={`power-led top-left ${ledClass}`} />
        <div className={`power-led top-right ${ledClass}`} />
        <div className={`power-led bottom-left ${ledClass}`} />
        <div className={`power-led bottom-right ${ledClass}`} />
        <canvas ref={canvasRef} className="crt-canvas" />
      </div>
      <style>{`
        .crt-screen-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .crt-bezel {
          position: relative;
          background: #D4C9B8;
          padding: 20px;
          border-radius: 6px;
          box-shadow:
            inset 0 2px 8px rgba(0,0,0,0.4),
            inset 0 -2px 8px rgba(0,0,0,0.2),
            0 4px 20px rgba(0,0,0,0.6);
        }
        .crt-canvas {
          display: block;
          background: #000;
          border-radius: 2px;
          image-rendering: pixelated;
          width: 360px;
          height: 400px;
        }
        .power-led {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .power-led.top-left { top: 8px; left: 8px; }
        .power-led.top-right { top: 8px; right: 8px; }
        .power-led.bottom-left { bottom: 8px; left: 8px; }
        .power-led.bottom-right { bottom: 8px; right: 8px; }
        .power-led.led-on {
          background: #00FF41;
          box-shadow: 0 0 6px #00FF41;
        }
        .power-led.led-blink {
          background: #FF3333;
          box-shadow: 0 0 6px #FF3333;
          animation: blink-led 1.5s ease-in-out infinite;
        }
        @keyframes blink-led {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @media (max-width: 768px) {
          .crt-canvas {
            width: 270px;
            height: 300px;
          }
          .crt-bezel {
            padding: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default Screen;
