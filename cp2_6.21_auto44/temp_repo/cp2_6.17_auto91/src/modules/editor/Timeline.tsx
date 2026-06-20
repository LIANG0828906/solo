import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEditorStore } from './editStore';
import { useVideoStore } from '../video/videoStore';
import { ClipBlock } from './ClipBlock';
import './Timeline.css';

interface DragState {
  type: 'move' | 'left-handle' | 'right-handle' | null;
  clipId: string | null;
  startX: number;
  startStartTime: number;
  startEndTime: number;
  startOrderIndex: number;
}

interface RemovingClip {
  id: string;
  timer: number;
}

export function Timeline() {
  const metadata = useVideoStore((state) => state.metadata);
  const clips = useEditorStore((state) => state.clips);
  const selectedClipId = useEditorStore((state) => state.selectedClipId);
  const timelineScale = useEditorStore((state) => state.timelineScale);
  const playheadTime = useEditorStore((state) => state.playheadTime);
  const isPlaying = useEditorStore((state) => state.isPlaying);

  const addClip = useEditorStore((state) => state.addClip);
  const removeClip = useEditorStore((state) => state.removeClip);
  const reorderClip = useEditorStore((state) => state.reorderClip);
  const updateClipTime = useEditorStore((state) => state.updateClipTime);
  const selectClip = useEditorStore((state) => state.selectClip);
  const setTimelineScale = useEditorStore((state) => state.setTimelineScale);
  const setPlayheadTime = useEditorStore((state) => state.setPlayheadTime);

  const timelineRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    type: null,
    clipId: null,
    startX: 0,
    startStartTime: 0,
    startEndTime: 0,
    startOrderIndex: 0,
  });
  const [showGuide, setShowGuide] = useState(false);
  const [guideX, setGuideX] = useState(0);
  const [showScrollIndicators, setShowScrollIndicators] = useState(false);
  const [removingClips, setRemovingClips] = useState<RemovingClip[]>([]);
  const [slideOffsets, setSlideOffsets] = useState<Record<string, number>>({});
  const hideScrollbarTimer = useRef<number | null>(null);

  const PIXELS_PER_SECOND_BASE = 50;
  const pixelsPerSecond = PIXELS_PER_SECOND_BASE * timelineScale;
  const timelineWidth = metadata ? metadata.duration * pixelsPerSecond + 100 : 1000;
  const timelineStartX = 50;

  const sortedClips = [...clips].sort((a, b) => a.orderIndex - b.orderIndex);

  useEffect(() => {
    const updateInteraction = () => {
      if (hideScrollbarTimer.current) {
        window.clearTimeout(hideScrollbarTimer.current);
      }
      setShowScrollIndicators(false);
      hideScrollbarTimer.current = window.setTimeout(() => {
        if (timelineRef.current) {
          const { scrollWidth, clientWidth } = timelineRef.current;
          if (scrollWidth > clientWidth) {
            setShowScrollIndicators(true);
          }
        }
      }, 500);
    };

    const timeline = timelineRef.current;
    if (timeline) {
      timeline.addEventListener('scroll', updateInteraction);
      timeline.addEventListener('pointermove', updateInteraction);
      updateInteraction();
    }

    return () => {
      if (timeline) {
        timeline.removeEventListener('scroll', updateInteraction);
        timeline.removeEventListener('pointermove', updateInteraction);
      }
      if (hideScrollbarTimer.current) {
        window.clearTimeout(hideScrollbarTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedClipId && document.activeElement?.tagName !== 'INPUT') {
          e.preventDefault();
          handleRemoveClip(selectedClipId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipId]);

  const handleRemoveClip = useCallback((clipId: string) => {
    const clip = clips.find((c) => c.id === clipId);
    if (!clip) return;

    const removedIndex = clip.orderIndex;
    const affectedClips = sortedClips.filter((c) => c.orderIndex > removedIndex);

    const removedClipWidth = (clip.endTime - clip.startTime) * pixelsPerSecond;
    const newOffsets: Record<string, number> = {};
    affectedClips.forEach((c, idx) => {
      newOffsets[c.id] = -removedClipWidth - 20 * (idx + 1);
    });
    setSlideOffsets(newOffsets);

    setRemovingClips((prev) => [...prev, { id: clipId, timer: Date.now() }]);

    window.setTimeout(() => {
      removeClip(clipId);
      setRemovingClips((prev) => prev.filter((r) => r.id !== clipId));
      setSlideOffsets({});
    }, 300);
  }, [clips, sortedClips, pixelsPerSecond, removeClip]);

  const getTimeFromX = useCallback(
    (clientX: number) => {
      if (!timelineRef.current || !metadata) return 0;
      const rect = timelineRef.current.getBoundingClientRect();
      const x = clientX - rect.left + timelineRef.current.scrollLeft - timelineStartX;
      const time = x / pixelsPerSecond;
      return Math.max(0, Math.min(metadata.duration, time));
    },
    [metadata, pixelsPerSecond]
  );

  const getXFromTime = useCallback(
    (time: number) => {
      return timelineStartX + time * pixelsPerSecond;
    },
    [pixelsPerSecond]
  );

  const handleAddMarker = (e: React.MouseEvent) => {
    e.stopPropagation();
    const time = getTimeFromX(e.clientX);
    addClip(time);
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (e.target === timelineRef.current || (e.target as HTMLElement).classList.contains('timeline-content')) {
      selectClip(null);
      if (!isPlaying) {
        const time = getTimeFromX(e.clientX);
        setPlayheadTime(time);
        useVideoStore.getState().seekToTime(time);
      }
    }
  };

  const handleDragStart = useCallback(
    (clipId: string, e: React.PointerEvent) => {
      const clip = clips.find((c) => c.id === clipId);
      if (!clip) return;

      selectClip(clipId);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragState({
        type: 'move',
        clipId,
        startX: e.clientX,
        startStartTime: clip.startTime,
        startEndTime: clip.endTime,
        startOrderIndex: clip.orderIndex,
      });
    },
    [clips, selectClip]
  );

  const handleHandleDragStart = useCallback(
    (clipId: string, handle: 'left' | 'right', e: React.PointerEvent) => {
      const clip = clips.find((c) => c.id === clipId);
      if (!clip) return;

      selectClip(clipId);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragState({
        type: handle === 'left' ? 'left-handle' : 'right-handle',
        clipId,
        startX: e.clientX,
        startStartTime: clip.startTime,
        startEndTime: clip.endTime,
        startOrderIndex: clip.orderIndex,
      });
      setShowGuide(true);
      setGuideX(e.clientX);
    },
    [clips, selectClip]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState.type || !dragState.clipId) return;

      const deltaX = e.clientX - dragState.startX;
      const deltaTime = deltaX / pixelsPerSecond;

      if (dragState.type === 'left-handle') {
        const newStartTime = Math.max(0, dragState.startStartTime + deltaTime);
        updateClipTime(dragState.clipId, newStartTime, dragState.startEndTime);
        setGuideX(getXFromTime(newStartTime));
      } else if (dragState.type === 'right-handle') {
        const newEndTime = Math.min(metadata?.duration || 10, dragState.startEndTime + deltaTime);
        updateClipTime(dragState.clipId, dragState.startStartTime, newEndTime);
        setGuideX(getXFromTime(newEndTime));
      } else if (dragState.type === 'move') {
        const currentClip = clips.find((c) => c.id === dragState.clipId);
        if (!currentClip) return;

        const currentCenter = (currentClip.startTime + currentClip.endTime) / 2;
        const newCenter = currentCenter + deltaTime;

        let newIndex = dragState.startOrderIndex;
        for (let i = 0; i < sortedClips.length; i++) {
          const otherClip = sortedClips[i];
          if (otherClip.id === dragState.clipId) continue;
          const otherCenter = (otherClip.startTime + otherClip.endTime) / 2;
          if (newCenter < otherCenter && newIndex > i) {
            newIndex = i;
            break;
          }
          if (newCenter > otherCenter && newIndex < i) {
            newIndex = i + 1;
          }
        }

        if (newIndex !== currentClip.orderIndex) {
          reorderClip(dragState.clipId, newIndex);
        }

        const newStartTime = Math.max(0, dragState.startStartTime + deltaTime);
        const duration = dragState.startEndTime - dragState.startStartTime;
        const newEndTime = Math.min(metadata?.duration || 10, newStartTime + duration);
        const adjustedStart = newEndTime - duration;
        updateClipTime(dragState.clipId, adjustedStart, newEndTime);
      }
    },
    [dragState, pixelsPerSecond, clips, sortedClips, metadata, updateClipTime, reorderClip, getXFromTime]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (dragState.clipId) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
    setDragState({
      type: null,
      clipId: null,
      startX: 0,
      startStartTime: 0,
      startEndTime: 0,
      startOrderIndex: 0,
    });
    setShowGuide(false);
  }, [dragState.clipId]);

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const scale = parseFloat(e.target.value);
    setTimelineScale(scale);
  };

  const scrollTimeline = (direction: 'left' | 'right') => {
    if (!timelineRef.current) return;
    const scrollAmount = 200;
    timelineRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const playheadX = getXFromTime(playheadTime);

  const canShowLeftArrow = timelineRef.current ? timelineRef.current.scrollLeft > 0 : false;
  const canShowRightArrow = timelineRef.current
    ? timelineRef.current.scrollLeft < timelineRef.current.scrollWidth - timelineRef.current.clientWidth
    : false;

  return (
    <div className="timeline-wrapper">
      <div className="timeline-header">
        <button
          type="button"
          className="add-marker-btn"
          onClick={handleAddMarker}
          title="添加剪辑标记"
        >
          <Plus size={18} />
        </button>

        <div className="scale-control">
          <span className="scale-label">缩放</span>
          <input
            type="range"
            min="0.5"
            max="4"
            step="0.1"
            value={timelineScale}
            onChange={handleScaleChange}
            className="scale-slider"
          />
          <span className="scale-value">{timelineScale.toFixed(1)}x</span>
        </div>
      </div>

      <div
        ref={timelineRef}
        className="timeline scrollbar-auto-hide"
        onClick={handleTimelineClick}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          className="timeline-content"
          style={{
            width: timelineWidth,
          }}
        >
          {Array.from({ length: Math.ceil((metadata?.duration || 10) + 1) }).map((_, i) => (
            <div
              key={i}
              className="time-marker"
              style={{
                left: timelineStartX + i * pixelsPerSecond,
              }}
            >
              <div className="time-marker-line" />
              <span className="time-marker-label">{i}s</span>
            </div>
          ))}

          {sortedClips.map((clip) => (
            <ClipBlock
              key={clip.id}
              clip={clip}
              isSelected={selectedClipId === clip.id}
              pixelsPerSecond={pixelsPerSecond}
              timelineStartX={timelineStartX}
              onDragStart={handleDragStart}
              onHandleDragStart={handleHandleDragStart}
              isDragging={dragState.clipId === clip.id && dragState.type === 'move'}
              isRemoving={removingClips.some((r) => r.id === clip.id)}
              slideOffset={slideOffsets[clip.id] || 0}
            />
          ))}

          <div
            className="playhead"
            style={{
              left: playheadX,
              transition: isPlaying ? 'none' : 'left 0.1s linear',
            }}
          />

          {showGuide && (
            <div
              className="guide-line"
              style={{
                left: guideX,
              }}
            />
          )}
        </div>

        {showScrollIndicators && canShowLeftArrow && (
          <button
            type="button"
            className="scroll-arrow left-arrow"
            onClick={() => scrollTimeline('left')}
          >
            <ChevronLeft size={20} />
          </button>
        )}
        {showScrollIndicators && canShowRightArrow && (
          <button
            type="button"
            className="scroll-arrow right-arrow"
            onClick={() => scrollTimeline('right')}
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      <div className="timeline-footer">
        <span className="hint-text">
          点击时间轴定位 · 拖拽剪辑块调整顺序 · 双击编辑文字 · Delete键删除
        </span>
      </div>
    </div>
  );
}
