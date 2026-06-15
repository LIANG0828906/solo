// 主仪表盘页面
// 组合 ResourceGrid 和 ReservationForm
// 显示预约统计卡片（今日占用率、热门资源TOP3）和最近预约列表
// 数据流向：从 AppContext 读取统计数据
// 被调用方：src/App.tsx
// 调用方：src/context/AppContext.tsx, src/components/ResourceGrid.tsx, src/components/ReservationForm.tsx

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import ResourceGrid from '@/components/ResourceGrid';
import ReservationForm from '@/components/ReservationForm';
import { Resource, Reservation, FilterType, RESOURCE_TYPE_LABELS, RESOURCE_COLORS, ResourceType } from '@/types';
import { format, isToday, differenceInHours, startOfWeek, endOfWeek, isWithinInterval, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';

export default function Dashboard() {
  const { state, setFilterType, setSearchQuery, deleteReservation, filteredResources } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState(9);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSlotClick = (resource: Resource, date: Date, hour: number) => {
    setSelectedResource(resource);
    setSelectedDate(date);
    setSelectedHour(hour);
    setShowForm(true);
  };

  const handleReservationSuccess = () => {
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleCancelReservation = (id: string) => {
    setShowCancelConfirm(id);
  };

  const confirmCancel = () => {
    if (showCancelConfirm) {
      deleteReservation(showCancelConfirm);
      setShowCancelConfirm(null);
    }
  };

  const todayStats = useMemo(() => {
    const totalSlots = filteredResources.length * 9;
    let occupiedSlots = 0;

    state.reservations.forEach((r) => {
      if (isToday(new Date(r.startTime))) {
        const hours = differenceInHours(new Date(r.endTime), new Date(r.startTime));
        occupiedSlots += hours;
      }
    });

    const rate = totalSlots > 0 ? Math.min(100, (occupiedSlots / totalSlots) * 100) : 0;
    return rate.toFixed(1);
  }, [state.reservations, filteredResources.length]);

  const topResources = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

    const countMap: Record<string, number> = {};
    state.reservations.forEach((r) => {
      if (isWithinInterval(new Date(r.startTime), { start: weekStart, end: weekEnd })) {
        countMap[r.resourceId] = (countMap[r.resourceId] || 0) + 1;
      }
    });

    const sorted = state.resources
      .map((r) => ({
        ...r,
        count: countMap[r.id] || 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return sorted;
  }, [state.reservations, state.resources]);

  const avgDurationData = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return days.slice(0, 14).map((day) => {
      const dayReservations = state.reservations.filter(
        (r) => isToday(new Date(r.startTime)) || format(new Date(r.startTime), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      );
      const totalMinutes = dayReservations.reduce((sum, r) => {
        return sum + differenceInHours(new Date(r.endTime), new Date(r.startTime)) * 60;
      }, 0);
      const avg = dayReservations.length > 0 ? totalMinutes / dayReservations.length : 0;
      return {
        day: format(day, 'M/d'),
        avgMinutes: Math.round(avg),
      };
    });
  }, [state.reservations]);

  const recentReservations = useMemo(() => {
    return [...state.reservations]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [state.reservations]);

  const getResourceById = (id: string) => state.resources.find((r) => r.id === id);

  const filterOptions: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'station', label: '工位' },
    { key: 'meeting_room', label: '会议室' },
    { key: 'discussion_area', label: '讨论区' },
    { key: 'terrace', label: '露台座位' },
  ];

  const maxCount = Math.max(...topResources.map((r) => r.count), 1);
  const maxAvg = Math.max(...avgDurationData.map((d) => d.avgMinutes), 60);

  const occupancyRate = parseFloat(todayStats);
  const strokeColor = occupancyRate > 70 ? '#ef4444' : occupancyRate > 40 ? '#f59e0b' : '#10b981';
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (occupancyRate / 100) * circumference;

  return (
    <div className="dashboard">
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">📅 办公空间调度</h1>
        </div>
        <div className="header-right">
          <div className="user-info">
            <span className="user-avatar">{state.currentUser?.name.charAt(0)}</span>
            <span className="user-name">{state.currentUser?.name}</span>
            <span className="user-role">{state.currentUser?.role === 'admin' ? '管理员' : '用户'}</span>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-title">今日占用率</div>
            <div className="stat-chart-ring">
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="45" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
                <text x="60" y="58" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#333">
                  {todayStats}%
                </text>
                <text x="60" y="75" textAnchor="middle" fontSize="11" fill="#999">
                  占用率
                </text>
              </svg>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-title">本周热门资源 TOP3</div>
            <div className="bar-chart">
              {topResources.map((r, idx) => (
                <div key={r.id} className="bar-item">
                  <div className="bar-label">
                    <span className="bar-rank">{idx + 1}</span>
                    <span className="bar-name">{r.name}</span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${(r.count / maxCount) * 100}%`,
                        backgroundColor: RESOURCE_COLORS[r.type as ResourceType],
                      }}
                    />
                  </div>
                  <span className="bar-value">{r.count}次</span>
                </div>
              ))}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-title">本月平均预约时长</div>
            <div className="line-chart">
              <svg viewBox="0 0 280 100" preserveAspectRatio="none" style={{ width: '100%', height: 80 }}>
                {avgDurationData.map((d, i) => {
                  const x = (i / (avgDurationData.length - 1 || 1)) * 260 + 10;
                  const y = 85 - (d.avgMinutes / maxAvg) * 70;
                  return (
                    <circle key={i} cx={x} cy={y} r="3" fill="#1E88E5" />
                  );
                })}
                <path
                  d={avgDurationData
                    .map((d, i) => {
                      const x = (i / (avgDurationData.length - 1 || 1)) * 260 + 10;
                      const y = 85 - (d.avgMinutes / maxAvg) * 70;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#1E88E5"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="chart-labels">
                {avgDurationData.filter((_, i) => i % 3 === 0).map((d, i) => (
                  <span key={i} className="chart-label">{d.day}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-tabs">
            {filterOptions.map((opt) => (
              <button
                key={opt.key}
                className={`filter-tab ${state.filterType === opt.key ? 'active' : ''}`}
                onClick={() => setFilterType(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="search-box">
            <input
              type="text"
              placeholder="搜索资源名称..."
              value={state.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="main-section">
          <div className="calendar-section">
            <ResourceGrid
              onSlotClick={handleSlotClick}
              onReservationClick={(r) => console.log('Reservation clicked:', r)}
            />
          </div>

          <div className="side-panel">
            <div className="recent-section">
              <h3>最近预约</h3>
              <div className="recent-list">
                {recentReservations.map((r) => {
                  const resource = getResourceById(r.resourceId);
                  return (
                    <div key={r.id} className="recent-item" style={{ borderLeftColor: resource?.color }}>
                      <div className="recent-info">
                        <div className="recent-resource">{resource?.name}</div>
                        <div className="recent-user">{r.userName}</div>
                        <div className="recent-time">
                          {format(new Date(r.startTime), 'MM-dd HH:mm')} - {format(new Date(r.endTime), 'HH:mm')}
                        </div>
                      </div>
                      <button
                        className="cancel-btn"
                        onClick={() => handleCancelReservation(r.id)}
                      >
                        取消
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ReservationForm
        visible={showForm}
        preselectedResource={selectedResource}
        preselectedDate={selectedDate}
        preselectedHour={selectedHour}
        onClose={() => setShowForm(false)}
        onSuccess={handleReservationSuccess}
      />

      {showSuccessToast && (
        <div className="success-toast">
          ✅ 预约成功！
        </div>
      )}

      {showCancelConfirm && (
        <div className="confirm-overlay" onClick={() => setShowCancelConfirm(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>确认取消</h3>
            <p>确定要取消这个预约吗？</p>
            <div className="confirm-actions">
              <button className="btn-cancel" onClick={() => setShowCancelConfirm(null)}>
                返回
              </button>
              <button className="btn-danger" onClick={confirmCancel}>
                确认取消
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 0;
          font-family: 'Inter', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #f5f7fa;
          color: #333;
        }

        .dashboard {
          min-height: 100vh;
          background: #f5f7fa;
        }

        .app-header {
          background: white;
          border-bottom: 1px solid #E0E0E0;
          padding: 14px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .app-title {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #1E88E5;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #1E88E5;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
        }

        .user-name {
          font-weight: 500;
          font-size: 14px;
        }

        .user-role {
          font-size: 12px;
          color: #999;
          background: #f0f0f0;
          padding: 2px 8px;
          border-radius: 10px;
        }

        .dashboard-content {
          padding: 20px 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .stats-section {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: white;
          border: 1px solid #E0E0E0;
          border-radius: 4px;
          box-shadow: 0 8px 16px rgba(0,0,0,0.04);
          padding: 20px;
          transition: transform 0.15s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.08);
        }

        .stat-title {
          font-size: 14px;
          font-weight: 600;
          color: #555;
          margin-bottom: 16px;
        }

        .stat-chart-ring {
          display: flex;
          justify-content: center;
        }

        .bar-chart {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .bar-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .bar-label {
          width: 90px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .bar-rank {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
          color: #666;
        }

        .bar-name {
          font-size: 12px;
          font-weight: 500;
          color: #333;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .bar-track {
          flex: 1;
          height: 20px;
          background: #f5f5f5;
          border-radius: 4px;
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        .bar-value {
          font-size: 12px;
          color: #666;
          font-weight: 500;
          width: 35px;
          text-align: right;
        }

        .line-chart {
          width: 100%;
        }

        .chart-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
        }

        .chart-label {
          font-size: 10px;
          color: #999;
        }

        .filter-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .filter-tabs {
          display: flex;
          gap: 4px;
          background: white;
          padding: 4px;
          border-radius: 6px;
          border: 1px solid #E0E0E0;
        }

        .filter-tab {
          padding: 8px 16px;
          border: none;
          background: transparent;
          border-radius: 4px;
          font-size: 13px;
          cursor: pointer;
          color: #666;
          transition: all 0.15s ease;
          font-family: inherit;
        }

        .filter-tab:hover {
          color: #1E88E5;
        }

        .filter-tab.active {
          background: #1E88E5;
          color: white;
        }

        .search-box input {
          padding: 8px 14px;
          border: 1px solid #E0E0E0;
          border-radius: 6px;
          font-size: 13px;
          width: 200px;
          transition: border-color 0.15s;
          font-family: inherit;
        }

        .search-box input:focus {
          outline: none;
          border-color: #1E88E5;
        }

        .main-section {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 20px;
        }

        .calendar-section {
          min-width: 0;
        }

        .side-panel {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .recent-section {
          background: white;
          border: 1px solid #E0E0E0;
          border-radius: 4px;
          box-shadow: 0 8px 16px rgba(0,0,0,0.04);
          padding: 16px;
        }

        .recent-section h3 {
          margin: 0 0 12px 0;
          font-size: 15px;
          font-weight: 600;
          color: #333;
        }

        .recent-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 500px;
          overflow-y: auto;
        }

        .recent-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: #fafafa;
          border-radius: 4px;
          border-left: 3px solid #1E88E5;
          transition: all 0.15s ease;
        }

        .recent-item:hover {
          background: #f0f0f0;
        }

        .recent-resource {
          font-weight: 600;
          font-size: 13px;
          color: #333;
        }

        .recent-user {
          font-size: 12px;
          color: #666;
          margin: 2px 0;
        }

        .recent-time {
          font-size: 11px;
          color: #999;
        }

        .cancel-btn {
          padding: 4px 10px;
          font-size: 12px;
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
        }

        .cancel-btn:hover {
          background: #fee2e2;
          transform: scale(1.05);
        }

        .cancel-btn:active {
          transform: scale(0.95);
        }

        .success-toast {
          position: fixed;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          background: #10b981;
          color: white;
          padding: 12px 24px;
          border-radius: 6px;
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
          font-size: 14px;
          font-weight: 500;
          z-index: 2000;
          animation: slideUp 0.3s ease;
        }

        .confirm-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1500;
          animation: fadeIn 0.2s ease;
        }

        .confirm-modal {
          background: white;
          border-radius: 8px;
          padding: 24px;
          width: 90%;
          max-width: 360px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          animation: scaleIn 0.2s ease;
        }

        .confirm-modal h3 {
          margin: 0 0 10px 0;
          font-size: 18px;
          color: #333;
        }

        .confirm-modal p {
          margin: 0 0 20px 0;
          color: #666;
          font-size: 14px;
        }

        .confirm-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .btn-cancel,
        .btn-danger {
          padding: 8px 18px;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          border: none;
          font-family: inherit;
        }

        .btn-cancel {
          background: #f5f5f5;
          color: #666;
        }

        .btn-cancel:hover {
          background: #e5e5e5;
          transform: scale(1.05);
        }

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .btn-danger:hover {
          background: #dc2626;
          transform: scale(1.05);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        @media (max-width: 1023px) {
          .main-section {
            grid-template-columns: 1fr;
          }

          .side-panel {
            order: -1;
          }

          .stats-section {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .app-header {
            padding: 12px 16px;
          }

          .dashboard-content {
            padding: 12px 16px;
          }

          .filter-section {
            flex-direction: column;
            align-items: stretch;
          }

          .filter-tabs {
            overflow-x: auto;
            justify-content: flex-start;
          }

          .search-box input {
            width: 100%;
          }

          .user-name {
            display: none;
          }

          .user-role {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
