import { useState, useRef, useEffect, useCallback } from 'react';

interface ImageCropperProps {
  file: File;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
  maxSizeMB?: number;
}

export default function ImageCropper({
  file,
  onConfirm,
  onCancel,
  maxSizeMB = 2,
}: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0, size: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, cropX: 0, cropY: 0 });

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        const size = Math.min(img.width, img.height);
        setCrop({
          x: (img.width - size) / 2,
          y: (img.height - size) / 2,
          size,
        });
        const displayWidth = Math.min(400, img.width);
        setScale(displayWidth / img.width);
        setImgLoaded(true);
        drawCanvas();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [file]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imgLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const sx = crop.x * scale;
    const sy = crop.y * scale;
    const ss = crop.size * scale;
    ctx.clearRect(sx, sy, ss, ss);
    ctx.drawImage(img, sx, sy, ss, ss, sx, sy, ss, ss);

    ctx.strokeStyle = '#4a8f4a';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, sy, ss, ss);

    ctx.beginPath();
    ctx.moveTo(sx + ss / 3, sy);
    ctx.lineTo(sx + ss / 3, sy + ss);
    ctx.moveTo(sx + (ss * 2) / 3, sy);
    ctx.lineTo(sx + (ss * 2) / 3, sy + ss);
    ctx.moveTo(sx, sy + ss / 3);
    ctx.lineTo(sx + ss, sy + ss / 3);
    ctx.moveTo(sx, sy + (ss * 2) / 3);
    ctx.lineTo(sx + ss, sy + (ss * 2) / 3);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [crop, scale, imgLoaded]);

  useEffect(() => {
    if (imgLoaded) drawCanvas();
  }, [imgLoaded, crop, scale, drawCanvas]);

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale,
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const coords = getCanvasCoords(e);
    dragRef.current = {
      startX: coords.x,
      startY: coords.y,
      cropX: crop.x,
      cropY: crop.y,
    };
    setIsDragging(true);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !imgRef.current) return;
    e.preventDefault();
    const coords = getCanvasCoords(e);
    const img = imgRef.current;
    let newX = dragRef.current.cropX + (coords.x - dragRef.current.startX);
    let newY = dragRef.current.cropY + (coords.y - dragRef.current.startY);
    newX = Math.max(0, Math.min(img.width - crop.size, newX));
    newY = Math.max(0, Math.min(img.height - crop.size, newY));
    setCrop((c) => ({ ...c, x: newX, y: newY }));
  };

  const handleEnd = () => setIsDragging(false);

  const handleZoom = (delta: number) => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    const newSize = Math.max(
      50,
      Math.min(Math.min(img.width, img.height), crop.size + delta)
    );
    const diff = crop.size - newSize;
    setCrop({
      x: Math.max(0, Math.min(img.width - newSize, crop.x + diff / 2)),
      y: Math.max(0, Math.min(img.height - newSize, crop.y + diff / 2)),
      size: newSize,
    });
  };

  const handleConfirm = () => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    const outputCanvas = document.createElement('canvas');
    const maxDim = 1024;
    let outSize = Math.min(maxDim, crop.size);
    outputCanvas.width = outSize;
    outputCanvas.height = outSize;
    const outCtx = outputCanvas.getContext('2d');
    if (!outCtx) return;
    outCtx.drawImage(
      img,
      crop.x,
      crop.y,
      crop.size,
      crop.size,
      0,
      0,
      outSize,
      outSize
    );

    const compress = (quality: number): Promise<Blob> =>
      new Promise((resolve) => {
        outputCanvas.toBlob(
          (blob) => {
            if (blob && blob.size > maxSizeMB * 1024 * 1024 && quality > 0.3) {
              resolve(compress(quality - 0.1));
            } else if (blob) {
              resolve(blob);
            }
          },
          'image/jpeg',
          quality
        );
      });

    compress(0.9).then(onConfirm);
  };

  return (
    <div>
      <div className="crop-canvas-wrapper">
        <canvas
          ref={canvasRef}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          style={{ cursor: isDragging ? 'grabbing' : 'grab', maxHeight: 350 }}
        />
      </div>
      <div className="crop-controls">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => handleZoom(-50)}
        >
          − 缩小
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => handleZoom(50)}
        >
          + 放大
        </button>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          取消
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleConfirm}
          disabled={!imgLoaded}
        >
          确认裁剪
        </button>
      </div>
    </div>
  );
}
