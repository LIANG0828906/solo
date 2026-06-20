import { useEffect, useRef, useMemo } from 'react';
import { Nutrition } from '../types';

interface NutritionPieChartProps {
  nutrition: Nutrition;
}

const COLORS = {
  calories: '#f59e0b',
  protein: '#22c55e',
  fat: '#ef4444',
  carbs: '#3b82f6',
};

const LABELS = {
  calories: '卡路里',
  protein: '蛋白质',
  fat: '脂肪',
  carbs: '碳水',
};

const UNITS = {
  calories: 'kcal',
  protein: 'g',
  fat: 'g',
  carbs: 'g',
};

const NutritionPieChart = ({ nutrition }: NutritionPieChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);

  const values = useMemo(
    () => [
      nutrition.calories,
      nutrition.protein,
      nutrition.fat,
      nutrition.carbs,
    ],
    [nutrition]
  );

  const total = useMemo(
    () => values.reduce((sum, v) => sum + Math.max(v, 0), 0),
    [values]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId = 0;
    let isMounted = true;

    const resizeCanvas = () => {
      if (!isMounted || !canvas || !container || !ctx) return;
      const size = Math.min(container.clientWidth, 360);
      const dpr = window.devicePixelRatio || 1;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);

    const draw = (timestamp: number) => {
      if (!isMounted || !canvas || !ctx) return;

      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const breathePhase = (Math.sin((elapsed / 1000) * Math.PI * 2) + 1) / 2;
      const breatheAmount = 0.06 * breathePhase;

      const size = parseInt(canvas.style.width, 10);
      const centerX = size / 2;
      const centerY = size / 2;
      const baseRadius = size * 0.38;

      ctx.clearRect(0, 0, size, size);

      if (total === 0) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#e5e5e5';
        ctx.fill();

        ctx.font = 'bold 28px Playfair Display, serif';
        ctx.fillStyle = '#2c2c2c';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('0', centerX, centerY - 8);

        ctx.font = '12px Lora, serif';
        ctx.fillStyle = '#8a8275';
        ctx.fillText('kcal', centerX, centerY + 14);

        if (isMounted) {
          animationId = requestAnimationFrame(draw);
          animationRef.current = animationId;
        }
        return;
      }

      const colorKeys: (keyof typeof COLORS)[] = ['calories', 'protein', 'fat', 'carbs'];
      let currentAngle = -Math.PI / 2;

      for (let i = 0; i < values.length; i++) {
        const value = Math.max(values[i], 0);
        if (value === 0) continue;

        const sliceAngle = (value / total) * Math.PI * 2;
        const isLargest = values[i] === Math.max(...values);
        const radius = isLargest ? baseRadius * (1 + breatheAmount) : baseRadius;

        const alpha = isLargest ? 1 : 0.7 + 0.3 * breathePhase;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = COLORS[colorKeys[i]];
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.globalAlpha = 1;

        currentAngle += sliceAngle;
      }

      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.font = 'bold 28px Playfair Display, serif';
      ctx.fillStyle = '#2c2c2c';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(Math.round(nutrition.calories)), centerX, centerY - 8);

      ctx.font = '12px Lora, serif';
      ctx.fillStyle = '#8a8275';
      ctx.fillText('kcal', centerX, centerY + 14);

      lastFrameTimeRef.current = timestamp;

      if (isMounted) {
        animationId = requestAnimationFrame(draw);
        animationRef.current = animationId;
      }
    };

    animationId = requestAnimationFrame(draw);
    animationRef.current = animationId;

    return () => {
      isMounted = false;
      cancelAnimationFrame(animationId);
      cancelAnimationFrame(animationRef.current);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      startTimeRef.current = 0;
      lastFrameTimeRef.current = 0;
    };
  }, [values, total, nutrition.calories]);

  return (
    <div className="nutrition-pie-chart">
      <div ref={containerRef} className="pie-chart-container">
        <canvas ref={canvasRef} />
      </div>
      <div className="pie-chart-legend">
        {(Object.keys(COLORS) as (keyof typeof COLORS)[]).map((key) => (
          <div key={key} className="legend-item">
            <span
              className="legend-dot"
              style={{ backgroundColor: COLORS[key] }}
            />
            <span className="legend-label">{LABELS[key]}</span>
            <span className="legend-value">
              {Math.round(nutrition[key])} {UNITS[key]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NutritionPieChart;
