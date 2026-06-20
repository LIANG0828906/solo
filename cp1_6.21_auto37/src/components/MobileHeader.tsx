interface MobileHeaderProps {
  open: boolean;
  onToggle: () => void;
}

export function MobileHeader({ open, onToggle }: MobileHeaderProps) {
  return (
    <header className="mobile-header">
      <button
        className="hamburger-btn"
        onClick={onToggle}
        aria-label={open ? '收起输入面板' : '展开输入面板'}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </button>
      <h1 className="mobile-title">智能简历仪表盘</h1>
      <div style={{ width: 40 }} />
    </header>
  );
}

export default MobileHeader;
