import React, { useRef, useState, useEffect, useCallback } from 'react';
import { usePlanStore } from '@/store/usePlanStore';
import {
  SLOT_WIDTH,
  TOTAL_SLOTS,
  LANE_HEIGHT,
  MAX_LANES,
  MINUTE_PER_SLOT,
  snapToSlot,
  minutesToTime,
  clampMinutes,
} from '@/lib/constants';
import type { TimeBlock } from '@/types';
import styles from './PlanTimeline.module.css';

interface PlanTimelineProps {
  onCreateBlock: (startTime: number, endTime: number) => void;
  onBlockClick?: (block: TimeBlock) => void;
}

interface DragInfo {
  type: 'create' | 'move';
  startSlot: number;
  currentSlot: number;
  blockId?: string;
  originalStart?: number;
  originalEnd?: number;
  edge?: 'left' | 'right' | 'body';
}

const TIMELINE_WIDTH = SLOT_WIDTH * TOTAL_SLOTS;
const HEADER_HEIGHT = 44;

export default function PlanTimeline({ onCreateBlock, onBlockClick }: PlanTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragInfo | null>(null);
  const rafRef = useRef<number>(0);
  const documentListenersActive = useRef(false);
  const mouseMoveHandlerRef = useRef<(e: MouseEvent) => void>(() => {});
  const mouseUpHandlerRef = useRef<() => void>(() => {});

  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  const [dragState, setDragState] = useState<DragInfo | null>(null);

  const blocks = usePlanStore((s) => s.blocks);
  const moveBlock = usePlanStore((s) => s.moveBlock);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.getHours() * 60 + now.getMinutes());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      const slot = Math.floor(currentTime / MINUTE_PER_SLOT);
      const target = slot * SLOT_WIDTH - scrollRef.current.clientWidth / 2;
      scrollRef.current.scrollLeft = Math.max(0, target);
    }
  }, [currentTime]);

  const getSlotFromX = useCallback((clientX: number): number => {
    if (!scrollRef.current) return 0;
    const rect = scrollRef.current.getBoundingClientRect();
    const x = clientX - rect.left + scrollRef.current.scrollLeft;
    return Math.max(0, Math.min(TOTAL_SLOTS - 1, Math.floor(x / SLOT_WIDTH)));
  }, []);

  const findAvailableLane = useCallback(
    (startMin: number, endMin: number, excludeId?: string): number => {
      for (let lane = 0; lane < MAX_LANES; lane++) {
        const conflict = blocks.some(
          (b) => b.id !== excludeId && b.lane === lane && startMin < b.endTime && endMin > b.startTime,
        );
        if (!conflict) return lane;
      }
      return 0;
    },
    [blocks],
  );

  const handleDocumentMouseLeave = useCallback(() => {
    // Don't cancel drag on mouseleave
  }, []);

  const documentMouseMoveHandler = useCallback((e: MouseEvent) => {
    mouseMoveHandlerRef.current(e);
  }, []);

  const documentMouseUpHandler = useCallback(() => {
    mouseUpHandlerRef.current();
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      const blockEl = target.closest('[data-block-id]');

      if (blockEl) {
        const blockId = blockEl.getAttribute('data-block-id')!;
        const block = blocks.find((b) => b.id === blockId);
        if (!block) return;

        const edgeEl = target.closest('[data-edge]');
        const edge = edgeEl ? (edgeEl.getAttribute('data-edge') as 'left' | 'right') : 'body';

        dragRef.current = {
          type: 'move',
          startSlot: getSlotFromX(e.clientX),
          currentSlot: getSlotFromX(e.clientX),
          blockId,
          originalStart: block.startTime,
          originalEnd: block.endTime,
          edge,
        };
        setDragState({ ...dragRef.current });
      } else {
        const slot = getSlotFromX(e.clientX);
        dragRef.current = {
          type: 'create',
          startSlot: slot,
          currentSlot: slot,
        };
        setDragState({ ...dragRef.current });
      }

      e.preventDefault();

      if (!documentListenersActive.current) {
        document.addEventListener('mousemove', documentMouseMoveHandler);
        document.addEventListener('mouseup', documentMouseUpHandler);
        document.addEventListener('mouseleave', handleDocumentMouseLeave);
        documentListenersActive.current = true;
      }
    },
    [blocks, getSlotFromX, documentMouseMoveHandler, documentMouseUpHandler, handleDocumentMouseLeave],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragRef.current) return;
      const slot = getSlotFromX(e.clientX);

      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (!dragRef.current) return;
        dragRef.current = { ...dragRef.current, currentSlot: slot };
        setDragState({ ...dragRef.current });
      });
    },
    [getSlotFromX],
  );

  const handleMouseUp = useCallback(() => {
    if (!dragRef.current) return;
    const drag = dragRef.current;

    if (drag.type === 'create') {
      const startSlot = Math.min(drag.startSlot, drag.currentSlot);
      const endSlot = Math.max(drag.startSlot, drag.currentSlot) + 1;
      if (endSlot > startSlot) {
        const startMin = snapToSlot(startSlot * MINUTE_PER_SLOT);
        const endMin = snapToSlot(endSlot * MINUTE_PER_SLOT);
        if (endMin > startMin) {
          onCreateBlock(startMin, endMin);
        }
      }
    } else if (drag.type === 'move' && drag.blockId) {
      const deltaSlots = drag.currentSlot - drag.startSlot;
      if (deltaSlots === 0 && onBlockClick) {
        const block = blocks.find(b => b.id === drag.blockId);
        if (block) onBlockClick(block);
      } else {
        const deltaMin = deltaSlots * MINUTE_PER_SLOT;

        if (drag.edge === 'left') {
          const newStart = clampMinutes(snapToSlot(drag.originalStart! + deltaMin));
          const newEnd = drag.originalEnd!;
          if (newEnd > newStart) {
            moveBlock(drag.blockId, newStart, newEnd);
          }
        } else if (drag.edge === 'right') {
          const newStart = drag.originalStart!;
          const newEnd = clampMinutes(snapToSlot(drag.originalEnd! + deltaMin));
          if (newEnd > newStart) {
            moveBlock(drag.blockId, newStart, newEnd);
          }
        } else {
          const duration = drag.originalEnd! - drag.originalStart!;
          let newStart = clampMinutes(snapToSlot(drag.originalStart! + deltaMin));
          let newEnd = newStart + duration;
          if (newEnd > 1440) {
            newEnd = 1440;
            newStart = newEnd - duration;
          }
          newStart = Math.max(0, newStart);
          moveBlock(drag.blockId, newStart, newEnd);
        }
      }
    }

    dragRef.current = null;
    setDragState(null);

    if (documentListenersActive.current) {
      document.removeEventListener('mousemove', documentMouseMoveHandler);
      document.removeEventListener('mouseup', documentMouseUpHandler);
      document.removeEventListener('mouseleave', handleDocumentMouseLeave);
      documentListenersActive.current = false;
    }
  }, [onCreateBlock, onBlockClick, blocks, moveBlock, documentMouseMoveHandler, documentMouseUpHandler, handleDocumentMouseLeave]);

  useEffect(() => {
    mouseMoveHandlerRef.current = handleMouseMove;
  }, [handleMouseMove]);

  useEffect(() => {
    mouseUpHandlerRef.current = handleMouseUp;
  }, [handleMouseUp]);

  useEffect(() => {
    return () => {
      if (documentListenersActive.current) {
        document.removeEventListener('mousemove', documentMouseMoveHandler);
        document.removeEventListener('mouseup', documentMouseUpHandler);
        document.removeEventListener('mouseleave', handleDocumentMouseLeave);
        documentListenersActive.current = false;
      }
    };
  }, [documentMouseMoveHandler, documentMouseUpHandler, handleDocumentMouseLeave]);

  const renderTicks = () => {
    const elements: React.ReactNode[] = [];
    for (let i = 0; i <= TOTAL_SLOTS; i++) {
      const minutes = i * MINUTE_PER_SLOT;
      const isHour = minutes % 60 === 0;
      const isHalfHour = minutes % 30 === 0;
      if (!isHour && !isHalfHour) continue;

      elements.push(
        <div
          key={`tick-${i}`}
          className={`${styles.tickLine} ${isHour ? styles.tickLineHour : styles.tickLineHalf}`}
          style={{ left: i * SLOT_WIDTH }}
        />,
      );

      if (isHour) {
        elements.push(
          <div
            key={`label-${i}`}
            className={styles.tickLabel}
            style={{ left: i * SLOT_WIDTH + 4 }}
          >
            {minutesToTime(minutes)}
          </div>,
        );
      }
    }
    return elements;
  };

  const renderBlocks = () =>
    blocks.map((block) => {
      const left = (block.startTime / MINUTE_PER_SLOT) * SLOT_WIDTH;
      const width = ((block.endTime - block.startTime) / MINUTE_PER_SLOT) * SLOT_WIDTH;
      const top = block.lane * LANE_HEIGHT + 4;
      const isDragging = dragState?.type === 'move' && dragState?.blockId === block.id;

      return (
        <div
          key={block.id}
          data-block-id={block.id}
          className={`${styles.block} ${isDragging ? styles.blockDragging : ''}`}
          style={{
            left,
            top,
            width,
            height: LANE_HEIGHT - 8,
            background: block.color,
            transform: isDragging ? 'scale(1.05)' : 'scale(1)',
            border: isDragging ? '2px solid rgba(255,255,255,0.8)' : 'none',
            cursor: isDragging ? 'grabbing' : 'grab',
            transition: isDragging ? 'none' : 'transform 0.15s, border 0.15s',
            zIndex: isDragging ? 10 : 1,
          }}
        >
          <div
            data-edge="left"
            className={`${styles.blockEdge} ${styles.blockEdgeLeft}`}
          />
          <div
            data-edge="right"
            className={`${styles.blockEdge} ${styles.blockEdgeRight}`}
          />
          <div className={styles.blockTitle}>
            {block.title}
          </div>
          <div className={styles.blockTime}>
            {minutesToTime(block.startTime)} - {minutesToTime(block.endTime)}
          </div>
        </div>
      );
    });

  const renderPlaceholder = () => {
    if (!dragState || dragState.type !== 'create') return null;
    const startSlot = Math.min(dragState.startSlot, dragState.currentSlot);
    const endSlot = Math.max(dragState.startSlot, dragState.currentSlot) + 1;
    const startMin = startSlot * MINUTE_PER_SLOT;
    const endMin = endSlot * MINUTE_PER_SLOT;
    const lane = findAvailableLane(startMin, endMin);

    return (
      <div
        className={styles.placeholder}
        style={{
          left: startSlot * SLOT_WIDTH,
          top: lane * LANE_HEIGHT + 4,
          width: (endSlot - startSlot) * SLOT_WIDTH,
          height: LANE_HEIGHT - 8,
        }}
      >
        <span className={styles.placeholderText}>
          {minutesToTime(startMin)} - {minutesToTime(endMin)}
        </span>
      </div>
    );
  };

  const currentTimePx = (currentTime / MINUTE_PER_SLOT) * SLOT_WIDTH;

  return (
    <div
      ref={scrollRef}
      onMouseDown={handleMouseDown}
      className={`${styles.timelineContainer} ${dragState?.type === 'move' ? styles.timelineContainerGrabbing : ''}`}
      style={{
        height: HEADER_HEIGHT + MAX_LANES * LANE_HEIGHT,
        cursor: dragState?.type === 'move' ? 'grabbing' : 'crosshair',
      }}
    >
      <div
        className={styles.timelineInner}
        style={{ width: TIMELINE_WIDTH, height: '100%' }}
      >
        <div className={styles.ticksContainer} style={{ width: TIMELINE_WIDTH, height: HEADER_HEIGHT }}>
          {renderTicks()}
        </div>

        {Array.from({ length: MAX_LANES }).map((_, i) => (
          <div
            key={`lane-${i}`}
            className={`${styles.lane} ${i % 2 === 0 ? styles.laneEven : styles.laneOdd}`}
            style={{
              top: HEADER_HEIGHT + i * LANE_HEIGHT,
              width: TIMELINE_WIDTH,
              height: LANE_HEIGHT,
            }}
          />
        ))}

        <div
          className={styles.blocksContainer}
          style={{
            top: HEADER_HEIGHT,
            width: TIMELINE_WIDTH,
            height: MAX_LANES * LANE_HEIGHT,
          }}
        >
          {renderBlocks()}
          {renderPlaceholder()}
        </div>

        <div
          className={styles.currentTimeLine}
          style={{ left: currentTimePx }}
        >
          <div className={styles.currentTimeDot} />
        </div>
      </div>
    </div>
  );
}
