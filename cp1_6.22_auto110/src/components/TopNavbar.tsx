import React from 'react';
import { Sun, Compass } from 'lucide-react';

interface TopNavbarProps {
  displayTime: string;
  seasonLabel: string;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ displayTime, seasonLabel }) => {
  return (
    <div className="top-navbar">
      <div className="navbar-title">
        <Sun className="navbar-icon" />
        <span>日照阴影模拟分析系统</span>
      </div>
      <div className="navbar-time">
        <span className="season-badge">{seasonLabel}</span>
        <span className="time-display">{displayTime}</span>
      </div>
    </div>
  );
};

export default TopNavbar;
