import React, { useState } from 'react';
import { useMusicStore } from '../store/musicStore';

const ControlBar: React.FC = () => {
  const {
    scoreText,
    setScoreText,
    parseScore,
    togglePlay,
    stopPlay,
    isPlaying,
    isPaused,
    bpm,
    setBpm,
    metronomeEnabled,
    toggleMetronome,
    currentBeat,
    isStrongBeat,
    beatIndicatorKey,
    parseError,
    notes,
    saveFragment,
  } = useMusicStore();

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  const handleSave = () => {
    const result = saveFragment(saveTitle);
    setSaveMessage(result.message);
    if (result.success) {
      setTimeout(() => {
        setShowSaveModal(false);
        setSaveTitle('');
        setSaveMessage('');
      }, 1000);
    }
  };

  const beatAnimationStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: '50%',
    backgroundColor: '#2C3E50',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFF',
    fontSize: 14,
    fontWeight: 600,
    transition: 'all 0.1s ease',
    animation: metronomeEnabled && currentBeat > 0
      ? (isStrongBeat ? 'beat-flash 0.4s ease-out forwards' : 'beat-flash-weak 0.4s ease-out forwards')
      : 'none',
    opacity: metronomeEnabled ? (currentBeat > 0 ? (isStrongBeat ? 0.9 : 0.6) : 0.3) : 0.3,
    transform: metronomeEnabled && currentBeat > 0 && isStrongBeat ? 'scale(1.1)' : 'scale(1)',
  };

  return (
    <div
      style={{
        backgroundColor: '#1C1C1C',
        borderRadius: '8px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
      className="control-bar"
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div
          key={beatIndicatorKey}
          style={beatAnimationStyle}
          title={metronomeEnabled ? `第 ${currentBeat} 拍` : '节拍指示器'}
        >
          {metronomeEnabled && currentBeat > 0 ? currentBeat : '♩'}
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <input
            type="text"
            value={scoreText}
            onChange={(e) => setScoreText(e.target.value)}
            placeholder="输入乐谱：例如 C4,1 D4,1 E4,2 （音符,时值 空格分隔）"
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: '#0D0D0D',
              border: '1px solid #333',
              borderRadius: '6px',
              color: '#ECF0F1',
              fontSize: 14,
              fontFamily: 'monospace',
              outline: 'none',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') parseScore();
            }}
          />
          {parseError && (
            <div style={{ color: '#E74C3C', fontSize: 12, marginTop: 4 }}>{parseError}</div>
          )}
          {!parseError && notes.length > 0 && (
            <div style={{ color: '#27AE60', fontSize: 12, marginTop: 4 }}>
              已解析 {notes.length} 个音符
            </div>
          )}
        </div>

        <button
          onClick={parseScore}
          style={{
            padding: '10px 16px',
            backgroundColor: '#3498DB',
            color: '#FFF',
            border: 'none',
            borderRadius: '6px',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2980B9')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3498DB')}
        >
          解析乐谱
        </button>

        <button
          onClick={togglePlay}
          style={{
            padding: '10px 20px',
            backgroundColor: isPlaying && !isPaused ? '#E67E22' : '#F39C12',
            color: '#FFF',
            border: 'none',
            borderRadius: '6px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#D68910')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isPlaying && !isPaused ? '#E67E22' : '#F39C12')}
        >
          {isPlaying && !isPaused ? '暂停' : '播放'}
        </button>

        {isPlaying && (
          <button
            onClick={stopPlay}
            style={{
              padding: '10px 16px',
              backgroundColor: '#7F8C8D',
              color: '#FFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            停止
          </button>
        )}

        <button
          onClick={toggleMetronome}
          style={{
            padding: '10px 16px',
            backgroundColor: metronomeEnabled ? '#27AE60' : '#34495E',
            color: '#FFF',
            border: 'none',
            borderRadius: '6px',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
        >
          节拍器 {metronomeEnabled ? '开' : '关'}
        </button>

        <button
          onClick={() => setShowSaveModal(true)}
          style={{
            padding: '10px 16px',
            backgroundColor: '#9B59B6',
            color: '#FFF',
            border: 'none',
            borderRadius: '6px',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
        >
          收藏
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: '#BDC3C7', minWidth: 50 }}>BPM:</span>
        <input
          type="range"
          min={60}
          max={180}
          step={5}
          value={bpm}
          onChange={(e) => setBpm(parseInt(e.target.value, 10))}
          style={{
            flex: 1,
            minWidth: 150,
            accentColor: '#F39C12',
          }}
        />
        <span
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: '#F39C12',
            minWidth: 45,
            textAlign: 'center',
          }}
        >
          {bpm}
        </span>
      </div>

      {showSaveModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowSaveModal(false)}
        >
          <div
            style={{
              backgroundColor: '#1E1E1E',
              padding: '24px',
              borderRadius: '8px',
              minWidth: 320,
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: '#ECF0F1', marginBottom: 16, fontSize: 16 }}>保存乐谱片段</h3>
            <input
              type="text"
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              placeholder="输入片段标题..."
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#0D0D0D',
                border: '1px solid #333',
                borderRadius: '6px',
                color: '#ECF0F1',
                fontSize: 14,
                outline: 'none',
                marginBottom: 12,
              }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
            />
            {saveMessage && (
              <div
                style={{
                  color: saveMessage.includes('成功') ? '#27AE60' : '#E74C3C',
                  fontSize: 13,
                  marginBottom: 12,
                }}
              >
                {saveMessage}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setSaveTitle('');
                  setSaveMessage('');
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#34495E',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#F39C12',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .control-bar > div:first-child {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .control-bar > div:first-child > div:first-child {
            align-self: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default ControlBar;
