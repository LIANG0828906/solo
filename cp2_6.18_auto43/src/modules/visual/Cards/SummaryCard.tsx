import { useEffect, useMemo, useState } from 'react';

export interface DetailPoint {
  date: string;
  value: string | number;
}

export interface SummaryCardData {
  title: string;
  value: string;
  sub?: string;
  progress: number;
  status: 'good' | 'bad' | 'neutral';
  unit?: string;
  maxValue?: number;
  detailData?: DetailPoint[];
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
  const [showDetail, setShowDetail] = useState(false);

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

  useEffect(() => {
    const handler = () => setShowDetail(false);
    if (showDetail) {
      document.addEventListener('click', handler);
      return () => document.removeEventListener('click', handler);
    }
  }, [showDetail]);

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
        <button
          style={{
            ...styles.detailBtn,
            background: showDetail ? '#F3F4F6' : 'transparent'
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (data.detailData && data.detailData.length > 0) {
              setShowDetail((s) => !s);
            }
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#F3F4F6';
          }}
          onMouseLeave={(e) => {
            if (!showDetail) {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }
          }}
          title="查看30天数据"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </button>
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

      {showDetail && data.detailData && data.detailData.length > 0 && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            ...styles.detailPopup,
            animation: 'popupIn 0.18s ease'
          }}
        >
          <div style={styles.detailPopupHeader}>
            <span style={styles.detailPopupTitle}>最近30天 · {data.title}</span>
            <button
              style={styles.detailPopupClose}
              onClick={(e) => { e.stopPropagation(); setShowDetail(false); }}
            >×</button>
          </div>
          <div style={styles.detailList}>
            {data.detailData.slice().reverse().map((d, i) => (
              <div key={i} style={{
                ...styles.detailRow,
                background: i % 2 === 0 ? '#F9FAFB' : '#fff'
              }}>
                <span style={styles.detailDate}>{d.date}</span>
                <span style={{ ...styles.detailValue, color: statusColor(data.status) }}>
                  {d.value}{typeof d.value === 'number' && data.unit ? ` ${data.unit}` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
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
    cursor: 'pointer',
    position: 'relative'
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 12, fontWeight: 500, color: '#6B7280', letterSpacing: 0.2 },
  detailBtn: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background 0.2s ease'
  },
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
  },
  detailPopup: {
    position: 'absolute',
    top: 100,
    right: -10,
    width: 280,
    background: '#fff',
    borderRadius: 8,
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    zIndex: 200,
    overflow: 'hidden'
  },
  detailPopupHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    borderBottom: '1px solid #F3F4F6',
    background: '#FAFBFC'
  },
  detailPopupTitle: { fontSize: 12, fontWeight: 600, color: '#1F2937' },
  detailPopupClose: {
    border: 'none', background: 'transparent', cursor: 'pointer',
    fontSize: 16, color: '#9CA3AF', lineHeight: 1, padding: 0
  },
  detailList: {
    maxHeight: 260,
    overflowY: 'auto'
  },
  detailRow: {
    padding: '8px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 12
  },
  detailDate: { color: '#6B7280' },
  detailValue: { fontWeight: 700 }
};

export const cardHover: React.CSSProperties = {};
