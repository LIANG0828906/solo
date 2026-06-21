import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  useFeedbackContext,
  UserGroup,
  TimeRange,
  ListFilter,
  Feedback,
} from '@/context/FeedbackContext';

const MOOD_EMOJIS = ['😫', '😟', '😐', '🙂', '😄'];
const GROUP_LABELS: Record<UserGroup, string> = {
  all: '全选',
  frontend: '前端组',
  backend: '后端组',
  design: '设计组',
};
const OBSTACLE_LABELS: Record<string, string> = {
  dependency: '依赖阻塞',
  technical: '技术卡点',
  resource: '资源不足',
};
const OBSTACLE_COLORS: Record<string, string> = {
  dependency: '#EF4444',
  technical: '#F59E0B',
  resource: '#8B5CF6',
};
const LIST_FILTER_LABELS: Record<ListFilter, string> = {
  all: '全部',
  'has-obstacle': '有阻碍',
  'high-rating': '高评分(≥5)',
  'low-rating': '低评分(≤3)',
};

const AVATAR_COLORS = [
  '#8B5CF6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#3B82F6',
  '#EC4899',
  '#14B8A6',
  '#F97316',
];

const getAvatarColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const formatTime = (iso: string): string => {
  const d = new Date(iso);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hh}:${mm}`;
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <div className="tooltip-date">{label}</div>
        {payload.map((entry, idx) => (
          <div key={idx} className="tooltip-row">
            <span className="tooltip-dot" style={{ background: entry.color }} />
            <span className="tooltip-label">{entry.name}</span>
            <span className="tooltip-value">{entry.value.toFixed(2)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const FeedbackItem: React.FC<{ feedback: Feedback; index: number }> = ({ feedback, index }) => {
  const [expanded, setExpanded] = useState(false);
  const bgColor = index % 2 === 0 ? '#F1F5F9' : '#FFFFFF';
  const initial = feedback.userName.charAt(0);
  const avatarColor = getAvatarColor(feedback.userName);

  return (
    <div
      className="feedback-item"
      style={{ background: bgColor }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="feedback-item-header">
        <div
          className="feedback-avatar"
          style={{ background: avatarColor }}
        >
          {initial}
        </div>
        <div className="feedback-item-info">
          <div className="feedback-name">{feedback.userName}</div>
          <div className="feedback-time">{formatTime(feedback.createdAt)}</div>
        </div>
        <div className="feedback-mood">{MOOD_EMOJIS[feedback.mood - 1]}</div>
      </div>
      <div
        className={`feedback-item-content ${expanded ? 'expanded' : ''}`}
      >
        <div className="feedback-content-inner">
          <p className="feedback-text">{feedback.content}</p>
          <div className="feedback-meta">
            <span className="efficiency-stars">
              {'★'.repeat(feedback.efficiency)}
              <span className="stars-dim">{'★'.repeat(5 - feedback.efficiency)}</span>
            </span>
            {feedback.obstacle && (
              <span
                className="obstacle-tag"
                style={{ background: OBSTACLE_COLORS[feedback.obstacle] }}
              >
                {OBSTACLE_LABELS[feedback.obstacle]}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TrendDashboard: React.FC<{ onTogglePanel: () => void }> = ({ onTogglePanel }) => {
  const {
    statsData,
    feedbacks,
    selectedGroup,
    selectedRange,
    listFilter,
    setSelectedGroup,
    setSelectedRange,
    setListFilter,
  } = useFeedbackContext();
  const [filterKey, setFilterKey] = useState(0);

  const filteredFeedbacks = useMemo(() => {
    let list = [...feedbacks];
    switch (listFilter) {
      case 'has-obstacle':
        list = list.filter((f) => f.obstacle !== null);
        break;
      case 'high-rating':
        list = list.filter((f) => f.efficiency >= 5);
        break;
      case 'low-rating':
        list = list.filter((f) => f.efficiency <= 3);
        break;
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedbacks, listFilter, filterKey]);

  const handleListFilterChange = (f: ListFilter) => {
    setListFilter(f);
    setFilterKey((k) => k + 1);
  };

  return (
    <section className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <button className="menu-toggle" onClick={onTogglePanel} aria-label="菜单">
            ☰
          </button>
          <h1 className="app-title">团队反馈看板</h1>
        </div>
        <div className="header-user">
          <div className="user-avatar" style={{ background: getAvatarColor('当前用户') }}>我</div>
          <span className="user-name">当前用户</span>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="chart-section">
          <div className="filters-row">
            <div className="filter-group">
              <label className="filter-label">团队分组</label>
              <select
                className="form-select filter-select"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value as UserGroup)}
              >
                {Object.entries(GROUP_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">时间范围</label>
              <div className="range-buttons">
                {[7, 14, 30].map((r) => (
                  <button
                    key={r}
                    className={`range-btn ${selectedRange === r ? 'active' : ''}`}
                    onClick={() => setSelectedRange(r as TimeRange)}
                  >
                    {r}天
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={statsData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  tickFormatter={(val) => val.slice(5)}
                  stroke="#CBD5E1"
                />
                <YAxis
                  domain={[0, 5]}
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  stroke="#CBD5E1"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="line"
                  wrapperStyle={{ fontSize: 13, paddingTop: 10 }}
                />
                <Line
                  type="monotone"
                  dataKey="avgMood"
                  name="心情指数"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                  animationDuration={500}
                />
                <Line
                  type="monotone"
                  dataKey="avgEfficiency"
                  name="效率评分"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10B981', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                  animationDuration={500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="list-section">
          <div className="list-header">
            <h3>反馈详情</h3>
            <div className="list-filters">
              {Object.entries(LIST_FILTER_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  className={`list-filter-btn ${listFilter === key ? 'active' : ''}`}
                  onClick={() => handleListFilterChange(key as ListFilter)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="feedback-list" key={filterKey}>
            {filteredFeedbacks.length === 0 ? (
              <div className="empty-state">暂无反馈数据</div>
            ) : (
              filteredFeedbacks.map((f, idx) => (
                <FeedbackItem key={f.id} feedback={f} index={idx} />
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrendDashboard;
