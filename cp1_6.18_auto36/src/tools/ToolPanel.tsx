import React from 'react';
import { useEditorStore } from '../store/useEditorStore';
import type { ToolType } from '../store/types';
import {
  Plus,
  MousePointer2,
  Move,
  Trash2,
  Play,
} from 'lucide-react';

const TOOLS: { type: ToolType; icon: React.ReactNode; label: string }[] = [
  { type: 'create', icon: <Plus size={18} />, label: '创建' },
  { type: 'select', icon: <MousePointer2 size={18} />, label: '选择' },
  { type: 'move', icon: <Move size={18} />, label: '移动' },
  { type: 'delete', icon: <Trash2 size={18} />, label: '删除' },
];

const PRESET_COLORS = [
  { color: '#FF6B6B', label: '红' },
  { color: '#FFA726', label: '橙' },
  { color: '#FFEB3B', label: '黄' },
  { color: '#66BB6A', label: '绿' },
  { color: '#42A5F5', label: '蓝' },
  { color: '#AB47BC', label: '紫' },
  { color: '#26C6DA', label: '青' },
];

export const ToolPanel: React.FC = () => {
  const {
    activeTool,
    setActiveTool,
    selectedParticleId,
    particles,
    updateParticle,
    isPreviewMode,
    setIsPreviewMode,
  } = useEditorStore();

  const selectedParticle = particles.find((p) => p.id === selectedParticleId);

  return (
    <div
      style={{
        position: 'absolute',
        left: 16,
        top: 16,
        bottom: 80,
        width: 240,
        background: 'rgba(26, 26, 46, 0.85)',
        backdropFilter: 'blur(10px)',
        borderRadius: 12,
        border: '1px solid #2E2E44',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid #2E2E44',
        }}
      >
        <span
          style={{
            color: '#00E5FF',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'monospace',
            letterSpacing: 1,
          }}
        >
          工具面板
        </span>
        <button
          onClick={() => setIsPreviewMode(true)}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: '#6C63FF',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.3s ease-in-out',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
          }}
          title="预览动画"
        >
          <Play size={18} />
        </button>
      </div>

      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #2E2E44',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
          }}
        >
          {TOOLS.map((tool) => (
            <button
              key={tool.type}
              onClick={() => setActiveTool(tool.type)}
              style={{
                padding: '8px 0',
                borderRadius: 8,
                border:
                  activeTool === tool.type
                    ? '1px solid #00E5FF'
                    : '1px solid #2E2E44',
                background:
                  activeTool === tool.type
                    ? 'rgba(0, 229, 255, 0.15)'
                    : 'rgba(46, 46, 68, 0.5)',
                color: activeTool === tool.type ? '#00E5FF' : '#8888AA',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                transition: 'all 0.3s ease-in-out',
              }}
              onMouseEnter={(e) => {
                if (activeTool !== tool.type) {
                  (e.currentTarget as HTMLElement).style.background =
                    'rgba(46, 46, 68, 0.8)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTool !== tool.type) {
                  (e.currentTarget as HTMLElement).style.background =
                    'rgba(46, 46, 68, 0.5)';
                }
              }}
            >
              {tool.icon}
              {tool.label}
            </button>
          ))}
        </div>
      </div>

      {selectedParticle && (
        <div
          style={{
            padding: '12px 16px',
            flex: 1,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              color: '#00E5FF',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'monospace',
              marginBottom: 12,
              letterSpacing: 0.5,
            }}
          >
            属性编辑
          </div>

          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                color: '#8888AA',
                fontSize: 11,
                display: 'block',
                marginBottom: 6,
              }}
            >
              颜色
            </label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PRESET_COLORS.map(({ color, label }) => (
                <button
                  key={color}
                  onClick={() => updateParticle(selectedParticle.id, { color })}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: color,
                    border:
                      selectedParticle.color === color
                        ? '2px solid #00E5FF'
                        : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease-in-out',
                    position: 'relative',
                  }}
                  title={label}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform =
                      'scale(1.15)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform =
                      'scale(1)';
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                color: '#8888AA',
                fontSize: 11,
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 6,
              }}
            >
              <span>透明度</span>
              <span style={{ color: '#00E5FF' }}>
                {selectedParticle.opacity.toFixed(1)}
              </span>
            </label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={selectedParticle.opacity}
              onChange={(e) =>
                updateParticle(selectedParticle.id, {
                  opacity: parseFloat(e.target.value),
                })
              }
              style={{
                width: '100%',
                accentColor: '#00E5FF',
              }}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                color: '#8888AA',
                fontSize: 11,
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 6,
              }}
            >
              <span>大小</span>
              <span style={{ color: '#00E5FF' }}>
                {selectedParticle.radius}px
              </span>
            </label>
            <input
              type="range"
              min="4"
              max="20"
              step="1"
              value={selectedParticle.radius}
              onChange={(e) =>
                updateParticle(selectedParticle.id, {
                  radius: parseInt(e.target.value),
                })
              }
              style={{
                width: '100%',
                accentColor: '#00E5FF',
              }}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                color: '#8888AA',
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
              }}
            >
              <div
                onClick={() =>
                  updateParticle(selectedParticle.id, {
                    glowEnabled: !selectedParticle.glowEnabled,
                  })
                }
                style={{
                  width: 36,
                  height: 20,
                  borderRadius: 10,
                  background: selectedParticle.glowEnabled
                    ? '#6C63FF'
                    : '#2E2E44',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background 0.3s ease-in-out',
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#fff',
                    position: 'absolute',
                    top: 2,
                    left: selectedParticle.glowEnabled ? 18 : 2,
                    transition: 'left 0.3s ease-in-out',
                  }}
                />
              </div>
              光晕效果
            </label>
          </div>

          <div
            style={{
              color: '#555577',
              fontSize: 10,
              fontFamily: 'monospace',
              marginTop: 8,
              lineHeight: 1.6,
            }}
          >
            <div>
              X: {selectedParticle.x.toFixed(1)} Y:{' '}
              {selectedParticle.y.toFixed(1)}
            </div>
          </div>
        </div>
      )}

      {!selectedParticle && (
        <div
          style={{
            padding: '20px 16px',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#555577',
            fontSize: 12,
            textAlign: 'center',
            lineHeight: 1.6,
          }}
        >
          选中光粒后可编辑属性
        </div>
      )}
    </div>
  );
};
