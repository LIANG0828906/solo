import React, { useCallback, useRef, useState } from 'react';
import { usePixelStore, SceneElement } from '../store';
import { assetManager } from '../AssetManager';
import { sceneEditor } from '../SceneEditor';

const GRID_SIZE = 32;
const CELL_SIZE = 16;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;

export const Canvas: React.FC = () => {
  const frames = usePixelStore(s => s.frames);
  const currentFrameIndex = usePixelStore(s => s.currentFrameIndex);
  const selectedElementId = usePixelStore(s => s.selectedElementId);
  const isPlaying = usePixelStore(s => s.isPlaying);
  const addElement = usePixelStore(s => s.addElement);
  const setSelectedElement = usePixelStore(s => s.setSelectedElement);

  const [placingId, setPlacingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentFrame = frames[currentFrameIndex];
  const elements = currentFrame?.elements ?? [];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const assetId = e.dataTransfer.getData('assetId');
    if (!assetId) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
    const clampedX = Math.max(0, Math.min(GRID_SIZE - 1, x));
    const clampedY = Math.max(0, Math.min(GRID_SIZE - 1, y));

    addElement({
      assetId,
      x: clampedX,
      y: clampedY,
      scale: 1,
      opacity: 100,
    });
    setPlacingId(assetId);
    setTimeout(() => setPlacingId(null), 200);
  }, [addElement]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (isPlaying) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    let found: SceneElement | null = null;
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      const asset = assetManager.getAsset(el.assetId);
      if (!asset) continue;
      const pixelSize = asset.category === 'sprite' ? 3 : 4;
      const elWidth = asset.width * pixelSize * el.scale;
      const elHeight = asset.height * pixelSize * el.scale;
      const elX = el.x * CELL_SIZE;
      const elY = el.y * CELL_SIZE;

      if (clickX >= elX && clickX <= elX + elWidth && clickY >= elY && clickY <= elY + elHeight) {
        found = el;
        break;
      }
    }

    sceneEditor.selectElement(found?.id ?? null);
  }, [elements, isPlaying]);

  const renderElement = (el: SceneElement) => {
    const asset = assetManager.getAsset(el.assetId);
    if (!asset) return null;

    const pixelSize = asset.category === 'sprite' ? 3 : 4;
    const imgWidth = asset.width * pixelSize;
    const imgHeight = asset.height * pixelSize;
    const isPlacing = placingId === el.assetId && elements.indexOf(el) === elements.length - 1;
    const isSelected = selectedElementId === el.id && !isPlaying;
    const textureUrl = assetManager.getTextureUrl(el.assetId);

    return (
      <div
        key={el.id}
        className="absolute cursor-pointer"
        style={{
          left: el.x * CELL_SIZE,
          top: el.y * CELL_SIZE,
          width: imgWidth * el.scale,
          height: imgHeight * el.scale,
          opacity: el.opacity / 100,
          backgroundImage: `url(${textureUrl})`,
          backgroundSize: '100% 100%',
          imageRendering: 'pixelated',
          animation: isPlacing ? 'placeElement 200ms ease-out' : undefined,
          border: isSelected ? '1px dashed #F5A623' : undefined,
          animationName: isSelected ? 'dashMove' : isPlacing ? 'placeElement' : undefined,
          animationDuration: isSelected ? '0.5s' : '200ms',
          animationTimingFunction: isSelected ? 'linear' : 'ease-out',
          animationIterationCount: isSelected ? 'infinite' : '1',
          zIndex: isSelected ? 10 : 1,
          pointerEvents: isPlaying ? 'none' : 'auto',
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (!isPlaying) {
            sceneEditor.selectElement(el.id);
          }
        }}
      />
    );
  };

  return (
    <div className="relative flex flex-col items-center">
      {isPlaying && (
        <div className="mb-2 text-sm font-mono" style={{ color: '#BB86FC' }}>
          播放进度: {usePixelStore.getState().playProgress}%
        </div>
      )}
      <div
        ref={containerRef}
        className="relative"
        style={{
          width: CANVAS_SIZE,
          height: CANVAS_SIZE,
          backgroundColor: '#3A3D42',
          backgroundImage: `
            linear-gradient(to right, #555A60 0.5px, transparent 0.5px),
            linear-gradient(to bottom, #555A60 0.5px, transparent 0.5px)
          `,
          backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
          border: dragOver ? '2px dashed #F5A623' : '2px solid #555A60',
          borderRadius: '4px',
          transition: 'border-color 0.2s',
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleCanvasClick}
      >
        {elements.map(renderElement)}

        {elements.length === 0 && !isPlaying && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
            style={{ color: '#555A60', fontSize: '18px' }}
          >
            拖拽素材到这里开始创作
          </div>
        )}
      </div>
    </div>
  );
};
