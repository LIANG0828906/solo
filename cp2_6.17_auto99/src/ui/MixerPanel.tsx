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

export function MixerPanel() {
  const { tracks, toggleMute, reorderTracks, draggingTrackId, setDraggingTrackId } = useStore();
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragStartIndexRef = useRef<number | null>(null);

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      dragStartIndexRef.current = index;
      setDraggingTrackId(tracks[index].id);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index.toString());
    },
    [tracks, setDraggingTrackId]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverIndex(index);
    },
    []
  );

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, toIndex: number) => {
      e.preventDefault();
      const fromIndex = dragStartIndexRef.current;

      if (fromIndex !== null && fromIndex !== toIndex) {
        reorderTracks(fromIndex, toIndex);
      }

      dragStartIndexRef.current = null;
      setDraggingTrackId(null);
      setDragOverIndex(null);
    },
    [reorderTracks, setDraggingTrackId]
  );

  const handleDragEnd = useCallback(() => {
    dragStartIndexRef.current = null;
    setDraggingTrackId(null);
    setDragOverIndex(null);
  }, [setDraggingTrackId]);

  return (
    <div className="mixer-panel">
      {tracks.map((track, index) => (
        <div
          key={track.id}
          className={`track ${draggingTrackId === track.id ? 'dragging' : ''}`}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          style={{
            transform: dragOverIndex === index && draggingTrackId !== track.id ? 'translateY(4px)' : 'none',
          }}
        >
          <div className="drag-handle">
            <span />
            <span />
            <span />
          </div>
          <span className="track-number">{index + 1}</span>
          <button
            className={`mute-btn ${track.muted ? 'muted' : ''}`}
            onClick={() => toggleMute(track.id)}
            aria-label={track.muted ? 'Unmute' : 'Mute'}
          >
            {track.muted ? 'M' : ''}
          </button>
          <TrackMiniCanvas
            waveformPoints={track.waveformPoints}
            width={200}
            height={40}
          />
        </div>
      ))}
    </div>
  );
}
