import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { VideoClip, Sticker, EditorAction } from '../types';
import {
  getClipEffectiveDuration,
  getClipEndTime,
  getTotalDuration,
  formatTime,
  formatTimeMs,
  getStickerSVG,
} from '../utils/mediaUtils';

const BASE_PIXELS_PER_SECOND = 60;
const MIN_CLIP_DURATION = 0.5;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

interface TimelineProps {
  clips: VideoClip[];
  stickers: Sticker[];
  currentTime: number;
  selectedClipId: string | null;
  selectedStickerId: string | null;
  dispatch: React.Dispatch<EditorAction>;
}

interface SortableClipProps {
  clip: VideoClip;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDoubleClick: (id: string) => void;
  onTrimStart: (id: string, deltaSeconds: number) => void;
  onTrimEnd: (id: string, deltaSeconds: number) => void;
  pixelsPerSecond: number;
}

const SortableClip: React.FC<SortableClipProps> = ({
  clip,
  isSelected,
  onSelect,
  onDoubleClick,
  onTrimStart,
  onTrimEnd,
  pixelsPerSecond,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: clip.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    left: clip.startTime * pixelsPerSecond,
    width: getClipEffectiveDuration(clip) * pixelsPerSecond,
    background: `linear-gradient(90deg, #e94560 0%, #0f3460 100%)`,
  };

  const handleTrimMouseDown = (side: 'left' | 'right') => (e: React.MouseEvent) => {
    e.stopPropagation();
    const startX = e.clientX;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaSeconds = deltaX / pixelsPerSecond;
      if (side === 'left') {
        onTrimStart(clip.id, deltaSeconds);
      } else {
        onTrimEnd(clip.id, deltaSeconds);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`timeline-clip ${isDragging ? 'dragging' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(clip.id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick(clip.id);
      }}
      {...attributes}
      {...listeners}
    >
      <div className="trim-handle left" onMouseDown={handleTrimMouseDown('left')} />
      <div className="timeline-clip-content">
        <span className="clip-name">{clip.name}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {clip.title && <span className="clip-title-icon">T</span>}
          <span className="clip-duration">{formatTime(getClipEffectiveDuration(clip))}</span>
        </div>
      </div>
      <div className="trim-handle right" onMouseDown={handleTrimMouseDown('right')} />
    </div>
  );
};

const Timeline: React.FC<TimelineProps> = ({
  clips,
  stickers,
  currentTime,
  selectedClipId,
  selectedStickerId,
  dispatch,
}) => {
  const tracksRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);

  const pixelsPerSecond = BASE_PIXELS_PER_SECOND * zoom;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const totalDuration = Math.max(30, getTotalDuration(clips));
  const trackWidth = totalDuration * pixelsPerSecond;

  useEffect(() => {
    if (tracksRef.current) {
      const playheadX = currentTime * pixelsPerSecond;
      const container = tracksRef.current;
      const visibleLeft = container.scrollLeft;
      const visibleRight = visibleLeft + container.clientWidth;
      if (playheadX < visibleLeft + 40 || playheadX > visibleRight - 40) {
        container.scrollTo({
          left: Math.max(0, playheadX - container.clientWidth / 2),
          behavior: 'smooth',
        });
      }
    }
  }, [currentTime, pixelsPerSecond]);

  const handleDragStart = (event: DragStartEvent) => {
    const clip = clips.find((c) => c.id === event.active.id);
    if (clip) {
      setActiveId(clip.id);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = clips.findIndex((c) => c.id === active.id);
      const newIndex = clips.findIndex((c) => c.id === over.id);
      const newClips = arrayMove(clips, oldIndex, newIndex);

      let runningTime = 0;
      const reorderedClips = newClips.map((clip) => {
        const updated = { ...clip, startTime: runningTime };
        runningTime += getClipEffectiveDuration(clip);
        return updated;
      });

      dispatch({ type: 'REORDER_CLIPS', payload: reorderedClips });
    }
  };

  const handleClipSelect = useCallback(
    (id: string) => {
      dispatch({ type: 'SELECT_CLIP', payload: id });
    },
    [dispatch]
  );

  const handleClipDoubleClick = useCallback(
    (id: string) => {
      dispatch({ type: 'SELECT_CLIP', payload: id });
      dispatch({ type: 'SET_TITLE_EDITOR', payload: id });
    },
    [dispatch]
  );

  const handleTrimStart = useCallback(
    (id: string, deltaSeconds: number) => {
      const clip = clips.find((c) => c.id === id);
      if (!clip) return;
      const maxTrimIn = clip.duration - clip.trimOut - MIN_CLIP_DURATION;
      const newTrimIn = Math.max(0, Math.min(maxTrimIn, clip.trimIn + deltaSeconds));
      dispatch({
        type: 'UPDATE_CLIP',
        payload: {
          ...clip,
          trimIn: newTrimIn,
          startTime: Math.max(0, clip.startTime + (deltaSeconds < 0 ? deltaSeconds : 0)),
        },
      });
    },
    [clips, dispatch]
  );

  const handleTrimEnd = useCallback(
    (id: string, deltaSeconds: number) => {
      const clip = clips.find((c) => c.id === id);
      if (!clip) return;
      const maxTrimOut = clip.duration - clip.trimIn - MIN_CLIP_DURATION;
      const newTrimOut = Math.max(0, Math.min(maxTrimOut, clip.trimOut - deltaSeconds));
      dispatch({
        type: 'UPDATE_CLIP',
        payload: { ...clip, trimOut: newTrimOut },
      });
    },
    [clips, dispatch]
  );

  const handleTrackClick = (e: React.MouseEvent) => {
    if (!tracksRef.current) return;
    const rect = tracksRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + tracksRef.current.scrollLeft;
    const time = x / pixelsPerSecond;
    dispatch({ type: 'SET_CURRENT_TIME', payload: Math.max(0, Math.min(totalDuration, time)) });
    dispatch({ type: 'SELECT_CLIP', payload: null });
    dispatch({ type: 'SELECT_STICKER', payload: null });
  };

  const handleStickerClick = (e: React.MouseEvent, stickerId: string) => {
    e.stopPropagation();
    dispatch({ type: 'SELECT_STICKER', payload: stickerId });
  };

  const getRulerStep = (): number => {
    if (zoom >= 2) return 1;
    if (zoom >= 1) return 1;
    if (zoom >= 0.7) return 2;
    return 5;
  };

  const renderRuler = () => {
    const marks = [];
    const step = getRulerStep();
    for (let t = 0; t <= totalDuration; t += step) {
      marks.push(
        <React.Fragment key={t}>
          <div className="ruler-tick" style={{ left: t * pixelsPerSecond }} />
          {t % (step * 5) === 0 && (
            <div className="ruler-mark" style={{ left: t * pixelsPerSecond }}>
              {formatTime(t)}
            </div>
          )}
        </React.Fragment>
      );
    }
    return marks;
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, val)));
  };

  const activeClip = clips.find((c) => c.id === activeId);

  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <span className="timeline-title">时间线</span>
        <div className="zoom-control-bar">
          <span className="zoom-label">缩放</span>
          <input
            type="range"
            className="zoom-slider"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={ZOOM_STEP}
            value={zoom}
            onChange={handleZoomChange}
          />
          <span className="zoom-value">{zoom.toFixed(1)}x</span>
        </div>
        <span className="timeline-title" style={{ color: '#00d2ff' }}>
          {formatTime(currentTime)} / {formatTime(totalDuration)}
        </span>
      </div>
      <div className="timeline-ruler" style={{ width: trackWidth, minWidth: '100%' }}>
        {renderRuler()}
      </div>
      <div
        ref={tracksRef}
        className="timeline-tracks"
        onClick={handleTrackClick}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={clips.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
            <div className="timeline-clips" style={{ width: trackWidth, minWidth: '100%' }}>
              {clips.length === 0 ? (
                <div className="timeline-empty" style={{ width: '100%' }}>
                  从左侧素材面板拖拽视频片段到这里开始编辑
                </div>
              ) : (
                clips.map((clip) => (
                  <SortableClip
                    key={clip.id}
                    clip={clip}
                    isSelected={selectedClipId === clip.id}
                    onSelect={handleClipSelect}
                    onDoubleClick={handleClipDoubleClick}
                    onTrimStart={handleTrimStart}
                    onTrimEnd={handleTrimEnd}
                    pixelsPerSecond={pixelsPerSecond}
                  />
                ))
              )}
              <div
                className="playhead-line"
                style={{ left: currentTime * pixelsPerSecond }}
              >
                <div className="playhead-triangle" />
              </div>
            </div>
          </SortableContext>
          <DragOverlay>
            {activeClip ? (
              <div
                className="timeline-clip dragging"
                style={{
                  width: getClipEffectiveDuration(activeClip) * pixelsPerSecond,
                  background: `linear-gradient(90deg, #e94560 0%, #0f3460 100%)`,
                  opacity: 0.9,
                }}
              >
                <div className="timeline-clip-content">
                  <span className="clip-name">{activeClip.name}</span>
                  <span className="clip-duration">
                    {formatTime(getClipEffectiveDuration(activeClip))}
                  </span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
        <div className="timeline-stickers" style={{ width: trackWidth, minWidth: '100%' }}>
          {stickers.map((sticker) => (
            <div
              key={sticker.id}
              className={`timeline-sticker ${selectedStickerId === sticker.id ? 'selected' : ''}`}
              style={{
                left: sticker.startTime * pixelsPerSecond,
                transform: 'translateY(-50%) rotate(45deg)',
                background: '#ffffff',
                borderRadius: 2,
              }}
              onClick={(e) => handleStickerClick(e, sticker.id)}
              title={sticker.type}
              dangerouslySetInnerHTML={{
                __html: `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);width:12px;height:12px;">${getStickerSVG(
                  sticker.type
                )}</div>`,
              }}
            />
          ))}
        </div>
      </div>
      <div className="timeline-indicator-bar">
        <span className="indicator-label">当前时间</span>
        <span className="indicator-time">{formatTimeMs(currentTime)}</span>
      </div>
    </div>
  );
};

export default Timeline;
