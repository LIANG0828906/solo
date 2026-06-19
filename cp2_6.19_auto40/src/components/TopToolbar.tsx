import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { useSequencerStore } from '../store/useSequencerStore';
import { sequencerEngine } from '../modules/sequencer/SequencerEngine';
import { MIN_BPM, MAX_BPM } from '../types';

interface BPMKnobProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

const BPMKnob = memo<BPMKnobProps>(({ value, min, max, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const startYRef = useRef(0);
  const startValueRef = useRef(0);
  const displayValueRef = useRef(value);
  const animationFrameRef = useRef<number | null>(null);
  const [, forceUpdate] = useState(0);

  const circumference = 2 * Math.PI * 20;

  useEffect(() => {
    if (isDragging) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      displayValueRef.current = value;
      forceUpdate((n) => n + 1);
    } else {
      const animate = () => {
        const diff = value - displayValueRef.current;
        if (Math.abs(diff) > 0.1) {
          displayValueRef.current += diff * 0.2;
          forceUpdate((n) => n + 1);
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          displayValueRef.current = value;
          forceUpdate((n) => n + 1);
          animationFrameRef.current = null;
        }
      };
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value, isDragging, min, max]);

  const displayPercentage = Math.max(0, Math.min(100, ((displayValueRef.current - min) / (max - min)) * 100));
  const displayRotation = -135 + (displayPercentage / 100) * 270;
  const displayDashOffset = circumference * (1 - displayPercentage / 100);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      startYRef.current = e.clientY;
      startValueRef.current = value;
    },
    [value]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const delta = startYRef.current - e.clientY;
      const range = max - min;
      const sensitivity = range / 200;
      const newValue = Math.max(min, Math.min(max, startValueRef.current + delta * sensitivity));
      displayValueRef.current = Math.round(newValue);
      onChange(Math.round(newValue));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [isDragging, min, max, onChange]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <div
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: 52,
          height: 52,
          position: 'relative',
          cursor: isDragging ? 'ns-resize' : 'grab',
          transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isDragging ? 'scale(1.08)' : isHovered ? 'scale(1.04)' : 'scale(1)',
          boxShadow: isDragging
            ? '0 0 0 3px rgba(15,52,96,0.6), 0 8px 24px rgba(15,52,96,0.5)'
            : isHovered
            ? '0 0 0 2px rgba(15,52,96,0.35), 0 4px 14px rgba(15,52,96,0.35)'
            : 'none',
          borderRadius: '50%',
        }}
      >
        <svg width="52" height="52" viewBox="0 0 60 60">
          <defs>
            <filter id="bpm-glow">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle
            cx="30"
            cy="30"
            r="20"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="5"
          />
          <circle
            cx="30"
            cy="30"
            r="20"
            fill="none"
            stroke="#0f3460"
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={displayDashOffset}
            strokeLinecap="round"
            transform="rotate(-135 30 30)"
            style={{
              filter: isHovered || isDragging ? 'url(#bpm-glow)' : 'none',
            }}
          />
          <circle cx="30" cy="30" r="14" fill="#1a1a2e" />
          <circle cx="30" cy="30" r="12" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line
            x1="30"
            y1="30"
            x2="30"
            y2="18"
            stroke="#0f3460"
            strokeWidth="2.5"
            strokeLinecap="round"
            transform={`rotate(${displayRotation} 30 30)`}
            style={{
              filter: isHovered || isDragging ? 'url(#bpm-glow)' : 'none',
            }}
          />
        </svg>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: -2,
        }}
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1,
            fontFamily: 'monospace',
            letterSpacing: 1,
            textShadow: isHovered || isDragging ? '0 0 8px rgba(15,52,96,0.8)' : 'none',
            transition: 'text-shadow 0.2s ease',
          }}
        >
          {Math.round(displayValueRef.current)}
        </span>
        <span
          style={{
            fontSize: 9,
            color: isHovered || isDragging ? 'rgba(15,136,220,0.85)' : 'rgba(255,255,255,0.45)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            marginTop: 2,
            transition: 'color 0.2s ease',
          }}
        >
          BPM
        </span>
      </div>
    </div>
  );
});

BPMKnob.displayName = 'BPMKnob';

interface ExportDialogProps {
  onClose: () => void;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ onClose }) => {
  const [progress, setProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const progressIntervalRef = useRef<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleExport = useCallback(() => {
    setIsExporting(true);
    setProgress(0);

    let currentProgress = 0;
    const stages = [
      { target: 20, duration: 200, label: '收集轨道数据' },
      { target: 50, duration: 300, label: '编码音符事件' },
      { target: 80, duration: 250, label: '生成MIDI文件' },
      { target: 100, duration: 150, label: '完成' },
    ];

    let stageIndex = 0;
    let stageStart = 0;

    const animateProgress = () => {
      if (stageIndex >= stages.length) {
        return;
      }

      const stage = stages[stageIndex];
      const elapsed = Date.now() - stageStart;
      const stageProgress = Math.min(1, elapsed / stage.duration);
      const easedProgress = 1 - Math.pow(1 - stageProgress, 3);

      const prevTarget = stageIndex > 0 ? stages[stageIndex - 1].target : 0;
      currentProgress = prevTarget + (stage.target - prevTarget) * easedProgress;
      setProgress(currentProgress);

      if (stageProgress < 1) {
        progressIntervalRef.current = window.setTimeout(animateProgress, 16);
      } else {
        stageIndex++;
        stageStart = Date.now();

        if (stageIndex < stages.length) {
          progressIntervalRef.current = window.setTimeout(animateProgress, 16);
        } else {
          setIsComplete(true);
          setTimeout(() => {
            const midiBlob = sequencerEngine.exportMIDI();
            const url = URL.createObjectURL(midiBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `collaborative_arrangement_${Date.now()}.mid`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            onClose();
          }, 600);
        }
      }
    };

    stageStart = Date.now();
    animateProgress();
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearTimeout(progressIntervalRef.current);
      }
    };
  }, []);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !isExporting) {
        onClose();
      }
    },
    [onClose, isExporting]
  );

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.25s ease',
      }}
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#16213e',
          borderRadius: 16,
          padding: '28px 24px 24px',
          width: 380,
          boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.1)',
          animation: 'slideUp 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #4ecdc4 0%, #0f3460 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
            }}
          >
            🎵
          </div>
          <div>
            <h3
              style={{
                color: '#fff',
                fontSize: 18,
                fontWeight: 700,
                margin: 0,
              }}
            >
              导出 MIDI 文件
            </h3>
            <p
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: 12,
                margin: '2px 0 0 0',
              }}
            >
              Standard MIDI File (SMF) Format 1
            </p>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#1a1a2e',
            borderRadius: 10,
            padding: '14px 16px',
            margin: '16px 0 20px 0',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>工程信息</span>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 20,
              fontSize: 12,
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            <span>🎹 8 轨道</span>
            <span>🎼 {sequencerEngine.getNotes().length} 音符</span>
            <span>⏱️ {sequencerEngine.getIsPlaying() ? '播放中' : '已停止'}</span>
          </div>
        </div>

        {isExporting && (
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                width: '100%',
                height: 12,
                backgroundColor: '#16213e',
                borderRadius: 8,
                overflow: 'hidden',
                position: 'relative',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: isComplete
                    ? 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)'
                    : 'linear-gradient(90deg, #0f3460 0%, #1a6fb0 100%)',
                  borderRadius: 8,
                  transition: isComplete ? 'none' : 'width 0.08s ease-out',
                  boxShadow: isComplete
                    ? '0 0 12px rgba(34,197,94,0.5)'
                    : '0 0 10px rgba(15,52,96,0.5)',
                  position: 'relative',
                }}
              >
                {!isComplete && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background:
                        'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                      animation: 'progressShimmer 1.2s ease-in-out infinite',
                    }}
                  />
                )}
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 10,
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                {isComplete ? '✓ 导出完成，准备下载...' : '正在打包工程文件...'}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: isComplete ? '#22c55e' : '#0f3460',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  textShadow: !isComplete ? '0 0 6px rgba(15,52,96,0.6)' : 'none',
                }}
              >
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: 10,
            justifyContent: 'flex-end',
          }}
        >
          {!isExporting && (
            <>
              <button
                onClick={onClose}
                style={{
                  padding: '11px 22px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.15)',
                  backgroundColor: 'transparent',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                取消
              </button>
              <button
                onClick={handleExport}
                style={{
                  padding: '11px 26px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: '#4ecdc4',
                  color: '#1a1a2e',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#6ee7b7';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(78,205,196,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#4ecdc4';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span>📥</span>
                <span>开始导出</span>
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(24px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes progressShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

interface CollaboratorsListProps {
  onMouseEnter: (id: string) => void;
  onMouseLeave: () => void;
}

const CollaboratorsList: React.FC<CollaboratorsListProps> = () => {
  const { collaborators } = useSequencerStore();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '12px 0',
      }}
    >
      <div
        style={{
          padding: '0 16px 8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.4)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 1.5,
          }}
        >
          协作成员
        </span>
        <span
          style={{
            fontSize: 10,
            color: '#22c55e',
            fontWeight: 600,
            backgroundColor: 'rgba(34,197,94,0.15)',
            padding: '2px 8px',
            borderRadius: 10,
          }}
        >
          {collaborators.filter((c) => c.isOnline).length} 在线
        </span>
      </div>
      {collaborators.map((collaborator) => (
        <div
          key={collaborator.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 16px',
            transition: 'all 0.2s ease',
            cursor: 'default',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <div
            style={{
              position: 'relative',
              width: 34,
              height: 34,
              borderRadius: '50%',
              backgroundColor: collaborator.color + '25',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              border: `2px solid ${collaborator.color}`,
              boxShadow: `0 0 8px ${collaborator.color}30`,
            }}
          >
            {collaborator.avatar}
            {collaborator.isOnline && (
              <div
                style={{
                  position: 'absolute',
                  bottom: -1,
                  right: -1,
                  width: 11,
                  height: 11,
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  border: '2px solid #16213e',
                  animation: 'onlinePulse 2s ease-in-out infinite',
                }}
              />
            )}
          </div>
          <div
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              style={{
                color: '#fff',
                fontSize: 12,
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {collaborator.name}
              {collaborator.id === 'user-1' && (
                <span
                  style={{
                    fontSize: 9,
                    color: '#4ecdc4',
                    fontWeight: 600,
                    backgroundColor: 'rgba(78,205,196,0.15)',
                    padding: '1px 6px',
                    borderRadius: 8,
                  }}
                >
                  你
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: 10,
                color: collaborator.isOnline ? '#22c55e' : 'rgba(255,255,255,0.35)',
                fontWeight: 500,
              }}
            >
              {collaborator.isOnline ? '● 在线' : '○ 离线'}
            </div>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes onlinePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

export const TopToolbar: React.FC = () => {
  const { isPlaying, bpm, collaborators } = useSequencerStore();
  const [showExportDialog, setShowExportDialog] = useState(false);

  const handlePlay = useCallback(() => {
    if (isPlaying) {
      sequencerEngine.pause();
    } else {
      sequencerEngine.play();
    }
  }, [isPlaying]);

  const handleStop = useCallback(() => {
    sequencerEngine.stop();
  }, []);

  const handleBpmChange = useCallback(
    (value: number) => {
      sequencerEngine.setBpm(value);
    },
    []
  );

  return (
    <>
      <div
        style={{
          height: 64,
          backgroundColor: '#16213e',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 20,
          minWidth: 0,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginRight: 8,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #4ecdc4 0%, #0f3460 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              boxShadow: '0 4px 12px rgba(78,205,196,0.3)',
            }}
          >
            🎵
          </div>
          <div>
            <div
              style={{
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              Collaborative DAW
            </div>
            <div
              style={{
                fontSize: 10,
                color: 'rgba(255,255,255,0.4)',
                fontWeight: 500,
              }}
            >
              实时协作编曲工作站
            </div>
          </div>
        </div>

        <div
          style={{
            width: 1,
            height: 36,
            backgroundColor: 'rgba(255,255,255,0.08)',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <button
            onClick={handlePlay}
            aria-label={isPlaying ? '暂停' : '播放'}
            style={{
              width: 46,
              height: 46,
              borderRadius: '50%',
              border: 'none',
              backgroundColor: isPlaying ? '#ffe66d' : '#4ecdc4',
              color: '#1a1a2e',
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isPlaying
                ? '0 4px 14px rgba(255,230,109,0.45)'
                : '0 4px 14px rgba(78,205,196,0.4)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.06)';
              e.currentTarget.style.boxShadow = isPlaying
                ? '0 6px 20px rgba(255,230,109,0.55)'
                : '0 6px 20px rgba(78,205,196,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = isPlaying
                ? '0 4px 14px rgba(255,230,109,0.45)'
                : '0 4px 14px rgba(78,205,196,0.4)';
            }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button
            onClick={handleStop}
            aria-label="停止"
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.15)',
              backgroundColor: 'transparent',
              color: '#fff',
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
            }}
          >
            ⏹
          </button>
        </div>

        <div
          style={{
            width: 1,
            height: 36,
            backgroundColor: 'rgba(255,255,255,0.08)',
          }}
        />

        <BPMKnob value={bpm} min={MIN_BPM} max={MAX_BPM} onChange={handleBpmChange} />

        <div style={{ flex: 1 }} />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
          title={`${collaborators.filter((c) => c.isOnline).length} 位协作者在线`}
        >
          {collaborators.slice(0, 5).map((c, i) => (
            <div
              key={c.id}
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                backgroundColor: c.color + '30',
                border: `2px solid ${c.color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                marginLeft: i === 0 ? 0 : -8,
                zIndex: 5 - i,
                transition: 'transform 0.2s ease',
                cursor: 'default',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.zIndex = '10';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.zIndex = String(5 - i);
              }}
            >
              {c.avatar}
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowExportDialog(true)}
          style={{
            padding: '11px 22px',
            borderRadius: 8,
            border: 'none',
            backgroundColor: '#0f3460',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1a4a7a';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 6px 18px rgba(15,52,96,0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#0f3460';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span>📥</span>
          <span>导出 MIDI</span>
        </button>
      </div>

      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 64,
          width: 200,
          backgroundColor: '#16213e',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          height: 'calc(100vh - 64px)',
          overflowY: 'auto',
          zIndex: 10,
        }}
      >
        <CollaboratorsList onMouseEnter={() => {}} onMouseLeave={() => {}} />
      </div>

      {showExportDialog && <ExportDialog onClose={() => setShowExportDialog(false)} />}
    </>
  );
};
