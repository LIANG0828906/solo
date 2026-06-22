import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Activity } from '../types';

interface ActivityCardProps {
  activity: Activity;
  onRegister?: () => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onRegister }) => {
  const navigate = useNavigate();
  const remainingSpots = activity.maxParticipants - activity.registeredUsers.length;
  const isFull = remainingSpots <= 0;

  const handleCardClick = () => {
    navigate(`/activity/${activity.id}`);
  };

  const handleRegisterClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRegister) {
      onRegister();
    } else {
      navigate(`/activity/${activity.id}`);
    }
  };

  const getStatusBadge = () => {
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

  return (
    <>
      <div className="activity-card card" onClick={handleCardClick}>
        <div className="card-image-container">
          <img
            src={activity.coverImage}
            alt={activity.title}
            className="card-image"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('community event')}&image_size=landscape_16_9`;
            }}
          />
          {getStatusBadge()}
          <div className="points-badge">+{activity.pointsReward}积分</div>
        </div>
        
        <div className="card-content">
          <h3 className="card-title">{activity.title}</h3>
          
          <div className="card-info">
            <div className="info-item">
              <Calendar size={16} />
              <span>{format(new Date(activity.startTime), 'MM月dd日 HH:mm', { locale: zhCN })}</span>
            </div>
            <div className="info-item">
              <MapPin size={16} />
              <span className="info-text">{activity.location}</span>
            </div>
            <div className="info-item">
              <Users size={16} />
              <span className={isFull ? 'spots-full' : ''}>
                {isFull ? '已满员' : `剩余 ${remainingSpots} 个名额`}
              </span>
            </div>
          </div>

          <div className="card-footer">
            <div className="participants-preview">
              {activity.registeredUsers.slice(0, 5).map((_, idx) => (
                <div
                  key={idx}
                  className="mini-avatar"
                  style={{ marginLeft: idx > 0 ? '-8px' : '0', zIndex: 5 - idx }}
                />
              ))}
              {activity.registeredUsers.length > 5 && (
                <span className="more-participants">+{activity.registeredUsers.length - 5}</span>
              )}
            </div>
            
            <button
              className="register-btn"
              onClick={handleRegisterClick}
              disabled={isFull || activity.status === 'ended'}
            >
              {activity.status === 'ended' ? '已结束' : isFull ? '已满员' : '立即报名'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .activity-card {
          cursor: pointer;
          overflow: hidden;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .activity-card:hover {
          transform: translateY(-8px);
          box-shadow: var(--card-shadow-hover);
        }
        
        .card-image-container {
          position: relative;
          width: 100%;
          height: 180px;
          overflow: hidden;
        }
        
        .card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        
        .activity-card:hover .card-image {
          transform: scale(1.05);
        }
        
        .status-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .points-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          color: white;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
        }
        
        .card-content {
          padding: 16px;
        }
        
        .card-title {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 12px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .card-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }
        
        .info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #64748b;
        }
        
        .info-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .spots-full {
          color: #ef4444;
          font-weight: 600;
        }
        
        .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .participants-preview {
          display: flex;
          align-items: center;
        }
        
        .mini-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #60a5fa, #3b82f6);
          border: 2px solid white;
        }
        
        .more-participants {
          margin-left: 6px;
          font-size: 12px;
          color: #94a3b8;
        }
        
        .register-btn {
          background: var(--primary-gradient);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .register-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
        
        .register-btn:active:not(:disabled) {
          transform: scale(0.95);
        }
        
        .register-btn:disabled {
          background: #94a3b8;
          cursor: not-allowed;
          transform: none;
        }
      `}</style>
    </>
  );
};

export default ActivityCard;
