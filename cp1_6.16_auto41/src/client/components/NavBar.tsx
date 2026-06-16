import { memo } from 'react';
import './NavBar.css';

interface NavBarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  friendliness: number;
}

const navItems = [
  { id: 'home', label: '主页', icon: '🏠' },
  { id: 'friends', label: '好友', icon: '👥' },
  { id: 'checkin', label: '签到', icon: '📅' },
  { id: 'backpack', label: '背包', icon: '🎒' },
];

const NavBar = memo(function NavBar({ currentPage, onNavigate, friendliness }: NavBarProps) {
  return (
    <nav className="navbar">
      <div className="nav-brand">
        <span className="brand-icon">🐾</span>
        <span className="brand-text">虚拟宠物小站</span>
      </div>
      
      <div className="nav-items">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>
      
      <div className="nav-stats">
        <div className="friendliness-display">
          <span className="star-icon">⭐</span>
          <span className="friendliness-value">{friendliness}</span>
        </div>
      </div>
    </nav>
  );
});

export default NavBar;
