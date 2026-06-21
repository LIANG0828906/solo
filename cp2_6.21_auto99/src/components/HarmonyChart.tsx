import React, { useRef, useEffect } from 'react';
import { useStore, ColorPosition } from '../store';

const HarmonyChart: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const harmonyResult = useStore((s) => s.harmonyResult);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 180, 180);

    const cx = 90;
    const cy = 90;
    const outerR = 80;
    const innerR = 55;

    for (let i = 0; i < 12; i++) {
      const startAngle = (i * 30) * (Math.PI / 180);
      const endAngle = ((i + 1) * 30) * (Math.PI / 180);

      ctx.beginPath();
      ctx.arc(cx, cy, outerR, startAngle, endAngle);
      ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = `hsl(${i * 30}, 80%, 50%)`;
      ctx.fill();
    }

    const colorPositions: ColorPosition[] = harmonyResult?.colorPositions || [];

    colorPositions.forEach((pos) => {
      const angle = pos.angle;
      const rad = (angle * Math.PI) / 180;
      const x = cx + 68 * Math.cos(rad);
      const y = cy + 68 * Math.sin(rad);

      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = pos.hex;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.fillStyle = '#f0f0f0';
      ctx.font = '8px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 3;
      ctx.fillText(pos.name, x, y - 10);
      ctx.restore();
    });
  }, [harmonyResult]);

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
          width={180}
          height={180}
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
