import React, { useRef, useState, useEffect, useCallback } from 'react';
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
  onSimulateClick?: (versionId: string) => void;
  onSimulateImpression?: (versionId: string) => void;
  onSimulateConversion?: (versionId: string) => void;
}

function AnimatedNumber({ value, decimals = 0, prefix = '', suffix = '', duration = 600 }: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    const diff = end - start;
    if (Math.abs(diff) < 0.0001) {
      setDisplay(end);
      prevRef.current = end;
      return;
    }
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
  }, [value, duration]);

  return (
    <span>
      {prefix}{display.toFixed(decimals)}{suffix}
    </span>
  );
}

function MetricCard({ label, value, decimals = 0, prefix = '', suffix = '', gradient }: {
  label: string;
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  gradient: string;
}) {
  return (
    <div style={{
      ...metricStyles.wrapper,
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
  impressions: 'linear-gradient(135deg, rgba(41, 121, 255, 0.22), rgba(0, 229, 255, 0.12))',
  clicks: 'linear-gradient(135deg, rgba(0, 229, 255, 0.22), rgba(0, 240, 192, 0.12))',
  ctr: 'linear-gradient(135deg, rgba(0, 240, 192, 0.22), rgba(0, 229, 255, 0.12))',
  conversions: 'linear-gradient(135deg, rgba(124, 77, 255, 0.22), rgba(41, 121, 255, 0.12))',
  cvr: 'linear-gradient(135deg, rgba(255, 145, 0, 0.22), rgba(0, 240, 192, 0.12))',
};

export default function CardGrid({
  versionData,
  winnerId,
  status,
  onSelectWinner,
  onSimulateClick,
  onSimulateImpression,
  onSimulateConversion,
}: Props) {
  const [dataKey, setDataKey] = useState(0);

  useEffect(() => {
    setDataKey((k) => k + 1);
  }, [versionData]);

  const handleExportCSV = useCallback(() => {
    if (!versionData.length) return;
    const headers = ['版本', '展示量', '点击量', 'CTR (%)', '转化量', 'CVR (%)'];
    const rows = versionData.map((v) => [
      `"${v.title.replace(/"/g, '""')}"`,
      v.metrics?.impressions ?? 0,
      v.metrics?.clicks ?? 0,
      ((v.metrics?.ctr ?? 0) * 100).toFixed(2),
      v.metrics?.conversions ?? 0,
      ((v.metrics?.cvr ?? 0) * 100).toFixed(2),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ab-test-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [versionData]);

  const formatNumber = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  if (versionData.length === 0) {
    return <div style={styles.empty}>暂无数据</div>;
  }

  return (
    <div>
      <div style={styles.grid}>
        {versionData.map((v, idx) => {
          const isWinner = winnerId === v.id;
          const m = v.metrics || { impressions: 0, clicks: 0, conversions: 0, ctr: 0, cvr: 0 };
          return (
            <div
              key={`${v.id}-${dataKey}`}
              style={{
                ...styles.card,
                ...(isWinner ? styles.winnerCard : {}),
                animation: `fadeIn 0.5s ease ${idx * 0.06}s both`,
              }}
            >
              {isWinner && (
                <div style={styles.winnerBadge}>
                  🏆 胜出版本
                </div>
              )}

              <div style={styles.cardHeader}>
                <div style={styles.versionTag}>
                  版本 {String.fromCharCode(65 + idx)}
                </div>
                <div style={styles.versionTitle}>{v.title}</div>
                {v.imageUrl && (
                  <div style={styles.cardImageWrap}>
                    <img src={v.imageUrl} alt="" style={styles.cardImage} loading="lazy" />
                  </div>
                )}
                <div style={styles.versionDescription}>
                  {v.description || '暂无描述'}
                </div>
                <div style={styles.ctaRow}>
                  <span style={styles.ctaButton}>
                    {v.ctaText || 'CTA'}
                  </span>
                </div>
              </div>

              <div style={styles.metricsGrid}>
                <MetricCard
                  label="展示量"
                  value={m.impressions}
                  gradient={GRADIENTS.impressions}
                />
                <MetricCard
                  label="点击量"
                  value={m.clicks}
                  gradient={GRADIENTS.clicks}
                />
                <MetricCard
                  label="CTR"
                  value={m.ctr * 100}
                  decimals={2}
                  suffix="%"
                  gradient={GRADIENTS.ctr}
                />
                <MetricCard
                  label="转化量"
                  value={m.conversions}
                  gradient={GRADIENTS.conversions}
                />
                <MetricCard
                  label="CVR"
                  value={m.cvr * 100}
                  decimals={2}
                  suffix="%"
                  gradient={GRADIENTS.cvr}
                />
              </div>

              {status === 'running' && (onSimulateClick || onSimulateImpression || onSimulateConversion) && (
                <div style={styles.simulateRow}>
                  <span style={styles.simulateLabel}>模拟交互:</span>
                  {onSimulateImpression && (
                    <button
                      onClick={() => onSimulateImpression(v.id)}
                      style={styles.simBtn}
                    >
                      👁 展示
                    </button>
                  )}
                  {onSimulateClick && (
                    <button
                      onClick={() => onSimulateClick(v.id)}
                      style={styles.simBtn}
                    >
                      👆 点击
                    </button>
                  )}
                  {onSimulateConversion && (
                    <button
                      onClick={() => onSimulateConversion(v.id)}
                      style={{ ...styles.simBtn, ...styles.simBtnPrimary }}
                    >
                      ✅ 转化
                    </button>
                  )}
                </div>
              )}

              {status === 'completed' && !winnerId && (
                <button
                  onClick={() => onSelectWinner(v.id)}
                  style={styles.selectWinnerBtn}
                >
                  🏆 选为胜出版本
                </button>
              )}
            </div>
          );
        })}
      </div>

      {versionData.length > 0 && (
        <div style={styles.actionRow}>
          <div style={styles.statsSummary}>
            <span style={styles.summaryLabel}>总展示量:</span>
            <span style={styles.summaryValue}>
              {formatNumber(versionData.reduce((s, v) => s + (v.metrics?.impressions || 0), 0))}
            </span>
            <span style={styles.summaryLabel}>总点击量:</span>
            <span style={styles.summaryValue}>
              {formatNumber(versionData.reduce((s, v) => s + (v.metrics?.clicks || 0), 0))}
            </span>
            <span style={styles.summaryLabel}>总转化量:</span>
            <span style={styles.summaryValue}>
              {formatNumber(versionData.reduce((s, v) => s + (v.metrics?.conversions || 0), 0))}
            </span>
          </div>
          <button onClick={handleExportCSV} style={styles.exportBtn}>
            📥 导出 CSV 报告
          </button>
        </div>
      )}
    </div>
  );
}

const metricStyles: Record<string, React.CSSProperties> = {
  wrapper: {
    padding: '12px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--glass-border)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  label: {
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  value: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--text-primary)',
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1.1,
    textShadow: '0 0 20px rgba(0, 229, 255, 0.15)',
  },
};

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 18,
    marginBottom: 20,
  },
  card: {
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-xl)',
    padding: 20,
    backdropFilter: 'blur(16px)',
    position: 'relative' as const,
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
  },
  winnerCard: {
    border: '2px solid rgba(0, 240, 192, 0.5)',
    animation: 'winnerGlow 3s ease-in-out infinite',
    background: 'linear-gradient(135deg, rgba(0, 240, 192, 0.06), rgba(0, 229, 255, 0.03))',
  },
  winnerBadge: {
    position: 'absolute' as const,
    top: 14,
    right: 14,
    padding: '5px 12px',
    borderRadius: 20,
    background: 'linear-gradient(135deg, rgba(0, 240, 192, 0.2), rgba(0, 229, 255, 0.1))',
    border: '1px solid rgba(0, 240, 192, 0.4)',
    color: '#00f0c0',
    fontSize: 11,
    fontWeight: 700,
    zIndex: 2,
    backdropFilter: 'blur(8px)',
  },
  cardHeader: {
    marginBottom: 16,
  },
  versionTag: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 6,
    background: 'var(--accent-gradient)',
    color: '#070d1a',
    fontSize: 10,
    fontWeight: 800,
    marginBottom: 10,
    letterSpacing: '0.04em',
  },
  versionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 6,
    lineHeight: 1.3,
  },
  versionDescription: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    marginBottom: 10,
    lineHeight: 1.5,
    display: '-webkit-box' as const,
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  },
  cardImageWrap: {
    width: '100%',
    height: 110,
    borderRadius: 'var(--radius-sm)',
    overflow: 'hidden',
    marginBottom: 10,
    border: '1px solid var(--border-color)',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  ctaRow: {
    marginTop: 2,
  },
  ctaButton: {
    display: 'inline-block',
    padding: '6px 14px',
    borderRadius: 6,
    background: 'var(--accent-gradient)',
    color: '#070d1a',
    fontSize: 11,
    fontWeight: 700,
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
  },
  simulateRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTop: '1px solid var(--border-color)',
    flexWrap: 'wrap' as const,
  },
  simulateLabel: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },
  simBtn: {
    padding: '5px 12px',
    borderRadius: 6,
    border: '1px solid var(--border-color)',
    background: 'rgba(7, 13, 26, 0.5)',
    color: 'var(--text-secondary)',
    fontSize: 11,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  simBtnPrimary: {
    border: '1px solid rgba(0, 240, 192, 0.3)',
    background: 'rgba(0, 240, 192, 0.08)',
    color: '#00f0c0',
  },
  selectWinnerBtn: {
    width: '100%',
    marginTop: 14,
    padding: '10px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid rgba(0, 240, 192, 0.4)',
    background: 'rgba(0, 240, 192, 0.1)',
    color: '#00f0c0',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 20px',
    background: 'var(--glass-bg)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--glass-border)',
    backdropFilter: 'blur(12px)',
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  statsSummary: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap' as const,
  },
  summaryLabel: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--accent-cyan)',
    fontVariantNumeric: 'tabular-nums',
    marginRight: 6,
  },
  exportBtn: {
    padding: '8px 18px',
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
  empty: {
    padding: 40,
    textAlign: 'center' as const,
    color: 'var(--text-muted)',
    fontSize: 14,
  },
};
