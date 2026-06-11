import React, { useState } from 'react';

interface LoginProps {
  onLogin: (role: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [entering, setEntering] = useState(false);

  const handleLogin = (role: string) => {
    setSelectedRole(role);
    setEntering(true);
    setTimeout(() => {
      onLogin(role);
    }, 800);
  };

  return (
    <div className={`login-page ${entering ? 'entering' : ''}`}>
      <div className="login-container">
        <div className="login-header">
          <div className="academy-seal">書</div>
          <h1 className="academy-title">古韵书院</h1>
          <p className="academy-subtitle">四艺学堂 · 琴棋书画</p>
        </div>

        <div className="login-divider">
          <span className="divider-text">请选择身份进入</span>
        </div>

        <div className="role-cards">
          <div 
            className="role-card student-card"
            onClick={() => handleLogin('student')}
          >
            <div className="role-icon">🎒</div>
            <h3>学子入口</h3>
            <p>修习四艺，答题悟道</p>
            <div className="role-features">
              <span>📚 预约课程</span>
              <span>✍️ 在线答题</span>
              <span>🏆 成绩排行</span>
            </div>
            <button className="role-btn">进入书院</button>
          </div>

          <div 
            className="role-card teacher-card"
            onClick={() => handleLogin('teacher')}
          >
            <div className="role-icon">👨‍🏫</div>
            <h3>先生入口</h3>
            <p>授业解惑，管理教务</p>
            <div className="role-features">
              <span>📝 发布课程</span>
              <span>📊 成绩统计</span>
              <span>👥 学生管理</span>
            </div>
            <button className="role-btn">进入学堂</button>
          </div>
        </div>

        <div className="login-footer">
          <p>© 古韵书院 · 传承千年文化</p>
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: 
            radial-gradient(circle at 20% 80%, rgba(107, 142, 35, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(204, 51, 51, 0.1) 0%, transparent 50%),
            linear-gradient(180deg, #F5F0E1 0%, #E8E0D0 100%);
          padding: 20px;
          opacity: 1;
          transition: opacity 0.5s ease;
        }
        
        .login-page.entering {
          opacity: 0;
        }
        
        .login-container {
          max-width: 800px;
          width: 100%;
          text-align: center;
        }
        
        .login-header {
          margin-bottom: 40px;
        }
        
        .academy-seal {
          width: 80px;
          height: 80px;
          margin: 0 auto 20px;
          background: #CC3333;
          color: #F5F0E1;
          font-size: 42px;
          font-family: 'LiSu', 'STLiti', '隶书', serif;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          box-shadow: 
            0 4px 20px rgba(204, 51, 51, 0.3),
            inset 0 0 0 3px #F5F0E1,
            inset 0 0 0 6px #CC3333;
          transform: rotate(-5deg);
        }
        
        .academy-title {
          font-size: 48px;
          color: #4A2C1A;
          font-family: 'LiSu', 'STLiti', '隶书', serif;
          letter-spacing: 8px;
          margin-bottom: 12px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }
        
        .academy-subtitle {
          font-size: 18px;
          color: #8B4513;
          letter-spacing: 4px;
        }
        
        .login-divider {
          position: relative;
          margin: 30px 0;
        }
        
        .login-divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, #D4AF37, transparent);
        }
        
        .divider-text {
          position: relative;
          background: #F5F0E1;
          padding: 0 20px;
          color: #8B4513;
          font-size: 14px;
        }
        
        .role-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-top: 30px;
        }
        
        .role-card {
          background: white;
          border-radius: 20px;
          padding: 36px 28px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid transparent;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }
        
        .role-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.15);
        }
        
        .student-card:hover {
          border-color: #6B8E23;
        }
        
        .teacher-card:hover {
          border-color: #D4AF37;
        }
        
        .role-icon {
          font-size: 56px;
          margin-bottom: 16px;
        }
        
        .role-card h3 {
          font-size: 24px;
          color: #4A2C1A;
          margin-bottom: 8px;
        }
        
        .role-card > p {
          color: #888;
          font-size: 14px;
          margin-bottom: 20px;
        }
        
        .role-features {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 24px;
        }
        
        .role-features span {
          font-size: 13px;
          color: #666;
          padding: 6px 0;
        }
        
        .role-btn {
          width: 100%;
          padding: 12px;
          border-radius: 25px;
          font-size: 16px;
          color: white;
          transition: all 0.2s ease;
        }
        
        .student-card .role-btn {
          background: linear-gradient(135deg, #6B8E23 0%, #556B2F 100%);
        }
        
        .teacher-card .role-btn {
          background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%);
        }
        
        .role-card:hover .role-btn {
          opacity: 0.9;
        }
        
        .login-footer {
          margin-top: 40px;
          color: #999;
          font-size: 13px;
        }
        
        @media (max-width: 600px) {
          .academy-title {
            font-size: 32px;
            letter-spacing: 4px;
          }
          
          .academy-subtitle {
            font-size: 14px;
            letter-spacing: 2px;
          }
          
          .role-cards {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .role-card {
            padding: 28px 20px;
          }
          
          .role-icon {
            font-size: 44px;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
