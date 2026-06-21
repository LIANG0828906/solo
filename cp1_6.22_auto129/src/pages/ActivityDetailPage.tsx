import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, Send, ChevronLeft, ChevronRight, QrCode, MessageSquare, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Activity, User, Comment } from '../types';
import { getActivityById, getComments, createComment, checkIn, getRegisteredUsers, registerActivity } from '../services/apiService';
import { useStore } from '../store/useStore';
import CommentItem from '../components/CommentItem';

const ActivityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [commentText, setCommentText] = useState('');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showCheckInSuccess, setShowCheckInSuccess] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [commentsPage, setCommentsPage] = useState(1);
  const [totalComments, setTotalComments] = useState(0);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const { currentUser, loading } = useStore();
  const commentInputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 10;

  const isRegistered = currentUser && activity?.registeredUsers.includes(currentUser.id);
  const hasCheckedIn = currentUser && activity?.checkedInUsers.some(c => c.userId === currentUser.id);

  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      try {
        const [activityData, commentsData] = await Promise.all([
          getActivityById(id),
          getComments(id, 1, PAGE_SIZE),
        ]);
        setActivity(activityData);
        setComments(commentsData.comments);
        setTotalComments(commentsData.total);
        setHasMoreComments(commentsData.total > PAGE_SIZE);
        
        if (activityData.registeredUsers.length > 0) {
          const users = await getRegisteredUsers(activityData.registeredUsers.slice(0, 20));
          setRegisteredUsers(users);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, [id]);

  const loadMoreComments = async () => {
    if (!id || !hasMoreComments || isLoadingComments) return;
    
    setIsLoadingComments(true);
    try {
      const nextPage = commentsPage + 1;
      const data = await getComments(id, nextPage, PAGE_SIZE);
      setComments(prev => [...prev, ...data.comments]);
      setCommentsPage(nextPage);
      setHasMoreComments((nextPage * PAGE_SIZE) < data.total);
    } catch (error) {
      console.error('Failed to load more comments:', error);
    }
    setIsLoadingComments(false);
  };

  const handleCheckIn = async () => {
    if (!currentUser || !activity || hasCheckedIn) return;
    
    try {
      const result = await checkIn(activity.id, currentUser.id);
      if (result.success) {
        setEarnedPoints(result.points);
        setShowCheckInSuccess(true);
        
        setActivity(prev => prev ? {
          ...prev,
          checkedInUsers: [...prev.checkedInUsers, { userId: currentUser.id, time: new Date().toISOString() }]
        } : null);
        
        setTimeout(() => setShowCheckInSuccess(false), 1500);
      }
    } catch (error) {
      console.error('Failed to check in:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !activity || !commentText.trim()) return;
    
    try {
      const newComment = await createComment(activity.id, currentUser.id, commentText.trim());
      setComments(prev => [newComment, ...prev]);
      setTotalComments(prev => prev + 1);
      setCommentText('');
    } catch (error) {
      console.error('Failed to submit comment:', error);
    }
  };

  const handleRegister = async () => {
    if (!currentUser || !activity) return;
    
    try {
      const result = await registerActivity(activity.id, currentUser.id);
      if (result.success) {
        setActivity(prev => prev ? {
          ...prev,
          registeredUsers: [...prev.registeredUsers, currentUser.id]
        } : null);
        setRegisteredUsers(prev => [...prev, currentUser]);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Failed to register:', error);
      alert('报名失败，请稍后重试');
    }
    setShowRegisterModal(false);
  };

  const nextPhoto = () => {
    if (!activity) return;
    setCurrentPhotoIndex(prev => (prev + 1) % activity.photos.length);
  };

  const prevPhoto = () => {
    if (!activity) return;
    setCurrentPhotoIndex(prev => (prev - 1 + activity.photos.length) % activity.photos.length);
  };

  const getStatusBadge = () => {
    if (!activity) return null;
    const statusConfig = {
      upcoming: { text: '即将开始', color: '#3b82f6', bg: '#dbeafe' },
      ongoing: { text: '进行中', color: '#10b981', bg: '#d1fae5' },
      ended: { text: '已结束', color: '#6b7280', bg: '#f3f4f6' },
    };
    const config = statusConfig[activity.status];
    return (
      <span className="status-badge" style={{ color: config.color, background: config.bg }}>
        {config.text}
      </span>
    );
  };

  if (!activity && !loading) {
    return (
      <div className="detail-page">
        <div className="empty-state" style={{ paddingTop: 120 }}>
          <h2>活动不存在</h2>
          <button className="btn-primary" onClick={() => navigate('/activities')}>
            返回活动列表
          </button>
        </div>
      </div>
    );
  }

  if (!activity) {
    return <div className="detail-page"><div style={{ paddingTop: 120, textAlign: 'center' }}>加载中...</div></div>;
  }

  const remainingSpots = activity.maxParticipants - activity.registeredUsers.length;

  return (
    <>
      <div className="detail-page">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={20} />
          返回
        </button>

        <div className="photo-carousel">
          <div className="carousel-container">
            <img
              src={activity.photos[currentPhotoIndex]}
              alt={`${activity.title} - 照片 ${currentPhotoIndex + 1}`}
              className="carousel-image"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('event photo')}&image_size=landscape_16_9`;
              }}
            />
            {activity.photos.length > 1 && (
              <>
                <button className="carousel-btn prev" onClick={prevPhoto}>
                  <ChevronLeft size={24} />
                </button>
                <button className="carousel-btn next" onClick={nextPhoto}>
                  <ChevronRight size={24} />
                </button>
                <div className="carousel-indicators">
                  {activity.photos.map((_, idx) => (
                    <button
                      key={idx}
                      className={`indicator ${idx === currentPhotoIndex ? 'active' : ''}`}
                      onClick={() => setCurrentPhotoIndex(idx)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="detail-content">
          <div className="left-column">
            <div className="activity-header">
              <div className="header-top">
                {getStatusBadge()}
                <span className="points-reward">+{activity.pointsReward} 积分</span>
              </div>
              <h1 className="activity-title">{activity.title}</h1>
              
              <div className="activity-meta">
                <div className="meta-item">
                  <Calendar size={18} />
                  <span>
                    {format(new Date(activity.startTime), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                    {' - '}
                    {format(new Date(activity.endTime), 'HH:mm', { locale: zhCN })}
                  </span>
                </div>
                <div className="meta-item">
                  <MapPin size={18} />
                  <span>{activity.location}</span>
                </div>
                <div className="meta-item">
                  <Users size={18} />
                  <span>
                    已报名 {activity.registeredUsers.length}/{activity.maxParticipants} 人
                    {remainingSpots > 0 && <span className="remaining"> (剩余 {remainingSpots} 个名额)</span>}
                  </span>
                </div>
              </div>
            </div>

            <div className="activity-description">
              <h3 className="section-subtitle">活动介绍</h3>
              <p>{activity.description}</p>
            </div>

            <div className="registered-users-section">
              <h3 className="section-subtitle">
                <Users size={20} />
                已报名用户 ({activity.registeredUsers.length})
              </h3>
              <div className="users-avatars">
                {registeredUsers.map((user, idx) => (
                  <div key={user.id} className="user-avatar-item" title={user.nickname}>
                    <img
                      src={user.avatar}
                      alt={user.nickname}
                      className="user-small-avatar"
                      style={{ zIndex: registeredUsers.length - idx }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('user avatar')}&image_size=square`;
                      }}
                    />
                  </div>
                ))}
                {activity.registeredUsers.length > registeredUsers.length && (
                  <div className="more-users">+{activity.registeredUsers.length - registeredUsers.length}</div>
                )}
              </div>
            </div>
          </div>

          <div className="right-column">
            <div className="action-card card">
              {isRegistered ? (
                <button
                  className={`checkin-btn ${hasCheckedIn ? 'checked' : ''}`}
                  onClick={handleCheckIn}
                  disabled={!!hasCheckedIn || activity.status === 'ended'}
                >
                  <QrCode size={20} />
                  {hasCheckedIn ? '已签到' : activity.status === 'ended' ? '活动已结束' : '立即签到'}
                </button>
              ) : (
                <button
                  className="register-btn-large"
                  onClick={() => setShowRegisterModal(true)}
                  disabled={remainingSpots <= 0 || activity.status === 'ended'}
                >
                  <Users size={20} />
                  {remainingSpots <= 0 ? '名额已满' : activity.status === 'ended' ? '活动已结束' : '立即报名'}
                </button>
              )}
              
              <div className="action-info">
                <div className="info-row">
                  <span>签到积分</span>
                  <span className="highlight">+10 分/次</span>
                </div>
                <div className="info-row">
                  <span>评论积分</span>
                  <span className="highlight">+5 分/条</span>
                </div>
                <div className="info-row">
                  <span>上传照片</span>
                  <span className="highlight">+3 分/张</span>
                </div>
              </div>
            </div>

            <div className="comments-section card">
              <h3 className="section-subtitle">
                <MessageSquare size={20} />
                活动评论 ({totalComments})
              </h3>
              
              <form onSubmit={handleSubmitComment} className="comment-form">
                <input
                  ref={commentInputRef}
                  type="text"
                  className="comment-input"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={currentUser ? '写下你的评论...' : '请先登录后评论'}
                  disabled={!currentUser}
                />
                <button
                  type="submit"
                  className="submit-comment-btn"
                  disabled={!currentUser || !commentText.trim()}
                >
                  <Send size={18} />
                </button>
              </form>

              <div className="comments-list">
                {comments.map(comment => (
                  <CommentItem key={comment.id} comment={comment} />
                ))}
                
                {hasMoreComments && (
                  <div ref={commentsEndRef} className="load-more-container">
                    <button
                      className="load-more-btn"
                      onClick={loadMoreComments}
                      disabled={isLoadingComments}
                    >
                      {isLoadingComments ? '加载中...' : '加载更多评论'}
                    </button>
                  </div>
                )}
                
                {comments.length === 0 && !loading && (
                  <div className="empty-comments">
                    <MessageSquare size={32} className="empty-icon" />
                    <p>暂无评论，来发表第一条评论吧！</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {showCheckInSuccess && (
          <div className="checkin-toast float-up">
            ✅ 签到成功 +{earnedPoints} 分
          </div>
        )}
      </div>

      {showRegisterModal && (
        <div className="modal-overlay" onClick={() => setShowRegisterModal(false)}>
          <div className="modal-content register-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">确认报名</h2>
            <div className="register-info">
              <p className="activity-name">{activity.title}</p>
              <p className="activity-time">
                <Calendar size={16} />
                {format(new Date(activity.startTime), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
              </p>
              <p className="register-note">
                报名成功后参加活动可获得 {activity.pointsReward} 积分奖励
              </p>
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setShowRegisterModal(false)}>
                取消
              </button>
              <button className="btn-primary" onClick={handleRegister}>
                确认报名
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .detail-page {
          max-width: 1400px;
          margin: 0 auto;
          padding: 80px 24px 40px;
          position: relative;
        }
        
        .back-btn {
          position: fixed;
          top: 80px;
          left: 24px;
          z-index: 50;
          display: flex;
          align-items: center;
          gap: 4px;
          background: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          box-shadow: var(--card-shadow);
          cursor: pointer;
          font-weight: 600;
          color: #374151;
          transition: all 0.2s ease;
        }
        
        .back-btn:hover {
          transform: translateX(-2px);
          box-shadow: var(--card-shadow-hover);
        }
        
        .photo-carousel {
          margin-bottom: 32px;
        }
        
        .carousel-container {
          position: relative;
          width: 100%;
          height: 400px;
          border-radius: 16px;
          overflow: hidden;
        }
        
        .carousel-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .carousel-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.9);
          border: none;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #374151;
        }
        
        .carousel-btn:hover {
          background: white;
          transform: translateY(-50%) scale(1.1);
        }
        
        .carousel-btn.prev { left: 16px; }
        .carousel-btn.next { right: 16px; }
        
        .carousel-indicators {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
        }
        
        .indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .indicator.active {
          background: white;
          width: 24px;
          border-radius: 5px;
        }
        
        .detail-content {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 32px;
        }
        
        .activity-header {
          background: white;
          padding: 24px;
          border-radius: var(--border-radius);
          box-shadow: var(--card-shadow);
          margin-bottom: 24px;
        }
        
        .header-top {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        
        .status-badge {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
        }
        
        .points-reward {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          color: white;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
        }
        
        .activity-title {
          font-size: 28px;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 20px;
        }
        
        .activity-meta {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .meta-item {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #64748b;
          font-size: 14px;
        }
        
        .meta-item svg {
          color: var(--primary-light);
        }
        
        .remaining {
          color: #10b981;
          font-weight: 600;
          margin-left: 4px;
        }
        
        .activity-description {
          background: white;
          padding: 24px;
          border-radius: var(--border-radius);
          box-shadow: var(--card-shadow);
          margin-bottom: 24px;
        }
        
        .section-subtitle {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 16px;
        }
        
        .activity-description p {
          color: #475569;
          line-height: 1.8;
          font-size: 15px;
        }
        
        .registered-users-section {
          background: white;
          padding: 24px;
          border-radius: var(--border-radius);
          box-shadow: var(--card-shadow);
        }
        
        .users-avatars {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
        }
        
        .user-avatar-item {
          margin-left: -8px;
        }
        
        .user-avatar-item:first-child {
          margin-left: 0;
        }
        
        .user-small-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid white;
          object-fit: cover;
          position: relative;
        }
        
        .more-users {
          margin-left: 8px;
          background: #f1f5f9;
          color: #64748b;
          padding: 8px 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
        }
        
        .action-card {
          padding: 24px;
          margin-bottom: 24px;
        }
        
        .checkin-btn,
        .register-btn-large {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 20px;
        }
        
        .checkin-btn {
          background: var(--primary-gradient);
          color: white;
        }
        
        .checkin-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
        }
        
        .checkin-btn.checked,
        .checkin-btn:disabled {
          background: #94a3b8;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        .register-btn-large {
          background: var(--primary-gradient);
          color: white;
        }
        
        .register-btn-large:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
        }
        
        .register-btn-large:disabled {
          background: #94a3b8;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        .action-info {
          border-top: 1px solid #f1f5f9;
          padding-top: 16px;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 14px;
          color: #64748b;
        }
        
        .highlight {
          color: var(--primary-light);
          font-weight: 700;
        }
        
        .comments-section {
          padding: 24px;
        }
        
        .comment-form {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .comment-input {
          flex: 1;
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 14px;
          font-family: inherit;
          transition: all 0.2s ease;
          outline: none;
        }
        
        .comment-input:focus {
          border-color: var(--primary-light);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .comment-input:disabled {
          background: #f8fafc;
          cursor: not-allowed;
        }
        
        .submit-comment-btn {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--primary-gradient);
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .submit-comment-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
        
        .submit-comment-btn:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        .comments-list {
          max-height: 500px;
          overflow-y: auto;
        }
        
        .load-more-container {
          text-align: center;
          padding: 16px 0;
        }
        
        .load-more-btn {
          background: none;
          border: 2px solid #e2e8f0;
          padding: 10px 24px;
          border-radius: 8px;
          color: #64748b;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .load-more-btn:hover:not(:disabled) {
          border-color: var(--primary-light);
          color: var(--primary-light);
        }
        
        .empty-comments {
          text-align: center;
          padding: 40px 20px;
          color: #94a3b8;
        }
        
        .empty-comments p {
          margin-top: 8px;
        }
        
        .empty-icon {
          opacity: 0.4;
          margin: 0 auto;
        }
        
        .checkin-toast {
          position: fixed;
          bottom: 100px;
          left: 50%;
          transform: translateX(-50%);
          background: #10b981;
          color: white;
          padding: 14px 28px;
          border-radius: 30px;
          font-size: 16px;
          font-weight: 700;
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
          z-index: 1000;
          pointer-events: none;
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
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }
        
        @media (max-width: 1024px) {
          .detail-content {
            grid-template-columns: 1fr;
          }
          
          .right-column {
            order: -1;
          }
        }
        
        @media (max-width: 768px) {
          .detail-page {
            padding: 80px 16px 24px;
          }
          
          .carousel-container {
            height: 250px;
          }
          
          .activity-title {
            font-size: 22px;
          }
          
          .back-btn {
            top: 72px;
            left: 16px;
          }
        }
      `}</style>
    </>
  );
};

export default ActivityDetailPage;
