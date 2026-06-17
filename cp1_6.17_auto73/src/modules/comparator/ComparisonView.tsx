import { useRef, useEffect, useCallback, useState, MutableRefObject } from 'react';
import { useReviewStore } from '../../store/reviewStore';
import { calculatePixelDiff, createDiffMask, shouldUseWorker, DiffPixel } from './PixelDiffEngine';
import { AnnotationOverlay } from './AnnotationOverlay';

interface ComparisonViewProps {
  rightCanvasRef: MutableRefObject<HTMLCanvasElement | null>;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const MAX_CANVAS_HEIGHT = 600;

let diffWorker: Worker | null = null;
function getDiffWorker(): Worker {
  if (!diffWorker) {
    const workerCode = `
      self.onmessage = function(e) {
        const { leftBuffer, rightBuffer, leftWidth, leftHeight, rightWidth, rightHeight } = e.data;
        const leftData = new Uint8ClampedArray(leftBuffer);
        const rightData = new Uint8ClampedArray(rightBuffer);
        const leftImageData = { data: leftData, width: leftWidth, height: leftHeight };
        const rightImageData = { data: rightData, width: rightWidth, height: rightHeight };
        const width = Math.max(leftWidth, rightWidth);
        const height = Math.max(leftHeight, rightHeight);
        const totalPixels = width * height;
        const diffPixels = [];
        const DIFF_THRESHOLD = 30;

        const getPixel = (data, x, y, w, h) => {
          if (x >= w || y >= h) return [0, 0, 0];
          const idx = (y * w + x) * 4;
          return [data[idx], data[idx + 1], data[idx + 2]];
        };

        let lastProgress = Date.now();
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const [r1, g1, b1] = getPixel(leftData, x, y, leftWidth, leftHeight);
            const [r2, g2, b2] = getPixel(rightData, x, y, rightWidth, rightHeight);
            const dr = Math.abs(r1 - r2);
            const dg = Math.abs(g1 - g2);
            const db = Math.abs(b1 - b2);
            const maxDiff = Math.max(dr, dg, db);
            const avgDiff = (dr + dg + db) / 3;
            if (maxDiff > DIFF_THRESHOLD) {
              diffPixels.push({ x, y, diffValue: avgDiff });
            }
          }
          if (Date.now() - lastProgress > 50 || y === height - 1) {
            self.postMessage({ type: 'progress', progress: ((y + 1) / height) * 100 });
            lastProgress = Date.now();
          }
        }

        const percentage = (diffPixels.length / totalPixels) * 100;
        self.postMessage({ type: 'result', pixels: diffPixels, percentage });
      };
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    diffWorker = new Worker(URL.createObjectURL(blob));
  }
  return diffWorker;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ rightCanvasRef }) => {
  const {
    sketchPair,
    isCompared,
    isComparing,
    comparisonProgress,
    diffPixels,
    diffPercentage,
    setComparing,
    setProgress,
    setDiffResult,
  } = useReviewStore();

  const diffCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [displaySize, setDisplaySize] = useState({ width: 400, height: 300 });
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rightSketch = sketchPair.right;
  const leftSketch = sketchPair.left;
  const { uploadSketch } = useReviewStore();

  const drawCheckerboard = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const cellSize = 10;
    for (let y = 0; y < height; y += cellSize) {
      for (let x = 0; x < width; x += cellSize) {
        const isLight = ((x / cellSize) + (y / cellSize)) % 2 === 0;
        ctx.fillStyle = isLight ? '#FFFFFF' : '#CCCCCC';
        ctx.fillRect(x, y, cellSize, cellSize);
      }
    }
  }, []);

  const drawRightImage = useCallback(() => {
    const canvas = rightCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!rightSketch) {
      canvas.width = 400;
      canvas.height = 300;
      drawCheckerboard(ctx, 400, 300);
      setDisplaySize({ width: 400, height: 300 });
      return;
    }

    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_CANVAS_HEIGHT / img.height);
      const displayWidth = Math.round(img.width * scale);
      const displayHeight = Math.round(img.height * scale);

      canvas.width = displayWidth;
      canvas.height = displayHeight;
      drawCheckerboard(ctx, displayWidth, displayHeight);
      ctx.drawImage(img, 0, 0, displayWidth, displayHeight);

      setDisplaySize({ width: displayWidth, height: displayHeight });
    };
    img.src = rightSketch;
  }, [rightSketch, rightCanvasRef, drawCheckerboard]);

  useEffect(() => {
    drawRightImage();
  }, [drawRightImage]);

  useEffect(() => {
    if (!rightCanvasRef.current || !diffCanvasRef.current) return;
    const diffCanvas = diffCanvasRef.current;
    diffCanvas.width = rightCanvasRef.current.width;
    diffCanvas.height = rightCanvasRef.current.height;
    setDisplaySize({
      width: rightCanvasRef.current.width,
      height: rightCanvasRef.current.height,
    });
  }, [rightCanvasRef]);

  useEffect(() => {
    if (!isCompared || !diffCanvasRef.current) return;
    const canvas = diffCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (diffPixels.length === 0) return;

    const mask = createDiffMask(diffPixels, canvas.width, canvas.height);
    ctx.putImageData(mask, 0, 0);
  }, [isCompared, diffPixels, diffCanvasRef]);

  const getImageData = (base64: string): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const ctx = tempCanvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        resolve(ctx.getImageData(0, 0, img.width, img.height));
      };
      img.onerror = reject;
      img.src = base64;
    });
  };

  const runComparison = useCallback(async () => {
    if (!leftSketch || !rightSketch) return;

    setComparing(true);
    setProgress(0);
    setShowProgress(false);

    const startTime = Date.now();
    const progressTimer = setTimeout(() => {
      setShowProgress(true);
    }, 2000);

    try {
      const [leftData, rightData] = await Promise.all([
        getImageData(leftSketch),
        getImageData(rightSketch),
      ]);

      const useWorker = shouldUseWorker(
        Math.max(leftData.width, rightData.width),
        Math.max(leftData.height, rightData.height)
      );

      let result: { pixels: DiffPixel[]; percentage: number };

      if (useWorker) {
        const worker = getDiffWorker();
        result = await new Promise((resolve, reject) => {
          const leftBuffer = leftData.data.buffer.slice(0) as ArrayBuffer;
          const rightBuffer = rightData.data.buffer.slice(0) as ArrayBuffer;

          worker.onmessage = (e) => {
            if (e.data.type === 'progress') {
              setProgress(e.data.progress);
            } else if (e.data.type === 'result') {
              resolve({ pixels: e.data.pixels, percentage: e.data.percentage });
            }
          };
          worker.onerror = reject;
          worker.postMessage(
            {
              leftBuffer,
              rightBuffer,
              leftWidth: leftData.width,
              leftHeight: leftData.height,
              rightWidth: rightData.width,
              rightHeight: rightData.height,
            },
            [leftBuffer, rightBuffer]
          );
        });
      } else {
        result = calculatePixelDiff(leftData, rightData, (p) => {
          if (Date.now() - startTime > 2000) {
            setProgress(p);
          }
        });
      }

      clearTimeout(progressTimer);

      if (diffCanvasRef.current) {
        const canvas = diffCanvasRef.current;
        const ctx = canvas.getContext('2d')!;
        const parentCanvas = rightCanvasRef.current;
        if (parentCanvas) {
          canvas.width = parentCanvas.width;
          canvas.height = parentCanvas.height;
          setDisplaySize({ width: parentCanvas.width, height: parentCanvas.height });
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const mask = createDiffMask(result.pixels, canvas.width, canvas.height);
        ctx.putImageData(mask, 0, 0);
      }

      setDiffResult(result.pixels, result.percentage);
    } catch (error) {
      console.error('Comparison failed:', error);
      setComparing(false);
    } finally {
      clearTimeout(progressTimer);
      setTimeout(() => setShowProgress(false), 500);
    }
  }, [leftSketch, rightSketch, setComparing, setProgress, setDiffResult, rightCanvasRef]);

  useEffect(() => {
    const handleRunComparison = () => runComparison();
    window.addEventListener('run-comparison', handleRunComparison);
    return () => window.removeEventListener('run-comparison', handleRunComparison);
  }, [runComparison]);

  const processFile = useCallback((file: File) => {
    setError(null);

    if (!file.type.match(/^image\/(png|jpeg)$/)) {
      setError('仅支持 PNG 或 JPG 格式');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('文件大小不能超过 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (!base64) return;

      const img = new Image();
      img.onload = () => {
        uploadSketch('right', base64, { width: img.width, height: img.height });
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  }, [uploadSketch]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }, [processFile]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const showWarningBorder = isCompared && diffPercentage > 0.5;

  return (
    <div className="comparison-view">
      <div className="loader-panel">
        <div
          className={`drop-zone ${isDragging ? 'dragging' : ''} ${rightSketch ? 'has-image' : ''}`}
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {!rightSketch ? (
            <div className="drop-placeholder">
              <div className="drop-icon">📁</div>
              <p className="drop-text">点击或拖拽图片到此处</p>
              <p className="drop-hint">支持 PNG / JPG，最大 5MB</p>
              {error && <p className="drop-error">{error}</p>}
            </div>
          ) : (
            <div
              className={`canvas-wrapper ${showWarningBorder ? 'warning-border' : ''}`}
              onClick={(e) => e.stopPropagation()}
            >
              <canvas
                ref={rightCanvasRef}
                className="sketch-canvas visible"
              />
              <canvas
                ref={diffCanvasRef}
                className="diff-canvas"
              />
              <AnnotationOverlay
                canvasWidth={displaySize.width}
                canvasHeight={displaySize.height}
                scaleFactor={1}
                isCompared={isCompared}
              />
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {showProgress && isComparing && (
        <div className="progress-overlay">
          <div className="progress-container">
            <div className="progress-label">正在对比... {Math.round(comparisonProgress)}%</div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${comparisonProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
