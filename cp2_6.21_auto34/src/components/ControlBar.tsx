import { useAppStore } from '../store/appStore';
import { ViewMode } from '../types';

export function ControlBar() {
  const { isEclipsing, setEclipsing, mix, setMix } = useAppStore();

  const handleEclipseClick = () => {
    if (isEclipsing) return;

    setEclipsing(true);

    const duration = 3000;
    setTimeout(() => {
      setEclipsing(false);
    }, duration);
  };

  const handleMixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMix(parseFloat(e.target.value));
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '64px',
        backgroundColor: 'rgba(44, 24, 16, 0.85)',
        borderTop: '1px solid #d4af37',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '32px',
        padding: '0 32px',
        boxSizing: 'border-box',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 100,
      }}
      className="control-bar"
    >
      <button
        onClick={handleEclipseClick}
        disabled={isEclipsing}
        style={{
          padding: '10px 24px',
          borderRadius: '8px',
          border: 'none',
          background: isEclipsing
            ? 'linear-gradient(180deg, #8b7355 0%, #6b5344 100%)'
            : 'linear-gradient(180deg, #d4af37 0%, #b8860b 100%)',
          color: '#ffffff',
          fontSize: '16px',
          fontFamily: "'KaiTi', 'STKaiti', serif",
          cursor: isEclipsing ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: isEclipsing ? 'none' : '0 2px 8px rgba(212, 175, 55, 0.3)',
          letterSpacing: '2px',
        }}
        onMouseEnter={(e) => {
          if (!isEclipsing) {
            e.currentTarget.style.boxShadow = '0 0 12px #d4af37';
          }
        }}
        onMouseLeave={(e) => {
          if (!isEclipsing) {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(212, 175, 55, 0.3)';
          }
        }}
      >
        {isEclipsing ? '日食进行中...' : '模拟日食'}
      </button>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flex: 1,
          maxWidth: '400px',
        }}
      >
        <span
          style={{
            color: '#d4af37',
            fontFamily: "'KaiTi', 'STKaiti', serif",
            fontSize: '14px',
            whiteSpace: 'nowrap',
          }}
        >
          星盘
        </span>

        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={mix}
          onChange={handleMixChange}
          style={{
            flex: 1,
            height: '6px',
            borderRadius: '3px',
            background: 'rgba(212, 175, 55, 0.3)',
            outline: 'none',
            WebkitAppearance: 'none',
            appearance: 'none',
            cursor: 'pointer',
          }}
          className="mix-slider"
        />

        <span
          style={{
            color: '#d4af37',
            fontFamily: "'KaiTi', 'STKaiti', serif",
            fontSize: '14px',
            whiteSpace: 'nowrap',
          }}
        >
          浑天仪
        </span>
      </div>
    </div>
  );
}
