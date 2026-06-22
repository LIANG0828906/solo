import { useState, useRef, useCallback, useEffect, MutableRefObject } from 'react';
import { useReviewStore } from '../../store/reviewStore';

interface LoaderPanelProps {
  side: 'left' | 'right';
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_CANVAS_HEIGHT = 600;

export const LoaderPanel: React.FC<LoaderPanelProps> = ({ side, canvasRef }) => {
  const { sketchPair, uploadSketch } = useReviewStore();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const sketch = side === 'left' ? sketchPair.left : sketchPair.right;

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

  const drawImage = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = Math.min(1, MAX_CANVAS_HEIGHT / img.height);
    const displayWidth = Math.round(img.width * scale);
    const displayHeight = Math.round(img.height * scale);

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    drawCheckerboard(ctx, displayWidth, displayHeight);
    ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
  }, [canvasRef, drawCheckerboard]);

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
        uploadSketch(side, base64, { width: img.width, height: img.height });
        drawImage(img);
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  }, [side, uploadSketch, drawImage]);

  useEffect(() => {
    if (sketch && canvasRef.current) {
      const img = new Image();
      img.onload = () => drawImage(img);
      img.src = sketch;
    } else if (!sketch && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = 400;
        canvas.height = 300;
        drawCheckerboard(ctx, 400, 300);
      }
    }
  }, [sketch, canvasRef, drawImage, drawCheckerboard]);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx && !sketch) {
        canvas.width = 400;
        canvas.height = 300;
        drawCheckerboard(ctx, 400, 300);
      }
    }
  }, []);

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

  return (
    <div className="loader-panel" ref={containerRef}>
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''} ${sketch ? 'has-image' : ''}`}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {!sketch ? (
          <div className="drop-placeholder">
            <div className="drop-icon">📁</div>
            <p className="drop-text">点击或拖拽图片到此处</p>
            <p className="drop-hint">支持 PNG / JPG，最大 5MB</p>
            {error && <p className="drop-error">{error}</p>}
          </div>
        ) : null}
        <canvas
          ref={canvasRef}
          className={`sketch-canvas ${sketch ? 'visible' : ''}`}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};
