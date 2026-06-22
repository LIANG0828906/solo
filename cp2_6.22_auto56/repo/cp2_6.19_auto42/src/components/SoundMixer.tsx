import React, { useRef, useEffect, useState } from 'react';
import type { SoundTrack } from '../store/useAppStore';
import { easeOutCubic, mapToColor } from '../utils/helpers';

interface SoundMixerProps {
  tracks: SoundTrack[];
  isPlaying: boolean;
  spectrumPeak: number;
  onVolumeChange: (id: string, volume: number) => void;
  onToggleMute: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export default function SoundMixer({
  tracks, isPlaying, spectrumPeak, onVolumeChange, onToggleMute, onReorder,
}: SoundMixerProps) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [displayVolumes, setDisplayVolumes] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    tracks.forEach((track) => {
      initial[track.id] = track.volume;
    });
    return initial;
  });

  const animationRefs = useRef<Record<string, { rafId: number | null; startTime: number; startValue: number; targetValue: number } | null>>({});

  useEffect(() => {
    tracks.forEach((track) => {
      setDisplayVolumes((prev) => {
        if (prev[track.id] === undefined) {
          return { ...prev, [track.id]: track.volume };
        }
        return prev;
      });
    });
  }, [tracks]);

  useEffect(() => {
    tracks.forEach((track) => {
      const prevDisplay = displayVolumes[track.id];
      if (prevDisplay !== undefined && prevDisplay !== track.volume) {
        animateVolume(track.id, prevDisplay, track.volume);
      }
    });
  }, [tracks]);

  const animateVolume = (id: string, from: number, to: number) => {
    const animState = animationRefs.current[id];
    if (animState?.rafId) {
      cancelAnimationFrame(animState.rafId);
    }

    const duration = 300;
    const startTime = performance.now();

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const currentValue = from + (to - from) * eased;

      setDisplayVolumes((prev) => ({ ...prev, [id]: currentValue }));

      if (progress < 1) {
        animationRefs.current[id] = {
          rafId: requestAnimationFrame(step),
          startTime,
          startValue: from,
          targetValue: to,
        };
      } else {
        animationRefs.current[id] = null;
      }
    };

    animationRefs.current[id] = {
      rafId: requestAnimationFrame(step),
      startTime,
      startValue: from,
      targetValue: to,
    };
  };

  useEffect(() => {
    return () => {
      Object.values(animationRefs.current).forEach((anim) => {
        if (anim?.rafId) {
          cancelAnimationFrame(anim.rafId);
        }
      });
    };
  }, []);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    const target = e.currentTarget;
    requestAnimationFrame(() => {
      target.style.opacity = '0.5';
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (draggingIndex !== null && dragOverIndex !== null && draggingIndex !== dragOverIndex) {
      onReorder(draggingIndex, dragOverIndex);
    }
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = '1';
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleVolumeChange = (id: string, value: number) => {
    onVolumeChange(id, value);
  };

  const brightnessValue = isPlaying ? 1 + spectrumPeak * 0.5 : 1;

  return (
    <div className="sound-mixer">
      {tracks.map((track, index) => {
        const bgColor = mapToColor(track.volume, track.hue);
        const isDragging = draggingIndex === index;
        const isDragOver = dragOverIndex === index && draggingIndex !== index;

        return (
          <div
            key={track.id}
            className={`track-card ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
            data-index={index}
            draggable={true}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            onDragLeave={handleDragLeave}
            style={{
              background: `linear-gradient(180deg, ${bgColor} 0%, transparent 100%)`,
              filter: isPlaying ? `brightness(${brightnessValue})` : undefined,
            }}
          >
            <div className="drag-handle">⋮⋮</div>
            <div className="track-label">{track.name}</div>
            <div className="slider-wrapper">
              <input
                type="range"
                // @ts-expect-error - orient is a non-standard attribute for vertical sliders
                orient="vertical"
                className="vertical-slider"
                min={0}
                max={100}
                value={track.volume}
                disabled={track.muted}
                onChange={(e) => handleVolumeChange(track.id, Number(e.target.value))}
              />
            </div>
            <div className="volume-display">{Math.round(displayVolumes[track.id] ?? 0)}%</div>
            <button
              className={`mute-btn ${track.muted ? 'muted' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleMute(track.id);
              }}
              title={track.muted ? '取消静音' : '静音'}
            >
              {track.muted ? '🔇' : '🔊'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
