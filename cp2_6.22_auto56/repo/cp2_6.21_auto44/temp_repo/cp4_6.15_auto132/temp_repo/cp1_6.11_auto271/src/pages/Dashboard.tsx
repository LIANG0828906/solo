import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardProps {
  user: any;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user.role === 'teacher') {
      fetchTeacherStats();
    } else {
      fetchStudentStats();
    }
  }, [user]);

  const fetchTeacherStats = async () => {
    try {
      const response = await fetch('/api/teacher/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('获取统计数据失败', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentStats = async () => {
    try {
      const [coursesRes, leaderboardRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/leaderboard')
      ]);
      const courses = await coursesRes.json();
      const leaderboard = await leaderboardRes.json();
      
      setStats({ courses, leaderboard });
    } catch (error) {
      console.error('获取数据失败', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (user.role === 'teacher') {
    return (
      <div className="dashboard-page">
        <h2 className="page-title">📊 教学管理仪表盘</h2>
        
        <div className="stats-cards">
          <div className="stat-card" style={{ backgroundColor: '#6B8E23' }}>
            <h3>学生总数</h3>
            <p className="stat-number">{stats?.totalStudents || 0}</p>
          </div>
          <div className="stat-card" style={{ backgroundColor: '#3C3C3C' }}>
            <h3>课程总数</h3>
            <p className="stat-number">{stats?.courseCompletion?.length || 0}</p>
          </div>
          <div className="stat-card" style={{ backgroundColor: '#CC3333' }}>
            <h3>平均分</h3>
            <p className="stat-number">
              {stats?.scoreDistribution ? 
                Math.round(
                  (stats.scoreDistribution[0].count * 25 + 
                   stats.scoreDistribution[1].count * 60 + 
                   stats.scoreDistribution[2].count * 80 + 
                   stats.scoreDistribution[3].count * 95) / 
                  (stats.totalStudents || 1)
                ) : 0
              }
            </p>
          </div>
        </div>

        <div className="chart-section">
          <h3>📈 成绩分布柱状图</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.scoreDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D4C9A8" />
                <XAxis dataKey="range" stroke="#4A2C1A" />
                <YAxis stroke="#4A2C1A" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#F5F0E1', 
                    border: '2px solid #D4AF37',
                    borderRadius: '8px',
                    fontFamily: 'KaiTi, STKaiti, serif'
                  }} 
                />
                <Bar dataKey="count" fill="#8B4513" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-section">
          <h3>📚 各课程参与情况</h3>
          <div className="courses-list">
            {stats?.courseCompletion?.map((course: any) => (
              <div key={course.id} className="course-stat-item">
                <div className="course-stat-info">
                  <span className="course-stat-name">{course.name}</span>
                  <span className="course-stat-category">{course.category}艺</span>
                </div>
                <div className="course-stat-progress">
                  <div className="progress-bar-wide">
                    <div 
                      className="progress-fill-wide"
                      style={{ 
                        width: `${(course.enrolledCount / course.maxStudents) * 100}%`,
                        backgroundColor: 
                          course.category === '琴' ? '#6B8E23' :
                          course.category === '棋' ? '#3C3C3C' :
                          course.category === '书' ? '#8B4513' : '#CC3333'
                      }}
                    />
                  </div>
                  <span className="progress-text">
                    {course.enrolledCount}/{course.maxStudents} 人
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const myRank = stats?.leaderboard?.findIndex((u: any) => u.id === user.id) + 1;
  const myScore = stats?.leaderboard?.find((u: any) => u.id === user.id)?.totalScore || 0;

  const categoryColors = ['#6B8E23', '#3C3C3C', '#8B4513', '#CC3333'];
  const categoryData = [
    { name: '琴', value: stats?.courses?.filter((c: any) => c.category === '琴').length || 0 },
    { name: '棋', value: stats?.courses?.filter((c: any) => c.category === '棋').length || 0 },
    { name: '书', value: stats?.courses?.filter((c: any) => c.category === '书').length || 0 },
    { name: '画', value: stats?.courses?.filter((c: any) => c.category === '画').length || 0 }
  ];

  return (
    <div className="dashboard-page">
      <h2 className="page-title">🏛️ 欢迎回到古韵书院</h2>
      
      <div className="welcome-section">
        <div className="welcome-avatar">
          <img src={user.avatar} alt={user.name} />
        </div>
        <div className="welcome-info">
          <h3>{user.name} 同学</h3>
          <p>{user.grade}</p>
          <div className="quick-stats">
            <span>总积分: <strong>{myScore}</strong></span>
            <span>排名: <strong>第{myRank}名</strong></span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="chart-section">
          <h3>🎯 四艺课程分布</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={categoryColors[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="chart-legend">
              {categoryData.map((item, index) => (
                <div key={item.name} className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: categoryColors[index] }}></span>
                  <span>{item.name}艺 ({item.value}门)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="chart-section">
          <h3>🏆 排行榜</h3>
          <div className="leaderboard-mini">
            {stats?.leaderboard?.slice(0, 5).map((u: any, index: number) => (
              <div key={u.id} className={`leaderboard-item rank-${index + 1}`}>
                <span className="rank-badge">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `第${index + 1}名`}
                </span>
                <span className="leader-name">{u.name}</span>
                <span className="leader-score">{u.totalScore}分</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="chart-section">
        <h3>📚 热门课程</h3>
        <div className="popular-courses">
          {stats?.courses?.slice(0, 4).map((course: any) => (
            <div 
              key={course.id} 
              className="popular-course-card"
              style={{
                backgroundColor: 
                  course.category === '琴' ? '#6B8E23' :
                  course.category === '棋' ? '#3C3C3C' :
                  course.category === '书' ? '#F5F0E1' : '#CC3333',
                color: course.category === '书' ? '#3C3C3C' : '#fff'
              }}
            >
              <span className="course-icon">
                {course.category === '琴' ? '🎐' : 
                 course.category === '棋' ? '⚫' :
                 course.category === '书' ? '🖌️' : '🎨'}
              </span>
              <h4>{course.name}</h4>
              <p>{course.teacher} 授课</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .dashboard-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        .page-title {
          font-size: 32px;
          color: #4A2C1A;
          text-align: center;
          margin-bottom: 8px;
        }
        
        .welcome-section {
          background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 24px;
          color: #F5F0E1;
          box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        }
        
        .welcome-avatar img {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 3px solid #D4AF37;
          background: #F5F0E1;
        }
        
        .welcome-info h3 {
          font-size: 24px;
          margin-bottom: 4px;
        }
        
        .quick-stats {
          display: flex;
          gap: 20px;
          margin-top: 8px;
          font-size: 14px;
        }
        
        .quick-stats strong {
          color: #D4AF37;
          font-size: 18px;
        }
        
        .stats-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        
        .stat-card {
          color: white;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .stat-card h3 {
          font-size: 16px;
          margin-bottom: 8px;
          opacity: 0.9;
        }
        
        .stat-number {
          font-size: 36px;
          font-weight: bold;
          font-family: 'LiSu', 'STLiti', '隶书', serif;
        }
        
        .chart-section {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border: 1px solid #E8E0D0;
        }
        
        .chart-section h3 {
          font-size: 20px;
          color: #4A2C1A;
          margin-bottom: 16px;
        }
        
        .chart-container {
          width: 100%;
        }
        
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        
        .chart-legend {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-top: 12px;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
        }
        
        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        
        .leaderboard-mini {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .leaderboard-item {
          display: flex;
          align-items: center;
          padding: 10px 12px;
          border-radius: 8px;
          background: #F9F6EE;
        }
        
        .leaderboard-item.rank-1 { background: linear-gradient(90deg, #FFD700 0%, #FFA500 100%); color: #4A2C1A; }
        .leaderboard-item.rank-2 { background: linear-gradient(90deg, #C0C0C0 0%, #A8A8A8 100%); color: #4A2C1A; }
        .leaderboard-item.rank-3 { background: linear-gradient(90deg, #CD7F32 0%, #B87333 100%); color: #fff; }
        
        .rank-badge {
          font-size: 14px;
          font-weight: bold;
          min-width: 60px;
        }
        
        .leader-name {
          flex: 1;
          font-size: 15px;
        }
        
        .leader-score {
          font-weight: bold;
          font-size: 16px;
        }
        
        .popular-courses {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        
        .popular-course-card {
          padding: 16px;
          border-radius: 10px;
          text-align: center;
          transition: transform 0.2s ease;
          cursor: pointer;
        }
        
        .popular-course-card:hover {
          transform: translateY(-3px);
        }
        
        .course-icon {
          font-size: 32px;
          display: block;
          margin-bottom: 8px;
        }
        
        .popular-course-card h4 {
          font-size: 16px;
          margin-bottom: 4px;
        }
        
        .popular-course-card p {
          font-size: 12px;
          opacity: 0.8;
        }
        
        .courses-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .course-stat-item {
          padding: 12px;
          background: #F9F6EE;
          border-radius: 8px;
        }
        
        .course-stat-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .course-stat-name {
          font-weight: bold;
          color: #4A2C1A;
        }
        
        .course-stat-category {
          font-size: 12px;
          color: #8B4513;
          background: #F5E6D3;
          padding: 2px 8px;
          border-radius: 4px;
        }
        
        .course-stat-progress {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .progress-bar-wide {
          flex: 1;
          height: 8px;
          background: #E8E0D0;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .progress-fill-wide {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        
        .progress-text {
          font-size: 13px;
          color: #666;
          min-width: 80px;
          text-align: right;
        }
        
        @media (max-width: 768px) {
          .page-title {
            font-size: 24px;
          }
          
          .welcome-section {
            flex-direction: column;
            text-align: center;
          }
          
          .stats-cards {
            grid-template-columns: 1fr;
          }
          
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
          
          .popular-courses {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
