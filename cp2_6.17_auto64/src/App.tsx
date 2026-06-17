import React, { useState, useEffect } from 'react';
import VoxelWorld from './scene/VoxelWorld';
import Toolbar from './ui/Toolbar';
import MaterialPanel from './ui/MaterialPanel';

const App: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <div style={{ width: '100%', height: 'calc(100% - 80px)' }}>
          <VoxelWorld />
        </div>
        <MobileBottomBar />
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <VoxelWorld />
      <Toolbar />
      <MaterialPanel />
    </div>
  );
};

const MobileBottomBar: React.FC = () => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '80px',
        backgroundColor: 'rgba(30, 30, 46, 0.95)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(0, 229, 255, 0.15)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: '10px',
        zIndex: 100,
        overflowX: 'auto',
      }}
    >
      <MobileToolbarCompact />
      <MobileMaterialScroll />
    </div>
  );
};

import { useEditorStore } from './store/editorStore';
import { downloadJSON } from './utils/modelExporter';
import { getMaterialById, MATERIALS } from './materials/materialStore';

const MobileToolbarCompact: React.FC = () => {
  const { voxels, showGrid, clearWorld, toggleGrid } = useEditorStore();
  const currentMaterial = useEditorStore((s) => s.currentMaterial);
  const material = getMaterialById(currentMaterial);

  const handleExport = () => {
    const now = new Date();
    const timestamp = `${now.getFullYear()}${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    downloadJSON(voxels, `voxelforge-${timestamp}.json`);
  };

  const btnStyle: React.CSSProperties = {
    flexShrink: 0,
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <>
      <button
        onClick={() => {
          if (window.confirm('清空世界？')) clearWorld();
        }}
        style={{ ...btnStyle, backgroundColor: '#E74C3C', color: '#fff' }}
      >
        🗑️
      </button>
      <button
        onClick={handleExport}
        style={{ ...btnStyle, backgroundColor: '#3498DB', color: '#fff' }}
      >
        📦
      </button>
      <button
        onClick={toggleGrid}
        style={{
          ...btnStyle,
          backgroundColor: showGrid ? '#2ECC71' : '#3A3A4A',
          color: '#fff',
        }}
      >
        🔲
      </button>
      <div
        style={{
          flexShrink: 0,
          width: '44px',
          height: '44px',
          borderRadius: '10px',
          backgroundColor: material.color,
          boxShadow: material.emissive
            ? `0 0 12px ${material.color}`
            : '0 2px 8px rgba(0,0,0,0.3)',
          animation: 'pulseScale 0.5s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes pulseScale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </>
  );
};

const MobileMaterialScroll: React.FC = () => {
  const { currentMaterial, setMaterial } = useEditorStore();

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        padding: '4px 0',
        flex: 1,
        scrollbarWidth: 'none',
      }}
    >
      {MATERIALS.map((mat) => {
        const isSelected = currentMaterial === mat.id;
        return (
          <div
            key={mat.id}
            onClick={() => setMaterial(mat.id)}
            style={{
              flexShrink: 0,
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: mat.color,
              cursor: 'pointer',
              boxShadow: isSelected
                ? `0 0 0 2px #fff, 0 0 10px ${mat.color}`
                : '0 2px 6px rgba(0,0,0,0.3)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {mat.emissive && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '10px',
                  boxShadow: `inset 0 0 12px ${mat.emissive}`,
                  opacity: 0.5,
                }}
              />
            )}
            <span
              style={{
                position: 'absolute',
                bottom: '2px',
                left: 0,
                right: 0,
                textAlign: 'center',
                fontSize: '9px',
                color: parseInt(mat.color.slice(1), 16) > 0xaaaaaa
                  ? '#202030'
                  : '#fff',
                fontWeight: 600,
              }}
            >
              {mat.name}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default App;
