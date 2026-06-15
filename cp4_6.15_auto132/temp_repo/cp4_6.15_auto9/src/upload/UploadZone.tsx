import React, { useCallback, useRef, useState } from 'react';
import { Upload, Leaf, X, Loader2 } from 'lucide-react';
import { useAppStore } from '@/shared/store';
import type { DiagnosisStatus, ImageFeatures } from '@/shared/types';

const THUMBNAIL_MAX_SIZE = 256;
const DISPLAY_MAX_SIZE = 1280;
const QUALITY_THUMBNAIL = 0.78;
const QUALITY_DISPLAY = 0.88;

const statusBorders: Record<DiagnosisStatus | 'loading' | 'idle', string> = {
  healthy: '4px solid #4CAF50',
  diseased: '4px solid #E53935',
  nutrient_deficiency: '4px solid #FBC02D',
  loading: '4px solid transparent',
  idle: '4px solid transparent',
};

const statusGlow: Record<DiagnosisStatus | 'loading' | 'idle', string> = {
  healthy: '0 0 30px rgba(76, 175, 80, 0.5)',
  diseased: '0 0 30px rgba(229, 57, 53, 0.5)',
  nutrient_deficiency: '0 0 30px rgba(251, 192, 45, 0.5)',
  loading: '0 0 30px rgba(76, 175, 80, 0.3)',
  idle: 'none',
};

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function drawToCanvas(
  source: CanvasImageSource,
  targetW: number,
  targetH: number,
  quality: number,
  mimeType: string,
): string {
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas context unavailable');
  ctx.drawImage(source, 0, 0, targetW, targetH);
  return canvas.toDataURL(mimeType === 'image/png' ? 'image/png' : 'image/jpeg', mimeType === 'image/png' ? undefined : quality);
}

function extractFeaturesFromSource(
  source: CanvasImageSource,
): ImageFeatures {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas context unavailable');
  ctx.drawImage(source, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;

  let rSum = 0, gSum = 0, bSum = 0;
  let brightnessSum = 0;
  let yellowPixel = 0;
  let brownSpot = 0;
  let greenPixel = 0;
  const luminanceArr: number[] = [];
  const totalPixels = size * size;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    rSum += r; gSum += g; bSum += b;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    brightnessSum += lum;
    luminanceArr.push(lum);
    if (r > 80 && r * 0.9 < g && g > r * 0.6 && g > b * 1.2) greenPixel++;
    if (r > 150 && g > 130 && b < 110 && Math.abs(r - g) < 50) yellowPixel++;
    if (r > 70 && r < 160 && g > 30 && g < 100 && b < 80 && r > g * 1.3) brownSpot++;
  }

  const avgLum = brightnessSum / totalPixels;
  let variance = 0;
  for (const l of luminanceArr) variance += (l - avgLum) ** 2;
  const contrast = Math.min(1, Math.sqrt(variance / totalPixels) / 80);

  return {
    avgRed: rSum / totalPixels / 255,
    avgGreen: gSum / totalPixels / 255,
    avgBlue: bSum / totalPixels / 255,
    brightness: avgLum / 255,
    contrast,
    greenRatio: greenPixel / totalPixels,
    yellowTendency: yellowPixel / totalPixels,
    brownSpotRatio: brownSpot / totalPixels,
  };
}

async function createThumbnail(file: File): Promise<{ image: string; thumbnail: string; features: ImageFeatures }> {
  const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  let bitmap: ImageBitmap | HTMLImageElement;
  let srcW: number, srcH: number;
  let closeFn: (() => void) | null = null;

  try {
    if (typeof createImageBitmap === 'function') {
      bitmap = await createImageBitmap(file, {
        resizeWidth: Math.min(1024, THUMBNAIL_MAX_SIZE * 2),
        resizeHeight: Math.min(1024, THUMBNAIL_MAX_SIZE * 2),
        resizeQuality: 'low',
      });
      srcW = bitmap.width;
      srcH = bitmap.height;
      closeFn = () => (bitmap as ImageBitmap).close();
    } else {
      bitmap = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });
      srcW = bitmap.naturalWidth;
      srcH = bitmap.naturalHeight;
    }
  } catch (e) {
    throw new Error('图片加载失败');
  }

  const thumbRatio = Math.min(1, THUMBNAIL_MAX_SIZE / Math.max(srcW, srcH));
  const thumbW = Math.max(1, Math.round(srcW * thumbRatio));
  const thumbH = Math.max(1, Math.round(srcH * thumbRatio));
  const thumbnail = drawToCanvas(bitmap, thumbW, thumbH, QUALITY_THUMBNAIL, mimeType);

  const dispRatio = Math.min(1, DISPLAY_MAX_SIZE / Math.max(srcW, srcH));
  const dispW = Math.max(1, Math.round(srcW * dispRatio));
  const dispH = Math.max(1, Math.round(srcH * dispRatio));
  const image = drawToCanvas(bitmap, dispW, dispH, QUALITY_DISPLAY, mimeType);

  const features = extractFeaturesFromSource(bitmap);

  if (closeFn) closeFn();

  return { image, thumbnail, features };
}

export default function UploadZone() {
  const { state, dispatch, runDiagnosis } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        alert('请上传 jpg、png 或 webp 格式的图片');
        return;
      }
      try {
        const result = await createThumbnail(file);
        dispatch({
          type: 'SET_CURRENT_IMAGE',
          payload: { image: result.image, thumbnail: result.thumbnail },
        });
        runDiagnosis(result.image, result.thumbnail, result.features);
      } catch (e) {
        console.error(e);
        alert('图片处理失败，请重试');
      }
    },
    [dispatch, runDiagnosis],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleClick = () => fileInputRef.current?.click();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClear = () => {
    dispatch({ type: 'CLEAR_CURRENT' });
  };

  const borderStatus: DiagnosisStatus | 'loading' | 'idle' = state.isDiagnosing
    ? 'loading'
    : state.currentRecord?.status ?? 'idle';

  const displayImage = state.currentThumbnail || state.currentImage;

  return (
    <div className="upload-wrapper">
      {!displayImage ? (
        <div
          className={`upload-zone ${isDragging ? 'dragging' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          <div className="upload-decoration">
            <Leaf className="leaf-icon leaf-1" size={28} />
            <Leaf className="leaf-icon leaf-2" size={20} />
            <Leaf className="leaf-icon leaf-3" size={24} />
          </div>
          <div className="upload-content">
            <div className="upload-icon-circle">
              <Upload size={36} />
            </div>
            <h2 className="upload-title">拖拽叶片图片到这里</h2>
            <p className="upload-subtitle">或点击选择文件</p>
            <p className="upload-formats">支持 JPG / PNG / WebP 格式</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleInputChange}
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        <div
          className="preview-container"
          style={{
            border: statusBorders[borderStatus],
            boxShadow: statusGlow[borderStatus],
          }}
        >
          <button className="clear-btn" onClick={handleClear} title="清除图片">
            <X size={18} />
          </button>
          <img src={displayImage} alt="预览" className="preview-image" />
          {state.isDiagnosing && (
            <div className="diagnosing-overlay">
              <Loader2 size={48} className="spinner" />
              <p className="diagnosing-text">正在诊断中...</p>
            </div>
          )}
          {borderStatus !== 'loading' && borderStatus !== 'idle' && (
            <div className={`status-badge status-${borderStatus}`}>
              {borderStatus === 'healthy' && '健康'}
              {borderStatus === 'diseased' && '病害'}
              {borderStatus === 'nutrient_deficiency' && '营养不足'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
