interface ControlBarProps {
  compareMode: boolean;
  onToggleCompareMode: () => void;
  onReset: () => void;
}

export default function ControlBar({ compareMode, onToggleCompareMode, onReset }: ControlBarProps) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: 60,
      background: 'rgba(10, 14, 39, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
    }}>
      <h1 style={{
        fontFamily: 'Arial, sans-serif',
        fontSize: 24,
        color: '#FFFFFF',
        letterSpacing: 2,
        margin: 0,
        fontWeight: 600,
      }}>
        全球城市气候数据三维可视化
      </h1>
      <div style={{
        position: 'absolute',
        right: 24,
        display: 'flex',
        gap: 12,
      }}>
        <button
          onClick={onToggleCompareMode}
          style={{
            padding: '8px 20px',
            background: compareMode ? '#2563EB' : '#1E3A8A',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            fontFamily: 'Arial, sans-serif',
            fontSize: 14,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
          onMouseEnter={(e) => {
            if (!compareMode) e.currentTarget.style.background = '#2563EB';
          }}
          onMouseLeave={(e) => {
            if (!compareMode) e.currentTarget.style.background = '#1E3A8A';
          }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 3h5v5" />
            <path d="M4 20L21 3" />
            <path d="M21 16v5h-5" />
            <path d="M15 15l6 6" />
            <path d="M4 4l5 5" />
          </svg>
          {compareMode ? '对比模式: 开' : '对比模式: 关'}
        </button>
        <button
          onClick={onReset}
          style={{
            padding: '8px 20px',
            background: '#1E3A8A',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            fontFamily: 'Arial, sans-serif',
            fontSize: 14,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#2563EB'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#1E3A8A'}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          重置数据
        </button>
      </div>
    </div>
  );
}
