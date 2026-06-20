import React, { useState } from 'react';
import { Pencil, Eraser, Type, Trash2, MousePointer } from 'lucide-react';
import { useCanvasStore, PRESET_COLORS } from '../store/canvasStore';
import type { ToolType } from '../store/canvasStore';

const ToolBar: React.FC = () => {
  const { currentTool, currentColor, setTool, setColor } = useCanvasStore();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [animatingColor, setAnimatingColor] = useState<string | null>(null);

  const tools: { id: ToolType; icon: React.ReactNode; label: string }[] = [
    { id: 'select', icon: <MousePointer size={20} />, label: '选择' },
    { id: 'pen', icon: <Pencil size={20} />, label: '画笔' },
    { id: 'eraser', icon: <Eraser size={20} />, label: '橡皮' },
    { id: 'text', icon: <Type size={20} />, label: '文本' },
    { id: 'delete', icon: <Trash2 size={20} />, label: '删除' },
  ];

  const handleToolClick = (tool: ToolType) => {
    setTool(tool);
    if (tool === 'pen') {
      setShowColorPicker(true);
    } else {
      setShowColorPicker(false);
    }
  };

  const handleColorClick = (color: string) => {
    setColor(color);
    setAnimatingColor(color);
    setTimeout(() => setAnimatingColor(null), 300);
  };

  return (
    <>
      <style>{`
        .toolbar-container {
          position: fixed;
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
          background: #ffffff;
          border-radius: 16px;
          padding: 12px 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          gap: 8px;
          z-index: 100;
        }

        .tool-btn {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          border: none;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          color: #64748b;
        }

        .tool-btn:hover {
          background: #f1f5f9;
          transform: translateY(-5px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .tool-btn.active {
          background: #3b82f6;
          color: #ffffff;
        }

        .tool-btn.active:hover {
          background: #2563eb;
        }

        .color-picker-wrapper {
          padding: 4px;
          border-top: 1px solid #e2e8f0;
          margin-top: 4px;
        }

        .color-picker {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          padding: 4px;
        }

        .color-swatch {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 3px solid transparent;
          cursor: pointer;
          transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .color-swatch:hover {
          transform: scale(1.1);
        }

        .color-swatch.selected {
          border-color: #1e293b;
        }

        .color-swatch.animating {
          animation: bounce 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        @keyframes bounce {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }

        .current-color-preview {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          margin-top: 4px;
          border: 2px solid #e2e8f0;
        }

        @media (max-width: 1280px) {
          .toolbar-container {
            left: 50%;
            top: auto;
            bottom: 20px;
            transform: translateX(-50%);
            flex-direction: row;
            padding: 8px 16px;
            gap: 4px;
          }

          .color-picker-wrapper {
            border-top: none;
            border-left: 1px solid #e2e8f0;
            margin-top: 0;
            margin-left: 8px;
            padding-left: 12px;
          }

          .color-picker {
            grid-template-columns: repeat(6, 1fr);
            grid-template-rows: repeat(2, 1fr);
          }
        }
      `}</style>

      <div className="toolbar-container">
        {tools.map((tool) => (
          <button
            key={tool.id}
            className={`tool-btn ${currentTool === tool.id ? 'active' : ''}`}
            onClick={() => handleToolClick(tool.id)}
            title={tool.label}
          >
            {tool.icon}
          </button>
        ))}

        {showColorPicker && (
          <div className="color-picker-wrapper">
            <div className="color-picker">
              {PRESET_COLORS.map((color) => (
                <div
                  key={color}
                  className={`color-swatch ${currentColor === color ? 'selected' : ''} ${animatingColor === color ? 'animating' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorClick(color)}
                />
              ))}
            </div>
            <div
              className="current-color-preview"
              style={{ backgroundColor: currentColor }}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default ToolBar;
