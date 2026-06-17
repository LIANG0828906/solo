import React from 'react';
import { useGalleryStore, ToolMode, BrushType } from '@/store';
import { COLORS, ANIMATION } from '@/shared/styles';
import { Paintbrush, Eraser, MousePointer2, Square, Circle } from 'lucide-react';

const toolButtons: { mode: ToolMode; label: string; icon: React.ReactNode }[] = [
  { mode: 'brush', label: '画笔', icon: <Paintbrush size={18} /> },
  { mode: 'eraser', label: '橡皮', icon: <Eraser size={18} /> },
  { mode: 'select', label: '选择', icon: <MousePointer2 size={18} /> },
];

const brushButtons: { type: BrushType; label: string; icon: React.ReactNode }[] = [
  { type: 'wall', label: '展墙', icon: <Square size={16} /> },
  { type: 'platform', label: '展台', icon: <Circle size={16} /> },
];

export default function EditToolbar() {
  const toolMode = useGalleryStore((s) => s.toolMode);
  const brushType = useGalleryStore((s) => s.brushType);
  const setToolMode = useGalleryStore((s) => s.setToolMode);
  const setBrushType = useGalleryStore((s) => s.setBrushType);

  return (
    <div className="edit-toolbar">
      <div className="toolbar-section">
        <span className="toolbar-label">工具</span>
        <div className="toolbar-buttons">
          {toolButtons.map(({ mode, label, icon }) => (
            <button
              key={mode}
              className={`toolbar-btn ${toolMode === mode ? 'active' : ''}`}
              onClick={() => setToolMode(mode)}
              title={label}
            >
              {icon}
              <span className="btn-label">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {toolMode === 'brush' && (
        <div className="toolbar-section">
          <span className="toolbar-label">画笔类型</span>
          <div className="toolbar-buttons">
            {brushButtons.map(({ type, label, icon }) => (
              <button
                key={type}
                className={`toolbar-btn brush-type ${brushType === type ? 'active' : ''}`}
                onClick={() => setBrushType(type)}
                title={label}
              >
                {icon}
                <span className="btn-label">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .edit-toolbar {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 8px 16px;
          background: ${COLORS.cardBg};
          border-bottom: 1px solid ${COLORS.modalBorder};
          flex-shrink: 0;
        }
        .toolbar-section {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .toolbar-label {
          font-size: 12px;
          color: ${COLORS.textSecondary};
          white-space: nowrap;
        }
        .toolbar-buttons {
          display: flex;
          gap: 6px;
        }
        .toolbar-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border: none;
          border-radius: 8px;
          background: ${COLORS.success};
          color: ${COLORS.background};
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: transform ${ANIMATION.hoverTransition}s, background ${ANIMATION.hoverTransition}s;
        }
        .toolbar-btn:hover {
          transform: translateY(${ANIMATION.hoverLift}px);
        }
        .toolbar-btn.active {
          background: ${COLORS.highlight};
        }
        .toolbar-btn.brush-type {
          padding: 6px 10px;
          font-size: 12px;
        }
        .btn-label {
          font-size: 12px;
        }
        @media (max-width: 768px) {
          .edit-toolbar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 60px;
            justify-content: center;
            z-index: 100;
            flex-wrap: nowrap;
            gap: 12px;
          }
          .toolbar-label {
            display: none;
          }
          .btn-label {
            display: none;
          }
          .toolbar-btn {
            padding: 10px;
          }
        }
      `}</style>
    </div>
  );
}
