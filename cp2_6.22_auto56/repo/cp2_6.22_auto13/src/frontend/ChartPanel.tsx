import React, { useRef, useEffect, useState } from 'react';

interface AdVersion {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  trafficPercentage: number;
  createdAt: number;
  history: any[];
}

interface Metrics {
  impressions: number;
  clicks: number;
  conversions: number;
}

interface ExperimentState {
  id: string;
  name: string;
  status: 'draft' | 'running' | 'completed';
  versions: AdVersion[];
  metrics: Record<string, Metrics>;
  historyData: Record<string, { timestamp: number; metrics: Metrics }[]>;
  startTime: number | null;
  durationHours: number;
}

interface ChartPanelProps {
  experiment: ExperimentState;
}

const COLORS = ['#22d3ee', '#34d399', '#fbbf24', '#a78bfa', '#fb7185', '#60a5fa'];

const ChartPanel: React.FC<ChartPanelProps> = ({ experiment }) => {
  const lineCanvasRef = useRef<HTMLCanvasElement>(null);
  const barCanvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 280 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const w = Math.min(containerRef.current.clientWidth - 32, 900);
        setDimensions({ width: Math.max(320, w), height: 280 });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const drawLineChart = () => {
    const canvas = lineCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    canvas.style.width = dimensions.width + 'px';
    canvas.style.height = dimensions.height + 'px';
    ctx.scale(dpr, dpr);

    const W = dimensions.width;
    const H = dimensions.height;
    const padding = { top: 30, right: 20, bottom: 40, left: 55 };
    const chartW = W - padding.left - padding.right;
    const chartH = H - padding.top - padding.bottom;

    ctx.clearRect(0, 0, W, H);

    const bgGradient = ctx.createLinearGradient(0, 0, 0, H);
    bgGradient.addColorStop(0, 'rgba(34, 211, 238, 0.03)');
    bgGradient.addColorStop(1, 'rgba(34, 211, 238, 0)');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, W, H);

    const allPoints: { x: number; y: number; versionId: string }[][] = [];
    let maxCTR = 0;
    let maxPoints = 0;

    experiment.versions.forEach((v, idx) => {
      const history = experiment.historyData[v.id] || [];
      if (history.length > maxPoints) maxPoints = history.length;
      const points: { x: number; y: number; versionId: string }[] = [];
      history.forEach((h, i) => {
        const ctr = h.metrics.impressions > 0 ? (h.metrics.clicks / h.metrics.impressions * 100) : 0;
        if (ctr > maxCTR) maxCTR = ctr;
        points.push({ x: i, y: ctr, versionId: v.id });
      });
      allPoints.push(points);
    });

    if (maxCTR === 0) maxCTR = 10;
    maxCTR = Math.ceil(maxCTR * 1.2);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartH / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(W - padding.right, y);
      ctx.stroke();

      const val = maxCTR - (maxCTR / 5) * i;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px ui-monospace, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(1) + '%', padding.left - 8, y + 3);
    }

    if (maxPoints > 0) {
      const labelStep = Math.ceil(maxPoints / 6);
      for (let i = 0; i < maxPoints; i += labelStep) {
        const x = padding.left + (chartW / Math.max(maxPoints - 1, 1)) * i;
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`T${i + 1}`, x, H - padding.bottom + 20);
      }
    }

    allPoints.forEach((points, idx) => {
      if (points.length < 2) return;
      const color = COLORS[idx % COLORS.length];

      const gradient = ctx.createLinearGradient(0, padding.top, 0, H - padding.bottom);
      gradient.addColorStop(0, color + '44');
      gradient.addColorStop(1, color + '00');

      ctx.beginPath();
      ctx.moveTo(
        padding.left + (chartW / Math.max(maxPoints - 1, 1)) * points[0].x,
        H - padding.bottom
      );
      points.forEach(p => {
        const px = padding.left + (chartW / Math.max(maxPoints - 1, 1)) * p.x;
        const py = padding.top + chartH - (p.y / maxCTR) * chartH;
        ctx.lineTo(px, py);
      });
      ctx.lineTo(
        padding.left + (chartW / Math.max(maxPoints - 1, 1)) * points[points.length - 1].x,
        H - padding.bottom
      );
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      points.forEach((p, i) => {
        const px = padding.left + (chartW / Math.max(maxPoints - 1, 1)) * p.x;
        const py = padding.top + chartH - (p.y / maxCTR) * chartH;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      points.forEach(p => {
        const px = padding.left + (chartW / Math.max(maxPoints - 1, 1)) * p.x;
        const py = padding.top + chartH - (p.y / maxCTR) * chartH;
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#0f2847';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    });

    ctx.fillStyle = '#7dd3fc';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('CTR 趋势 (%)', padding.left, 18);
  };

  const drawBarChart = () => {
    const canvas = barCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    canvas.style.width = dimensions.width + 'px';
    canvas.style.height = dimensions.height + 'px';
    ctx.scale(dpr, dpr);

    const W = dimensions.width;
    const H = dimensions.height;
    const padding = { top: 30, right: 20, bottom: 60, left: 55 };
    const chartW = W - padding.left - padding.right;
    const chartH = H - padding.top - padding.bottom;

    ctx.clearRect(0, 0, W, H);

    const bgGradient = ctx.createLinearGradient(0, 0, 0, H);
    bgGradient.addColorStop(0, 'rgba(52, 211, 153, 0.03)');
    bgGradient.addColorStop(1, 'rgba(52, 211, 153, 0)');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, W, H);

    let maxCVR = 0;
    const cvrData: { versionId: string; cvr: number; title: string }[] = [];

    experiment.versions.forEach(v => {
      const m = experiment.metrics[v.id];
      const cvr = m && m.clicks > 0 ? (m.conversions / m.clicks * 100) : 0;
      if (cvr > maxCVR) maxCVR = cvr;
      cvrData.push({ versionId: v.id, cvr, title: v.title });
    });

    if (maxCVR === 0) maxCVR = 10;
    maxCVR = Math.ceil(maxCVR * 1.2);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartH / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(W - padding.right, y);
      ctx.stroke();

      const val = maxCVR - (maxCVR / 5) * i;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px ui-monospace, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(1) + '%', padding.left - 8, y + 3);
    }

    const barGap = 16;
    const barWidth = cvrData.length > 0
      ? Math.min(80, (chartW - barGap * (cvrData.length - 1)) / cvrData.length)
      : 60;
    const totalBarsWidth = barWidth * cvrData.length + barGap * (cvrData.length - 1);
    const startX = padding.left + (chartW - totalBarsWidth) / 2;

    cvrData.forEach((d, idx) => {
      const color = COLORS[idx % COLORS.length];
      const x = startX + idx * (barWidth + barGap);
      const barHeight = (d.cvr / maxCVR) * chartH;
      const y = padding.top + chartH - barHeight;

      const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
      gradient.addColorStop(0, color + 'dd');
      gradient.addColorStop(1, color + '66');

      const radius = 6;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + barWidth - radius, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
      ctx.lineTo(x + barWidth, y + barHeight);
      ctx.lineTo(x, y + barHeight);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 12px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(d.cvr.toFixed(2) + '%', x + barWidth / 2, y - 8);

      const title = d.title.length > 8 ? d.title.slice(0, 8) + '...' : d.title;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, x + barWidth / 2, H - padding.bottom + 18);

      ctx.fillStyle = color;
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`V${idx + 1}`, x + barWidth / 2, H - padding.bottom + 34);
    });

    ctx.fillStyle = '#6ee7b7';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('转化率对比 (CVR %)', padding.left, 18);
  };

  useEffect(() => {
    drawLineChart();
    drawBarChart();
  }, [experiment, dimensions]);

  return (
    <div ref={containerRef} style={styles.container}>
      <div style={styles.chartsGrid}>
        <div style={styles.chartCard}>
          <canvas ref={lineCanvasRef} />
          {experiment.versions.length > 0 && (
            <div style={styles.legend}>
              {experiment.versions.map((v, idx) => (
                <div key={v.id} style={styles.legendItem}>
                  <span style={{ ...styles.legendDot, background: COLORS[idx % COLORS.length] }} />
                  <span style={styles.legendText}>
                    {v.title.length > 12 ? v.title.slice(0, 12) + '...' : v.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.chartCard}>
          <canvas ref={barCanvasRef} />
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%'
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '1.25rem'
  },
  chartCard: {
    background: 'rgba(15, 40, 71, 0.6)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(34, 211, 238, 0.15)',
    borderRadius: '16px',
    padding: '1rem',
    animation: 'fadeIn 0.4s ease'
  },
  legend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
    marginTop: '0.5rem',
    paddingTop: '0.75rem',
    borderTop: '1px solid rgba(148, 163, 184, 0.1)',
    justifyContent: 'center'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem'
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    boxShadow: '0 0 8px currentColor'
  },
  legendText: {
    fontSize: '0.8rem',
    color: '#94a3b8'
  }
};

export default ChartPanel;
