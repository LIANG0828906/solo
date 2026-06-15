import '../styles.css';
import React, { useMemo, useRef, useEffect } from 'react';
import { Track } from '../AudioEngine';
import { TrackComponent } from './Track';
import { Music, Plus } from 'lucide-react';

export interface TrackAreaProps {
  tracks: Track[];
  trackPeaks: Map<string, number[]>;
  pixelsPerSecond: number;
  isPlaying: boolean;
  currentTime: number;
  readOnly: boolean;
  onMuteTrack: (id: string) => void;
  onSoloTrack: (id: string) => void;
  onTrackDragStart: (id: string) => void;
  onTrackDragMove: (id: string, deltaSeconds: number) => void;
  onTrackDragEnd: (id: string) => void;
  onAddTrack?: () => void;
}

const MAX_TRACKS = 8;
const MIN_VISIBLE_SECONDS = 60;
const TRACK_CONTROLS_WIDTH = 136;

export const TrackArea: React.FC<TrackAreaProps> = ({
  tracks,
  trackPeaks,
  pixelsPerSecond,
  isPlaying,
  currentTime,
  readOnly,
  onMuteTrack,
  onSoloTrack,
  onTrackDragStart,
  onTrackDragMove,
  onTrackDragEnd,
  onAddTrack,
}) => {
  const trackListRef = useRef<HTMLDivElement>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

  const isSoloMode = tracks.some((t) => t.soloed);

  const totalDuration = useMemo(() => {
    let max = 0;
    for (const track of tracks) {
      const end = track.startTime + track.duration;
      if (end > max) max = end;
    }
    return Math.max(MIN_VISIBLE_SECONDS, max + 10);
  }, [tracks]);

  const contentWidth = totalDuration * pixelsPerSecond;

  useEffect(() => {
    const trackList = trackListRef.current;
    const timeline = timelineScrollRef.current;
    if (!trackList || !timeline) return;

    const handleTrackListScroll = () => {
      if (isSyncing.current) return;
      isSyncing.current = true;
      timeline.scrollLeft = trackList.scrollLeft;
      requestAnimationFrame(() => {
        isSyncing.current = false;
      });
    };

    trackList.addEventListener('scroll', handleTrackListScroll);
    return () => trackList.removeEventListener('scroll', handleTrackListScroll);
  }, []);

  const renderTimeline = () => {
    const ticks: React.ReactNode[] = [];

    for (let t = 0; t <= totalDuration; t += 0.5) {
      const left = t * pixelsPerSecond;
      const isMajor = t % 1 === 0;

      if (isMajor) {
        ticks.push(
          <div
            key={`major-${t}`}
            style={{
              position: 'absolute',
              left,
              top: 0,
              width: '1px',
              height: '16px',
              background: 'rgba(255, 255, 255, 0.3)',
            }}
          />
        );
        ticks.push(
          <span
            key={`label-${t}`}
            style={{
              position: 'absolute',
              left: left + 4,
              top: '16px',
              color: '#a0a0b8',
              fontSize: '10px',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {t}s
          </span>
        );
      } else {
        ticks.push(
          <div
            key={`minor-${t}`}
            style={{
              position: 'absolute',
              left,
              top: 0,
              width: '1px',
              height: '8px',
              background: 'rgba(255, 255, 255, 0.15)',
            }}
          />
        );
      }
    }

    return ticks;
  };

  const renderEmptySlots = () => {
    const slots = [];
    const emptyCount = MAX_TRACKS - tracks.length;

    for (let i = 0; i < emptyCount; i++) {
      slots.push(
        <div
          key={`empty-${i}`}
          className="track-row"
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: TRACK_CONTROLS_WIDTH,
              flexShrink: 0,
              padding: '0 12px',
            }}
          />
          <div
            style={{
              flex: 1,
              height: '100%',
              border: '1px dashed rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'rgba(255, 255, 255, 0.3)',
                fontSize: '13px',
              }}
            >
              <Plus size={16} />
              <span>空轨道</span>
            </div>
          </div>
        </div>
      );
    }

    return slots;
  };

  const renderEmptyState = () => (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        color: 'rgba(255, 255, 255, 0.5)',
        padding: '40px 20px',
      }}
    >
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Music size={40} color="rgba(255, 255, 255, 0.4)" />
      </div>
      <span style={{ fontSize: '14px' }}>点击导入按钮添加音频轨道</span>
      {onAddTrack && !readOnly && (
        <button
          onClick={onAddTrack}
          className="btn"
          style={{
            marginTop: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Plus size={16} />
          <span>添加轨道</span>
        </button>
      )}
    </div>
  );

  const hasTracks = tracks.length > 0;

  return (
    <div
      className="track-area"
      style={{
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        padding: '8px 0',
      }}
    >
      <div
        style={{
          height: '32px',
          background: '#0f172a',
          flexShrink: 0,
          display: 'flex',
          paddingLeft: '8px',
        }}
      >
        <div
          style={{
            width: TRACK_CONTROLS_WIDTH,
            flexShrink: 0,
          }}
        />
        <div
          ref={timelineScrollRef}
          style={{
            flex: 1,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: contentWidth,
              height: '100%',
            }}
          >
            {renderTimeline()}
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: currentTime * pixelsPerSecond,
                width: '2px',
                background: '#ef4444',
                zIndex: 2,
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>
      </div>

      <div
        ref={trackListRef}
        style={{
          flex: 1,
          overflow: 'auto',
          position: 'relative',
        }}
      >
        {hasTracks ? (
          <div
            style={{
              position: 'relative',
              minWidth: contentWidth + TRACK_CONTROLS_WIDTH + 16,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 8 + TRACK_CONTROLS_WIDTH + currentTime * pixelsPerSecond,
                width: '2px',
                background: '#ef4444',
                zIndex: 10,
                pointerEvents: 'none',
              }}
            />
            {tracks.map((track) => (
              <TrackComponent
                key={track.id}
                track={track}
                peaks={trackPeaks.get(track.id) || []}
                pixelsPerSecond={pixelsPerSecond}
                isSoloMode={isSoloMode}
                readOnly={readOnly}
                onMute={onMuteTrack}
                onSolo={onSoloTrack}
                onDragStart={onTrackDragStart}
                onDragMove={onTrackDragMove}
                onDragEnd={onTrackDragEnd}
                currentTime={currentTime}
              />
            ))}
            {renderEmptySlots()}
          </div>
        ) : (
          renderEmptyState()
        )}
      </div>
    </div>
  );
};

export default TrackArea;
