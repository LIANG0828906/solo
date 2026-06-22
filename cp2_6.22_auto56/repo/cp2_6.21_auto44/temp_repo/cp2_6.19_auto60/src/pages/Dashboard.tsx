import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, TrendingDown, CreditCard, X, AlertTriangle, ArrowUpDown } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import type { FilterType, CategoryFilterType, SortType } from '@/store/subscriptionStore';
import {
  calculateTotalMonthly,
  calculateExpenseChange,
  getMonthlyTrend,
  getCategoryBreakdown,
  CATEGORY_COLORS,
  CATEGORY_EMOJIS,
} from '@/utils/dateUtils';
import type { Category } from '@/utils/dateUtils';

function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 800;
    const start = performance.now();
    const from = display;
    const to = value;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <span>{prefix}{display.toFixed(decimals)}{suffix}</span>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    subscriptions,
    filter,
    categoryFilter,
    sortBy,
    setFilter,
    setCategoryFilter,
    setSortBy,
    getFilteredSubscriptions,
    getExpiringCount,
    getTotalMonthlyFee,
    deleteSubscription,
    showNotification,
    notificationMessage,
    hideNotification,
    triggerNotification,
  } = useSubscriptionStore();

  const [listVisible, setListVisible] = useState(true);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  const filteredSubscriptions = useMemo(() => getFilteredSubscriptions(), [subscriptions, filter, categoryFilter, sortBy]);

  const monthlyTotal = useMemo(() => calculateTotalMonthly(subscriptions), [subscriptions]);
  const expenseChange = useMemo(() => calculateExpenseChange(subscriptions), [subscriptions]);
  const expiringCount = useMemo(() => getExpiringCount(), [subscriptions]);
  const totalMonthlyFee = useMemo(() => getTotalMonthlyFee(), [subscriptions]);
  const trendData = useMemo(() => getMonthlyTrend(subscriptions, 6), [subscriptions]);
  const categoryData = useMemo(() => getCategoryBreakdown(subscriptions), [subscriptions]);

  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => hideNotification(), 3000);
      return () => clearTimeout(timer);
    }
  }, [showNotification, hideNotification]);

  const handleFilterChange = (newFilter: FilterType) => {
    setListVisible(false);
    setTimeout(() => {
      setFilter(newFilter);
      setTimeout(() => setListVisible(true), 50);
    }, 200);
  };

  const handleDelete = (id: string) => {
    setDeletingIds((prev) => [...prev, id]);
    setTimeout(() => {
      deleteSubscription(id);
      setDeletingIds((prev) => prev.filter((d) => d !== id));
      triggerNotification('订阅已删除');
    }, 300);
  };

  const handleCategoryFilterChange = (newFilter: CategoryFilterType) => {
    setListVisible(false);
    setTimeout(() => {
      setCategoryFilter(newFilter);
      setTimeout(() => setListVisible(true), 50);
    }, 200);
  };

  const handleSortChange = (newSort: SortType) => {
    setSortBy(newSort);
  };

  const statusFilterOptions: { value: FilterType; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'expiring', label: '临近到期' },
    { value: 'expired', label: '已过期' },
  ];

  const categoryFilterOptions: { value: CategoryFilterType; label: string }[] = [
    { value: 'all', label: '全部类别' },
    { value: 'entertainment', label: '🎬 娱乐' },
    { value: 'office', label: '💼 办公' },
    { value: 'cloud', label: '☁️ 云服务' },
    { value: 'music', label: '🎵 音乐' },
    { value: 'other', label: '📦 其他' },
  ];

  const sortOptions: { value: SortType; label: string }[] = [
    { value: 'expiry', label: '到期日 ↑' },
    { value: 'expiryDesc', label: '到期日 ↓' },
    { value: 'fee', label: '费用 ↑' },
    { value: 'feeDesc', label: '费用 ↓' },
    { value: 'name', label: '名称' },
  ];

  return (
    <div className="dashboard">
      {showNotification && (
        <div className="notification-bar">
          <span>{notificationMessage}</span>
          <button onClick={hideNotification} className="notification-close">
            <X size={18} />
          </button>
        </div>
      )}

      <header className="dashboard-header">
        <h1 className="dashboard-title">我的订阅</h1>
        <p className="dashboard-subtitle">统一管理，轻松掌控</p>
      </header>

      <section className="stats-section">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <span className="stat-label">活跃订阅</span>
            <span className="stat-value">
              <AnimatedNumber value={subscriptions.length} suffix=" 个" />
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <span className="stat-label">下月预计支出</span>
            <span className="stat-value">
              <AnimatedNumber value={monthlyTotal} prefix="¥" decimals={2} />
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <AlertTriangle size={28} className="alert-icon" />
          </div>
          <div className="stat-content">
            <span className="stat-label">临近到期</span>
            <span className="stat-value expiring-value">
              <AnimatedNumber value={expiringCount} suffix=" 个" />
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <span className="stat-label">较上月变化</span>
            <span className={`stat-value ${expenseChange >= 0 ? 'positive' : 'negative'}`}>
              {expenseChange >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              <AnimatedNumber value={Math.abs(expenseChange)} suffix="%" />
            </span>
          </div>
        </div>
      </section>

      <section className="filter-section">
        <div className="filter-row">
          <div className="filter-group">
            <span className="filter-label">状态：</span>
            <div className="filter-options">
              {statusFilterOptions.map((opt) => (
                <button
                  key={opt.value}
                  className={`filter-btn ${filter === opt.value ? 'active' : ''}`}
                  onClick={() => handleFilterChange(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="filter-row">
          <div className="filter-group">
            <span className="filter-label">类别：</span>
            <div className="filter-options">
              {categoryFilterOptions.map((opt) => (
                <button
                  key={opt.value}
                  className={`filter-btn ${categoryFilter === opt.value ? 'active' : ''}`}
                  onClick={() => handleCategoryFilterChange(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <span className="filter-label">
              <ArrowUpDown size={14} /> 排序：
            </span>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as SortType)}
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className={`subscriptions-section ${listVisible ? 'visible' : 'hidden'}`}>
        {filteredSubscriptions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p className="empty-text">暂无订阅，点击右下角按钮添加</p>
          </div>
        ) : (
          <div className="subscriptions-grid">
            {filteredSubscriptions
              .filter((s) => !deletingIds.includes(s.id))
              .map((sub, index) => (
                <SubscriptionCard
                  key={sub.id}
                  subscription={sub}
                  index={index}
                  onDelete={handleDelete}
                />
              ))}
          </div>
        )}
      </section>

      {subscriptions.length > 0 && (
        <section className="charts-section">
          <div className="chart-card">
            <h3 className="chart-title">
              <CreditCard size={20} /> 月度支出趋势
            </h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`¥${value.toFixed(2)}`, '金额']}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ fill: '#2563eb', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <h3 className="chart-title">🥧 类别支出占比</h3>
            <div className="chart-container">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="amount"
                      nameKey="name"
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      labelLine={{ stroke: '#9ca3af' }}
                    >
                      {categoryData.map((entry) => (
                        <Cell
                          key={entry.category}
                          fill={CATEGORY_COLORS[entry.category].solid}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string) => [`¥${value.toFixed(2)}`, name]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-empty">暂无数据</div>
              )}
            </div>
          </div>
        </section>
      )}

      <button
        className="fab-btn"
        onClick={() => navigate('/add')}
        aria-label="添加订阅"
      >
        <Plus size={28} />
      </button>
    </div>
  );
}
