import { Search, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onPublish: () => void;
  onSearch: (value: string) => void;
  searchValue: string;
  onProfile: () => void;
}

export default function Navbar({
  onPublish,
  onSearch,
  searchValue,
  onProfile,
}: NavbarProps) {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        .navbar-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: #FFFFFFCC;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          z-index: 100;
          border-bottom: 1px solid #FFE0B2;
        }
        .navbar-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
          transition: transform 0.2s ease;
        }
        .navbar-logo:hover {
          transform: scale(1.05);
        }
        .navbar-logo-text {
          font-size: 22px;
          font-weight: bold;
          color: #8B4513;
          letter-spacing: 1px;
        }
        .navbar-search {
          position: relative;
          flex: 1;
          max-width: 480px;
          margin: 0 32px;
        }
        .navbar-search-input {
          width: 100%;
          height: 40px;
          padding: 0 16px 0 44px;
          border-radius: 20px;
          border: 2px solid #FFCC80;
          background: #FFFDF8;
          font-size: 14px;
          color: #5C4033;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .navbar-search-input:focus {
          border-color: #FF8C00;
          box-shadow: 0 0 0 3px #FFE0B2;
        }
        .navbar-search-input::placeholder {
          color: #A1887F;
        }
        .navbar-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #A1887F;
        }
        .navbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .navbar-profile-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid #FFCC80;
          background: #FFFDF8;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #8B4513;
          transition: all 0.2s ease;
        }
        .navbar-profile-btn:hover {
          border-color: #FF8C00;
          background: #FFF3E0;
          transform: scale(1.05);
        }
        .navbar-publish-btn {
          height: 40px;
          padding: 0 20px;
          border-radius: 8px;
          border: none;
          background: linear-gradient(135deg, #FF8C00 0%, #FFA500 100%);
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(255, 140, 0, 0.3);
          transition: all 0.2s ease;
        }
        .navbar-publish-btn:hover {
          box-shadow: 0 4px 16px rgba(255, 140, 0, 0.4);
          transform: translateY(-2px);
        }
        .navbar-publish-btn:disabled {
          opacity: var(--global-loading-opacity, 1);
          cursor: var(--global-loading-cursor, pointer);
        }
      `}</style>
      <div className="navbar-container">
        <div
          className="navbar-logo"
          onClick={() => navigate('/')}
        >
          <span style={{ fontSize: '26px' }}>🍳</span>
          <span className="navbar-logo-text">风味图谱</span>
        </div>

        <div className="navbar-search">
          <Search className="navbar-search-icon" size={18} />
          <input
            type="text"
            className="navbar-search-input"
            placeholder="搜索菜品或食材..."
            value={searchValue}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        <div className="navbar-right">
          <button
            className="navbar-profile-btn"
            onClick={onProfile}
            title="个人主页"
          >
            <UserRound size={20} />
          </button>
          <button
            className="navbar-publish-btn"
            onClick={onPublish}
          >
            + 发布菜品
          </button>
        </div>
      </div>
    </>
  );
}
