import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useMoodBoardStore } from '../store/useMoodBoardStore';
import type { CanvasBlock, ColorSwatch } from '../types';
import { MaterialManager } from './MaterialManager';
import { ColorExtractor } from './ColorExtractor';
import { AnnotationManager } from './AnnotationManager';
import { MaterialItem as MaterialItemComponent } from './MaterialItem';
import { ArrowAnnotation } from './ArrowAnnotation';
import { ColorPaletteBar } from './ColorPaletteBar';
import { MaterialSidebar } from './MaterialSidebar';
import styles from './MoodBoardCanvas.module.css';

interface MoodBoardCanvasProps {
  materialManager: MaterialManager;
  colorExtractor: typeof ColorExtractor;
  annotationManager: AnnotationManager;
}

export const MoodBoardCanvas: React.FC<MoodBoardCanvasProps> = ({
  materialManager,
  colorExtractor,
  annotationManager,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isDrawingAnnotation, setIsDrawingAnnotation] = useState(false);
  const [annotationStartPos, setAnnotationStartPos] = useState<{ x: number; y: number } | null>(null);
  const [fps, setFps] = useState(60);

  const {
    blocks,
    colorSwatches,
    annotations,
    selectedId,
    zoom,
    panX,
    panY,
    addBlock,
    updateBlock,
    deleteBlock,
    addColorSwatch,
    removeColorSwatch,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    setSelectedId,
    setZoom,
    setPan,
    bringToFront,
  } = useMoodBoardStore();

  const dragState = useRef<{
    isDragging: boolean;
    blockId: string | null;
    startX: number;
    startY: number;
    blockStartX: number;
    blockStartY: number;
  }>({
    isDragging: false,
    blockId: null,
    startX: 0,
    startY: 0,
    blockStartX: 0,
    blockStartY: 0,
  });

  const frameCount = useRef(0);
  const lastFpsUpdate = useRef(performance.now());

  useEffect(() => {
    const updateFps = () => {
      frameCount.current++;
      const now = performance.now();
      if (now - lastFpsUpdate.current >= 1000) {
        setFps(frameCount.current);
        frameCount.current = 0;
        lastFpsUpdate.current = now;
      }
      requestAnimationFrame(updateFps);
    };
    const id = requestAnimationFrame(updateFps);
    return () => cancelAnimationFrame(id);
  }, []);

  const screenToCanvas = useCallback(
    (clientX: number, clientY: number) => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      return {
        x: (clientX - rect.left) / zoom - panX,
        y: (clientY - rect.top) / zoom - panY,
      };
    },
    [zoom, panX, panY]
  );

  const currentMaxZ = useMemo(() => {
    const blockZ = blocks.reduce((max, b) => Math.max(max, b.zIndex), 0);
    const annZ = annotations.reduce((max, a) => Math.max(max, a.zIndex), 0);
    return Math.max(blockZ, annZ);
  }, [blocks, annotations]);

  const handleDragStart = useCallback(
    (blockId: string, e: React.MouseEvent) => {
      const block = blocks.find((b) => b.id === blockId);
      if (!block) return;

      bringToFront(blockId);
      dragState.current = {
        isDragging: true,
        blockId,
        startX: e.clientX,
        startY: e.clientY,
        blockStartX: block.x,
        blockStartY: block.y,
      };
    },
    [blocks, bringToFront]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragState.current.isDragging && dragState.current.blockId) {
        const deltaX = (e.clientX - dragState.current.startX) / zoom;
        const deltaY = (e.clientY - dragState.current.startY) / zoom;

        updateBlock(dragState.current.blockId, {
          x: dragState.current.blockStartX + deltaX,
          y: dragState.current.blockStartY + deltaY,
        });
      }

      if (isResizingSidebar) {
        const newWidth = e.clientX;
        setSidebarWidth(Math.min(500, Math.max(200, newWidth)));
      }

      if (isDrawingAnnotation && annotationStartPos) {
        const pos = screenToCanvas(e.clientX, e.clientY);
        const lastAnn = annotations[annotations.length - 1];
        if (lastAnn) {
          updateAnnotation(lastAnn.id, {
            endX: pos.x,
            endY: pos.y,
          });
        }
      }
    };

    const handleMouseUp = () => {
      dragState.current.isDragging = false;
      dragState.current.blockId = null;
      setIsResizingSidebar(false);
      if (isDrawingAnnotation) {
        setIsDrawingAnnotation(false);
        setAnnotationStartPos(null);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    zoom,
    updateBlock,
    isResizingSidebar,
    isDrawingAnnotation,
    annotationStartPos,
    screenToCanvas,
    annotations,
    updateAnnotation,
  ]);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!canvasRef.current) return;
      e.preventDefault();

      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.min(3, Math.max(0.2, zoom * zoomDelta));

      const canvasX = mouseX / zoom - panX;
      const canvasY = mouseY / zoom - panY;

      const newPanX = mouseX / newZoom - canvasX;
      const newPanY = mouseY / newZoom - canvasY;

      setZoom(newZoom);
      setPan(newPanX, newPanY);
    },
    [zoom, panX, panY, setZoom, setPan]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleCanvasDrop = useCallback(
    (e: React.DragEvent) => {
      if (!canvasRef.current) return;

      const pos = screenToCanvas(e.clientX, e.clientY);
      const block = materialManager.handleDrop(e, pos.x, pos.y, currentMaxZ);
      if (block) {
        addBlock(block);
      }
    },
    [screenToCanvas, materialManager, currentMaxZ, addBlock]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current) {
        setSelectedId(null);
      }
    },
    [setSelectedId]
  );

  const handleImageClick = useCallback(
    (imageEl: HTMLImageElement, x: number, y: number, blockId: string) => {
      const hex = colorExtractor.extractFromImage(imageEl, x, y);
      if (hex) {
        const swatch: ColorSwatch = {
          id: colorExtractor.generateId(),
          hex,
          sourceBlockId: blockId,
        };
        addColorSwatch(swatch);
      }
    },
    [colorExtractor, addColorSwatch]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== canvasRef.current) return;
      e.preventDefault();

      const pos = screenToCanvas(e.clientX, e.clientY);

      if (e.shiftKey) {
        const annotation = annotationManager.createAnnotation(
          pos.x,
          pos.y,
          currentMaxZ
        );
        addAnnotation(annotation);
        setIsDrawingAnnotation(true);
        setAnnotationStartPos({ x: pos.x, y: pos.y });
        setSelectedId(annotation.id);
      } else {
        const block = materialManager.createNewTextBlock(
          pos.x - 75,
          pos.y - 30,
          currentMaxZ
        );
        addBlock(block);
      }
    },
    [
      screenToCanvas,
      annotationManager,
      currentMaxZ,
      addAnnotation,
      addBlock,
      materialManager,
      setSelectedId,
    ]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (selectedId && (e.key === 'Delete' || e.key === 'Backspace')) {
        const block = blocks.find((b) => b.id === selectedId);
        const ann = annotations.find((a) => a.id === selectedId);
        if (block) {
          deleteBlock(selectedId);
        } else if (ann) {
          deleteAnnotation(selectedId);
        }
      }
      if (e.key === 'Escape') {
        setSelectedId(null);
      }
    },
    [selectedId, blocks, annotations, deleteBlock, deleteAnnotation, setSelectedId]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const sortedBlocks = useMemo(
    () => [...blocks].sort((a, b) => a.zIndex - b.zIndex),
    [blocks]
  );

  const sortedAnnotations = useMemo(
    () => [...annotations].sort((a, b) => a.zIndex - b.zIndex),
    [annotations]
  );

  const selectedBlock = blocks.find((b) => b.id === selectedId);
  const selectedAnnotation = annotations.find((a) => a.id === selectedId);

  return (
    <div className={styles.app}>
      <ColorPaletteBar swatches={colorSwatches} onRemoveSwatch={removeColorSwatch} />

      <div className={styles.mainContent}>
        <div style={{ width: sidebarWidth, flexShrink: 0 }}>
          <MaterialSidebar materialManager={materialManager} />
        </div>

        <div
          className={`${styles.divider} ${isResizingSidebar ? styles.active : ''}`}
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizingSidebar(true);
          }}
        />

        <div
          ref={containerRef}
          className={styles.canvasContainer}
          onDrop={handleCanvasDrop}
          onDragOver={handleDragOver}
        >
          <div
            ref={canvasRef}
            className={styles.canvas}
            style={{
              backgroundImage: `
                radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)
              `,
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              backgroundPosition: `${panX * zoom}px ${panY * zoom}px`,
            }}
            onClick={handleCanvasClick}
            onDoubleClick={handleDoubleClick}
          >
            <div
              className={styles.canvasTransform}
              style={{
                transform: `scale(${zoom}) translate3d(${panX}px, ${panY}px, 0)`,
                transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              }}
            >
              {sortedAnnotations.map((ann) => (
                <ArrowAnnotation
                  key={ann.id}
                  annotation={ann}
                  isSelected={selectedId === ann.id}
                  zoom={zoom}
                  onSelect={setSelectedId}
                  onUpdate={updateAnnotation}
                  onDelete={deleteAnnotation}
                />
              ))}

              {sortedBlocks.map((block) => (
                <MaterialItemComponent
                  key={block.id}
                  block={block}
                  isSelected={selectedId === block.id}
                  zoom={zoom}
                  onSelect={setSelectedId}
                  onDragStart={handleDragStart}
                  onUpdate={updateBlock}
                  onUpdateComplete={updateBlock}
                  onImageClick={(el, x, y) => handleImageClick(el, x, y, block.id)}
                  onDelete={deleteBlock}
                />
              ))}
            </div>
          </div>

          <div className={styles.hud}>
            <div className={styles.hudItem}>
              <span className={styles.hudLabel}>缩放</span>
              <span className={styles.hudValue}>{Math.round(zoom * 100)}%</span>
            </div>
            <div className={styles.hudItem}>
              <span className={styles.hudLabel}>FPS</span>
              <span className={`${styles.hudValue} ${fps >= 50 ? styles.goodFps : styles.badFps}`}>
                {fps}
              </span>
            </div>
            <div className={styles.hudItem}>
              <span className={styles.hudLabel}>元素</span>
              <span className={styles.hudValue}>{blocks.length + annotations.length}</span>
            </div>
          </div>

          <div className={styles.tips}>
            <span>💡 双击画布添加文字 | Shift+双击添加箭头标注 | 滚轮缩放画布</span>
          </div>

          <button
            className={styles.resetBtn}
            onClick={() => {
              setZoom(1);
              setPan(0, 0);
            }}
          >
            重置视图
          </button>
        </div>
      </div>
    </div>
  );
};
