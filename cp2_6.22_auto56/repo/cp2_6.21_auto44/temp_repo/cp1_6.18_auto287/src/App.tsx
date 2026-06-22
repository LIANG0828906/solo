import { useState, useCallback, useEffect, useRef } from 'react';
import CardPool from './components/CardPool';
import StoryEditor from './components/StoryEditor';

export default function App() {
  const [panelWidth, setPanelWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMobile) return;
    e.preventDefault();
    setIsResizing(true);
  }, [isMobile]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - rect.left;
      setPanelWidth(Math.min(600, Math.max(200, newWidth)));
    };

    const handleMouseUp = () => setIsResizing(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        background: '#0F3460',
        userSelect: isResizing ? 'none' : 'auto',
      }}
    >
      {isMobile && (
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 1000,
            width: 44,
            height: 44,
            borderRadius: 8,
            background: '#1A1A2E',
            border: '1px solid #E94560',
            color: '#E0E0E0',
            fontSize: 20,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
          }}
        >
          ☰
        </button>
      )}

      {(!isMobile || isMenuOpen) && (
        <div
          style={{
            width: isMobile ? '100%' : panelWidth,
            minWidth: isMobile ? '100%' : 0,
            flexShrink: 0,
            position: isMobile ? 'fixed' : 'relative',
            top: 0,
            left: 0,
            height: '100%',
            zIndex: isMobile ? 999 : 1,
            transition: isMobile ? 'transform 0.3s ease' : 'none',
            transform: isMobile && !isMenuOpen ? 'translateX(-100%)' : 'translateX(0)',
          }}
        >
          <CardPool onMobileClose={() => setIsMenuOpen(false)} isMobile={isMobile} />
        </div>
      )}

      {!isMobile && (
        <div
          onMouseDown={handleMouseDown}
          style={{
            width: 4,
            cursor: isResizing ? 'col-resize' : 'col-resize',
            background: isResizing ? '#E94560' : 'linear-gradient(180deg, #1A1A2E, #0F3460)',
            flexShrink: 0,
            transition: 'background 0.2s',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 2,
              height: 40,
              borderRadius: 1,
              background: '#533483',
            }}
          />
        </div>
      )}

      <div
        style={{
          flex: 1,
          height: '100%',
          minWidth: 0,
        }}
      >
        <StoryEditor />
      </div>

      {isMobile && isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 998,
          }}
        />
      )}
    </div>
  );
}
