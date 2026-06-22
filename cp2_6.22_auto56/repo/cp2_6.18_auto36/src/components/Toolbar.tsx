import { useState } from 'react';
import type { Tool } from '@/types';
import { PRESET_COLORS, CONSTANTS } from '@/constants';

interface ToolbarProps {
  currentTool: Tool;
  currentColor: string;
  currentWidth: number;
  isSyncConnected: boolean;
  onToolChange: (tool: Tool) => void;
  onColorChange: (color: string) => void;
  onWidthChange: (width: number) => void;
  onClearCanvas: () => void;
}

export function Toolbar({
  currentTool,
  currentColor,
  currentWidth,
  isSyncConnected,
  onToolChange,
  onColorChange,
  onWidthChange,
  onClearCanvas,
}: ToolbarProps) {
  const [showClearDialog, setShowClearDialog] = useState(false);

  const handleClearConfirm = () => {
    onClearCanvas();
    setShowClearDialog(false);
  };

  return (
    <>
      <div
        style={toolbarStyle}
      >
        <div style={toolbarInnerStyle}>
          <div style={toolsContainerStyle}>
            <button
              style={{
                ...toolButtonStyle,
                backgroundColor: currentTool === 'pen' ? '#4A90D9' : 'transparent',
                color: currentTool === 'pen' ? '#fff' : '#333',
              }}
              onClick={() => onToolChange('pen')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 19l7-7 3 3-7 7h-3v-3z"/>
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
              </svg>
              <span style={buttonTextStyle}>画笔</span>
            </button>

            <button
              style={{
                ...toolButtonStyle,
                backgroundColor: currentTool === 'eraser' ? '#4A90D9' : 'transparent',
                color: currentTool === 'eraser' ? '#fff' : '#333',
              }}
              onClick={() => onToolChange('eraser')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 20H7L3 16l9-9 8 8-4 5h4z"/>
                <path d="M18 13l-7-7"/>
              </svg>
              <span style={buttonTextStyle}>橡皮擦</span>
            </button>
          </div>

          <div style={dividerStyle} />

          <div style={colorContainerStyle}>
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                style={{
                  ...colorButtonStyle,
                  backgroundColor: color,
                  boxShadow: currentColor === color ? `0 0 0 3px rgba(74, 144, 217, 0.5)` : 'none',
                  transform: currentColor === color ? 'scale(1.15)' : 'scale(1)',
                }}
                onClick={() => onColorChange(color)}
              />
            ))}
          </div>

          <div style={dividerStyle} />

          <div style={widthContainerStyle}>
            <span style={widthLabelStyle}>粗细</span>
            <input
              type="range"
              min="1"
              max="10"
              value={currentWidth}
              onChange={(e) => onWidthChange(Number(e.target.value))}
              style={sliderStyle}
            />
            <span style={widthValueStyle}>{currentWidth}px</span>
          </div>

          <div style={{ flex: 1 }} />

          <button
            style={clearButtonStyle}
            onClick={() => setShowClearDialog(true)}
          >
            清空画布
          </button>

          <div style={dividerStyle} />

          <div style={syncIndicatorStyle}>
            <div
              style={{
                ...syncDotStyle,
                backgroundColor: isSyncConnected ? CONSTANTS.SYNC_CONNECTED : CONSTANTS.SYNC_DISCONNECTED,
                boxShadow: isSyncConnected
                  ? `0 0 8px ${CONSTANTS.SYNC_CONNECTED}`
                  : 'none',
              }}
            />
            <span style={syncLabelStyle}>
              {isSyncConnected ? '已连接' : '未连接'}
            </span>
          </div>
        </div>
      </div>

      {showClearDialog && (
        <div style={dialogOverlayStyle}>
          <div style={dialogStyle}>
            <h3 style={dialogTitleStyle}>确认清空</h3>
            <p style={dialogContentStyle}>确定要清空画布上的所有内容吗？此操作不可撤销。</p>
            <div style={dialogButtonsStyle}>
              <button
                style={dialogCancelBtnStyle}
                onClick={() => setShowClearDialog(false)}
              >
                取消
              </button>
              <button
                style={dialogConfirmBtnStyle}
                onClick={handleClearConfirm}
              >
                确认清空
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const toolbarStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: `${CONSTANTS.TOOLBAR_HEIGHT}px`,
  backgroundColor: CONSTANTS.TOOLBAR_BG,
  borderBottom: '1px solid #E0E0E0',
  backdropFilter: 'blur(10px)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  padding: '0 24px',
};

const toolbarInnerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  width: '100%',
  maxWidth: '100%',
};

const toolsContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '4px',
};

const toolButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 12px',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 500,
  transition: 'all 0.2s ease',
  fontFamily: 'inherit',
};

const buttonTextStyle: React.CSSProperties = {
  fontSize: '13px',
};

const dividerStyle: React.CSSProperties = {
  width: '1px',
  height: '28px',
  backgroundColor: '#E0E0E0',
  margin: '0 4px',
};

const colorContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
};

const colorButtonStyle: React.CSSProperties = {
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  border: '2px solid #fff',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
};

const widthContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const widthLabelStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#666',
  fontWeight: 500,
};

const sliderStyle: React.CSSProperties = {
  width: '100px',
  height: '4px',
  borderRadius: '2px',
  cursor: 'pointer',
  accentColor: '#4A90D9',
};

const widthValueStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#333',
  fontWeight: 600,
  minWidth: '30px',
  textAlign: 'center',
};

const clearButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  border: 'none',
  backgroundColor: 'transparent',
  color: '#FF6B6B',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  borderRadius: '8px',
  transition: 'background-color 0.2s',
  fontFamily: 'inherit',
};

const syncIndicatorStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '0 8px',
};

const syncDotStyle: React.CSSProperties = {
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  transition: 'all 0.3s ease',
};

const syncLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#666',
};

const dialogOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
};

const dialogStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  padding: '24px',
  minWidth: '320px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
};

const dialogTitleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  marginBottom: '12px',
  color: '#333',
};

const dialogContentStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#666',
  marginBottom: '24px',
  lineHeight: 1.5,
};

const dialogButtonsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  justifyContent: 'flex-end',
};

const dialogCancelBtnStyle: React.CSSProperties = {
  padding: '8px 20px',
  border: '1px solid #E0E0E0',
  backgroundColor: '#fff',
  color: '#333',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 500,
  fontFamily: 'inherit',
  transition: 'all 0.2s',
};

const dialogConfirmBtnStyle: React.CSSProperties = {
  padding: '8px 20px',
  border: 'none',
  backgroundColor: '#FF6B6B',
  color: '#fff',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 500,
  fontFamily: 'inherit',
  transition: 'all 0.2s',
};
