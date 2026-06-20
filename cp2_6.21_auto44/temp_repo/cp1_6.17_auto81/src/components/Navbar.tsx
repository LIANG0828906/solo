import { useState, useRef, useEffect } from 'react';
import { Search, Palette, User, ChevronDown } from 'lucide-react';
import { usePaletteStore } from '../store/usePaletteStore';
import './Navbar.css';

interface NavbarProps {
  onCreateClick: () => void;
}

export function Navbar({ onCreateClick }: NavbarProps) {
  const { searchQuery, setSearchQuery, currentUser } = usePaletteStore();
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const rippleIdRef = useRef(0);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = rippleIdRef.current++;
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
    onCreateClick();
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-left">
          <div className="logo">
            <Palette size={24} />
            <span className="logo-text">PaletteHub</span>
          </div>
        </div>

        <div className="navbar-center">
          <div className={`search-container ${searchExpanded ? 'expanded' : ''}`}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索色板..."
              className="search-input"
              onFocus={() => setSearchExpanded(true)}
              onBlur={() => {
                if (!searchQuery) setSearchExpanded(false);
              }}
            />
          </div>
        </div>

        <div className="navbar-right">
          <button className="create-button" onClick={handleCreateClick}>
            {ripples.map((ripple) => (
              <span
                key={ripple.id}
                className="ripple"
                style={{ left: ripple.x, top: ripple.y }}
              />
            ))}
            <span className="button-text">新建色板</span>
          </button>

          <div className="user-menu" ref={userMenuRef}>
            <button
              className="user-avatar-button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-label="用户菜单"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="user-avatar"
              />
              <ChevronDown size={16} className={`chevron ${userMenuOpen ? 'open' : ''}`} />
            </button>

            {userMenuOpen && (
              <div className="user-dropdown">
                <div className="user-info">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="dropdown-avatar"
                  />
                  <div>
                    <p className="user-name">{currentUser.name}</p>
                    <p className="user-role">设计师</p>
                  </div>
                </div>
                <div className="dropdown-divider" />
                <button className="dropdown-item">
                  <User size={16} />
                  <span>个人中心</span>
                </button>
                <button className="dropdown-item">
                  <Palette size={16} />
                  <span>我的色板</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
