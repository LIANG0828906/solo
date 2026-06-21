import React, { useState } from 'react';
import { Leaf, LogIn, LogOut, User, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { registerUser } from '../services/apiService';

const TopBar: React.FC = () => {
  const { currentUser, setCurrentUser, logout } = useStore();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    
    const avatarUrl = avatar.trim() || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(`avatar of ${nickname}`)}&image_size=square`;
    
    const user = await registerUser({ nickname: nickname.trim(), avatar: avatarUrl });
    setCurrentUser(user);
    setShowLoginModal(false);
    setNickname('');
    setAvatar('');
  };

  return (
    <>
      <header className="top-bar">
        <div className="top-bar-content">
          <Link to="/" className="logo-section">
            <Leaf className="logo-icon" size={28} />
            <span className="app-name">社区活动中心</span>
          </Link>
          
          <nav className="nav-links">
            <Link to="/" className="nav-link">首页</Link>
            <Link to="/activities" className="nav-link">活动列表</Link>
            <Link to="/leaderboard" className="nav-link">排行榜</Link>
            {currentUser && (
              <button
                className="create-activity-btn"
                onClick={() => navigate('/activities?create=true')}
              >
                <Plus size={18} />
                发布活动
              </button>
            )}
          </nav>

          <div className="user-section">
            {currentUser ? (
              <div className="user-info">
                <div className="user-avatar-wrapper">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.nickname}
                    className="user-avatar"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('user avatar')}&image_size=square`;
                    }}
                  />
                </div>
                <span className="user-nickname">{currentUser.nickname}</span>
                <span className="user-points">{currentUser.totalPoints}积分</span>
                <button className="logout-btn" onClick={logout} title="退出登录">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button className="login-btn" onClick={() => setShowLoginModal(true)}>
                <LogIn size={18} />
                登录
              </button>
            )}
          </div>
        </div>
      </header>

      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              <User size={24} />
              用户登录
            </h2>
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label>昵称</label>
                <input
                  type="text"
                  className="input-field"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="请输入您的昵称"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>头像URL（可选）</label>
                <input
                  type="text"
                  className="input-field"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="输入头像图片URL，留空则自动生成"
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '16px' }}>
                登录/注册
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .top-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: var(--primary-gradient);
          z-index: 100;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .top-bar-content {
          max-width: 1400px;
          margin: 0 auto;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
        }
        
        .logo-section {
          display: flex;
          align-items: center;
          gap: 10px;
          color: white;
          text-decoration: none;
        }
        
        .logo-icon {
          color: white;
        }
        
        .app-name {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        
        .nav-links {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .nav-link {
          color: rgba(255, 255, 255, 0.9);
          text-decoration: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .nav-link:hover {
          color: white;
          background: rgba(255, 255, 255, 0.15);
        }
        
        .create-activity-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 8px 14px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-left: 8px;
        }
        
        .create-activity-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }
        
        .user-section {
          display: flex;
          align-items: center;
        }
        
        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .user-avatar-wrapper {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid rgba(255, 255, 255, 0.3);
        }
        
        .user-avatar {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .user-nickname {
          color: white;
          font-weight: 600;
        }
        
        .user-points {
          background: rgba(255, 255, 255, 0.2);
          color: #fef08a;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .logout-btn {
          background: rgba(255, 255, 255, 0.15);
          border: none;
          color: white;
          padding: 6px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        
        .logout-btn:hover {
          background: rgba(255, 255, 255, 0.25);
        }
        
        .login-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: white;
          color: var(--primary-dark);
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .login-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .modal-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 20px;
          font-weight: 700;
          color: var(--primary-dark);
          margin-bottom: 20px;
        }
        
        .login-form .form-group {
          margin-bottom: 16px;
        }
        
        .login-form label {
          display: block;
          font-weight: 600;
          margin-bottom: 6px;
          color: #374151;
        }
        
        @media (max-width: 768px) {
          .nav-links {
            display: none;
          }
          .app-name {
            font-size: 16px;
          }
          .user-nickname, .user-points {
            display: none;
          }
        }
      `}</style>
    </>
  );
};

export default TopBar;
