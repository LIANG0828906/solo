import React, { memo, useRef, useCallback, useState, useEffect } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import type { HSLColor } from '../types/color';
import { applyGradientMapChunked, fitImageToBounds } from '../utils/gradientMap';
import { hslToHex } from '../utils/colorUtils';
import { cn } from '../lib/utils';

interface GradientMapperProps {
  colors: HSLColor[];
  steps: number;
  isProcessing: boolean;
  onImageUpload: (img: HTMLImageElement) => void;
  onStepsChange: (steps: number) => void;
}

const MAX_WIDTH = 800;
const MAX_HEIGHT = 600;

const GradientMapper = memo(function GradientMapper({
  colors,
  steps,
  isProcessing,
  onImageUpload,
  onStepsChange,
}: GradientMapperProps) {
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const mappedCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);

  const drawOriginalImage = useCallback((img: HTMLImageElement) => {
    const canvas = originalCanvasRef.current;
    if (!canvas) return;

    const { width, height } = fitImageToBounds(img, MAX_WIDTH, MAX_HEIGHT);

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, width, height);
    }
  }, []);

  const drawMappedImage = useCallback((img: HTMLImageElement, gradientColors: HSLColor[]) => {
    const canvas = mappedCanvasRef.current;
    if (!canvas) return;

    const { width, height } = fitImageToBounds(img, MAX_WIDTH, MAX_HEIGHT);
    canvas.width = width;
    canvas.height = height;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.drawImage(img, 0, 0, width, height);
    const imageData = tempCtx.getImageData(0, 0, width, height);

    applyGradientMapChunked(imageData, gradientColors, true, 10000, (p) => {
      setProgress(p);
    }).then((result) => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.putImageData(result, 0, 0);
      }
      setProgress(1);
    });
  }, []);



  const handleFile = useCallback((file: File) => {
    if (!file.type.match('image/(jpeg|png)')) {
      alert('请上传 JPG 或 PNG 格式的图片');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        onImageUpload(img);
        drawOriginalImage(img);
        drawMappedImage(img, colors);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [colors, drawOriginalImage, drawMappedImage, onImageUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  useEffect(() => {
    if (image && colors.length > 0) {
      drawMappedImage(image, colors);
    }
  }, [colors, image, drawMappedImage]);

  const getColorSteps = (): HSLColor[] => {
    if (colors.length === 0) return [];
    if (colors.length === 1) return Array(steps).fill(colors[0]);
    if (steps === 1) return [colors[0]];

    const result: HSLColor[] = [];
    const segments = colors.length - 1;
    const stepsPerSegment = Math.max(1, Math.floor((steps - 1) / segments));

    for (let i = 0; i < segments; i++) {
      const start = colors[i];
      const end = colors[i + 1];
      const segSteps = i === segments - 1 ? steps - result.length : stepsPerSegment + 1;

      for (let j = 0; j < segSteps; j++) {
        const t = segSteps === 1 ? 0 : j / (segSteps - 1);
        result.push(lerpHsl(start, end, t));
      }
    }

    return result.slice(0, steps);
  };

  const lerpHsl = (a: HSLColor, b: HSLColor, t: number): HSLColor => {
    let hDiff = b.h - a.h;
    if (Math.abs(hDiff) > 180) {
      hDiff = hDiff > 0 ? hDiff - 360 : hDiff + 360;
    }

    return {
      h: ((a.h + hDiff * t) % 360 + 360) % 360,
      s: a.s + (b.s - a.s) * t,
      l: a.l + (b.l - a.l) * t,
    };
  };

  const colorSteps = getColorSteps();

  const PlaceholderSVG = () => (
    <svg
      viewBox="0 0 400 300"
      className="w-full h-full opacity-30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e3a5f" />
          <stop offset="50%" stopColor="#2d5a87" />
          <stop offset="100%" stopColor="#4a7c59" />
        </linearGradient>
        <linearGradient id="sun" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#sky)" />
      <circle cx="280" cy="80" r="35" fill="url(#sun)" />
      <path
        d="M0 200 L80 120 L160 180 L240 100 L320 160 L400 90 L400 300 L0 300 Z"
        fill="#1a472a"
        opacity="0.7"
      />
      <path
        d="M0 230 L60 170 L120 210 L200 140 L280 190 L360 130 L400 170 L400 300 L0 300 Z"
        fill="#0d3320"
        opacity="0.8"
      />
      <path
        d="M0 260 L100 220 L200 250 L300 210 L400 240 L400 300 L0 300 Z"
        fill="#062915"
      />
      <path
        d="M50 280 Q100 270 150 280 Q200 290 250 275 Q300 260 350 280"
        stroke="#60a5fa"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );

  return (
    <div
      className="w-full rounded-lg border p-6"
      style={{ backgroundColor: '#16213e', borderColor: '#0f3460' }}
    >
      {!image ? (
        <div
          className={cn(
            'flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200',
            isDragging ? 'border-blue-400 bg-blue-900/20' : 'hover:border-blue-400/50 hover:bg-blue-900/10'
          )}
          style={{ borderColor: isDragging ? '#60a5fa' : '#0f3460' }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <div className="w-48 h-36 mb-4">
            <PlaceholderSVG />
          </div>
          <Upload className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-gray-300 text-lg font-medium">点击或拖拽上传图片</p>
          <p className="text-gray-500 text-sm mt-2">支持 JPG、PNG 格式</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={handleInputChange}
          />
        </div>
      ) : (
        <>
          <div className="flex items-start gap-6">
            <div className="flex flex-col items-center flex-1">
              <span className="text-gray-400 text-sm mb-2 font-medium">原图</span>
              <div
                className="rounded-lg overflow-hidden border"
                style={{ borderColor: '#0f3460' }}
              >
                <canvas
                  ref={originalCanvasRef}
                  className="block"
                  style={{ maxWidth: MAX_WIDTH, maxHeight: MAX_HEIGHT }}
                />
              </div>
            </div>

            <div
              className="w-px self-stretch"
              style={{ backgroundColor: '#0f3460' }}
            />

            <div className="flex flex-col items-center flex-1 relative">
              <span className="text-gray-400 text-sm mb-2 font-medium">映射效果</span>
              <div
                className="rounded-lg overflow-hidden border"
                style={{ borderColor: '#0f3460' }}
              >
                <canvas
                  ref={mappedCanvasRef}
                  className="block"
                  style={{ maxWidth: MAX_WIDTH, maxHeight: MAX_HEIGHT }}
                />
              </div>
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-3" />
                    <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-400 transition-all duration-100"
                        style={{ width: `${progress * 100}%` }}
                      />
                    </div>
                    <p className="text-gray-300 text-sm mt-2">处理中... {Math.round(progress * 100)}%</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-gray-300 text-sm font-medium whitespace-nowrap">色阶数量：</label>
              <select
                value={steps}
                onChange={(e) => onStepsChange(Number(e.target.value))}
                className="px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                style={{ backgroundColor: '#0f3460', borderColor: '#1e3a5f' }}
              >
                {[3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n} 阶
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-stretch gap-0.5 h-12 rounded-lg overflow-hidden">
              {colorSteps.map((color, index) => (
                <div
                  key={index}
                  className="flex-1 flex items-center justify-center relative group"
                  style={{ backgroundColor: hslToHex(color) }}
                >
                  <span
                    className="text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      color: color.l > 50 ? '#000000' : '#ffffff',
                    }}
                  >
                    {hslToHex(color)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
});

export default GradientMapper;
