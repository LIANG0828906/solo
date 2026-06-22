import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { activityApi, Activity } from './api';
import { useApp } from './context/AppContext';

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const MapPinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

const CheckInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${y}年${m}月${day}日 ${weekdays[d.getDay()]} ${h}:${min}`;
};

const ActivityDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState<'register' | 'unregister' | 'checkin' | null>(null);
  const { toast, user, refreshUser } = useApp();

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await activityApi.detail(id);
      setActivity(res.data);
    } catch (err: any) {
      toast(err.response?.data?.error || '加载活动详情失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleRegister = async () => {
    if (!id) return;
    setBtnLoading('register');
    try {
      await activityApi.register(id);
      toast('报名成功！我们活动现场见🌿', 'success');
      fetchDetail();
    } catch (err: any) {
      toast(err.response?.data?.error || '报名失败', 'error');
    } finally {
      setBtnLoading(null);
    }
  };

  const handleUnregister = async () => {
    if (!id) return;
    setBtnLoading('unregister');
    try {
      await activityApi.unregister(id);
      toast('已取消报名', 'info');
      fetchDetail();
    } catch (err: any) {
      toast(err.response?.data?.error || '取消失败', 'error');
    } finally {
      setBtnLoading(null);
    }
  };

  const handleCheckin = async () => {
    if (!id) return;
    setBtnLoading('checkin');
    try {
      const res = await activityApi.checkin(id);
      toast(`${res.data.message} 🎉`, 'success');
      fetchDetail();
      if (user) {
        refreshUser({ ...user, points: user.points + (res.data.points || 0) });
      }
    } catch (err: any) {
      toast(err.response?.data?.error || '签到失败', 'error');
    } finally {
      setBtnLoading(null);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 360, borderRadius: 'var(--radius-lg)', marginBottom: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 28 }}>
          <div className="card" style={{ padding: 24 }}>
            <div className="skeleton" style={{ height: 32, width: '60%', marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 14, width: '90%', marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 14, width: '85%', marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 14, width: '80%' }} />
          </div>
          <div className="card" style={{ padding: 24, minHeight: 320 }} />
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="empty-state">
        <h3>活动不存在</h3>
        <Link to="/activities" className="btn btn-primary" style={{ marginTop: 16 }}>返回活动列表</Link>
      </div>
    );
  }

  const slotsLeft = activity.maxParticipants - activity.registeredCount;
  const slotsFull = slotsLeft <= 0;
  const pct = Math.min(100, Math.round((activity.registeredCount / activity.maxParticipants) * 100));
  const isCreator = user?.id === activity.creatorId;

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="btn btn-ghost"
        style={{ marginBottom: 20, paddingLeft: 0 }}
      >
        <ArrowLeftIcon />
        返回
      </button>

      <div
        style={{
          height: 360,
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          marginBottom: 28,
          position: 'relative',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <img
          src={activity.coverImage}
          alt={activity.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80';
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(27,67,50,0.7) 0%, transparent 60%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: 32,
            right: 32,
            color: 'white',
          }}
        >
          {isCreator && (
            <span
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: 20,
                background: 'rgba(233,216,166,0.95)',
                color: 'var(--earth-700)',
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              ✨ 我发起的活动
            </span>
          )}
          <h1 style={{ fontSize: 32, color: 'white', marginBottom: 8, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
            {activity.title}
          </h1>
        </div>
      </div>

      <div className="detail-layout">
        <div className="detail-left">
          <div className="card" style={{ padding: 28 }}>
            <h2 style={{ fontSize: 20, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              📋 活动信息
            </h2>

            <div style={{ borderBottom: '1px solid var(--forest-50)', paddingBottom: 8 }}>
              <div className="info-row">
                <div className="info-icon"><CalendarIcon /></div>
                <div className="info-content">
                  <div className="info-label">活动时间</div>
                  <div className="info-value">{formatDate(activity.date)}</div>
                </div>
              </div>

              <div className="info-row">
                <div className="info-icon" style={{ color: 'var(--earth-700)', background: '#F5EBDC' }}><MapPinIcon /></div>
                <div className="info-content">
                  <div className="info-label">活动地点</div>
                  <div className="info-value">{activity.location}</div>
                </div>
              </div>

              <div className="info-row">
                <div className="info-icon" style={{ color: 'var(--forest-500)', background: 'var(--forest-50)' }}><UsersIcon /></div>
                <div className="info-content">
                  <div className="info-label">参与名额</div>
                  <div className="info-value">
                    已报名 {activity.registeredCount} / {activity.maxParticipants} 人
                    <span style={{ marginLeft: 12, fontWeight: 500, color: slotsFull ? '#E07A5F' : 'var(--text-secondary)' }}>
                      {slotsFull ? '（已满员）' : `（剩余 ${slotsLeft} 名额）`}
                    </span>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <div className="progress-bar" style={{ height: 8 }}>
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="info-row">
                <div className="info-icon" style={{ color: 'var(--forest-700)', background: '#E9F7EF' }}><UserIcon /></div>
                <div className="info-content">
                  <div className="info-label">发起方</div>
                  <div className="info-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      className="avatar"
                      style={{
                        width: 28,
                        height: 28,
                        fontSize: 12,
                        background: activity.creator.avatar || 'var(--forest-500)',
                      }}
                    >
                      {activity.creator.nickname.charAt(0).toUpperCase()}
                    </div>
                    {activity.creator.nickname}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 28 }}>
            <h2 style={{ fontSize: 20, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              📝 活动详情
            </h2>
            <div
              className="description-html"
              style={{ color: 'var(--text-primary)' }}
              dangerouslySetInnerHTML={{ __html: activity.description }}
            />
          </div>
        </div>

        <div className="detail-right">
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, marginBottom: 16 }}>🎯 报名操作</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activity.isCheckedIn ? (
                <button className="btn btn-success" disabled style={{ width: '100%' }}>
                  <CheckInIcon />
                  已完成签到
                </button>
              ) : activity.isRegistered ? (
                <>
                  <button
                    className="btn btn-success"
                    style={{ width: '100%' }}
                    onClick={handleCheckin}
                    disabled={btnLoading === 'checkin'}
                  >
                    <CheckInIcon />
                    {btnLoading === 'checkin' ? '签到中...' : '立即签到 (+10积分)'}
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ width: '100%' }}
                    onClick={handleUnregister}
                    disabled={btnLoading === 'unregister'}
                  >
                    {btnLoading === 'unregister' ? '处理中...' : '取消报名'}
                  </button>
                </>
              ) : slotsFull ? (
                <button className="btn btn-outline" disabled style={{ width: '100%' }}>
                  活动名额已满
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', fontSize: 15, padding: '14px 20px' }}
                  onClick={handleRegister}
                  disabled={btnLoading === 'register'}
                >
                  {btnLoading === 'register' ? '报名中...' : '🌿 立即报名参加'}
                </button>
              )}
            </div>

            {activity.isRegistered && !activity.isCheckedIn && (
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  background: 'var(--forest-50)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                  color: 'var(--forest-700)',
                }}
              >
                💡 活动当天点击签到按钮即可完成签到，获得 10 环保积分
              </div>
            )}
          </div>

          <div className="map-placeholder">
            <div className="map-marker" />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontWeight: 700, color: 'var(--forest-900)', marginBottom: 4, fontSize: 16 }}>
                📍 活动地点
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 280 }}>
                {activity.location}
              </div>
            </div>
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                marginTop: 8,
                padding: '6px 14px',
                background: 'rgba(255,255,255,0.7)',
                borderRadius: 20,
                fontSize: 12,
                color: 'var(--text-secondary)',
              }}
            >
              地图功能接入中 · 点击查看导航
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: 20,
              background: 'linear-gradient(135deg, #FEFAE0 0%, #F0F7EE 100%)',
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--earth-700)', marginBottom: 10 }}>
              🌱 温馨提示
            </div>
            <ul style={{ paddingLeft: 18, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.8 }}>
              <li>请准时到达集合地点</li>
              <li>建议穿着舒适的运动服装和鞋</li>
              <li>自带水杯，减少一次性用品使用</li>
              <li>活动中请注意安全，听从组织者安排</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetail;
