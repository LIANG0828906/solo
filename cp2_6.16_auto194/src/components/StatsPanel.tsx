import { useEffect, useRef, memo } from 'react';
import { useAppStore } from '@/store';
import { ANNOTATION_COLORS, ANNOTATION_LABELS } from '@/utils/colors';
import styles from './StatsPanel.module.css';

interface StatsPanelProps {
  documentId: string;
}

function StatsPanel({ documentId }: StatsPanelProps) {
  const stats = useAppStore((state) => state.getAnnotationStats(documentId));
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 140;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size - 20) / 2;
    const lineWidth = 10;

    ctx.clearRect(0, 0, size, size);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    if (stats.total === 0) return;

    const types = ['suggestion', 'question', 'error'] as const;
    let startAngle = -Math.PI / 2;

    types.forEach((type) => {
      const count = stats[type];
      if (count === 0) return;

      const percent = count / stats.total;
      const endAngle = startAngle + percent * Math.PI * 2;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.strokeStyle = ANNOTATION_COLORS[type];
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.stroke();

      startAngle = endAngle;
    });
  }, [stats]);

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>批注统计</div>

      <div className={styles.chartContainer}>
        <canvas ref={canvasRef} className={styles.chartCanvas} />
        <div className={styles.chartCenter}>
          <div className={styles.chartCenterNumber}>{stats.total}</div>
          <div className={styles.chartCenterLabel}>总批注数</div>
        </div>
      </div>

      <div className={styles.legend}>
        {(['suggestion', 'question', 'error'] as const).map((type) => (
          <div key={type} className={styles.legendItem}>
            <div
              className={styles.legendColor}
              style={{ backgroundColor: ANNOTATION_COLORS[type] }}
            />
            <span className={styles.legendLabel}>{ANNOTATION_LABELS[type]}</span>
            <span className={styles.legendPercent}>
              {stats[`${type}Percent` as keyof typeof stats]}%
            </span>
          </div>
        ))}
      </div>

      <div className={styles.recentSection}>
        <div className={styles.recentTitle}>最新批注</div>
        {stats.recentAnnotations.length === 0 ? (
          <div className={styles.emptyRecent}>暂无批注</div>
        ) : (
          <div className={styles.recentList}>
            {stats.recentAnnotations.map((annotation) => (
              <div key={annotation.id} className={styles.recentItem}>
                <div
                  className={styles.recentAvatar}
                  style={{ backgroundColor: annotation.authorColor }}
                >
                  {getInitials(annotation.author)}
                </div>
                <div className={styles.recentContent}>
                  <div className={styles.recentAuthor}>{annotation.author}</div>
                  <div className={styles.recentText}>
                    {annotation.content.slice(0, 20)}
                    {annotation.content.length > 20 ? '...' : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(StatsPanel);
