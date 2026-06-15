import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Blessing {
  id: string;
  nickname: string;
  content: string;
  mediaType?: 'image' | 'video';
  mediaData?: string;
  likes: number;
  createdAt: string;
}

interface Activity {
  id: string;
  birthdayPerson: string;
  birthdayDate: string;
  deadline: string;
  isPublic: boolean;
  creatorToken: string;
  createdAt: string;
  blessings: Blessing[];
}

interface ActivityListItem {
  id: string;
  birthdayPerson: string;
  birthdayDate: string;
  deadline: string;
  isPublic: boolean;
  createdAt: string;
  blessingCount: number;
  participantCount: number;
}

function getDaysUntilBirthday(birthdayDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bd = new Date(birthdayDate);
  const nextBirthday = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
  if (nextBirthday < today) {
    nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
  }
  return Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function isBirthdayPast(birthdayDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bd = new Date(birthdayDate);
  const thisYearBirthday = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
  return today > thisYearBirthday;
}

function ActivityCard({ activity }: { activity: ActivityListItem }) {
  const navigate = useNavigate();
  const daysLeft = getDaysUntilBirthday(activity.birthdayDate);
  const ended = isBirthdayPast(activity.birthdayDate);

  return (
    <div
      className={`activity-card${ended ? ' ended' : ''}`}
      onClick={() => navigate(`/activity/${activity.id}`)}
      style={{ cursor: 'pointer' }}
    >
      <div className="countdown-display">
        {ended ? (
          <span>已结束</span>
        ) : daysLeft === 0 ? (
          <span>🎂 今天是生日！</span>
        ) : (
          <span>🎂 还有 {daysLeft} 天</span>
        )}
      </div>
      <div className="card-body">
        <h3 className="activity-title" style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1.2rem',
          color: ended ? '#999' : 'var(--color-primary)',
          textDecoration: ended ? 'line-through' : 'none',
          marginBottom: '8px',
        }}>
          {activity.birthdayPerson}
        </h3>
        <div className="card-text" style={{ display: 'flex', gap: '16px', fontSize: '0.85rem' }}>
          <span>💌 {activity.blessingCount} 条祝福</span>
          <span>👥 {activity.participantCount} 人参与</span>
        </div>
        <div style={{
          fontSize: '0.75rem',
          color: '#aaa',
          marginTop: '8px',
        }}>
          生日: {new Date(activity.birthdayDate).toLocaleDateString('zh-CN')}
        </div>
      </div>
    </div>
  );
}

export default function ActivityBoard() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<ActivityListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchActivities = useCallback(async (searchTerm: string) => {
    setLoading(true);
    try {
      const res = await axios.get<ActivityListItem[]>('/api/activities', {
        params: {
          search: searchTerm,
          visibility: 'public',
        },
      });
      setActivities(res.data);
    } catch {
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities('');
  }, [fetchActivities]);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchActivities(value);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="main-content fade-wrapper">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <h1 style={{ fontSize: '1.8rem' }}>🎂 生日活动广场</h1>
        <button className="btn btn-primary" onClick={() => navigate('/create')}>
          ➕ 创建活动
        </button>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <input
          type="text"
          className="form-input"
          placeholder="🔍 搜索寿星姓名..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
          style={{ maxWidth: '400px' }}
        />
      </div>

      {loading ? (
        <div className="loading-spinner" />
      ) : activities.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          color: 'var(--color-text-light)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎈</div>
          <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>暂无公开活动</p>
          <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>成为第一个创建生日惊喜的人吧！</p>
          <button
            className="btn btn-primary"
            style={{ marginTop: '20px' }}
            onClick={() => navigate('/create')}
          >
            创建活动
          </button>
        </div>
      ) : (
        <div className="masonry-grid">
          {activities.map(activity => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
}
