import { useEffect, useState } from 'react';
import { GalleryCanvas } from './components/GalleryCanvas';
import { SidePanel } from './components/SidePanel';
import { useGalleryStore } from './store';

function App() {
  const {
    initArtworks,
    artworks,
    selectedId,
    mouseCoords,
    undo,
    redo,
  } = useGalleryStore();

  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    initArtworks();
  }, [initArtworks]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const selectedIndex = selectedId
    ? artworks.findIndex((a) => a.id === selectedId) + 1
    : null;

  const mainContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        margin: 0,
        padding: 0,
        fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <header
        style={{
          height: '50px',
          backgroundColor: '#2C2C2C',
          color: '#FFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          boxSizing: 'border-box',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: '18px',
            fontWeight: 600,
            letterSpacing: '0.5px',
            fontFamily: "'Georgia', serif",
          }}
        >
          虚拟画廊策展空间
        </div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <div style={{ fontSize: '13px', color: '#AAA' }}>
            画作总数: <span style={{ color: '#FFF', fontWeight: 600 }}>{artworks.length}</span>
          </div>
          <div style={{ fontSize: '13px', color: '#AAA' }}>
            选中: <span style={{ color: '#FFF', fontWeight: 600 }}>{selectedIndex ? `#${selectedIndex}` : '无'}</span>
          </div>
          {isMobile && (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#444',
                color: '#FFF',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              {isSidebarOpen ? '隐藏面板' : '显示面板'}
            </button>
          )}
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <main style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
          <GalleryCanvas />
        </main>

        {!isMobile && <SidePanel />}
      </div>

      {isMobile && isSidebarOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            maxHeight: '50vh',
            backgroundColor: '#FAFAFA',
            borderTop: '1px solid #E0E0E0',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
          }}
        >
          <SidePanel />
        </div>
      )}

      <footer
        style={{
          height: '50px',
          backgroundColor: '#E0E0E0',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          fontSize: '13px',
          color: '#666',
          flexShrink: 0,
          borderTop: '1px solid #DDD',
        }}
      >
        <span>
          鼠标坐标: <span style={{ fontWeight: 600, color: '#333' }}>X: {mouseCoords.x}</span>,{' '}
          <span style={{ fontWeight: 600, color: '#333' }}>Y: {mouseCoords.y}</span>
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#999' }}>
          拖拽画作排列 · 点击选中编辑 · Ctrl+Z 撤销 · Ctrl+Y 重做
        </span>
      </footer>
    </div>
  );

  return mainContent;
}

export default App;
