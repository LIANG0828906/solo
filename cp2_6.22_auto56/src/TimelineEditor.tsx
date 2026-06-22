import React, { useCallback, useRef, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { KeyframeData } from './presets';

interface TimelineEditorProps {
  keyframes: KeyframeData[];
  onChange: (keyframes: KeyframeData[]) => void;
  isPlaying: boolean;
  animationProgress: number;
  duration: number;
}

const TRACK_HEIGHT = 48;
const KEYFRAME_SIZE = 14;
const PLAYHEAD_HEIGHT = 60;
const MIN_ZOOM = 1;
const MAX_ZOOM = 10;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function formatTime(time: number, duration: number): string {
  const seconds = time * duration;
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return `${mins}:${secs.padStart(4, '0')}`;
}

const TimelineEditor: React.FC<TimelineEditorProps> = ({
  keyframes,
  onChange,
  isPlaying,
  animationProgress,
  duration,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{
    type: 'keyframe' | 'pan';
    keyframeId?: string;
    startX: number;
    startPan?: number;
  } | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    keyframeId: string | null;
  }>({ visible: false, x: 0, y: 0, keyframeId: null });

  const timelineWidth = 100 * zoom;

  const timeToPixel = useCallback(
    (time: number) => {
      return (time * timelineWidth) / 100 + panOffset;
    },
    [timelineWidth, panOffset]
  );

  const pixelToTime = useCallback(
    (px: number) => {
      return ((px - panOffset) / timelineWidth) * 100;
    },
    [timelineWidth, panOffset]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const timeAtMouse = pixelToTime(mouseX);

      const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = clamp(zoom * zoomDelta, MIN_ZOOM, MAX_ZOOM);
      const newTimelineWidth = 100 * newZoom;

      const newPanOffset = mouseX - (timeAtMouse * newTimelineWidth) / 100;

      setZoom(newZoom);
      setPanOffset(newPanOffset);
    },
    [zoom, pixelToTime]
  );

  const handleTrackMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const clickedTime = pixelToTime(mouseX);

      const clickedKeyframe = keyframes.find((kf) => {
        const kfPixel = timeToPixel(kf.time);
        return Math.abs(kfPixel - mouseX) < KEYFRAME_SIZE;
      });

      if (clickedKeyframe) {
        setSelectedId(clickedKeyframe.id);
        setDragState({
          type: 'keyframe',
          keyframeId: clickedKeyframe.id,
          startX: e.clientX,
        });
      } else {
        const clampedTime = clamp(clickedTime, 0, 100) / 100;
        const newKeyframe: KeyframeData = {
          id: uuidv4(),
          time: clampedTime,
          opacity: 1,
          translateX: 0,
          translateY: 0,
          scale: 1,
          rotate: 0,
        };
        const sorted = [...keyframes, newKeyframe].sort((a, b) => a.time - b.time);
        onChange(sorted);
        setSelectedId(newKeyframe.id);
        setDragState({
          type: 'keyframe',
          keyframeId: newKeyframe.id,
          startX: e.clientX,
        });
      }
    },
    [keyframes, onChange, pixelToTime, timeToPixel]
  );

  const handlePanStart = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      setDragState({
        type: 'pan',
        startX: e.clientX,
        startPan: panOffset,
      });
    },
    [panOffset]
  );

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (dragState.type === 'keyframe' && dragState.keyframeId) {
        const rect = trackRef.current?.getBoundingClientRect();
        if (!rect) return;
        const mouseX = e.clientX - rect.left;
        const newTime = clamp(pixelToTime(mouseX) / 100, 0, 1);
        onChange(
          keyframes.map((kf) =>
            kf.id === dragState.keyframeId ? { ...kf, time: Math.round(newTime * 1000) / 1000 } : kf
          )
        );
      } else if (dragState.type === 'pan' && dragState.startPan !== undefined) {
        const dx = e.clientX - dragState.startX;
        setPanOffset(dragState.startPan + dx);
      }
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, keyframes, onChange, pixelToTime]);

  useEffect(() => {
    if (!contextMenu.visible) return;

    const closeMenu = () => {
      setContextMenu({ visible: false, x: 0, y: 0, keyframeId: null });
    };

    window.addEventListener('mousedown', closeMenu);
    window.addEventListener('scroll', closeMenu, true);
    return () => {
      window.removeEventListener('mousedown', closeMenu);
      window.removeEventListener('scroll', closeMenu, true);
    };
  }, [contextMenu.visible]);

  const selectedKeyframe = keyframes.find((kf) => kf.id === selectedId) || null;

  const updateKeyframe = useCallback(
    (id: string, updates: Partial<KeyframeData>) => {
      onChange(keyframes.map((kf) => (kf.id === id ? { ...kf, ...updates } : kf)));
    },
    [keyframes, onChange]
  );

  const deleteKeyframe = useCallback(
    (id: string) => {
      onChange(keyframes.filter((kf) => kf.id !== id));
      if (selectedId === id) setSelectedId(null);
    },
    [keyframes, onChange, selectedId]
  );

  const tickMarks = [0, 25, 50, 75, 100];

  const playheadX = timeToPixel(animationProgress * 100);

  return (
    <div
      style={{
        background: '#1a1a2e',
        borderRadius: 8,
        padding: 16,
        userSelect: 'none',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        color: '#e0e0e0',
      }}
    >
      <div
        style={{
          position: 'relative',
          height: PLAYHEAD_HEIGHT,
          overflow: 'hidden',
          cursor: dragState?.type === 'pan' ? 'grabbing' : 'default',
        }}
        onMouseDown={(e) => {
          const target = e.target as HTMLElement;
          if (target.dataset.keyframe) return;
          handlePanStart(e);
        }}
      >
        <div
          ref={trackRef}
          style={{
            position: 'relative',
            height: '100%',
            width: '100%',
            overflow: 'hidden',
          }}
          onWheel={handleWheel}
          onMouseDown={(e) => {
            const target = e.target as HTMLElement;
            if (!target.dataset.keyframe && !target.dataset.track) {
              handlePanStart(e);
            }
          }}
        >
          <div
            data-track="true"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: timelineWidth + '%',
              height: '100%',
            }}
            onMouseDown={handleTrackMouseDown}
          >
            {tickMarks.map((tick) => {
              const left = (tick * timelineWidth) / 100;
              const tickTime = tick / 100;
              return (
                <div
                  key={tick}
                  style={{
                    position: 'absolute',
                    left: `${left}%`,
                    top: 0,
                    height: '100%',
                    pointerEvents: 'none',
                  }}
                >
                  <div
                    style={{
                      width: 1,
                      height: 12,
                      background: '#444466',
                      margin: '0 auto',
                    }}
                  />
                  <div
                    style={{
                      fontSize: 10,
                      color: '#8888aa',
                      textAlign: 'center',
                      marginTop: 2,
                      transform: 'translateX(-50%)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tick}% ({formatTime(tickTime, duration)})
                  </div>
                </div>
              );
            })}

            <div
              data-track="true"
              style={{
                position: 'absolute',
                top: TRACK_HEIGHT - 2,
                left: 0,
                right: 0,
                height: 2,
                background: 'linear-gradient(90deg, #00ff88, #00d4ff)',
                borderRadius: 1,
                pointerEvents: 'none',
              }}
            />

            {keyframes.map((kf) => {
              const leftPercent = kf.time * 100;
              const isSelected = kf.id === selectedId;
              const isHovered = kf.id === hoveredId;
              const showDelete = isHovered || isSelected;
              return (
                <div
                  key={kf.id}
                  data-keyframe={kf.id}
                  onMouseEnter={() => setHoveredId(kf.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({
                      visible: true,
                      x: e.clientX,
                      y: e.clientY,
                      keyframeId: kf.id,
                    });
                  }}
                  style={{
                    position: 'absolute',
                    left: `${leftPercent}%`,
                    top: TRACK_HEIGHT - KEYFRAME_SIZE / 2 - 1,
                    width: KEYFRAME_SIZE,
                    height: KEYFRAME_SIZE,
                    transform: showDelete ? 'translateX(-50%) translateY(-2px)' : 'translateX(-50%)',
                    transition: 'transform 0.15s',
                  }}
                >
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setSelectedId(kf.id);
                      setDragState({
                        type: 'keyframe',
                        keyframeId: kf.id,
                        startX: e.clientX,
                      });
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      background: isSelected
                        ? '#00ff88'
                        : isHovered
                          ? '#00d4ff'
                          : '#00ff88',
                      borderRadius: isSelected ? '50%' : 3,
                      cursor: 'grab',
                      zIndex: isSelected ? 10 : 5,
                      transition: 'border-radius 0.15s, box-shadow 0.15s',
                      boxShadow: isHovered
                        ? '0 0 12px 3px rgba(0,212,255,0.6)'
                        : isSelected
                          ? '0 0 12px 3px rgba(0,255,136,0.5)'
                          : '0 0 6px 1px rgba(0,255,136,0.3)',
                      opacity: isHovered || isSelected ? 1 : 0.85,
                    }}
                  />
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteKeyframe(kf.id);
                    }}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: -22,
                      transform: 'translateX(-50%)',
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: '#ff4466',
                      color: 'white',
                      fontSize: 12,
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 0 8px rgba(255,68,102,0.6)',
                      opacity: showDelete ? 1 : 0,
                      pointerEvents: showDelete ? 'auto' : 'none',
                      transition: 'opacity 0.15s',
                      zIndex: 20,
                      userSelect: 'none',
                    }}
                  >
                    ×
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              position: 'absolute',
              left: playheadX,
              top: 0,
              height: '100%',
              width: 2,
              background: '#ff4466',
              zIndex: 15,
              pointerEvents: 'none',
              transition: isPlaying ? 'left 0.016s linear' : 'none',
              borderRadius: 1,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                background: '#ff4466',
                borderRadius: '50%',
                position: 'absolute',
                top: -4,
                left: -4,
                boxShadow: '0 0 8px 2px rgba(255,68,102,0.6)',
              }}
            />
          </div>
        </div>
      </div>

      {contextMenu.visible && contextMenu.keyframeId && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            background: '#16213e',
            border: '1px solid #2a2a4a',
            padding: '6px 0',
            borderRadius: 4,
            minWidth: 120,
            zIndex: 100,
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}
        >
          <div
            onClick={() => {
              deleteKeyframe(contextMenu.keyframeId!);
              setContextMenu({ visible: false, x: 0, y: 0, keyframeId: null });
            }}
            style={{
              padding: '6px 14px',
              cursor: 'pointer',
              color: '#ff4466',
              fontSize: 13,
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#2a2a4a';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            删除关键帧
          </div>
        </div>
      )}

      {selectedKeyframe && (
        <div
          style={{
            marginTop: 12,
            background: '#16213e',
            borderRadius: 6,
            padding: 12,
            border: '1px solid #2a2a4a',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <span style={{ color: '#00ff88', fontWeight: 600, fontSize: 13 }}>
              Keyframe @ {(selectedKeyframe.time * 100).toFixed(1)}%
            </span>
            <button
              onClick={() => deleteKeyframe(selectedKeyframe.id)}
              style={{
                background: 'transparent',
                border: '1px solid #ff4466',
                color: '#ff4466',
                borderRadius: 4,
                padding: '2px 8px',
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              Delete
            </button>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
            }}
          >
            {(
              [
                { key: 'opacity', label: 'Opacity', min: 0, max: 1, step: 0.01 },
                { key: 'translateX', label: 'Translate X', min: -500, max: 500, step: 1 },
                { key: 'translateY', label: 'Translate Y', min: -500, max: 500, step: 1 },
                { key: 'scale', label: 'Scale', min: 0, max: 5, step: 0.01 },
                { key: 'rotate', label: 'Rotate', min: -360, max: 360, step: 1 },
              ] as const
            ).map(({ key, label, min, max, step }) => (
              <div key={key}>
                <label
                  style={{
                    fontSize: 10,
                    color: '#8888aa',
                    display: 'block',
                    marginBottom: 2,
                  }}
                >
                  {label}
                </label>
                <input
                  type="number"
                  value={selectedKeyframe[key]}
                  min={min}
                  max={max}
                  step={step}
                  onChange={(e) =>
                    updateKeyframe(selectedKeyframe.id, {
                      [key]: parseFloat(e.target.value) || 0,
                    })
                  }
                  style={{
                    width: '100%',
                    background: '#1a1a2e',
                    border: '1px solid #2a2a4a',
                    borderRadius: 4,
                    color: '#e0e0e0',
                    padding: '4px 6px',
                    fontSize: 12,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineEditor;
