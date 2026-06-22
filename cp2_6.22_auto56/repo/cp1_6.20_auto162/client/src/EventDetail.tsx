import { useState, useEffect, useCallback } from 'react';
import { EventData, ParticipantData } from './types';
import QRCodeDisplay from './QRCodeDisplay';

interface EventDetailProps {
  eventId: string;
  onBack: () => void;
  onNavigate: (path: string) => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

function EventDetail({ eventId, onBack, onNavigate, showToast }: EventDetailProps) {
  const [event, setEvent] = useState<EventData | null>(null);
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [registered, setRegistered] = useState<ParticipantData | null>(null);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [role, setRole] = useState('VIP');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchEvent = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setEvent(data);
      }
    } catch (err) {
      console.error('获取活动详情失败:', err);
    }
  }, [eventId]);

  const fetchParticipants = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/participants`);
      if (res.ok) {
        const data = await res.json();
        setParticipants(data);
      }
    } catch (err) {
      console.error('获取参与者列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
    fetchParticipants();
  }, [fetchEvent, fetchParticipants]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !contact || !role) {
      showToast('请填写所有必填字段', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, contact, role }),
      });

      if (res.ok) {
        const data = await res.json();
        setRegistered(data);
        fetchParticipants();
        showToast('报名成功', 'success');
      } else {
        const errData = await res.json();
        showToast(errData.error || '报名失败', 'error');
      }
    } catch (err) {
      showToast('报名失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="empty-state">
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container">
        <div className="empty-state">
          <p>活动不存在</p>
          <button className="btn-primary" onClick={onBack} style={{ marginTop: '16px' }}>
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const eventUrl = `${window.location.origin}${window.location.pathname}#/event/${eventId}`;
  const totalRegistered = participants.length;
  const progressPercent = Math.min((totalRegistered / event.maxCapacity) * 100, 100);

  const roleCounts: Record<string, number> = {};
  participants.forEach((p) => {
    roleCounts[p.role] = (roleCounts[p.role] || 0) + 1;
  });

  return (
    <div>
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn-secondary" onClick={onBack}>
            ← 返回
          </button>
          <h1>活动详情</h1>
        </div>
        <button className="btn-secondary" onClick={() => onNavigate(`/admin/${eventId}`)}>
          🛠 管理后台
        </button>
      </div>

      <div className="detail-container">
        <div className="detail-header">
          <h2>{event.name}</h2>
          <div className="detail-info">
            <p><strong>📅 日期：</strong>{event.date} {event.time}</p>
            <p><strong>📍 地点：</strong>{event.location}</p>
            <p><strong>👥 容量：</strong>{totalRegistered} / {event.maxCapacity} 人</p>
            <div className="progress-bar" style={{ marginTop: '12px' }}>
              <div
                className="progress-bar-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div style={{ marginTop: '12px' }}>
              {Object.entries(event.roleLimits).map(([roleName, limit]) => (
                <span
                  key={roleName}
                  style={{
                    display: 'inline-block',
                    marginRight: '16px',
                    padding: '4px 12px',
                    backgroundColor: '#e0e7ff',
                    borderRadius: '16px',
                    fontSize: '13px',
                    color: '#1e3a8a',
                  }}
                >
                  {roleName}: {roleCounts[roleName] || 0} / {limit}
                </span>
              ))}
            </div>
          </div>
        </div>

        <QRCodeDisplay activityUrl={eventUrl} />

        {registered ? (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h2 style={{ color: '#16a34a', marginBottom: '16px' }}>报名成功！</h2>
            <p style={{ color: '#6b7280', marginBottom: '8px' }}>
              您好，{registered.name}！请保存以下签到码用于活动当天签到：
            </p>
            <div className="checkin-code">{registered.checkInCode}</div>
            <p style={{ color: '#6b7280', fontSize: '13px' }}>
              签到码也将在活动现场通过工作人员扫码确认
            </p>
          </div>
        ) : (
          <div style={{ marginTop: '24px' }}>
            <h2 style={{ color: '#1e3a8a', marginBottom: '20px', fontSize: '20px' }}>在线报名</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>姓名 *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入您的姓名"
                />
              </div>

              <div className="form-group">
                <label>联系方式 *</label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="请输入手机号或邮箱"
                />
              </div>

              <div className="form-group">
                <label>角色选择 *</label>
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  {Object.entries(event.roleLimits).map(([roleName, limit]) => {
                    const count = roleCounts[roleName] || 0;
                    const full = count >= limit;
                    return (
                      <option key={roleName} value={roleName} disabled={full}>
                        {roleName} (剩余 {limit - count} / {limit})
                      </option>
                    );
                  })}
                </select>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={submitting || totalRegistered >= event.maxCapacity}
              >
                {submitting && <span className="loading-spinner" />}
                {submitting
                  ? '提交中...'
                  : totalRegistered >= event.maxCapacity
                  ? '活动名额已满'
                  : '提交报名'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventDetail;
