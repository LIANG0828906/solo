import React, { useEffect, useRef, useState } from 'react';
import { useCanvasStore } from '../store/useCanvasStore';

const speedOptions = [0.5, 1, 2];

function getShapeLabel(type: string): string {
  const labels: Record<string, string> = {
    brush: '画笔',
    rectangle: '矩形',
    circle: '圆形',
    line: '直线',
    eraser: '橡皮擦',
    note: '便签',
  };
  return labels[type] || type;
}

function formatTimestamp(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = (seconds - mins * 60).toFixed(0);
  return `${mins}m${secs}s`;
}

const PlaybackPanel: React.FC<{ isCollapsedMobile?: boolean }> = ({ isCollapsedMobile = false }) => {
  const {
    actionTimeline,
    isPlayback,
    playbackIndex,
    playbackSpeed,
    startPlayback,
    stopPlayback,
    setPlaybackIndex,
    setPlaybackSpeed,
    stepPlayback,
    isPlaybackPanelExpanded,
    togglePlaybackPanel,
  } = useCanvasStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const animationRef = useRef<number | null>(null);
  const lastStepTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);

  const totalSteps = actionTimeline.length;
  const totalDuration = actionTimeline.reduce((sum, t) => sum + t.delay, 0);
  const currentDuration = actionTimeline
    .slice(0, playbackIndex + 1)
    .reduce((sum, t) => sum + t.delay, 0);

  useEffect(() => {
    if (!isPlaying || !isPlayback) return;

    const animate = (timestamp: number) => {
      if (!lastStepTimeRef.current) {
        lastStepTimeRef.current = timestamp;
      }

      const delta = timestamp - lastStepTimeRef.current;
      lastStepTimeRef.current = timestamp;
      accumulatedTimeRef.current += delta * playbackSpeed;

      while (playbackIndex >= -1 && playbackIndex < actionTimeline.length - 1) {
        const nextDelay = actionTimeline[playbackIndex + 1].delay;
        if (accumulatedTimeRef.current >= nextDelay) {
          accumulatedTimeRef.current -= nextDelay;
          const hasMore = stepPlayback();
          if (!hasMore) {
            setIsPlaying(false);
            return;
          }
        } else {
          break;
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, isPlayback, playbackSpeed, playbackIndex, actionTimeline, stepPlayback]);

  const handlePlayPause = () => {
    if (!isPlayback) {
      startPlayback();
      accumulatedTimeRef.current = 0;
      lastStepTimeRef.current = 0;
    }
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    setIsPlaying(false);
    accumulatedTimeRef.current = 0;
    lastStepTimeRef.current = 0;
    stopPlayback();
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = Number(e.target.value);
    if (isPlayback) {
      accumulatedTimeRef.current = 0;
      setPlaybackIndex(index);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const playIcon = isPlaying ? '⏸' : '▶';
  const playLabel = totalSteps === 0 ? '无动作' : (isPlaying ? '暂停' : '播放');

  if (isCollapsedMobile) {
    if (!isPlaybackPanelExpanded) {
      return (
        <div
          onClick={togglePlaybackPanel}
          style={{
            height: 40,
            backgroundColor: '#FAFAFA',
            borderTop: '1px solid #E0E0E0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePlayPause();
              }}
              disabled={totalSteps === 0}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: 'none',
                backgroundColor: totalSteps === 0 ? '#E0E0E0' : '#1976D2',
                color: 'white',
                cursor: totalSteps === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                transition: 'transform 0.1s ease',
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {playIcon}
            </button>
            <span style={{ fontSize: 12, color: '#333' }}>
              {playLabel} {isPlayback && `(${playbackIndex + 1}/${totalSteps})`}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#666' }}>
              {formatTime(currentDuration)}/{formatTime(totalDuration)}
            </span>
            <span style={{ fontSize: 16, color: '#666', transform: isPlaybackPanelExpanded ? 'rotate(180deg)' : '' }}>
              ▲
            </span>
          </div>
        </div>
      );
    }

    return (
      <div
        style={{
          backgroundColor: '#FAFAFA',
          borderTop: '1px solid #E0E0E0',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '50vh',
          overflow: 'hidden',
        }}
      >
        <div
          onClick={togglePlaybackPanel}
          style={{
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            cursor: 'pointer',
            userSelect: 'none',
            borderBottom: '1px solid #E0E0E0',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
            回放面板 {isPlayback && `(${playbackIndex + 1}/${totalSteps})`}
          </span>
          <span
            style={{
              fontSize: 16,
              color: '#666',
              transform: 'rotate(180deg)',
            }}
          >
            ▲
          </span>
        </div>

        <div
          style={{
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderBottom: '1px solid #E0E0E0',
          }}
        >
          <button
            onClick={handlePlayPause}
            disabled={totalSteps === 0}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: 'none',
              backgroundColor: totalSteps === 0 ? '#E0E0E0' : '#1976D2',
              color: 'white',
              cursor: totalSteps === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
            }}
          >
            {playIcon}
          </button>

          <button
            onClick={handleStop}
            disabled={!isPlayback}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1px solid #E0E0E0',
              backgroundColor: isPlayback ? '#FFFFFF' : '#F5F5F5',
              cursor: isPlayback ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              opacity: isPlayback ? 1 : 0.5,
            }}
          >
            ■
          </button>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#666' }}>{formatTime(currentDuration)}</span>
            <input
              type="range"
              min="-1"
              max={Math.max(totalSteps - 1, -1)}
              value={playbackIndex}
              onChange={handleProgressChange}
              disabled={!isPlayback || totalSteps === 0}
              style={{ flex: 1, cursor: isPlayback ? 'pointer' : 'not-allowed' }}
            />
            <span style={{ fontSize: 11, color: '#666' }}>{formatTime(totalDuration)}</span>
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            {speedOptions.map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                style={{
                  width: 30,
                  height: 26,
                  borderRadius: 4,
                  border: playbackSpeed === speed ? '1px solid #1976D2' : '1px solid #E0E0E0',
                  backgroundColor: playbackSpeed === speed ? '#E3F2FD' : '#FFFFFF',
                  color: playbackSpeed === speed ? '#1976D2' : '#666',
                  fontSize: 10,
                  cursor: 'pointer',
                }}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 16px',
          }}
        >
          {actionTimeline.length === 0 ? (
            <p style={{ fontSize: 12, color: '#999', textAlign: 'center', padding: 20 }}>
              暂无绘图记录
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {actionTimeline.map((item, index) => (
                <div
                  key={item.record.id}
                  onClick={() => isPlayback && setPlaybackIndex(index)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 6,
                    backgroundColor: index <= playbackIndex ? '#E3F2FD' : '#FFFFFF',
                    border: '1px solid #E0E0E0',
                    cursor: isPlayback ? 'pointer' : 'default',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: item.record.shape.color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1, color: '#333' }}>
                    {getShapeLabel(item.record.shape.type)}
                  </span>
                  <span style={{ color: '#999', fontSize: 10, flexShrink: 0 }}>
                    +{formatTimestamp(item.delay)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: 280,
        backgroundColor: '#FAFAFA',
        borderLeft: '1px solid #E0E0E0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #E0E0E0',
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 4 }}>
          回放面板
        </h3>
        <p style={{ fontSize: 12, color: '#999' }}>
          共 {totalSteps} 个绘图动作 · {formatTime(totalDuration)}
        </p>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <button
            onClick={handlePlayPause}
            disabled={totalSteps === 0}
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: 'none',
              backgroundColor: totalSteps === 0 ? '#E0E0E0' : '#1976D2',
              color: 'white',
              cursor: totalSteps === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (totalSteps > 0) e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseDown={(e) => {
              if (totalSteps > 0) e.currentTarget.style.transform = 'scale(0.9)';
            }}
            onMouseUp={(e) => {
              if (totalSteps > 0) e.currentTarget.style.transform = 'scale(1.1)';
            }}
          >
            {playIcon}
          </button>

          <button
            onClick={handleStop}
            disabled={!isPlayback}
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: '1px solid #E0E0E0',
              backgroundColor: isPlayback ? '#FFFFFF' : '#F5F5F5',
              cursor: isPlayback ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              transition: 'transform 0.2s ease',
              opacity: isPlayback ? 1 : 0.5,
            }}
            onMouseEnter={(e) => {
              if (isPlayback) e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseDown={(e) => {
              if (isPlayback) e.currentTarget.style.transform = 'scale(0.9)';
            }}
            onMouseUp={(e) => {
              if (isPlayback) e.currentTarget.style.transform = 'scale(1.1)';
            }}
          >
            ■
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666' }}>
            <span>{formatTime(currentDuration)}</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
          <input
            type="range"
            min="-1"
            max={Math.max(totalSteps - 1, -1)}
            value={playbackIndex}
            onChange={handleProgressChange}
            disabled={!isPlayback || totalSteps === 0}
            style={{
              width: '100%',
              cursor: isPlayback ? 'pointer' : 'not-allowed',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#666' }}>播放速度</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {speedOptions.map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                style={{
                  flex: 1,
                  height: 32,
                  borderRadius: 6,
                  border: playbackSpeed === speed ? '1px solid #1976D2' : '1px solid #E0E0E0',
                  backgroundColor: playbackSpeed === speed ? '#E3F2FD' : '#FFFFFF',
                  color: playbackSpeed === speed ? '#1976D2' : '#666',
                  fontSize: 13,
                  fontWeight: playbackSpeed === speed ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'transform 0.1s ease',
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.95)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          borderTop: '1px solid #E0E0E0',
        }}
      >
        <div style={{ padding: '8px 16px' }}>
          <h4 style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>时间线</h4>
          {actionTimeline.length === 0 ? (
            <p style={{ fontSize: 12, color: '#999', textAlign: 'center', padding: 20 }}>
              暂无绘图记录
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {actionTimeline.map((item, index) => (
                <div
                  key={item.record.id}
                  onClick={() => isPlayback && setPlaybackIndex(index)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 6,
                    backgroundColor: index <= playbackIndex ? '#E3F2FD' : '#FFFFFF',
                    border: '1px solid #E0E0E0',
                    cursor: isPlayback ? 'pointer' : 'default',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (isPlayback) e.currentTarget.style.backgroundColor = '#BBDEFB';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      index <= playbackIndex ? '#E3F2FD' : '#FFFFFF';
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: item.record.shape.color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1, color: '#333' }}>
                    {getShapeLabel(item.record.shape.type)}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ color: '#999', fontSize: 10 }}>
                      #{index + 1}
                    </span>
                    <span style={{ color: '#BBB', fontSize: 9 }}>
                      +{formatTimestamp(item.delay)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaybackPanel;
