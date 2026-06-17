import { useEffect, useMemo, useState } from 'react';

export interface SummaryCardData {
  title: string;
  value: string;
  sub?: string;
  progress: number;
  status: 'good' | 'bad' | 'neutral';
  unit?: string;
  maxValue?: number;
}

const statusColor = (status: SummaryCardData['status']) => {
  switch (status) {
    case 'good': return '#059669';
    case 'bad': return '#DC2626';
    default: return '#6B7280';
  }
};

const progressColor = (status: SummaryCardData['status']) => {
  switch (status) {
    case 'good': return 'linear-gradient(90deg,#34D399,#059669)';
    case 'bad': return 'linear-gradient(90deg,#F87171,#DC2626)';
    default: return 'linear-gradient(90deg,#9CA3AF,#6B7280)';
  }
};

const calculateProgressWidth = (value: string, status: SummaryCardData['status'], providedProgress: number, maxValue?: number): number => {
  if (providedProgress !== undefined && providedProgress >= 0) {
    return Math.max(0, Math.min(100, providedProgress));
  }
  const numValue = parseFloat(value);
  if (!isNaN(numValue) && maxValue !== undefined && maxValue > 0) {
    return Math.max(0, Math.min(100, (numValue / maxValue) * 100));
  }
  if (status === 'good') return 85;
  if (status === 'bad') return 35;
  return 60;
};

export const SummaryCard = ({ data }: { data: SummaryCardData }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [displayWidth, setDisplayWidth] = useState(0);

  const targetWidth = useMemo(
    () => calculateProgressWidth(data.value, data.status, data.progress, data.maxValue),
    [data]
  );

  useEffect(() => {
    setDisplayWidth(0);
    const t = setTimeout(() => {
      setDisplayWidth(targetWidth);
    }, 80);
    return () => clearTimeout(t);
  }, [targetWidth]);

  const currentStyles = {
    ...styles.card,
    boxShadow: isHovered
      ? '0 12px 28px rgba(0,0,0,0.14)'
      : '0 4px 12px rgba(0,0,0,0.06)',
    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)'
  };

  return (
    <div
      style={currentStyles}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.header}>
        <span style={styles.title}>{data.title}</span>
      </div>
      <div style={styles.valueRow}>
        <span style={{ ...styles.value, color: statusColor(data.status) }}>{data.value}</span>
        {data.unit && <span style={styles.unit}>{data.unit}</span>}
      </div>
      {data.sub && <div style={styles.sub}>{data.sub}</div>}
      <div style={styles.progressTrack}>
        <div
          style={{
            ...styles.progressFill,
            width: `${displayWidth}%`,
            background: progressColor(data.status),
            transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)'
          }}
        />
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    width: 200,
    height: 120,
    padding: '14px 16px',
    background: 'linear-gradient(135deg,#ECFDF5 0%,#D1FAE5 100%)',
    borderRadius: 12,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'pointer'
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 12, fontWeight: 500, color: '#6B7280', letterSpacing: 0.2 },
  valueRow: { display: 'flex', alignItems: 'baseline', gap: 4 },
  value: { fontSize: 28, fontWeight: 800, lineHeight: 1.1 },
  unit: { fontSize: 13, color: '#6B7280', fontWeight: 500 },
  sub: { fontSize: 11, color: '#6B7280', marginTop: -4 },
  progressTrack: {
    width: '100%',
    height: 3,
    borderRadius: 3,
    background: '#E5E7EB',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 3
  }
};

export const cardHover: React.CSSProperties = {};
