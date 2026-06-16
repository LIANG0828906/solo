import { useEffect, useRef, useState, useCallback } from 'react';
import { TimelineRenderer, ThemeColors } from '../modules/timeline/TimelineRenderer';
import { TimelineNode, ThemeMode } from '../modules/timeline/TimelineEngine';
import { useTimelineStore } from '../store/useTimelineStore';

interface TimelineCanvasProps {
  onNodePreview?: (node: TimelineNode | null, x: number, y: number) => void;
}

const DARK_THEME: ThemeColors = {
  background: '#1E1E2E',
  text: '#CDD6F4',
  textSecondary: '#9399B2',
  gridLine: 'rgba(255, 255, 255, 0.05)',
};

const LIGHT_THEME: ThemeColors = {
  background: '#FFFFFF',
  text: '#1E1E2E',
  textSecondary: '#6C7086',
  gridLine: 'rgba(0, 0, 0, 0.06)',
};

function getThemeColors(mode: ThemeMode): ThemeColors {
  return mode === 'dark' ? DARK_THEME : LIGHT_THEME;
}

export default function TimelineCanvas({ onNodePreview }: TimelineCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<TimelineRenderer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const engine = useTimelineStore(s => s.engine);
  const theme = useTimelineStore(s => s.theme);
  const timelines = useTimelineStore(s => s.timelines);
  const viewport = useTimelineStore(s => s.viewport);
  const handlePan = useTimelineStore(s => s.handlePan);
  const handleZoom = useTimelineStore(s => s.handleZoom);
  const setSelectedNode = useTimelineStore(s => s.setSelectedNode);
  const setHoveredNode = useTimelineStore(s => s.setHoveredNode);
  const refreshState = useTimelineStore(s => s.refreshState);

  const handleNodeClick = useCallback((node: TimelineNode) => {
    setSelectedNode(node.id);
  }, [setSelectedNode]);

  const handleNodeDoubleClick = useCallback((node: TimelineNode) => {
    setSelectedNode(node.id);
  }, [setSelectedNode]);

  const handleNodeHover = useCallback((node: TimelineNode | null, x = 0, y = 0) => {
    setHoveredNode(node, x, y);
    if (onNodePreview) {
      onNodePreview(node, x, y);
    }
    if (rendererRef.current) {
      rendererRef.current.setHoveredNode(node ? node.id : null);
    }
  }, [setHoveredNode, onNodePreview]);

  const handleCanvasPan = useCallback((dx: number, dy: number) => {
    handlePan(dx, dy);
  }, [handlePan]);

  const handleCanvasZoom = useCallback((delta: number, cx: number, cy: number) => {
    handleZoom(delta, cx, cy);
  }, [handleZoom]);

  const handleCanvasDragEnd = useCallback(() => {
    setIsDragActive(false);
    refreshState();
  }, [refreshState]);

  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      const renderer = new TimelineRenderer(canvasRef.current, engine, {
        onNodeClick: handleNodeClick,
        onNodeDoubleClick: handleNodeDoubleClick,
        onNodeHover: handleNodeHover,
        onPan: handleCanvasPan,
        onZoom: handleCanvasZoom,
        onCanvasDragEnd: handleCanvasDragEnd,
      });

      rendererRef.current = renderer;
      renderer.setTheme(getThemeColors(theme));

      const startDrag = () => setIsDragActive(true);
      canvasRef.current.addEventListener('mousedown', startDrag);

      const handleResize = () => renderer.resize();
      window.addEventListener('resize', handleResize);

      return () => {
        if (canvasRef.current) {
          canvasRef.current.removeEventListener('mousedown', startDrag);
        }
        window.removeEventListener('resize', handleResize);
        renderer.destroy();
        rendererRef.current = null;
      };
    } catch (e) {
      console.error('初始化 Canvas 渲染器失败:', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setTheme(getThemeColors(theme));
    }
  }, [theme]);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.requestRender();
    }
  }, [timelines, viewport]);

  return (
    <div
      ref={containerRef}
      className={`timeline-canvas-container ${isDragActive ? 'dragging' : ''}`}
    >
      <canvas ref={canvasRef} className="timeline-canvas" />
    </div>
  );
}
