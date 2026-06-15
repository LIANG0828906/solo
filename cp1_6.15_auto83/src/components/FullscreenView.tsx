import { useState, useRef, useEffect, useCallback } from 'react';
import { PhotoData } from '../utils/photoData';
import { calculateExposureAdjustment } from '../utils/photoData';

interface FullscreenViewProps {
  photo: PhotoData;
  onClose: () => void;
}

export default function FullscreenView({ photo, onClose }: FullscreenViewProps) {
  const [apertureAdj, setApertureAdj] = useState(0);
  const [shutterAdj, setShutterAdj] = useState(0);
  const [isoAdj, setIsoAdj] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const animationRef = useRef<number | null>(null);
  const originalImageDataRef = useRef<ImageData | null>(null);
  const lastSizeRef = useRef<{ w: number; h: number } | null>(null);

  const { brightness, contrast } = calculateExposureAdjustment(
    photo.params.ev,
    apertureAdj,
    shutterAdj,
    isoAdj
  );

  const drawImage = useCallback(() => {
    if (!canvasRef.current || !imgRef.current || !imgRef.current.complete) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imgRef.current;
    const maxWidth = window.innerWidth * 0.9;
    const maxHeight = window.innerHeight * 0.85;
    
    let drawWidth = img.naturalWidth;
    let drawHeight = img.naturalHeight;

    if (drawWidth > maxWidth) {
      const ratio = maxWidth / drawWidth;
      drawWidth = maxWidth;
      drawHeight *= ratio;
    }
    if (drawHeight > maxHeight) {
      const ratio = maxHeight / drawHeight;
      drawHeight = maxHeight;
      drawWidth *= ratio;
    }

    const MAX_PIXELS = 2000000;
    const totalPixels = drawWidth * drawHeight;
    if (totalPixels > MAX_PIXELS) {
      const downscaleRatio = Math.sqrt(MAX_PIXELS / totalPixels);
      drawWidth = Math.floor(drawWidth * downscaleRatio);
      drawHeight = Math.floor(drawHeight * downscaleRatio);
    }

    const sizeChanged =
      !lastSizeRef.current ||
      lastSizeRef.current.w !== drawWidth ||
      lastSizeRef.current.h !== drawHeight;

    try {
      if (sizeChanged) {
        canvas.width = drawWidth;
        canvas.height = drawHeight;
        ctx.filter = 'none';
        try {
          ctx.drawImage(img, 0, 0, drawWidth, drawHeight);
        } catch (drawErr) {
          console.error('Canvas绘制图片失败:', drawErr);
          return;
        }
        try {
          originalImageDataRef.current = ctx.getImageData(0, 0, drawWidth, drawHeight);
        } catch (imgErr) {
          console.error('获取像素数据失败（可能为CORS或跨域资源限制）:', imgErr);
          originalImageDataRef.current = null;
          return;
        }
        lastSizeRef.current = { w: drawWidth, h: drawHeight };
      }

      if (!originalImageDataRef.current) return;

      const original = originalImageDataRef.current;
      let outputData: ImageData;
      try {
        outputData = ctx.createImageData(original.width, original.height);
      } catch (createErr) {
        console.error('创建输出ImageData失败:', createErr);
        return;
      }
      const src = original.data;
      const dst = outputData.data;
      const len = src.length;

      try {
        for (let i = 0; i < len; i += 4) {
          let r = src[i] * brightness;
          let g = src[i + 1] * brightness;
          let b = src[i + 2] * brightness;

          r = ((r / 255 - 0.5) * contrast + 0.5) * 255;
          g = ((g / 255 - 0.5) * contrast + 0.5) * 255;
          b = ((b / 255 - 0.5) * contrast + 0.5) * 255;

          dst[i] = r < 0 ? 0 : r > 255 ? 255 : r;
          dst[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
          dst[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
          dst[i + 3] = src[i + 3];
        }
      } catch (processErr) {
        console.error('像素处理过程中出错:', processErr);
        return;
      }

      try {
        ctx.putImageData(outputData, 0, 0);
      } catch (putErr) {
        console.error('写入像素数据到Canvas失败:', putErr);
      }
    } catch (globalErr) {
      console.error('滤镜处理流程发生未预期错误:', globalErr);
    }
  }, [brightness, contrast]);

  useEffect(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = requestAnimationFrame(drawImage);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [drawImage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const currentAperture = photo.params.aperture * Math.pow(2, apertureAdj / 2);
  const displayAperture = Math.round(currentAperture * 10) / 10;
  
  const currentShutter = photo.params.shutterSpeedNum * Math.pow(2, -shutterAdj);
  let displayShutter: string;
  if (currentShutter >= 1) {
    displayShutter = `${Math.round(currentShutter)}s`;
  } else {
    displayShutter = `1/${Math.round(1 / currentShutter)}`;
  }

  const currentIso = photo.params.iso * Math.pow(2, isoAdj);
  const displayIso = Math.round(currentIso);

  const currentEv = photo.params.ev + apertureAdj + shutterAdj + isoAdj;

  return (
    <div className="fullscreen-mode" onClick={onClose}>
      <button
        className="fullscreen-close"
        onClick={onClose}
        aria-label="关闭"
      >
        ×
      </button>

      <div className="fullscreen-image-container" onClick={(e) => e.stopPropagation()}>
        <canvas ref={canvasRef} style={{ display: 'block', borderRadius: '4px' }} />
        <img
          ref={imgRef}
          src={photo.imageUrl}
          alt=""
          style={{ display: 'none' }}
          onLoad={drawImage}
          crossOrigin="anonymous"
        />

        <div className="fullscreen-params">
          <h4>拍摄参数</h4>
          <ul className="fullscreen-params-list">
            <li>
              <span className="param-label">光圈</span>
              <span className="param-value">f/{displayAperture}</span>
            </li>
            <li>
              <span className="param-label">快门</span>
              <span className="param-value">{displayShutter}s</span>
            </li>
            <li>
              <span className="param-label">ISO</span>
              <span className="param-value">{displayIso}</span>
            </li>
            <li>
              <span className="param-label">焦距</span>
              <span className="param-value">{photo.params.focalLength}mm</span>
            </li>
            <li>
              <span className="param-label">曝光值</span>
              <span className="param-value">EV {currentEv.toFixed(1)}</span>
            </li>
          </ul>
        </div>

        <div className="exposure-sliders">
          <div className="slider-group">
            <span className="slider-label">光圈</span>
            <span className="slider-value">f/{displayAperture}</span>
            <div className="slider-wrapper">
              <input
                type="range"
                min="-3"
                max="3"
                step="0.1"
                value={apertureAdj}
                onChange={(e) => setApertureAdj(parseFloat(e.target.value))}
              />
            </div>
          </div>

          <div className="slider-group">
            <span className="slider-label">快门</span>
            <span className="slider-value">{displayShutter}s</span>
            <div className="slider-wrapper">
              <input
                type="range"
                min="-3"
                max="3"
                step="0.1"
                value={shutterAdj}
                onChange={(e) => setShutterAdj(parseFloat(e.target.value))}
              />
            </div>
          </div>

          <div className="slider-group">
            <span className="slider-label">ISO</span>
            <span className="slider-value">{displayIso}</span>
            <div className="slider-wrapper">
              <input
                type="range"
                min="-3"
                max="3"
                step="0.1"
                value={isoAdj}
                onChange={(e) => setIsoAdj(parseFloat(e.target.value))}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
