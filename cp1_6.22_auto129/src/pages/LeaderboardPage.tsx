import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Users, Award } from 'lucide-react';
import { User } from '../types';
import { getLeaderboard } from '../services/apiService';
import { useStore } from '../store/useStore';

const LeaderboardPage: React.FC = () => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [topTen, setTopTen] = useState<User[]>([]);
  const [showAnimation, setShowAnimation] = useState(false);
  const { loading } = useStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [users, top] = await Promise.all([
          getLeaderboard(),
          getLeaderboard(10),
        ]);
        setAllUsers(users);
        setTopTen(top);
        setTimeout(() => setShowAnimation(true), 100);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      }
    };
    fetchData();
  }, []);

  const getMedalColor = (rank: number) => {
    const colors = ['#fbbf24', '#9ca3af', '#cd7f32'];
    return colors[rank] || '#6b7280';
  };

  const getRankBg = (rank: number) => {
    const bgs = [
      'linear-gradient(135deg, #fef3c7, #fde68a)',
      'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
      'linear-gradient(135deg, #ffedd5, #fed7aa)',
    ];
    return bgs[rank] || 'white';
  };

  const remainingUsers = allUsers.slice(10);

  return (
    <>
      <div className="leaderboard-page">
        <div className="page-header">
          <h1 className="page-title">
            <Trophy size={32} className="title-icon" />
            积分排行榜
          </h1>
          <p className="page-subtitle">参与活动，赢取积分，成为社区明星！</p>
        </div>

        <section className="top-ten-section">
          <h2 className="section-title">
            <Award size={24} />
            TOP 10 活跃用户
          </h2>
          <div className="top-ten-grid">
            {topTen.map((user, index) => (
              <div
                key={user.id}
                className={`top-user-card ${showAnimation ? 'bounce-in' : ''}`}
                style={{
                  animationDelay: `${index * 0.08}s`,
                  background: index < 3 ? getRankBg(index) : 'white',
                }}
              >
                <div className="rank-display">
                  {index < 3 ? (
                    <div className="medal-icon" style={{ background: getMedalColor(index) }}>
                      <Medal size={20} />
                    </div>
                  ) : (
                    <span
                      className={`rank-number ${showAnimation ? 'bounce-in' : ''}`}
                      style={{
                        animationDelay: `${index * 0.08 + 0.2}s`,
                        color: getMedalColor(index),
                      }}
                    >
                      {index + 1}
                    </span>
                  )}
                </div>
                <img
                  src={user.avatar}
                  alt={user.nickname}
                  className="user-avatar"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('user avatar')}&image_size=square`;
                  }}
                />
                <div className="user-info">
                  <span className="user-name">{user.nickname}</span>
                  <div className="user-stats">
                    <span className="points">
                      <Trophy size={14} />
                      {user.totalPoints} 积分
                    </span>
                    <span className="activities">
                      <Users size={14} />
                      {user.activitiesParticipated} 次活动
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="full-list-section">
          <h2 className="section-title">
            <Users size={24} />
            完整排名
          </h2>
          <div className="table-container">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>排名</th>
                  <th>用户</th>
                  <th style={{ width: '150px' }}>积分</th>
                  <th style={{ width: '150px' }}>参与活动</th>
                </tr>
              </thead>
              <tbody>
                {remainingUsers.map((user, index) => (
                  <tr key={user.id} className="table-row fade-in">
                    <td>
                      <span className="table-rank">#{index + 11}</span>
                    </td>
                    <td>
                      <div className="table-user">
                        <img
                          src={user.avatar}
                          alt={user.nickname}
                          className="table-avatar"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('user avatar')}&image_size=square`;
                          }}
                        />
                        <span className="table-name">{user.nickname}</span>
                      </div>
                    </td>
                    <td>
                      <span className="table-points">{user.totalPoints}</span>
                    </td>
                    <td>{user.activitiesParticipated} 次</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {remainingUsers.length === 0 && !loading && (
              <div className="empty-state">
                <Users size={48} className="empty-icon" />
                <p>暂无更多用户</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <style>{`
        .leaderboard-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 24px 40px;
        }
        
        .page-header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .page-title {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-size: 36px;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 8px;
        }
        
        .title-icon {
          color: #fbbf24;
        }
        
        .page-subtitle {
          font-size: 16px;
          color: #64748b;
        }
        
        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 22px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 24px;
        }
        
        .top-ten-section {
          margin-bottom: 48px;
        }
        
        .top-ten-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 20px;
        }
        
        .top-user-card {
          background: white;
          border-radius: 16px;
          padding: 24px 16px;
          text-align: center;
          box-shadow: var(--card-shadow);
          transition: all 0.3s ease;
          opacity: 0;
        }
        
        .top-user-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--card-shadow-hover);
        }
        
        .rank-display {
          margin-bottom: 12px;
          display: flex;
          justify-content: center;
        }
        
        .medal-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .rank-number {
          font-size: 32px;
          font-weight: 800;
          opacity: 0;
        }
        
        .user-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          object-fit: cover;
          margin-bottom: 12px;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .user-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .user-name {
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
        }
        
        .user-stats {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 12px;
        }
        
        .points,
        .activities {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          color: #64748b;
        }
        
        .points {
          color: var(--primary-light);
          font-weight: 600;
        }
        
        .full-list-section {
          background: white;
          border-radius: var(--border-radius);
          padding: 24px;
          box-shadow: var(--card-shadow);
        }
        
        .table-container {
          max-height: 500px;
          overflow-y: auto;
          overflow-x: hidden;
        }
        
        .leaderboard-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }
        
        .leaderboard-table thead {
          position: sticky;
          top: 0;
          background: white;
          z-index: 10;
        }
        
        .leaderboard-table th {
          text-align: left;
          padding: 16px 20px;
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #f1f5f9;
          background: white;
        }
        
        .leaderboard-table td {
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
        }
        
        .table-row {
          transition: background-color 0.2s ease;
        }
        
        .table-row:hover {
          background-color: var(--hover-bg);
        }
        
        .table-rank {
          font-weight: 700;
          color: #64748b;
        }
        
        .table-user {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .table-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
        }
        
        .table-name {
          font-weight: 600;
          color: #1e293b;
        }
        
        .table-points {
          font-weight: 700;
          color: var(--primary-light);
          font-size: 16px;
        }
        
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #94a3b8;
        }
        
        .empty-icon {
          opacity: 0.4;
          margin-bottom: 12px;
        }
        
        @media (max-width: 1024px) {
          .top-ten-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        
        @media (max-width: 768px) {
          .leaderboard-page {
            padding: 80px 16px 24px;
          }
          
          .page-title {
            font-size: 26px;
          }
          
          .top-ten-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .leaderboard-table th:nth-child(4),
          .leaderboard-table td:nth-child(4) {
            display: none;
          }
        }
        
        @media (max-width: 480px) {
          .top-ten-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
};

export default LeaderboardPage;
