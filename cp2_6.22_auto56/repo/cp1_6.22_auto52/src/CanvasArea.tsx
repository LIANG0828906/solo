import React, { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';

export interface CanvasAreaHandle {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  exportCanvas: () => HTMLCanvasElement | null;
  applyColorScheme: (colorMap: Record<string, string>) => void;
  getUsedColors: () => string[];
}

interface CanvasAreaProps {
  selectedColor: string;
  imageSrc: string | null;
  onImageLoad?: (width: number, height: number) => void;
  onColorUsed?: (color: string) => void;
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
}

const MAX_HISTORY = 20;
const FILL_ANIMATION_DURATION = 300;
const SCHEME_ANIMATION_DURATION = 500;

interface Point {
  x: number;
  y: number;
}

interface FillRegion {
  pixels: Set<string>;
  centerX: number;
  centerY: number;
  maxRadius: number;
  color: string;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

function getPixelKey(x: number, y: number): string {
  return `${x},${y}`;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

const CanvasArea = forwardRef<CanvasAreaHandle, CanvasAreaProps>(
  ({ selectedColor, imageSrc, onImageLoad, onColorUsed, onHistoryChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const schemeOverlayRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const historyStackRef = useRef<ImageData[]>([]);
    const historyIndexRef = useRef(-1);
    const isAnimatingRef = useRef(false);
    const animationFrameRef = useRef<number | null>(null);
    const lastFillRegionRef = useRef<FillRegion | null>(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const [showCanvas, setShowCanvas] = useState(false);

    const updateHistoryState = useCallback(() => {
      const undo = historyIndexRef.current > 0;
      const redo = historyIndexRef.current < historyStackRef.current.length - 1;
      setCanUndo(undo);
      setCanRedo(redo);
      if (onHistoryChange) {
        onHistoryChange(undo, redo);
      }
    }, [onHistoryChange]);

    const saveState = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      if (historyIndexRef.current < historyStackRef.current.length - 1) {
        historyStackRef.current = historyStackRef.current.slice(0, historyIndexRef.current + 1);
      }

      historyStackRef.current.push(imageData);

      if (historyStackRef.current.length > MAX_HISTORY + 1) {
        historyStackRef.current.shift();
      } else {
        historyIndexRef.current++;
      }

      if (historyIndexRef.current >= MAX_HISTORY) {
        historyIndexRef.current = MAX_HISTORY - 1;
      }

      updateHistoryState();
    }, [updateHistoryState]);

    const restoreState = useCallback((index: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const imageData = historyStackRef.current[index];
      if (!imageData) return;

      ctx.putImageData(imageData, 0, 0);
    }, []);

    const isLinePixel = useCallback(
      (data: Uint8ClampedArray, idx: number, threshold = 120): boolean => {
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];
        if (a < 50) return false;
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness < threshold;
      },
      []
    );

    const floodFill = useCallback(
      (ctx: CanvasRenderingContext2D, startX: number, startY: number, fillColor: string): FillRegion | null => {
        const canvas = ctx.canvas;
        const width = canvas.width;
        const height = canvas.height;

        if (startX < 0 || startX >= width || startY < 0 || startY >= height) {
          return null;
        }

        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        const startIdx = (startY * width + startX) * 4;
        const startR = data[startIdx];
        const startG = data[startIdx + 1];
        const startB = data[startIdx + 2];
        const startA = data[startIdx + 3];

        if (startA < 50) {
          return null;
        }

        if (isLinePixel(data, startIdx)) {
          return null;
        }

        const { r: fr, g: fg, b: fb } = hexToRgb(fillColor);

        if (Math.abs(startR - fr) < 5 && Math.abs(startG - fg) < 5 && Math.abs(startB - fb) < 5) {
          return null;
        }

        const pixels = new Set<string>();
        const stack: Point[] = [{ x: startX, y: startY }];

        const tolerance = 50;
        const matchesTarget = (idx: number) => {
          if (isLinePixel(data, idx)) return false;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];
          if (a < 50) return true;
          const dr = Math.abs(r - startR);
          const dg = Math.abs(g - startG);
          const db = Math.abs(b - startB);
          return dr < tolerance && dg < tolerance && db < tolerance;
        };

        let minX = startX;
        let maxX = startX;
        let minY = startY;
        let maxY = startY;

        while (stack.length > 0) {
          const { x, y } = stack.pop()!;
          const key = getPixelKey(x, y);

          if (pixels.has(key)) continue;
          if (x < 0 || x >= width || y < 0 || y >= height) continue;

          const idx = (y * width + x) * 4;
          if (!matchesTarget(idx)) continue;

          pixels.add(key);

          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;

          stack.push({ x: x + 1, y });
          stack.push({ x: x - 1, y });
          stack.push({ x, y: y + 1 });
          stack.push({ x, y: y - 1 });
        }

        if (pixels.size === 0) return null;

        const edgePixels = new Set<string>();
        for (const key of pixels) {
          const [px, py] = key.split(',').map(Number);
          const neighbors = [
            getPixelKey(px + 1, py),
            getPixelKey(px - 1, py),
            getPixelKey(px, py + 1),
            getPixelKey(px, py - 1)
          ];
          let isEdge = false;
          for (const n of neighbors) {
            if (!pixels.has(n)) {
              isEdge = true;
              break;
            }
          }
          if (isEdge) {
            edgePixels.add(key);
          }
        }

        for (const key of pixels) {
          const [px, py] = key.split(',').map(Number);
          const idx = (py * width + px) * 4;
          const isEdge = edgePixels.has(key);

          if (isEdge) {
            data[idx] = Math.round(fr * 0.88 + startR * 0.12);
            data[idx + 1] = Math.round(fg * 0.88 + startG * 0.12);
            data[idx + 2] = Math.round(fb * 0.88 + startB * 0.12);
            data[idx + 3] = 255;
          } else {
            data[idx] = fr;
            data[idx + 1] = fg;
            data[idx + 2] = fb;
            data[idx + 3] = 255;
          }
        }

        ctx.putImageData(imageData, 0, 0);

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const maxRadius = Math.max(maxX - minX, maxY - minY) / 2 + 20;

        return { pixels, centerX, centerY, maxRadius, color: fillColor };
      },
      [isLinePixel]
    );

    const animateFill = useCallback(
      (region: FillRegion, reverse = false, callback?: () => void) => {
        const overlay = overlayCanvasRef.current;
        const mainCanvas = canvasRef.current;
        if (!overlay || !mainCanvas) {
          if (callback) callback();
          return;
        }

        const ctx = overlay.getContext('2d');
        if (!ctx) {
          if (callback) callback();
          return;
        }

        overlay.width = mainCanvas.width;
        overlay.height = mainCanvas.height;

        const { r, g, b } = hexToRgb(region.color);
        const { centerX, centerY, maxRadius } = region;

        const startTime = performance.now();

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        isAnimatingRef.current = true;

        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          let progress = Math.min(elapsed / FILL_ANIMATION_DURATION, 1);
          progress = easeOutCubic(progress);

          if (reverse) {
            progress = 1 - progress;
          }

          const currentRadius = maxRadius * progress;

          ctx.clearRect(0, 0, overlay.width, overlay.height);

          if (progress > 0 && progress < 1) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
            ctx.clip();

            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.5)`;
            ctx.fillRect(0, 0, overlay.width, overlay.height);

            ctx.restore();
          }

          if (progress < 1 && !reverse) {
            animationFrameRef.current = requestAnimationFrame(animate);
          } else if (progress > 0 && reverse) {
            animationFrameRef.current = requestAnimationFrame(animate);
          } else {
            ctx.clearRect(0, 0, overlay.width, overlay.height);
            isAnimatingRef.current = false;
            animationFrameRef.current = null;
            if (callback) callback();
          }
        };

        animationFrameRef.current = requestAnimationFrame(animate);
      },
      []
    );

    const animateSchemeChange = useCallback(
      (newImageData: ImageData, callback?: () => void) => {
        const overlay = schemeOverlayRef.current;
        const mainCanvas = canvasRef.current;
        if (!overlay || !mainCanvas) {
          if (callback) callback();
          return;
        }

        const ctx = overlay.getContext('2d');
        if (!ctx) {
          if (callback) callback();
          return;
        }

        overlay.width = mainCanvas.width;
        overlay.height = mainCanvas.height;

        ctx.putImageData(newImageData, 0, 0);
        ctx.globalAlpha = 0;

        const startTime = performance.now();
        const halfDuration = SCHEME_ANIMATION_DURATION / 2;

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        isAnimatingRef.current = true;

        const mainCtx = mainCanvas.getContext('2d');

        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;

          if (elapsed < halfDuration) {
            const progress = easeOutCubic(elapsed / halfDuration);
            if (mainCtx) {
              mainCtx.globalAlpha = 1 - progress * 0.5;
            }
            ctx.globalAlpha = progress * 0.5;
          } else {
            const progress = easeOutCubic((elapsed - halfDuration) / halfDuration);
            if (mainCtx) {
              mainCtx.globalAlpha = 0.5 + progress * 0.5;
              if (progress >= 1) {
                mainCtx.globalAlpha = 1;
                mainCtx.putImageData(newImageData, 0, 0);
              }
            }
            ctx.globalAlpha = 0.5 - progress * 0.5;
          }

          if (elapsed < SCHEME_ANIMATION_DURATION) {
            animationFrameRef.current = requestAnimationFrame(animate);
          } else {
            ctx.clearRect(0, 0, overlay.width, overlay.height);
            ctx.globalAlpha = 1;
            if (mainCtx) {
              mainCtx.globalAlpha = 1;
            }
            isAnimatingRef.current = false;
            animationFrameRef.current = null;
            if (callback) callback();
          }
        };

        animationFrameRef.current = requestAnimationFrame(animate);
      },
      []
    );

    const handleCanvasClick = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas || isAnimatingRef.current) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = Math.floor((e.clientX - rect.left) * scaleX);
        const y = Math.floor((e.clientY - rect.top) * scaleY);

        saveState();

        const region = floodFill(ctx, x, y, selectedColor);

        if (region) {
          lastFillRegionRef.current = region;
          animateFill(region);

          if (onColorUsed) {
            onColorUsed(selectedColor.toLowerCase());
          }
        } else {
          historyIndexRef.current--;
          if (historyStackRef.current.length > 0) {
            historyStackRef.current.pop();
          }
          updateHistoryState();
        }
      },
      [selectedColor, floodFill, animateFill, saveState, onColorUsed, updateHistoryState]
    );

    const undo = useCallback(() => {
      if (historyIndexRef.current <= 0 || isAnimatingRef.current) return;

      const prevIndex = historyIndexRef.current - 1;

      if (lastFillRegionRef.current) {
        const prevData = historyStackRef.current[prevIndex];
        if (prevData) {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (canvas && ctx) {
            animateFill(lastFillRegionRef.current, true, () => {
              historyIndexRef.current = prevIndex;
              ctx.putImageData(prevData, 0, 0);
              updateHistoryState();
            });
          }
        }
      } else {
        historyIndexRef.current = prevIndex;
        restoreState(prevIndex);
        updateHistoryState();
      }
    }, [restoreState, updateHistoryState, animateFill]);

    const redo = useCallback(() => {
      if (historyIndexRef.current >= historyStackRef.current.length - 1 || isAnimatingRef.current) return;

      const nextIndex = historyIndexRef.current + 1;
      const nextData = historyStackRef.current[nextIndex];

      if (nextData && lastFillRegionRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
          animateFill(lastFillRegionRef.current, false, () => {
            historyIndexRef.current = nextIndex;
            ctx.putImageData(nextData, 0, 0);
            updateHistoryState();
          });
        }
      } else {
        historyIndexRef.current = nextIndex;
        restoreState(nextIndex);
        updateHistoryState();
      }
    }, [restoreState, updateHistoryState, animateFill]);

    const applyColorScheme = useCallback(
      (colorMap: Record<string, string>) => {
        const canvas = canvasRef.current;
        if (!canvas || isAnimatingRef.current) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        saveState();

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const normalizedMap: Record<string, string> = {};
        for (const [key, value] of Object.entries(colorMap)) {
          normalizedMap[key.toLowerCase().replace('#', '')] = value;
        }

        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 50) continue;

          const brightness = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
          if (brightness < 80) continue;

          const hex = rgbToHex(data[i], data[i + 1], data[i + 2]).replace('#', '');
          const newColor = normalizedMap[hex];

          if (newColor) {
            const { r, g, b } = hexToRgb(newColor);
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
          }
        }

        animateSchemeChange(imageData, () => {
          updateHistoryState();
        });
      },
      [saveState, animateSchemeChange, updateHistoryState]
    );

    const getUsedColors = useCallback((): string[] => {
      const canvas = canvasRef.current;
      if (!canvas) return [];

      const ctx = canvas.getContext('2d');
      if (!ctx) return [];

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const colors = new Set<string>();

      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 50) continue;

        const brightness = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
        if (brightness < 80) continue;
        if (brightness > 250) continue;

        const hex = rgbToHex(data[i], data[i + 1], data[i + 2]);
        colors.add(hex);
      }

      return Array.from(colors);
    }, []);

    const exportCanvas = useCallback((): HTMLCanvasElement | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height;

      const ctx = exportCanvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(canvas, 0, 0);

      return exportCanvas;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        undo,
        redo,
        canUndo,
        canRedo,
        exportCanvas,
        applyColorScheme,
        getUsedColors
      }),
      [undo, redo, canUndo, canRedo, exportCanvas, applyColorScheme, getUsedColors]
    );

    useEffect(() => {
      if (!imageSrc) {
        setImageLoaded(false);
        setImageDimensions({ width: 0, height: 0 });
        setShowCanvas(false);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageRef.current = img;
        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });

        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
          }

          historyStackRef.current = [];
          historyIndexRef.current = -1;

          const initialData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
          if (initialData) {
            historyStackRef.current.push(initialData);
            historyIndexRef.current = 0;
          }

          updateHistoryState();
        }

        const overlay = overlayCanvasRef.current;
        if (overlay) {
          overlay.width = img.naturalWidth;
          overlay.height = img.naturalHeight;
        }

        const schemeOverlay = schemeOverlayRef.current;
        if (schemeOverlay) {
          schemeOverlay.width = img.naturalWidth;
          schemeOverlay.height = img.naturalHeight;
        }

        setTimeout(() => {
          setImageLoaded(true);
          setShowCanvas(true);
        }, 50);

        if (onImageLoad) {
          onImageLoad(img.naturalWidth, img.naturalHeight);
        }
      };
      img.src = imageSrc;

      return () => {
        imageRef.current = null;
      };
    }, [imageSrc, onImageLoad, updateHistoryState]);

    useEffect(() => {
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, []);

    return (
      <div className="canvas-wrapper">
        {imageLoaded && (
          <div className="image-info">
            {imageDimensions.width} × {imageDimensions.height} px
          </div>
        )}

        {!imageSrc && (
          <div className="upload-placeholder">
            <svg className="upload-placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div className="upload-placeholder-text">点击上传线稿图片</div>
            <div className="upload-placeholder-hint">支持 PNG、JPG 格式</div>
          </div>
        )}

        {imageSrc && (
          <div className={`canvas-area ${showCanvas ? 'fade-in-scale' : ''}`} style={{ opacity: showCanvas ? 1 : 0 }}>
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              style={{
                display: showCanvas ? 'block' : 'none',
                maxWidth: '100%',
                maxHeight: 'calc(100vh - 120px)'
              }}
            />
            <canvas
              ref={overlayCanvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none',
                display: showCanvas ? 'block' : 'none',
                maxWidth: '100%',
                maxHeight: 'calc(100vh - 120px)'
              }}
            />
            <canvas
              ref={schemeOverlayRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none',
                display: showCanvas ? 'block' : 'none',
                maxWidth: '100%',
                maxHeight: 'calc(100vh - 120px)',
                opacity: 0
              }}
            />
          </div>
        )}
      </div>
    );
  }
);

CanvasArea.displayName = 'CanvasArea';

export default CanvasArea;
