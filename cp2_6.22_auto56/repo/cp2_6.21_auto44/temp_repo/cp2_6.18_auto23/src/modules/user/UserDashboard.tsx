import { useMemo, memo } from 'react';
import { useEventStore } from '../../store/eventStore';
import { formatDate } from '../../utils/helpers';
import { RegistrationStatus } from '../../types';
import './UserDashboard.css';

interface UserDashboardProps {
  onEventClick: (eventId: string) => void;
}

function UserDashboard({ onEventClick }: UserDashboardProps) {
  const { registrations, events, cancelRegistration, getRegistrationStats, loading } = useEventStore();

  const stats = useMemo(() => {
    return getRegistrationStats();
  }, [getRegistrationStats]);

  const registrationsWithEvents = useMemo(() => {
    return registrations
      .filter((r) => r.status !== 'cancelled')
      .map((reg) => {
        const event = events.find((e) => e.id === reg.eventId);
        return {
          ...reg,
          event,
        };
      })
      .filter((r) => r.event)
      .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());
  }, [registrations, events]);

  const getStatusInfo = (status: RegistrationStatus) => {
    const map = {
      registered: { text: '已报名', color: '#3B82F6', bgColor: '#EFF6FF' },
      attended: { text: '已参加', color: '#10B981', bgColor: '#ECFDF5' },
      cancelled: { text: '已取消', color: '#EF4444', bgColor: '#FEF2F2' },
    };
    return map[status];
  };

  const handleCancelRegistration = async (registrationId: string) => {
    if (!confirm('确定要取消报名吗？')) return;
    await cancelRegistration(registrationId);
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">个人中心</h1>
        <p className="page-subtitle">管理您的活动报名</p>
      </div>

      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon total">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">总报名数</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon upcoming">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.upcoming}</span>
            <span className="stat-label">即将参加</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon ended">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.ended}</span>
            <span className="stat-label">已结束</span>
          </div>
        </div>
      </div>

      <div className="registrations-section">
        <h2 className="section-title">我的报名</h2>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>加载中...</p>
          </div>
        ) : registrationsWithEvents.length > 0 ? (
          <div className="registrations-table-wrapper">
            <table className="registrations-table">
              <thead>
                <tr>
                  <th>活动名称</th>
                  <th>活动时间</th>
                  <th>地点</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {registrationsWithEvents.map((reg) => {
                  const statusInfo = getStatusInfo(reg.status as RegistrationStatus);
                  return (
                    <tr key={reg.id}>
                      <td>
                        <button
                          className="event-link"
                          onClick={() => onEventClick(reg.eventId)}
                        >
                          {reg.event?.title}
                        </button>
                      </td>
                      <td>{formatDate(reg.event?.startDate || '')}</td>
                      <td className="location-cell">{reg.event?.location}</td>
                      <td>
                        <span
                          className="status-tag"
                          style={{ color: statusInfo.color, backgroundColor: statusInfo.bgColor }}
                        >
                          {statusInfo.text}
                        </span>
                      </td>
                      <td>
                        {reg.status !== 'cancelled' && reg.event?.status !== 'ended' && (
                          <button
                            className="cancel-btn"
                            onClick={() => handleCancelRegistration(reg.id)}
                          >
                            取消报名
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-registrations">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <h3>暂无报名记录</h3>
            <p>快去活动列表发现感兴趣的活动吧</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(UserDashboard);
