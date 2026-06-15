import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { eventAPI } from '../services/api';
import type { Event, CheckInRecord } from '../types';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<(Event & { participants: CheckInRecord[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const result = await eventAPI.getById(id);
        setData(result);
      } catch (err) {
        console.error('Failed to fetch event:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const getStatusLabel = (status: Event['status']) => {
    switch (status) {
      case 'ongoing':
        return '进行中';
      case 'upcoming':
        return '即将开始';
      case 'ended':
        return '已结束';
    }
  };

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-icon">⏳</div>
          <div className="empty-text">加载中...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-icon">❓</div>
          <div className="empty-text">活动不存在</div>
          <button className="btn btn-primary" onClick={() => navigate('/events')}>
            返回活动列表
          </button>
        </div>
      </div>
    );
  }

  const checkInRate = data.maxParticipants > 0
    ? Math.round((data.checkInCount / data.maxParticipants) * 100)
    : 0;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{data.title}</h1>
          <p className="page-subtitle">
            <span className={'event-status ' + data.status} style={{ marginRight: '12px' }}>
              {getStatusLabel(data.status)}
            </span>
            活动编码: <span className="event-card-code" style={{ padding: '2px 6px' }}>{data.code}</span>
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/events')}>
          ← 返回列表
        </button>
      </div>

      <div className="event-detail-grid event-detail-card">
        <div className="card">
          <div className="event-detail-info">
            <div className="event-detail-row">
              <div className="event-detail-label">🕐 开始时间</div>
              <div className="event-detail-value">
                {new Date(data.startTime).toLocaleString('zh-CN')}
              </div>
            </div>
            <div className="event-detail-row">
              <div className="event-detail-label">🕐 结束时间</div>
              <div className="event-detail-value">
                {new Date(data.endTime).toLocaleString('zh-CN')}
              </div>
            </div>
            <div className="event-detail-row">
              <div className="event-detail-label">📍 活动地点</div>
              <div className="event-detail-value">{data.location}</div>
            </div>
            <div className="event-detail-row">
              <div className="event-detail-label">👥 参与人数</div>
              <div className="event-detail-value">
                {data.checkInCount} / {data.maxParticipants} 人
                <span style={{ marginLeft: '12px', color: 'var(--primary)', fontWeight: 600 }}>
                  签到率 {checkInRate}%
                </span>
              </div>
            </div>
            <div className="event-detail-row" style={{ alignItems: 'flex-start' }}>
              <div className="event-detail-label">📝 活动描述</div>
              <div className="event-description" style={{ flex: 1 }}>
                {data.description}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="event-detail-side">
            <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>
              签到二维码
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div className="qr-code-wrapper">
                <QRCodeSVG
                  value={data.qrCode}
                  size={180}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>
            <div style={{ textAlign: 'center', fontFamily: "'Courier New', monospace", fontSize: '24px', fontWeight: 700, letterSpacing: '4px', color: 'var(--primary)' }}>
              {data.code}
            </div>
          </div>
        </div>
      </div>

      <div className="participants-section">
        <h2 className="participants-title">
          参与人列表 ({data.participants.length})
        </h2>
        {data.participants.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <div className="empty-text">暂无签到记录</div>
            </div>
          </div>
        ) : (
          <div className="participants-list">
            {data.participants.map((p, idx) => (
              <div key={p.id} className="participant-item event-detail-card" style={{ animationDelay: `${idx * 0.03}s` }}>
                <div className="avatar">{getInitial(p.participantName)}</div>
                <div className="participant-info">
                  <div className="participant-name">{p.participantName}</div>
                  <div className="participant-time">
                    签到时间: {new Date(p.checkInTime).toLocaleString('zh-CN')}
                  </div>
                </div>
                <span className="participant-status checked">✓ 已签到</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
