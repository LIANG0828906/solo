import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { activityApi, type Activity } from './api';
import { useApp } from './context/AppContext';

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.3-4.3"/>
  </svg>
);

const GridIcon = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="7" height="7" x="3" y="3" rx="1"/>
    <rect width="7" height="7" x="14" y="3" rx="1"/>
    <rect width="7" height="7" x="14" y="14" rx="1"/>
    <rect width="7" height="7" x="3" y="14" rx="1"/>
  </svg>
);

const ListIcon = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const ActivityCard = ({ activity, view }: { activity: Activity; view: 'grid' | 'list' }) => {
  const navigate = useNavigate();
  const remaining = activity.maxParticipants - activity.registeredCount;
  const progress = (activity.registeredCount / activity.maxParticipants) * 100;
  const isFull = remaining <= 0;

  return (
    <div
      className="card card-hover activity-card"
      onClick={() => navigate(`/activities/${activity.id}`)}
      style={{ cursor: 'pointer' }}
    >
      <img
        src={activity.coverImage}
        alt={activity.title}
        className="activity-card-image"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80';
        }}
      />
      <div className="activity-card-body">
        <h3 className="activity-card-title" style={{ cursor: 'pointer' }}>{activity.title}</h3>
        <div className="activity-card-meta">
          <div className="activity-card-meta-item">
            <CalendarIcon />
            <span>{formatDate(activity.date)}</span>
          </div>
          <div className="activity-card-meta-item">
            <MapPinIcon />
            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: view === 'list' ? '100%' : '240px',
            }}>{activity.location}</span>
          </div>
          <div className="activity-card-meta-item">
            <UsersIcon />
            <span>发起人：{activity.creator.nickname}</span>
          </div>
        </div>
        <div style={{ marginTop: 'auto' }}>
          <div className="slots-info" style={{ marginBottom: 8 }}>
            <span>已报名 {activity.registeredCount}/{activity.maxParticipants} 人</span>
            <span className={isFull ? 'slots-full' : ''}>{isFull ? '名额已满' : `剩余 ${remaining} 个名额`}</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

const ActivityList = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const { toast } = useApp();

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const res = await activityApi.list(search, 'date');
      setActivities(res.data);
    } catch (err: any) {
      toast(err.response?.data?.error || '获取活动失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, toast]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🌿 活动广场</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            共 {activities.length} 个环保活动等你参与
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="search-wrapper">
            <span className="search-icon"><SearchIcon /></span>
            <input
              type="text"
              className="search-input"
              placeholder="搜索活动名称或地点..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${view === 'grid' ? 'active' : ''}`}
              onClick={() => setView('grid')}
            >
              <GridIcon active={view === 'grid'} />
              网格
            </button>
            <button
              className={`view-toggle-btn ${view === 'list' ? 'active' : ''}`}
              onClick={() => setView('list')}
            >
              <ListIcon active={view === 'list'} />
              列表
            </button>
          </div>
          <Link to="/activities/create" className="btn btn-primary">
            <PlusIcon />
            发起活动
          </Link>
        </div>
      </div>

      {loading ? (
        <div className={view === 'grid' ? 'grid-view' : 'list-view'}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card activity-card">
              <div className="skeleton" style={{ height: view === 'list' ? '180px' : '180px', width: view === 'list' ? '280px' : '100%', borderRadius: 0 }} />
              <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="skeleton" style={{ height: 24, width: '80%' }} />
                <div className="skeleton" style={{ height: 16, width: '60%' }} />
                <div className="skeleton" style={{ height: 16, width: '70%' }} />
                <div className="skeleton" style={{ height: 8, width: '100%', marginTop: 'auto' }} />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 64, marginBottom: 16 }}>🌱</div>
          <h3 style={{ marginBottom: 8 }}>暂无相关活动</h3>
          <p>换个关键词试试，或成为第一个发起活动的人吧！</p>
          <div style={{ marginTop: 20 }}>
            <Link to="/activities/create" className="btn btn-primary">
              <PlusIcon />
              立即发起
            </Link>
          </div>
        </div>
      ) : (
        <div key={view} className={view === 'grid' ? 'grid-view' : 'list-view'}>
          {activities.map((a) => (
            <ActivityCard key={a.id} activity={a} view={view} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityList;
