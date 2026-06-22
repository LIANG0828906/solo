import React from 'react';
import { useStore, Melody } from '../store';
import { TONE_COLORS, Tone } from '../utils/audio';

const MelodyList: React.FC = () => {
  const melodies = useStore(state => state.melodies);
  const playingMelodyId = useStore(state => state.playingMelodyId);
  const isPlaying = useStore(state => state.isPlaying);
  const playProgress = useStore(state => state.playProgress);
  const currentTone = useStore(state => state.tone);
  const playMelody = useStore(state => state.playMelody);
  const stopPlaying = useStore(state => state.stopPlaying);
  const enterEditMode = useStore(state => state.enterEditMode);
  const isEditMode = useStore(state => state.isEditMode);
  const editingMelodyId = useStore(state => state.editingMelodyId);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatRemainingTime = (progress: number, totalDuration: number): string => {
    const remaining = Math.max(0, totalDuration * (1 - progress));
    const mins = Math.floor(remaining / 60);
    const secs = Math.floor(remaining % 60);
    return `-${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayClick = (melody: Melody) => {
    if (isPlaying && playingMelodyId === melody.id) {
      stopPlaying();
    } else {
      playMelody(melody.id);
    }
  };

  const progressColor = TONE_COLORS[currentTone as Tone] || TONE_COLORS.piano;

  return (
    <div className="melody-list" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <h3
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: '#555',
          marginBottom: 12,
          textTransform: 'uppercase',
          letterSpacing: 1,
          flexShrink: 0,
        }}
      >
        旋律列表
      </h3>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          paddingRight: 4,
        }}
      >
        {melodies.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: '#999',
              fontSize: 13,
              padding: '40px 20px',
            }}
          >
            暂无旋律，点击录音按钮开始创作
          </div>
        ) : (
          melodies.map((melody) => {
            const isCurrentlyPlaying = isPlaying && playingMelodyId === melody.id;
            const isCurrentlyEditing = isEditMode && editingMelodyId === melody.id;
            const showProgress = isCurrentlyPlaying && melody.duration > 0;
            const progressPercent = showProgress ? Math.min(100, Math.max(0, playProgress * 100)) : 0;

            return (
              <div
                key={melody.id}
                style={{
                  background: isCurrentlyEditing ? '#EBF5FB' : '#fff',
                  borderRadius: 8,
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  border: isCurrentlyEditing
                    ? '2px solid #3498DB'
                    : '2px solid transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <button
                      onClick={() => handlePlayClick(melody)}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        border: 'none',
                        background: isCurrentlyPlaying ? '#E74C3C' : progressColor,
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        flexShrink: 0,
                        transition: 'background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
                        boxShadow: isCurrentlyPlaying
                          ? `0 0 0 4px ${progressColor}33`
                          : `0 2px 8px ${progressColor}44`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      {isCurrentlyPlaying ? (
                        <div style={{ display: 'flex', gap: 3 }}>
                          <div style={{ width: 3, height: 14, background: '#fff', borderRadius: 1 }} />
                          <div style={{ width: 3, height: 14, background: '#fff', borderRadius: 1 }} />
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, marginLeft: 2 }}>▶</span>
                      )}
                    </button>

                    {showProgress && (
                      <svg
                        width="48"
                        height="48"
                        style={{
                          position: 'absolute',
                          top: -4,
                          left: -4,
                          pointerEvents: 'none',
                          transform: 'rotate(-90deg)',
                        }}
                      >
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          fill="none"
                          stroke="#E0E0E0"
                          strokeWidth="3"
                        />
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          fill="none"
                          stroke={progressColor}
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray={`${progressPercent * 1.256} 125.6`}
                          style={{
                            transition: 'stroke-dasharray 0.1s linear',
                          }}
                        />
                      </svg>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: '#2C3E50',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {melody.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#888',
                        marginTop: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span>{melody.notes.length} 个音符</span>
                      <span>·</span>
                      <span>
                        {formatDuration(melody.duration)}
                        {showProgress && (
                          <span style={{ color: progressColor, marginLeft: 6 }}>
                            {formatRemainingTime(playProgress, melody.duration)}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {!isEditMode && (
                    <button
                      onClick={() => enterEditMode(melody.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: '1px solid #BDC3C7',
                        background: '#fff',
                        color: '#555',
                        fontSize: 12,
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'background 0.2s ease, border-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f5f5f5';
                        e.currentTarget.style.borderColor = '#999';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#fff';
                        e.currentTarget.style.borderColor = '#BDC3C7';
                      }}
                    >
                      编辑
                    </button>
                  )}
                </div>

                {showProgress && (
                  <div
                    style={{
                      width: '100%',
                      height: 4,
                      background: '#E0E0E0',
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${progressPercent}%`,
                        background: `linear-gradient(90deg, ${progressColor}CC, ${progressColor})`,
                        borderRadius: 2,
                        transition: 'width 0.1s linear',
                        boxShadow: `0 0 6px ${progressColor}88`,
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MelodyList;
