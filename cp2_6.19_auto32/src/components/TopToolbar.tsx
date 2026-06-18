import React, { useState, useRef, useEffect } from 'react';
import { useSequencerStore } from '../store/useSequencerStore';
import { sequencerEngine } from '../modules/sequencer/SequencerEngine';

interface BpmKnobProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

const BpmKnob: React.FC<BpmKnobProps> = ({ value, min, max, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const startYRef = useRef(0);
  const startValueRef = useRef(value);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValueRef.current = value;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const delta = (startYRef.current - e.clientY) / 100;
      const newValue = Math.max(min, Math.min(max, Math.round(startValueRef.current + delta * (max - min) / 4)));
      onChange(newValue);
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
      document.body.style.cursor = '';
    };
  }, [isDragging, min, max, onChange]);

  const percentage = ((value - min) / (max - min)) * 100;
  const rotation = -135 + (percentage / 100) * 270;
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference * 0.75;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 48,
          height: 48,
          cursor: isDragging ? 'ns-resize' : 'grab',
          userSelect: 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <svg width="48" height="48" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${circumference * 0.75} ${circumference}`}
          />
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke="#00b4d8"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${circumference * 0.75} ${circumference}`}
            strokeDashoffset={dashOffset}
            style={{
              transition: isDragging ? 'none' : 'stroke-dashoffset 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              filter: isHovered || isDragging ? 'drop-shadow(0 0 6px rgba(0,180,216,0.5))' : 'none',
            }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <div
            style={{
              width: 2,
              height: 14,
              backgroundColor: '#00b4d8',
              borderRadius: 2,
              marginTop: -14,
              boxShadow: '0 0 4px rgba(0,180,216,0.5)',
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 13,
            fontWeight: 800,
            color: '#ccd6f6',
          }}
        >
          {value}
        </div>
      </div>
      <span style={{ fontSize: 9, color: '#8892b0', fontWeight: 600, textTransform: 'uppercase' }}>BPM</span>
    </div>
  );
};

interface ExportDialogProps {
  onClose: () => void;
  onConfirm: () => void;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ onClose, onConfirm }) => {
  const [progress, setProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsComplete(true);
          setTimeout(() => {
            onConfirm();
            onClose();
          }, 500);
          return 100;
        }
        return prev + 5;
      });
    }, 30);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 400,
          padding: 24,
          backgroundColor: '#16213e',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
        }}
      >
        <h3 style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#e6f1ff',
          marginBottom: 8,
        }}>
          导出 MIDI 文件
        </h3>
        <p style={{
          fontSize: 13,
          color: '#8892b0',
          marginBottom: 20,
          lineHeight: 1.6,
        }}>
          将当前编曲工程导出为标准 MIDI 格式文件，包含所有轨道的音符和 tempo 信息。
        </p>

        {isExporting && (
          <div style={{ marginBottom: 20 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 6,
            }}>
              <span style={{ fontSize: 12, color: '#8892b0' }}>
                {isComplete ? '导出完成！' : '正在打包工程...'}
              </span>
              <span style={{ fontSize: 12, color: '#00b4d8', fontWeight: 700 }}>{progress}%</span>
            </div>
            <div style={{
              width: '100%',
              height: 6,
              backgroundColor: '#0a0e1a',
              borderRadius: 3,
              overflow: 'hidden',
            }}>
              <div
                style={{
                  height: '100%',
                  background: isComplete
                    ? 'linear-gradient(90deg, #00b4d8, #90e0ef)'
                    : 'linear-gradient(90deg, #0f3460, #00b4d8)',
                  borderRadius: 3,
                  width: `${progress}%`,
                  transition: 'width 0.03s linear, background 0.3s ease',
                }}
              />
            </div>
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            disabled={isExporting}
            style={{
              padding: '10px 20px',
              backgroundColor: '#0f3460',
              color: '#ccd6f6',
              border: 'none',
              borderRadius: 6,
              cursor: isExporting ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 600,
              opacity: isExporting ? 0.5 : 1,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => !isExporting && (e.currentTarget.style.backgroundColor = '#1a4a7a')}
            onMouseLeave={(e) => !isExporting && (e.currentTarget.style.backgroundColor = '#0f3460')}
          >
            取消
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            style={{
              padding: '10px 20px',
              backgroundColor: isComplete ? '#00b4d8' : '#e94560',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: isExporting ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 700,
              opacity: isExporting && !isComplete ? 0.8 : 1,
              transition: 'all 0.15s ease',
              boxShadow: isComplete ? '0 0 12px rgba(0,180,216,0.5)' : '0 0 12px rgba(233,69,96,0.3)',
            }}
            onMouseEnter={(e) => !isExporting && (e.currentTarget.style.transform = 'scale(1.03)')}
            onMouseLeave={(e) => !isExporting && (e.currentTarget.style.transform = 'scale(1)')}
          >
            {isComplete ? '✓ 已导出' : '下载 MIDI'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const TopToolbar: React.FC = () => {
  const { isPlaying, bpm, setBpm, cursorPosition, notes, tracks } = useSequencerStore();
  const [showExportDialog, setShowExportDialog] = useState(false);

  const handlePlay = () => {
    if (isPlaying) {
      sequencerEngine.pause();
    } else {
      sequencerEngine.play();
    }
  };

  const handleStop = () => {
    sequencerEngine.stop();
  };

  const handleExport = () => {
    sequencerEngine.downloadMIDI('collaborative-project.mid');
  };

  return (
    <>
      <div
        style={{
          height: 64,
          backgroundColor: '#0f3460',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 24,
          flexShrink: 0,
          background: 'linear-gradient(180deg, #0f3460, #0a2848)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #e94560, #f77f00)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(233,69,96,0.4)',
            }}
          >
            <span style={{ fontSize: 18 }}>🎵</span>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#e6f1ff', letterSpacing: 0.5 }}>
              COLLAB DAW
            </div>
            <div style={{ fontSize: 10, color: '#8892b0' }}>
              实时协作编曲工作站
            </div>
          </div>
        </div>

        <div style={{
          width: 1,
          height: 36,
          backgroundColor: 'rgba(255,255,255,0.1)',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={handleStop}
            style={{
              width: 40,
              height: 40,
              border: 'none',
              borderRadius: 8,
              backgroundColor: '#16213e',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1a2a4a';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#16213e';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <div style={{
              width: 14,
              height: 14,
              backgroundColor: '#ccd6f6',
              borderRadius: 2,
            }} />
          </button>

          <button
            onClick={handlePlay}
            style={{
              width: 48,
              height: 48,
              border: 'none',
              borderRadius: 12,
              backgroundColor: isPlaying ? '#e94560' : '#00b4d8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              boxShadow: isPlaying
                ? '0 4px 16px rgba(233,69,96,0.5), inset 0 1px 0 rgba(255,255,255,0.2)'
                : '0 4px 16px rgba(0,180,216,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {isPlaying ? (
              <div style={{ display: 'flex', gap: 4 }}>
                <div style={{ width: 5, height: 18, backgroundColor: '#fff', borderRadius: 1 }} />
                <div style={{ width: 5, height: 18, backgroundColor: '#fff', borderRadius: 1 }} />
              </div>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20">
                <path d="M5 3 L17 10 L5 17 Z" fill="#fff" />
              </svg>
            )}
          </button>
        </div>

        <div style={{
          width: 1,
          height: 36,
          backgroundColor: 'rgba(255,255,255,0.1)',
        }} />

        <BpmKnob value={bpm} min={60} max={200} onChange={(v) => sequencerEngine.setBpm(v)} />

        <div style={{ flex: 1 }} />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '0 16px',
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: 8,
          height: 44,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#00b4d8', fontFamily: 'monospace' }}>
              {String(Math.floor(cursorPosition / 4) + 1).padStart(2, '0')}
            </span>
            <span style={{ fontSize: 9, color: '#8892b0' }}>BAR</span>
          </div>
          <span style={{ fontSize: 16, color: '#8892b0', fontWeight: 700 }}>|</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#ccd6f6', fontFamily: 'monospace' }}>
              {String(Math.floor(cursorPosition % 4) + 1).padStart(2, '0')}
            </span>
            <span style={{ fontSize: 9, color: '#8892b0' }}>BEAT</span>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 12px',
          height: 44,
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: 8,
        }}>
          <span style={{ fontSize: 11, color: '#8892b0', fontWeight: 600 }}>TRACKS</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#e6f1ff' }}>{tracks.length}</span>
          <span style={{ fontSize: 11, color: '#5a6a8a' }}>/</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#8892b0' }}>8</span>
          <span style={{ width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
          <span style={{ fontSize: 11, color: '#8892b0', fontWeight: 600 }}>NOTES</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#e6f1ff' }}>{notes.length}</span>
        </div>

        <button
          onClick={() => setShowExportDialog(true)}
          style={{
            padding: '12px 20px',
            backgroundColor: '#f77f00',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.15s ease',
            boxShadow: '0 4px 12px rgba(247,127,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.03)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(247,127,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(247,127,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 12 L8 4 M4 8 L8 12 L12 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 13 L14 13" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </svg>
          导出 MIDI
        </button>
      </div>

      {showExportDialog && (
        <ExportDialog
          onClose={() => setShowExportDialog(false)}
          onConfirm={handleExport}
        />
      )}
    </>
  );
};
