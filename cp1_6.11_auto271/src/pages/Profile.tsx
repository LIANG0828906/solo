import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ProfileProps {
  user: any;
  onRefresh: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onRefresh }) => {
  const navigate = useNavigate();
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [coursesRes, leaderboardRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/leaderboard')
      ]);
      
      const coursesData = await coursesRes.json();
      const leaderboardData = await leaderboardRes.json();
      
      const myCourses = user.enrolledCourses.map((ec: any) => {
        const course = coursesData.find((c: any) => c.id === ec.courseId);
        return { ...ec, course };
      }).filter((item: any) => item.course);
      
      setEnrolledCourses(myCourses);
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('获取数据失败', error);
    } finally {
      setLoading(false);
    }
  };

  const myRank = leaderboard.findIndex((u: any) => u.id === user.id) + 1;
  const myScore = leaderboard.find((u: any) => u.id === user.id)?.totalScore || 0;

  const completedCount = enrolledCourses.filter(c => c.completed).length;

  const categoryColors: Record<string, string> = {
    '琴': '#6B8E23',
    '棋': '#3C3C3C',
    '书': '#8B4513',
    '画': '#CC3333'
  };

  const sidebarItems = [
    { key: 'courses', icon: '📚', label: '我的课程', subMenu: ['已预约', '已完成', '进行中'] },
    { key: 'scores', icon: '📊', label: '成绩记录', subMenu: ['各科成绩', '历史排名'] },
    { key: 'info', icon: '👤', label: '个人信息', subMenu: ['基本资料', '修改密码'] }
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="bamboo-loading">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bamboo-slip"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div 
        className={`scroll-sidebar ${sidebarHovered ? 'hovered' : ''}`}
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
      >
        <div className="sidebar-decoration">
          <div className="spine-texture"></div>
        </div>
        
        <div className="sidebar-content">
          <div className="sidebar-user">
            <img src={user.avatar} alt={user.name} className="sidebar-avatar" />
            <div className="sidebar-user-info">
              <h3>{user.name}</h3>
              <p>{user.grade}</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            {sidebarItems.map(item => (
              <div 
                key={item.key}
                className={`sidebar-item ${activeTab === item.key ? 'active' : ''}`}
                onClick={() => setActiveTab(item.key)}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
                <div className={`submenu ${sidebarHovered ? 'visible' : ''}`}>
                  {item.subMenu.map((sub, idx) => (
                    <span key={idx} className="submenu-item">{sub}</span>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </div>

      <div className="profile-content">
        <h2 className="page-title">👤 个人中心</h2>

        <div className="profile-header-cards">
          <div className="info-card-large">
            <div className="info-card-icon" style={{ backgroundColor: '#D4AF37' }}>🏆</div>
            <div>
              <p className="info-card-value">{myScore}</p>
              <p className="info-card-label">总积分</p>
            </div>
          </div>
          
          <div className="info-card-large">
            <div className="info-card-icon" style={{ backgroundColor: '#6B8E23' }}>🥇</div>
            <div>
              <p className="info-card-value">第{myRank}名</p>
              <p className="info-card-label">当前排名</p>
            </div>
          </div>
          
          <div className="info-card-large">
            <div className="info-card-icon" style={{ backgroundColor: '#CC3333' }}>📚</div>
            <div>
              <p className="info-card-value">{enrolledCourses.length}</p>
              <p className="info-card-label">已预约课程</p>
            </div>
          </div>
          
          <div className="info-card-large">
            <div className="info-card-icon" style={{ backgroundColor: '#3C3C3C' }}>✅</div>
            <div>
              <p className="info-card-value">{completedCount}</p>
              <p className="info-card-label">已完成答题</p>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h3 className="section-title">📖 我的课程</h3>
          
          {enrolledCourses.length > 0 ? (
            <div className="courses-list">
              {enrolledCourses.map((item: any) => (
                <div 
                  key={item.courseId} 
                  className="enrolled-course-card"
                  onClick={() => navigate(`/course/${item.courseId}`)}
                  style={{ borderLeftColor: categoryColors[item.course.category] || '#8B4513' }}
                >
                  <div className="course-info">
                    <div className="course-category-badge" style={{ backgroundColor: categoryColors[item.course.category] }}>
                      {item.course.category}艺
                    </div>
                    <h4 className="course-name">{item.course.name}</h4>
                    <p className="course-teacher">授课先生：{item.course.teacher}</p>
                  </div>
                  
                  <div className="course-status">
                    {item.completed ? (
                      <div className="status-completed">
                        <span className="score-badge">{item.score}分</span>
                        <span className="status-label">已完成</span>
                      </div>
                    ) : (
                      <div className="status-pending">
                        <span className="status-dot"></span>
                        <span className="status-label">进行中</span>
                      </div>
                    )}
                    <button className="view-detail-btn">
                      查看详情 →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <p>暂无已预约课程</p>
              <button 
                className="browse-btn"
                onClick={() => navigate('/courses/琴')}
              >
                去浏览课程
              </button>
            </div>
          )}
        </div>

        <div className="content-section">
          <h3 className="section-title">🏆 排行榜</h3>
          <div className="leaderboard-card">
            {leaderboard.slice(0, 10).map((u: any, index: number) => (
              <div 
                key={u.id} 
                className={`leaderboard-row ${
                  u.id === user.id ? 'is-me' : ''
                } ${
                  index === 0 ? 'rank-1' : 
                  index === 1 ? 'rank-2' : 
                  index === 2 ? 'rank-3' : ''
                }`}
              >
                <span className="rank-col">
                  {index === 0 ? '🥇' : 
                   index === 1 ? '🥈' : 
                   index === 2 ? '🥉' : 
                   `第${index + 1}名`}
                </span>
                <span className="name-col">{u.name}</span>
                <span className="score-col">{u.totalScore}分</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .profile-page {
          display: flex;
          gap: 24px;
          position: relative;
        }
        
        .scroll-sidebar {
          width: 80px;
          background: linear-gradient(90deg, #4A2C1A 0%, #5C3A24 50%, #4A2C1A 100%);
          border-radius: 12px;
          position: sticky;
          top: 90px;
          height: fit-content;
          min-height: 400px;
          transition: all 0.3s ease-out;
          box-shadow: 4px 4px 16px rgba(0,0,0,0.3);
          overflow: hidden;
          flex-shrink: 0;
        }
        
        .scroll-sidebar.hovered {
          width: 220px;
          transform: translateX(4px);
        }
        
        .sidebar-decoration {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 12px;
          background: repeating-linear-gradient(
            0deg,
            #D4AF37 0px,
            #D4AF37 2px,
            #8B4513 2px,
            #8B4513 20px
          );
        }
        
        .sidebar-content {
          padding: 20px 12px 20px 20px;
        }
        
        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(212, 175, 55, 0.3);
        }
        
        .sidebar-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 2px solid #D4AF37;
          background: #F5F0E1;
          flex-shrink: 0;
        }
        
        .sidebar-user-info {
          white-space: nowrap;
          overflow: hidden;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .scroll-sidebar.hovered .sidebar-user-info {
          opacity: 1;
        }
        
        .sidebar-user-info h3 {
          color: #F5F0E1;
          font-size: 16px;
          margin-bottom: 2px;
        }
        
        .sidebar-user-info p {
          color: #D4AF37;
          font-size: 12px;
        }
        
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          color: #F5F0E1;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }
        
        .sidebar-item:hover {
          background: rgba(212, 175, 55, 0.2);
        }
        
        .sidebar-item.active {
          background: rgba(212, 175, 55, 0.3);
          color: #FFD700;
        }
        
        .sidebar-icon {
          font-size: 20px;
          flex-shrink: 0;
          width: 24px;
          text-align: center;
        }
        
        .sidebar-label {
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.3s ease;
          font-size: 14px;
        }
        
        .scroll-sidebar.hovered .sidebar-label {
          opacity: 1;
        }
        
        .submenu {
          position: absolute;
          left: 100%;
          top: 50%;
          transform: translateY(-50%) translateX(10px);
          background: #5C3A24;
          border-radius: 8px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease-out;
          min-width: 120px;
          z-index: 10;
          border: 1px solid #D4AF37;
        }
        
        .submenu.visible {
          opacity: 1;
          visibility: visible;
          transform: translateY(-50%) translateX(0);
        }
        
        .submenu-item {
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 13px;
          color: #F5F0E1;
        }
        
        .submenu-item:hover {
          background: rgba(212, 175, 55, 0.3);
        }
        
        .profile-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 24px;
          min-width: 0;
        }
        
        .page-title {
          font-size: 28px;
          color: #4A2C1A;
        }
        
        .profile-header-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        
        .info-card-large {
          background: white;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          border: 1px solid #E8E0D0;
        }
        
        .info-card-icon {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }
        
        .info-card-value {
          font-size: 24px;
          font-weight: bold;
          color: #3C3C3C;
          font-family: 'LiSu', 'STLiti', '隶书', serif;
        }
        
        .info-card-label {
          font-size: 13px;
          color: #888;
        }
        
        .content-section {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          border: 1px solid #E8E0D0;
        }
        
        .section-title {
          font-size: 20px;
          color: #4A2C1A;
          margin-bottom: 16px;
        }
        
        .courses-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .enrolled-course-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: #F9F6EE;
          border-radius: 10px;
          border-left: 4px solid;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .enrolled-course-card:hover {
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .course-category-badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 4px;
          font-size: 12px;
          color: white;
          margin-bottom: 6px;
        }
        
        .course-name {
          font-size: 16px;
          color: #3C3C3C;
          margin-bottom: 4px;
        }
        
        .course-teacher {
          font-size: 13px;
          color: #888;
        }
        
        .course-status {
          text-align: right;
        }
        
        .status-completed {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          margin-bottom: 8px;
        }
        
        .score-badge {
          background: linear-gradient(135deg, #D4AF37, #B8860B);
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-weight: bold;
          font-size: 14px;
        }
        
        .status-pending {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
          justify-content: flex-end;
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #6B8E23;
          animation: blink 1.5s ease-in-out infinite;
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .status-label {
          font-size: 13px;
          color: #666;
        }
        
        .view-detail-btn {
          background: transparent;
          color: #8B4513;
          font-size: 13px;
        }
        
        .leaderboard-card {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .leaderboard-row {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border-radius: 8px;
          background: #F9F6EE;
        }
        
        .leaderboard-row.rank-1 { background: linear-gradient(90deg, #FFD700 0%, #FFA500 100%); color: #4A2C1A; }
        .leaderboard-row.rank-2 { background: linear-gradient(90deg, #C0C0C0 0%, #A8A8A8 100%); color: #4A2C1A; }
        .leaderboard-row.rank-3 { background: linear-gradient(90deg, #CD7F32 0%, #B87333 100%); color: #fff; }
        
        .leaderboard-row.is-me {
          border: 2px solid #D4AF37;
        }
        
        .rank-col {
          width: 80px;
          font-size: 14px;
          font-weight: bold;
        }
        
        .name-col {
          flex: 1;
          font-size: 15px;
        }
        
        .score-col {
          font-weight: bold;
          font-size: 16px;
        }
        
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #999;
        }
        
        .empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }
        
        .browse-btn {
          margin-top: 16px;
          padding: 10px 24px;
          background: #8B4513;
          color: white;
          border-radius: 20px;
          font-size: 14px;
        }
        
        @media (max-width: 1024px) {
          .scroll-sidebar {
            display: none;
          }
          
          .profile-header-cards {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 600px) {
          .profile-header-cards {
            grid-template-columns: 1fr;
          }
          
          .page-title {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default Profile;
