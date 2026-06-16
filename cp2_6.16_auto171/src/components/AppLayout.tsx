import React, { useEffect, useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  MouseSensor,
  TouchSensor,
  closestCenter
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

import { useAnimStore } from '../store';
import {
  ShapePaletteItem,
  AnimationPaletteItem,
  ShapeTypes,
  AnimationTypes,
  Block
} from '../types';
import { BlockPalette } from './BlockPalette';
import { EditPanel } from './EditPanel';
import { PreviewPanel } from './PreviewPanel';
import { ToastContainer } from './Toast';
import { Blocks, Menu, X, Zap } from 'lucide-react';

type DragSource = {
  category: 'shape' | 'animation';
  fromPalette: boolean;
  item: ShapePaletteItem | AnimationPaletteItem;
} | {
  blockId: string;
  type: 'animation-block';
  shapeId: string;
  index: number;
  block: Block;
};

export const AppLayout: React.FC = () => {
  const addShapeBlock = useAnimStore(s => s.addShapeBlock);
  const addAnimationBlock = useAnimStore(s => s.addAnimationBlock);
  const reorderAnimation = useAnimStore(s => s.reorderAnimation);
  const sequences = useAnimStore(s => s.sequences);
  const blocks = useAnimStore(s => s.blocks);

  const [isMobile, setIsMobile] = useState(false);
  const [paletteExpanded, setPaletteExpanded] = useState(false);
  const [activeDrag, setActiveDrag] = useState<{
    source: DragSource;
  } | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5
    }
  });
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 5 }
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 100, tolerance: 5 }
  });

  const sensors = useSensors(pointerSensor, mouseSensor, touchSensor);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as any;

    if (data.fromPalette) {
      setActiveDrag({
        source: {
          category: data.category,
          fromPalette: true,
          item: data.item
        }
      });
    } else if (data.type === 'animation-block') {
      setActiveDrag({
        source: {
          blockId: data.block.id,
          type: 'animation-block',
          shapeId: data.shapeId,
          index: data.index,
          block: data.block
        }
      });
    }
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !activeDrag) return;

    if (
      'type' in activeDrag.source &&
      activeDrag.source.type === 'animation-block'
    ) {
      const activeId = active.id as string;
      const overId = over.id as string;

      if (!activeId.startsWith('anim-') || !overId.startsWith('anim-')) return;
      if (activeId === overId) return;

      const shapeId = activeDrag.source.shapeId;
      const seq = sequences.find(s => s.shapeId === shapeId);
      if (!seq) return;

      const oldIndex = seq.animationIds.indexOf(activeId.replace('anim-', ''));
      const newIndex = seq.animationIds.indexOf(overId.replace('anim-', ''));

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      reorderAnimation(shapeId, oldIndex, newIndex);
    }
  }, [activeDrag, sequences, reorderAnimation]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!activeDrag) {
      setActiveDrag(null);
      return;
    }

    const source = activeDrag.source;

    if ('fromPalette' in source) {
      if (source.category === 'shape') {
        if (over) {
          addShapeBlock(source.item as ShapePaletteItem);
        }
      } else if (source.category === 'animation') {
        if (over) {
          const overData = over.data.current as any;

          let targetShapeId: string | null = null;
          let position: number | undefined;

          if (overData.type === 'shape-drop-area') {
            targetShapeId = overData.shapeId;
          } else if (over.id === 'edit-panel-main') {
            const firstShape = blocks.find(b => b.type === 'shape');
            if (firstShape) {
              targetShapeId = firstShape.id;
            }
          }

          if (targetShapeId) {
            addAnimationBlock(source.item as AnimationPaletteItem, targetShapeId, position);
          }
        }
      }
    }

    setActiveDrag(null);
  }, [activeDrag, blocks, addShapeBlock, addAnimationBlock]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full h-full flex flex-col bg-[#1a1a2e] text-[#e0e0e0]">
        {isMobile && (
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-[#16213e] border-b border-white/5 z-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#e94560] to-[#4ecdc4] flex items-center justify-center">
                <Zap size={16} className="text-white" />
              </div>
              <span className="font-bold text-sm">AnimBlocks</span>
            </div>
            <button
              onClick={() => setPaletteExpanded(!paletteExpanded)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              {paletteExpanded ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        )}

        {isMobile && paletteExpanded && (
          <div
            className="flex-shrink-0 z-40 overflow-hidden"
            style={{
              animation: 'slideDown 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            <BlockPalette />
          </div>
        )}

        <div
          className={`
            flex-1 flex overflow-hidden
            ${isMobile ? 'flex-col' : 'flex-row'}
          `}
        >
          {!isMobile && <BlockPalette />}
          <EditPanel isMobileVertical={isMobile} />
          <PreviewPanel isMobileVertical={isMobile} />
        </div>
      </div>

      <DragOverlay
        dropAnimation={{
          duration: 300,
          easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {activeDrag ? (
          <div
            className={`
              p-3 rounded-2xl shadow-2xl
              border-2 border-[#e94560]/40
              backdrop-blur-md
              ${'fromPalette' in activeDrag.source && activeDrag.source.category === 'shape'
                ? 'bg-[#0f3460]/95'
                : 'bg-[#16213e]/95'
              }
            `}
            style={{
              boxShadow: '0 20px 60px rgba(233, 69, 96, 0.3), 0 0 40px rgba(233, 69, 96, 0.1)'
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {'fromPalette' in activeDrag.source
                  ? activeDrag.source.item.icon
                  : 'block' in activeDrag.source
                    ? activeDrag.source.block.icon
                    : ''
                }
              </span>
              <span className="text-sm font-semibold text-[#e0e0e0]">
                {'fromPalette' in activeDrag.source
                  ? activeDrag.source.item.name
                  : 'block' in activeDrag.source
                    ? activeDrag.source.block.name
                    : ''
                }
              </span>
            </div>
          </div>
        ) : null}
      </DragOverlay>

      <ToastContainer />
    </DndContext>
  );
};
