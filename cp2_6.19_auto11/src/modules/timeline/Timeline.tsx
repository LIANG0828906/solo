import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { ZoomIn, ZoomOut, Trash2, GripVertical } from 'lucide-react';
import type { Clip, Transition, Material, TransitionType } from '../../types';
import { formatTime, clamp, snapToFrame, getTotalDuration } from '../../utils/time';
import { getColorForMaterial } from '../../utils/video';
import TransitionOverlay from './TransitionOverlay';
import './Timeline.css';

interface TimelineProps {
  clips: Clip[];
  transitions: Transition[];
  materials: Material[];
  currentTime: number;
  zoom: number;
  selectedClipId: string | null;
  onClipAdd: (materialId: string, startTime: number) => void;
  onClipUpdate: (clipId: string, updates: Partial<Clip>) => void;
  onClipSelect: (clipId: string | null) => void;
  onZoomChange: (zoom: number) => void;
  onTimeChange: (time: number) => void;
  onTransitionAdd: (fromClipId: string, toClipId: string, type: TransitionType) => void;
  onClipDelete: (clipId: string) => void;
}

const TRACK_HEIGHT = 60;
const MIN_ZOOM = 1 / 30;
const MAX_ZOOM = 30;
const HANDLE_WIDTH = 8;

const Timeline: React.FC<TimelineProps> = ({
  clips,
  transitions,
  materials,
  currentTime,
  zoom,
  selectedClipId,
  onClipAdd,
  onClipUpdate,
  onClipSelect,
  onZoomChange,
  onTimeChange,
  onTransitionAdd,
  onClipDelete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'move' | 'left' | 'right' | 'playhead' | null>(null);
  const [dragClipId, setDragClipId] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartValue, setDragStartValue] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [hoverGapIndex, setHoverGapIndex] = useState<number | null>(null);

  const totalDuration = useMemo(() => getTotalDuration(clips), [clips]);
  const visibleDuration = Math.max(totalDuration + 5, 30);

  const timeToPixel = useCallback((time: number) => time * zoom * 50, [zoom]);
  const pixelToTime = useCallback((pixel: number) => pixel / (zoom * 50), [zoom]);

  const sortedClips = useMemo(() => {
    return [...clips].sort((a, b) => a.startTime - b.startTime);
  }, [clips]);

  const getMaterialForClip = (clipId: string) => {
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return null;
    return materials.find(m => m.id === clip.materialId) || null;
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.8 : 1.25;
      const newZoom = clamp(zoom * delta, MIN_ZOOM, MAX_ZOOM);
      onZoomChange(newZoom);
    }
  }, [zoom, onZoomChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setHoverGapIndex(null);

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      
      if (data.type === 'material') {
        const rect = scrollContainerRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const x = e.clientX - rect.left + (scrollContainerRef.current?.scrollLeft || 0);
        let dropTime = pixelToTime(x);
        dropTime = snapToFrame(dropTime);

        let insertIndex = 0;
        for (let i = 0; i < sortedClips.length; i++) {
          if (dropTime < sortedClips[i].startTime) {
            insertIndex = i;
            break;
          }
          if (i === sortedClips.length - 1) {
            insertIndex = sortedClips.length;
          }
        }

        let startTime = dropTime;
        if (insertIndex > 0) {
          startTime = Math.max(startTime, sortedClips[insertIndex - 1].endTime);
        }

        onClipAdd(data.materialId, startTime);
      } else if (data.type === 'transition') {
        const rect = scrollContainerRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const x = e.clientX - rect.left + (scrollContainerRef.current?.scrollLeft || 0);
        const dropTime = pixelToTime(x);

        for (let i = 0; i < sortedClips.length - 1; i++) {
          const gapStart = sortedClips[i].endTime;
          const gapEnd = sortedClips[i + 1].startTime;
          const gapCenter = (gapStart + gapEnd) / 2;
          
          if (Math.abs(dropTime - gapCenter) < (gapEnd - gapStart) / 2 + 0.5) {
            onTransitionAdd(sortedClips[i].id, sortedClips[i + 1].id, data.transitionType);
            break;
          }
        }
      }
    } catch (e) {
      console.error('Drop error:', e);
    }
  }, [pixelToTime, sortedClips, onClipAdd, onTransitionAdd]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.type === 'transition') {
        const rect = scrollContainerRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const x = e.clientX - rect.left + (scrollContainerRef.current?.scrollLeft || 0);
        const dropTime = pixelToTime(x);

        let foundGap = null;
        for (let i = 0; i < sortedClips.length - 1; i++) {
          const gapStart = sortedClips[i].endTime;
          const gapEnd = sortedClips[i + 1].startTime;
          const gapCenter = (gapStart + gapEnd) / 2;
          
          if (Math.abs(dropTime - gapCenter) < (gapEnd - gapStart) / 2 + 0.5) {
            foundGap = i;
            break;
          }
        }
        setHoverGapIndex(foundGap);
      }
    } catch {}
  }, [pixelToTime, sortedClips]);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
    setHoverGapIndex(null);
  }, []);

  const handleClipMouseDown = useCallback((e: React.MouseEvent, clipId: string, type: 'move' | 'left' | 'right') => {
    e.stopPropagation();
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;

    setIsDragging(true);
    setDragType(type);
    setDragClipId(clipId);
    setDragStartX(e.clientX);
    onClipSelect(clipId);

    if (type === 'move') {
      setDragStartValue(clip.startTime);
    } else if (type === 'left') {
      setDragStartValue(clip.inPoint);
    } else if (type === 'right') {
      setDragStartValue(clip.outPoint);
    }
  }, [clips, onClipSelect]);

  const handlePlayheadMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragType('playhead');
    setDragStartX(e.clientX);
    setDragStartValue(currentTime);
  }, [currentTime]);

  const handleTrackMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = scrollContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left + (scrollContainerRef.current?.scrollLeft || 0);
    const time = pixelToTime(x);
    onTimeChange(snapToFrame(time));
    onClipSelect(null);
  }, [pixelToTime, onTimeChange, onClipSelect]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragType || !dragClipId && dragType !== 'playhead') return;

      const deltaX = e.clientX - dragStartX;
      const deltaTime = pixelToTime(deltaX);

      if (dragType === 'playhead') {
        const newTime = clamp(dragStartValue + deltaTime, 0, totalDuration);
        onTimeChange(snapToFrame(newTime));
        return;
      }

      const clip = clips.find(c => c.id === dragClipId);
      if (!clip) return;
      const material = materials.find(m => m.id === clip.materialId);
      if (!material) return;

      const minClipDuration = 0.2;

      if (dragType === 'move') {
        let newStartTime = dragStartValue + deltaTime;
        newStartTime = clamp(newStartTime, 0, totalDuration - (clip.outPoint - clip.inPoint) / clip.playbackRate);
        
        const clipDuration = (clip.outPoint - clip.inPoint) / clip.playbackRate;
        const newEndTime = newStartTime + clipDuration;

        onClipUpdate(clip.id, {
          startTime: snapToFrame(newStartTime),
          endTime: snapToFrame(newEndTime),
        });
      } else if (dragType === 'left') {
        let newInPoint = dragStartValue + deltaTime * clip.playbackRate;
        newInPoint = clamp(newInPoint, 0, clip.outPoint - minClipDuration * clip.playbackRate);
        
        const newStartTime = clip.startTime;
        const newEndTime = newStartTime + (clip.outPoint - newInPoint) / clip.playbackRate;

        onClipUpdate(clip.id, {
          inPoint: snapToFrame(newInPoint),
          startTime: snapToFrame(newStartTime),
          endTime: snapToFrame(newEndTime),
        });
      } else if (dragType === 'right') {
        let newOutPoint = dragStartValue + deltaTime * clip.playbackRate;
        newOutPoint = clamp(newOutPoint, clip.inPoint + minClipDuration * clip.playbackRate, material.duration);
        
        const newEndTime = clip.startTime + (newOutPoint - clip.inPoint) / clip.playbackRate;

        onClipUpdate(clip.id, {
          outPoint: snapToFrame(newOutPoint),
          endTime: snapToFrame(newEndTime),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragType(null);
      setDragClipId(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragType, dragClipId, dragStartX, dragStartValue, clips, materials, pixelToTime, onClipUpdate, onTimeChange, totalDuration]);

  const renderRuler = () => {
    const ticks = [];
    const interval = zoom > 1 ? 0.5 : zoom > 0.2 ? 1 : zoom > 0.05 ? 5 : 30;
    const endTime = visibleDuration;

    for (let t = 0; t <= endTime; t += interval) {
      const x = timeToPixel(t);
      const isMajor = t % (interval * 5) < 0.001 || interval >= 5;
      ticks.push(
        <div
          key={t}
          className={`ruler-tick ${isMajor ? 'major' : ''}`}
          style={{ left: x }}
        >
          {isMajor && <span className="ruler-label">{formatTime(t)}</span>}
        </div>
      );
    }

    return ticks;
  };

  const getTransitionForClip = (clipId: string) => {
    return transitions.find(t => t.fromClipId === clipId || t.toClipId === clipId);
  };

  return (
    <div 
      className="timeline-container"
      ref={containerRef}
      onWheel={handleWheel}
    >
      <div className="timeline-toolbar">
        <div className="zoom-controls">
          <button
            className="zoom-btn"
            onClick={() => onZoomChange(clamp(zoom * 0.8, MIN_ZOOM, MAX_ZOOM))}
            title="缩小"
          >
            <ZoomOut size={16} />
          </button>
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
          <button
            className="zoom-btn"
            onClick={() => onZoomChange(clamp(zoom * 1.25, MIN_ZOOM, MAX_ZOOM))}
            title="放大"
          >
            <ZoomIn size={16} />
          </button>
        </div>
        <div className="timeline-info">
          <span>剪辑: {clips.length}</span>
          <span>总时长: {formatTime(totalDuration)}</span>
        </div>
      </div>

      <div className="timeline-ruler">
        <div className="ruler-track" style={{ width: timeToPixel(visibleDuration) }}>
          {renderRuler()}
        </div>
      </div>

      <div 
        className="timeline-scroll"
        ref={scrollContainerRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div 
          className={`timeline-track ${isDragOver ? 'drag-over' : ''}`}
          style={{ 
            width: timeToPixel(visibleDuration),
            height: TRACK_HEIGHT,
          }}
          onMouseDown={handleTrackMouseDown}
        >
          {sortedClips.map((clip, index) => {
            const material = getMaterialForClip(clip.id);
            const isSelected = selectedClipId === clip.id;
            const transition = getTransitionForClip(clip.id);
            const hasTransitionBefore = transitions.some(t => t.toClipId === clip.id);

            return (
              <React.Fragment key={clip.id}>
                {hasTransitionBefore && (
                  <div
                    className="clip-gap-indicator active"
                    style={{
                      left: timeToPixel(clip.startTime) - 30,
                      width: 60,
                    }}
                  />
                )}
                {index < sortedClips.length - 1 && hoverGapIndex === index && (
                  <div
                    className="gap-highlight"
                    style={{
                      left: timeToPixel((sortedClips[index].endTime + sortedClips[index + 1].startTime) / 2) - 2,
                    }}
                  />
                )}
                <div
                  className={`clip-block ${isSelected ? 'selected' : ''}`}
                  style={{
                    left: timeToPixel(clip.startTime),
                    width: timeToPixel(clip.endTime - clip.startTime),
                    background: material ? getColorForMaterial(materials.findIndex(m => m.id === material.id)) : '#666',
                  }}
                  onMouseDown={(e) => handleClipMouseDown(e, clip.id, 'move')}
                >
                  <div
                    className="clip-handle left"
                    onMouseDown={(e) => handleClipMouseDown(e, clip.id, 'left')}
                  />
                  <div className="clip-content">
                    <div className="clip-drag-handle">
                      <GripVertical size={14} />
                    </div>
                    <div className="clip-info">
                      <span className="clip-name">{material?.name || '未知素材'}</span>
                      <span className="clip-duration">
                        {formatTime(clip.endTime - clip.startTime)}
                      </span>
                    </div>
                    {isSelected && (
                      <button
                        className="clip-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClipDelete(clip.id);
                        }}
                        title="删除"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div
                    className="clip-handle right"
                    onMouseDown={(e) => handleClipMouseDown(e, clip.id, 'right')}
                  />
                </div>
              </React.Fragment>
            );
          })}

          <TransitionOverlay
            transitions={transitions}
            clips={clips}
            timeToPixel={timeToPixel}
          />

          <div
            className="playhead"
            style={{ left: timeToPixel(currentTime) }}
            onMouseDown={handlePlayheadMouseDown}
          >
            <div className="playhead-head" />
            <div className="playhead-line" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Timeline);
