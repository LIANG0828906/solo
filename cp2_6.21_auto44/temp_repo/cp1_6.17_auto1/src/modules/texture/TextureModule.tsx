import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../../store';
import {
  drawHeatmap,
  analyzeTexture,
  analyzeTextureAsync,
  exportTextureImage,
} from './textureEngine';
import { loadImage } from '../camera/cameraUtils';
import type { GridPoint } from '../../types';

const WORKSPACE_WIDTH = 640;
const WORKSPACE_HEIGHT = 480;
const EXPORT_WIDTH = 1024;
const EXPORT_HEIGHT = 768;

export default function TextureModule() {
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const heatmapCanvasRef = useRef<HTMLCanvasElement>(null);
  const heatmapPointsRef = useRef<GridPoint[]>([]);
  const imageDataCacheRef = useRef<ImageData | null>(null);
  const rafRef = useRef<number | null>(null);
  const capturedImage = useAppStore((state) => state.capturedImage);
  const sensitivity = useAppStore((state) => state.sensitivity);
  const setSensitivity = useAppStore((state) => state.setSensitivity);
  const setWrinkleStats = useAppStore((state) => state.setWrinkleStats);
  const isLoading = useAppStore((state) => state.isLoading);
  const setIsLoading = useAppStore((state) => state.setIsLoading);
  const debounceRef = useRef<number | null>(null);

  const recalculateHeatmap = useCallback(
    async (imageSrc: string, sens: number, useAsync: boolean = false) => {
      try {
        let imageData: ImageData;

        if (imageDataCacheRef.current && !useAsync) {
          imageData = imageDataCacheRef.current;
        } else {
          const img = await loadImage(imageSrc);

          const canvas = imageCanvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          canvas.width = WORKSPACE_WIDTH;
          canvas.height = WORKSPACE_HEIGHT;
          ctx.drawImage(img, 0, 0, WORKSPACE_WIDTH, WORKSPACE_HEIGHT);

          imageData = ctx.getImageData(
            0,
            0,
            WORKSPACE_WIDTH,
            WORKSPACE_HEIGHT
          );
          imageDataCacheRef.current = imageData;
        }

        const result = useAsync
          ? await analyzeTextureAsync(imageData, sens)
          : analyzeTexture(imageData, sens);

        heatmapPointsRef.current = result.points;
        setWrinkleStats(result.stats);

        const heatmapCanvas = heatmapCanvasRef.current;
        if (heatmapCanvas) {
          const heatmapCtx = heatmapCanvas.getContext('2d');
          if (heatmapCtx) {
            heatmapCanvas.width = WORKSPACE_WIDTH;
            heatmapCanvas.height = WORKSPACE_HEIGHT;
            drawHeatmap(
              heatmapCtx,
              result.points,
              WORKSPACE_WIDTH,
              WORKSPACE_HEIGHT
            );
          }
        }
      } catch (error) {
        console.error('Heatmap calculation error:', error);
      }
    },
    [setWrinkleStats]
  );

  useEffect(() => {
    if (capturedImage) {
      imageDataCacheRef.current = null;
      recalculateHeatmap(capturedImage, sensitivity, false);
    } else {
      imageDataCacheRef.current = null;
      setWrinkleStats(null);
      heatmapPointsRef.current = [];
      const canvas = imageCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, WORKSPACE_WIDTH, WORKSPACE_HEIGHT);
        }
      }
      const heatmapCanvas = heatmapCanvasRef.current;
      if (heatmapCanvas) {
        const ctx = heatmapCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, WORKSPACE_WIDTH, WORKSPACE_HEIGHT);
        }
      }
    }
  }, [capturedImage, recalculateHeatmap, sensitivity, setWrinkleStats]);

  useEffect(() => {
    if (!capturedImage) return;
    if (!imageDataCacheRef.current) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      rafRef.current = requestAnimationFrame(() => {
        recalculateHeatmap(capturedImage, sensitivity, true);
      });
    }, 30);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [sensitivity, capturedImage, recalculateHeatmap]);

  const handleSensitivityChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSensitivity(Number(e.target.value));
  };

  const handleDownload = async () => {
    if (!capturedImage) return;

    const startTime = Date.now();
    setIsLoading(true);

    try {
      const dataUrl = await exportTextureImage(
        capturedImage,
        sensitivity,
        EXPORT_WIDTH,
        EXPORT_HEIGHT
      );

      const link = document.createElement('a');
      link.download = `wrinkle-texture-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 500 - elapsed);
      setTimeout(() => {
        setIsLoading(false);
      }, remaining);
    }
  };

  return (
    <div className="texture-module">
      <div className="workspace-container">
        {capturedImage ? (
          <div className="workspace-canvas-wrapper">
            <canvas
              ref={imageCanvasRef}
              className="workspace-image-canvas"
              style={{
                width: WORKSPACE_WIDTH,
                height: WORKSPACE_HEIGHT,
              }}
            />
            <canvas
              ref={heatmapCanvasRef}
              className="workspace-heatmap-canvas"
              style={{
                width: WORKSPACE_WIDTH,
                height: WORKSPACE_HEIGHT,
              }}
            />
            {isLoading && (
              <div className="loading-overlay">
                <div className="loading-spinner" />
              </div>
            )}
          </div>
        ) : (
          <div className="workspace-placeholder">
            <p>抓取照片后在此显示热力图纹理</p>
          </div>
        )}
      </div>

      <div className="sensitivity-control">
        <div className="sensitivity-label">
          <span>纹理敏感度</span>
          <span className="sensitivity-value">{sensitivity}</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={sensitivity}
          onChange={handleSensitivityChange}
          className="sensitivity-slider"
          disabled={!capturedImage}
        />
      </div>

      <div className="texture-actions">
        <button
          onClick={handleDownload}
          className="download-full-btn"
          disabled={!capturedImage || isLoading}
        >
          导出纹理图 (1024×768)
        </button>
      </div>
    </div>
  );
}
