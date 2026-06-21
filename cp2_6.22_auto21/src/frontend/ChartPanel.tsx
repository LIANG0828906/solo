import { useEffect, useRef, useState } from 'react';
import { LineChart, BarChart3 } from 'lucide-react';
import { AdVersion, MetricsHistoryPoint } from './types';

interface ChartPanelProps {
  history: MetricsHistoryPoint[];
  versions: AdVersion[];
}

const COLORS = [
  '#00e5ff',
  '#00d4aa',
  '#8b5cf6',
  '#fb923c',
  '#ec4899',
];

const ChartPanel = ({ history, versions }: ChartPanelProps) => {
  const lineCanvasRef = useRef<HTMLCanvasElement>(null);
  const barCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 280 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        setDimensions({ width: Math.max(300, w), height: 280 });
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
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;
    ctx.scale(dpr, dpr);

    const w = dimensions.width;
    const h = dimensions.height;
    const padding = { top: 30, right: 20, bottom: 40, left: 50 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
    }

    if (history.length < 2 || versions.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('等待更多数据...', w / 2, h / 2);
      return;
    }

    let maxCtr = 0;
    versions.forEach((v) => {
      history.forEach((p) => {
        const m = p.metrics[v.id];
        if (m && m.ctr > maxCtr) maxCtr = m.ctr;
      });
    });
    maxCtr = Math.max(maxCtr * 1.2, 1);

    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      const val = maxCtr - (maxCtr / 4) * i;
      ctx.fillText(`${val.toFixed(1)}%`, padding.left - 8, y + 4);
    }

    versions.forEach((version, vIdx) => {
      const color = COLORS[vIdx % COLORS.length];
      const points: { x: number; y: number }[] = [];

      history.forEach((p, i) => {
        const m = p.metrics[version.id];
        if (m) {
          const x = padding.left + (chartW / (history.length - 1)) * i;
          const y = padding.top + chartH - (m.ctr / maxCtr) * chartH;
          points.push({ x, y });
        }
      });

      if (points.length > 1) {
        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
        gradient.addColorStop(0, color + '30');
        gradient.addColorStop(1, color + '00');

        ctx.beginPath();
        ctx.moveTo(points[0].x, padding.top + chartH);
        points.forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        points.forEach((p, i) => {
          if (i % Math.max(1, Math.floor(points.length / 10)) === 0 || i === points.length - 1) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#0a1628';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
          }
        });
      }
    });

    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    if (history.length > 0) {
      const start = new Date(history[0].timestamp);
      const end = new Date(history[history.length - 1].timestamp);
      ctx.fillText(start.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), padding.left, h - 15);
      ctx.fillText(end.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), w - padding.right, h - 15);
    }
  };

  const drawBarChart = () => {
    const canvas = barCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;
    ctx.scale(dpr, dpr);

    const w = dimensions.width;
    const h = dimensions.height;
    const padding = { top: 30, right: 20, bottom: 60, left: 50 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
    }

    if (versions.length === 0 || history.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('等待更多数据...', w / 2, h / 2);
      return;
    }

    const latest = history[history.length - 1];
    let maxCvr = 0;
    versions.forEach((v) => {
      const m = latest.metrics[v.id];
      if (m && m.cvr > maxCvr) maxCvr = m.cvr;
    });
    maxCvr = Math.max(maxCvr * 1.3, 1);

    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      const val = maxCvr - (maxCvr / 4) * i;
      ctx.fillText(`${val.toFixed(1)}%`, padding.left - 8, y + 4);
    }

    const barWidth = Math.min(60, (chartW / versions.length) * 0.6);
    const gap = (chartW - barWidth * versions.length) / (versions.length + 1);

    versions.forEach((version, i) => {
      const color = COLORS[i % COLORS.length];
      const m = latest.metrics[version.id];
      const cvr = m ? m.cvr : 0;
      const barHeight = (cvr / maxCvr) * chartH;
      const x = padding.left + gap + (barWidth + gap) * i;
      const y = padding.top + chartH - barHeight;

      const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, color + '40');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      const radius = 6;
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + barWidth - radius, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
      ctx.lineTo(x + barWidth, y + barHeight);
      ctx.lineTo(x, y + barHeight);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();

      ctx.shadowColor = color + '60';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${cvr.toFixed(2)}%`, x + barWidth / 2, y - 10);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      const label = `版本${String.fromCharCode(65 + i)}`;
      ctx.fillText(label, x + barWidth / 2, padding.top + chartH + 20);

      ctx.fillStyle = '#64748b';
      ctx.font = '10px sans-serif';
      const shortTitle = version.title.length > 8 ? version.title.slice(0, 8) + '...' : version.title;
      ctx.fillText(shortTitle, x + barWidth / 2, padding.top + chartH + 36);
    });
  };

  useEffect(() => {
    const t = setTimeout(() => {
      drawLineChart();
      drawBarChart();
    }, 50);
    return () => clearTimeout(t);
  }, [history, versions, dimensions]);

  return (
    <div ref={containerRef} style={styles.container}>
      <div style={styles.row}>
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <div style={styles.chartTitle}>
              <LineChart size={18} style={{ color: '#00e5ff' }} />
              <span>CTR 点击率趋势</span>
            </div>
            <div style={styles.legend}>
              {versions.map((v, i) => (
                <div key={v.id} style={styles.legendItem}>
                  <span style={{
                    ...styles.legendDot,
                    background: COLORS[i % COLORS.length],
                  }} />
                  <span>版本{String.fromCharCode(65 + i)}</span>
                </div>
              ))}
            </div>
          </div>
          <canvas ref={lineCanvasRef} style={styles.canvas} />
        </div>

        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <div style={styles.chartTitle}>
              <BarChart3 size={18} style={{ color: '#00d4aa' }} />
              <span>CVR 转化率对比</span>
            </div>
          </div>
          <canvas ref={barCanvasRef} style={styles.canvas} />
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
    gap: '20px',
  },
  chartCard: {
    background: 'rgba(15, 31, 56, 0.4)',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid rgba(0, 229, 255, 0.08)',
    backdropFilter: 'blur(20px)',
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  chartTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '15px',
    fontWeight: 600,
    color: '#fff',
  },
  legend: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#94a3b8',
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  canvas: {
    display: 'block',
    width: '100%',
  },
};

export default ChartPanel;
