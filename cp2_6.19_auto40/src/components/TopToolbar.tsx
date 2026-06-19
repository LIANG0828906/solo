import React, { useState, useCallback } from 'react';
import { useSequencerStore } from '../store/useSequencerStore';
import { sequencerEngine } from '../modules/sequencer/SequencerEngine';
import { MIN_BPM, MAX_BPM } from '../types';

interface BPMKnobProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

const BPMKnob: React.FC<BPMKnobProps> = ({ value, min, max, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startValue, setStartValue] = useState(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      setStartY(e.clientY);
      setStartValue(value);
    },
    [value]
  );

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const delta = startY - e.clientY;
      const range = max - min;
      const sensitivity = range / 200;
      const newValue = Math.max(min, Math.min(max, startValue + delta * sensitivity));
      onChange(Math.round(newValue));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startY, startValue, min, max, onChange]);

  const percentage = ((value - min) / (max - min)) * 100;
  const rotation = -135 + (percentage / 100) * 270;
  const dashOffset = 2 * Math.PI * 20 * (1 - percentage / 100);

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
        style={{
          width: 52,
          height: 52,
          position: 'relative',
          cursor: isDragging ? 'ns-resize' : 'grab',
          transition: 'transform 0.1s ease',
          transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        }}
      >
        <svg width="52" height="52" viewBox="0 0 60 60">
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
            stroke="#4ecdc4"
            strokeWidth="5"
            strokeDasharray={2 * Math.PI * 20}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform="rotate(-135 30 30)"
            style={{
              transition: isDragging ? 'none' : 'stroke-dashoffset 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
          <circle
            cx="30"
            cy="30"
            r="14"
            fill="#1a1a2e"
            style={{
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.5)',
            }}
          />
          <line
            x1="30"
            y1="30"
            x2="30"
            y2="18"
            stroke="#4ecdc4"
            strokeWidth="2.5"
            strokeLinecap="round"
            transform={`rotate(${rotation} 30 30)`}
            style={{
              transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </svg>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        <span
          style={{
            fontSize: 9,
            color: 'rgba(255,255,255,0.5)',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          BPM
        </span>
      </div>
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

  const handleExport = useCallback(() => {
    setIsExporting(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 15 + 5;
        if (next >= 100) {
          clearInterval(interval);
          setIsComplete(true);
          setTimeout(() => {
            onConfirm();
            onClose();
          }, 500);
          return 100;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [onConfirm, onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#16213e',
          borderRadius: 12,
          padding: 24,
          width: 360,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.1)',
          animation: 'slideUp 0.3s ease',
        }}
      >
        <h3
          style={{
            color: '#fff',
            fontSize: 18,
            fontWeight: 600,
            margin: '0 0 8px 0',
          }}
        >
          导出 MIDI 文件
        </h3>
        <p
          style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: 13,
            margin: '0 0 20px 0',
          }}
        >
          正在准备导出您的编曲工程...
        </p>

        {isExporting && (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                width: '100%',
                height: 8,
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #4ecdc4 0%, #44a08d 100%)',
                  borderRadius: 4,
                  transition: 'width 0.2s ease',
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 8,
              }}
            >
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                {isComplete ? '完成!' : '打包工程文件...'}
              </span>
              <span style={{ fontSize: 11, color: '#4ecdc4', fontWeight: 600 }}>
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'flex-end',
          }}
        >
          {!isExporting && (
            <>
              <button
                onClick={onClose}
                style={{
                  padding: '10px 20px',
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'transparent',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
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
                  padding: '10px 24px',
                  borderRadius: 6,
                  border: 'none',
                  backgroundColor: '#4ecdc4',
                  color: '#1a1a2e',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#6ee7b7';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(78,205,196,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#4ecdc4';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                导出
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
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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
        gap: 8,
        padding: '12px 0',
      }}
    >
      <span
        style={{
          fontSize: 10,
          color: 'rgba(255,255,255,0.4)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 1,
          padding: '0 12px',
        }}
      >
        协作成员
      </span>
      {collaborators.map((collaborator) => (
        <div
          key={collaborator.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 12px',
            transition: 'background-color 0.2s ease',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: collaborator.color + '30',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              border: `2px solid ${collaborator.color}`,
            }}
          >
            {collaborator.avatar}
            {collaborator.isOnline && (
              <div
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  border: '2px solid #16213e',
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
              }}
            >
              {collaborator.name}
              {collaborator.id === 'user-1' && (
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 10,
                    color: '#4ecdc4',
                    fontWeight: 600,
                  }}
                >
                  (你)
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: 10,
                color: collaborator.isOnline ? '#22c55e' : 'rgba(255,255,255,0.4)',
              }}
            >
              {collaborator.isOnline ? '在线' : '离线'}
            </div>
          </div>
        </div>
      ))}
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
    sequencerEngine.setCursorPosition(0);
  }, []);

  const handleExport = useCallback(() => {
    const midiBlob = sequencerEngine.exportMIDI();
    const url = URL.createObjectURL(midiBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arrangement_${Date.now()}.mid`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          height: 60,
          backgroundColor: '#16213e',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 20,
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginRight: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #4ecdc4 0%, #0f3460 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}
          >
            🎵
          </div>
          <div>
            <div
              style={{
                color: '#fff',
                fontSize: 14,
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
              实时协作编曲
            </div>
          </div>
        </div>

        <div
          style={{
            width: 1,
            height: 32,
            backgroundColor: 'rgba(255,255,255,0.1)',
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
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              border: 'none',
              backgroundColor: isPlaying ? '#ffe66d' : '#4ecdc4',
              color: '#1a1a2e',
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = isPlaying
                ? '0 4px 12px rgba(255,230,109,0.4)'
                : '0 4px 12px rgba(78,205,196,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
            }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button
            onClick={handleStop}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.2)',
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
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            ⏹
          </button>
        </div>

        <div
          style={{
            width: 1,
            height: 32,
            backgroundColor: 'rgba(255,255,255,0.1)',
          }}
        />

        <BPMKnob value={bpm} min={MIN_BPM} max={MAX_BPM} onChange={handleBpmChange} />

        <div style={{ flex: 1 }} />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: -4,
          }}
        >
          {collaborators.slice(0, 5).map((c) => (
            <div
              key={c.id}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: c.color + '40',
                border: `2px solid ${c.color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                marginLeft: c.id === collaborators[0].id ? 0 : -8,
                zIndex: 5 - collaborators.findIndex((col) => col.id === c.id),
              }}
              title={c.name}
            >
              {c.avatar}
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowExportDialog(true)}
          style={{
            padding: '10px 20px',
            borderRadius: 6,
            border: 'none',
            backgroundColor: '#0f3460',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1a4a7a';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,52,96,0.4)';
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
          top: 60,
          width: 200,
          backgroundColor: '#16213e',
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          height: 'calc(100vh - 60px)',
          overflowY: 'auto',
          zIndex: 10,
        }}
      >
        <CollaboratorsList
          onMouseEnter={() => {}}
          onMouseLeave={() => {}}
        />
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
