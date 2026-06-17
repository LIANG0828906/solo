import { Play, Pause } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { generateTimeline, startPlayback, stopPlayback, formatTime } from '@/engine/mediaTimeline';
import type { LightKeyframe, SoundKeyframe } from '@/types';

interface DragInfo {
  type: 'light' | 'sound';
  id: string;
  startX: number;
  startTimestamp: number;
}

const TIMELINE_DURATION = 60000;
const TRACK_HEIGHT = 60;
const LIGHT_TRACK_TOP = 20;
const SOUND_TRACK_TOP = LIGHT_TRACK_TOP + TRACK_HEIGHT + 20;

const TimelinePanel: React.FC = () => {
  const lightKeyframes = useProjectStore((state) => state.lightKeyframes);
  const soundKeyframes = useProjectStore((state) => state.soundKeyframes);
  const currentTime = useProjectStore((state) => state.currentTime);
  const isPlaying = useProjectStore((state) => state.isPlaying);
  const setCurrentTime = useProjectStore((state) => state.setCurrentTime);
  const setIsPlaying = useProjectStore((state) => state.setIsPlaying);
  const updateLightKeyframe = useProjectStore((state) => state.updateLightKeyframe);
  const updateSoundKeyframe = useProjectStore((state) => state.updateSoundKeyframe);

  const timelineRef = useRef<HTMLDivElement | null>(null);
  const dragInfoRef = useRef<DragInfo | null>(null);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (isPlaying) {
      const timeline = generateTimeline(lightKeyframes, soundKeyframes);
      startPlayback(timeline, (time) => {
        if (time >= TIMELINE_DURATION) {
          stopPlayback();
          setIsPlaying(false);
          setCurrentTime(0);
        } else {
          setCurrentTime(time);
        }
      });
    } else {
      stopPlayback();
    }
    return () => {
      stopPlayback();
    };
  }, [isPlaying, lightKeyframes, soundKeyframes, setCurrentTime, setIsPlaying]);

  const handlePlayPause = (): void => {
    setIsPlaying(!isPlaying);
  };

  const getTimelineWidth = (): number => {
    return timelineRef.current ? timelineRef.current.clientWidth - 24 : 0;
  };

  const timestampToX = (timestamp: number): number => {
    const width = getTimelineWidth();
    return (timestamp / TIMELINE_DURATION) * width;
  };

  const xToTimestamp = (x: number): number => {
    const width = getTimelineWidth();
    const clampedX = Math.max(0, Math.min(x, width));
    return (clampedX / width) * TIMELINE_DURATION;
  };

  const handleLightKeyframeMouseDown = (e: React.MouseEvent, kf: LightKeyframe): void => {
    e.stopPropagation();
    dragInfoRef.current = {
      type: 'light',
      id: kf.id,
      startX: e.clientX,
      startTimestamp: kf.timestamp,
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleSoundKeyframeMouseDown = (e: React.MouseEvent, kf: SoundKeyframe): void => {
    e.stopPropagation();
    dragInfoRef.current = {
      type: 'sound',
      id: kf.id,
      startX: e.clientX,
      startTimestamp: kf.timestamp,
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent): void => {
    const drag = dragInfoRef.current;
    if (!drag || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left - 12;
    const deltaX = e.clientX - drag.startX;
    const deltaTimestamp = xToTimestamp(relativeX) - xToTimestamp(relativeX - deltaX);
    const newTimestamp = Math.max(0, Math.min(TIMELINE_DURATION, drag.startTimestamp + deltaTimestamp));

    if (drag.type === 'light') {
      updateLightKeyframe(drag.id, { timestamp: newTimestamp });
    } else {
      updateSoundKeyframe(drag.id, { timestamp: newTimestamp });
    }
    forceUpdate((n) => n + 1);
  };

  const handleMouseUp = (): void => {
    dragInfoRef.current = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleSoundKeyframeClick = (kf: SoundKeyframe): void => {
    if (dragInfoRef.current) return;
    try {
      const audio = new Audio(kf.audioData);
      void audio.play();
    } catch {
    }
  };

  const handleTimelineClick = (e: React.MouseEvent): void => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 12;
    setCurrentTime(xToTimestamp(x));
  };

  const ticks: number[] = [];
  for (let t = 0; t <= TIMELINE_DURATION; t += 5000) {
    ticks.push(t);
  }

  const rgbToString = (c: { r: number; g: number; b: number }): string =>
    `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})`;

  return (
    <div
      style={{
        width: 300,
        background: '#2D2D44',
        borderRadius: 8,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <button
          onClick={handlePlayPause}
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            background: '#3D3D5C',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#4A4A6A';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#3D3D5C';
          }}
        >
          {isPlaying ? (
            <Pause size={20} color="#FFFFFF" />
          ) : (
            <Play size={20} color="#FFFFFF" />
          )}
        </button>
        <span
          style={{
            fontFamily: 'monospace',
            color: '#FFFFFF',
            fontSize: 18,
          }}
        >
          {formatTime(currentTime)}
        </span>
      </div>

      <div
        ref={timelineRef}
        onClick={handleTimelineClick}
        style={{
          height: 200,
          background: '#1E1E2E',
          borderRadius: 8,
          padding: 12,
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: 12,
            right: 12,
            height: 1,
            background: '#4A4A6A',
          }}
        />
        {ticks.map((t) => (
          <div
            key={t}
            style={{
              position: 'absolute',
              bottom: 20,
              left: 12 + timestampToX(t),
              width: 1,
              height: 6,
              background: '#4A4A6A',
            }}
          />
        ))}

        <div
          style={{
            position: 'absolute',
            left: 12 + timestampToX(currentTime),
            top: 0,
            bottom: 0,
            width: 2,
            background: '#FFFFFF',
            pointerEvents: 'none',
          }}
        />

        {lightKeyframes.map((kf) => (
          <div
            key={kf.id}
            onMouseDown={(e) => handleLightKeyframeMouseDown(e, kf)}
            style={{
              position: 'absolute',
              left: 12 + timestampToX(kf.timestamp) - 8,
              top: LIGHT_TRACK_TOP,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: rgbToString(kf.color),
              cursor: 'grab',
              boxShadow: '0 0 4px rgba(0,0,0,0.5)',
            }}
          />
        ))}

        {soundKeyframes.map((kf) => (
          <div
            key={kf.id}
            onMouseDown={(e) => handleSoundKeyframeMouseDown(e, kf)}
            onClick={() => handleSoundKeyframeClick(kf)}
            style={{
              position: 'absolute',
              left: 12 + timestampToX(kf.timestamp) - 8,
              top: SOUND_TRACK_TOP,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: '#FFE5B4',
              cursor: 'grab',
              boxShadow: '0 0 4px rgba(0,0,0,0.5)',
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default TimelinePanel;
