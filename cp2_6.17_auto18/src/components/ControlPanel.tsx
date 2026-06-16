import React from 'react';
import { useStore } from '../store';
import { Tone } from '../utils/audio';

const toneInfo: Record<Tone, { name: string; color: string; icon: string }> = {
  piano: { name: '钢琴', color: '#F4D03F', icon: '🎹' },
  guitar: { name: '吉他', color: '#E67E22', icon: '🎸' },
  synth: { name: '电子琴', color: '#8E44AD', icon: '🎹' },
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

  const handleToneChange = (newTone: Tone) => {
    setTone(newTone);
  };

  const handleRecordClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
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
          }}
        >
          {(Object.keys(toneInfo) as Tone[]).map((t) => (
            <div
              key={t}
              onClick={() => handleToneChange(t)}
              style={{
                width: 140,
                height: 80,
                borderRadius: 12,
                background: toneInfo[t].color,
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                transform: tone === t ? 'scale(1.05)' : 'scale(1)',
                boxShadow: tone === t
                  ? `0 6px 16px ${toneInfo[t].color}66`
                  : '0 2px 8px rgba(0,0,0,0.15)',
                border: tone === t ? '3px solid #fff' : '3px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (tone !== t) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (tone !== t) {
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              <span style={{ fontSize: 28, marginBottom: 4 }}>{toneInfo[t].icon}</span>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{toneInfo[t].name}</span>
            </div>
          ))}
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
          )}
          {!isEditMode && (
            <span
              style={{
                fontSize: 13,
                color: '#777',
                marginLeft: 8,
              }}
            >
              {isRecording ? '录音中...' : '点击开始录音'}
            </span>
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
      `}</style>
    </div>
  );
};

export default ControlPanel;
