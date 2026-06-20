import { useState, useEffect, useRef } from 'react';
import { Strategy, BacktestResult, BacktestRequest } from '../types';

interface BacktestPanelProps {
  strategy: Strategy;
  onBacktestComplete: (result: BacktestResult) => void;
  isInComparison: boolean;
  onToggleComparison: () => void;
}

function BacktestPanel({
  strategy,
  onBacktestComplete,
  isInComparison,
  onToggleComparison,
}: BacktestPanelProps) {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 3);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [initialCapital, setInitialCapital] = useState(1000000);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [visibleMetrics, setVisibleMetrics] = useState<boolean[]>([]);
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setResult(null);
    setVisibleMetrics([]);
  }, [strategy.id]);

  const handleRunBacktest = async () => {
    setIsLoading(true);
    setResult(null);
    setVisibleMetrics([]);

    try {
      const requestData: BacktestRequest = {
        strategyId: strategy.id,
        startDate,
        endDate,
        initialCapital,
      };

      const res = await fetch('/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (res.ok) {
        const data: BacktestResult = await res.json();
        setResult(data);
        onBacktestComplete(data);

        const metricsCount = 8;
        for (let i = 0; i < metricsCount; i++) {
          setTimeout(() => {
            setVisibleMetrics((prev) => {
              const next = [...prev];
              next[i] = true;
              return next;
            });
          }, i * 80);
        }
      }
    } catch (error) {
      console.error('回测失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (result && chartRef.current) {
      drawChart();
    }
  }, [result]);

  const drawChart = () => {
    const canvas = chartRef.current;
    if (!canvas || !result) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 20, bottom: 30, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    const data = result.history;
    const minValue = Math.min(...data.map((d) => d.value)) * 0.95;
    const maxValue = Math.max(...data.map((d) => d.value)) * 1.05;

    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#8c8c8c';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const y = padding.top + (chartHeight / yTicks) * i;
      const value = maxValue - ((maxValue - minValue) / yTicks) * i;

      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      ctx.fillText(formatNumber(value), padding.left - 8, y);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const xTickCount = Math.min(6, data.length);
    for (let i = 0; i < xTickCount; i++) {
      const index = Math.floor(((data.length - 1) / (xTickCount - 1)) * i);
      const x = padding.left + (chartWidth / (data.length - 1)) * index;
      const date = data[index].date;
      ctx.fillText(date.substring(5), x, height - padding.bottom + 8);
    }

    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, 'rgba(24, 144, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(24, 144, 255, 0.05)');

    ctx.beginPath();
    data.forEach((point, index) => {
      const x = padding.left + (chartWidth / (data.length - 1)) * index;
      const y =
        padding.top +
        chartHeight -
        ((point.value - minValue) / (maxValue - minValue)) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.lineTo(padding.left + chartWidth, height - padding.bottom);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    data.forEach((point, index) => {
      const x = padding.left + (chartWidth / (data.length - 1)) * index;
      const y =
        padding.top +
        chartHeight -
        ((point.value - minValue) / (maxValue - minValue)) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.strokeStyle = '#1890ff';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'none';
    ctx.stroke();

    if (data.length > 0) {
      const lastPoint = data[data.length - 1];
      const x = padding.left + chartWidth;
      const y =
        padding.top +
        chartHeight -
        ((lastPoint.value - minValue) / (maxValue - minValue)) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#1890ff';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(0) + '万';
    }
    return num.toFixed(0);
  };

  const metrics = result
    ? [
        { label: '年化收益率', value: `${result.annualReturn.toFixed(2)}%`, positive: result.annualReturn > 0 },
        { label: '累计收益', value: `${result.totalReturn.toFixed(2)}%`, positive: result.totalReturn > 0 },
        { label: '最终资金', value: formatNumber(result.finalCapital) + ' 元', positive: result.finalCapital > initialCapital },
        { label: '最大回撤', value: `-${result.maxDrawdown.toFixed(2)}%`, positive: false },
        { label: '夏普比率', value: result.sharpeRatio.toFixed(2), positive: result.sharpeRatio > 1 },
        { label: '胜率', value: `${result.winRate.toFixed(2)}%`, positive: result.winRate > 50 },
        { label: '交易次数', value: result.tradeCount.toString(), positive: true },
        { label: '初始资金', value: formatNumber(initialCapital) + ' 元', positive: true },
      ]
    : [];

  return (
    <div className="backtest-panel">
      <div className="backtest-header">
        <h2>{strategy.name}</h2>
        <button
          className={`btn ${isInComparison ? 'btn-secondary' : 'btn-default'}`}
          onClick={onToggleComparison}
          disabled={!isInComparison && (result ? false : true)}
        >
          {isInComparison ? '✓ 已加入对比' : '加入对比'}
        </button>
      </div>

      <div className="backtest-form-section">
        <div className="form-section-title">回测参数设置</div>

        <div className="form-row">
          <div className="form-group">
            <label>开始日期</label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>结束日期</label>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>初始资金（元）</label>
            <input
              type="number"
              className="form-input"
              value={initialCapital}
              onChange={(e) => setInitialCapital(parseFloat(e.target.value) || 0)}
              min="10000"
              step="10000"
            />
          </div>
          <div className="form-group">
            <label>基准指数</label>
            <input type="text" className="form-input" value={strategy.benchmark} disabled />
          </div>
        </div>

        <div className="form-group">
          <label>投资标的（{strategy.targets.length}只）</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {strategy.targets.map((t) => (
              <span
                key={t}
                style={{
                  padding: '3px 10px',
                  background: '#f0f5ff',
                  color: '#1890ff',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <button
          className="btn btn-primary run-backtest-btn"
          onClick={handleRunBacktest}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="loading-spinner spin" />
              回测中...
            </>
          ) : (
            '▶ 运行回测'
          )}
        </button>
      </div>

      {result && (
        <div className="results-section">
          <div className="section-title">回测结果</div>

          <div className="metrics-grid">
            {metrics.map((metric, index) => (
              <div
                key={metric.label}
                className={`metric-card ${visibleMetrics[index] ? 'visible' : ''}`}
              >
                <div className="metric-label">{metric.label}</div>
                <div className={`metric-value ${metric.positive ? 'positive' : 'negative'}`}>
                  {metric.value}
                </div>
              </div>
            ))}
          </div>

          <div className="chart-container">
            <div className="chart-title">资金曲线</div>
            <canvas ref={chartRef} className="chart-canvas" />
          </div>
        </div>
      )}
    </div>
  );
}

export default BacktestPanel;
