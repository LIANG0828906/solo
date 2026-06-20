import React from 'react';
import { ToolMode, COLORS } from '../../types';
import { recorder } from '../recording/Recorder';

interface ToolbarProps {
  tool: ToolMode;
  onToolChange: (tool: ToolMode) => void;
  penColor: string;
  onPenColorChange: (color: string) => void;
  penWidth: number;
  onPenWidthChange: (width: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUploadImage: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  tool,
  onToolChange,
  penColor,
  onPenColorChange,
  penWidth,
  onPenWidthChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onUploadImage,
}) => {
  const [showColorPanel, setShowColorPanel] = React.useState(false);
  const [showWidthSlider, setShowWidthSlider] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);

  const toggleRecording = () => {
    if (isRecording) {
      recorder.downloadJSON();
      setIsRecording(false);
    } else {
      recorder.start();
      setIsRecording(true);
    }
  };

  const tools: { mode: ToolMode; label: string; icon: JSX.Element }[] = [
    {
      mode: 'pen',
      label: '画笔',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          <path d="M2 2l7.586 7.586" />
          <circle cx="11" cy="11" r="2" />
        </svg>
      ),
    },
    {
      mode: 'eraser',
      label: '橡皮',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 20H7L3 16l9-9 8 8-4 4z" />
          <path d="M6.5 13.5l5 5" />
        </svg>
      ),
    },
    {
      mode: 'sticky',
      label: '便签',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 15h6v6" />
        </svg>
      ),
    },
    {
      mode: 'image',
      label: '图片',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-tools">
          {tools.map(({ mode, label, icon }) => (
            <button
              key={mode}
              className={`toolbar-btn ${tool === mode ? 'active' : ''}`}
              onClick={() => {
                onToolChange(mode);
                if (mode === 'image') onUploadImage();
              }}
              title={label}
            >
              {icon}
            </button>
          ))}
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-tools">
          <button
            className={`toolbar-btn ${!canUndo ? 'disabled' : ''}`}
            onClick={onUndo}
            disabled={!canUndo}
            title="撤销 (Ctrl+Z)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7v6h6" />
              <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
            </svg>
          </button>
          <button
            className={`toolbar-btn ${!canRedo ? 'disabled' : ''}`}
            onClick={onRedo}
            disabled={!canRedo}
            title="重做 (Ctrl+Shift+Z)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 7v6h-6" />
              <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3L21 13" />
            </svg>
          </button>
        </div>

        <div className="toolbar-divider" />

        <button
          className={`toolbar-btn record-btn ${isRecording ? 'recording' : ''}`}
          onClick={toggleRecording}
          title={isRecording ? '停止录制' : '开始录制'}
        >
          <svg viewBox="0 0 24 24" fill={isRecording ? '#EF4444' : 'none'} stroke={isRecording ? '#EF4444' : 'currentColor'} strokeWidth="2">
            <circle cx="12" cy="12" r="6" />
          </svg>
        </button>

        {tool === 'pen' && (
          <>
            <div className="toolbar-divider" />
            <button
              className="toolbar-btn color-btn"
              onClick={() => {
                setShowColorPanel(!showColorPanel);
                setShowWidthSlider(false);
              }}
              title="选择颜色"
            >
              <div className="color-indicator" style={{ backgroundColor: penColor }} />
            </button>
            <button
              className="toolbar-btn width-btn"
              onClick={() => {
                setShowWidthSlider(!showWidthSlider);
                setShowColorPanel(false);
              }}
              title="画笔粗细"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r={Math.max(2, penWidth / 2)} />
              </svg>
            </button>
          </>
        )}
      </div>

      {showColorPanel && tool === 'pen' && (
        <div className="color-panel">
          {COLORS.map((color) => (
            <button
              key={color}
              className={`color-swatch ${penColor === color ? 'selected' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => {
                onPenColorChange(color);
                setShowColorPanel(false);
              }}
            />
          ))}
        </div>
      )}

      {showWidthSlider && tool === 'pen' && (
        <div className="width-panel">
          <span className="width-label">{penWidth}px</span>
          <input
            type="range"
            min="1"
            max="20"
            value={penWidth}
            onChange={(e) => onPenWidthChange(Number(e.target.value))}
            className="width-slider"
          />
        </div>
      )}
    </>
  );
};

export default Toolbar;
