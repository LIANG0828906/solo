import React from 'react';
import { useStore, Melody } from '../store';

const MelodyList: React.FC = () => {
  const melodies = useStore(state => state.melodies);
  const playingMelodyId = useStore(state => state.playingMelodyId);
  const isPlaying = useStore(state => state.isPlaying);
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

  const handlePlayClick = (melody: Melody) => {
    if (isPlaying && playingMelodyId === melody.id) {
      stopPlaying();
    } else {
      playMelody(melody.id);
    }
  };

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
          gap: 8,
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

            return (
              <div
                key={melody.id}
                style={{
                  background: isCurrentlyEditing ? '#EBF5FB' : '#fff',
                  borderRadius: 8,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  border: isCurrentlyEditing
                    ? '2px solid #3498DB'
                    : '2px solid transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                <button
                  onClick={() => handlePlayClick(melody)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: 'none',
                    background: isCurrentlyPlaying ? '#E74C3C' : '#3498DB',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    flexShrink: 0,
                    transition: 'background 0.2s ease, transform 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {isCurrentlyPlaying ? (
                    <div style={{ display: 'flex', gap: 2 }}>
                      <div style={{ width: 3, height: 12, background: '#fff' }} />
                      <div style={{ width: 3, height: 12, background: '#fff' }} />
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, marginLeft: 2 }}>▶</span>
                  )}
                </button>

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
                    }}
                  >
                    {melody.notes.length} 个音符 · {formatDuration(melody.duration)}
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
            );
          })
        )}
      </div>
    </div>
  );
};

export default MelodyList;
