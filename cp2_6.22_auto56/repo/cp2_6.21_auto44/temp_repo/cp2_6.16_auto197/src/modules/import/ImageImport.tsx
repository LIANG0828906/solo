import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Upload, Scissors, Image as ImageIcon } from 'lucide-react';
import { useSpriteStore } from '@/store/spriteStore';
import { loadImage } from '@/utils/canvasUtils';
import type { Selection } from '@/types';
import './ImageImport.css';

export const ImageImport: React.FC = () => {
  const { spriteSheet, setSpriteSheet, setSelection, cutFrames } = useSpriteStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/png')) {
      alert('请上传 PNG 格式的精灵表图片');
      return;
    }
    try {
      const image = await loadImage(file);
      setSpriteSheet(image);
    } catch (err) {
      alert('图片加载失败');
    }
  }, [setSpriteSheet]);

  useEffect(() => {
    if (!spriteSheet.image || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const img = spriteSheet.image;
    const scaleX = (containerWidth - 20) / img.width;
    const scaleY = (containerHeight - 20) / img.height;
    const newScale = Math.min(scaleX, scaleY, 2);

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    if (spriteSheet.selection) {
      const { x, y, width, height } = spriteSheet.selection;

      ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
      ctx.fillRect(x, y, width, height);

      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, y);
      ctx.fillRect(0, y + height, canvas.width, canvas.height - y - height);
      ctx.fillRect(0, y, x, height);
      ctx.fillRect(x + width, y, canvas.width - x - width, height);

      const cols = Math.floor((img.width - x) / width);
      const rows = Math.floor((img.height - y) / height);
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
      ctx.lineWidth = 1;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (row === 0 && col === 0) continue;
          const gx = x + col * width;
          const gy = y + row * height;
          ctx.strokeRect(gx, gy, width, height);
        }
      }
    }

    setScale(newScale);
    setOffset({
      x: (containerWidth - img.width * newScale) / 2,
      y: (containerHeight - img.height * newScale) / 2,
    });
  }, [spriteSheet.image, spriteSheet.selection]);

  const getImageCoords = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor((clientX - rect.left) / scale);
    const y = Math.floor((clientY - rect.top) / scale);
    return {
      x: Math.max(0, Math.min(spriteSheet.width, x)),
      y: Math.max(0, Math.min(spriteSheet.height, y)),
    };
  }, [scale, spriteSheet.width, spriteSheet.height]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!spriteSheet.image) return;
    const coords = getImageCoords(e.clientX, e.clientY);
    setIsDragging(true);
    setDragStart(coords);
    setSelection({ x: coords.x, y: coords.y, width: 0, height: 0 });
  }, [spriteSheet.image, getImageCoords, setSelection]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return;
    const coords = getImageCoords(e.clientX, e.clientY);
    const x = Math.min(dragStart.x, coords.x);
    const y = Math.min(dragStart.y, coords.y);
    const width = Math.abs(coords.x - dragStart.x);
    const height = Math.abs(coords.y - dragStart.y);
    setSelection({ x, y, width, height });
  }, [isDragging, dragStart, getImageCoords, setSelection]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);

  const handleCut = useCallback(() => {
    if (!spriteSheet.selection || spriteSheet.selection.width === 0 || spriteSheet.selection.height === 0) {
      alert('请先框选帧区域');
      return;
    }
    cutFrames();
  }, [spriteSheet.selection, cutFrames]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="import-panel">
      <div className="panel-header">
        <ImageIcon size={16} />
        <span>精灵表导入</span>
      </div>
      <div className="import-content">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {!spriteSheet.image ? (
          <div className="upload-placeholder" onClick={handleUploadClick}>
            <Upload size={32} className="upload-icon" />
            <p>点击上传精灵表图片</p>
            <p className="upload-hint">支持 PNG 格式</p>
          </div>
        ) : (
          <>
            <div className="canvas-container" ref={containerRef}>
              <canvas
                ref={canvasRef}
                className="sprite-canvas"
                style={{
                  width: spriteSheet.width * scale,
                  height: spriteSheet.height * scale,
                  transform: `translate(${offset.x}px, ${offset.y}px)`,
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </div>

            <div className="import-info">
              <div className="info-row">
                <span>尺寸:</span>
                <span>{spriteSheet.width} x {spriteSheet.height}</span>
              </div>
              {spriteSheet.selection && (
                <div className="info-row">
                  <span>选框:</span>
                  <span>
                    {spriteSheet.selection.width} x {spriteSheet.selection.height}
                  </span>
                </div>
              )}
              {spriteSheet.selection && spriteSheet.selection.width > 0 && spriteSheet.selection.height > 0 && (
                <div className="info-row">
                  <span>预计帧数:</span>
                  <span>
                    {Math.floor((spriteSheet.width - spriteSheet.selection.x) / spriteSheet.selection.width) *
                      Math.floor((spriteSheet.height - spriteSheet.selection.y) / spriteSheet.selection.height)}
                  </span>
                </div>
              )}
            </div>

            <div className="import-actions">
              <button className="btn-secondary" onClick={handleUploadClick}>
                <Upload size={14} />
                重新上传
              </button>
              <button
                className="btn-primary"
                onClick={handleCut}
                disabled={!spriteSheet.selection || spriteSheet.selection.width === 0}
              >
                <Scissors size={14} />
                确认切割
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
