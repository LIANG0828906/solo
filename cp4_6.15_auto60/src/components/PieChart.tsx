import { useEffect, useRef, useState } from 'react';
import type { ZoneType } from '@/utils/particleSystem';

interface PieChartProps {
  data: Record<ZoneType, number>;
  size?: number;
  thickness?: number;
}

interface AnimatedValue {
  value: number;
  target: number;
}

const ZONE_COLORS: Record<ZoneType, string> = {
  residential: '#ff7f3f',
  commercial: '#4ac7ff',
  office: '#ffd27f',
  other: '#8a8a9a',
};

const ZONE_LABELS: Record<ZoneType, string> = {
  residential: '住宅',
  commercial: '商业',
  office: '办公',
  other: '其他',
};

export default function PieChart({
  data,
  size = 180,
  thickness = 24,
}: PieChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animatedValuesRef = useRef<Record<ZoneType, AnimatedValue>>({
    residential: { value: 0.25, target: 0.25 },
    commercial: { value: 0.25, target: 0.25 },
    office: { value: 0.25, target: 0.25 },
    other: { value: 0.25, target: 0.25 },
  });
  const animationFrameRef = useRef<number>();
  const [displayValues, setDisplayValues] = useState<Record<ZoneType, number>>({
    residential: 0.25,
    commercial: 0.25,
    office: 0.25,
    other: 0.25,
  });

  const center = size / 2;
  const radius = (size - thickness) / 2;

  useEffect(() => {
    const zones: ZoneType[] = ['residential', 'commercial', 'office', 'other'];
    for (const zone of zones) {
      animatedValuesRef.current[zone].target = data[zone];
    }
  }, [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const animate = () => {
      const zones: ZoneType[] = ['residential', 'commercial', 'office', 'other'];
      let needsUpdate = false;

      for (const zone of zones) {
        const anim = animatedValuesRef.current[zone];
        const diff = anim.target - anim.value;
        if (Math.abs(diff) > 0.001) {
          anim.value += diff * 0.08;
          needsUpdate = true;
        } else {
          anim.value = anim.target;
        }
      }

      if (needsUpdate) {
        const newValues: Record<ZoneType, number> = {
          residential: animatedValuesRef.current.residential.value,
          commercial: animatedValuesRef.current.commercial.value,
          office: animatedValuesRef.current.office.value,
          other: animatedValuesRef.current.other.value,
        };
        setDisplayValues(newValues);

        draw(ctx, newValues);
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    const draw = (ctx: CanvasRenderingContext2D, values: Record<ZoneType, number>) => {
      ctx.clearRect(0, 0, size, size);

      let startAngle = -Math.PI / 2;
      const zones: ZoneType[] = ['residential', 'commercial', 'office', 'other'];

      for (const zone of zones) {
        const value = values[zone];
        const sliceAngle = value * Math.PI * 2;

        if (sliceAngle > 0.001) {
          ctx.beginPath();
          ctx.arc(center, center, radius, startAngle, startAngle + sliceAngle);
          ctx.arc(center, center, radius - thickness, startAngle + sliceAngle, startAngle, true);
          ctx.closePath();

          ctx.fillStyle = ZONE_COLORS[zone];
          ctx.fill();

          ctx.strokeStyle = 'rgba(26, 26, 42, 0.8)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        startAngle += sliceAngle;
      }

      ctx.beginPath();
      ctx.arc(center, center, radius + 1, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(center, center, radius - thickness - 1, 0, Math.PI * 2);
      ctx.stroke();
    };

    draw(ctx, displayValues);
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [size, thickness, center, radius]);

  const zones: ZoneType[] = ['residential', 'commercial', 'office', 'other'];

  return (
    <div className="pie-chart-container">
      <h3 className="pie-title">人口分布</h3>

      <div className="pie-wrapper">
        <canvas
          ref={canvasRef}
          style={{ width: size, height: size }}
        />
        <div className="pie-center">
          <div className="pie-center-number">
            {Math.round(displayValues.residential * 100 + displayValues.commercial * 100 + displayValues.office * 100 + displayValues.other * 100)}
          </div>
          <div className="pie-center-label">%</div>
        </div>
      </div>

      <div className="pie-legend">
        {zones.map((zone) => (
          <div key={zone} className="legend-item">
            <span
              className="legend-color"
              style={{ backgroundColor: ZONE_COLORS[zone] }}
            />
            <span className="legend-label">{ZONE_LABELS[zone]}</span>
            <span className="legend-value">
              {(displayValues[zone] * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>

      <style>{`
        .pie-chart-container {
          background: rgba(42, 42, 58, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 20px;
          width: 280px;
        }

        .pie-title {
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 16px 0;
          letter-spacing: 0.5px;
        }

        .pie-wrapper {
          position: relative;
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }

        .pie-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .pie-center-number {
          font-size: 28px;
          font-weight: 700;
          color: #ffffff;
          font-family: 'JetBrains Mono', 'SF Mono', monospace;
          line-height: 1;
        }

        .pie-center-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 2px;
        }

        .pie-legend {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 3px;
          flex-shrink: 0;
        }

        .legend-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          flex: 1;
        }

        .legend-value {
          font-size: 12px;
          font-weight: 500;
          color: #ffffff;
          font-family: 'JetBrains Mono', 'SF Mono', monospace;
        }
      `}</style>
    </div>
  );
}
