import React, { useCallback, useRef } from 'react';
import { useMediaContext } from '@/context/MediaContext';
import { GripVertical } from 'lucide-react';

export default function Timeline() {
  const { state, dispatch } = useMediaContext();
  const dragIndexRef = useRef<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    dragIndexRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
    (e.currentTarget as HTMLElement).classList.add('dragging');
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).classList.remove('dragging');
    dragIndexRef.current = null;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = dragIndexRef.current;
    if (sourceIndex === null || sourceIndex === targetIndex) return;
    const newPhotos = [...state.photos];
    const [moved] = newPhotos.splice(sourceIndex, 1);
    newPhotos.splice(targetIndex, 0, moved);
    dispatch({ type: 'REORDER_PHOTOS', payload: newPhotos.map((p, i) => ({ ...p, order: i })) });
  }, [state.photos, dispatch]);

  const totalDuration = state.photos.length * state.photoDuration;
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="timeline" ref={timelineRef}>
      <div className="timeline-header">
        <span className="section-label" style={{ margin: 0 }}>时间线</span>
        <span className="timeline-duration">
          总时长 {formatTime(totalDuration)}
        </span>
      </div>

      <div className="timeline-track">
        {state.photos.length === 0 ? (
          <div className="timeline-empty">
            拖入照片以开始编辑
          </div>
        ) : (
          state.photos.map((photo, index) => (
            <div
              key={photo.id}
              className="timeline-item"
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              style={{
                flex: `0 0 ${Math.max(80, state.photoDuration * 26)}px`,
              }}
            >
              <div className="timeline-thumb">
                <img src={photo.url} alt={`照片 ${index + 1}`} />
                <span className="timeline-index">{index + 1}</span>
              </div>
              <div className="timeline-bar">
                <div
                  className="timeline-bar-fill"
                  style={{
                    width: `${(state.photoDuration / 4) * 100}%`,
                    background: index % 2 === 0
                      ? 'linear-gradient(90deg, var(--color-starblue), var(--color-starblue-light))'
                      : 'linear-gradient(90deg, var(--color-rosegold), var(--color-rosegold-light))',
                  }}
                />
                <span className="timeline-time">{state.photoDuration.toFixed(1)}s</span>
              </div>
              <div className="timeline-grip">
                <GripVertical size={12} />
              </div>
            </div>
          ))
        )}
      </div>

      {state.photos.length > 0 && (
        <div className="timeline-ruler">
          {state.photos.map((_, index) => (
            <div
              key={index}
              className="ruler-mark"
              style={{ flex: `0 0 ${Math.max(80, state.photoDuration * 26)}px` }}
            >
              <span>{formatTime(index * state.photoDuration)}</span>
            </div>
          ))}
          <div className="ruler-mark" style={{ flex: '0 0 auto' }}>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
