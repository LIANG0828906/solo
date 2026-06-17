import React, { useCallback } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { Play, Pause, Plus, Trash2 } from 'lucide-react';

export const Timeline: React.FC = () => {
  const {
    currentFrame,
    setCurrentFrame,
    totalFrames,
    keyframes,
    addKeyframe,
    deleteKeyframe,
    isPlaying,
    togglePlay,
    isPreviewMode,
  } = useEditorStore();

  const fps = 24;
  const totalSeconds = totalFrames / fps;
  const currentSecond = currentFrame / fps;

  const keyframeFrameSet = new Set(keyframes.map((kf) => kf.frameIndex));

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isPlaying) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = x / rect.width;
      const frame = Math.round(ratio * (totalFrames - 1));
      setCurrentFrame(frame);
    },
    [totalFrames, setCurrentFrame, isPlaying]
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 12,
        height: 60,
        background: '#12122A',
        borderRadius: 8,
        border: '1px solid #2A2A44',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 12,
        zIndex: 10,
      }}
    >
      <button
        onClick={togglePlay}
        disabled={isPreviewMode}
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: isPlaying ? '#FF6B6B' : '#6C63FF',
          border: 'none',
          color: '#fff',
          cursor: isPreviewMode ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.3s ease-in-out',
          opacity: isPreviewMode ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isPreviewMode)
            (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
        }}
        onMouseDown={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(0.95)';
        }}
        onMouseUp={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
        }}
        title={isPlaying ? '暂停' : '播放'}
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
      </button>

      <button
        onClick={addKeyframe}
        disabled={isPlaying}
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: 'rgba(108, 99, 255, 0.2)',
          border: '1px solid #6C63FF',
          color: '#6C63FF',
          cursor: isPlaying ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.3s ease-in-out',
          opacity: isPlaying ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isPlaying)
            (e.currentTarget as HTMLElement).style.background =
              'rgba(108, 99, 255, 0.4)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background =
            'rgba(108, 99, 255, 0.2)';
        }}
        title="添加关键帧"
      >
        <Plus size={14} />
      </button>

      <div
        style={{
          flex: 1,
          position: 'relative',
          height: 24,
          cursor: isPlaying ? 'default' : 'pointer',
        }}
        onClick={handleTimelineClick}
      >
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 0,
            right: 0,
            height: 4,
            background: '#2E2E44',
            borderRadius: 2,
          }}
        />

        {Array.from({ length: Math.ceil(totalSeconds) + 1 }, (_, i) => {
          const left = (i * fps) / (totalFrames - 1);
          if (left > 1) return null;
          return (
            <div
              key={`mark-${i}`}
              style={{
                position: 'absolute',
                left: `${left * 100}%`,
                top: 6,
                width: 1,
                height: 12,
                background: '#3A3A55',
              }}
            />
          );
        })}

        {keyframes.map((kf) => {
          const left = kf.frameIndex / (totalFrames - 1);
          return (
            <div
              key={kf.id}
              style={{
                position: 'absolute',
                left: `${left * 100}%`,
                top: 4,
                transform: 'translateX(-50%)',
                width: 12,
                height: 16,
                cursor: isPlaying ? 'default' : 'pointer',
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (!isPlaying) {
                  setCurrentFrame(kf.frameIndex);
                }
              }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: '10px solid #6C63FF',
                  margin: '0 auto',
                  transition: 'border-top-color 0.3s ease-in-out',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderTopColor =
                    '#00E5FF';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderTopColor =
                    '#6C63FF';
                }}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isPlaying) deleteKeyframe(kf.id);
                }}
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -8,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: 'rgba(255, 107, 107, 0.8)',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'none',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 8,
                  lineHeight: 1,
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  const parent = (e.currentTarget as HTMLElement).parentElement;
                  if (parent) {
                    const btn = parent.querySelector('button');
                    if (btn) btn.style.display = 'flex';
                  }
                }}
              >
                <Trash2 size={8} />
              </button>
            </div>
          );
        })}

        <div
          style={{
            position: 'absolute',
            left: `${(currentFrame / (totalFrames - 1)) * 100}%`,
            top: 0,
            bottom: 0,
            width: 2,
            background: '#00E5FF',
            borderRadius: 1,
            transform: 'translateX(-50%)',
            transition: isPlaying ? 'none' : 'left 0.05s linear',
            boxShadow: '0 0 6px rgba(0, 229, 255, 0.5)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: `${(currentFrame / (totalFrames - 1)) * 100}%`,
            top: -16,
            transform: 'translateX(-50%)',
            background: '#00E5FF',
            color: '#0A0A1A',
            fontSize: 9,
            fontWeight: 600,
            padding: '1px 5px',
            borderRadius: 3,
            whiteSpace: 'nowrap',
            fontFamily: 'monospace',
          }}
        >
          {currentSecond.toFixed(2)}s
        </div>
      </div>

      <div
        style={{
          color: '#555577',
          fontSize: 10,
          fontFamily: 'monospace',
          flexShrink: 0,
          textAlign: 'right',
          minWidth: 50,
        }}
      >
        帧 {currentFrame + 1}/{totalFrames}
      </div>
    </div>
  );
};
