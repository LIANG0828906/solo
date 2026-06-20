import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from 'react';
import type {
  MountStyle,
  MountParams,
  CropArea,
} from './types';
import {
  renderMountedCanvas,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from './utils/canvasRenderer';
import { useThrottleRender } from './hooks/useThrottleRender';

interface PreviewPanelProps {
  originalImage: HTMLImageElement | null;
  cropArea: CropArea | null;
  currentStyle: MountStyle;
  params: MountParams;
  onRequestExport?: () => void;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  originalImage,
  cropArea,
  currentStyle,
  params,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [displayWidth, setDisplayWidth] = useState(CANVAS_WIDTH);

  const key = useMemo(
    () => `${currentStyle}-${JSON.stringify(params)}`,
    [currentStyle, params]
  );

  useEffect(() => {
    setIsFading(true);
    const t = setTimeout(() => setIsFading(false), 200);
    return () => clearTimeout(t);
  }, [currentStyle]);

  const updateDisplayWidth = useCallback(() => {
    if (!wrapRef.current) return;
    const maxW = wrapRef.current.clientWidth - 40;
    setDisplayWidth(Math.min(CANVAS_WIDTH, Math.max(300, maxW)));
  }, []);

  useEffect(() => {
    updateDisplayWidth();
    const ro = new ResizeObserver(updateDisplayWidth);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener('resize', updateDisplayWidth);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateDisplayWidth);
    };
  }, [updateDisplayWidth]);

  const doRender = useCallback(() => {
    if (!canvasRef.current || !originalImage || !cropArea) return;
    renderMountedCanvas(
      canvasRef.current,
      originalImage,
      cropArea,
      currentStyle,
      params,
      false
    );
  }, [originalImage, cropArea, currentStyle, params]);

  const throttledRender = useThrottleRender(doRender, 100);

  useEffect(() => {
    throttledRender();
  }, [throttledRender, originalImage, cropArea, currentStyle, params, key]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.max(0.5, Math.min(3, z * delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom === 1) return;
    e.preventDefault();
    setIsGrabbing(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startPan = { ...pan };
    const onMove = (ev: MouseEvent) => {
      setPan({
        x: startPan.x + (ev.clientX - startX),
        y: startPan.y + (ev.clientY - startY),
      });
    };
    const onUp = () => {
      setIsGrabbing(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const hasImage = !!originalImage && !!cropArea;

  return (
    <div className="preview-panel" ref={wrapRef}>
      <div className="panel-title" style={{ alignSelf: 'flex-start' }}>
        🖼 装裱预览
      </div>

      {!hasImage ? (
        <div className="preview-empty" style={{ flex: 1, width: '100%' }}>
          <div style={{ fontSize: 48 }}>📜</div>
          <div>
            请先上传书法作品图片
            <br />
            上传后将自动按 1:1.4 竖长比例裁剪
            <br />
            然后预览装裱效果
          </div>
        </div>
      ) : (
        <>
          <div
            className={`preview-canvas-wrap ${isGrabbing ? 'grabbing' : ''}`}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            style={{
              width: `${displayWidth}px`,
              height: `${displayWidth * (CANVAS_HEIGHT / CANVAS_WIDTH)}px`,
            }}
          >
            <canvas
              ref={canvasRef}
              className={`preview-canvas ${isFading ? 'fading' : ''}`}
              style={{
                width: displayWidth,
                height: displayWidth * (CANVAS_HEIGHT / CANVAS_WIDTH),
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isGrabbing
                  ? 'none'
                  : 'transform 200ms ease-out, opacity 500ms ease-out',
              }}
            />
          </div>

          <div className="preview-zoom">
            <span>🔍 缩放：{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setZoom((z) => Math.max(0.5, z * 0.8))}
              style={{ padding: '4px 12px', fontSize: 13 }}
            >
              −
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setZoom((z) => Math.min(3, z * 1.25))}
              style={{ padding: '4px 12px', fontSize: 13 }}
            >
              +
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={resetView}
              style={{ padding: '4px 12px', fontSize: 13 }}
            >
              重置
            </button>
            <span style={{ marginLeft: 12, opacity: 0.7 }}>
              （滚轮缩放 / 拖拽平移）
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default PreviewPanel;
