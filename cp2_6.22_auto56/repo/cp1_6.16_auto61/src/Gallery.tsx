import { useRef, useEffect, useState } from 'react';
import type { DrawingRecord } from './types';
import { MOOD_LABELS, MOOD_COLORS } from './types';

interface GalleryProps {
  records: DrawingRecord[];
  onToggleFavorite: (id: string) => void;
}

const THUMB_SIZE = 120;
const CANVAS_SIZE = 600;

export default function Gallery({ records, onToggleFavorite }: GalleryProps) {
  const [selectedRecord, setSelectedRecord] = useState<DrawingRecord | null>(null);
  const modalCanvasRef = useRef<HTMLCanvasElement>(null);

  const sortedRecords = [...records].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    if (a.isFavorite && b.isFavorite) {
      return (b.favoritedAt || 0) - (a.favoritedAt || 0);
    }
    return b.timestamp - a.timestamp;
  });

  const displayRecords = sortedRecords.slice(0, 8);

  const drawThumbnail = (canvas: HTMLCanvasElement, record: DrawingRecord) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = THUMB_SIZE / CANVAS_SIZE;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, THUMB_SIZE, THUMB_SIZE);

    for (const stroke of record.strokes) {
      if (stroke.points.length < 2) continue;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width * scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x * scale, stroke.points[0].y * scale);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x * scale, stroke.points[i].y * scale);
      }
      ctx.stroke();
    }
  };

  const drawFullSize = (canvas: HTMLCanvasElement, record: DrawingRecord) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    for (const stroke of record.strokes) {
      if (stroke.points.length < 2) continue;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
  };

  useEffect(() => {
    const canvases = document.querySelectorAll('.thumb-canvas');
    canvases.forEach((canvasEl, index) => {
      const canvas = canvasEl as HTMLCanvasElement;
      const record = displayRecords[index];
      if (record) {
        drawThumbnail(canvas, record);
      }
    });
  }, [displayRecords]);

  useEffect(() => {
    if (selectedRecord && modalCanvasRef.current) {
      drawFullSize(modalCanvasRef.current, selectedRecord);
    }
  }, [selectedRecord]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}-${day} ${hours}:${minutes}`;
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>时间线画廊</h2>
      <div style={styles.grid}>
        {displayRecords.map((record) => (
          <div
            key={record.id}
            style={styles.thumbContainer}
            onClick={() => setSelectedRecord(record)}
          >
            <canvas
              className="thumb-canvas"
              width={THUMB_SIZE}
              height={THUMB_SIZE}
              style={styles.thumbCanvas}
            />
            {record.isFavorite && (
              <div style={styles.favoriteStar}>★</div>
            )}
            <div style={{
              ...styles.moodLabel,
              backgroundColor: MOOD_COLORS[record.mood]
            }}>
              {MOOD_LABELS[record.mood]}
            </div>
            <div style={styles.timeLabel}>
              {formatDate(record.timestamp)}
            </div>
          </div>
        ))}
        {displayRecords.length === 0 && (
          <div style={styles.emptyState}>
            还没有画作，开始绘制你的第一幅吧！
          </div>
        )}
      </div>

      {selectedRecord && (
        <div style={styles.modalOverlay} onClick={() => setSelectedRecord(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeButton} onClick={() => setSelectedRecord(null)}>
              ×
            </button>
            <canvas
              ref={modalCanvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              style={styles.modalCanvas}
            />
            <div style={styles.modalInfo}>
              <div style={{
                ...styles.modalMood,
                backgroundColor: MOOD_COLORS[selectedRecord.mood]
              }}>
                心情：{MOOD_LABELS[selectedRecord.mood]}
              </div>
              <div style={styles.modalTime}>
                时间：{formatDate(selectedRecord.timestamp)}
              </div>
              <button
                style={{
                  ...styles.favoriteBtn,
                  color: selectedRecord.isFavorite ? '#FFD700' : '#ffffff'
                }}
                onClick={() => onToggleFavorite(selectedRecord.id)}
              >
                {selectedRecord.isFavorite ? '★ 已收藏' : '☆ 收藏'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    maxWidth: '600px',
    marginTop: '30px',
    padding: '0 20px'
  },
  title: {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: 600,
    marginBottom: '16px',
    textAlign: 'center' as const
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gridTemplateRows: 'repeat(2, 1fr)',
    gap: '16px',
    justifyItems: 'center'
  },
  thumbContainer: {
    position: 'relative' as const,
    width: '120px',
    height: '120px',
    borderRadius: '8px',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
  },
  thumbCanvas: {
    width: '100%',
    height: '100%',
    display: 'block'
  },
  favoriteStar: {
    position: 'absolute' as const,
    top: '4px',
    left: '4px',
    color: '#FFD700',
    fontSize: '20px',
    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
    zIndex: 2
  },
  moodLabel: {
    position: 'absolute' as const,
    bottom: '4px',
    right: '4px',
    padding: '2px 8px',
    borderRadius: '4px',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: 500,
    opacity: 0.7,
    zIndex: 2
  },
  timeLabel: {
    position: 'absolute' as const,
    top: '4px',
    right: '4px',
    color: '#ffffff',
    fontSize: '10px',
    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
    zIndex: 2
  },
  emptyState: {
    gridColumn: '1 / -1',
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center' as const,
    padding: '40px 0'
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    position: 'relative' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '16px'
  },
  closeButton: {
    position: 'absolute' as const,
    top: '-16px',
    right: '-16px',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    color: '#1a1a2e',
    border: 'none',
    fontSize: '20px',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001
  },
  modalCanvas: {
    borderRadius: '8px',
    boxShadow: '0 0 20px rgba(255,255,255,0.15)'
  },
  modalInfo: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center'
  },
  modalMood: {
    padding: '8px 16px',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 500
  },
  modalTime: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '14px'
  },
  favoriteBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
};
