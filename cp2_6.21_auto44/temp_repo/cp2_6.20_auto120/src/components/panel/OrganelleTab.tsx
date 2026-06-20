import React, { useState } from 'react';
import { Settings, Palette, Move, ChevronDown, ChevronUp } from 'lucide-react';
import { useSceneStore } from '@/store/sceneStore';
import { Slider } from './Slider';
import { organelleDefaultColors } from '@/constants/presets';
import type { Organelle, OrganelleType } from '@/types';

const organelleTypeLabels: Record<OrganelleType, string> = {
  nucleus: '细胞核',
  mitochondria: '线粒体',
  er: '内质网',
};

interface OrganelleEditorProps {
  organelle: Organelle;
  index: number;
}

const OrganelleEditor: React.FC<OrganelleEditorProps> = ({ organelle, index }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const updateOrganelle = useSceneStore((s) => s.updateOrganelle);

  const handlePositionChange = (axis: number, value: number) => {
    const newPosition: [number, number, number] = [...organelle.position] as [number, number, number];
    newPosition[axis] = value;
    updateOrganelle(organelle.id, { position: newPosition });
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateOrganelle(organelle.id, { color: e.target.value });
  };

  const handleResetColor = () => {
    updateOrganelle(organelle.id, { color: organelleDefaultColors[organelle.type] });
  };

  return (
    <div
      className="organelle-card"
      style={{
        marginBottom: '12px',
        background: 'rgba(255, 255, 255, 0.04)',
        border: `1px solid ${organelle.color}33`,
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
      }}
    >
      <div
        className="organelle-card-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 14px',
          background: `linear-gradient(90deg, ${organelle.color}15, transparent)`,
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: organelle.color,
              boxShadow: `0 0 8px ${organelle.color}`,
            }}
          />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>
            {organelleTypeLabels[organelle.type]} {index + 1}
          </span>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
            ({organelle.position[0].toFixed(1)}, {organelle.position[1].toFixed(1)},{' '}
            {organelle.position[2].toFixed(1)})
          </span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.5)' }}>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {isExpanded && (
        <div style={{ padding: '14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="section-title" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Move size={14} />
            位置调整
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#ff6b6b', minWidth: '18px' }}>X</span>
              <div style={{ flex: 1 }}>
                <Slider
                  label=""
                  value={organelle.position[0]}
                  min={-4.5}
                  max={4.5}
                  step={0.1}
                  onChange={(v) => handlePositionChange(0, v)}
                />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#6bff6b', minWidth: '18px' }}>Y</span>
              <div style={{ flex: 1 }}>
                <Slider
                  label=""
                  value={organelle.position[1]}
                  min={-4.5}
                  max={4.5}
                  step={0.1}
                  onChange={(v) => handlePositionChange(1, v)}
                />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b8bff', minWidth: '18px' }}>Z</span>
              <div style={{ flex: 1 }}>
                <Slider
                  label=""
                  value={organelle.position[2]}
                  min={-4.5}
                  max={4.5}
                  step={0.1}
                  onChange={(v) => handlePositionChange(2, v)}
                />
              </div>
            </div>
          </div>

          <div className="section-title" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Palette size={14} />
            颜色设置
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative', width: '48px', height: '32px' }}>
              <input
                type="color"
                value={organelle.color}
                onChange={handleColorChange}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                }}
              />
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '8px',
                  background: organelle.color,
                  border: '2px solid rgba(255,255,255,0.2)',
                  boxShadow: `0 2px 8px ${organelle.color}40`,
                  pointerEvents: 'none',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                }}
              >
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>当前颜色</span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
                  {organelle.color.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {Object.entries(organelleDefaultColors).map(([type, color]) => (
                  <div
                    key={type}
                    onClick={() => updateOrganelle(organelle.id, { color })}
                    title={`默认${organelleTypeLabels[type as OrganelleType]}色`}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: color,
                      cursor: 'pointer',
                      border: organelle.color === color ? '2px solid white' : '2px solid transparent',
                      transition: 'transform 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  />
                ))}
                <button
                  onClick={handleResetColor}
                  style={{
                    marginLeft: 'auto',
                    padding: '4px 10px',
                    fontSize: '11px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: 'rgba(255,255,255,0.7)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  }}
                >
                  重置
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const OrganelleTab: React.FC = () => {
  const organelles = useSceneStore((s) => s.organelles);

  return (
    <div className="organelle-section">
      <div
        className="section-title"
        style={{
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <Settings size={14} />
        细胞器编辑器
      </div>
      <div style={{ marginBottom: '12px', fontSize: '11px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
        调整细胞器的三维坐标和颜色。场景中的坐标轴指示器可帮助您定位。
      </div>

      {organelles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Settings size={32} />
          </div>
          暂无细胞器数据，请先选择细胞预设
        </div>
      ) : (
        organelles.map((organelle, index) => (
          <OrganelleEditor key={organelle.id} organelle={organelle} index={index} />
        ))
      )}

      <div
        style={{
          marginTop: '16px',
          padding: '12px',
          background: 'rgba(124, 58, 237, 0.1)',
          border: '1px solid rgba(124, 58, 237, 0.3)',
          borderRadius: '10px',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.6)',
          lineHeight: 1.6,
        }}
      >
        <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '4px' }}>💡 提示</div>
        <div>• 3D场景中红色 = X轴，绿色 = Y轴，蓝色 = Z轴</div>
        <div>• 所有调整会实时同步到3D场景</div>
        <div>• 颜色更改会影响细胞器主体及高光效果</div>
      </div>
    </div>
  );
};

export default OrganelleTab;
