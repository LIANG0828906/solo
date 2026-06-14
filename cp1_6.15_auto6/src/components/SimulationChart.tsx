import { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { DiscountRule, Product } from '../data/mockData';

const styles = `
  .sim-container {}
  .sim-controls {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin-bottom: 18px;
  }
  .sim-control {
    background: #f8faff;
    border-radius: 10px;
    padding: 14px;
    border: 1px solid #e8eff8;
  }
  .sim-control-label {
    font-size: 12px;
    color: #7f8c8d;
    margin-bottom: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .sim-control-value {
    font-weight: 700;
    color: #1A73E8;
    font-size: 14px;
  }
  .sim-slider {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: #dbe8f8;
    outline: none;
    -webkit-appearance: none;
    appearance: none;
  }
  .sim-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1A73E8, #2E86F5);
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(26, 115, 232, 0.4);
    transition: transform 0.15s;
  }
  .sim-slider::-webkit-slider-thumb:hover { transform: scale(1.15); }
  .sim-slider::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1A73E8, #2E86F5);
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 8px rgba(26, 115, 232, 0.4);
  }
  .sim-summary {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }
  .sim-stat {
    background: linear-gradient(135deg, #ffffff, #f8fbff);
    border-radius: 12px;
    padding: 16px;
    border: 1px solid #e8eff8;
    position: relative;
    overflow: hidden;
  }
  .sim-stat::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, #1A73E8, #5DADE2);
  }
  .sim-stat-label {
    font-size: 11px;
    color: #95a5a6;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }
  .sim-stat-value {
    font-size: 22px;
    font-weight: 700;
    color: #1a1a2e;
    letter-spacing: -0.5px;
  }
  .sim-stat-change {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 12px;
    margin-top: 6px;
  }
  .sim-stat-change.up {
    background: #e8f8ef;
    color: #27ae60;
  }
  .sim-stat-change.down {
    background: #fdf0ef;
    color: #e74c3c;
  }
  .chart-container {
    background: white;
    border-radius: 12px;
    padding: 16px;
    border: 1px solid #eef4fb;
  }
  .chart-tabs {
    display: flex;
    gap: 6px;
    margin-bottom: 14px;
  }
  .chart-tab {
    padding: 7px 14px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    color: #7f8c8d;
    transition: all 0.15s;
    background: transparent;
    border: none;
  }
  .chart-tab:hover { color: #1A73E8; background: #f0f6ff; }
  .chart-tab.active {
    background: #1A73E8;
    color: white;
    box-shadow: 0 2px 8px rgba(26, 115, 232, 0.3);
  }
  .chart-hint {
    font-size: 11px;
    color: #95a5a6;
    margin-top: 10px;
    text-align: center;
  }
  .scenario-tips {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 16px;
  }
  .tip-card {
    padding: 12px;
    border-radius: 10px;
    font-size: 12px;
    background: #fffbf0;
    border-left: 3px solid #f39c12;
  }
  .tip-card.positive {
    background: #f0faf4;
    border-left-color: #27ae60;
  }
  .tip-title {
    font-weight: 600;
    color: #1a1a2e;
    margin-bottom: 4px;
    font-size: 13px;
  }
  .tip-text { color: #5a6c7d; line-height: 1.6; }
  .loading-spinner {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: #95a5a6;
    font-size: 14px;
  }
  .spinner {
    width: 24px; height: 24px;
    border: 3px solid #e0e8f2;
    border-top-color: #1A73E8;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-right: 12px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (max-width: 900px) {
    .sim-controls { grid-template-columns: 1fr; }
    .sim-summary { grid-template-columns: 1fr 1fr; }
    .scenario-tips { grid-template-columns: 1fr; }
  }
`;

interface SimParams {
  startTime: string;
  endTime: string;
  discountType: 'full_reduction' | 'percentage' | 'buy_gift';
  rules: DiscountRule[];
  products: Product[];
}

interface Props {
  params: SimParams;
  onParamsUpdate?: (params: SimParams & { trafficGrowth: number; conversionRate: number; avgOrderValue: number }) => void;
}

interface PredictionPoint {
  date: string;
  orders: number;
  revenue: number;
  profit: number;
  baseline_orders?: number;
  baseline_revenue?: number;
  baseline_profit?: number;
}

const SimulationChart = ({ params, onParamsUpdate }: Props) => {
  const [trafficGrowth, setTrafficGrowth] = useState(20);
  const [conversionRate, setConversionRate] = useState(8);
  const [avgOrderValue, setAvgOrderValue] = useState(280);
  const [data, setData] = useState<PredictionPoint[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'revenue' | 'orders' | 'profit'>('revenue');

  useEffect(() => {
    let debounce: any;
    debounce = setTimeout(fetchPrediction, 150);
    return () => clearTimeout(debounce);
  }, [params, trafficGrowth, conversionRate, avgOrderValue]);

  const fetchPrediction = async () => {
    if (!params.startTime || !params.endTime) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/simulation/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          trafficGrowth: trafficGrowth / 100,
          conversionRate: conversionRate / 100,
          avgOrderValue,
        }),
      });
      const result = await res.json();
      if (result.predictions && result.baseline) {
        const merged = result.predictions.map((p: any, idx: number) => ({
          date: p.date.slice(5),
          orders: p.orders,
          revenue: p.revenue,
          profit: p.profit,
          baseline_orders: result.baseline[idx]?.orders,
          baseline_revenue: result.baseline[idx]?.revenue,
          baseline_profit: result.baseline[idx]?.profit,
        }));
        setData(merged);
        setSummary(result.summary);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (onParamsUpdate) {
      onParamsUpdate({
        ...params,
        trafficGrowth: trafficGrowth / 100,
        conversionRate: conversionRate / 100,
        avgOrderValue,
      });
    }
  }, [trafficGrowth, conversionRate, avgOrderValue]);

  const chartDataKey = {
    revenue: { pred: 'revenue', base: 'baseline_revenue', label: '营收 (元)', format: (v: number) => `¥${(v / 1000).toFixed(0)}k` },
    orders: { pred: 'orders', base: 'baseline_orders', label: '订单数', format: (v: number) => String(v) },
    profit: { pred: 'profit', base: 'baseline_profit', label: '利润 (元)', format: (v: number) => `¥${(v / 1000).toFixed(0)}k` },
  }[chartType];

  const customTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: 'white',
        border: '1px solid #e8eff8',
        borderRadius: 10,
        padding: '12px 14px',
        boxShadow: '0 8px 24px rgba(26, 115, 232, 0.12)',
        fontSize: 12,
      }}>
        <div style={{ fontWeight: 600, color: '#1a1a2e', marginBottom: 8 }}>{label}</div>
        {payload.map((p: any, i: number) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 20, padding: '3px 0', color: p.dataKey.startsWith('baseline') ? '#95a5a6' : '#2c3e50' }}>
            <span style={{ color: p.dataKey.startsWith('baseline') ? '#95a5a6' : p.color }}>● {p.dataKey.startsWith('baseline') ? '基准' : '预测'}</span>
            <span style={{ fontWeight: 600 }}>
              {chartType === 'orders' ? p.value.toLocaleString() : `¥${p.value.toLocaleString()}`}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <style>{styles}</style>
      <div className="sim-container">
        <div className="sim-controls">
          <div className="sim-control">
            <div className="sim-control-label">
              <span>流量增长率</span>
              <span className="sim-control-value">+{trafficGrowth}%</span>
            </div>
            <input
              type="range"
              className="sim-slider"
              min={-20}
              max={100}
              value={trafficGrowth}
              onChange={(e) => setTrafficGrowth(Number(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: '#bdc3c7' }}>
              <span>-20%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="sim-control">
            <div className="sim-control-label">
              <span>转化率提升</span>
              <span className="sim-control-value">{conversionRate}%</span>
            </div>
            <input
              type="range"
              className="sim-slider"
              min={1}
              max={30}
              value={conversionRate}
              onChange={(e) => setConversionRate(Number(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: '#bdc3c7' }}>
              <span>1%</span>
              <span>30%</span>
            </div>
          </div>

          <div className="sim-control">
            <div className="sim-control-label">
              <span>客单价 (元)</span>
              <span className="sim-control-value">¥{avgOrderValue}</span>
            </div>
            <input
              type="range"
              className="sim-slider"
              min={100}
              max={800}
              step={10}
              value={avgOrderValue}
              onChange={(e) => setAvgOrderValue(Number(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: '#bdc3c7' }}>
              <span>¥100</span>
              <span>¥800</span>
            </div>
          </div>
        </div>

        {summary && (
          <div className="sim-summary">
            <div className="sim-stat">
              <div className="sim-stat-label">总订单数</div>
              <div className="sim-stat-value">{summary.totalOrders.toLocaleString()}</div>
              <span className={`sim-stat-change ${summary.orderGrowth >= 0 ? 'up' : 'down'}`}>
                {summary.orderGrowth >= 0 ? '↑' : '↓'} {Math.abs(summary.orderGrowth)}%
              </span>
            </div>
            <div className="sim-stat">
              <div className="sim-stat-label">总营收</div>
              <div className="sim-stat-value">¥{(summary.totalRevenue / 10000).toFixed(1)}万</div>
              <span className={`sim-stat-change ${summary.revenueGrowth >= 0 ? 'up' : 'down'}`}>
                {summary.revenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(summary.revenueGrowth)}%
              </span>
            </div>
            <div className="sim-stat">
              <div className="sim-stat-label">总利润</div>
              <div className="sim-stat-value">¥{(summary.totalProfit / 10000).toFixed(1)}万</div>
              <span className={`sim-stat-change ${summary.profitGrowth >= 0 ? 'up' : 'down'}`}>
                {summary.profitGrowth >= 0 ? '↑' : '↓'} {Math.abs(summary.profitGrowth)}%
              </span>
            </div>
            <div className="sim-stat">
              <div className="sim-stat-label">预期 ROI</div>
              <div className="sim-stat-value" style={{ color: '#27ae60' }}>
                {summary.revenueGrowth > 0 ? Math.round(summary.revenueGrowth * 0.8) : 0}%
              </div>
              <span className="sim-stat-change up">效益评估</span>
            </div>
          </div>
        )}

        <div className="chart-container">
          <div className="chart-tabs">
            {[
              { key: 'revenue', label: '营收趋势' },
              { key: 'orders', label: '订单趋势' },
              { key: 'profit', label: '利润趋势' },
            ].map(tab => (
              <button
                key={tab.key}
                className={`chart-tab ${chartType === tab.key ? 'active' : ''}`}
                onClick={() => setChartType(tab.key as any)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loading-spinner">
              <div className="spinner" />
              正在生成预测数据...
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1A73E8" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#1A73E8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef4fb" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#95a5a6' }}
                    axisLine={{ stroke: '#eef4fb' }}
                    tickLine={false}
                    interval={Math.max(0, Math.floor(data.length / 8) - 1)}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#95a5a6' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => chartDataKey.format(v)}
                  />
                  <Tooltip content={customTooltip} />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                    formatter={(value: string) => (
                      <span style={{ color: '#5a6c7d' }}>
                        {value === chartDataKey.pred ? '📈 活动预测' : '📊 日常基准'}
                      </span>
                    )}
                  />
                  <Area
                    type="monotone"
                    dataKey={chartDataKey.base}
                    name="baseline"
                    stroke="#bdc3c7"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    fill="transparent"
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey={chartDataKey.pred}
                    name="prediction"
                    stroke="#1A73E8"
                    strokeWidth={2.5}
                    fill="url(#colorPred)"
                    dot={false}
                    activeDot={{ r: 5, stroke: '#1A73E8', strokeWidth: 2, fill: 'white' }}
                    animationDuration={500}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="chart-hint">
                💡 提示：拖动左侧滑块调整参数，图表将实时更新预测结果。虚线为日常基准数据。
              </div>
            </>
          )}
        </div>

        <div className="scenario-tips">
          <div className={`tip-card ${summary && summary.revenueGrowth > 25 ? 'positive' : ''}`}>
            <div className="tip-title">🎯 增长场景</div>
            <div className="tip-text">
              当前配置预计带来
              <strong style={{ color: summary?.revenueGrowth > 0 ? '#27ae60' : '#e74c3c', margin: '0 4px' }}>
                {summary ? `${summary.revenueGrowth}%` : '--'}
              </strong>
              的营收增长。
              {summary && summary.revenueGrowth >= 30 && '表现优秀，建议加大推广投入！'}
              {summary && summary.revenueGrowth >= 10 && summary.revenueGrowth < 30 && '增长稳健，可优化折扣结构进一步提升。'}
              {summary && summary.revenueGrowth < 10 && '建议调整折扣力度或增加推广渠道。'}
            </div>
          </div>
          <div className="tip-card">
            <div className="tip-title">⚡ 优化建议</div>
            <div className="tip-text">
              {params.products.length === 0 && '⚠️ 请选择参与活动的商品以获得更准确预测。'}
              {params.products.length > 0 && params.products.length < 3 && '💡 建议增加更多商品组合，提升客单价与转化率。'}
              {params.products.length >= 3 && `✅ 已选择 ${params.products.length} 件商品，覆盖足够的品类组合。`}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SimulationChart;
