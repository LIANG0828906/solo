import { useState } from 'react';
import { Heart, Copy, MapPin } from 'lucide-react';
import RadarChart from './RadarChart';
import type { BrewRecord } from '@/types';

interface FeedCardProps {
  brew: BrewRecord;
  onCopy?: (brew: BrewRecord) => void;
  onLike?: (id: string) => void;
}

export default function FeedCard({ brew, onCopy, onLike }: FeedCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (onCopy) {
      onCopy(brew);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    }
  };

  return (
    <div
      style={{
        ...styles.card,
        transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.cardHeader}>
        <h4 style={styles.beanName}>{brew.beanName}</h4>
        <div style={styles.scoreBadge}>
          <span style={styles.scoreText}>{brew.overallScore.toFixed(1)}</span>
        </div>
      </div>

      <div style={styles.paramsRow}>
        <div style={styles.paramItem}>
          <span style={styles.paramLabel}>水温</span>
          <span style={styles.paramValue}>{brew.params.waterTemp}°C</span>
        </div>
        <div style={styles.paramItem}>
          <span style={styles.paramLabel}>研磨</span>
          <span style={styles.paramValue}>{brew.params.grindSize}档</span>
        </div>
        <div style={styles.paramItem}>
          <span style={styles.paramLabel}>粉水比</span>
          <span style={styles.paramValue}>1:{brew.params.waterRatio}</span>
        </div>
      </div>

      <div style={styles.radarContainer}>
        <RadarChart value={brew.flavor} size={120} interactive={false} />
      </div>

      {brew.notes && (
        <p style={styles.notes}>{brew.notes}</p>
      )}

      <div style={styles.cardFooter}>
        <button
          style={styles.likeBtn}
          onClick={() => onLike?.(brew.id)}
        >
          <Heart size={16} fill="#e94560" color="#e94560" />
          <span style={styles.likeCount}>{brew.likes}</span>
        </button>

        <button
          style={{
            ...styles.copyBtn,
            backgroundColor: isCopied ? '#a7c957' : '#e94560',
          }}
          onClick={handleCopy}
        >
          <Copy size={14} />
          <span>{isCopied ? '已抄作业' : '抄作业'}</span>
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    color: '#eee',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    minWidth: 260,
    flexShrink: 0,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    cursor: 'pointer',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  beanName: {
    fontSize: 15,
    fontWeight: 600,
    margin: 0,
    color: '#eee',
  },
  scoreBadge: {
    backgroundColor: 'rgba(233, 69, 96, 0.2)',
    padding: '4px 10px',
    borderRadius: 12,
  },
  scoreText: {
    color: '#e94560',
    fontSize: 14,
    fontWeight: 700,
  },
  paramsRow: {
    display: 'flex',
    gap: 8,
    justifyContent: 'space-between',
  },
  paramItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#0f1729',
    padding: '8px 10px',
    borderRadius: 8,
    flex: 1,
  },
  paramLabel: {
    fontSize: 11,
    color: '#888',
  },
  paramValue: {
    fontSize: 13,
    fontWeight: 600,
    color: '#eee',
  },
  radarContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '8px 0',
    backgroundColor: '#0f1729',
    borderRadius: 8,
  },
  notes: {
    fontSize: 12,
    color: '#aaa',
    margin: 0,
    lineHeight: 1.4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  likeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '6px 10px',
    borderRadius: 8,
    transition: 'background-color 0.2s ease',
  },
  likeCount: {
    fontSize: 13,
    color: '#e94560',
    fontWeight: 500,
  },
  copyBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e94560',
    color: '#fff',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};
