import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { userApi, Activity, User } from './api';
import { useApp } from './context/AppContext';

interface ParticipatedActivity extends Activity {
  regStatus: string;
  registeredAt: string;
  checkedInAt: string | null;
}

const LeafIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}`;
};

const AnimatedPoints = ({ target, duration = 1500 }: { target: number; duration?: number }) => {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = display;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startRef.current + (target - startRef.current) * easeProgress);
      setDisplay(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return <span className="points-number">{display.toLocaleString()}</span>;
};

interface BadgeDef {
  key: string;
  name: string;
  shortName: string;
  threshold: number;
  level: string;
  icon: string;
}

const BADGES: BadgeDef[] = [
  { key: 'bronze', name: '青铜环保者', shortName: '青铜', threshold: 100, level: 'badge-bronze', icon: '🥉' },
  { key: 'silver', name: '白银守护者', shortName: '白银', threshold: 500, level: 'badge-silver', icon: '🥈' },
  { key: 'gold', name: '黄金环保领袖', shortName: '黄金', threshold: 1000, level: 'badge-gold', icon: '🥇' },
];

const BadgeItem = ({ badge, unlocked, points }: { badge: BadgeDef; unlocked: boolean; points: number }) => {
  const progress = unlocked ? 100 : Math.min(100, Math.round((points / badge.threshold) * 100));
  const nextBadge = !unlocked ? badge : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative' }}>
        {unlocked && <div className={`badge-glow ${badge.level}`} />}
        <div className={`badge ${unlocked ? badge.level : 'badge-locked'}`} title={unlocked ? badge.name : `还需 ${badge.threshold - points} 积分解锁`}>
          <span style={{ fontSize: 22, lineHeight: 1, marginBottom: 2 }}>{unlocked ? badge.icon : '🔒'}</span>
          <span style={{ fontSize: 10 }}>{badge.shortName}</span>
        </div>
      </div>
      <div style={{ fontSize: 11, fontWeight: unlocked ? 700 : 500, color: unlocked ? 'var(--forest-900)' : 'var(--text-muted)', textAlign: 'center' }}>
        {unlocked ? badge.name : `${badge.threshold}分解锁`}
      </div>
      {nextBadge && (
        <div style={{ width: 80 }}>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
    </div>
  );
};

const getLevelInfo = (points: number) => {
  let current: BadgeDef | null = null;
  let next: BadgeDef | null = null;
  for (let i = BADGES.length - 1; i >= 0; i--) {
    if (points >= BADGES[i].threshold) {
      current = BADGES[i];
      next = BADGES[i + 1] || null;
      break;
    }
  }
  if (!current) {
    current = null;
    next = BADGES[0];
  }
  return { current, next };
};

const UserProfile = () => {
  const { user: appUser, refreshUser, toast } = useApp();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [created, setCreated] = useState<Activity[]>([]);
  const [participated, setParticipated] = useState<ParticipatedActivity[]>([]);
  const [tab, setTab] = useState<'participated' | 'created'>('participated');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [meRes, actRes] = await Promise.all([userApi.me(), userApi.myActivities()]);
      setProfileUser(meRes.data);
      refreshUser(meRes.data);
      setCreated(actRes.data.created);
      setParticipated(actRes.data.participated);
    } catch (err: any) {
      toast(err.response?.data?.error || '加载个人信息失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const displayUser = profileUser || appUser;
  const points = displayUser?.points || 0;
  const { current, next } = getLevelInfo(points);

  const progressToNext = next
    ? current
      ? Math.min(100, Math.round(((points - current.threshold) / (next.threshold - current.threshold)) * 100))
      : Math.min(100, Math.round((points / next.threshold) * 100))
    : 100;

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto' }}>
      {/* 头部用户信息卡片 */}
      <div
        className="card"
        style={{
          padding: 36,
          marginBottom: 28,
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F0F7EE 50%, #FEFAE0 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(82,183,136,0.2) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            left: -40,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212,163,115,0.2) 0%, transparent 70%)',
          }}
        />

        <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <div style={{ position: 'relative' }}>
            <div
              className="avatar avatar-xl"
              style={{
                background: displayUser?.avatar || 'var(--forest-500)',
                border: '4px solid white',
                boxShadow: 'var(--shadow-lg)',
                fontSize: 40,
              }}
            >
              {displayUser?.nickname?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--forest-700)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <LeafIcon />
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 240 }}>
            <h1 style={{ fontSize: 28, color: 'var(--forest-900)', marginBottom: 4 }}>
              {displayUser?.nickname || '环保志愿者'}
            </h1>
            <div style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 14 }}>
              用户名：@{displayUser?.username} · 加入于 {formatDate(displayUser?.createdAt || new Date().toISOString()).split(' ')[0]}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 12, flexWrap: 'wrap' }}>
              <div>
                <AnimatedPoints target={points} />
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, marginTop: 4 }}>
                  🌿 环保积分
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                  <span>
                    当前等级：
                    <strong style={{ color: current ? 'var(--forest-700)' : 'var(--text-muted)' }}>
                      {current ? current.name : '新晋志愿者'}
                    </strong>
                  </span>
                  <span>
                    {next ? `距离 ${next.shortName}：${next.threshold - points} 分` : '🏆 已达最高等级'}
                  </span>
                </div>
                <div className="progress-bar" style={{ height: 10 }}>
                  <div className="progress-fill" style={{ width: `${progressToNext}%` }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 32, marginTop: 8 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--forest-700)' }}>{participated.length}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>参与活动</div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--earth-700)' }}>{created.length}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>发起活动</div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--forest-500)' }}>
                  {participated.filter((p) => p.regStatus === 'checked-in').length}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>完成签到</div>
              </div>
            </div>
          </div>
        </div>

        {/* 徽章展示区 */}
        <div
          style={{
            marginTop: 28,
            paddingTop: 24,
            borderTop: '1px dashed var(--forest-100)',
            display: 'flex',
            gap: 24,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {BADGES.map((b) => (
            <BadgeItem key={b.key} badge={b} unlocked={points >= b.threshold} points={points} />
          ))}
        </div>
      </div>

      {/* 活动记录标签页 */}
      <div className="card" style={{ padding: 8 }}>
        <div
          style={{
            display: 'flex',
            gap: 4,
            padding: 8,
            background: 'var(--mint)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 16,
          }}
        >
          <button
            className={`auth-tab ${tab === 'participated' ? 'active' : ''}`}
            style={{ flex: 1, borderRadius: 'var(--radius-sm)' }}
            onClick={() => setTab('participated')}
          >
            参与记录 <span style={{ marginLeft: 4, opacity: 0.7 }}>({participated.length})</span>
          </button>
          <button
            className={`auth-tab ${tab === 'created' ? 'active' : ''}`}
            style={{ flex: 1, borderRadius: 'var(--radius-sm)' }}
            onClick={() => setTab('created')}
          >
            我发起的 <span style={{ marginLeft: 4, opacity: 0.7 }}>({created.length})</span>
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="timeline-item">
                <div className="skeleton timeline-thumbnail" />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 18, width: '60%', marginBottom: 10 }} />
                  <div className="skeleton" style={{ height: 14, width: '80%', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 14, width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : tab === 'participated' ? (
          participated.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 48, marginBottom: 16 }}>🌱</div>
              <h3 style={{ marginBottom: 8 }}>还没有参与记录</h3>
              <p>去活动广场看看，报名参加感兴趣的环保活动吧！</p>
              <Link to="/activities" className="btn btn-primary" style={{ marginTop: 20 }}>
                浏览活动
              </Link>
            </div>
          ) : (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {participated.map((act) => (
                <Link
                  key={act.id}
                  to={`/activities/${act.id}`}
                  className="timeline-item"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <img
                    src={act.coverImage}
                    alt={act.title}
                    className="timeline-thumbnail"
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80';
                    }}
                  />
                  <div className="timeline-content">
                    <div className="timeline-date">
                      <CalendarIcon /> 报名时间：{formatDate(act.registeredAt)} · 活动时间：
                      {formatDate(act.date)}
                    </div>
                    <h3
                      style={{
                        fontSize: 16,
                        marginBottom: 8,
                        color: 'var(--forest-900)',
                        lineHeight: 1.4,
                      }}
                    >
                      {act.title}
                    </h3>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        📍 {act.location}
                      </div>
                      <span
                        className={`status-tag ${
                          act.regStatus === 'checked-in' ? 'status-checkedin' : 'status-registered'
                        }`}
                      >
                        {act.regStatus === 'checked-in' ? '✅ 已签到' : '📝 已报名'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : created.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
            <h3 style={{ marginBottom: 8 }}>还没有发起活动</h3>
            <p>发起一个环保活动，成为环保领袖吧！</p>
            <Link to="/activities/create" className="btn btn-primary" style={{ marginTop: 20 }}>
              发起活动
            </Link>
          </div>
        ) : (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {created.map((act) => (
              <Link
                key={act.id}
                to={`/activities/${act.id}`}
                className="timeline-item"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <img
                  src={act.coverImage}
                  alt={act.title}
                  className="timeline-thumbnail"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80';
                  }}
                />
                <div className="timeline-content">
                  <div className="timeline-date">
                    <CalendarIcon /> 创建时间：{formatDate(act.createdAt)} · 活动时间：
                    {formatDate(act.date)}
                  </div>
                  <h3
                    style={{
                      fontSize: 16,
                      marginBottom: 8,
                      color: 'var(--forest-900)',
                      lineHeight: 1.4,
                    }}
                  >
                    {act.title}
                  </h3>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      📍 {act.location}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      👥 已报名 {act.registeredCount}/{act.maxParticipants}
                    </div>
                    <span className="status-tag status-creator">🎖️ 我发起的</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
