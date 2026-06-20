import { useRef, useEffect, useCallback, useState } from 'react';
import { useStore } from '../store';
import type { WaveformPoint } from '../store';

type TrackMiniCanvasProps = {
  waveformPoints: WaveformPoint[];
  width: number;
  height: number;
};

function TrackMiniCanvas({ waveformPoints, width, height }: TrackMiniCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    if (waveformPoints.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#00D4AA';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const firstPoint = waveformPoints[0];
      ctx.moveTo(firstPoint.x * width, firstPoint.y * height);

      for (let i = 1; i < waveformPoints.length; i++) {
        const point = waveformPoints[i];
        ctx.lineTo(point.x * width, point.y * height);
      }

      ctx.stroke();
    }
  }, [waveformPoints, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className="track-waveform"
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    />
  );
}

type FloatingLayerProps = {
  track: {
    id: string;
    name: string;
    muted: boolean;
    waveformPoints: WaveformPoint[];
  };
  position: { x: number; y: number };
  visible: boolean;
  trackIndex: number;
};

function FloatingLayer({ track, position, visible, trackIndex }: FloatingLayerProps) {
  if (!visible) return null;

  return (
    <div
      className="drag-floating-layer"
      style={{
        left: position.x,
        top: position.y,
        width: '400px',
      }}
    >
      <div className="drag-handle" style={{ opacity: 1 }}>
        <span />
        <span />
        <span />
      </div>
      <span className="track-number">{trackIndex + 1}</span>
      <button
        className={`mute-btn ${track.muted ? 'muted' : ''}`}
        style={{ pointerEvents: 'none' }}
      >
        {track.muted ? 'M' : ''}
      </button>
      <TrackMiniCanvas waveformPoints={track.waveformPoints} width={200} height={40} />
    </div>
  );
}

export function MixerPanel() {
  const { tracks, toggleMute, reorderTracks, draggingTrackId, setDraggingTrackId } = useStore();
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(true);
  const [hasDragged, setHasDragged] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showFloatingLayer, setShowFloatingLayer] = useState(false);
  const [draggingTrack, setDraggingTrack] = useState<typeof tracks[0] | null>(null);
  const [draggingTrackIndex, setDraggingTrackIndex] = useState<number>(-1);
  const [insertPosition, setInsertPosition] = useState<'before' | 'after' | null>(null);

  const dragStartIndexRef = useRef<number | null>(null);
  const hintTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (showFloatingLayer) {
        setMousePosition({ x: e.clientX, y: e.clientY });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [showFloatingLayer]);

  useEffect(() => {
    if (hasDragged && showHint) {
      hintTimeoutRef.current = window.setTimeout(() => {
        setShowHint(false);
      }, 1500);
    }

    return () => {
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current);
      }
    };
  }, [hasDragged, showHint]);

  const getInsertPosition = useCallback(
    (e: React.DragEvent<HTMLDivElement>, element: HTMLDivElement): 'before' | 'after' => {
      const rect = element.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      return e.clientY < midY ? 'before' : 'after';
    },
    []
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      dragStartIndexRef.current = index;
      const track = tracks[index];
      setDraggingTrackId(track.id);
      setDraggingTrack(track);
      setDraggingTrackIndex(index);
      setShowFloatingLayer(true);
      setHasDragged(true);
      setMousePosition({ x: e.clientX, y: e.clientY });

      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));

      try {
        const transparentImg = new Image();
        transparentImg.src =
          'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(transparentImg, 0, 0);
      } catch {
        // noop
      }
    },
    [tracks, setDraggingTrackId]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      const insertPos = getInsertPosition(e, e.currentTarget as HTMLDivElement);

      if (dragStartIndexRef.current !== null) {
        const fromIndex = dragStartIndexRef.current;
        let targetIndex = index;
        if (insertPos === 'after' && index >= fromIndex) {
          targetIndex = index + 1;
        } else if (insertPos === 'after' && index < fromIndex) {
          targetIndex = index + 1;
        } else if (insertPos === 'before' && index > fromIndex) {
          targetIndex = index;
        }

        if (targetIndex !== fromIndex && targetIndex >= 0 && targetIndex <= tracks.length) {
          setDragOverIndex(index);
          setInsertPosition(insertPos);
        } else {
          setDragOverIndex(null);
          setInsertPosition(null);
        }
      }
    },
    [getInsertPosition, tracks.length]
  );

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    const relatedTarget = e.relatedTarget as Node;
    if (!e.currentTarget.contains(relatedTarget)) {
      setDragOverIndex(null);
      setInsertPosition(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, toIndex: number) => {
      e.preventDefault();
      e.stopPropagation();

      let fromIndex = dragStartIndexRef.current;
      if (fromIndex === null) {
        const raw = e.dataTransfer.getData('text/plain');
        if (raw) {
          const parsed = parseInt(raw, 10);
          if (!isNaN(parsed)) fromIndex = parsed;
        }
      }

      if (fromIndex !== null && fromIndex >= 0 && toIndex >= 0) {
        const insertPos = getInsertPosition(e, e.currentTarget as HTMLDivElement);
        let finalToIndex = toIndex;
        if (insertPos === 'after') {
          finalToIndex = toIndex < fromIndex ? toIndex + 1 : toIndex + 1;
        }

        if (finalToIndex > fromIndex) {
          finalToIndex = finalToIndex - 1;
        }

        if (fromIndex !== finalToIndex && finalToIndex >= 0 && finalToIndex < tracks.length) {
          reorderTracks(fromIndex, finalToIndex);
        }
      }

      dragStartIndexRef.current = null;
      setDraggingTrackId(null);
      setDraggingTrack(null);
      setDraggingTrackIndex(-1);
      setShowFloatingLayer(false);
      setDragOverIndex(null);
      setInsertPosition(null);
    },
    [reorderTracks, setDraggingTrackId, getInsertPosition, tracks.length]
  );

  const handleDragEnd = useCallback(() => {
    dragStartIndexRef.current = null;
    setDraggingTrackId(null);
    setDraggingTrack(null);
    setDraggingTrackIndex(-1);
    setShowFloatingLayer(false);
    setDragOverIndex(null);
    setInsertPosition(null);
  }, [setDraggingTrackId]);

  const handleContainerDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleContainerDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (dragStartIndexRef.current === null) return;

      const mixerPanel = e.currentTarget as HTMLDivElement;
      const rect = mixerPanel.getBoundingClientRect();

      if (e.clientY > rect.bottom - 20) {
        const fromIndex = dragStartIndexRef.current;
        if (fromIndex !== tracks.length - 1) {
          reorderTracks(fromIndex, tracks.length - 1);
        }
      } else if (e.clientY < rect.top + 30) {
        const fromIndex = dragStartIndexRef.current;
        if (fromIndex !== 0) {
          reorderTracks(fromIndex, 0);
        }
      }

      handleDragEnd();
    },
    [reorderTracks, handleDragEnd, tracks.length]
  );

  const getTrackClass = (index: number): string => {
    const classes = ['track'];
    if (draggingTrackId === tracks[index].id) {
      classes.push('dragging-source');
    }
    if (dragOverIndex === index && dragStartIndexRef.current !== index) {
      if (insertPosition === 'before') {
        classes.push('drag-over-before');
      } else if (insertPosition === 'after') {
        classes.push('drag-over-after');
      }
    }
    return classes.join(' ');
  };

  const renderTrackWithPlaceholder = (track: typeof tracks[0], index: number) => {
    const showPlaceholder =
      dragOverIndex === index &&
      dragStartIndexRef.current !== index &&
      insertPosition === 'before';

    return (
      <div key={`wrapper-${track.id}`}>
        {showPlaceholder && <div className="drop-placeholder" />}
        <div
          key={track.id}
          className={getTrackClass(index)}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
        >
          <div className="drag-handle" title="Drag to reorder">
            <span />
            <span />
            <span />
          </div>
          <span className="track-number">{index + 1}</span>
          <button
            className={`mute-btn ${track.muted ? 'muted' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleMute(track.id);
            }}
            aria-label={track.muted ? 'Unmute track' : 'Mute track'}
          >
            {track.muted ? 'M' : ''}
          </button>
          <TrackMiniCanvas waveformPoints={track.waveformPoints} width={200} height={40} />
        </div>
        {showPlaceholder && <div style={{ display: 'none' }} />}
      </div>
    );
  };

  return (
    <div
      className="mixer-panel"
      onDragOver={handleContainerDragOver}
      onDrop={handleContainerDrop}
    >
      <div className={`mixer-drag-hint ${!showHint ? 'hidden' : ''}`}>
        拖拽轨道可调整顺序
      </div>

      {tracks.map((track, index) => renderTrackWithPlaceholder(track, index))}

      {dragOverIndex === tracks.length - 1 && insertPosition === 'after' && (
        <div className="drop-placeholder" />
      )}

      {draggingTrack && draggingTrackIndex >= 0 && (
        <FloatingLayer
          track={draggingTrack}
          position={mousePosition}
          visible={showFloatingLayer}
          trackIndex={draggingTrackIndex}
        />
      )}
    </div>
  );
}
