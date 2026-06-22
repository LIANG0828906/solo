import { useState, useEffect, useMemo, useCallback } from 'react';
import { getTypeName } from '../dataSimulator';
import type { Activity, ActivityType, FilterType, FilterStatus } from '../types';

interface DashboardProps {
  activities: Activity[];
  onActivityClick: (id: string) => void;
  onActivityCreated: () => void;
}

const statusNames: Record<string, string> = {
  ongoing: '进行中',
  upcoming: '未开始',
  ended: '已结束'
};

function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toLocaleString();
}

function formatCurrency(num: number): string {
  return '¥' + num.toLocaleString();
}

interface ActivityCardProps {
  activity: Activity;
  onClick: () => void;
  animationClass: string;
}

const ActivityCard = ({ activity, onClick, animationClass }: ActivityCardProps) => {
  const budgetPercent = (activity.budgetUsed / activity.budgetLimit) * 100;
  const ctr = activity.impressions > 0 ? ((activity.clicks / activity.impressions) * 100).toFixed(2) : '0.00';
  const roi = activity.budgetUsed > 0 ? ((activity.revenue / activity.budgetUsed) * 100).toFixed(1) : '0.0';
  const isWarning = budgetPercent > 80;

  return (
    <div
      className={`activity-card ${animationClass}`}
      onClick={onClick}
    >
      <div className="card-header">
        <h3 className="card-title">{activity.name}</h3>
        <span className={`type-tag ${activity.type}`}>
          {getTypeName(activity.type)}
        </span>
      </div>

      <div className="metrics-section">
        <div className="metric-item">
          <div className="metric-label">当前曝光</div>
          <div className="metric-value-large">{formatNumber(activity.impressions)}</div>
        </div>
        <div className="metric-item">
          <div className="metric-label">点击率</div>
          <div className="metric-value">{ctr}%</div>
        </div>
        <div className="metric-item">
          <div className="metric-label">实时ROI</div>
          <div className="metric-value">{roi}%</div>
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-label">
          <span>预算使用</span>
          <span>{budgetPercent.toFixed(1)}%</span>
        </div>
        <div className="progress-bar">
          <div
            className={`progress-fill ${isWarning ? 'warning' : ''}`}
            style={{ width: `${Math.min(budgetPercent, 100)}%` }}
          />
        </div>
        <div className="progress-label" style={{ marginTop: '8px' }}>
          <span>已用: {formatCurrency(activity.budgetUsed)}</span>
          <span>上限: {formatCurrency(activity.budgetLimit)}</span>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard({ activities, onActivityClick, onActivityCreated }: DashboardProps) {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [showModal, setShowModal] = useState(false);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [animatingIds, setAnimatingIds] = useState<Map<string, string>>(new Map());

  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      const typeMatch = filterType === 'all' || activity.type === filterType;
      const statusMatch = filterStatus === 'all' || activity.status === filterStatus;
      return typeMatch && statusMatch;
    });
  }, [activities, filterType, filterStatus]);

  const filteredIds = useMemo(() => {
    return new Set(filteredActivities.map(a => a.id));
  }, [filteredActivities]);

  useEffect(() => {
    const prevIds = visibleIds;
    const newAnimating = new Map<string, string>();

    filteredIds.forEach(id => {
      if (!prevIds.has(id)) {
        newAnimating.set(id, 'entering');
      }
    });

    prevIds.forEach(id => {
      if (!filteredIds.has(id)) {
        newAnimating.set(id, 'exiting');
      }
    });

    if (newAnimating.size > 0) {
      setAnimatingIds(newAnimating);

      const timers: NodeJS.Timeout[] = [];
      newAnimating.forEach((animType, id) => {
        const delay = animType === 'exiting' ? 200 : 300;
        const timer = setTimeout(() => {
          setAnimatingIds(prev => {
            const next = new Map(prev);
            next.delete(id);
            return next;
          });
        }, delay);
        timers.push(timer);
      });

      setTimeout(() => {
        setVisibleIds(filteredIds);
      }, 100);

      return () => timers.forEach(t => clearTimeout(t));
    } else {
      setVisibleIds(filteredIds);
    }
  }, [filteredIds]);

  const displayedActivities = useMemo(() => {
    const displayed = new Set([...visibleIds, ...animatingIds.keys()]);
    return activities.filter(a => displayed.has(a.id));
  }, [activities, visibleIds, animatingIds]);

  const getAnimationClass = useCallback((id: string) => {
    return animatingIds.get(id) || '';
  }, [animatingIds]);

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const name = formData.get('name') as string;
    const type = formData.get('type') as ActivityType;
    const budgetLimit = parseInt(formData.get('budgetLimit') as string);
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;

    const start = new Date(`${startDate}T${startTime}`).getTime();
    const end = new Date(`${endDate}T${endTime}`).getTime();

    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          type,
          budgetLimit,
          startTime: start,
          endTime: end
        })
      });

      if (response.ok) {
        const newActivity = await response.json();
        setShowModal(false);
        onActivityCreated();
        setTimeout(() => onActivityClick(newActivity.id), 100);
      }
    } catch (error) {
      console.error('Failed to create activity:', error);
    }
  };

  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  return (
    <div>
      <div className="filters-bar">
        <span className="filter-label">活动类型:</span>
        <select
          className="filter-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as FilterType)}
        >
          <option value="all">全部类型</option>
          <option value="full_reduction">满减</option>
          <option value="discount">折扣</option>
          <option value="flash_sale">秒杀</option>
        </select>

        <span className="filter-label">活动状态:</span>
        <select
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
        >
          <option value="all">全部状态</option>
          <option value="ongoing">进行中</option>
          <option value="upcoming">未开始</option>
          <option value="ended">已结束</option>
        </select>

        <button
          className="btn btn-primary"
          style={{ marginLeft: 'auto' }}
          onClick={() => setShowModal(true)}
        >
          + 创建活动
        </button>
      </div>

      {displayedActivities.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-text">暂无符合条件的活动</div>
        </div>
      ) : (
        <div className="cards-grid">
          {displayedActivities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onClick={() => onActivityClick(activity.id)}
              animationClass={getAnimationClass(activity.id)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">创建新活动</h2>
            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label className="form-label">活动名称</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  placeholder="请输入活动名称"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">活动类型</label>
                <select name="type" className="form-input" required>
                  <option value="full_reduction">满减</option>
                  <option value="discount">折扣</option>
                  <option value="flash_sale">秒杀</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">预算上限 (元)</label>
                <input
                  type="number"
                  name="budgetLimit"
                  className="form-input"
                  placeholder="请输入预算上限"
                  min="1"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">开始日期</label>
                  <input
                    type="date"
                    name="startDate"
                    className="form-input"
                    defaultValue={formatDate(today)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">开始时间</label>
                  <input
                    type="time"
                    name="startTime"
                    className="form-input"
                    defaultValue="00:00"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">结束日期</label>
                  <input
                    type="date"
                    name="endDate"
                    className="form-input"
                    defaultValue={formatDate(nextWeek)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">结束时间</label>
                  <input
                    type="time"
                    name="endTime"
                    className="form-input"
                    defaultValue="23:59"
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  创建活动
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
