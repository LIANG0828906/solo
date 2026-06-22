import React from 'react';
import { Tool } from '../types';

interface ToolbarProps {
  tool: Tool;
  setTool: (tool: Tool) => void;
  noteColor: string;
  setNoteColor: (color: string) => void;
  sidebarColor: string;
  setSidebarColor: (color: string) => void;
  drawColor: string;
  setDrawColor: (color: string) => void;
  lineWidth: number;
  setLineWidth: (width: number) => void;
  isVotingMode: boolean;
  setIsVotingMode: (mode: boolean) => void;
  onUndo: () => void;
  onExport: () => void;
  onShare: () => void;
  onlineCount: number;
  isConnected: boolean;
  showMobileMenu: boolean;
  setShowMobileMenu: (show: boolean) => void;
}

const NOTE_COLORS = [
  '#FFF8DC',
  '#FFE4E1',
  '#E0FFE0',
  '#E6E6FA',
  '#FFE4B5',
  '#ADD8E6',
];

const SIDEBAR_COLORS = [
  '#888888',
  '#EF4444',
  '#22C55E',
  '#3B82F6',
  '#F59E0B',
  '#8B5CF6',
];

const DRAW_COLORS = [
  '#000000',
  '#EF4444',
  '#22C55E',
  '#3B82F6',
  '#F59E0B',
  '#8B5CF6',
];

const LINE_WIDTHS = [2, 4, 6, 8];

export const Toolbar: React.FC<ToolbarProps> = ({
  tool,
  setTool,
  noteColor,
  setNoteColor,
  sidebarColor,
  setSidebarColor,
  drawColor,
  setDrawColor,
  lineWidth,
  setLineWidth,
  isVotingMode,
  setIsVotingMode,
  onUndo,
  onExport,
  onShare,
  onlineCount,
  isConnected: _isConnected,
  showMobileMenu,
  setShowMobileMenu,
}) => {
  const renderToolbarContent = () => (
    <>
      <button
        className={`toolbar-btn ${tool === 'select' && !isVotingMode ? 'active' : ''}`}
        onClick={() => {
          setTool('select');
          setIsVotingMode(false);
        }}
        disabled={isVotingMode}
      >
        选择
      </button>

      <button
        className={`toolbar-btn ${tool === 'note' && !isVotingMode ? 'active' : ''}`}
        onClick={() => {
          setTool('note');
          setIsVotingMode(false);
        }}
        disabled={isVotingMode}
      >
        便签
      </button>

      <button
        className={`toolbar-btn ${tool === 'draw' && !isVotingMode ? 'active' : ''}`}
        onClick={() => {
          setTool('draw');
          setIsVotingMode(false);
        }}
        disabled={isVotingMode}
      >
        画笔
      </button>

      {tool === 'note' && !isVotingMode && (
        <>
          <div className="color-picker">
            {NOTE_COLORS.map((color) => (
              <div
                key={color}
                className={`color-option ${noteColor === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setNoteColor(color)}
              />
            ))}
          </div>

          <div className="sidebar-color-picker">
            {SIDEBAR_COLORS.map((color) => (
              <div
                key={color}
                className={`sidebar-color-option ${sidebarColor === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setSidebarColor(color)}
              />
            ))}
          </div>
        </>
      )}

      {tool === 'draw' && !isVotingMode && (
        <>
          <div className="color-picker">
            {DRAW_COLORS.map((color) => (
              <div
                key={color}
                className={`color-option ${drawColor === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setDrawColor(color)}
              />
            ))}
          </div>

          <div className="line-width-picker">
            {LINE_WIDTHS.map((width) => (
              <button
                key={width}
                className={`line-width-option ${lineWidth === width ? 'active' : ''}`}
                onClick={() => setLineWidth(width)}
              >
                <div
                  className="line-width-dot"
                  style={{ width, height: width }}
                />
              </button>
            ))}
          </div>
        </>
      )}

      <button
        className={`toolbar-btn ${isVotingMode ? 'active' : ''}`}
        onClick={() => setIsVotingMode(!isVotingMode)}
      >
        {isVotingMode ? '退出投票' : '投票模式'}
      </button>

      <button
        className="toolbar-btn"
        onClick={onUndo}
        disabled={isVotingMode}
      >
        撤销
      </button>

      <button className="toolbar-btn" onClick={onExport}>
        导出PNG
      </button>

      <button className="toolbar-btn" onClick={onShare}>
        分享
      </button>
    </>
  );

  return (
    <>
      <div className="toolbar">
        <div
          className="hamburger-menu"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
        >
          <div className="hamburger-line" />
          <div className="hamburger-line" />
          <div className="hamburger-line" />
        </div>

        {renderToolbarContent()}

        <div className="online-count">
          <span className="pulse-dot" />
          <span>{onlineCount} 人在线</span>
        </div>
      </div>

      <div className={`mobile-menu ${showMobileMenu ? 'visible' : ''}`}>
        {renderToolbarContent()}
      </div>
    </>
  );
};
