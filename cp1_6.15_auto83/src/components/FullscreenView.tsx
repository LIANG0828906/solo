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

    canvas.width = drawWidth;
    canvas.height = drawHeight;

    ctx.filter = `brightness(${brightness}) contrast(${contrast})`;
    ctx.drawImage(img, 0, 0, drawWidth, drawHeight);
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
