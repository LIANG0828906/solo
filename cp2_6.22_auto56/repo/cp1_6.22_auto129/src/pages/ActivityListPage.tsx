import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar, Plus, Filter } from 'lucide-react';
import { Activity, ActivityFormData } from '../types';
import { getActivities, createActivity, registerActivity } from '../services/apiService';
import { useStore } from '../store/useStore';
import ActivityCard from '../components/ActivityCard';

const ActivityListPage: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'ended'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, loading } = useStore();
  const navigate = useNavigate();
  const ITEMS_PER_PAGE = 20;

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

  useEffect(() => {
    if (searchParams.get('create') === 'true' && currentUser) {
      setShowCreateModal(true);
      setSearchParams({});
    }
  }, [searchParams, currentUser, setSearchParams]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const status = activeFilter === 'all' ? undefined : activeFilter;
        const data = await getActivities(status);
        setActivities(data);
        setCurrentPage(1);
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      }
    };
    fetchActivities();
  }, [activeFilter]);

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    try {
      const coverImage = formData.coverImage || 
        `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(`activity ${formData.title}`)}&image_size=landscape_16_9`;
      
      const activity = await createActivity({
        ...formData,
        coverImage,
      } as ActivityFormData);
      setShowCreateModal(false);
      navigate(`/activity/${activity.id}`);
    } catch (error) {
      console.error('Failed to create activity:', error);
    }
  };

  const handleRegisterClick = (activity: Activity) => {
    if (!currentUser) {
      alert('请先登录');
      return;
    }
    setSelectedActivity(activity);
    setShowRegisterModal(true);
  };

  const handleConfirmRegister = async () => {
    if (!currentUser || !selectedActivity) return;
    
    try {
      const result = await registerActivity(selectedActivity.id, currentUser.id);
      if (result.success) {
        setActivities(prev => prev.map(a => 
          a.id === selectedActivity.id 
            ? { ...a, registeredUsers: [...a.registeredUsers, currentUser.id] }
            : a
        ));
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Failed to register:', error);
      alert('报名失败，请稍后重试');
    }
    setShowRegisterModal(false);
    setSelectedActivity(null);
  };

  const filters = [
    { key: 'all', label: '全部活动' },
    { key: 'upcoming', label: '即将开始' },
    { key: 'ongoing', label: '进行中' },
    { key: 'ended', label: '已结束' },
  ];

  const totalPages = Math.ceil(activities.length / ITEMS_PER_PAGE);
  const paginatedActivities = activities.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <>
      <div className="activity-list-page">
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">
              <Calendar size={28} />
              活动列表
            </h1>
            {currentUser && (
              <button className="btn-primary create-btn" onClick={() => setShowCreateModal(true)}>
                <Plus size={18} />
                发布活动
              </button>
            )}
          </div>
          
          <div className="filter-bar">
            <div className="filter-tabs">
              <Filter size={18} className="filter-icon" />
              {filters.map(filter => (
                <button
                  key={filter.key}
                  className={`filter-tab ${activeFilter === filter.key ? 'active' : ''}`}
                  onClick={() => setActiveFilter(filter.key as typeof activeFilter)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="result-count">
              共 {activities.length} 个活动
            </div>
          </div>
        </div>

        <div className="activities-container">
          {activities.length > 20 ? (
            <>
              <div className="activities-grid">
                {paginatedActivities.map(activity => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    onRegister={() => handleRegisterClick(activity)}
                  />
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="page-btn"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    上一页
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`page-btn ${currentPage === page ? 'active' : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    className="page-btn"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    下一页
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="activities-grid">
              {activities.map(activity => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  onRegister={() => handleRegisterClick(activity)}
                />
              ))}
            </div>
          )}
          
          {activities.length === 0 && !loading && (
            <div className="empty-state">
              <Calendar size={64} className="empty-icon" />
              <h3>暂无活动</h3>
              <p>当前筛选条件下没有活动</p>
            </div>
          )}
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
                    value={formData.startTime ? formData.startTime.slice(0, 16) : ''}
                    onChange={(e) => setFormData({ ...formData, startTime: new Date(e.target.value).toISOString() })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>结束时间 *</label>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={formData.endTime ? formData.endTime.slice(0, 16) : ''}
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

      {showRegisterModal && selectedActivity && (
        <div className="modal-overlay" onClick={() => setShowRegisterModal(false)}>
          <div className="modal-content register-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">确认报名</h2>
            <div className="register-info">
              <p className="activity-name">{selectedActivity.title}</p>
              <p className="activity-time">
                <Calendar size={16} />
                {new Date(selectedActivity.startTime).toLocaleString('zh-CN')}
              </p>
              <p className="register-note">
                报名成功后将获得 {selectedActivity.pointsReward} 积分奖励
              </p>
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setShowRegisterModal(false)}>
                取消
              </button>
              <button className="btn-primary" onClick={handleConfirmRegister}>
                确认报名
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .activity-list-page {
          max-width: 1400px;
          margin: 0 auto;
          padding: 80px 24px 40px;
        }
        
        .page-header {
          margin-bottom: 24px;
        }
        
        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        
        .page-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 28px;
          font-weight: 800;
          color: #1e293b;
        }
        
        .create-btn {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .filter-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: white;
          padding: 16px 20px;
          border-radius: var(--border-radius);
          box-shadow: var(--card-shadow);
        }
        
        .filter-tabs {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .filter-icon {
          color: #64748b;
          margin-right: 8px;
        }
        
        .filter-tab {
          background: none;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
        }
        
        .filter-tab:hover {
          background: #f1f5f9;
          color: #334155;
        }
        
        .filter-tab.active {
          background: var(--primary-gradient);
          color: white;
        }
        
        .result-count {
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }
        
        .activities-container {
          margin-top: 24px;
        }
        
        .activities-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-top: 32px;
        }
        
        .page-btn {
          padding: 8px 16px;
          border: 2px solid #e2e8f0;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          color: #64748b;
          transition: all 0.2s ease;
        }
        
        .page-btn:hover:not(:disabled):not(.active) {
          border-color: var(--primary-light);
          color: var(--primary-light);
        }
        
        .page-btn.active {
          background: var(--primary-gradient);
          color: white;
          border-color: transparent;
        }
        
        .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 80px 20px;
          color: #94a3b8;
        }
        
        .empty-state h3 {
          margin: 16px 0 8px;
          color: #64748b;
        }
        
        .empty-icon {
          opacity: 0.4;
          margin: 0 auto;
        }
        
        .create-activity-modal,
        .register-modal {
          max-width: 600px;
        }
        
        .register-info {
          padding: 20px 0;
        }
        
        .activity-name {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 12px;
        }
        
        .activity-time {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748b;
          margin-bottom: 12px;
        }
        
        .register-note {
          background: #f0fdf4;
          color: #166534;
          padding: 12px 16px;
          border-radius: 8px;
          font-weight: 600;
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
        
        @media (max-width: 1200px) {
          .activities-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        
        @media (max-width: 900px) {
          .activities-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 768px) {
          .activity-list-page {
            padding: 80px 16px 24px;
          }
          
          .filter-bar {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }
          
          .filter-tabs {
            flex-wrap: wrap;
          }
          
          .page-title {
            font-size: 22px;
          }
          
          .create-form .form-row {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: 480px) {
          .activities-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
};

export default ActivityListPage;
