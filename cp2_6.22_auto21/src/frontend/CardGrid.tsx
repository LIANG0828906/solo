import { useEffect, useRef, useState } from 'react';
import { Eye, MousePointerClick, Target, TrendingUp, Trophy, Download, Crown } from 'lucide-react';
import { ExperimentData, AdMetrics } from './types';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  suffix?: string;
  duration?: number;
}

const AnimatedNumber = ({ value, decimals = 0, suffix = '', duration = 600 }: AnimatedNumberProps) => {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = prevValueRef.current;
    const endValue = value;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * easeProgress;
      setDisplayValue(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        prevValueRef.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [value, duration]);

  return (
    <span style={styles.metricValue}>
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  );
};

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  gradient: string;
}

const MetricCard = ({ icon, label, value, decimals = 0, suffix = '', gradient }: MetricCardProps) => (
  <div style={{
    ...styles.metricCard,
    background: `linear-gradient(135deg, ${gradient})`,
  }}>
    <div style={styles.metricIcon}>{icon}</div>
    <div style={styles.metricContent}>
      <span style={styles.metricLabel}>{label}</span>
      <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
    </div>
  </div>
);

interface CardGridProps {
  experiment: ExperimentData;
  onSetWinner: (versionId: string) => void;
}

const CardGrid = ({ experiment, onSetWinner }: CardGridProps) => {
  const [exporting, setExporting] = useState(false);

  const getMetrics = (versionId: string): AdMetrics => {
    return experiment.metrics[versionId] || {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      cvr: 0,
    };
  };

  const exportCSV = () => {
    setExporting(true);
    const headers = ['版本', '标题', '展示量', '点击量', 'CTR(%)', '转化量', 'CVR(%)', '流量分配(%)'];
    const rows = experiment.versions.map((v) => {
      const m = getMetrics(v.id);
      return [
        v.id.slice(0, 8),
        v.title,
        m.impressions,
        m.clicks,
        m.ctr.toFixed(2),
        m.conversions,
        m.cvr.toFixed(2),
        experiment.trafficAllocation[v.id] || 0,
      ];
    });
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `experiment_${experiment.id.slice(0, 8)}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setTimeout(() => setExporting(false), 500);
  };

  const gradients = [
    'rgba(0,229,255,0.15), rgba(0,180,216,0.08)',
    'rgba(0,212,170,0.15), rgba(0,180,150,0.08)',
    'rgba(139,92,246,0.15), rgba(99,102,241,0.08)',
    'rgba(251,146,60,0.15), rgba(249,115,22,0.08)',
    'rgba(236,72,153,0.15), rgba(219,39,119,0.08)',
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>
          <TrendingUp size={20} style={{ color: '#00e5ff' }} />
          广告版本效果对比
        </h2>
        <button onClick={exportCSV} style={styles.exportBtn} disabled={exporting}>
          <Download size={16} />
          {exporting ? '导出中...' : '导出 CSV'}
        </button>
      </div>

      <div style={styles.grid}>
        {experiment.versions.map((version, idx) => {
          const metrics = getMetrics(version.id);
          const isWinner = experiment.winner === version.id;
          const gradient = gradients[idx % gradients.length];
          const allocation = experiment.trafficAllocation[version.id] || 0;

          return (
            <div
              key={version.id}
              style={{
                ...styles.card,
                ...(isWinner ? styles.cardWinner : {}),
                animation: 'fadeInUp 0.5s ease-out',
                animationDelay: `${idx * 0.1}s`,
              }}
            >
              {isWinner && (
                <div style={styles.winnerBadge}>
                  <Crown size={14} />
                  胜出版本
                </div>
              )}

              <div style={styles.cardHeader}>
                <div style={styles.previewWrap}>
                  {version.imageUrl && (
                    <img
                      src={version.imageUrl}
                      alt={version.title}
                      style={styles.previewImg}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>
                <div style={styles.cardHeaderInfo}>
                  <div style={styles.versionLabel}>版本 {String.fromCharCode(65 + idx)}</div>
                  <h3 style={styles.cardTitle}>{version.title}</h3>
                  <p style={styles.cardDesc}>{version.description}</p>
                </div>
              </div>

              <div style={styles.allocationBar}>
                <div style={styles.allocationLabel}>
                  <span>流量分配</span>
                  <span style={styles.allocationValue}>{allocation}%</span>
                </div>
                <div style={styles.allocationTrack}>
                  <div
                    style={{
                      ...styles.allocationFill,
                      width: `${allocation}%`,
                      background: `linear-gradient(90deg, ${gradient})`,
                    }}
                  />
                </div>
              </div>

              <div style={styles.metricsGrid}>
                <MetricCard
                  icon={<Eye size={18} />}
                  label="展示量"
                  value={metrics.impressions}
                  gradient={gradient}
                />
                <MetricCard
                  icon={<MousePointerClick size={18} />}
                  label="点击量"
                  value={metrics.clicks}
                  gradient={gradient}
                />
                <MetricCard
                  icon={<TrendingUp size={18} />}
                  label="CTR"
                  value={metrics.ctr}
                  decimals={2}
                  suffix="%"
                  gradient={gradient}
                />
                <MetricCard
                  icon={<Target size={18} />}
                  label="转化量"
                  value={metrics.conversions}
                  gradient={gradient}
                />
              </div>

              <div style={styles.cardFooter}>
                <div style={styles.cvrWrap}>
                  <span style={styles.cvrLabel}>转化率 CVR</span>
                  <span style={{
                    ...styles.cvrValue,
                    background: `linear-gradient(135deg, ${gradient})`,
                  }}>
                    <AnimatedNumber value={metrics.cvr} decimals={2} suffix="%" />
                  </span>
                </div>
                {experiment.status !== 'running' && !experiment.winner && (
                  <button
                    onClick={() => onSetWinner(version.id)}
                    style={styles.setWinnerBtn}
                  >
                    <Trophy size={14} />
                    设为胜出
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: 'rgba(15, 31, 56, 0.4)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(0, 229, 255, 0.08)',
    backdropFilter: 'blur(20px)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: 0,
  },
  exportBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    background: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(0,212,170,0.1))',
    border: '1px solid rgba(0,229,255,0.25)',
    color: '#00e5ff',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '20px',
  },
  card: {
    background: 'rgba(10, 22, 40, 0.6)',
    borderRadius: '14px',
    padding: '20px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    position: 'relative',
    transition: 'all 0.3s ease',
  },
  cardWinner: {
    borderColor: 'rgba(0, 212, 170, 0.4)',
    animation: 'glowPulse 2s ease-in-out infinite',
  },
  winnerBadge: {
    position: 'absolute',
    top: '-10px',
    right: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 12px',
    background: 'linear-gradient(135deg, #00d4aa, #00b4d8)',
    color: '#0a1628',
    fontSize: '12px',
    fontWeight: 700,
    borderRadius: '12px',
  },
  cardHeader: {
    display: 'flex',
    gap: '14px',
    marginBottom: '16px',
  },
  previewWrap: {
    width: '72px',
    height: '72px',
    borderRadius: '10px',
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.04)',
    flexShrink: 0,
  },
  previewImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  cardHeaderInfo: {
    flex: 1,
    minWidth: 0,
  },
  versionLabel: {
    display: 'inline-block',
    padding: '2px 8px',
    background: 'rgba(0,229,255,0.1)',
    color: '#00e5ff',
    fontSize: '11px',
    fontWeight: 600,
    borderRadius: '4px',
    marginBottom: '6px',
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#fff',
    margin: '0 0 4px 0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cardDesc: {
    fontSize: '12px',
    color: '#64748b',
    margin: 0,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  allocationBar: {
    marginBottom: '16px',
  },
  allocationLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#64748b',
    marginBottom: '6px',
  },
  allocationValue: {
    color: '#00e5ff',
    fontWeight: 600,
    fontFamily: 'monospace',
  },
  allocationTrack: {
    height: '6px',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  allocationFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.5s ease',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    marginBottom: '16px',
  },
  metricCard: {
    padding: '12px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    border: '1px solid rgba(255,255,255,0.04)',
  },
  metricIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#00e5ff',
    flexShrink: 0,
  },
  metricContent: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  metricLabel: {
    fontSize: '11px',
    color: '#64748b',
    marginBottom: '2px',
  },
  metricValue: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#fff',
    fontFamily: 'monospace',
    lineHeight: 1.2,
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255,255,255,0.04)',
  },
  cvrWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  cvrLabel: {
    fontSize: '11px',
    color: '#64748b',
  },
  cvrValue: {
    padding: '6px 14px',
    borderRadius: '8px',
    fontSize: '20px',
    fontWeight: 700,
    color: '#fff',
    fontFamily: 'monospace',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  setWinnerBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    background: 'rgba(0,212,170,0.15)',
    border: '1px solid rgba(0,212,170,0.3)',
    color: '#00d4aa',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};

export default CardGrid;
