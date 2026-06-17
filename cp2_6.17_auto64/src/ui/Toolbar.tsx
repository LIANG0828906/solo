import React from 'react';
import { useEditorStore } from '../store/editorStore';
import { downloadJSON } from '../utils/modelExporter';
import { getMaterialById } from '../materials/materialStore';

const Toolbar: React.FC = () => {
  const {
    voxels,
    currentMaterial,
    showGrid,
    clearWorld,
    toggleGrid,
  } = useEditorStore();

  const material = getMaterialById(currentMaterial);

  const handleExport = () => {
    const now = new Date();
    const timestamp = `${now.getFullYear()}${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now
      .getHours()
      .toString()
      .padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
    downloadJSON(voxels, `voxelforge-${timestamp}.json`);
  };

  const handleClear = () => {
    if (window.confirm('确定要清空整个体素世界吗？此操作不可撤销。')) {
      clearWorld();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: '20px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '220px',
        backgroundColor: '#1E1E2E',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        zIndex: 100,
        border: '1px solid rgba(0, 229, 255, 0.15)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div
        style={{
          fontSize: '18px',
          fontWeight: 700,
          marginBottom: '20px',
          color: '#ffffff',
          textAlign: 'center',
          letterSpacing: '1px',
          background: 'linear-gradient(135deg, #00E5FF 0%, #7C4DFF 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        VoxelForge
      </div>

      <button
        onClick={handleClear}
        style={{
          width: '100%',
          padding: '12px 16px',
          marginBottom: '12px',
          backgroundColor: '#E74C3C',
          color: '#ffffff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 12px rgba(231, 76, 60, 0.3)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#EC7063';
          e.currentTarget.style.boxShadow = '0 0 0 2px #00E5FF, 0 4px 16px rgba(231, 76, 60, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#E74C3C';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(231, 76, 60, 0.3)';
        }}
      >
        🗑️ 清空世界
      </button>

      <button
        onClick={handleExport}
        style={{
          width: '100%',
          padding: '12px 16px',
          marginBottom: '20px',
          backgroundColor: '#3498DB',
          color: '#ffffff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#5DADE2';
          e.currentTarget.style.boxShadow = '0 0 0 2px #00E5FF, 0 4px 16px rgba(52, 152, 219, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#3498DB';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(52, 152, 219, 0.3)';
        }}
      >
        📦 导出 JSON
      </button>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          padding: '10px 0',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <span style={{ fontSize: '13px', color: '#B0B0C0' }}>网格辅助</span>
        <div
          onClick={toggleGrid}
          style={{
            position: 'relative',
            width: '44px',
            height: '24px',
            borderRadius: '12px',
            backgroundColor: showGrid ? '#2ECC71' : '#3A3A4A',
            cursor: 'pointer',
            transition: 'background-color 0.25s ease',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '2px',
              left: showGrid ? '22px' : '2px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              transition: 'left 0.25s ease',
            }}
          />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '12px', color: '#808090', marginBottom: '10px', letterSpacing: '0.5px' }}>
          当前材质
        </div>
        <div
          style={{
            width: '50px',
            height: '50px',
            margin: '0 auto',
            borderRadius: '8px',
            backgroundColor: material.color,
            border: material.emissive
              ? `2px solid ${material.color}`
              : '2px solid rgba(255,255,255,0.2)',
            boxShadow: material.emissive
              ? `0 0 16px ${material.color}, 0 0 4px ${material.color}`
              : '0 4px 12px rgba(0,0,0,0.3)',
            animation: 'pulseScale 0.5s ease-in-out infinite',
          }}
        />
        <div
          style={{
            marginTop: '8px',
            fontSize: '13px',
            color: '#ffffff',
            fontWeight: 500,
          }}
        >
          {material.name}
        </div>
      </div>

      <div
        style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          fontSize: '11px',
          color: '#606070',
          lineHeight: '1.6',
        }}
      >
        <div>左键：放置体素</div>
        <div>右键：删除体素</div>
        <div>拖拽：旋转视角</div>
        <div>滚轮：缩放视图</div>
      </div>

      <style>{`
        @keyframes pulseScale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};

export default Toolbar;
