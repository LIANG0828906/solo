import React, { useEffect, useRef, useState } from 'react';
import { useStore, type RecordingData } from '../lib/store';

const EMOTION_COLORS: Record<string, string> = {
  happy: '#FFD93D',
  calm: '#6BCB77',
  sad: '#4F8FD3',
  angry: '#FF6B6B',
};

const EMOTION_LABELS: Record<string, string> = {
  happy: '开心',
  calm: '平静',
  sad: '忧伤',
  angry: '愤怒',
};

interface HoverInfo {
  data: RecordingData;
  x: number;
  y: number;
}

export const HistoryChart: React.FC = () => {
  const { history } = useStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<HoverInfo | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const width = 600;
    const height = 500;
    canvas.width = width;
    canvas.height = height;

    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width, height) / 2.6;

    const drawBackground = () => {
      const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, width / 2);
      bgGradient.addColorStop(0, '#16213E');
      bgGradient.addColorStop(1, '#0F172A');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = '#E0E0E0';
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.2;

      for (let i = -2; i <= 2; i++) {
        const x = centerX + i * scale / 2;
        const y = centerY + i * scale / 2;

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;

      ctx.strokeStyle = '#8892B0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, height);
      ctx.stroke();

      ctx.fillStyle = '#8892B0';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('愉悦度 →', width - 50, centerY + 30);
      ctx.save();
      ctx.translate(30, 50);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('激活度 ↑', 0, 0);
      ctx.restore();
    };

    const getPointSize = (duration: number): number => {
      const minSize = 8;
      const maxSize = 32;
      const t = (Math.max(1, Math.min(10, duration)) - 1) / 9;
      return minSize + t * (maxSize - minSize);
    };

    const drawPoints = () => {
      history.forEach((item) => {
        const x = centerX + item.valence * scale;
        const y = centerY - item.arousal * scale;
        const size = getPointSize(item.duration);
        const color = EMOTION_COLORS[item.emotionCategory] || '#888';

        const isHovered = hoveredPoint?.data.id === item.id;

        ctx.save();

        if (isHovered) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 20;
        }

        ctx.globalAlpha = hoveredPoint && !isHovered ? 0.4 : 0.9;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
      });
    };

    drawBackground();
    drawPoints();
  }, [history, hoveredPoint]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width, height) / 2.6;

    let found: HoverInfo | null = null;

    for (const item of history) {
      const x = centerX + item.valence * scale;
      const y = centerY - item.arousal * scale;
      const size = 8 + ((Math.max(1, Math.min(10, item.duration)) - 1) / 9) * 24;

      const distance = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);
      if (distance <= size / 2 + 5) {
        found = {
          data: item,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
        break;
      }
    }

    setHoveredPoint(found);
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.card} ref={containerRef}>
        <div style={styles.header}>
          <h3 style={styles.title}>历史情绪图谱</h3>
          <span style={styles.count}>共 {history.length} 条记录</span>
        </div>

        <div style={styles.canvasContainer}>
          <canvas
            ref={canvasRef}
            style={styles.canvas}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />

          {hoveredPoint && (
            <div
              style={{
                ...styles.tooltip,
                left: hoveredPoint.x + 15,
                top: hoveredPoint.y - 10,
                opacity: 1,
                transform: 'translateY(0)',
              }}
            >
              <div style={styles.tooltipHeader}>
                <div
                  style={{
                    ...styles.tooltipDot,
                    backgroundColor: EMOTION_COLORS[hoveredPoint.data.emotionCategory],
                  }}
                />
                <span style={styles.tooltipEmotion}>
                  {EMOTION_LABELS[hoveredPoint.data.emotionCategory]}
                </span>
              </div>
              <div style={styles.tooltipRow}>
                <span style={styles.tooltipLabel}>时长</span>
                <span style={styles.tooltipValue}>{hoveredPoint.data.duration.toFixed(1)} 秒</span>
              </div>
              <div style={styles.tooltipRow}>
                <span style={styles.tooltipLabel}>愉悦度</span>
                <span style={styles.tooltipValue}>{hoveredPoint.data.valence.toFixed(2)}</span>
              </div>
              <div style={styles.tooltipRow}>
                <span style={styles.tooltipLabel}>激活度</span>
                <span style={styles.tooltipValue}>{hoveredPoint.data.arousal.toFixed(2)}</span>
              </div>
              <div style={styles.tooltipRow}>
                <span style={styles.tooltipLabel}>时间</span>
                <span style={styles.tooltipValue}>{formatTimestamp(hoveredPoint.data.timestamp)}</span>
              </div>
            </div>
          )}
        </div>

        <div style={styles.legend}>
          <div style={styles.legendSection}>
            <div style={styles.legendTitle}>情绪类别</div>
            <div style={styles.legendItems}>
              {Object.entries(EMOTION_COLORS).map(([key, color]) => (
                <div key={key} style={styles.legendItem}>
                  <div style={{ ...styles.legendDot, backgroundColor: color }} />
                  <span style={styles.legendText}>{EMOTION_LABELS[key]}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={styles.legendSection}>
            <div style={styles.legendTitle}>点大小代表时长</div>
            <div style={styles.sizeLegend}>
              <div style={styles.sizeItem}>
                <div style={{ ...styles.sizeDot, width: '8px', height: '8px' }} />
                <span style={styles.legendText}>1秒</span>
              </div>
              <div style={styles.sizeItem}>
                <div style={{ ...styles.sizeDot, width: '20px', height: '20px' }} />
                <span style={styles.legendText}>5.5秒</span>
              </div>
              <div style={styles.sizeItem}>
                <div style={{ ...styles.sizeDot, width: '32px', height: '32px' }} />
                <span style={styles.legendText}>10秒</span>
              </div>
            </div>
          </div>
        </div>

        {history.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📊</div>
            <p style={styles.emptyText}>暂无历史记录</p>
            <p style={styles.emptyHint}>开始录音以生成你的情绪图谱</p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  card: {
    backgroundColor: '#16213E',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    position: 'relative',
    width: '100%',
    maxWidth: '700px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#E2E2E2',
    margin: 0,
  },
  count: {
    fontSize: '13px',
    color: '#8892B0',
    backgroundColor: '#0F172A',
    padding: '6px 12px',
    borderRadius: '20px',
  },
  canvasContainer: {
    position: 'relative',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  canvas: {
    borderRadius: '12px',
    cursor: 'pointer',
    maxWidth: '100%',
    height: 'auto',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    pointerEvents: 'none',
    zIndex: 100,
    minWidth: '180px',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
  },
  tooltipHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid rgba(0,0,0,0.1)',
  },
  tooltipDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
  },
  tooltipEmotion: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1A1A2E',
  },
  tooltipRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  tooltipLabel: {
    fontSize: '12px',
    color: '#666',
  },
  tooltipValue: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#1A1A2E',
  },
  legend: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '32px',
    marginTop: '20px',
    padding: '16px',
    backgroundColor: '#0F172A',
    borderRadius: '12px',
    flexWrap: 'wrap',
  },
  legendSection: {
    flex: 1,
    minWidth: '200px',
  },
  legendTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#E2E2E2',
    marginBottom: '12px',
  },
  legendItems: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  legendText: {
    fontSize: '12px',
    color: '#8892B0',
  },
  sizeLegend: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
  },
  sizeItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  sizeDot: {
    borderRadius: '50%',
    backgroundColor: '#667EEA',
  },
  emptyState: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    color: '#8892B0',
    backgroundColor: 'rgba(22, 33, 62, 0.95)',
    padding: '40px',
    borderRadius: '16px',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    opacity: 0.5,
  },
  emptyText: {
    fontSize: '18px',
    marginBottom: '8px',
    color: '#E2E2E2',
  },
  emptyHint: {
    fontSize: '14px',
    opacity: 0.7,
  },
};
