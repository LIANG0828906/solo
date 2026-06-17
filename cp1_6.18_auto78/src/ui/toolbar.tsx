import React, { useEffect, useState } from 'react';
import {
  Paintbrush,
  Square,
  Circle,
  Hexagon,
  Type,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Play,
  Square as SquareStop,
  Pointer,
  Minus,
  Plus,
  ChevronDown,
  X,
} from 'lucide-react';
import { useElementStore } from '@data/elementStore';
import { syncScheduler } from '@scheduler/syncScheduler';
import { ToolType } from '@types/index';

const TOOL_BUTTONS: {
  tool: ToolType;
  icon: React.ReactNode;
  label: string;
}[] = [
  { tool: 'select', icon: <Pointer size={24} />, label: '选择' },
  { tool: 'brush', icon: <Paintbrush size={24} />, label: '画笔' },
  { tool: 'rectangle', icon: <Square size={24} />, label: '矩形' },
  { tool: 'circle', icon: <Circle size={24} />, label: '圆形' },
  { tool: 'polygon', icon: <Hexagon size={24} />, label: '多边形' },
  { tool: 'text', icon: <Type size={24} />, label: '便签' },
  { tool: 'image', icon: <ImageIcon size={24} />, label: '图片' },
];

export const Toolbar: React.FC = () => {
  const {
    tool,
    setTool,
    brushWidth,
    setBrushWidth,
    borderRadius,
    setBorderRadius,
    polygonSides,
    setPolygonSides,
    undo,
    redo,
    replay,
    startReplay,
    stopReplay,
    historyStack,
    selectedElementId,
    deleteElement,
  } = useElementStore();

  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobilePos, setMobilePos] = useState({ x: 16, y: 80 });
  const [draggingFloating, setDraggingFloating] = useState(false);
  const [floatDragOffset, setFloatDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        syncScheduler.undo();
      } else if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === 'z'
      ) {
        e.preventDefault();
        syncScheduler.redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        syncScheduler.redo();
      } else if (e.key === 'Delete' && selectedElementId) {
        e.preventDefault();
        syncScheduler.immediateDelete(selectedElementId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedElementId]);

  const canUndo = historyStack.length > 1;
  const canRedo = useElementStore((s) => s.redoStack.length) > 0;

  const handleFloatMouseDown = (e: React.MouseEvent) => {
    setDraggingFloating(true);
    setFloatDragOffset({ x: e.clientX - mobilePos.x, y: e.clientY - mobilePos.y });
  };

  useEffect(() => {
    if (!draggingFloating) return;
    const onMove = (e: MouseEvent) => {
      setMobilePos({ x: e.clientX - floatDragOffset.x, y: e.clientY - floatDragOffset.y });
    };
    const onUp = () => setDraggingFloating(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [draggingFloating, floatDragOffset]);

  const renderControls = () => {
    if (tool === 'brush') {
      return (
        <div className="control-row">
          <label className="control-label">画笔粗细</label>
          <div className="control-slider-row">
            <button
              className="control-btn"
              onClick={() => setBrushWidth(brushWidth - 1)}
              disabled={brushWidth <= 2}
            >
              <Minus size={14} />
            </button>
            <input
              type="range"
              min={2}
              max={8}
              value={brushWidth}
              onChange={(e) => setBrushWidth(Number(e.target.value))}
              className="control-slider"
            />
            <button
              className="control-btn"
              onClick={() => setBrushWidth(brushWidth + 1)}
              disabled={brushWidth >= 8}
            >
              <Plus size={14} />
            </button>
            <span className="control-value">{brushWidth}px</span>
          </div>
        </div>
      );
    }
    if (tool === 'rectangle') {
      return (
        <div className="control-row">
          <label className="control-label">圆角大小</label>
          <div className="control-slider-row">
            <button
              className="control-btn"
              onClick={() => setBorderRadius(borderRadius - 2)}
              disabled={borderRadius <= 0}
            >
              <Minus size={14} />
            </button>
            <input
              type="range"
              min={0}
              max={20}
              value={borderRadius}
              onChange={(e) => setBorderRadius(Number(e.target.value))}
              className="control-slider"
            />
            <button
              className="control-btn"
              onClick={() => setBorderRadius(borderRadius + 2)}
              disabled={borderRadius >= 20}
            >
              <Plus size={14} />
            </button>
            <span className="control-value">{borderRadius}px</span>
          </div>
        </div>
      );
    }
    if (tool === 'polygon') {
      return (
        <div className="control-row">
          <label className="control-label">边数</label>
          <div className="control-slider-row">
            <button
              className="control-btn"
              onClick={() => setPolygonSides(polygonSides - 1)}
              disabled={polygonSides <= 3}
            >
              <Minus size={14} />
            </button>
            <input
              type="range"
              min={3}
              max={8}
              value={polygonSides}
              onChange={(e) => setPolygonSides(Number(e.target.value))}
              className="control-slider"
            />
            <button
              className="control-btn"
              onClick={() => setPolygonSides(polygonSides + 1)}
              disabled={polygonSides >= 8}
            >
              <Plus size={14} />
            </button>
            <span className="control-value">{polygonSides}边</span>
          </div>
        </div>
      );
    }
    if (tool === 'select' && selectedElementId) {
      return (
        <div className="control-row">
          <label className="control-label">选中元素</label>
          <button
            className="delete-btn"
            onClick={() => syncScheduler.immediateDelete(selectedElementId)}
          >
            <X size={16} />
            删除元素
          </button>
        </div>
      );
    }
    return null;
  };

  const toolbarContent = (
    <>
      <div className="toolbar-header">
        <h3 className="toolbar-title">工具面板</h3>
        {isMobile && (
          <button
            className="toolbar-close"
            onClick={() => setMobileOpen(false)}
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="tools-grid">
        {TOOL_BUTTONS.map(({ tool: t, icon, label }) => {
          const isActive = tool === t;
          return (
            <button
              key={t}
              className={`tool-btn ${isActive ? 'active' : ''}`}
              onClick={() => setTool(t)}
              title={label}
            >
              {icon}
            </button>
          );
        })}
      </div>

      <div className="control-section">{renderControls()}</div>

      <div className="section-divider" />

      <div className="history-section">
        <h4 className="section-title">历史操作</h4>
        <div className="history-buttons">
          <button
            className={`history-btn ${canUndo ? '' : 'disabled'}`}
            onClick={() => syncScheduler.undo()}
            disabled={!canUndo}
            title="撤销 (Ctrl+Z)"
          >
            <Undo2 size={22} />
          </button>
          <button
            className={`history-btn ${canRedo ? '' : 'disabled'}`}
            onClick={() => syncScheduler.redo()}
            disabled={!canRedo}
            title="重做 (Ctrl+Shift+Z)"
          >
            <Redo2 size={22} />
          </button>
          {!replay.isPlaying ? (
            <button
              className={`history-btn replay ${canUndo ? '' : 'disabled'}`}
              onClick={startReplay}
              disabled={!canUndo}
              title="历史回放"
            >
              <Play size={22} />
            </button>
          ) : (
            <button
              className="history-btn replay playing"
              onClick={stopReplay}
              title="停止回放"
            >
              <SquareStop size={22} />
            </button>
          )}
        </div>
        {replay.isPlaying && (
          <div className="replay-progress">
            <div className="replay-bar">
              <div
                className="replay-fill"
                style={{
                  width: `${(replay.currentStep / Math.max(replay.totalSteps, 1)) * 100}%`,
                }}
              />
            </div>
            <span className="replay-text">
              回放 {replay.currentStep}/{replay.totalSteps}
            </span>
          </div>
        )}
        <div className="history-steps">
          历史步数: {historyStack.length - 1} / 50
        </div>
      </div>

      <div className="section-divider" />

      <div className="tips-section">
        <h4 className="section-title">快捷操作</h4>
        <ul className="tips-list">
          <li>Ctrl+Z 撤销</li>
          <li>Ctrl+Shift+Z 重做</li>
          <li>Delete 删除选中</li>
          <li>切换"选择"工具拖动/缩放</li>
        </ul>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        <div
          className="floating-tool-btn"
          onMouseDown={handleFloatMouseDown}
          onClick={() => !draggingFloating && setMobileOpen(true)}
          style={{ left: mobilePos.x, top: mobilePos.y }}
        >
          <Paintbrush size={22} />
        </div>
        {mobileOpen && (
          <div className="mobile-toolbar-overlay">
            <div className="mobile-toolbar-panel">{toolbarContent}</div>
          </div>
        )}
      </>
    );
  }

  return <aside className="toolbar">{toolbarContent}</aside>;
};
