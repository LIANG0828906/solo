import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useAnimationStore } from './store/useAnimationStore';
import { MAX_DURATION, TICK_COUNT, TIME_STEP, formatTime } from './utils/animationUtils';

const TIMELINE_HEIGHT = 60;
const KEYFRAME_WIDTH = 40;
const KEYFRAME_HEIGHT = 20;

export const EditorPanel: React.FC = () => {
  const keyframes = useAnimationStore((s) => s.keyframes);
  const selectedId = useAnimationStore((s) => s.selectedKeyframeId);
  const addKeyframe = useAnimationStore((s) => s.addKeyframe);
  const deleteKeyframe = useAnimationStore((s) => s.deleteKeyframe);
  const updateKeyframe = useAnimationStore((s) => s.updateKeyframe);
  const selectKeyframe = useAnimationStore((s) => s.selectKeyframe);

  const timelineRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragTime, setDragTime] = useState<number | null>(null);
  const [timelineWidth, setTimelineWidth] = useState(400);

  useEffect(() => {
    const updateWidth = () => {
      if (timelineRef.current) {
        setTimelineWidth(timelineRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const timeToPosition = useCallback(
    (time: number, width: number) => {
      const padding = KEYFRAME_WIDTH / 2;
      const usableWidth = width - KEYFRAME_WIDTH;
      return padding + (time / MAX_DURATION) * usableWidth;
    },
    []
  );

  const positionToTime = useCallback(
    (x: number, width: number) => {
      const padding = KEYFRAME_WIDTH / 2;
      const usableWidth = width - KEYFRAME_WIDTH;
      const relative = Math.max(0, Math.min(usableWidth, x - padding));
      const rawTime = (relative / usableWidth) * MAX_DURATION;
      return Math.round(rawTime / TIME_STEP) * TIME_STEP;
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggingId || !timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const t = positionToTime(x, rect.width);
      setDragTime(t);
      updateKeyframe(draggingId, { time: t });
    },
    [draggingId, updateKeyframe, positionToTime]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingId(null);
    setDragTime(null);
  }, []);

  useEffect(() => {
    if (draggingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingId, handleMouseMove, handleMouseUp]);

  const ticks = [];
  for (let i = 0; i <= TICK_COUNT; i++) {
    ticks.push(i);
  }

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    if ((e.target as HTMLElement).closest('[data-keyframe]')) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const t = positionToTime(x, rect.width);
    addKeyframe(t);
  };

  return (
    <div
      style={{
        backgroundColor: '#1E1E2E',
        borderRadius: 8,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#E0E0E0' }}>
          动画时间轴
        </div>
        <button
          onClick={() => addKeyframe(MAX_DURATION / 2)}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: 'none',
            backgroundColor: '#6C63FF',
            color: '#fff',
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            transition: 'background-color 0.2s ease-out',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#5A52E0')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#6C63FF')}
        >
          <Plus size={14} />
          添加关键帧
        </button>
      </div>

      <div
        ref={timelineRef}
        style={{
          position: 'relative',
          height: TIMELINE_HEIGHT,
          backgroundColor: '#2B2B3D',
          borderRadius: 8,
          overflow: 'hidden',
          cursor: 'crosshair',
          userSelect: 'none',
        }}
        onClick={handleTimelineClick}
      >
        {ticks.map((i) => {
          const time = i * TIME_STEP;
          const isMajor = i % 10 === 0;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: isMajor ? 0 : '50%',
                left: `${(time / MAX_DURATION) * 100}%`,
                width: 1,
                height: isMajor ? '100%' : '50%',
                backgroundColor: '#3A3A5C',
                transform: 'translateX(-0.5px)',
              }}
            />
          );
        })}

        {keyframes.map((kf) => {
          const isSelected = kf.id === selectedId;
          const isDragging = kf.id === draggingId;
          const displayTime = dragTime !== null && isDragging ? dragTime : kf.time;
          const leftPos = timeToPosition(displayTime, timelineWidth) - KEYFRAME_WIDTH / 2;
          return (
            <div
              data-keyframe={kf.id}
              key={kf.id}
              style={{
                position: 'absolute',
                top: '50%',
                left: `${leftPos}px`,
                transform: 'translateY(-50%)',
                width: KEYFRAME_WIDTH,
                height: KEYFRAME_HEIGHT,
                borderRadius: 4,
                backgroundColor: '#6C63FF',
                border: isSelected ? '2px solid #FF6B6B' : 'none',
                cursor: 'grab',
                zIndex: isDragging || isSelected ? 10 : 1,
                transition: isDragging ? 'none' : 'left 0.15s ease-out',
                boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.4)' : 'none',
                boxSizing: 'border-box',
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                selectKeyframe(kf.id);
                setDraggingId(kf.id);
                setDragTime(kf.time);
              }}
              onClick={(e) => {
                e.stopPropagation();
                selectKeyframe(kf.id);
              }}
            >
              {(isDragging || isSelected) && (
                <div
                  style={{
                    position: 'absolute',
                    top: -24,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#121220',
                    color: '#E0E0E0',
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: 4,
                    whiteSpace: 'nowrap',
                    fontFamily: 'monospace',
                  }}
                >
                  {formatTime(displayTime)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#8888AA' }}>
        <span>0s</span>
        <span>1s</span>
        <span>2s</span>
        <span>3s</span>
        <span>4s</span>
      </div>

      {selectedId && (
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button
            onClick={() => deleteKeyframe(selectedId)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: 'none',
              backgroundColor: 'transparent',
              color: '#FF6B6B',
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'background-color 0.2s ease-out',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,107,107,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Trash2 size={14} />
            删除选中帧
          </button>
        </div>
      )}
    </div>
  );
};
