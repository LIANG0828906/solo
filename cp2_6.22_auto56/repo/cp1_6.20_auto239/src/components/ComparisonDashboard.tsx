import { useState, useEffect, useRef } from 'react';
import { Strategy, BacktestResult } from '../types';

interface ComparisonDashboardProps {
  strategies: Strategy[];
  backtestResults: BacktestResult[];
  onBack: () => void;
}

const COLORS = ['#1890ff', '#52c41a', '#fa8c16', '#722ed1'];

function ComparisonDashboard({ strategies, backtestResults, onBack }: ComparisonDashboardProps) {
  const radarRef = useRef<HTMLCanvasElement>(null);
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    setAnimationProgress(0);
    const startTime = Date.now();
    const duration = 500;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setAnimationProgress(easeProgress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [backtestResults.length]);

  useEffect(() => {
    if (radarRef.current && backtestResults.length > 0) {
      drawRadarChart();
    }
  }, [backtestResults, animationProgress]);

  const drawRadarChart = () => {
    const canvas = radarRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) * 0.65;

    ctx.clearRect(0, 0, width, height);

    const dimensions = ['年化收益', '夏普比率', '最大回撤', '胜率', '交易次数'];
    const angles = dimensions.map((_, i) => (Math.PI * 2 * i) / dimensions.length - Math.PI / 2);

    const levels = 5;
    for (let level = 1; level <= levels; level++) {
      const r = (radius * level) / levels;
      ctx.beginPath();
      ctx.strokeStyle = '#e8e8e8';
      ctx.lineWidth = 1;

      for (let i = 0; i < dimensions.length; i++) {
        const x = centerX + r * Math.cos(angles[i]);
        const y = centerY + r * Math.sin(angles[i]);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.stroke();
    }

    angles.forEach((angle) => {
      ctx.beginPath();
      ctx.strokeStyle = '#e8e8e8';
      ctx.lineWidth = 1;
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
      ctx.stroke();
    });

    ctx.fillStyle = '#595959';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    dimensions.forEach((dim, i) => {
      const angle = angles[i];
      const labelRadius = radius + 25;
      const x = centerX + labelRadius * Math.cos(angle);
      const y = centerY + labelRadius * Math.sin(angle);
      ctx.fillText(dim, x, y);
    });

    const maxValues = {
      annualReturn: 50,
      sharpeRatio: 3,
      maxDrawdown: 40,
      winRate: 100,
      tradeCount: 200,
    };

    backtestResults.forEach((result, resultIndex) => {
      const values = [
        Math.min(result.annualReturn / maxValues.annualReturn, 1),
        Math.min(result.sharpeRatio / maxValues.sharpeRatio, 1),
        Math.min(result.maxDrawdown / maxValues.maxDrawdown, 1),
        Math.min(result.winRate / maxValues.winRate, 1),
        Math.min(result.tradeCount / maxValues.tradeCount, 1),
      ];

      ctx.beginPath();
      values.forEach((value, i) => {
        const r = radius * value * animationProgress;
        const x = centerX + r * Math.cos(angles[i]);
        const y = centerY + r * Math.sin(angles[i]);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.closePath();

      ctx.fillStyle = COLORS[resultIndex % COLORS.length] + '20';
      ctx.fill();

      ctx.strokeStyle = COLORS[resultIndex % COLORS.length];
      ctx.lineWidth = 2;
      ctx.stroke();

      values.forEach((value, i) => {
        const r = radius * value * animationProgress;
        const x = centerX + r * Math.cos(angles[i]);
        const y = centerY + r * Math.sin(angles[i]);

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = COLORS[resultIndex % COLORS.length];
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    });
  };

  const metrics = [
    { key: 'annualReturn', label: '年化收益率', suffix: '%', higherIsBetter: true },
    { key: 'totalReturn', label: '累计收益', suffix: '%', higherIsBetter: true },
    { key: 'finalCapital', label: '最终资金', suffix: ' 元', higherIsBetter: true, format: true },
    { key: 'maxDrawdown', label: '最大回撤', prefix: '-', suffix: '%', higherIsBetter: false },
    { key: 'sharpeRatio', label: '夏普比率', higherIsBetter: true },
    { key: 'winRate', label: '胜率', suffix: '%', higherIsBetter: true },
    { key: 'tradeCount', label: '交易次数', higherIsBetter: true },
  ];

  const getBestValue = (key: string) => {
    const values = backtestResults.map((r) => r[key as keyof BacktestResult] as number);
    const metric = metrics.find((m) => m.key === key);
    if (metric?.higherIsBetter) {
      return Math.max(...values);
    } else {
      return Math.min(...values);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(2) + '万';
    }
    return num.toFixed(2);
  };

  return (
    <div className="comparison-dashboard">
      <div className="comparison-header">
        <h2>策略对比分析</h2>
        <button className="back-btn" onClick={onBack}>
          ← 返回
        </button>
      </div>

      {backtestResults.length < 2 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <h2>请选择至少2个策略进行对比</h2>
          <p>请先对策略进行回测，然后加入对比</p>
        </div>
      ) : (
        <>
          <div className="comparison-table-section">
            <div className="section-title" style={{ marginBottom: '16px' }}>
              指标对比
            </div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {backtestResults.map((result, index) => (
                <div
                  key={result.strategyId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                  }}
                >
                  <span
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: COLORS[index % COLORS.length],
                    }}
                  />
                  <span style={{ color: '#595959' }}>{result.strategyName}</span>
                </div>
              ))}
            </div>
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>指标</th>
                  {backtestResults.map((result) => (
                    <th key={result.strategyId}>{result.strategyName}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric) => {
                  const bestValue = getBestValue(metric.key);
                  return (
                    <tr key={metric.key}>
                      <td style={{ fontWeight: 500 }}>{metric.label}</td>
                      {backtestResults.map((result) => {
                        const value = result[metric.key as keyof BacktestResult] as number;
                        const isBest = value === bestValue;
                        const displayValue = metric.format
                          ? formatNumber(value)
                          : value.toFixed(2);
                        return (
                          <td key={result.strategyId} className={isBest ? 'highlight-best' : ''}>
                            {metric.prefix || ''}
                            {displayValue}
                            {metric.suffix || ''}
                            {isBest && ' ✓'}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="radar-section">
            <div className="section-title" style={{ marginBottom: '16px' }}>
              雷达图对比
            </div>
            <canvas ref={radarRef} className="radar-canvas" />
          </div>
        </>
      )}
    </div>
  );
}

export default ComparisonDashboard;
