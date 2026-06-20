import { useEffect, useRef } from 'react';
import { useAppStore } from '../store';

interface RadarDim {
  key: keyof ReturnType<typeof useAppStore.getState>['stats']['scores'];
  label: string;
  color: string;
}

const DIMENSIONS: RadarDim[] = [
  { key: 'focus', label: '专注力', color: '#3b82f6' },
  { key: 'duration', label: '持续时间', color: '#10b981' },
  { key: 'attendance', label: '出勤率', color: '#8b5cf6' },
  { key: 'punctuality', label: '准时性', color: '#f59e0b' },
  { key: 'completion', label: '完成度', color: '#ec4899' }
];

const RadarChart = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const { stats } = useAppStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 320;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const radius = 110;
    const sides = 5;
    const angleStep = (Math.PI * 2) / sides;
    const startAngle = -Math.PI / 2;

    const scores = DIMENSIONS.map(d => stats.scores[d.key] / 100);
    let progress = 0;
    const animDuration = 500;
    const startTime = performance.now();

    const getPoint = (angle: number, r: number) => ({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r
    });

    const draw = (now: number) => {
      const elapsed = now - startTime;
      progress = Math.min(1, elapsed / animDuration);
      const eased = 1 - Math.pow(1 - progress, 3);

      ctx.clearRect(0, 0, size, size);

      for (let layer = 5; layer >= 1; layer--) {
        const layerR = (radius / 5) * layer;
        ctx.beginPath();
        for (let i = 0; i <= sides; i++) {
          const a = startAngle + i * angleStep;
          const pt = getPoint(a, layerR);
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      for (let i = 0; i < sides; i++) {
        const a = startAngle + i * angleStep;
        const pt = getPoint(a, radius);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(pt.x, pt.y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.stroke();
      }

      const scoreProgress = eased;

      ctx.beginPath();
      for (let i = 0; i <= sides; i++) {
        const idx = i % sides;
        const a = startAngle + idx * angleStep;
        const r = radius * scores[idx] * scoreProgress;
        const pt = getPoint(a, r);
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
      gradient.addColorStop(1, 'rgba(236, 72, 153, 0.15)');
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.strokeStyle = 'rgba(139, 92, 246, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();

      for (let i = 0; i < sides; i++) {
        const a = startAngle + i * angleStep;
        const r = radius * scores[i] * scoreProgress;
        const pt = getPoint(a, r);

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#a78bfa';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      if (scoreProgress >= 0.9) {
        for (let i = 0; i < sides; i++) {
          const a = startAngle + i * angleStep;
          const labelR = radius + 24;
          const pt = getPoint(a, labelR);
          const label = DIMENSIONS[i].label;
          const score = stats.scores[DIMENSIONS[i].key];
          ctx.font = '600 12px -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#a0aec0';
          ctx.fillText(label, pt.x, pt.y - 8);
          ctx.fillStyle = DIMENSIONS[i].color;
          ctx.font = '700 14px -apple-system, sans-serif';
          ctx.fillText(`${score}`, pt.x, pt.y + 10);
        }
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(draw);
      }
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [stats.scores.focus, stats.scores.duration, stats.scores.attendance,
      stats.scores.punctuality, stats.scores.completion]);

  return (
    <canvas
      ref={canvasRef}
      className="radar-canvas"
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
};

const StatsPage = () => {
  const { stats } = useAppStore();
  const { today, weeklyDaysStudied, totalFocusHours, scores } = stats;

  const overall = Math.round(
    (scores.focus + scores.duration + scores.attendance + scores.punctuality + scores.completion) / 5
  );

  return (
    <div className="stats-container">
      <div>
        <h2 className="page-title">学习统计</h2>
        <p className="page-subtitle">查看你的学习数据和专注表现</p>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon focus">⏱</div>
          <div className="stat-label">今日专注</div>
          <div className="stat-value">
            {today.totalFocusMinutes}
            <span className="unit">分钟</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon days">📅</div>
          <div className="stat-label">本周学习</div>
          <div className="stat-value">
            {weeklyDaysStudied}
            <span className="unit">天</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon total">🎯</div>
          <div className="stat-label">累计时长</div>
          <div className="stat-value">
            {totalFocusHours.toFixed(1)}
            <span className="unit">小时</span>
          </div>
        </div>
      </div>

      <div className="radar-section">
        <h3 className="radar-title">五维能力雷达图</h3>
        <p className="radar-subtitle">根据你近期的学习表现综合评估</p>

        <div className="radar-wrapper">
          <RadarChart />

          <div className="radar-legend">
            {DIMENSIONS.map(d => (
              <div key={d.key} className="radar-legend-item">
                <div
                  className="radar-legend-color"
                  style={{ background: d.color }}
                />
                <span className="radar-legend-label">{d.label}</span>
                <span className="radar-legend-score">{scores[d.key]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="overall-score">
          <div className="overall-score-label">综合得分</div>
          <div className="overall-score-value">{overall}</div>
        </div>
      </div>
    </div>
  );
};

export default StatsPage;
