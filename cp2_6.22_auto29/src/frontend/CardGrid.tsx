import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { AdVersion } from '../types';

interface VersionWithMetrics extends AdVersion {
  metrics?: {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cvr: number;
  };
}

interface Props {
  versionData: VersionWithMetrics[];
  winnerId?: string;
  status: string;
  onSelectWinner: (versionId: string) => void;
}

function AnimatedNumber({ value, decimals = 0, prefix = '', suffix = '' }: { value: number; decimals?: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    const diff = end - start;
    if (Math.abs(diff) < 0.001) {
      setDisplay(end);
      prevRef.current = end;
      return;
    }
    const duration = 600;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * eased;
      setDisplay(current);
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(end);
        prevRef.current = end;
      }
    };
    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [value]);

  return (
    <span>
      {prefix}{display.toFixed(decimals)}{suffix}
    </span>
  );
}

function MetricBlock({ label, value, decimals = 0, prefix = '', suffix = '', gradient }: {
  label: string;
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  gradient: string;
}) {
  return (
    <div style={{
      ...metricStyles.block,
      background: gradient,
    }}>
      <div style={metricStyles.label}>{label}</div>
      <div style={metricStyles.value}>
        <AnimatedNumber value={value} decimals={decimals} prefix={prefix} suffix={suffix} />
      </div>
    </div>
  );
}

const GRADIENTS = {
  impressions: 'linear-gradient(135deg, rgba(41, 121, 255, 0.25), rgba(0, 229, 255, 0.15))',
  clicks: 'linear-gradient(135deg, rgba(0, 229, 255, 0.25), rgba(0, 240, 192, 0.15))',
  ctr: 'linear-gradient(135deg, rgba(0, 240, 192, 0.25), rgba(0, 229, 255, 0.15))',
  conversions: 'linear-gradient(135deg, rgba(124, 77, 255, 0.25), rgba(41, 121, 255, 0.15))',
  cvr: 'linear-gradient(135deg, rgba(255, 145, 0, 0.25), rgba(0, 240, 192, 0.15))',
};

export default function CardGrid({ versionData, winnerId, status, onSelectWinner }: Props) {
  const [fadeKey, setFadeKey] = useState(0);

  useEffect(() => {
    setFadeKey((k) => k + 1);
  }, [versionData]);

  const handleExportCSV = useCallback(() => {
    if (!versionData.length) return;
    const headers = ['版本', '展示量', '点击量', 'CTR', '转化量', 'CVR'];
    const rows = versionData.map((v) => [
      v.title,
      v.metrics?.impressions ?? 0,
      v.metrics?.clicks ?? 0,
      ((v.metrics?.ctr ?? 0) * 100).toFixed(2) + '%',
      v.metrics?.conversions ?? 0,
      ((v.metrics?.cvr ?? 0) * 100).toFixed(2) + '%',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ab-test-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [versionData]);

  return (
    <div>
      <div style={styles.grid}>
        {versionData.map((v, idx) => {
          const isWinner = winnerId === v.id;
          const m = v.metrics || { impressions: 0, clicks: 0, conversions: 0, ctr: 0, cvr: 0 };
          return (
            <div
              key={v.id}
              style={{
                ...styles.card,
                ...(isWinner ? styles.winnerCard : {}),
                animation: `fadeIn 0.4s ease ${idx * 0.08}s both`,
              }}
            >
              {isWinner && (
                <div style={styles.winnerBadge}>🏆 胜出</div>
              )}
              <div style={styles.cardHeader}>
                <div style={styles.cardVersionTag}>版本 {String.fromCharCode(65 + idx)}</div>
                <div style={styles.cardTitle}>{v.title}</div>
                {v.imageUrl && (
                  <div style={styles.cardImageWrap}>
                    <img src={v.imageUrl} alt="" style={styles.cardImage} />
                  </div>
                )}
              </div>
              <div style={styles.metricsGrid}>
                <MetricBlock label="展示量" value={m.impressions} gradient={GRADIENTS.impressions} />
                <MetricBlock label="点击量" value={m.clicks} gradient={GRADIENTS.clicks} />
                <MetricBlock label="CTR" value={m.ctr * 100} decimals={2} suffix="%" gradient={GRADIENTS.ctr} />
                <MetricBlock label="转化量" value={m.conversions} gradient={GRADIENTS.conversions} />
                <MetricBlock label="CVR" value={m.cvr * 100} decimals={2} suffix="%" gradient={GRADIENTS.cvr} />
              </div>
              {status === 'completed' && !winnerId && (
                <button
                  onClick={() => onSelectWinner(v.id)}
                  style={styles.selectWinnerBtn}
                >
                  选为胜出版本
                </button>
              )}
            </div>
          );
        })}
      </div>
      {versionData.length > 0 && (
        <div style={styles.exportRow}>
          <button onClick={handleExportCSV} style={styles.exportBtn}>
            📥 导出 CSV
          </button>
        </div>
      )}
    </div>
  );
}

const metricStyles: Record<string, React.CSSProperties> = {
  block: {
    padding: '10px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--glass-border)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    transition: 'transform 0.2s',
  },
  label: {
    fontSize: 10,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  value: {
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--text-primary)',
    fontVariantNumeric: 'tabular-nums',
  },
};

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 16,
    marginBottom: 24,
  },
  card: {
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-xl)',
    padding: 20,
    backdropFilter: 'blur(16px)',
    position: 'relative' as const,
    transition: 'all 0.3s',
    overflow: 'hidden',
  },
  winnerCard: {
    border: '2px solid rgba(0, 240, 192, 0.5)',
    animation: 'winnerGlow 3s infinite',
  },
  winnerBadge: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    padding: '4px 10px',
    borderRadius: 20,
    background: 'rgba(0, 240, 192, 0.15)',
    border: '1px solid rgba(0, 240, 192, 0.3)',
    color: '#00f0c0',
    fontSize: 11,
    fontWeight: 700,
  },
  cardHeader: { marginBottom: 16 },
  cardVersionTag: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 4,
    background: 'var(--accent-gradient)',
    color: '#070d1a',
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 8,
    lineHeight: 1.3,
  },
  cardImageWrap: {
    width: '100%',
    height: 100,
    borderRadius: 'var(--radius-sm)',
    overflow: 'hidden',
    marginBottom: 8,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: 8,
  },
  selectWinnerBtn: {
    width: '100%',
    marginTop: 12,
    padding: '8px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid rgba(0, 240, 192, 0.3)',
    background: 'rgba(0, 240, 192, 0.08)',
    color: '#00f0c0',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  exportRow: { display: 'flex', justifyContent: 'flex-end' },
  exportBtn: {
    padding: '8px 20px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-color)',
    background: 'var(--glass-bg)',
    color: 'var(--text-secondary)',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
    transition: 'all 0.2s',
  },
};
