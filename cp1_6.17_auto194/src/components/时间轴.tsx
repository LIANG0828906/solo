import React, { useState, useRef, useCallback } from 'react';
import { usePixelStore } from '../store';
import { assetManager } from '../AssetManager';
import { animator } from '../Animator';
import { Play, Pause, Plus } from 'lucide-react';

export const Timeline: React.FC = () => {
  const frames = usePixelStore(s => s.frames);
  const currentFrameIndex = usePixelStore(s => s.currentFrameIndex);
  const isPlaying = usePixelStore(s => s.isPlaying);
  const playProgress = usePixelStore(s => s.playProgress);
  const setCurrentFrameIndex = usePixelStore(s => s.setCurrentFrameIndex);
  const addFrame = usePixelStore(s => s.addFrame);
  const reorderFrames = usePixelStore(s => s.reorderFrames);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (isPlaying) return;
    setDragIndex(index);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setDropTargetIndex(index);
  };

  const handleDragEnd = () => {
    if (dragIndex !== null && dropTargetIndex !== null && dragIndex !== dropTargetIndex) {
      reorderFrames(dragIndex, dropTargetIndex);
    }
    setDragIndex(null);
    setDropTargetIndex(null);
    setIsDragging(false);
  };

  const renderThumbnail = (frameIndex: number) => {
    const frame = frames[frameIndex];
    if (!frame || frame.elements.length === 0) return null;

    return (
      <div
        className="w-full h-full relative overflow-hidden"
        style={{ background: '#3A3D42' }}
      >
        {frame.elements.map(el => {
          const asset = assetManager.getAsset(el.assetId);
          if (!asset) return null;
          const pixelSize = asset.category === 'sprite' ? 3 : 4;
          const scale = 64 / (GRID_SIZE * CELL_SIZE);
          const textureUrl = assetManager.getTextureUrl(el.assetId);
          return (
            <div
              key={el.id}
              className="absolute"
              style={{
                left: el.x * CELL_SIZE * scale,
                top: el.y * CELL_SIZE * scale,
                width: asset.width * pixelSize * el.scale * scale,
                height: asset.height * pixelSize * el.scale * scale,
                backgroundImage: `url(${textureUrl})`,
                backgroundSize: '100% 100%',
                imageRendering: 'pixelated',
                opacity: el.opacity / 100,
              }}
            />
          );
        })}
      </div>
    );
  };

  const GRID_SIZE = 32;
  const CELL_SIZE = 16;

  return (
    <div
      className="flex items-center gap-2 px-4"
      style={{
        height: 80,
        background: '#1A1C20',
      }}
    >
      <button
        className="flex items-center justify-center shrink-0 transition-all duration-200"
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: '#4A90D9',
          color: '#fff',
        }}
        onClick={() => addFrame()}
        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <Plus size={18} />
      </button>

      <div
        ref={timelineRef}
        className="flex-1 flex items-center gap-1 overflow-x-auto py-2"
        style={{ scrollbarWidth: 'thin' }}
      >
        {frames.map((frame, index) => (
          <React.Fragment key={frame.id}>
            {index > 0 && (
              <span
                className="shrink-0 flex items-center justify-center"
                style={{ color: '#4A90D9', fontSize: 16, fontWeight: 'bold' }}
              >
                →
              </span>
            )}
            <div className="relative shrink-0">
              {dropTargetIndex === index && dragIndex !== null && dragIndex !== index && (
                <div
                  className="absolute"
                  style={{
                    left: dragIndex > index ? -2 : 'auto',
                    right: dragIndex < index ? -2 : 'auto',
                    top: 0,
                    width: 2,
                    height: 48,
                    background: '#F5A623',
                    zIndex: 10,
                  }}
                />
              )}
              <div
                draggable={!isPlaying}
                className="relative cursor-pointer transition-all duration-200"
                style={{
                  width: 64,
                  height: 48,
                  borderRadius: 4,
                  border: currentFrameIndex === index
                    ? isPlaying
                      ? '3px solid #F5A623'
                      : '2px solid #F5A623'
                    : '1px solid #555A60',
                  opacity: isDragging && dragIndex === index ? 0.5 : 1,
                  overflow: 'hidden',
                }}
                onClick={() => !isPlaying && setCurrentFrameIndex(index)}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
              >
                {renderThumbnail(index)}
                <div
                  className="absolute bottom-0 left-0 right-0 text-center text-xs py-0.5"
                  style={{
                    background: 'rgba(0,0,0,0.6)',
                    color: '#BB86FC',
                    fontSize: 10,
                  }}
                >
                  {index + 1}
                </div>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isPlaying && (
          <span className="text-xs font-mono" style={{ color: '#BB86FC' }}>
            {playProgress}%
          </span>
        )}
        <button
          className="flex items-center justify-center transition-all duration-200"
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4A90D9, #5AA0E9)',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(74,144,217,0.3)',
          }}
          onClick={() => animator.toggle()}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
      </div>
    </div>
  );
};
