import { useEffect, useRef, useCallback } from 'react';
import type { WordEntry } from './types';

interface Props {
  words: WordEntry[];
}

interface CloudWord {
  text: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  hue: number;
  vx: number;
  vy: number;
  weight: number;
  targetOpacity: number;
  targetSize: number;
}

export default function WordCloud({ words }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cloudWordsRef = useRef<CloudWord[]>([]);
  const rafRef = useRef<number>(0);
  const wordsRef = useRef(words);

  wordsRef.current = words;

  const syncWords = useCallback(() => {
    const cw = cloudWordsRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width;
    const H = canvas.height;

    const currentTexts = new Set(cw.map(w => w.text + w.hue));
    const newWords = wordsRef.current.filter(
      w => !currentTexts.has(w.text + w.hue)
    );

    for (const w of newWords) {
      const weight = 1 + w.likes * 0.3;
      const size = 14 + weight * 4;
      cloudWordsRef.current.push({
        text: w.text,
        x: Math.random() * W,
        y: Math.random() * H,
        size: 0,
        targetSize: size,
        opacity: 0,
        targetOpacity: 0.4 + Math.min(w.likes * 0.05, 0.3),
        hue: w.hue,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        weight,
      });
    }

    const activeTexts = new Set(wordsRef.current.map(w => w.text + w.hue));
    for (const cw2 of cloudWordsRef.current) {
      if (!activeTexts.has(cw2.text + cw2.hue)) {
        cw2.targetOpacity = 0;
        cw2.targetSize = cw2.size * 0.5;
      }
    }

    cloudWordsRef.current = cloudWordsRef.current.filter(
      cw2 => cw2.opacity > 0.01 || cw2.targetOpacity > 0
    );

    if (cloudWordsRef.current.length > 80) {
      cloudWordsRef.current = cloudWordsRef.current
        .sort((a, b) => b.targetOpacity - a.targetOpacity)
        .slice(0, 80);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const ctx = canvas.getContext('2d')!;

    const animate = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;

      syncWords();

      ctx.clearRect(0, 0, W, H);

      for (const cw of cloudWordsRef.current) {
        cw.opacity += (cw.targetOpacity - cw.opacity) * 0.04;
        cw.size += (cw.targetSize - cw.size) * 0.06;

        cw.x += cw.vx;
        cw.y += cw.vy;

        if (cw.x < 0 || cw.x > W) cw.vx *= -1;
        if (cw.y < 0 || cw.y > H) cw.vy *= -1;

        cw.x = Math.max(0, Math.min(W, cw.x));
        cw.y = Math.max(0, Math.min(H, cw.y));

        if (cw.opacity < 0.01) continue;

        ctx.save();
        ctx.globalAlpha = cw.opacity;
        ctx.font = `${cw.size}px "PingFang SC", "Microsoft YaHei", sans-serif`;
        ctx.fillStyle = `hsl(${cw.hue}, 40%, 70%)`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = `hsla(${cw.hue}, 60%, 60%, 0.4)`;
        ctx.shadowBlur = 8;
        ctx.fillText(cw.text, cw.x, cw.y);
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [syncWords]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        pointerEvents: 'none',
      }}
    />
  );
}
