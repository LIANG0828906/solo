import { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { useMarkersStore } from '../store/markersStore';

interface TimeSliderProps {
  roomCreatedAt: number;
}

const TICK_INTERVAL = 30000;

export function TimeSlider({ roomCreatedAt }: TimeSliderProps) {
  const { playbackTime, setPlaybackTime, setPlaybackMarkers, markers } = useMarkersStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const sliderRef = useRef<HTMLInputElement>(null);
  const playIntervalRef = useRef<number | null>(null);

  const now = Date.now();
  const minTime = roomCreatedAt;
  const maxTime = now;
  const totalDuration = maxTime - minTime;

  const currentTime = playbackTime ?? maxTime;

  const ticks = useMemo(() => {
    const result: number[] = [];
    let t = minTime;
    while (t <= maxTime) {
      result.push(t);
      t += TICK_INTERVAL;
    }
    if (result[result.length - 1] < maxTime) {
      result.push(maxTime);
    }
    return result;
  }, [minTime, maxTime]);

  useEffect(() => {
    if (isPlaying && playbackTime !== null) {
      playIntervalRef.current = window.setInterval(() => {
        setPlaybackTime((prev) => {
          if (prev === null) return maxTime;
          const next = prev + 1000;
          if (next >= maxTime) {
            setIsPlaying(false);
            return maxTime;
          }
          return next;
        });
      }, 1000);
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, maxTime, setPlaybackTime]);

  useEffect(() => {
    if (playbackTime !== null) {
      const historical = markers.filter(
        (m) => m.createdAt <= playbackTime && (!m.isDeleted || m.updatedAt > playbackTime)
      );
      setPlaybackMarkers(historical);
    } else {
      setPlaybackMarkers([]);
    }
  }, [playbackTime, markers, setPlaybackMarkers]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setPlaybackTime(value);
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    if (playbackTime === null || playbackTime >= maxTime) {
      setPlaybackTime(minTime);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setPlaybackTime(null);
    setIsPlaying(false);
    setPlaybackMarkers([]);
  };

  const handleSkipBack = () => {
    setPlaybackTime((prev) => {
      if (prev === null) return maxTime - TICK_INTERVAL;
      return Math.max(minTime, prev - TICK_INTERVAL);
    });
    setIsPlaying(false);
  };

  const handleSkipForward = () => {
    setPlaybackTime((prev) => {
      if (prev === null) return maxTime;
      return Math.min(maxTime, prev + TICK_INTERVAL);
    });
    setIsPlaying(false);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toTimeString().slice(0, 8);
  };

  const isPlaybackMode = playbackTime !== null;

  return (
    <div
      className="time-slider-container"
      style={{
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '80%',
        maxWidth: '800px',
        background: 'rgba(30, 39, 58, 0.85)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '12px 20px',
        zIndex: 50,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '8px',
        }}
      >
        <span
          style={{
            color: isPlaybackMode ? '#FFD700' : '#fff',
            fontSize: '12px',
            fontWeight: 600,
            minWidth: '70px',
          }}
        >
          {isPlaybackMode ? '回放模式' : '实时模式'}
        </span>
        <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '11px' }}>
          {formatTime(currentTime)}
        </span>
        {isPlaybackMode && (
          <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px' }}>
            / {formatTime(maxTime)}
          </span>
        )}
      </div>

      <div style={{ position: 'relative', height: '24px' }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '0',
            right: '0',
            height: '6px',
            background: '#34495E',
            borderRadius: '3px',
            transform: 'translateY(-50%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '0',
            width: `${((currentTime - minTime) / totalDuration) * 100}%`,
            height: '6px',
            background: 'linear-gradient(90deg, #3498DB, #1ABC9C)',
            borderRadius: '3px',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'absolute', top: '0', left: '0', right: '0', height: '24px' }}>
          {ticks.map((tick, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: `${((tick - minTime) / totalDuration) * 100}%`,
                width: '2px',
                height: '12px',
                background: 'rgba(255, 255, 255, 0.3)',
                transform: 'translate(-50%, -50%)',
              }}
              title={formatTime(tick)}
            />
          ))}
        </div>

        <input
          ref={sliderRef}
          type="range"
          min={minTime}
          max={maxTime}
          value={currentTime}
          onChange={handleSliderChange}
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '24px',
            margin: 0,
            opacity: 0,
            cursor: 'pointer',
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: `${((currentTime - minTime) / totalDuration) * 100}%`,
            width: '18px',
            height: '18px',
            background: isPlaybackMode ? '#1ABC9C' : '#3498DB',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            boxShadow: `0 0 10px ${isPlaybackMode ? '#1ABC9C' : '#3498DB'}`,
            pointerEvents: 'none',
            transition: 'background 0.2s',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          marginTop: '12px',
        }}
      >
        <button
          onClick={handleSkipBack}
          title="后退30秒"
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          <SkipBack size={16} />
        </button>

        <button
          onClick={handlePlayPause}
          title={isPlaying ? '暂停' : '播放'}
          style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #3498DB, #9B59B6)',
            border: 'none',
            borderRadius: '50%',
            color: '#fff',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(52, 152, 219, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>

        <button
          onClick={handleSkipForward}
          title="前进30秒"
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          <SkipForward size={16} />
        </button>

        <button
          onClick={handleReset}
          title="返回实时"
          style={{
            padding: '6px 14px',
            marginLeft: '8px',
            background: isPlaybackMode ? '#1ABC9C' : 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!isPlaybackMode) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isPlaybackMode) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }
          }}
        >
          返回实时
        </button>
      </div>
    </div>
  );
}
