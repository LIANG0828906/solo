import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { ScrollRenderer } from './renderer/scrollRenderer';
import { SearchPanel } from './ui/SearchPanel';
import { SnapshotDetail } from './ui/SnapshotDetail';
import { Snapshot } from './stores/snapshotStore';

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<ScrollRenderer | null>(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);
  const [isSearchPanelVisible, setIsSearchPanelVisible] = useState(false);
  const cameraPositionRef = useRef({ z: 5 });

  useEffect(() => {
    if (!containerRef.current) return;

    const handleFrameClick = (snapshot: Snapshot) => {
      setSelectedSnapshot(snapshot);
    };

    const renderer = new ScrollRenderer(containerRef.current, handleFrameClick);
    renderer.start();
    rendererRef.current = renderer;

    const checkPosition = () => {
      if (rendererRef.current) {
        const pos = rendererRef.current.getCameraPosition();
        cameraPositionRef.current.z = pos.z;
        
        if (pos.z <= -20 && !isSearchPanelVisible) {
          setIsSearchPanelVisible(true);
        } else if (pos.z > -18 && isSearchPanelVisible) {
          setIsSearchPanelVisible(false);
        }
      }
      requestAnimationFrame(checkPosition);
    };
    checkPosition();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        setSelectedSnapshot(null);
      }
      if (e.code === 'KeyF' && !e.ctrlKey) {
        e.preventDefault();
        setIsSearchPanelVisible((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      renderer.dispose();
      const domElement = renderer.getDomElement();
      if (containerRef.current && domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(domElement);
      }
    };
  }, []);

  const handleSearchPanelSnapshotClick = (snapshot: Snapshot) => {
    setSelectedSnapshot(snapshot);
    setIsSearchPanelVisible(false);
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
      />

      <div
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '13px',
          lineHeight: '1.8',
          pointerEvents: 'none',
          zIndex: 100,
          background: 'rgba(10, 10, 20, 0.6)',
          padding: '12px 16px',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(108, 99, 255, 0.2)',
        }}
      >
        <div style={{ color: '#6C63FF', fontWeight: 600, marginBottom: '4px' }}>
          网页记忆回廊
        </div>
        <div>WASD 移动 · 鼠标拖动 旋转视角</div>
        <div>点击画框 查看详情 · Ctrl+F 搜索</div>
        <div style={{ marginTop: '8px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>
          走到走廊尽头开启搜索面板
        </div>
      </div>

      <SearchPanel
        isVisible={isSearchPanelVisible}
        onSnapshotClick={handleSearchPanelSnapshotClick}
      />

      <SnapshotDetail
        snapshot={selectedSnapshot}
        onClose={() => setSelectedSnapshot(null)}
      />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
