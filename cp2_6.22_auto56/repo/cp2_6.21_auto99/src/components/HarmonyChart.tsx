import React, { useRef, useEffect, useState } from 'react';
import { useStore, ColorPosition } from '../store';

const HarmonyChart: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const harmonyResult = useStore((s) => s.harmonyResult);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const canvasSize = isMobile ? 140 : 180;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvasSize;
    const cx = size / 2;
    const cy = size / 2;
    const outerR = size * 0.44;
    const innerR = size * 0.3;
    const dotR = size * 0.033;
    const markR = size * 0.38;
    const fontSize = Math.max(6, Math.floor(size * 0.044));

    ctx.clearRect(0, 0, size, size);

    for (let i = 0; i < 12; i++) {
      const hue = i * 30;
      const startAngle = (-hue) * (Math.PI / 180);
      const endAngle = (-(hue + 30)) * (Math.PI / 180);

      ctx.beginPath();
      ctx.arc(cx, cy, outerR, startAngle, endAngle);
      ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = `hsl(${hue}, 80%, 50%)`;
      ctx.fill();
    }

    const colorPositions: ColorPosition[] = harmonyResult?.colorPositions || [];

    colorPositions.forEach((pos) => {
      const angle = pos.angle;
      const rad = (angle * Math.PI) / 180;
      const x = cx + markR * Math.cos(rad);
      const y = cy - markR * Math.sin(rad);

      ctx.beginPath();
      ctx.arc(x, y, dotR, 0, Math.PI * 2);
      ctx.fillStyle = pos.hex;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.fillStyle = '#f0f0f0';
      ctx.font = `${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 3;
      ctx.fillText(pos.name, x, y - dotR - 2);
      ctx.restore();
    });
  }, [harmonyResult, canvasSize]);

  if (!harmonyResult) {
    return (
      <div className="card">
        <h3>色相环分析</h3>
        <p style={{ color: '#888', textAlign: 'center', padding: '40px 0' }}>上传图片后将显示色相环分析</p>
      </div>
    );
  }

  const score = harmonyResult.score;
  const t = Math.max(0, Math.min(1, score / 100));
  const scoreR = Math.round(244 + (76 - 244) * t);
  const scoreG = Math.round(67 + (175 - 67) * t);
  const scoreB = Math.round(54 + (80 - 54) * t);
  const scoreColor = `rgb(${scoreR},${scoreG},${scoreB})`;

  return (
    <div className="card">
      <h3>色相环分析</h3>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          className="harmony-canvas"
        />
        <div className="score-display">
          <div className="score-value" style={{ color: scoreColor }}>
            {score}
          </div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>和谐度评分</div>
          <div className="harmony-type">{harmonyResult.harmonyType}关系</div>
          <div className="harmony-desc">{harmonyResult.description}</div>
        </div>
      </div>
    </div>
  );
};

export default HarmonyChart;
