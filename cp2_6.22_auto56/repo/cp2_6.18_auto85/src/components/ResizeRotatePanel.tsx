import React from 'react';
import { useExhibitionStore } from '@/store/useExhibitionStore';
import { WorkMaterial, WallPlacement } from '@/types';

interface ResizeRotatePanelProps {
  work: WorkMaterial;
  placement: WallPlacement;
}

const MIN_WIDTH_PX = 300;
const MAX_WIDTH_PX = 1200;
const BASE_SCALE_AT_600PX = 1;

export const ResizeRotatePanel: React.FC<ResizeRotatePanelProps> = ({ work, placement }) => {
  const { updateWorkPlacement, removeWorkFromWall } = useExhibitionStore();

  const aspectRatio = work.originalWidth / work.originalHeight;
  const baseWidthPx = 600;
  const currentWidthPx = baseWidthPx * placement.scale;
  const clampedWidthPx = Math.max(MIN_WIDTH_PX, Math.min(MAX_WIDTH_PX, currentWidthPx));
  const currentHeightPx = clampedWidthPx / aspectRatio;

  const handleWidthChange = (px: number) => {
    const clamped = Math.max(MIN_WIDTH_PX, Math.min(MAX_WIDTH_PX, px));
    const newScale = clamped / baseWidthPx;
    updateWorkPlacement(work.id, { scale: newScale });
  };

  const handleRotate = (direction: number) => {
    const currentDeg = (placement.rotation * 180) / Math.PI;
    const newDeg = currentDeg + direction * 15;
    const newRad = (newDeg * Math.PI) / 180;
    updateWorkPlacement(work.id, { rotation: newRad });
  };

  const handleReset = () => {
    updateWorkPlacement(work.id, { scale: 1, rotation: 0 });
  };

  const rotationDeg = Math.round((placement.rotation * 180) / Math.PI);

  return (
    <div
      style={{
        position: 'absolute',
        right: 20,
        top: 80,
        background: 'rgba(30, 41, 59, 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid #475569',
        borderRadius: 14,
        padding: 20,
        width: 280,
        zIndex: 50,
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#F8FAFC' }}>作品属性调整</h4>
        <button
          onClick={() => updateWorkPlacement(work.id, {})}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            fontSize: 18,
            padding: 2,
            lineHeight: 1,
          }}
          onClickCapture={(e) => {
            e.stopPropagation();
          }}
        >
          <span onClick={() => removeWorkFromWall(work.id)} style={{ display: 'inline-block' }}>
            ×
          </span>
        </button>
      </div>

      <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 6, fontWeight: 500 }}>
        {work.title || '未命名作品'}
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
          <span style={{ color: '#94A3B8' }}>尺寸 (等比缩放)</span>
          <span style={{ color: '#A3E635', fontWeight: 600 }}>
            {Math.round(clampedWidthPx)} × {Math.round(currentHeightPx)} px
          </span>
        </div>
        <input
          type="range"
          min={MIN_WIDTH_PX}
          max={MAX_WIDTH_PX}
          step={10}
          value={clampedWidthPx}
          onChange={(e) => handleWidthChange(Number(e.target.value))}
          style={{
            width: '100%',
            height: 6,
            borderRadius: 3,
            accentColor: '#A3E635',
            cursor: 'pointer',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748B', marginTop: 4 }}>
          <span>300px</span>
          <span>1200px</span>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
          <span style={{ color: '#94A3B8' }}>旋转角度</span>
          <span style={{ color: '#A3E635', fontWeight: 600 }}>{rotationDeg}°</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => handleRotate(-1)}
            className="btn-secondary"
            style={{ flex: 1, padding: '8px 10px', fontSize: 12 }}
          >
            ↺ 逆时针
          </button>
          <button
            onClick={() => handleRotate(1)}
            className="btn-secondary"
            style={{ flex: 1, padding: '8px 10px', fontSize: 12 }}
          >
            顺时针 ↻
          </button>
        </div>
        <div style={{ fontSize: 10, color: '#64748B', marginTop: 6, textAlign: 'center' }}>
          步长：15°
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleReset}
          className="btn-secondary"
          style={{ flex: 1, padding: '8px 10px', fontSize: 12 }}
        >
          重置
        </button>
        <button
          onClick={() => removeWorkFromWall(work.id)}
          style={{
            flex: 1,
            padding: '8px 10px',
            fontSize: 12,
            borderRadius: 8,
            border: '1px solid rgba(239, 68, 68, 0.3)',
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#F87171',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239, 68, 68, 0.2)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239, 68, 68, 0.1)';
          }}
        >
          从墙面移除
        </button>
      </div>
    </div>
  );
};
