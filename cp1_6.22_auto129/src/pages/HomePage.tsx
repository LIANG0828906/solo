import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Star, Plus, Medal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Activity, User, ActivityFormData } from '../types';
import { getActivities, getLeaderboard, createActivity } from '../services/apiService';
import { useStore } from '../store/useStore';
import ActivityCard from '../components/ActivityCard';

const HomePage: React.FC = () => {
  const [upcomingActivities, setUpcomingActivities] = useState<Activity[]>([]);
  const [topUsers, setTopUsers] = useState<User[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<Partial<ActivityFormData>>({
    title: '',
    coverImage: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
    maxParticipants: 50,
    pointsReward: 20,
  });
  const { currentUser, loading } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [activities, leaderboard] = await Promise.all([
          getActivities('upcoming'),
          getLeaderboard(3),
        ]);
        setUpcomingActivities(activities.slice(0, 8));
        setTopUsers(leaderboard);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, []);

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    try {
      const activity = await createActivity(formData as ActivityFormData);
      setShowCreateModal(false);
      navigate(`/activity/${activity.id}`);
    } catch (error) {
      console.error('Failed to create activity:', error);
    }
  };

  const getMedalColor = (rank: number) => {
    const colors = ['#fbbf24', '#9ca3af', '#cd7f32'];
    return colors[rank] || '#6b7280';
  };

  return (
    <>
      <div className="home-page">
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="title-icon">🌟</span>
              欢迎来到社区活动中心
            </h1>
            <p className="hero-subtitle">参与活动，赢取积分，共建美好社区</p>
            <div className="hero-stats">
              <div className="stat-item">
                <Calendar size={24} />
                <div>
                  <span className="stat-number">{upcomingActivities.length}</span>
                  <span className="stat-label">即将开始</span>
                </div>
              </div>
              <div className="stat-item">
                <Trophy size={24} />
                <div>
                  <span className="stat-number">{topUsers[0]?.totalPoints || 0}</span>
                  <span className="stat-label">最高积分</span>
                </div>
              </div>
              <div className="stat-item">
                <Star size={24} />
                <div>
                  <span className="stat-number">{topUsers[0]?.activitiesParticipated || 0}</span>
                  <span className="stat-label">参与次数</span>
                </div>
              </div>
            </div>
            <div className="hero-actions">
              <button className="btn-primary" onClick={() => navigate('/activities')}>
                浏览全部活动
              </button>
              {currentUser && (
                <button className="btn-secondary" onClick={() => setShowCreateModal(true)}>
                  <Plus size={18} />
                  发布活动
                </button>
              )}
            </div>
          </div>
        </section>

        <div className="home-content">
          <section className="activities-section">
            <div className="section-header">
              <h2 className="section-title">
                <Calendar size={24} />
                即将开始的活动
              </h2>
              <button className="view-all-btn" onClick={() => navigate('/activities')}>
                查看全部 →
              </button>
            </div>
            <div className="activities-grid">
              {upcomingActivities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
              {upcomingActivities.length === 0 && !loading && (
                <div className="empty-state">
                  <Calendar size={48} className="empty-icon" />
                  <p>暂无即将开始的活动</p>
                </div>
              )}
            </div>
          </section>

          <aside className="leaderboard-section">
            <div className="section-header">
              <h2 className="section-title">
                <Trophy size={24} />
                积分排行榜
              </h2>
              <button className="view-all-btn" onClick={() => navigate('/leaderboard')}>
                完整榜单 →
              </button>
            </div>
            <div className="top-three">
              {topUsers.map((user, index) => (
                <div key={user.id} className={`top-user rank-${index + 1} bounce-in`} style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="rank-medal" style={{ background: getMedalColor(index) }}>
                    <Medal size={20} />
                  </div>
                  <img
                    src={user.avatar}
                    alt={user.nickname}
                    className="top-user-avatar"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('user avatar')}&image_size=square`;
                    }}
                  />
                  <div className="top-user-info">
                    <span className="top-user-name">{user.nickname}</span>
                    <span className="top-user-points">{user.totalPoints} 积分</span>
                  </div>
                  <div className="rank-number" style={{ color: getMedalColor(index) }}>
                    #{index + 1}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content create-activity-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              <Plus size={24} />
              发布新活动
            </h2>
            <form onSubmit={handleCreateActivity} className="create-form">
              <div className="form-row">
                <div className="form-group">
                  <label>活动标题 *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="请输入活动标题"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>封面图URL（可选）</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  placeholder="输入图片URL，留空则自动生成"
                />
              </div>
              <div className="form-group">
                <label>活动描述 *</label>
                <textarea
                  className="input-field"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请输入活动描述"
                  rows={3}
                  required
                />
              </div>
              <div className="form-group">
                <label>活动地点 *</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="请输入活动地点"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>开始时间 *</label>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: new Date(e.target.value).toISOString() })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>结束时间 *</label>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: new Date(e.target.value).toISOString() })}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>最大参与人数</label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>积分奖励</label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.pointsReward}
                    onChange={(e) => setFormData({ ...formData, pointsReward: parseInt(e.target.value) })}
                    min="0"
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn-primary">
                  发布活动
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .home-page {
          max-width: 1400px;
          margin: 0 auto;
          padding: 80px 24px 40px;
        }
        
        .hero-section {
          background: var(--primary-gradient);
          border-radius: 20px;
          padding: 48px;
          color: white;
          margin-bottom: 32px;
          position: relative;
          overflow: hidden;
        }
        
        .hero-section::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          border-radius: 50%;
        }
        
        .hero-content {
          position: relative;
          z-index: 1;
        }
        
        .hero-title {
          font-size: 36px;
          font-weight: 800;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .title-icon {
          font-size: 36px;
        }
        
        .hero-subtitle {
          font-size: 18px;
          opacity: 0.9;
          margin-bottom: 32px;
        }
        
        .hero-stats {
          display: flex;
          gap: 48px;
          margin-bottom: 32px;
        }
        
        .stat-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .stat-item svg {
          opacity: 0.8;
        }
        
        .stat-number {
          display: block;
          font-size: 28px;
          font-weight: 800;
          line-height: 1;
        }
        
        .stat-label {
          font-size: 13px;
          opacity: 0.8;
        }
        
        .hero-actions {
          display: flex;
          gap: 16px;
        }
        
        .hero-actions .btn-primary {
          background: white;
          color: var(--primary-dark);
        }
        
        .hero-actions .btn-primary:hover {
          background: #f1f5f9;
        }
        
        .hero-actions .btn-secondary {
          background: rgba(255,255,255,0.2);
          color: white;
          border-color: rgba(255,255,255,0.3);
        }
        
        .hero-actions .btn-secondary:hover {
          background: rgba(255,255,255,0.3);
        }
        
        .home-content {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 32px;
        }
        
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        
        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 22px;
          font-weight: 700;
          color: #1e293b;
        }
        
        .view-all-btn {
          background: none;
          border: none;
          color: var(--primary-light);
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
          transition: color 0.2s ease;
        }
        
        .view-all-btn:hover {
          color: var(--primary-dark);
        }
        
        .activities-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        
        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 20px;
          color: #94a3b8;
        }
        
        .empty-icon {
          margin-bottom: 12px;
          opacity: 0.5;
        }
        
        .leaderboard-section {
          background: white;
          border-radius: var(--border-radius);
          padding: 24px;
          height: fit-content;
          box-shadow: var(--card-shadow);
        }
        
        .top-three {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .top-user {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-radius: 12px;
          background: #f8fafc;
          position: relative;
          opacity: 0;
        }
        
        .top-user.rank-1 {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
        }
        
        .top-user.rank-2 {
          background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
        }
        
        .top-user.rank-3 {
          background: linear-gradient(135deg, #ffedd5, #fed7aa);
        }
        
        .rank-medal {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .top-user-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .top-user-info {
          flex: 1;
        }
        
        .top-user-name {
          display: block;
          font-weight: 700;
          color: #1e293b;
        }
        
        .top-user-points {
          font-size: 13px;
          color: #64748b;
        }
        
        .rank-number {
          font-size: 24px;
          font-weight: 800;
        }
        
        .create-activity-modal {
          max-width: 600px;
        }
        
        .create-form .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        
        .create-form .form-group {
          margin-bottom: 16px;
        }
        
        .create-form label {
          display: block;
          font-weight: 600;
          margin-bottom: 6px;
          color: #374151;
          font-size: 14px;
        }
        
        .create-form textarea {
          resize: vertical;
          min-height: 80px;
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }
        
        @media (max-width: 1024px) {
          .home-content {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: 768px) {
          .home-page {
            padding: 80px 16px 24px;
          }
          
          .hero-section {
            padding: 32px 20px;
          }
          
          .hero-title {
            font-size: 24px;
          }
          
          .hero-stats {
            flex-direction: column;
            gap: 16px;
          }
          
          .create-form .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
};

export default HomePage;
