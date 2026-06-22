import React, { useMemo, useState, useEffect, memo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useAppContext } from '../App';
import {
  getMonthlyTrend,
  getCategoryTrend,
  CATEGORY_MAP,
  filterSubscriptions,
  sortByExpiry,
  Subscription,
  CYCLE_MAP,
  calculateDaysUntilExpiry,
  getExpiryColor,
  calculateYearlyCost,
} from '../utils/subscriptionLogic';

const CATEGORY_COLORS: Record<string, string> = {
  streaming: '#EF4444',
  cloud: '#3B82F6',
  fitness: '#10B981',
  software: '#8B5CF6',
  other: '#F59E0B',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: 'white',
          padding: '12px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #E2E8F0',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        <p style={{ fontWeight: 600, marginBottom: '8px', color: '#1E293B' }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p
            key={index}
            style={{ color: entry.color, margin: '4px 0', fontSize: '0.9rem' }}
          >
            {entry.name}: ¥{typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            {entry.name.includes('%') ? '' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface SubscriptionCardProps {
  subscription: Subscription;
  isHighlighted: boolean;
  onToggle: (id: string) => void;
}

const AnalyticsCard = memo(function AnalyticsCard({
  subscription,
  isHighlighted,
  onToggle,
}: SubscriptionCardProps) {
  const days = calculateDaysUntilExpiry(subscription.expiryDate);
  const expiryColor = getExpiryColor(days);
  const yearlyCost = calculateYearlyCost(subscription.amount, subscription.cycle);
  const categoryInfo = CATEGORY_MAP[subscription.category];
  const cycleInfo = CYCLE_MAP[subscription.cycle];

  const getDaysText = () => {
    if (days < 0) return `已过期${Math.abs(days)}天`;
    if (days === 0) return '今天到期';
    return `${days}天后到期`;
  };

  return (
    <div
      id={`sub-card-${subscription.id}`}
      className={`sub-card ${isHighlighted ? 'highlighted' : ''} ${
        subscription.isActive ? '' : 'inactive'
      }`}
    >
      <div className="card-header">
        <div className="card-logo">{categoryInfo.emoji}</div>
        <div className="card-info">
          <div className="card-name">{subscription.name}</div>
          <div className="card-category">{categoryInfo.label}</div>
        </div>
      </div>

      <div className="card-body">
        <div className="card-row">
          <div>
            <span className="card-amount">¥{subscription.amount}</span>
            <span className="card-cycle"> /{cycleInfo.label}</span>
          </div>
        </div>
        <div className="card-row">
          <span className="card-label">到期日期</span>
          <span className="card-value card-expiry" style={{ color: expiryColor }}>
            {subscription.expiryDate}
          </span>
        </div>
        <div className="card-row">
          <span className="card-label">状态</span>
          <span className="card-value" style={{ color: expiryColor }}>
            {getDaysText()}
          </span>
        </div>
      </div>

      <div className="card-footer">
        <div className="card-yearly">
          年均 <strong>¥{yearlyCost}</strong>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={subscription.isActive}
            onChange={() => onToggle(subscription.id)}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>
    </div>
  );
});

export default function AnalyticsPanel() {
  const { state, dispatch, toggleSubscription } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const monthlyTrend = useMemo(() => getMonthlyTrend(state.subscriptions), [state.subscriptions]);
  const categoryTrend = useMemo(
    () => getCategoryTrend(state.subscriptions),
    [state.subscriptions]
  );

  const filteredAndSortedSubs = useMemo(() => {
    const filtered = filterSubscriptions(state.subscriptions, debouncedQuery);
    return sortByExpiry(filtered);
  }, [state.subscriptions, debouncedQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value });
  };

  const totalYearly = state.subscriptions
    .filter((s) => s.isActive)
    .reduce((sum, s) => sum + calculateYearlyCost(s.amount, s.cycle), 0);

  const totalMonthly = state.subscriptions
    .filter((s) => s.isActive)
    .reduce((sum, s) => sum + s.amount / CYCLE_MAP[s.cycle].months, 0);

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    state.subscriptions
      .filter((s) => s.isActive)
      .forEach((s) => {
        const monthly = s.amount / CYCLE_MAP[s.cycle].months;
        totals[s.category] = (totals[s.category] || 0) + monthly;
      });
    return totals;
  }, [state.subscriptions]);

  const barData = useMemo(() => {
    return monthlyTrend.map((item) => {
      const result: any = { month: item.month };
      Object.keys(CATEGORY_MAP).forEach((cat) => {
        result[CATEGORY_MAP[cat as keyof typeof CATEGORY_MAP].label] = item[cat] || 0;
      });
      return result;
    });
  }, [monthlyTrend]);

  return (
    <div className="analytics">
      <div className="page-header">
        <h1 className="page-title">开支分析</h1>
        <p className="page-subtitle">
          月均支出 <strong style={{ color: '#3B82F6' }}>¥{totalMonthly.toFixed(2)}</strong>，
          年预计支出 <strong style={{ color: '#10B981' }}>¥{totalYearly.toFixed(2)}</strong>
        </p>
      </div>

      <div className="analytics-row">
        <div className="chart-card">
          <h3 className="chart-title">📈 近12个月支出趋势</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="总支出"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#3B82F6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">📊 各类别占比趋势 (%)</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={categoryTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {Object.entries(CATEGORY_MAP).map(([key, value]) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={value.label}
                    name={`${value.emoji} ${value.label}`}
                    stroke={CATEGORY_COLORS[key]}
                    strokeWidth={2}
                    dot={{ fill: CATEGORY_COLORS[key], strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: CATEGORY_COLORS[key] }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="analytics-row">
        <div className="chart-card" style={{ width: '100%' }}>
          <h3 className="chart-title">📊 每月各类别花费对比</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {Object.entries(CATEGORY_MAP).map(([key, value]) => (
                  <Bar
                    key={key}
                    dataKey={value.label}
                    stackId="a"
                    fill={CATEGORY_COLORS[key]}
                    name={`${value.emoji} ${value.label}`}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="analytics-row" style={{ flexDirection: 'column', gap: '16px' }}>
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <h3 className="chart-title" style={{ marginBottom: '16px' }}>
            🔍 订阅列表搜索
          </h3>
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="form-input"
              placeholder="搜索订阅服务名称或类别..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {filteredAndSortedSubs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <div className="empty-title">
              {debouncedQuery ? '没有找到匹配的订阅' : '还没有添加任何订阅'}
            </div>
            <p>{debouncedQuery ? '试试其他关键词' : '点击右下角加号按钮添加你的第一个订阅'}</p>
          </div>
        ) : (
          <div className="card-grid">
            {filteredAndSortedSubs.map((sub) => (
              <AnalyticsCard
                key={sub.id}
                subscription={sub}
                isHighlighted={state.highlightedId === sub.id}
                onToggle={toggleSubscription}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
