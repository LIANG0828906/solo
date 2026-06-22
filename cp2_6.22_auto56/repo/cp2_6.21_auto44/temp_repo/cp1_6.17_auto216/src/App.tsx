import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useColorBoardStore } from './store';
import ColorWheel from './ColorWheel';
import ColorBlock from './ColorBlock';
import PreviewPanel from './PreviewPanel';

const App: React.FC = () => {
  const { colors, addColor, setIsMobile, ui } = useColorBoardStore();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const workspaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsMobile]);

  const handleColorSelect = useCallback(
    (color: string) => {
      addColor(color);
    },
    [addColor]
  );

  const handleWorkspaceDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const colorData = e.dataTransfer.getData('color');
      if (colorData) {
        addColor(colorData);
      }
    },
    [addColor]
  );

  const handleWorkspaceDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const isMobile = ui.isMobile;

  const colorWheelSection = (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: isMobile ? 0 : 12,
        boxShadow: isMobile ? 'none' : '0 2px 8px rgba(0,0,0,0.06)',
        transition: 'all 0.3s ease-in-out',
        overflow: isMobile ? 'auto' : 'hidden',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 16,
          padding: isMobile ? '8px 16px' : 0,
          minWidth: isMobile ? 'max-content' : undefined,
        }}
      >
        <ColorWheel onColorSelect={handleColorSelect} />
      </div>
    </div>
  );

  const workspaceSection = (
    <div
      ref={workspaceRef}
      onDrop={handleWorkspaceDrop}
      onDragOver={handleWorkspaceDragOver}
      style={{
        flex: 1,
        backgroundColor: '#F5F5F7',
        padding: 32,
        overflowY: 'auto',
        minHeight: isMobile ? undefined : '100%',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 24 }}>
        工作区 - 拖入色块或点击色轮添加
      </div>
      {colors.length === 0 ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 200,
            border: '2px dashed #D1D5DB',
            borderRadius: 12,
            fontSize: 14,
            color: '#9CA3AF',
          }}
        >
          从左侧拖入色块开始设计
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? windowWidth < 480
                ? 'repeat(1, auto)'
                : 'repeat(2, auto)'
              : 'repeat(auto-fill, minmax(80px, 1fr))',
            gap: 12,
            justifyItems: 'center',
            justifyContent: isMobile ? 'space-around' : 'flex-start',
          }}
        >
          {colors.map((colorItem, index) => (
            <ColorBlock key={colorItem.id} colorItem={colorItem} index={index} />
          ))}
        </div>
      )}
    </div>
  );

  const previewSection = (
    <div
      style={{
        width: isMobile ? '100%' : 280,
        backgroundColor: '#F9FAFB',
        flexShrink: 0,
        borderLeft: isMobile ? 'none' : '1px solid #E5E7EB',
        borderTop: isMobile ? '1px solid #E5E7EB' : 'none',
        transition: 'all 0.3s ease-in-out',
        maxHeight: isMobile ? '50vh' : undefined,
      }}
    >
      <PreviewPanel />
    </div>
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        height: '100vh',
        width: '100%',
        backgroundColor: '#F5F5F7',
        transition: 'flex-direction 0.3s ease-in-out',
      }}
    >
      {isMobile ? (
        <>
          <div
            style={{
              height: 80,
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderBottom: '1px solid #E5E7EB',
              overflowX: 'auto',
              overflowY: 'hidden',
              transition: 'all 0.3s ease-in-out',
              flexShrink: 0,
            }}
          >
            {colorWheelSection}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {workspaceSection}
          </div>
          {previewSection}
        </>
      ) : (
        <>
          <div style={{ width: 260, flexShrink: 0, padding: 16 }}>{colorWheelSection}</div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>{workspaceSection}</div>
          {previewSection}
        </>
      )}
    </div>
  );
};

export default App;
