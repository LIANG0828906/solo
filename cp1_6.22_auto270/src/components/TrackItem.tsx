import { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions';
import { Scissors, Trash2, Check, X, GripVertical } from 'lucide-react';
import type { Track } from '@/store/editorStore';

interface TrackItemProps {
  track: Track;
  index: number;
  onVolumeChange: (id: string, volume: number) => void;
  onDelete: (id: string) => void;
  onTrimStart: (id: string) => void;
  onTrimCancel: (id: string) => void;
  onTrimConfirm: (id: string) => void;
  onTrimPointsChange: (id: string, start: number, end: number) => void;
  onWaveSurferReady: (id: string, ws: WaveSurfer) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (index: number) => void;
  isPlaying: boolean;
  currentTime: number;
}

export default function TrackItem({
  track,
  index,
  onVolumeChange,
  onDelete,
  onTrimStart,
  onTrimCancel,
  onTrimConfirm,
  onTrimPointsChange,
  onWaveSurferReady,
  onDragStart,
  onDragOver,
  onDrop,
  isPlaying,
  currentTime,
}: TrackItemProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<any>(null);
  const activeRegionRef = useRef<any>(null);
  const [blobUrl, setBlobUrl] = useState<string>('');
  const [wsKey, setWsKey] = useState(0);

  useEffect(() => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    const url = URL.createObjectURL(track.wavBlob);
    setBlobUrl(url);
    setWsKey((k) => k + 1);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [track.wavBlob]);

  useEffect(() => {
    if (!containerRef.current || !blobUrl) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: track.waveColor,
      progressColor: track.waveColor + '66',
      cursorColor: '#FF4444',
      cursorWidth: 2,
      height: 80,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      interact: false,
      hideScrollbar: true,
    });

    const regions = ws.registerPlugin(RegionsPlugin.create());
    regionsRef.current = regions;

    ws.load(blobUrl);

    ws.on('ready', () => {
      onWaveSurferReady(track.id, ws);
    });

    wsRef.current = ws;

    return () => {
      ws.destroy();
      wsRef.current = null;
    };
  }, [blobUrl, wsKey]);

  useEffect(() => {
    if (!wsRef.current) return;
    const ws = wsRef.current;
    const dur = ws.getDuration();
    if (dur > 0 && !isPlaying) {
      ws.seekTo(Math.min(currentTime / dur, 1));
    }
  }, [currentTime, isPlaying]);

  useEffect(() => {
    const ws = wsRef.current;
    const regions = regionsRef.current;
    if (!ws || !regions) return;

    if (track.isTrimming) {
      const dur = ws.getDuration();
      const start = Math.min(track.trimStart, dur);
      const end = Math.min(track.trimEnd, dur);
      const region = regions.addRegion({
        start,
        end,
        color: 'rgba(51, 153, 255, 0.2)',
        drag: true,
        resize: true,
      });
      activeRegionRef.current = region;

      region.on('update-end', () => {
        onTrimPointsChange(track.id, region.start, region.end);
      });
    } else {
      regions.clearRegions();
      activeRegionRef.current = null;
    }

    return () => {
      if (regions) {
        regions.clearRegions();
        activeRegionRef.current = null;
      }
    };
  }, [track.isTrimming]);

  const durationStr = `${Math.floor(track.duration / 60)
    .toString()
    .padStart(2, '0')}:${Math.floor(track.duration % 60)
    .toString()
    .padStart(2, '0')}`;

  return (
    <div
      className="track-item"
      draggable={!track.isTrimming}
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={() => onDrop(index)}
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 120,
        padding: '0 16px',
        borderBottom: '1px solid #333333',
        gap: 12,
        cursor: track.isTrimming ? 'default' : 'grab',
        position: 'relative',
        background: '#1C1C1C',
        transition: 'background 0.2s ease',
      }}
      onMouseEnter={(e) => {
        if (!track.isTrimming) {
          (e.currentTarget as HTMLDivElement).style.background = '#252525';
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = '#1C1C1C';
      }}
    >
      <div
        className="grip-handle"
        style={{
          color: '#9CA3AF',
          cursor: track.isTrimming ? 'default' : 'grab',
          display: 'flex',
          alignItems: 'center',
          transition: 'color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.color = '#EAEAEA';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.color = '#9CA3AF';
        }}
      >
        <GripVertical size={20} />
      </div>

      <div style={{ minWidth: 90 }}>
        <div style={{ color: '#EAEAEA', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
          {track.name}
        </div>
        <div style={{ color: '#9CA3AF', fontSize: 12 }}>{durationStr}</div>
      </div>

      <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
        <div ref={containerRef} style={{ width: '100%' }} />
        {track.splicePoints.map((point, i) => {
          const dur = track.duration;
          if (dur <= 0) return null;
          const leftPercent = (point / dur) * 100;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: 0,
                left: `${leftPercent}%`,
                width: 4,
                height: '100%',
                background: 'rgba(85, 85, 85, 0.7)',
                pointerEvents: 'none',
                zIndex: 10,
              }}
            />
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 140 }}>
        <input
          type="range"
          min={0}
          max={100}
          value={track.volume}
          onChange={(e) => onVolumeChange(track.id, Number(e.target.value))}
          style={{
            width: 80,
            accentColor: track.waveColor,
            cursor: 'pointer',
          }}
        />
        <span style={{ color: '#9CA3AF', fontSize: 12, minWidth: 28 }}>
          {track.volume}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {track.isTrimming ? (
          <>
            <button
              onClick={() => onTrimConfirm(track.id)}
              className="action-btn"
              style={{
                background: '#4CAF50',
                border: 'none',
                borderRadius: 6,
                color: '#fff',
                padding: '4px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#66BB6A';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#4CAF50';
              }}
            >
              <Check size={16} />
            </button>
            <button
              onClick={() => onTrimCancel(track.id)}
              className="action-btn"
              style={{
                background: '#F44336',
                border: 'none',
                borderRadius: 6,
                color: '#fff',
                padding: '4px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#EF5350';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#F44336';
              }}
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onTrimStart(track.id)}
              className="action-btn"
              style={{
                background: 'transparent',
                border: '1px solid #555',
                borderRadius: 6,
                color: '#9CA3AF',
                padding: '4px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.borderColor = '#3399FF';
                btn.style.color = '#3399FF';
                btn.style.boxShadow = '0 0 6px rgba(51,153,255,0.3)';
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.borderColor = '#555';
                btn.style.color = '#9CA3AF';
                btn.style.boxShadow = 'none';
              }}
            >
              <Scissors size={16} />
            </button>
            <button
              onClick={() => onDelete(track.id)}
              className="action-btn"
              style={{
                background: 'transparent',
                border: '1px solid #555',
                borderRadius: 6,
                color: '#9CA3AF',
                padding: '4px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.borderColor = '#FF4444';
                btn.style.color = '#FF4444';
                btn.style.boxShadow = '0 0 6px rgba(255,68,68,0.3)';
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.borderColor = '#555';
                btn.style.color = '#9CA3AF';
                btn.style.boxShadow = 'none';
              }}
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
