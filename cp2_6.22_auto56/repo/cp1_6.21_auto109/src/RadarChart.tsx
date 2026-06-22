import React, { useEffect, useRef } from 'react';

interface RadarChartProps {
  data: Record<string, number>;
  width?: number;
  height?: number;
  radius?: number;
}

const RadarChart: React.FC<RadarChartProps> = ({
  data,
  width = 360,
  height = 360,
  radius = 120,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const labels = Object.keys(data);
    const values = Object.values(data);
    const n = labels.length;

    if (n === 0) {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '14px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('暂无错题数据', width / 2, height / 2);
      return;
    }

    const cx = width / 2;
    const cy = height / 2;
    const maxVal = Math.max(1, ...values);
    const levels = 4;

    let progress = 0;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      progress = Math.min(progress + 0.06, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      for (let level = levels; level >= 1; level--) {
        const r = (radius * level) / levels * ease;
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = level % 2 === 0 ? '#F9FAFB' : '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 1;
      for (let i = 0; i < n; i++) {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const x = cx + radius * ease * Math.cos(angle);
        const y = cy + radius * ease * Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x, y);
        ctx.stroke();
      }

      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const val = (values[i] / maxVal) * radius * ease;
        const x = cx + val * Math.cos(angle);
        const y = cy + val * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      const gradFill = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
      gradFill.addColorStop(0, 'rgba(236, 72, 153, 0.2)');
      gradFill.addColorStop(1, 'rgba(139, 92, 246, 0.2)');
      ctx.fillStyle = gradFill;
      ctx.fill();

      const gradStroke = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
      gradStroke.addColorStop(0, '#EC4899');
      gradStroke.addColorStop(1, '#8B5CF6');
      ctx.strokeStyle = gradStroke;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      for (let i = 0; i < n; i++) {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const val = (values[i] / maxVal) * radius * ease;
        const x = cx + val * Math.cos(angle);
        const y = cy + val * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#8B5CF6';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.fillStyle = '#6B7280';
      ctx.font = '14px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < n; i++) {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const labelR = radius + 28;
        const x = cx + labelR * Math.cos(angle);
        const y = cy + labelR * Math.sin(angle);
        const label = labels[i].length > 6 ? labels[i].slice(0, 6) + '…' : labels[i];
        ctx.fillText(label, x, y);
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [data, width, height, radius]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: '#F9FAFB',
        borderRadius: 12,
        padding: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
        薄弱知识点雷达图
      </div>
      <canvas ref={canvasRef} />
      <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
        * 数值表示该知识点错题次数
      </div>
    </div>
  );
};

export default RadarChart;
