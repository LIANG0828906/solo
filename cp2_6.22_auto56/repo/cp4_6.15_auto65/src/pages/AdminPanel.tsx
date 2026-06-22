// 管理面板页面
// 允许管理员添加/删除资源、设置节假日全天禁用时段、查看所有预约历史
// 数据流向：直接更新 AppContext 中的资源列表和全局禁用时段
// 被调用方：src/App.tsx
// 调用方：src/context/AppContext.tsx

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { ResourceType, RESOURCE_TYPE_LABELS, RESOURCE_COLORS } from '@/types';
import { format, parseISO, eachDayOfInterval, startOfWeek, endOfWeek, isWeekend } from 'date-fns';

export default function AdminPanel() {
  const { state, addResource, deleteResource, addBlockedPeriod, deleteBlockedPeriod } = useApp();
  const [activeTab, setActiveTab] = useState<'resources' | 'blocked' | 'history'>('resources');
  const [newResourceName, setNewResourceName] = useState('');
  const [newResourceType, setNewResourceType] = useState<ResourceType>('station');
  const [newResourceCapacity, setNewResourceCapacity] = useState('');
  const [blockedDate, setBlockedDate] = useState('');
  const [blockedReason, setBlockedReason] = useState('节假日');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResourceName.trim()) return;

    addResource({
      name: newResourceName.trim(),
      type: newResourceType,
      color: RESOURCE_COLORS[newResourceType],
      capacity: newResourceCapacity ? parseInt(newResourceCapacity) : undefined,
    });

    setNewResourceName('');
    setNewResourceCapacity('');
  };

  const handleDeleteResource = (id: string) => {
    setDeletingId(id);
    setTimeout(() => {
      deleteResource(id);
      setDeletingId(null);
    }, 300);
  };

  const handleAddBlockedDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockedDate) return;

    addBlockedPeriod({
      date: blockedDate,
      reason: blockedReason,
      isAllDay: true,
    });

    setBlockedDate('');
  };

  const handleAddWeekends = () => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    days.forEach((day) => {
      if (isWeekend(day)) {
        addBlockedPeriod({
          date: format(day, 'yyyy-MM-dd'),
          reason: '周末',
          isAllDay: true,
        });
      }
    });
  };

  const handleDeleteBlocked = (id: string) => {
    deleteBlockedPeriod(id);
  };

  const sortedBlockedPeriods = useMemo(() => {
    return [...state.blockedPeriods].sort((a, b) => a.date.localeCompare(b.date));
  }, [state.blockedPeriods]);

  const allReservations = useMemo(() => {
    return [...state.reservations].sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }, [state.reservations]);

  const getResourceById = (id: string) => state.resources.find((r) => r.id === id);

  const tabs = [
    { key: 'resources', label: '资源管理' },
    { key: 'blocked', label: '节假日设置' },
    { key: 'history', label: '预约历史' },
  ];

  return (
    <div className="admin-panel">
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">⚙️ 管理面板</h1>
        </div>
        <div className="header-right">
          <span className="admin-badge">管理员模式</span>
        </div>
      </header>

      <div className="admin-content">
        <div className="admin-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`admin-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'resources' && (
          <div className="tab-content">
            <div className="admin-card">
              <h2>添加资源</h2>
              <form onSubmit={handleAddResource} className="add-form">
                <div className="form-row">
                  <div className="form-item">
                    <label>资源名称</label>
                    <input
                      type="text"
                      value={newResourceName}
                      onChange={(e) => setNewResourceName(e.target.value)}
                      placeholder="请输入资源名称"
                    />
                  </div>
                  <div className="form-item">
                    <label>资源类型</label>
                    <select
                      value={newResourceType}
                      onChange={(e) => setNewResourceType(e.target.value as ResourceType)}
                    >
                      <option value="station">工位</option>
                      <option value="meeting_room">会议室</option>
                      <option value="discussion_area">讨论区</option>
                      <option value="terrace">露台座位</option>
                    </select>
                  </div>
                  <div className="form-item">
                    <label>容纳人数(可选)</label>
                    <input
                      type="number"
                      value={newResourceCapacity}
                      onChange={(e) => setNewResourceCapacity(e.target.value)}
                      placeholder="人数"
                    />
                  </div>
                  <div className="form-item form-item-button">
                    <label>&nbsp;</label>
                    <button type="submit" className="btn-primary">
                      + 添加
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <div className="admin-card">
              <h2>资源列表 ({state.resources.length})</h2>
              <div className="resource-list">
                {state.resources.map((resource) => (
                  <div
                    key={resource.id}
                    className={`resource-list-item ${deletingId === resource.id ? 'deleting' : ''}`}
                    style={{ borderLeftColor: resource.color }}
                  >
                    <div className="resource-list-info">
                      <span className="resource-list-name">{resource.name}</span>
                      <span className="resource-list-type" style={{ color: resource.color }}>
                        {RESOURCE_TYPE_LABELS[resource.type]}
                      </span>
                      {resource.capacity && (
                        <span className="resource-list-capacity">容纳 {resource.capacity} 人</span>
                      )}
                    </div>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteResource(resource.id)}
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'blocked' && (
          <div className="tab-content">
            <div className="admin-card">
              <h2>添加禁用日期</h2>
              <form onSubmit={handleAddBlockedDate} className="add-form">
                <div className="form-row">
                  <div className="form-item">
                    <label>日期</label>
                    <input
                      type="date"
                      value={blockedDate}
                      onChange={(e) => setBlockedDate(e.target.value)}
                    />
                  </div>
                  <div className="form-item">
                    <label>原因</label>
                    <input
                      type="text"
                      value={blockedReason}
                      onChange={(e) => setBlockedReason(e.target.value)}
                      placeholder="请输入原因"
                    />
                  </div>
                  <div className="form-item form-item-button">
                    <label>&nbsp;</label>
                    <button type="submit" className="btn-primary">
                      + 添加
                    </button>
                  </div>
                </div>
                <div className="batch-actions">
                  <button type="button" className="btn-secondary" onClick={handleAddWeekends}>
                    📅 批量设置本周末禁用
                  </button>
                </div>
              </form>
            </div>

            <div className="admin-card">
              <h2>禁用日期列表 ({sortedBlockedPeriods.length})</h2>
              {sortedBlockedPeriods.length === 0 ? (
                <p className="empty-state">暂无禁用日期</p>
              ) : (
                <div className="blocked-list">
                  {sortedBlockedPeriods.map((blocked) => (
                    <div key={blocked.id} className="blocked-item slide-out">
                      <div className="blocked-info">
                        <span className="blocked-date">📅 {blocked.date}</span>
                        <span className="blocked-reason">{blocked.reason}</span>
                      </div>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteBlocked(blocked.id)}
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="tab-content">
            <div className="admin-card">
              <h2>所有预约历史 ({allReservations.length})</h2>
              {allReservations.length === 0 ? (
                <p className="empty-state">暂无预约记录</p>
              ) : (
                <div className="history-table-wrapper">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>资源</th>
                        <th>预约人</th>
                        <th>开始时间</th>
                        <th>结束时间</th>
                        <th>备注</th>
                        <th>创建时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allReservations.map((r) => {
                        const resource = getResourceById(r.resourceId);
                        return (
                          <tr key={r.id}>
                            <td>
                              <span
                                className="table-resource"
                                style={{ borderLeftColor: resource?.color }}
                              >
                                {resource?.name}
                              </span>
                            </td>
                            <td>{r.userName}</td>
                            <td>{format(new Date(r.startTime), 'yyyy-MM-dd HH:mm')}</td>
                            <td>{format(new Date(r.endTime), 'HH:mm')}</td>
                            <td>{r.note || '-'}</td>
                            <td className="text-muted">
                              {format(new Date(r.createdAt), 'MM-dd HH:mm')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

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

        .admin-panel {
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

        .admin-badge {
          background: #1E88E5;
          color: white;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }

        .admin-content {
          padding: 20px 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .admin-tabs {
          display: flex;
          gap: 4px;
          background: white;
          padding: 4px;
          border-radius: 6px;
          border: 1px solid #E0E0E0;
          margin-bottom: 20px;
          width: fit-content;
        }

        .admin-tab {
          padding: 10px 20px;
          border: none;
          background: transparent;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          color: #666;
          transition: all 0.15s ease;
          font-weight: 500;
          font-family: inherit;
        }

        .admin-tab:hover {
          color: #1E88E5;
        }

        .admin-tab.active {
          background: #1E88E5;
          color: white;
        }

        .tab-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .admin-card {
          background: white;
          border: 1px solid #E0E0E0;
          border-radius: 4px;
          box-shadow: 0 8px 16px rgba(0,0,0,0.04);
          padding: 20px;
        }

        .admin-card h2 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }

        .add-form {
          margin-bottom: 8px;
        }

        .form-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: flex-end;
        }

        .form-item {
          flex: 1;
          min-width: 150px;
        }

        .form-item-button {
          flex: 0 0 auto;
          min-width: auto;
        }

        .form-item label {
          display: block;
          margin-bottom: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #555;
        }

        .form-item input,
        .form-item select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #E0E0E0;
          border-radius: 4px;
          font-size: 13px;
          font-family: inherit;
          transition: border-color 0.15s;
        }

        .form-item input:focus,
        .form-item select:focus {
          outline: none;
          border-color: #1E88E5;
        }

        .btn-primary {
          padding: 9px 20px;
          background: #1E88E5;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
          white-space: nowrap;
        }

        .btn-primary:hover {
          background: #1976D2;
          transform: scale(1.05);
        }

        .btn-primary:active {
          transform: scale(0.95);
        }

        .btn-secondary {
          padding: 8px 16px;
          background: #f5f5f5;
          color: #555;
          border: 1px solid #E0E0E0;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
        }

        .btn-secondary:hover {
          background: #e5e5e5;
          transform: scale(1.05);
        }

        .batch-actions {
          margin-top: 12px;
        }

        .resource-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 10px;
        }

        .resource-list-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #fafafa;
          border-radius: 4px;
          border-left: 4px solid #1E88E5;
          transition: all 0.3s ease;
        }

        .resource-list-item.deleting {
          animation: slideOutLeft 0.3s ease forwards;
        }

        @keyframes slideOutLeft {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(-100%);
          }
        }

        .resource-list-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .resource-list-name {
          font-weight: 600;
          font-size: 14px;
          color: #333;
        }

        .resource-list-type {
          font-size: 12px;
          font-weight: 500;
        }

        .resource-list-capacity {
          font-size: 11px;
          color: #999;
        }

        .btn-delete {
          padding: 5px 12px;
          font-size: 12px;
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
        }

        .btn-delete:hover {
          background: #fee2e2;
          transform: scale(1.05);
        }

        .btn-delete:active {
          transform: scale(0.95);
        }

        .empty-state {
          text-align: center;
          color: #999;
          padding: 30px;
          font-size: 14px;
        }

        .blocked-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .blocked-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: repeating-linear-gradient(
            45deg,
            #f9fafb,
            #f9fafb 5px,
            #f3f4f6 5px,
            #f3f4f6 10px
          );
          border-radius: 4px;
          border: 1px solid #e5e7eb;
          transition: all 0.3s ease;
        }

        .blocked-item.slide-out:hover {
          transform: translateX(4px);
        }

        .blocked-info {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .blocked-date {
          font-weight: 600;
          font-size: 13px;
          color: #333;
        }

        .blocked-reason {
          font-size: 12px;
          color: #666;
        }

        .history-table-wrapper {
          overflow-x: auto;
        }

        .history-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .history-table th {
          text-align: left;
          padding: 12px;
          border-bottom: 2px solid #E0E0E0;
          font-weight: 600;
          color: #555;
          background: #fafafa;
          font-size: 12px;
        }

        .history-table td {
          padding: 12px;
          border-bottom: 1px solid #f0f0f0;
        }

        .history-table tr:hover {
          background: #fafafa;
        }

        .table-resource {
          display: inline-block;
          padding-left: 8px;
          border-left: 3px solid #1E88E5;
          font-weight: 500;
        }

        .text-muted {
          color: #999;
        }

        @media (max-width: 768px) {
          .app-header {
            padding: 12px 16px;
          }

          .admin-content {
            padding: 12px 16px;
          }

          .admin-tabs {
            overflow-x: auto;
            width: 100%;
          }

          .form-row {
            flex-direction: column;
          }

          .form-item {
            width: 100%;
          }

          .resource-list {
            grid-template-columns: 1fr;
          }

          .history-table th,
          .history-table td {
            padding: 8px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
