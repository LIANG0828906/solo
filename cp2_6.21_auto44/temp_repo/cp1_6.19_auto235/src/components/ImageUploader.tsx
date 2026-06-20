import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Check, Image as ImageIcon } from 'lucide-react';
import { useDesignStore } from '../store/useDesignStore';
import { useColorExtractor } from '../hooks/useColorExtractor';

interface CropArea {
  x: number;
  y: number;
  size: number;
}

export const ImageUploader: React.FC = () => {
  const originalImage = useDesignStore(state => state.originalImage);
  const croppedImage = useDesignStore(state => state.croppedImage);
  const setOriginalImage = useDesignStore(state => state.setOriginalImage);
  const setCroppedImage = useDesignStore(state => state.setCroppedImage);
  const setError = useDesignStore(state => state.setError);
  const error = useDesignStore(state => state.error);

  const { extractColors } = useColorExtractor();

  const [isDragging, setIsDragging] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, size: 100 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; crop: CropArea } | null>(null);

  const MAX_WIDTH = 1600;
  const MAX_HEIGHT = 1200;

  const validateImage = useCallback((file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (img.width > MAX_WIDTH || img.height > MAX_HEIGHT) {
          setError(`图片尺寸过大，最大支持 ${MAX_WIDTH}x${MAX_HEIGHT}px`);
          resolve(false);
        } else {
          setError(null);
          resolve(true);
        }
      };
      img.onerror = () => {
        setError('图片加载失败，请检查文件格式');
        resolve(false);
      };
      img.src = URL.createObjectURL(file);
    });
  }, [setError]);

  const handleFile = useCallback(async (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('仅支持 JPEG 和 PNG 格式的图片');
      return;
    }

    const isValid = await validateImage(file);
    if (!isValid) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setOriginalImage(dataUrl);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  }, [validateImage, setOriginalImage, setError]);

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

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFile]);

  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      const { width, height } = imageRef.current;
      setImageSize({ width, height });
      const minDim = Math.min(width, height);
      const initialSize = minDim * 0.8;
      setCropArea({
        x: (width - initialSize) / 2,
        y: (height - initialSize) / 2,
        size: initialSize
      });
    }
  }, []);

  const handleCropMouseDown = useCallback((e: React.MouseEvent, handle?: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
    } else {
      setIsResizing(false);
      setResizeHandle(null);
    }

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      crop: { ...cropArea }
    };
  }, [cropArea]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStartRef.current) return;

    const { x: startX, y: startY, crop: startCrop } = dragStartRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (isResizing && resizeHandle) {
      let newSize = startCrop.size;
      let newX = startCrop.x;
      let newY = startCrop.y;

      switch (resizeHandle) {
        case 'top-left':
          newSize = Math.max(50, startCrop.size - dx);
          newSize = Math.min(newSize, Math.min(imageSize.width, imageSize.height));
          newX = startCrop.x + (startCrop.size - newSize);
          newY = startCrop.y + (startCrop.size - newSize);
          break;
        case 'top-right':
          newSize = Math.max(50, startCrop.size + dx);
          newSize = Math.min(newSize, Math.min(imageSize.width - startCrop.x, imageSize.height));
          newY = startCrop.y + (startCrop.size - newSize);
          break;
        case 'bottom-left':
          newSize = Math.max(50, startCrop.size - dx);
          newSize = Math.min(newSize, Math.min(imageSize.width, imageSize.height - startCrop.y));
          newX = startCrop.x + (startCrop.size - newSize);
          break;
        case 'bottom-right':
          newSize = Math.max(50, startCrop.size + dx);
          newSize = Math.min(newSize, Math.min(imageSize.width - startCrop.x, imageSize.height - startCrop.y));
          break;
      }

      newX = Math.max(0, Math.min(newX, imageSize.width - newSize));
      newY = Math.max(0, Math.min(newY, imageSize.height - newSize));

      setCropArea({ x: newX, y: newY, size: newSize });
    } else {
      let newX = startCrop.x + dx;
      let newY = startCrop.y + dy;

      newX = Math.max(0, Math.min(newX, imageSize.width - cropArea.size));
      newY = Math.max(0, Math.min(newY, imageSize.height - cropArea.size));

      setCropArea(prev => ({ ...prev, x: newX, y: newY }));
    }
  }, [isResizing, resizeHandle, cropArea.size, imageSize]);

  const handleMouseUp = useCallback(() => {
    dragStartRef.current = null;
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  useEffect(() => {
    if (showCropper) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [showCropper, handleMouseMove, handleMouseUp]);

  const confirmCrop = useCallback(() => {
    if (!imageRef.current || !originalImage) return;

    const canvas = document.createElement('canvas');
    canvas.width = cropArea.size;
    canvas.height = cropArea.size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      imageRef.current,
      cropArea.x,
      cropArea.y,
      cropArea.size,
      cropArea.size,
      0,
      0,
      cropArea.size,
      cropArea.size
    );

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCroppedImage(croppedDataUrl);
    setShowCropper(false);
    extractColors(croppedDataUrl);
  }, [originalImage, cropArea, setCroppedImage, extractColors]);

  const cancelCrop = useCallback(() => {
    setShowCropper(false);
    setOriginalImage(null);
  }, [setOriginalImage]);

  const resetImage = useCallback(() => {
    setOriginalImage(null);
    setCroppedImage(null);
    setShowCropper(false);
  }, [setOriginalImage, setCroppedImage]);

  if (showCropper && originalImage) {
    return (
      <div className="crop-container" ref={containerRef}>
        <h3 className="section-title">调整裁剪区域（1:1比例）</h3>
        <div className="crop-image-wrapper">
          <img
            ref={imageRef}
            src={originalImage}
            alt="Original"
            className="crop-image"
            onLoad={handleImageLoad}
            draggable={false}
          />
          <div
            className="crop-box"
            style={{
              left: cropArea.x,
              top: cropArea.y,
              width: cropArea.size,
              height: cropArea.size
            }}
            onMouseDown={(e) => handleCropMouseDown(e)}
          >
            <div
              className="crop-handle top-left"
              onMouseDown={(e) => handleCropMouseDown(e, 'top-left')}
            />
            <div
              className="crop-handle top-right"
              onMouseDown={(e) => handleCropMouseDown(e, 'top-right')}
            />
            <div
              className="crop-handle bottom-left"
              onMouseDown={(e) => handleCropMouseDown(e, 'bottom-left')}
            />
            <div
              className="crop-handle bottom-right"
              onMouseDown={(e) => handleCropMouseDown(e, 'bottom-right')}
            />
          </div>
        </div>
        <div className="crop-actions">
          <button className="btn btn-secondary" onClick={cancelCrop}>
            <X size={16} />
            取消
          </button>
          <button className="btn btn-primary" onClick={confirmCrop}>
            <Check size={16} />
            确认裁剪
          </button>
        </div>
      </div>
    );
  }

  if (croppedImage) {
    return (
      <div className="crop-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '16px' }}>
          <h3 className="section-title" style={{ marginBottom: 0 }}>裁剪预览</h3>
          <button className="btn btn-secondary" onClick={resetImage}>
            <X size={16} />
            重新上传
          </button>
        </div>
        <div className="crop-image-wrapper">
          <img
            src={croppedImage}
            alt="Cropped"
            className="crop-image"
            style={{ maxWidth: '300px', maxHeight: '300px' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && <div className="error-message">{error}</div>}
      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="upload-icon">
          <Upload size={48} />
        </div>
        <div className="upload-text">
          拖拽图片到此处，或点击上传
        </div>
        <div className="upload-hint">
          支持 JPEG/PNG 格式，最大尺寸 {MAX_WIDTH}x{MAX_HEIGHT}px
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          <ImageIcon size={14} />
          <span>上传后将自动裁剪为 1:1 比例</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          onChange={handleInputChange}
        />
      </div>
    </div>
  );
};
