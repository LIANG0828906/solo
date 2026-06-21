import React, { useState, useEffect, useRef } from 'react';

interface AdVersion {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  trafficPercentage: number;
  createdAt: number;
  history: any[];
}

interface Metrics {
  impressions: number;
  clicks: number;
  conversions: number;
}

interface ExperimentState {
  id: string;
  name: string;
  status: 'draft' | 'running' | 'completed';
  versions: AdVersion[];
  metrics: Record<string, Metrics>;
  historyData: Record<string, { timestamp: number; metrics: Metrics }[]>;
  startTime: number | null;
  durationHours: number;
}

interface CardGridProps {
  experiment: ExperimentState;
  winnerId: string | null;
  onSelectWinner: (id: string | null) => void;
}

const AnimatedNumber: React.FC<{ value: number; decimals?: number }> = ({ value, decimals = 0 }) => {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const rafRef = useRef<number>();

  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    const duration = 600;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (end - start) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevRef.current = end;
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  return <span>{display.toFixed(decimals)}</span>;
};

const CardGrid: React.FC<CardGridProps> = ({ experiment, winnerId, onSelectWinner }) => {
  const [fadingCards, setFadingCards] = useState<Set<string>>(new Set());
  const prevMetricsRef = useRef<Record<string, Metrics>>({});

  useEffect(() => {
    const newFading = new Set<string>();
    experiment.versions.forEach(v => {
      const prev = prevMetricsRef.current[v.id];
      const curr = experiment.metrics[v.id];
      if (prev && (prev.impressions !== curr?.impressions || prev.clicks !== curr?.clicks)) {
        newFading.add(v.id);
      }
    });
    if (newFading.size > 0) {
      setFadingCards(newFading);
      setTimeout(() => setFadingCards(new Set()), 500);
    }
    prevMetricsRef.current = { ...experiment.metrics };
  }, [experiment]);

  const exportCSV = () => {
    const headers = ['版本', '标题', '展示量', '点击量', 'CTR(%)', '转化量', 'CVR(%)', '流量占比(%)'];
    const rows = experiment.versions.map(v => {
      const m = experiment.metrics[v.id] || { impressions: 0, clicks: 0, conversions: 0 };
      const ctr = m.impressions > 0 ? (m.clicks / m.impressions * 100).toFixed(2) : '0.00';
      const cvr = m.clicks > 0 ? (m.conversions / m.clicks * 100).toFixed(2) : '0.00';
      return [v.id.slice(0, 8), v.title, m.impressions, m.clicks, ctr, m.conversions, cvr, v.trafficPercentage];
    });

    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `experiment_${experiment.id.slice(0, 8)}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (experiment.versions.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p style={{ color: '#94a3b8' }}>暂无广告版本，请先在"创意工坊"中创建版本</p>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.cardHeader}>
        <h2 style={styles.sectionTitle}>实时效果指标</h2>
        {experiment.status !== 'draft' && (
          <button style={styles.exportBtn} onClick={exportCSV}>
            📥 导出CSV
          </button>
        )}
      </div>

      <div style={styles.grid}>
        {experiment.versions.map((v, idx) => {
          const m = experiment.metrics[v.id] || { impressions: 0, clicks: 0, conversions: 0 };
          const ctr = m.impressions > 0 ? (m.clicks / m.impressions * 100) : 0;
          const cvr = m.clicks > 0 ? (m.conversions / m.clicks * 100) : 0;
          const isWinner = winnerId === v.id;
          const isFading = fadingCards.has(v.id);

          const gradientColors = [
            ['#0ea5e9', '#06b6d4'],
            ['#10b981', '#14b8a6'],
            ['#f59e0b', '#f97316'],
            ['#8b5cf6', '#6366f1'],
            ['#ec4899', '#f43f5e']
          ];
          const [gc1, gc2] = gradientColors[idx % gradientColors.length];

          return (
            <div
              key={v.id}
              style={{
                ...styles.card,
                ...(isWinner ? styles.cardWinner : {}),
                opacity: isFading ? 0.7 : 1,
                transition: 'opacity 0.5s ease, transform 0.3s ease'
              }}
              onClick={() => experiment.status === 'completed' && onSelectWinner(isWinner ? null : v.id)}
            >
              {isWinner && (
                <div style={styles.winnerBadge}>🏆 胜出版本</div>
              )}

              <div style={styles.cardPreview}>
                {v.imageUrl && (
                  <img src={v.imageUrl} alt={v.title} style={styles.previewImg} />
                )}
                <div style={styles.previewInfo}>
                  <h3 style={styles.previewTitle}>{v.title}</h3>
                  <p style={styles.previewDesc}>{v.description}</p>
                  <div style={styles.previewCTA}>
                    <span style={styles.ctaBadge}>{v.ctaText}</span>
                    {v.trafficPercentage > 0 && (
                      <span style={styles.trafficBadge}>流量: {v.trafficPercentage}%</span>
                    )}
                  </div>
                </div>
              </div>

              <div style={styles.metricsGrid}>
                <div style={{
                  ...styles.metricBlock,
                  background: `linear-gradient(135deg, ${gc1}22, ${gc2}22)`,
                  borderLeft: `3px solid ${gc1}`
                }}>
                  <div style={styles.metricLabel}>展示量</div>
                  <div style={{ ...styles.metricValue, color: gc2 }}>
                    <AnimatedNumber value={m.impressions} />
                  </div>
                </div>

                <div style={{
                  ...styles.metricBlock,
                  background: `linear-gradient(135deg, ${gc1}22, ${gc2}22)`,
                  borderLeft: `3px solid ${gc1}`
                }}>
                  <div style={styles.metricLabel}>点击量</div>
                  <div style={{ ...styles.metricValue, color: gc2 }}>
                    <AnimatedNumber value={m.clicks} />
                  </div>
                </div>

                <div style={{
                  ...styles.metricBlock,
                  background: `linear-gradient(135deg, ${gc1}22, ${gc2}22)`,
                  borderLeft: `3px solid ${gc1}`
                }}>
                  <div style={styles.metricLabel}>点击率 (CTR)</div>
                  <div style={{ ...styles.metricValue, color: gc2 }}>
                    <AnimatedNumber value={ctr} decimals={2} />%
                  </div>
                </div>

                <div style={{
                  ...styles.metricBlock,
                  background: `linear-gradient(135deg, ${gc1}22, ${gc2}22)`,
                  borderLeft: `3px solid ${gc1}`
                }}>
                  <div style={styles.metricLabel}>转化量</div>
                  <div style={{ ...styles.metricValue, color: gc2 }}>
                    <AnimatedNumber value={m.conversions} />
                  </div>
                </div>

                <div style={{
                  ...styles.metricBlock,
                  ...styles.metricBlockWide,
                  background: `linear-gradient(135deg, ${gc1}33, ${gc2}33)`,
                  borderLeft: `3px solid ${gc1}`
                }}>
                  <div style={styles.metricLabel}>转化率 (CVR)</div>
                  <div style={{ ...styles.metricValue, ...styles.metricValueLarge, color: gc2 }}>
                    <AnimatedNumber value={cvr} decimals={2} />%
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  sectionTitle: {
    margin: 0,
    fontSize: '1.25rem',
    color: '#22d3ee'
  },
  exportBtn: {
    padding: '0.625rem 1.25rem',
    borderRadius: '8px',
    border: '1px solid rgba(52, 211, 153, 0.3)',
    background: 'rgba(52, 211, 153, 0.1)',
    color: '#34d399',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500
  },
  emptyState: {
    padding: '3rem',
    textAlign: 'center',
    background: 'rgba(15, 40, 71, 0.4)',
    borderRadius: '16px',
    border: '1px dashed rgba(34, 211, 238, 0.2)'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '1.25rem'
  },
  card: {
    background: 'rgba(15, 40, 71, 0.6)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(34, 211, 238, 0.15)',
    borderRadius: '16px',
    padding: '1.25rem',
    position: 'relative',
    cursor: 'default',
    animation: 'fadeIn 0.4s ease'
  },
  cardWinner: {
    border: '2px solid #fbbf24',
    boxShadow: '0 0 30px rgba(251, 191, 36, 0.3)',
    cursor: 'pointer'
  },
  winnerBadge: {
    position: 'absolute',
    top: '-10px',
    right: '1rem',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: 'white',
    padding: '0.25rem 0.75rem',
    borderRadius: '999px',
    fontSize: '0.75rem',
    fontWeight: 600
  },
  cardPreview: {
    display: 'flex',
    gap: '0.875rem',
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
  },
  previewImg: {
    width: '80px',
    height: '80px',
    borderRadius: '10px',
    objectFit: 'cover',
    flexShrink: 0
  },
  previewInfo: {
    flex: 1,
    minWidth: 0
  },
  previewTitle: {
    margin: 0,
    fontSize: '0.95rem',
    color: '#e2e8f0',
    fontWeight: 600,
    lineHeight: 1.3
  },
  previewDesc: {
    margin: '0.375rem 0',
    fontSize: '0.75rem',
    color: '#94a3b8',
    lineHeight: 1.4,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  previewCTA: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.5rem'
  },
  ctaBadge: {
    padding: '0.125rem 0.5rem',
    background: 'rgba(34, 211, 238, 0.15)',
    border: '1px solid rgba(34, 211, 238, 0.3)',
    borderRadius: '6px',
    color: '#22d3ee',
    fontSize: '0.7rem',
    fontWeight: 500
  },
  trafficBadge: {
    padding: '0.125rem 0.5rem',
    background: 'rgba(52, 211, 153, 0.15)',
    border: '1px solid rgba(52, 211, 153, 0.3)',
    borderRadius: '6px',
    color: '#34d399',
    fontSize: '0.7rem',
    fontWeight: 500
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.625rem'
  },
  metricBlock: {
    padding: '0.75rem',
    borderRadius: '10px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.05)'
  },
  metricBlockWide: {
    gridColumn: 'span 2'
  },
  metricLabel: {
    fontSize: '0.7rem',
    color: '#94a3b8',
    marginBottom: '0.25rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  metricValue: {
    fontSize: '1.35rem',
    fontWeight: 700,
    fontFamily: 'ui-monospace, SFMono-Regular, monospace'
  },
  metricValueLarge: {
    fontSize: '1.75rem'
  }
};

export default CardGrid;
