import { useEffect, useRef, useState, useMemo } from 'react';
import type { Movie } from '../api';
import { getMonthColor } from '../api';

interface YearReportProps {
  movies: Movie[];
  onClose: () => void;
}

const MONTH_NAMES = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月',
];

const SUMMARY_TEMPLATES = [
  (total: number, avg: number, fav: string) =>
    `今年你一共看了${total}部电影，平均分${avg.toFixed(1)}，${fav ? `最爱${fav}的作品` : '观影口味广泛'}！`,
  (total: number, avg: number) =>
    total > 20
      ? `年度观影${total}部！平均${avg.toFixed(1)}分，你是真正的电影发烧友🎬`
      : `共看了${total}部佳作，平均${avg.toFixed(1)}分，继续保持这份热爱！`,
  (total: number, avg: number, fav: string) =>
    avg >= 4
      ? `平均${avg.toFixed(1)}分！${total}部电影挑得都不错，${fav ? `${fav}的片子深得你心。` : '品味在线！'}`
      : `${total}部片子平均分${avg.toFixed(1)}，好片烂片都得看，人生百态嘛~`,
];

function YearReport({ movies, onClose }: YearReportProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const currentYear = new Date().getFullYear();

  const stats = useMemo(() => {
    const yearMovies = movies.filter(
      m => new Date(m.watchDate).getFullYear() === currentYear
    );

    const total = yearMovies.length;
    const avgRating =
      total > 0
        ? yearMovies.reduce((s, m) => s + m.rating, 0) / total
        : 0;

    const monthCounts = new Array(12).fill(0);
    const directorCounts = new Map<string, number>();

    for (const m of yearMovies) {
      const month = new Date(m.watchDate).getMonth();
      monthCounts[month]++;
      const d = m.director.trim();
      if (d) {
        directorCounts.set(d, (directorCounts.get(d) || 0) + 1);
      }
    }

    let favDirector = '';
    let maxCount = 0;
    for (const [dir, cnt] of directorCounts) {
      if (cnt > maxCount) {
        maxCount = cnt;
        favDirector = dir;
      }
    }

    const summaryTemplate =
      SUMMARY_TEMPLATES[Math.floor(Math.random() * SUMMARY_TEMPLATES.length)];
    const summary = summaryTemplate(total, avgRating, favDirector);

    return { yearMovies, total, avgRating, monthCounts, favDirector, summary };
  }, [movies, currentYear]);

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 800;
    const H = 1100;
    canvas.width = W;
    canvas.height = H;

    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#1a1a2e');
    bgGrad.addColorStop(1, '#0f0f1e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(102, 126, 234, 0.06)';
    for (let i = 0; i < 20; i++) {
      const r = 80 + i * 30;
      ctx.beginPath();
      ctx.arc(W / 2, -100, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 52px -apple-system, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${currentYear} 年度观影报告`, W / 2, 100);

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '18px -apple-system, "PingFang SC", sans-serif';
    ctx.fillText('PERSONAL MOVIE WATCH REPORT', W / 2, 135);

    const cardY = 180;
    const cardH = 220;
    const cardGradient = ctx.createLinearGradient(0, cardY, 0, cardY + cardH);
    cardGradient.addColorStop(0, 'rgba(102, 126, 234, 0.15)');
    cardGradient.addColorStop(1, 'rgba(102, 126, 234, 0.05)');
    ctx.fillStyle = cardGradient;
    roundRect(ctx, 60, cardY, W - 120, cardH, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(102, 126, 234, 0.3)';
    ctx.lineWidth = 1;
    roundRect(ctx, 60, cardY, W - 120, cardH, 20);
    ctx.stroke();

    const stat1X = W / 2 - 180;
    const stat2X = W / 2;
    const stat3X = W / 2 + 180;
    const statY = cardY + 80;

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 64px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(stats.total), stat1X, statY);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '16px -apple-system, "PingFang SC", sans-serif';
    ctx.fillText('观影总数', stat1X, statY + 40);

    ctx.fillStyle = '#20c997';
    ctx.font = 'bold 64px -apple-system, sans-serif';
    ctx.fillText(stats.avgRating.toFixed(1), stat2X, statY);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '16px -apple-system, "PingFang SC", sans-serif';
    ctx.fillText('平均评分', stat2X, statY + 40);

    ctx.fillStyle = '#f783ac';
    ctx.font = 'bold 32px -apple-system, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    const favDisplay = stats.favDirector || '—';
    ctx.fillText(favDisplay.length > 6 ? favDisplay.substring(0, 6) : favDisplay, stat3X, statY - 8);
    ctx.font = '20px -apple-system, "PingFang SC", sans-serif';
    if (stats.favDirector && stats.favDirector.length > 6) {
      ctx.fillText(stats.favDirector.substring(6), stat3X, statY + 20);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '16px -apple-system, "PingFang SC", sans-serif';
    ctx.fillText('最爱导演', stat3X, statY + 52);

    const summaryY = cardY + cardH + 60;
    const summaryGrad = ctx.createLinearGradient(0, summaryY - 30, 0, summaryY + 60);
    summaryGrad.addColorStop(0, '#667eea');
    summaryGrad.addColorStop(1, '#764ba2');
    ctx.fillStyle = summaryGrad;
    roundRect(ctx, 60, summaryY - 30, W - 120, 80, 16);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px -apple-system, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    wrapText(ctx, stats.summary, W / 2, summaryY + 20, W - 160, 28);

    const chartY = summaryY + 90;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px -apple-system, "PingFang SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('📅 月度观影分布', 60, chartY);

    const chartTop = chartY + 40;
    const chartBottom = chartTop + 280;
    const chartLeft = 80;
    const chartRight = W - 80;
    const chartWidth = chartRight - chartLeft;
    const chartHeight = chartBottom - chartTop;

    const maxCount = Math.max(1, ...stats.monthCounts);
    const barWidth = (chartWidth / 12) * 0.6;
    const barGap = (chartWidth / 12) * 0.4;

    for (let i = 0; i < 5; i++) {
      const y = chartTop + (chartHeight / 4) * i;
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(chartLeft, y);
      ctx.lineTo(chartRight, y);
      ctx.stroke();

      const label = Math.round(maxCount - (maxCount / 4) * i);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(String(label), chartLeft - 10, y + 4);
    }

    for (let i = 0; i < 12; i++) {
      const count = stats.monthCounts[i];
      const barHeight = (count / maxCount) * chartHeight;
      const x = chartLeft + (barWidth + barGap) * i + barGap / 2;
      const y = chartBottom - barHeight;

      const monthColor = getMonthColor(i);
      const barGrad = ctx.createLinearGradient(0, y, 0, chartBottom);
      barGrad.addColorStop(0, monthColor);
      barGrad.addColorStop(1, '#e9ecef');
      ctx.fillStyle = barGrad;
      roundRect(ctx, x, y, barWidth, barHeight, 6);
      ctx.fill();

      if (count > 0) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(count), x + barWidth / 2, y - 8);
      }

      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '13px -apple-system, "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(MONTH_NAMES[i], x + barWidth / 2, chartBottom + 24);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '14px -apple-system, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`—— 数据截止 ${new Date().toLocaleDateString('zh-CN')} ——`, W / 2, H - 60);

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '13px -apple-system, "PingFang SC", sans-serif';
    ctx.fillText('个人影藏书架 · Personal Movie Shelf', W / 2, H - 35);

  }, [stats, currentYear]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 350);
  };

  const handleSaveImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${currentYear}-年度观影报告.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div
      style={{
        ...styles.overlay,
        opacity: isClosing ? 0 : isVisible ? 1 : 0,
        transition: 'opacity 0.35s ease-out',
      }}
      onClick={handleClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          ...styles.wrapper,
          transform: isClosing
            ? 'translateY(30px) scale(0.95)'
            : isVisible
            ? 'translateY(0) scale(1)'
            : 'translateY(30px) scale(0.95)',
          opacity: isClosing ? 0 : isVisible ? 1 : 0,
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
      >
        <div style={styles.header}>
          <h2 style={styles.title}>📊 {currentYear} 年度观影报告</h2>
          <div style={styles.headerBtns}>
            <button style={styles.saveBtn} onClick={handleSaveImage}>
              💾 保存图片
            </button>
            <button style={styles.closeBtn} onClick={handleClose}>
              ✕
            </button>
          </div>
        </div>

        <div style={styles.canvasWrapper}>
          <canvas
            ref={canvasRef}
            style={styles.canvas}
          />
        </div>

        <div style={styles.hint}>
          💡 提示：右键点击海报图片可另存为PNG
        </div>
      </div>
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const chars = text.split('');
  let line = '';
  let lines: string[] = [];

  for (let i = 0; i < chars.length; i++) {
    const test = line + chars[i];
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      lines.push(line);
      line = chars[i];
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);

  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((ln, i) => {
    ctx.fillText(ln, x, startY + i * lineHeight);
  });
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '95vh',
    maxWidth: '900px',
    width: '100%',
    backgroundColor: 'rgba(45, 45, 68, 0.95)',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(26, 26, 46, 0.5)',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 700,
    color: '#fff',
  },
  headerBtns: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  saveBtn: {
    padding: '8px 16px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#667eea',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
  closeBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  canvasWrapper: {
    flex: 1,
    overflow: 'auto',
    padding: '24px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  canvas: {
    width: '100%',
    maxWidth: '800px',
    height: 'auto',
    borderRadius: '12px',
    boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
  },
  hint: {
    padding: '12px 24px',
    textAlign: 'center',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.5)',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(26, 26, 46, 0.4)',
  },
};

export default YearReport;
