import React, { useRef, useState, useCallback } from 'react';
import Block from './Block';
import { useEditorStore } from '../stores/editorStore';
import { CANVAS_WIDTH, CANVAS_HEIGHT, calculateSnapPosition } from '../renderer/canvasRenderer';
import type { GuideLines } from '../renderer/canvasRenderer';
import './Canvas.css';

const Canvas: React.FC = () => {
  const { blocks, selectedBlockId, setSelectedBlockId, updateBlock } = useEditorStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [guides, setGuides] = useState<GuideLines>({ vertical: null, horizontal: null });
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    blockStartX: number;
    blockStartY: number;
    rafId: number | null;
    pendingX: number | null;
    pendingY: number | null;
  } | null>(null);

  const updatePosition = useCallback(() => {
    if (!dragStateRef.current || draggingId === null) return;

    const { pendingX, pendingY } = dragStateRef.current;
    if (pendingX === null || pendingY === null) {
      dragStateRef.current.rafId = requestAnimationFrame(updatePosition);
      return;
    }

    const block = blocks.find((b) => b.id === draggingId);
    if (block && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;

      const deltaX = (pendingX - dragStateRef.current.startX) * scaleX;
      const deltaY = (pendingY - dragStateRef.current.startY) * scaleY;

      const newX = dragStateRef.current.blockStartX + deltaX;
      const newY = dragStateRef.current.blockStartY + deltaY;

      const { x, y, guides: snapGuides } = calculateSnapPosition(block, newX, newY, blocks);
      updateBlock(draggingId, { x, y });
      setGuides(snapGuides);
    }

    dragStateRef.current.pendingX = null;
    dragStateRef.current.pendingY = null;
    dragStateRef.current.rafId = requestAnimationFrame(updatePosition);
  }, [draggingId, blocks, updateBlock]);

  const handleBlockMouseDown = useCallback(
    (e: React.MouseEvent, blockId: string) => {
      e.stopPropagation();
      const block = blocks.find((b) => b.id === blockId);
      if (!block) return;

      setSelectedBlockId(blockId);
      setDraggingId(blockId);

      dragStateRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        blockStartX: block.x,
        blockStartY: block.y,
        rafId: requestAnimationFrame(updatePosition),
        pendingX: null,
        pendingY: null,
      };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (dragStateRef.current) {
          dragStateRef.current.pendingX = moveEvent.clientX;
          dragStateRef.current.pendingY = moveEvent.clientY;
        }
      };

      const handleMouseUp = () => {
        if (dragStateRef.current?.rafId) {
          cancelAnimationFrame(dragStateRef.current.rafId);
        }
        dragStateRef.current = null;
        setDraggingId(null);
        setGuides({ vertical: null, horizontal: null });
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [blocks, setSelectedBlockId, updatePosition]
  );

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).dataset.canvas === 'true') {
      setSelectedBlockId(null);
    }
  };

  return (
    <div className="canvas-wrapper">
      <div
        ref={canvasRef}
        data-canvas="true"
        onClick={handleCanvasClick}
        className="canvas-page"
      >
        {guides.vertical !== null && (
          <div className="canvas-guide-v" style={{ left: guides.vertical }} />
        )}
        {guides.horizontal !== null && (
          <div className="canvas-guide-h" style={{ top: guides.horizontal }} />
        )}

        {blocks.map((block) => (
          <Block
            key={block.id}
            block={block}
            isSelected={selectedBlockId === block.id}
            isDragging={draggingId === block.id}
            onMouseDown={handleBlockMouseDown}
          />
        ))}
      </div>
    </div>
  );
};

export default Canvas;
