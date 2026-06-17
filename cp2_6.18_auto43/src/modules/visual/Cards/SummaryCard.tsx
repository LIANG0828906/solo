import { useEffect, useState } from 'react';

export interface SummaryCardData {
  title: string;
  value: string;
  sub?: string;
  progress: number;
  status: 'good' | 'bad' | 'neutral';
  unit?: string;
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

export const SummaryCard = ({ data }: { data: SummaryCardData }) => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.max(0, Math.min(100, data.progress))), 60);
    return () => clearTimeout(t);
  }, [data.progress]);

  return (
    <div style={styles.card}>
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
            width: `${width}%`,
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
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
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
