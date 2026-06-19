import React from 'react';
import { FURNITURE_CATALOG, FurnitureType } from '../types';
import { useSceneStore } from '../store/sceneStore';

interface FurnitureCardProps {
  type: FurnitureType;
  name: string;
  color: string;
  onDragStart: (e: React.DragEvent, type: FurnitureType) => void;
}

const FurnitureCard: React.FC<FurnitureCardProps> = ({ type, name, color, onDragStart }) => {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, type)}
      style={{
        background: '#FFFFFF',
        borderRadius: '8px',
        padding: '12px',
        cursor: 'grab',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        border: '1px solid #E5E5E5',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          backgroundColor: color,
          borderRadius: 6,
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
        }}
      />
      <span style={{ fontSize: '12px', color: '#333', fontWeight: 500 }}>{name}</span>
    </div>
  );
};

const Sidebar: React.FC = () => {
  const resetCamera = useSceneStore((s) => s.resetCamera);
  const exportToOBJ = useSceneStore((s) => s.exportToOBJ);

  const handleDragStart = (e: React.DragEvent, type: FurnitureType) => {
    e.dataTransfer.setData('furnitureType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleExport = () => {
    const objContent = exportToOBJ();
    const blob = new Blob([objContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scene_${Date.now()}.obj`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
  };

  return (
    <div
      style={{
        width: 220,
        height: '100vh',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #E5E5E5',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '20px 16px', borderBottom: '1px solid #F0F0F0' }}>
        <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#333' }}>家具库</h1>
        <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#999' }}>拖拽家具到场景中</p>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          alignContent: 'start',
        }}
      >
        {FURNITURE_CATALOG.map((item) => (
          <FurnitureCard
            key={item.type}
            type={item.type}
            name={item.name}
            color={item.color}
            onDragStart={handleDragStart}
          />
        ))}
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid #F0F0F0' }}>
        <button
          onClick={resetCamera}
          style={{
            ...buttonStyle,
            backgroundColor: '#9DBEB6',
            color: '#FFFFFF',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.9')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
        >
          重置视角
        </button>
        <button
          onClick={handleExport}
          style={{
            ...buttonStyle,
            backgroundColor: '#D4A574',
            color: '#FFFFFF',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.9')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
        >
          导出为OBJ
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
