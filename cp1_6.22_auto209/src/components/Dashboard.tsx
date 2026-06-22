import React, { useMemo, useState, useEffect, memo } from 'react';
import { useAppContext } from '../App';
import {
  Subscription,
  CATEGORY_MAP,
  CYCLE_MAP,
  calculateDaysUntilExpiry,
  getExpiryColor,
  calculateYearlyCost,
  sortByExpiry,
  filterSubscriptions,
} from '../utils/subscriptionLogic';

interface SubscriptionCardProps {
  subscription: Subscription;
  isHighlighted: boolean;
  onToggle: (id: string) => void;
}

const SubscriptionCard = memo(function SubscriptionCard({
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

export default function Dashboard() {
  const { state, dispatch, toggleSubscription } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredAndSortedSubs = useMemo(() => {
    const filtered = filterSubscriptions(state.subscriptions, debouncedQuery);
    return sortByExpiry(filtered);
  }, [state.subscriptions, debouncedQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value });
  };

  const activeCount = state.subscriptions.filter((s) => s.isActive).length;
  const totalMonthly = state.subscriptions
    .filter((s) => s.isActive)
    .reduce((sum, s) => sum + s.amount / CYCLE_MAP[s.cycle].months, 0);

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">我的订阅</h1>
        <p className="page-subtitle">
          共 {state.subscriptions.length} 项订阅，其中 {activeCount} 项已启用，
          月均支出 <strong style={{ color: '#3B82F6' }}>¥{totalMonthly.toFixed(2)}</strong>
        </p>
      </div>

      <div className="search-box" style={{ marginBottom: '24px' }}>
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="form-input"
          placeholder="搜索订阅服务名称或类别..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
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
            <SubscriptionCard
              key={sub.id}
              subscription={sub}
              isHighlighted={state.highlightedId === sub.id}
              onToggle={toggleSubscription}
            />
          ))}
        </div>
      )}
    </div>
  );
}
