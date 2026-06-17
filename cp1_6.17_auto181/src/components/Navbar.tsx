import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../store';

function Navbar() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowDropdown(false);
    navigate('/');
  };

  return (
    <nav className="nav-bar">
      <Link to="/" className="nav-title">
        墨韵纸境
      </Link>
      
      <div className="nav-right">
        <input
          type="text"
          className="search-box"
          placeholder="搜索作品..."
        />
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link 
            to="/create" 
            style={{ 
              color: '#FFF8DC', 
              textDecoration: 'none',
              fontSize: '14px',
              transition: 'color 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#D4A373'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#FFF8DC'}
          >
            创作
          </Link>
          <Link 
            to="/gallery" 
            style={{ 
              color: '#FFF8DC', 
              textDecoration: 'none',
              fontSize: '14px',
              transition: 'color 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#D4A373'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#FFF8DC'}
          >
            画廊
          </Link>
        </div>
        
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <div 
            className="user-avatar"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            {user.name.charAt(0)}
          </div>
          
          {showDropdown && (
            <div className="dropdown-menu">
              <div 
                className="dropdown-item"
                onClick={() => {
                  setShowDropdown(false);
                  navigate('/personal');
                }}
              >
                我的作品
              </div>
              <div className="dropdown-item" onClick={handleLogout}>
                退出登录
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
