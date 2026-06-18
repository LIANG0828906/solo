interface NavbarProps {
  activeTab: 'keys' | 'stats';
  onTabChange: (tab: 'keys' | 'stats') => void;
}

export function Navbar({ activeTab, onTabChange }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="navbar-brand-icon">🔐</div>
        <span>KeyVault</span>
      </div>
      <div className="navbar-tabs">
        <button
          className={`nav-tab ${activeTab === 'keys' ? 'active' : ''}`}
          onClick={() => onTabChange('keys')}
        >
          密钥管理
        </button>
        <button
          className={`nav-tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => onTabChange('stats')}
        >
          用量统计
        </button>
      </div>
    </nav>
  );
}
