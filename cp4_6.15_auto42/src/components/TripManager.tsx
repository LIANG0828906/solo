import React, { useState, useEffect, useMemo } from 'react';
import type { Trip, Activity, ExpenseCategory } from '@/types';

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  transport: '#4ECDC4',
  accommodation: '#FF6B6B',
  food: '#FFD93D',
  ticket: '#6BCB77',
  other: '#9B59B6'
};

const CATEGORY_NAMES: Record<ExpenseCategory, string> = {
  transport: '交通',
  accommodation: '住宿',
  food: '餐饮',
  ticket: '门票',
  other: '其他'
};

interface TripManagerProps {
  mode: 'list' | 'detail';
  tripId?: string;
  detailView?: 'dashboard' | 'activities';
  trips: Trip[];
  activities: Activity[];
  onSelectTrip: (tripId: string) => void;
  onAddTrip: (trip: Omit<Trip, 'id' | 'createdAt'>) => void;
  onDeleteTrip: (tripId: string) => void;
  onAddActivity: (activity: Omit<Activity, 'id' | 'completed'>) => void;
  onToggleActivity: (activityId: string) => void;
  onDeleteActivity: (activityId: string) => void;
  getTripTotalSpent: (tripId: string) => number;
  getTripDays: (trip: Trip) => number;
}

const TripManager: React.FC<TripManagerProps> = ({
  mode,
  tripId,
  detailView = 'activities',
  trips,
  activities,
  onSelectTrip,
  onAddTrip,
  onDeleteTrip,
  onAddActivity,
  onToggleActivity,
  onDeleteActivity,
  getTripTotalSpent,
  getTripDays
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [key, setKey] = useState(0);

  const [newTrip, setNewTrip] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    budget: 0
  });

  const [newActivity, setNewActivity] = useState({
    date: '',
    time: '',
    location: '',
    description: '',
    cost: 0,
    category: 'other' as ExpenseCategory
  });

  const currentTrip = useMemo(() => {
    if (mode === 'detail' && tripId) {
      return trips.find(t => t.id === tripId);
    }
    return null;
  }, [mode, tripId, trips]);

  const tripActivities = useMemo(() => {
    if (mode === 'detail' && tripId) {
      return activities
        .filter(a => a.tripId === tripId)
        .sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.time.localeCompare(b.time);
        });
    }
    return [];
  }, [mode, tripId, activities]);

  const activitiesByDate = useMemo(() => {
    const grouped = new Map<string, Activity[]>();
    tripActivities.forEach(activity => {
      if (!grouped.has(activity.date)) {
        grouped.set(activity.date, []);
      }
      grouped.get(activity.date)!.push(activity);
    });
    return Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [tripActivities]);

  useEffect(() => {
    if (mode === 'detail') {
      setKey(prev => prev + 1);
    }
  }, [mode, tripId]);

  if (mode === 'list') {
    return (
      <div className="fade-in">
        <div className="page-header">
          <h1 className="page-title">我的行程</h1>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <span>+</span> 新建行程
          </button>
        </div>

        {trips.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✈️</div>
            <div className="empty-state-text">还没有行程</div>
            <div className="empty-state-subtext">创建你的第一个旅行计划吧！</div>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              开始规划
            </button>
          </div>
        ) : (
          <div className="trip-grid">
            {trips.map((trip, index) => {
              const totalSpent = getTripTotalSpent(trip.id);
              const budgetUsed = trip.budget > 0 ? (totalSpent / trip.budget) * 100 : 0;
              const remaining = trip.budget - totalSpent;
              const progressClass = budgetUsed >= 100 ? 'danger' : budgetUsed >= 80 ? 'warning' : 'safe';

              return (
                <div
                  key={trip.id}
                  className="trip-card"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => onSelectTrip(trip.id)}
                >
                  <div className="trip-card-image">
                    <div className="trip-card-destination">{trip.destination}</div>
                  </div>
                  <div className="trip-card-content">
                    <div className="trip-card-dates">
                      <span>📅</span>
                      {trip.startDate} ~ {trip.endDate}
                    </div>
                    <div className="trip-card-budget-label">
                      预算使用: ¥{totalSpent.toLocaleString()} / ¥{trip.budget.toLocaleString()}
                    </div>
                    <div className="progress-bar">
                      <div
                        className={`progress-fill ${progressClass}`}
                        style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                      />
                    </div>
                    <div className="trip-card-budget-info">
                      <span>剩余:</span>
                      <span className={`budget-remaining ${progressClass}`}>
                        ¥{remaining.toLocaleString()}
                      </span>
                    </div>
                    <div className="trip-card-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => onSelectTrip(trip.id)}
                      >
                        查看详情
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => {
                          if (confirm(`确定删除 "${trip.destination}" 行程吗？`)) {
                            onDeleteTrip(trip.id);
                          }
                        }}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">新建行程</h2>
                <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">目的地</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="如：东京、巴黎、丽江..."
                    value={newTrip.destination}
                    onChange={(e) => setNewTrip({ ...newTrip, destination: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">开始日期</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newTrip.startDate}
                      onChange={(e) => setNewTrip({ ...newTrip, startDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">结束日期</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newTrip.endDate}
                      onChange={(e) => setNewTrip({ ...newTrip, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">总预算 (元)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    value={newTrip.budget || ''}
                    onChange={(e) => setNewTrip({ ...newTrip, budget: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  取消
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    if (!newTrip.destination || !newTrip.startDate || !newTrip.endDate) {
                      alert('请填写完整信息');
                      return;
                    }
                    if (newTrip.startDate > newTrip.endDate) {
                      alert('结束日期不能早于开始日期');
                      return;
                    }
                    onAddTrip(newTrip);
                    setShowCreateModal(false);
                    setNewTrip({ destination: '', startDate: '', endDate: '', budget: 0 });
                  }}
                >
                  创建行程
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!currentTrip) return null;

  const totalSpent = getTripTotalSpent(currentTrip.id);
  const budgetUsed = currentTrip.budget > 0 ? (totalSpent / currentTrip.budget) * 100 : 0;
  const isOverBudget = budgetUsed >= 100;
  const days = getTripDays(currentTrip);
  const dailyAverage = days > 0 ? totalSpent / days : 0;

  const circumference = 2 * Math.PI * 55;
  const progressOffset = circumference - (Math.min(budgetUsed, 100) / 100) * circumference;

  const getProgressColor = () => {
    if (budgetUsed >= 100) return '#ef4444';
    if (budgetUsed >= 80) return '#f59e0b';
    const ratio = budgetUsed / 100;
    const r = Math.round(16 + ratio * 239);
    const g = Math.round(185 - ratio * 109);
    const b = Math.round(129 - ratio * 73);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
  };

  return (
    <div className="fade-in" key={key}>
      {detailView === 'dashboard' && (
        <div className="dashboard">
          <div className="progress-ring-container">
            <svg className="progress-ring-svg" width="140" height="140" viewBox="0 0 140 140">
              <circle
                className="progress-ring-bg"
                cx="70"
                cy="70"
                r="55"
              />
              <circle
                className="progress-ring-fill"
                cx="70"
                cy="70"
                r="55"
                strokeDasharray={circumference}
                strokeDashoffset={progressOffset}
                stroke={getProgressColor()}
              />
            </svg>
            <div className="progress-ring-text">
              <span className={`progress-ring-percent ${isOverBudget ? 'over-budget shake' : ''}`}>
                {budgetUsed.toFixed(0)}%
              </span>
              <span className="progress-ring-label">预算使用</span>
            </div>
          </div>

          <div className="dashboard-info">
            <h2>{currentTrip.destination}</h2>
            <p>{currentTrip.startDate} ~ {currentTrip.endDate} · {days}天</p>
            <div className="stats-row" style={{ marginTop: '20px' }}>
              <div className="stat-card">
                <div className="stat-label">总预算</div>
                <div className="stat-value">¥{currentTrip.budget.toLocaleString()}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">已花费</div>
                <div className="stat-value" style={{ color: isOverBudget ? '#ff6b6b' : 'inherit' }}>
                  ¥{totalSpent.toLocaleString()}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">剩余</div>
                <div className="stat-value" style={{ color: isOverBudget ? '#ff6b6b' : 'inherit' }}>
                  ¥{(currentTrip.budget - totalSpent).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-header-actions">
            <div className="daily-average">
              <div className="daily-average-label">日均花费</div>
              <div className={`daily-average-value ${isOverBudget ? 'over-budget' : ''}`} key={totalSpent}>
                ¥{dailyAverage.toFixed(0)}
              </div>
            </div>
          </div>
        </div>
      )}

      {detailView === 'activities' && (
        <>
            <div className="add-activity-section">
              <div className="section-title">添加活动</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">日期</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newActivity.date}
                    min={currentTrip.startDate}
                    max={currentTrip.endDate}
                    onChange={(e) => setNewActivity({ ...newActivity, date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">时间</label>
                  <input
                    type="time"
                    className="form-input"
                    value={newActivity.time}
                    onChange={(e) => setNewActivity({ ...newActivity, time: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">地点</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="如：浅草寺"
                    value={newActivity.location}
                    onChange={(e) => setNewActivity({ ...newActivity, location: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">费用 (元)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    value={newActivity.cost || ''}
                    onChange={(e) => setNewActivity({ ...newActivity, cost: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">类别</label>
                <select
                  className="form-select"
                  value={newActivity.category}
                  onChange={(e) => setNewActivity({ ...newActivity, category: e.target.value as ExpenseCategory })}
                >
                  {(Object.keys(CATEGORY_NAMES) as ExpenseCategory[]).map(cat => (
                    <option key={cat} value={cat}>{CATEGORY_NAMES[cat]}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">描述</label>
                <textarea
                  className="form-textarea"
                  placeholder="活动详情..."
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                  rows={3}
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (!newActivity.date || !newActivity.time || !newActivity.location) {
                    alert('请填写日期、时间和地点');
                    return;
                  }
                  try {
                    onAddActivity({
                      tripId: currentTrip.id,
                      ...newActivity
                    });
                    setNewActivity({
                      date: newActivity.date,
                      time: '',
                      location: '',
                      description: '',
                      cost: 0,
                      category: 'other'
                    });
                  } catch (error) {
                    if (error instanceof Error) {
                      alert(error.message);
                    }
                  }
                }}
              >
                + 添加活动
              </button>
            </div>

            {activitiesByDate.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📝</div>
                <div className="empty-state-text">还没有活动安排</div>
                <div className="empty-state-subtext">为你的行程添加一些精彩活动吧！</div>
              </div>
            ) : (
              <div>
                {activitiesByDate.map(([date, dateActivities], dateIndex) => (
                  <div key={date} className="timeline-section">
                    <h3 className="timeline-date">{formatDate(date)}</h3>
                    <div className="timeline">
                      {dateActivities.map((activity, index) => (
                        <div
                          key={activity.id}
                          className={`timeline-item ${activity.completed ? 'completed' : ''}`}
                        >
                          <div className="timeline-dot" />
                          <div
                            className={`activity-card ${activity.completed ? 'completed' : ''}`}
                            style={{ animation: `slideInLeft 0.5s ease-out ${(dateIndex * dateActivities.length + index) * 50}ms forwards`, opacity: 0 }}
                          >
                            <div className="activity-header">
                              <div className="activity-time">
                                {activity.time}
                                {activity.completed && <span className="activity-check">✓</span>}
                              </div>
                              <div className="activity-cost">¥{activity.cost.toLocaleString()}</div>
                            </div>
                            <div className="activity-title">{activity.location}</div>
                            {activity.description && (
                              <div className="activity-description">{activity.description}</div>
                            )}
                            <div className="activity-footer">
                              <span
                                className="activity-category"
                                style={{ backgroundColor: CATEGORY_COLORS[activity.category] }}
                              >
                                {CATEGORY_NAMES[activity.category]}
                              </span>
                              <div className="activity-actions">
                                <button
                                  className="icon-btn complete"
                                  onClick={() => onToggleActivity(activity.id)}
                                  title={activity.completed ? '标记未完成' : '标记完成'}
                                >
                                  {activity.completed ? '↩' : '✓'}
                                </button>
                                <button
                                  className="icon-btn delete"
                                  onClick={() => {
                                    if (confirm('确定删除这个活动吗？')) {
                                      onDeleteActivity(activity.id);
                                    }
                                  }}
                                  title="删除"
                                >
                                  🗑
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
        </>
      )}
    </div>
  );
};

export default TripManager;
