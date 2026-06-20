import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';

export function InfoPanel() {
  const { panelData, closePanel } = useAppStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePanel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closePanel]);

  if (!panelData) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closePanel();
    }
  };

  const verticalText = (text: string) => {
    return text.split('').map((char, i) => (
      <span key={i} style={{ display: 'block' }}>
        {char}
      </span>
    ));
  };

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: '400px',
          maxWidth: '90%',
          height: 'auto',
          maxHeight: '80vh',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: '16px',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          padding: '32px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          position: 'relative',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'rgba(212, 175, 55, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#d4af37',
            fontSize: '18px',
            transition: 'all 0.3s',
          }}
          onClick={closePanel}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.2)';
          }}
        >
          ✕
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'row-reverse',
            gap: '24px',
            minHeight: '200px',
          }}
        >
          <div
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              fontFamily: "'KaiTi', 'STKaiti', serif",
              color: '#f5deb3',
              fontSize: '20px',
              lineHeight: '1.8',
              letterSpacing: '4px',
              fontWeight: 'bold',
              borderRight: '2px solid #d4af37',
              paddingRight: '16px',
              height: 'fit-content',
              maxHeight: '300px',
            }}
          >
            {verticalText(panelData.title)}
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {panelData.azimuth !== undefined && (
              <div
                style={{
                  fontFamily: "'KaiTi', 'STKaiti', serif",
                  color: '#d4af37',
                  fontSize: '14px',
                }}
              >
                <span style={{ marginRight: '8px' }}>方位角：</span>
                <span style={{ color: '#f5deb3' }}>{panelData.azimuth.toFixed(2)}°</span>
              </div>
            )}
            {panelData.elevation !== undefined && (
              <div
                style={{
                  fontFamily: "'KaiTi', 'STKaiti', serif",
                  color: '#d4af37',
                  fontSize: '14px',
                }}
              >
                <span style={{ marginRight: '8px' }}>仰角：</span>
                <span style={{ color: '#f5deb3' }}>{panelData.elevation.toFixed(2)}°</span>
              </div>
            )}

            <div
              style={{
                marginTop: '8px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(212, 175, 55, 0.3)',
              }}
            >
              <div
                style={{
                  fontFamily: "'KaiTi', 'STKaiti', serif",
                  color: '#f5deb3',
                  fontSize: '15px',
                  lineHeight: '1.8',
                  textIndent: '2em',
                }}
              >
                {panelData.description}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
          }}
        />
      </div>
    </div>
  );
}
