import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { activityApi, Activity } from './api';
import { useApp } from './context/AppContext';

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const GridIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const ListIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
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

type ActivityCardType = Activity;

const ActivityCardView = ({ activity }: { activity: ActivityCardType }) => {
  const { toast } = useApp();
  const slotsLeft = activity.maxParticipants - activity.registeredCount;
  const slotsFull = slotsLeft <= 0;
  const pct = Math.min(100, Math.round((activity.registeredCount / activity.maxParticipants) * 100));

  return (
    <Link
      to={`/activities/${activity.id}`}
      className="card card-hover activity-card"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <img
        src={activity.coverImage}
        alt={activity.title}
        className="activity-card-image"
        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
          e.currentTarget.src = 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80';
        }}
      />
      <div className="activity-card-body">
        <div>
          <h3 className="activity-card-title">{activity.title}</h3>
        </div>
        <div className="activity-card-meta">
          <div className="activity-card-meta-item">
            <CalendarIcon />
            <span>{formatDate(activity.date)}</span>
          </div>
          <div className="activity-card-meta-item">
            <MapPinIcon />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activity.location}
            </span>
          </div>
          <div className="activity-card-meta-item">
            <UsersIcon />
            <span>主办方：{activity.creator.nickname}</span>
          </div>
        </div>
        <div style={{ marginTop: 'auto' }}>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }}></div>
          </div>
          <div className="slots-info">
            <span>已报名 {activity.registeredCount}/{activity.maxParticipants}</span>
            <span className={slotsFull ? 'slots-full' : ''}>
              {slotsFull ? '名额已满' : `剩余 ${slotsLeft} 名额`}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 8, borderTop: '1px solid var(--forest-50)' }}>
          {activity.isRegistered ? (
            <button
              className="btn btn-success"
              style={{ flex: 1, padding: '8px 12px', fontSize: 13, minHeight: 36 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toast('您已报名该活动', 'info');
              }}
            >
              ✓ 已报名
            </button>
          ) : slotsFull ? (
            <button
              className="btn btn-outline"
              style={{ flex: 1, padding: '8px 12px', fontSize: 13, minHeight: 36, opacity: 0.7 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toast('活动名额已满', 'error');
              }}
            >
              已满员
            </button>
          ) : (
            <button
              className="btn btn-primary"
              style={{ flex: 1, padding: '8px 12px', fontSize: 13, minHeight: 36 }}
              onClick={(e) => {
                e.preventDefault();
                window.location.href = `/activities/${activity.id}`;
              }}
            >
              立即报名
            </button>
          )}
        </div>
      </div>
    </Link>
  );
};

const ActivityList = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const { toast } = useApp();

  const fetchData = async (s?: string) => {
    setLoading(true);
    try {
      const res = await activityApi.list(s, 'date');
      setActivities(res.data);
    } catch (err: any) {
      toast(err.response?.data?.error || '加载活动失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      fetchData(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🌿 活动广场</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            {loading ? '加载中...' : `共 ${activities.length} 个环保活动等你参与`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-wrapper">
            <span className="search-icon"><SearchIcon /></span>
            <input
              type="text"
              className="search-input"
              placeholder="搜索活动或地点..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <GridIcon />
              网格
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <ListIcon />
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
        <div className={viewMode === 'grid' ? 'grid-view' : 'list-view'}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card" style={{ display: viewMode === 'list' ? 'flex' : 'block' }}>
              {viewMode === 'grid' ? (
                <>
                  <div className="skeleton" style={{ height: 180, borderRadius: 0 }} />
                  <div style={{ padding: 16 }}>
                    <div className="skeleton" style={{ height: 22, width: '70%', marginBottom: 12 }} />
                    <div className="skeleton" style={{ height: 14, width: '90%', marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 14, width: '60%' }} />
                  </div>
                </>
              ) : (
                <>
                  <div className="skeleton" style={{ width: 280, minHeight: 180, borderRadius: 0, flexShrink: 0 }} />
                  <div style={{ padding: 16, flex: 1 }}>
                    <div className="skeleton" style={{ height: 22, width: '50%', marginBottom: 12 }} />
                    <div className="skeleton" style={{ height: 14, width: '80%', marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 14, width: '40%' }} />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌱</div>
          <h3 style={{ marginBottom: 8 }}>暂无活动</h3>
          <p style={{ marginBottom: 20 }}>
            {search ? '没有找到匹配的活动，换个关键词试试' : '快来发起第一个环保活动吧！'}
          </p>
          {!search && (
            <Link to="/activities/create" className="btn btn-primary">
              <PlusIcon />
              发起活动
            </Link>
          )}
        </div>
      ) : (
        <div key={viewMode} className={viewMode === 'grid' ? 'grid-view' : 'list-view'}>
          {activities.map((activity) => (
            <ActivityCardView key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityList;
