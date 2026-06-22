import { useRef, useEffect, useState, useCallback } from 'react';
import type { BrewParams } from '@/types';

interface BrewFormProps {
  params: BrewParams;
  onChange: (params: BrewParams) => void;
}

export default function BrewForm({ params, onChange }: BrewFormProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const calculateFlowRate = useCallback(() => {
    const tempFactor = (params.waterTemp - 80) / 20;
    const grindFactor = (params.grindSize - 1) / 9;
    const ratioFactor = (20 - params.waterRatio) / 10;
    const timeFactor = (300 - params.pourTime) / 250;
    return (tempFactor * 0.3 + grindFactor * 0.4 + ratioFactor * 0.1 + timeFactor * 0.2);
  }, [params]);

  const drawFlowChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const flowRate = calculateFlowRate();
    const totalTime = params.pourTime;
    const totalVolume = 200;

    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#d4a373');
    gradient.addColorStop(1, '#faedcd');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();

    const points = 50;
    for (let i = 0; i <= points; i++) {
      const t = i / points;
      const time = t * totalTime;
      let volume: number;

      if (flowRate < 0.3) {
        volume = totalVolume * Math.pow(t, 0.7);
      } else if (flowRate < 0.7) {
        volume = totalVolume * t;
      } else {
        const steepness = 1 + flowRate * 2;
        volume = totalVolume * (1 - Math.pow(1 - t, steepness));
      }

      const x = t * w;
      const y = h - (volume / totalVolume) * h * 0.85 - h * 0.05;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = 'rgba(212, 163, 115, 0.15)';
    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
      const t = i / points;
      const time = t * totalTime;
      let volume: number;

      if (flowRate < 0.3) {
        volume = totalVolume * Math.pow(t, 0.7);
      } else if (flowRate < 0.7) {
        volume = totalVolume * t;
      } else {
        const steepness = 1 + flowRate * 2;
        volume = totalVolume * (1 - Math.pow(1 - t, steepness));
      }

      const x = t * w;
      const y = h - (volume / totalVolume) * h * 0.85 - h * 0.05;

      if (i === 0) {
        ctx.moveTo(x, h);
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#888';
    ctx.font = '11px sans-serif';
    ctx.fillText(`流速: ${(flowRate * 100).toFixed(0)}%`, 8, 18);
    ctx.fillText(`总注水: ${totalVolume}ml`, 8, 34);
  }, [calculateFlowRate, params.pourTime]);

  useEffect(() => {
    let animationId: number;
    const animate = () => {
      drawFlowChart();
      animationId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationId);
  }, [drawFlowChart]);

  const handleKnobMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !knobRef.current) return;
      const rect = knobRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      let degrees = (angle * 180) / Math.PI + 90;
      if (degrees < 0) degrees += 360;
      let value = Math.round((degrees / 270) * 9 + 1);
      if (value > 10) value = 10;
      if (value < 1) value = 1;
      if (degrees > 315) value = 1;
      onChange({ ...params, grindSize: value });
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, params, onChange]);

  const knobRotation = ((params.grindSize - 1) / 9) * 270 - 135;

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>冲煮参数</h3>

      <div className="brew-form-grid" style={styles.formGrid}>
        <div style={styles.leftColumn}>
          <div style={styles.field}>
            <label style={styles.label}>
              水温 <span style={styles.value}>{params.waterTemp}°C</span>
            </label>
            <input
              type="range"
              min="85"
              max="98"
              step="0.5"
              value={params.waterTemp}
              onChange={(e) =>
                onChange({ ...params, waterTemp: Number(e.target.value) })
              }
              style={styles.slider}
            />
            <div style={styles.sliderLabels}>
              <span>85°C</span>
              <span>98°C</span>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              研磨度 <span style={styles.value}>{params.grindSize} 档</span>
            </label>
            <div
              ref={knobRef}
              style={{
                ...styles.knobContainer,
                cursor: isDragging ? 'grabbing' : 'grab',
              }}
              onMouseDown={handleKnobMouseDown}
            >
              <div
                style={{
                  ...styles.knob,
                  transform: `rotate(${knobRotation}deg)`,
                }}
              >
                <div style={styles.knobIndicator} />
              </div>
              <span style={styles.knobValue}>{params.grindSize}</span>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              粉水比 <span style={styles.value}>1:{params.waterRatio}</span>
            </label>
            <input
              type="range"
              min="10"
              max="20"
              step="0.5"
              value={params.waterRatio}
              onChange={(e) =>
                onChange({ ...params, waterRatio: Number(e.target.value) })
              }
              style={styles.slider}
            />
            <div style={styles.sliderLabels}>
              <span>1:10</span>
              <span>1:20</span>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              注水时间 <span style={styles.value}>{params.pourTime} 秒</span>
            </label>
            <input
              type="number"
              min="30"
              max="300"
              value={params.pourTime}
              onChange={(e) =>
                onChange({ ...params, pourTime: Number(e.target.value) })
              }
              style={styles.numberInput}
            />
          </div>
        </div>

        <div style={styles.rightColumn}>
          <label style={styles.label}>滴滤流速模拟 (V60)</label>
          <canvas
            ref={canvasRef}
            width={280}
            height={200}
            style={styles.canvas}
          />
          <div style={styles.canvasHint}>
            <p style={styles.hintText}>
              研磨越粗 / 水温越高 → 流速越快
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 24,
    color: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    margin: '0 0 20px 0',
    color: '#eee',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 24,
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#aaa',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  value: {
    color: '#e94560',
    fontWeight: 600,
    fontSize: 16,
  },
  slider: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    background: '#0f3460',
    outline: 'none',
    appearance: 'none',
    cursor: 'pointer',
  },
  sliderLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
    color: '#666',
  },
  knobContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  knob: {
    width: 60,
    height: 60,
    borderRadius: '50%',
    background: 'linear-gradient(145deg, #1a2a4a, #0f1a30)',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.4)',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'box-shadow 0.2s ease',
  },
  knobIndicator: {
    position: 'absolute',
    top: 6,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 4,
    height: 14,
    borderRadius: 2,
    background: '#e94560',
  },
  knobValue: {
    fontSize: 14,
    color: '#e94560',
    fontWeight: 600,
  },
  numberInput: {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: '#0f3460',
    border: '1px solid #1a4080',
    borderRadius: 8,
    color: '#eee',
    fontSize: 16,
    outline: 'none',
    boxSizing: 'border-box',
  },
  canvas: {
    backgroundColor: '#0f1729',
    borderRadius: 8,
    width: '100%',
    maxWidth: 280,
  },
  canvasHint: {
    padding: '8px 12px',
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
    borderRadius: 6,
  },
  hintText: {
    fontSize: 12,
    color: '#e94560',
    margin: 0,
  },
};
