import { useRef, useEffect } from 'react';
import { useStore } from '../store';
import styles from '../styles/DetailPanel.module.css';

const SENTIMENT_LABELS: Record<string, string> = {
  positive: '积极',
  neutral: '中立',
  negative: '消极',
};

function drawSentimentChart(canvas: HTMLCanvasElement, weekData: number[]) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const padX = 32;
  const padY = 24;
  const chartW = w - padX * 2;
  const chartH = h - padY * 2;

  ctx.clearRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let v = -10; v <= 10; v += 5) {
    const y = padY + chartH - ((v + 10) / 20) * chartH;
    ctx.beginPath();
    ctx.moveTo(padX, y);
    ctx.lineTo(w - padX, y);
    ctx.stroke();
  }

  ctx.font = '10px "Noto Sans SC"';
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.textAlign = 'right';
  for (let v = -10; v <= 10; v += 10) {
    const y = padY + chartH - ((v + 10) / 20) * chartH;
    ctx.fillText(String(v), padX - 6, y + 3);
  }

  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  ctx.textAlign = 'center';
  days.forEach((d, i) => {
    const x = padX + (i / 6) * chartW;
    ctx.fillText(d, x, h - 6);
  });

  if (weekData.length < 2) return;

  const points = weekData.map((v, i) => ({
    x: padX + (i / (weekData.length - 1)) * chartW,
    y: padY + chartH - ((Math.max(-10, Math.min(10, v)) + 10) / 20) * chartH,
    val: v,
  }));

  const grad = ctx.createLinearGradient(padX, 0, padX, padY + chartH);
  grad.addColorStop(0, 'rgba(105, 240, 174, 0.15)');
  grad.addColorStop(1, 'rgba(255, 82, 82, 0.08)');

  ctx.beginPath();
  ctx.moveTo(points[0].x, padY + chartH);
  points.forEach((p) => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, padY + chartH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  points.forEach((p, i) => {
    const ratio = (p.val + 10) / 20;
    const r = Math.round(255 * (1 - ratio));
    const g = Math.round(240 * ratio);
    if (i === 0) {
      ctx.moveTo(p.x, p.y);
    } else {
      const prev = points[i - 1];
      const prevRatio = (prev.val + 10) / 20;
      const segGrad = ctx.createLinearGradient(prev.x, 0, p.x, 0);
      segGrad.addColorStop(0, `rgb(${Math.round(255 * (1 - prevRatio))}, ${Math.round(240 * prevRatio)}, 174)`);
      segGrad.addColorStop(1, `rgb(${r}, ${g}, 174)`);
      ctx.strokeStyle = segGrad;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  });

  points.forEach((p) => {
    const ratio = (p.val + 10) / 20;
    const r = Math.round(255 * (1 - ratio));
    const g = Math.round(240 * ratio);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${r}, ${g}, 174)`;
    ctx.fill();
    ctx.strokeStyle = 'rgba(30, 30, 46, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}

export default function DetailPanel() {
  const { selectedEvent, setSelectedEvent } = useStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (selectedEvent && canvasRef.current) {
      drawSentimentChart(canvasRef.current, selectedEvent.sentimentWeek);
    }
  }, [selectedEvent]);

  if (!selectedEvent) return null;

  const sentimentClass =
    selectedEvent.sentiment === 'positive'
      ? styles.sentimentPositive
      : selectedEvent.sentiment === 'neutral'
      ? styles.sentimentNeutral
      : styles.sentimentNegative;

  const h1 = (selectedEvent.imageIndex * 36 + 30) % 360;
  const h2 = (h1 + 60) % 360;

  return (
    <>
      <div className={styles.panelOverlay} onClick={() => setSelectedEvent(null)} />
      <div className={styles.detailPanel}>
        <div className={styles.panelHeader}>
          <div />
          <button className={styles.closeBtn} onClick={() => setSelectedEvent(null)}>
            ✕
          </button>
        </div>
        <div className={styles.panelContent}>
          <div
            className={styles.colorBlock}
            style={{
              background: `linear-gradient(135deg, hsl(${h1}, 55%, 45%), hsl(${h2}, 50%, 35%))`,
            }}
          >
            <div className={styles.colorBlockOverlay} />
          </div>

          <div className={styles.panelDate}>{selectedEvent.date}</div>
          <div className={styles.panelTitle}>{selectedEvent.title}</div>
          <div className={`${styles.panelSentimentBadge} ${sentimentClass}`}>
            {SENTIMENT_LABELS[selectedEvent.sentiment]} · 情感强度 {selectedEvent.sentimentIntensity > 0 ? '+' : ''}
            {selectedEvent.sentimentIntensity}
          </div>
          <div className={styles.panelSummary}>{selectedEvent.summary}</div>

          <div className={styles.chartSection}>
            <div className={styles.chartTitle}>7天情感趋势</div>
            <canvas
              ref={canvasRef}
              className={styles.chartCanvas}
              style={{ height: 160 }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
