import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useAppStore } from '../../store';
import {
  analyzeImageGrayscale,
  drawHeatmap,
  getImageData,
  HeatmapResult,
} from './textureEngine';
import { loadImageFromDataURL } from '../camera/cameraUtils';

const WORKSPACE_WIDTH = 1024;
const WORKSPACE_HEIGHT = 768;

export const TextureModule: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heatmapResultRef = useRef<HeatmapResult | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const renderTimeoutRef = useRef<number | null>(null);

  const {
    capturedImage,
    sensitivity,
    setWrinkleStats,
    setIsLoading,
  } = useAppStore();

  const renderHeatmap = useCallback(
    async (imageSrc: string, sensitivityValue: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      setIsRendering(true);

      try {
        const img = await loadImageFromDataURL(imageSrc);
        imageRef.current = img;

        const imageData = getImageData(img, 640, 480);
        const result = analyzeImageGrayscale(imageData, sensitivityValue);
        heatmapResultRef.current = result;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        drawHeatmap(ctx, img, result, WORKSPACE_WIDTH, WORKSPACE_HEIGHT);

        setWrinkleStats(result.stats);
      } catch (error) {
        console.error('热力图渲染失败:', error);
      } finally {
        setIsRendering(false);
      }
    },
    [setWrinkleStats]
  );

  useEffect(() => {
    if (!capturedImage) {
      heatmapResultRef.current = null;
      imageRef.current = null;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, WORKSPACE_WIDTH, WORKSPACE_HEIGHT);
        }
      }
      setWrinkleStats(null);
      return;
    }

    if (renderTimeoutRef.current) {
      window.clearTimeout(renderTimeoutRef.current);
    }

    renderTimeoutRef.current = window.setTimeout(() => {
      renderHeatmap(capturedImage, sensitivity);
    }, 50);

    return () => {
      if (renderTimeoutRef.current) {
        window.clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [capturedImage, sensitivity, renderHeatmap, setWrinkleStats]);

  const handleDownload = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !capturedImage) return;

    setIsLoading(true);

    try {
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => resolve(), 2000);
        const check = () => {
          if (!isRendering) {
            clearTimeout(timeout);
            setTimeout(() => resolve(), 100);
          } else {
            requestAnimationFrame(check);
          }
        };
        check();
      });

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = WORKSPACE_WIDTH;
      exportCanvas.height = WORKSPACE_HEIGHT;
      const exportCtx = exportCanvas.getContext('2d');
      if (!exportCtx) return;

      exportCtx.drawImage(canvas, 0, 0);

      const link = document.createElement('a');
      link.download = `wrinkle-texture-${Date.now()}.png`;
      link.href = exportCanvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }
  }, [capturedImage, isRendering, setIsLoading]);

  const handleSensitivityChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseInt(e.target.value, 10);
    useAppStore.getState().setSensitivity(value);
  };

  return (
    <div className="right-panel">
      <div className="section-title">纹理分析工作区</div>

      <div className="workspace">
        {!capturedImage ? (
          <div className="workspace-placeholder">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
            <span>抓取照片后此处将显示热力图</span>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            id="workspace-canvas"
            className="workspace-canvas"
            width={WORKSPACE_WIDTH}
            height={WORKSPACE_HEIGHT}
            style={{
              transition: 'opacity 0.2s ease',
              opacity: isRendering ? 0.85 : 1,
            }}
          />
        )}
      </div>

      <div className="controls-panel">
        <div className="slider-container">
          <div className="slider-label">
            <span>纹理敏感度</span>
            <span className="slider-value">{sensitivity}</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={sensitivity}
            onChange={handleSensitivityChange}
            disabled={!capturedImage}
          />
        </div>

        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 16,
            justifyContent: 'flex-end',
          }}
        >
          <button
            className="btn"
            onClick={handleDownload}
            disabled={!capturedImage || isRendering}
          >
            下载纹理图 (1024×768)
          </button>
        </div>
      </div>
    </div>
  );
};
