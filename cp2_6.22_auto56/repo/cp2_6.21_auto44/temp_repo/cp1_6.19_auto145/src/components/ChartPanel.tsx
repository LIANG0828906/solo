import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { motion } from 'framer-motion';
import { usePortfolioContext } from '../hooks/usePortfolio';
import { SCENARIOS, TIME_PERIODS, type Scenario, type TimePeriod } from '../data/marketData';

export default function ChartPanel() {
  const { results, scenario, setScenario, timePeriod, setTimePeriod, isLoading } =
    usePortfolioContext();
  const [animatedScores, setAnimatedScores] = useState<Record<number, number>>({});
  const prevScoresRef = useRef<Record<number, number>>({});

  useEffect(() => {
    results.forEach((r) => {
      const target = r.riskMetrics.riskScore;
      const prev = prevScoresRef.current[r.portfolio.id] ?? 0;
      const diff = target - prev;
      if (diff === 0) {
        setAnimatedScores((s) => ({ ...s, [r.portfolio.id]: target }));
        return;
      }
      const steps = 20;
      let step = 0;
      const interval = setInterval(() => {
        step++;
        if (step >= steps) {
          setAnimatedScores((s) => ({ ...s, [r.portfolio.id]: target }));
          prevScoresRef.current[r.portfolio.id] = target;
          clearInterval(interval);
        } else {
          setAnimatedScores((s) => ({
            ...s,
            [r.portfolio.id]: Math.round(prev + (diff * step) / steps),
          }));
        }
      }, 20);
    });
  }, [results]);

  const chartData = useMemo(() => {
    if (results.length === 0) return [];
    const maxLen = Math.max(...results.map((r) => r.cumulativeReturns.length));
    const data: Record<string, string | number | null>[] = [];
    for (let i = 0; i < maxLen; i++) {
      const point: Record<string, string | number | null> = {};
      point.date = results[0].cumulativeReturns[i]?.date || '';
      results.forEach((r, idx) => {
        point[`portfolio${idx}`] = r.cumulativeReturns[i]?.value ?? null;
      });
      data.push(point);
    }
    return data;
  }, [results]);

  const radarData = useMemo(() => {
    if (results.length === 0) return [];
    const dimensions = [
      { key: 'industryConcentration' as const, label: '行业集中度' },
      { key: 'stockConcentration' as const, label: '个股集中度' },
      { key: 'volatility' as const, label: '波动率' },
      { key: 'drawdownDepth' as const, label: '回撤深度' },
      { key: 'liquidity' as const, label: '流动性' },
      { key: 'correlation' as const, label: '相关性' },
    ];
    return dimensions.map((dim) => {
      const point: Record<string, string | number> = { dimension: dim.label };
      results.forEach((r, idx) => {
        point[`portfolio${idx}`] = r.riskMetrics.radarData[dim.key];
      });
      return point;
    });
  }, [results]);

  const getRiskColor = (level: string) => {
    if (level === 'low') return '#27AE60';
    if (level === 'medium') return '#F39C12';
    return '#E74C3C';
  };

  const getRiskLabel = (level: string) => {
    if (level === 'low') return '低风险';
    if (level === 'medium') return '中风险';
    return '高风险';
  };

  return (
    <div style={styles.container}>
      <div style={styles.controls}>
        <div style={styles.controlGroup}>
          <span style={styles.controlLabel}>回测时段</span>
          {(
            Object.entries(TIME_PERIODS) as [TimePeriod, (typeof TIME_PERIODS)[TimePeriod]][]
          ).map(([key, val]) => (
            <motion.button
              key={key}
              style={{
                ...styles.controlBtn,
                background: timePeriod === key ? '#6C63FF' : '#1E1E3A',
                color: timePeriod === key ? '#fff' : '#8888AA',
              }}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTimePeriod(key)}
            >
              {val.label}
            </motion.button>
          ))}
        </div>
        <div style={styles.controlGroup}>
          <span style={styles.controlLabel}>市场情境</span>
          {(
            Object.entries(SCENARIOS) as [Scenario, (typeof SCENARIOS)[Scenario]][]
          ).map(([key, val]) => (
            <motion.button
              key={key}
              style={{
                ...styles.controlBtn,
                background: scenario === key ? '#6C63FF' : '#1E1E3A',
                color: scenario === key ? '#fff' : '#8888AA',
              }}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setScenario(key)}
            >
              {val.label}
            </motion.button>
          ))}
        </div>
      </div>

      <div style={styles.chartSection}>
        <h3 style={styles.chartTitle}>累计收益曲线</h3>
        <div style={styles.chartWrapper}>
          {isLoading && (
            <div style={styles.loadingOverlay}>
              <div className="spinner" style={styles.spinner} />
            </div>
          )}
          {results.length === 0 ? (
            <div style={styles.emptyChart}>
              <p style={styles.emptyText}>请先在左侧创建投资组合</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A50" />
                <XAxis
                  dataKey="date"
                  stroke="#555577"
                  tick={{ fontSize: 10, fill: '#8888AA' }}
                  interval={Math.floor(chartData.length / 6)}
                />
                <YAxis
                  stroke="#555577"
                  tick={{ fontSize: 10, fill: '#8888AA' }}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1E1E3A',
                    border: '1px solid #2A2A50',
                    borderRadius: '8px',
                    color: '#D0D0E0',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#8888AA' }}
                />
                {results.map((r, idx) => (
                  <Line
                    key={r.portfolio.id}
                    type="monotone"
                    dataKey={`portfolio${idx}`}
                    name={`组合${idx + 1}`}
                    stroke={r.portfolio.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3, fill: '#fff', stroke: r.portfolio.color, strokeWidth: 2 }}
                    animationDuration={500}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div style={styles.bottomSection}>
        {results.map((r, idx) => {
          const totalReturn =
            r.cumulativeReturns.length > 0
              ? (r.cumulativeReturns[r.cumulativeReturns.length - 1].value / 1000 - 1) * 100
              : 0;
          return (
            <motion.div
              key={r.portfolio.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              style={{ ...styles.resultCard, borderLeft: `4px solid ${r.portfolio.color}` }}
            >
              <div style={styles.resultHeader}>
                <span
                  style={{ color: r.portfolio.color, fontWeight: 700, fontSize: '16px' }}
                >
                  组合 {idx + 1}
                </span>
                <span
                  style={{
                    ...styles.riskBadge,
                    color: getRiskColor(r.riskMetrics.riskLevel),
                    borderColor: getRiskColor(r.riskMetrics.riskLevel),
                  }}
                >
                  {getRiskLabel(r.riskMetrics.riskLevel)}
                </span>
              </div>

              <div style={styles.metricsRow}>
                <div style={styles.metric}>
                  <span style={styles.metricLabel}>总收益</span>
                  <span
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: totalReturn >= 0 ? '#27AE60' : '#E74C3C',
                    }}
                  >
                    {totalReturn >= 0 ? '+' : ''}
                    {totalReturn.toFixed(2)}%
                  </span>
                </div>
                <div style={styles.metric}>
                  <span style={styles.metricLabel}>最大回撤</span>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: '#E74C3C' }}>
                    -{(r.riskMetrics.maxDrawdown * 100).toFixed(2)}%
                  </span>
                </div>
                <div style={styles.metric}>
                  <span style={styles.metricLabel}>年化波动率</span>
                  <span style={{ ...styles.metricValue }}>
                    {(r.riskMetrics.annualizedVolatility * 100).toFixed(2)}%
                  </span>
                </div>
                <div style={styles.metric}>
                  <span style={styles.metricLabel}>夏普比率</span>
                  <span style={{ ...styles.metricValue }}>
                    {r.riskMetrics.sharpeRatio.toFixed(2)}
                  </span>
                </div>
              </div>

              <div style={styles.radarSection}>
                <ResponsiveContainer width={160} height={160}>
                  <RadarChart
                    cx={80}
                    cy={80}
                    outerRadius={70}
                    data={radarData}
                  >
                    <PolarGrid stroke="#2A2A50" />
                    <PolarAngleAxis
                      dataKey="dimension"
                      tick={{ fontSize: 9, fill: '#8888AA' }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name={`组合${idx + 1}`}
                      dataKey={`portfolio${idx}`}
                      stroke={r.portfolio.color}
                      fill={r.portfolio.color}
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
                <div style={styles.riskScoreSection}>
                  <span style={styles.metricLabel}>综合风险评分</span>
                  <motion.span
                    key={`score-${r.portfolio.id}-${r.riskMetrics.riskScore}`}
                    style={{
                      fontSize: '32px',
                      fontWeight: 800,
                      color: getRiskColor(r.riskMetrics.riskLevel),
                    }}
                  >
                    {animatedScores[r.portfolio.id] ?? r.riskMetrics.riskScore}
                  </motion.span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px',
    height: '100%',
    overflowY: 'auto',
  },
  controls: {
    display: 'flex',
    gap: '24px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  controlGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  controlLabel: {
    fontSize: '13px',
    color: '#8888AA',
    marginRight: '4px',
  },
  controlBtn: {
    padding: '6px 14px',
    borderRadius: '6px',
    border: '1px solid #2A2A50',
    fontSize: '13px',
    cursor: 'pointer',
    fontWeight: 500,
  },
  chartSection: {
    marginBottom: '20px',
  },
  chartTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#D0D0E0',
    marginBottom: '12px',
  },
  chartWrapper: {
    position: 'relative',
    background: '#1A1A2E',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #2A2A50',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(15, 15, 30, 0.7)',
    borderRadius: '12px',
    zIndex: 10,
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #2A2A50',
    borderTopColor: '#6C63FF',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  emptyChart: {
    height: '300px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#555577',
    fontSize: '14px',
  },
  bottomSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '16px',
  },
  resultCard: {
    background: '#1E1E3A',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #2A2A50',
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  riskBadge: {
    padding: '2px 10px',
    borderRadius: '12px',
    border: '1px solid',
    fontSize: '12px',
    fontWeight: 600,
  },
  metricsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    marginBottom: '12px',
  },
  metric: {
    display: 'flex',
    flexDirection: 'column',
  },
  metricLabel: {
    fontSize: '11px',
    color: '#8888AA',
    marginBottom: '2px',
  },
  metricValue: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#D0D0E0',
  },
  radarSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  riskScoreSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
};
