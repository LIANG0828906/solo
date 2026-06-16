import React, { useState } from 'react';
import { useStore } from '../store';
import { Tone, TONE_COLORS } from '../utils/audio';

const toneInfo: Record<Tone, { name: string; icon: string }> = {
  piano: { name: '钢琴', icon: '🎹' },
  guitar: { name: '吉他', icon: '🎸' },
  synth: { name: '电子琴', icon: '�️' },
};

const ControlPanel: React.FC = () => {
  const tone = useStore(state => state.tone);
  const isRecording = useStore(state => state.isRecording);
  const isEditMode = useStore(state => state.isEditMode);
  const setTone = useStore(state => state.setTone);
  const startRecording = useStore(state => state.startRecording);
  const stopRecording = useStore(state => state.stopRecording);
  const saveMelody = useStore(state => state.saveMelody);
  const exitEditMode = useStore(state => state.exitEditMode);
  const clearStaff = useStore(state => state.clearStaff);

  const [switchingTone, setSwitchingTone] = useState<Tone | null>(null);

  const handleToneChange = async (newTone: Tone) => {
    if (newTone === tone || switchingTone) return;

    setSwitchingTone(newTone);
    try {
      await setTone(newTone);
      if (!isEditMode) {
        clearStaff();
      }
    } finally {
      setSwitchingTone(null);
    }
  };

  const handleRecordClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      clearStaff();
      startRecording();
    }
  };

  return (
    <div
      className="control-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        padding: '20px 0',
      }}
    >
      <div className="tone-switcher">
        <h3
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: '#555',
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          音色选择
        </h3>
        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'flex-start',
            flexWrap: 'wrap',
          }}
        >
          {(Object.keys(toneInfo) as Tone[]).map((t) => {
            const isActive = tone === t;
            const isSwitching = switchingTone === t;
            const color = TONE_COLORS[t];

            return (
              <div
                key={t}
                onClick={() => handleToneChange(t)}
                style={{
                  width: 140,
                  height: 80,
                  borderRadius: 12,
                  background: color,
                  color: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isSwitching ? 'wait' : 'pointer',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease',
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                  opacity: isSwitching ? 0.7 : 1,
                  boxShadow: isActive
                    ? `0 6px 20px ${color}88, 0 2px 8px rgba(0,0,0,0.15)`
                    : '0 2px 8px rgba(0,0,0,0.15)',
                  border: '3px solid transparent',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  if (!isActive && !isSwitching) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: '#fff',
                      boxShadow: `0 -2px 10px rgba(255,255,255,0.6)`,
                      animation: 'slideIn 0.3s ease-out',
                    }}
                  />
                )}

                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.95)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      color: color,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                  >
                    ✓
                  </div>
                )}

                <span
                  style={{
                    fontSize: 28,
                    marginBottom: 4,
                    opacity: isSwitching ? 0.6 : 1,
                    transition: 'opacity 0.3s ease',
                  }}
                >
                  {toneInfo[t].icon}
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: isActive ? 700 : 500,
                    opacity: isSwitching ? 0.6 : 1,
                    transition: 'opacity 0.3s ease, font-weight 0.3s ease',
                  }}
                >
                  {toneInfo[t].name}
                  {isActive && ' · 激活'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="action-buttons">
        <h3
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: '#555',
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          操作
        </h3>
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {isEditMode ? (
            <>
              <button
                onClick={saveMelody}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#27AE60',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.2s ease, transform 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2ECC71';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#27AE60';
                }}
              >
                ✓ 保存
              </button>
              <button
                onClick={exitEditMode}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: '1px solid #BDC3C7',
                  background: '#fff',
                  color: '#555',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fff';
                }}
              >
                取消
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleRecordClick}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  border: 'none',
                  background: isRecording ? '#E74C3C' : '#B0B0B0',
                  color: '#fff',
                  fontSize: 16,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.3s ease, transform 0.2s ease',
                  animation: isRecording ? 'pulse 1.5s ease-in-out infinite' : 'none',
                  boxShadow: isRecording
                    ? '0 0 0 0 rgba(231, 76, 60, 0.7)'
                    : '0 2px 8px rgba(0,0,0,0.15)',
                }}
                title={isRecording ? '停止录音' : '开始录音'}
              >
                <div
                  style={{
                    width: isRecording ? 12 : 14,
                    height: isRecording ? 12 : 14,
                    background: '#fff',
                    borderRadius: isRecording ? 2 : '50%',
                  }}
                />
              </button>
              <button
                onClick={clearStaff}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #BDC3C7',
                  background: '#fff',
                  color: '#777',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.2s ease, color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f5f5f5';
                  e.currentTarget.style.color = '#555';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.color = '#777';
                }}
              >
                清空谱面
              </button>
              <span
                style={{
                  fontSize: 13,
                  color: '#777',
                  marginLeft: 8,
                }}
              >
                {isRecording ? '录音中...' : '点击开始录音'}
              </span>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.7);
          }
          70% {
            box-shadow: 0 0 0 15px rgba(231, 76, 60, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(231, 76, 60, 0);
          }
        }
        @keyframes slideIn {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }
      `}</style>
    </div>
  );
};

export default ControlPanel;
