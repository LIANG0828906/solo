import { useEffect, useRef } from 'react';
import type { Mood } from '@/types';
import { getMoodColor } from '@/utils/helpers';

interface WaveformCanvasProps {
  data: number[];
  mood: Mood;
  height?: number;
  isPlaying?: boolean;
  onClick?: () => void;
  className?: string;
}

export const WaveformCanvas = ({
  data,
  mood,
  height = 80,
  isPlaying = false,
  onClick,
  className = '',
}: WaveformCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const progressRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const draw = () => {
      const width = rect.width;
      ctx.clearRect(0, 0, width, height);

      const startColor = '#E63946';
      const endColor = getMoodColor(mood);
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, startColor);
      gradient.addColorStop(1, endColor);

      const barCount = data.length;
      const barWidth = width / barCount;
      const centerY = height / 2;

      ctx.beginPath();
      ctx.moveTo(0, centerY);

      for (let i = 0; i < barCount; i++) {
        const x = i * barWidth + barWidth / 2;
        const amplitude = data[i] || 0.1;
        const barHeight = amplitude * (height * 0.85);
        const topY = centerY - barHeight / 2;
        const bottomY = centerY + barHeight / 2;

        if (i === 0) {
          ctx.moveTo(x, topY);
        } else {
          const prevX = (i - 1) * barWidth + barWidth / 2;
          const prevAmplitude = data[i - 1] || 0.1;
          const prevBar