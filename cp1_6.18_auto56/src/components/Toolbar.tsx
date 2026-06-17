import React, { useCallback, useState, useEffect } from 'react';
import { useBoardStore } from '@/store/boardStore';
import { ideaService } from '@/services/ideaService';
import { clamp } from '@/shared/utils';

export const Toolbar: React.FC = () => {
  const {
    zoom,
    pan,
    showNodeList,
    setZoom,
    toggleNodeList,
    resetView,
    setShowNodePanel,
    setPanelPosition,
    setPanelNodeId,
  } = useBoardStore();

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleZoomChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newZoom = parseFloat(e.target.value);
      setZoom(clamp(newZoom, 0.25, 2));
    },
    [setZoom]
  );

  const handleZoomIn = useCallback(() => {
    setZoom(clamp(zoom + 0.1, 0.25, 2));
  }, [zoom, setZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom(clamp(zoom - 0.1, 0.25, 2));
  }, [zoom, setZoom]);

  const handleResetView = useCallback(() => {
    resetView();
  }, [resetView]);

  const handleNewNode = useCallback(() => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const worldX = (centerX - pan.x) / zoom - 120;
    const worldY = (centerY - pan.y) / zoom - 50;

    ideaService.createNode({
      title: '新想法',
      content: '点击编辑内容...',
      x: worldX,
      y: worldY,
    });
  }, [pan, zoom]);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }, []);

  const handleCreateNode = useCallback(() => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    setPanelPosition({ x: centerX, y: centerY });
    setPanelNodeId(null);
    setShowNodePanel(true);
  }, [setPanelPosition, setPanelNodeId, setShowNodePanel]);

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <button
          className="toolbar-btn menu-btn"
          onClick={toggleNodeList}
          title={showNodeList ? '关闭节点列表' : '打开节点列表'}
        >
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
            <path
              d="M3 6h18M3 12h18M3 18h18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <div className="toolbar-title">
          <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
            <path
              d="M12 2L2 7l10 5 10-5-10-5z"
              stroke="#7C7CFF"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M2 17l10 5 10-5"
              stroke="#7C7CFF"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M2 12l10 5 10-5"
              stroke="#7C7CFF"
              strokeWidth="2"
              fill="none"
            />
          </svg>
          <span>思维轨迹</span>
        </div>
      </div>
      <div className="toolbar-center">
        <button className="toolbar-btn primary-btn" onClick={handleCreateNode}>
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span>新建想法</span>
        </button>
      </div>
      <div className="toolbar-right">
        <div className="zoom-controls">
          <button
            className="toolbar-btn icon-btn"
            onClick={handleZoomOut}
            title="缩小"
          >
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
              <path
                d="M5 12h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <input
            type="range"
            className="zoom-slider"
            min="0.25"
            max="2"
            step="0.05"
            value={zoom}
            onChange={handleZoomChange}
            title="缩放"
          />
          <button
            className="toolbar-btn icon-btn"
            onClick={handleZoomIn}
            title="放大"
          >
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <span className="zoom-value">{Math.round(zoom * 100)}%</span>
          <button
            className="toolbar-btn icon-btn"
            onClick={handleResetView}
            title="重置视图"
          >
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
              <path
                d="M3 12a9 9 0 1 0 3-6.7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M3 4v5h5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </button>
        </div>
        <button
          className="toolbar-btn icon-btn"
          onClick={toggleFullscreen}
          title={isFullscreen ? '退出全屏' : '全屏'}
        >
          {isFullscreen ? (
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              <path
                d="M8 3v5H3M16 3v5h5M8 21v-5H3M16 21v-5h5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              <path
                d="M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};
