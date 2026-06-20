import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { CropArea, SetImageCallback, SetCropCallback } from './types';
import {
  validateFile,
  loadImageFromFile,
  computeDefaultCropArea,
  clampCropArea,
  CROP_RATIO,
} from './utils/imageCrop';

interface UploadPanelProps {
  onSetImage: SetImageCallback;
  onSetCrop: SetCropCallback;
  imageUrl: string | null;
  cropArea: CropArea | null;
}

const UploadPanel: React.FC<UploadPanelProps> = ({
  onSetImage,
  onSetCrop,
  imageUrl,
  cropArea,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showCrop, setShowCrop] = useState(false);
  const [tempImage, setTempImage] = useState<HTMLImageElement | null>(null);
  const [tempCrop, setTempCrop] = useState<CropArea | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[] | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      const check = validateFile(file);
      if (!check.ok) {
        alert(check.message);
        return;
      }
      try {
        const img = await loadImageFromFile(file);
        const url = img.src;
        setTempImage(img);
        const defaultCrop = computeDefaultCropArea(img.naturalWidth, img.naturalHeight);
        setTempCrop(defaultCrop);
        setShowCrop(true);
        onSetImage(url, img);
        onSetCrop(defaultCrop);
      } catch (e) {
        alert('图片加载失败，请重试');
      }
    },
    [onSetImage, onSetCrop]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!showCrop || !tempImage || !canvasRef.current || !tempCrop) return;
    const canvas = canvasRef.current;
    const maxW = Math.min(window.innerWidth * 0.7, 800);
    const maxH = Math.min(window.innerHeight * 0.65, 600);
    const iw = tempImage.naturalWidth;
    const ih = tempImage.naturalHeight;
    const scale = Math.min(maxW / iw, maxH / ih, 1);
    canvas.width = iw * scale;
    canvas.height = ih * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(tempImage, 0, 0, canvas.width, canvas.height);
  }, [showCrop, tempImage, tempCrop]);

  const getMaskStyle = (): React.CSSProperties => {
    if (!tempCrop || !canvasRef.current) return {};
    const canvas = canvasRef.current;
    return {
      left: `${tempCrop.x * canvas.width}px`,
      top: `${tempCrop.y * canvas.height}px`,
      width: `${tempCrop.width * canvas.width}px`,
      height: `${tempCrop.height * canvas.height}px`,
    };
  };

  const onMaskMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current || !tempCrop) return;
    e.preventDefault();
    e.stopPropagation();
    const point = 'touches' in e ? e.touches[0] : e;
    dragStateRef.current = {
      startX: point.clientX,
      startY: point.clientY,
      origX: tempCrop.x,
      origY: tempCrop.y,
    };

    const onMove = (ev: MouseEvent | TouchEvent) => {
      if (!dragStateRef.current || !canvasRef.current || !tempCrop) return;
      const canvas = canvasRef.current;
      const p = 'touches' in ev ? ev.touches[0] : (ev as MouseEvent);
      const dx = (p.clientX - dragStateRef.current.startX) / canvas.width;
      const dy = (p.clientY - dragStateRef.current.startY) / canvas.height;
      const next = clampCropArea({
        x: dragStateRef.current.origX + dx,
        y: dragStateRef.current.origY + dy,
        width: tempCrop.width,
        height: tempCrop.height,
      });
      setTempCrop(next);
    };
    const onUp = () => {
      dragStateRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
  };

  const onConfirmCrop = () => {
    if (!tempCrop) return;
    onSetCrop(tempCrop);
    setShowCrop(false);
  };

  const onCancelCrop = () => {
    setShowCrop(false);
  };

  const openReCrop = () => {
    if (!imageUrl) return;
    setShowCrop(true);
    setTempCrop(cropArea || computeDefaultCropArea(100, 140));
  };

  return (
    <div className="upload-panel">
      <div className="panel-title">📷 上传书法作品</div>

      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="upload-hint">
          <strong>点击或拖拽上传</strong>
          JPG / PNG 格式
          <br />
          最大 10MB
          <br />
          自动按 1:1.4 竖长比例裁剪
        </div>
      </div>

      {imageUrl && (
        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={openReCrop}
            style={{ width: '100%' }}
          >
            🔧 重新裁剪区域
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        className="upload-input"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {showCrop && (
        <div className="crop-overlay" onClick={onCancelCrop}>
          <div className="crop-container" onClick={(e) => e.stopPropagation()}>
            <div className="panel-title" style={{ textAlign: 'center' }}>
              ✂️ 调整裁剪区域（竖长 1:1.4 比例）
            </div>
            <div
              className="crop-canvas-wrap"
              style={{ display: 'inline-block' }}
            >
              <canvas ref={canvasRef} />
              {tempCrop && (
                <div
                  ref={maskRef}
                  className="crop-mask"
                  style={getMaskStyle()}
                  onMouseDown={onMaskMouseDown}
                  onTouchStart={onMaskMouseDown}
                />
              )}
            </div>
            <div className="crop-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={onCancelCrop}
              >
                取消
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={onConfirmCrop}
              >
                确认裁剪
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadPanel;
