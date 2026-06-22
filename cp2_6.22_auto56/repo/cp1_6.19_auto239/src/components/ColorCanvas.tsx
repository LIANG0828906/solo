import { useRef, useEffect, useCallback } from 'react';
import { useColorFlowStore, EmotionType } from '@/store/useColorFlowStore';
import { scaleSqrt } from 'd3-scale';

interface EmotionPreset {
  hueRange: [number, number];
  saturationRange: [number, number];
  amplitudeRange: [number, number];
  frequencyRange: [number, number];
}

const EMOTION_PRESETS: Record<EmotionType, EmotionPreset> = {
  '宁静': { hueRange: [220, 270], saturationRange: [50, 70], amplitudeRange: [40, 60], frequencyRange: [0.5, 0.8] },
  '欢愉': { hueRange: [30, 60], saturationRange: [70, 90], amplitudeRange: [60, 80], frequencyRange: [0.8, 1.4] },
  '忧郁': { hueRange: [200, 230], saturationRange: [20, 40], amplitudeRange: [40, 55], frequencyRange: [0.5, 0.7] },
  '激昂': { hueRange: [0, 30], saturationRange: [80, 100], amplitudeRange: [70, 100], frequencyRange: [1.2, 2.0] },
};

interface Blob {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  radius: number;
  h: number;
  s: number;
  l: number;
  phaseX: number;
  phaseY: number;
  freqX: number;
  freqY: number;
  ampX: number;
  ampY: number;
  targetH: number;
  targetS: number;
  targetL: number;
  targetAmpX: number;
  targetAmpY: number;
  targetFreqX: number;
  targetFreqY: number;
  alpha: number;
}

const BLOB_COUNT = 10;
const LERP_SPEED = 0.04;
const EMOTION_LERP_SPEED = 0.025;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return a + diff * t;
}

function createBlobs(width: number, height: number, emotion: EmotionType): Blob[] {
  const preset = EMOTION_PRESETS[emotion];
  const sizeScale = scaleSqrt().domain([400, 2000]).range([30, 60]).clamp(true);
  const baseRadius = sizeScale(Math.min(width, height));
  const blobs: Blob[] = [];
  const cols = 3;
  const rows = Math.ceil(BLOB_COUNT / cols);
  const cellW = width / cols;
  const cellH = height / rows;

  for (let i = 0; i < BLOB_COUNT; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const baseX = cellW * (col + 0.5) + (Math.random() - 0.5) * cellW * 0.3;
    const baseY = cellH * (row + 0.5) + (Math.random() - 0.5) * cellH * 0.3;
    const hueT = i / BLOB_COUNT;
    const h = preset.hueRange[0] + (preset.hueRange[1] - preset.hueRange[0]) * hueT;
    const s = preset.saturationRange[0] + (preset.saturationRange[1] - preset.saturationRange[0]) * Math.random();
    const l = 45 + Math.random() * 20;
    const ampX = preset.amplitudeRange[0] + Math.random() * (preset.amplitudeRange[1] - preset.amplitudeRange[0]);
    const ampY = preset.amplitudeRange[0] + Math.random() * (preset.amplitudeRange[1] - preset.amplitudeRange[0]);
    const freqX = preset.frequencyRange[0] + Math.random() * (preset.frequencyRange[1] - preset.frequencyRange[0]);
    const freqY = preset.frequencyRange[0] + Math.random() * (preset.frequencyRange[1] - preset.frequencyRange[0]);
    const radius = baseRadius * (0.7 + Math.random() * 0.6);

    blobs.push({
      x: baseX, y: baseY, baseX, baseY,
      radius,
      h, s, l,
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      freqX, freqY, ampX, ampY,
      targetH: h, targetS: s, targetL: l,
      targetAmpX: ampX, targetAmpY: ampY,
      targetFreqX: freqX, targetFreqY: freqY,
      alpha: 1.0,
    });
  }
  return blobs;
}

export default function ColorCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blobsRef = useRef<Blob[]>([]);
  const animRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const storeRef = useRef({ h: 220, s: 70, speed: 1.0, emotion: '宁静' as EmotionType });
  const prevEmotionRef = useRef<EmotionType>('宁静');
  const sizeRef = useRef({ width: 0, height: 0 });

  const h = useColorFlowStore((s) => s.h);
  const s = useColorFlowStore((s) => s.s);
  const speed = useColorFlowStore((s) => s.speed);
  const emotion = useColorFlowStore((s) => s.emotion);

  storeRef.current = { h, s, speed, emotion };

  const updateTargets = useCallback((emotion: EmotionType) => {
    const preset = EMOTION_PRESETS[emotion];
    const blobs = blobsRef.current;
    for (let i = 0; i < blobs.length; i++) {
      const blob = blobs[i];
      const hueT = i / blobs.length;
      blob.targetH = preset.hueRange[0] + (preset.hueRange[1] - preset.hueRange[0]) * hueT;
      blob.targetS = preset.saturationRange[0] + (preset.saturationRange[1] - preset.saturationRange[0]) * Math.random();
      blob.targetL = 45 + Math.random() * 20;
      blob.targetAmpX = preset.amplitudeRange[0] + Math.random() * (preset.amplitudeRange[1] - preset.amplitudeRange[0]);
      blob.targetAmpY = preset.amplitudeRange[0] + Math.random() * (preset.amplitudeRange[1] - preset.amplitudeRange[0]);
      blob.targetFreqX = preset.frequencyRange[0] + Math.random() * (preset.frequencyRange[1] - preset.frequencyRange[0]);
      blob.targetFreqY = preset.frequencyRange[0] + Math.random() * (preset.frequencyRange[1] - preset.frequencyRange[0]);
    }
  }, []);

  useEffect(() => {
    if (emotion !== prevEmotionRef.current) {
      updateTargets(emotion);
      prevEmotionRef.current = emotion;
    }
  }, [emotion, updateTargets]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { width: w, height: h };

      if (blobsRef.current.length === 0) {
        blobsRef.current = createBlobs(w, h, storeRef.current.emotion);
      }
    };
    resize();
    window.addEventListener('resize', resize);

    let lastTime = performance.now();

    const animate = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const { h: storeH, s: storeS, speed: storeSpeed } = storeRef.current;
      timeRef.current += dt * storeSpeed;
      const time = timeRef.current;
      const blobs = blobsRef.current;
      const { width, height } = sizeRef.current;

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < blobs.length; i++) {
        const b = blobs[i];
        b.h = lerpAngle(b.h, b.targetH, EMOTION_LERP_SPEED);
        b.s = lerp(b.s, b.targetS, EMOTION_LERP_SPEED);
        b.l = lerp(b.l, b.targetL, EMOTION_LERP_SPEED);
        b.ampX = lerp(b.ampX, b.targetAmpX, EMOTION_LERP_SPEED);
        b.ampY = lerp(b.ampY, b.targetAmpY, EMOTION_LERP_SPEED);
        b.freqX = lerp(b.freqX, b.targetFreqX, EMOTION_LERP_SPEED);
        b.freqY = lerp(b.freqY, b.targetFreqY, EMOTION_LERP_SPEED);

        b.x = b.baseX + b.ampX * Math.sin(b.freqX * time + b.phaseX);
        b.y = b.baseY + b.ampY * Math.cos(b.freqY * time + b.phaseY);
      }

      const alphaMap = new Float32Array(blobs.length).fill(1.0);
      for (let i = 0; i < blobs.length; i++) {
        for (let j = i + 1; j < blobs.length; j++) {
          const dx = blobs[i].x - blobs[j].x;
          const dy = blobs[i].y - blobs[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const threshold = (blobs[i].radius + blobs[j].radius) * 1.5;
          if (dist < threshold) {
            const t = 1.0 - dist / threshold;
            const newAlpha = 0.3 + 0.7 * (1.0 - t);
            alphaMap[i] = Math.min(alphaMap[i], newAlpha);
            alphaMap[j] = Math.min(alphaMap[j], newAlpha);
          }
        }
      }

      for (let i = 0; i < blobs.length; i++) {
        const b = blobs[i];
        const displayH = (b.h + storeH - 220 + 360) % 360;
        const displayS = storeS;
        const isBlending = alphaMap[i] < 0.99;

        ctx.save();

        if (isBlending) {
          ctx.shadowBlur = 6;
          ctx.shadowColor = 'rgba(255,255,255,0.5)';
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.globalAlpha = alphaMap[i];
        const gradient = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);
        const coreColor = `hsla(${displayH}, ${displayS}%, ${b.l}%, 0.9)`;
        const edgeColor = `hsla(${displayH}, ${displayS}%, ${b.l}%, 0.0)`;
        gradient.addColorStop(0, coreColor);
        gradient.addColorStop(0.6, coreColor);
        gradient.addColorStop(1, edgeColor);

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.restore();
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}
    />
  );
}
