import React, { useState, useEffect, useRef, useCallback } from 'react';
import GridCanvas from './GridCanvas';
import { useStore, ROWS, COLS } from './store';
import { audioEngine } from './AudioEngine';

const CELL_PADDING = 4;
const MIN_CELL_SIZE = 60;

const App: React.FC = () => {
  const [showBpmInput, setShowBpmInput] = useState(false);
  const [bpmInputValue, setBpmInputValue] = useState('120');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isButtonPressed, setIsButtonPressed] = useState<'play' | 'clear' | null>(null);
  const [isButtonHovered, setIsButtonHovered] = useState<'play' | 'clear' | null>(null);
  const bpmInputRef = useRef<HTMLInputElement>(null);
  const playIntervalRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);

  const notes = useStore((state) => state.notes);
  const bpm = useStore((state) => state.bpm);
  const isPlaying = useStore((state) => state.isPlaying);
  const setBpm = useStore((state) => state.setBpm);
  const clearAll = useStore((state) => state.clearAll);
  const undo = useStore((state) => state.undo);
  const pushHistory = useStore((state) => state.pushHistory);
  const toNoteSequence = useStore((state) => state.toNoteSequence);
  const setCurrentPlayingCol = useStore((state) => state.setCurrentPlayingCol);
  const setIsPlaying = useStore((state) => state.setIsPlaying);
  const setStopCallback = useStore((state) => state.setStopCallback);

  const stopPlayback = useCallback(() => {
    const state = useStore.getState();
    if (state.stopCallback) {
      state.stopCallback();
    }
    if (playIntervalRef.current !== null) {
      window.clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
    isPlayingRef.current = false;
    setIsPlaying(false);
    setCurrentPlayingCol(null);
    setStopCallback(null);
  }, [setIsPlaying, setCurrentPlayingCol, setStopCallback]);

  const startPlayback = useCallback(() => {
    const currentNotes = useStore.getState().notes;
    const currentBpm = useStore.getState().bpm;

    console.log('startPlayback called, notes:', currentNotes.length, 'bpm:', currentBpm);

    if (currentNotes.length === 0) {
      console.log('No notes, aborting');
      return;
    }

    stopPlayback();

    const beatDuration = 60 / currentBpm / 2;
    const totalDuration = beatDuration * COLS * 1000;

    const playOnce = () => {
      if (!isPlayingRef.current) return;
      const latestNotes = useStore.getState().toNoteSequence();
      console.log('playOnce called, sequence notes:', latestNotes.length);
      const stopFn = audioEngine.playNoteSequence(
        latestNotes,
        (col) => {
          if (isPlayingRef.current) {
            setCurrentPlayingCol(col);
          }
        },
        currentBpm,
        COLS
      );
      useStore.getState().setStopCallback(stopFn);
    };

    isPlayingRef.current = true;
    setIsPlaying(true);
    playOnce();

    playIntervalRef.current = window.setInterval(() => {
      const latestNotesCount = useStore.getState().notes.length;
      if (latestNotesCount > 0 && isPlayingRef.current) {
        playOnce();
      } else {
        stopPlayback();
      }
    }, totalDuration);
  }, [stopPlayback, setIsPlaying, setCurrentPlayingCol, setStopCallback]);

  const togglePlayback = useCallback(() => {
    if (isPlayingRef.current) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }, [startPlayback, stopPlayback]);

  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [stopPlayback]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  useEffect(() => {
    if (showBpmInput && bpmInputRef.current) {
      setTimeout(() => {
        bpmInputRef.current?.focus();
        bpmInputRef.current?.select();
      }, 10);
    }
  }, [showBpmInput]);

  const handleBpmClick = () => {
    setBpmInputValue(String(bpm));
    setShowBpmInput(true);
  };

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBpmInputValue(e.target.value);
  };

  const commitBpm = useCallback(() => {
    const val = parseInt(bpmInputValue);
    if (!isNaN(val) && val >= 30 && val <= 300) {
      setBpm(val);
    }
    setShowBpmInput(false);
  }, [bpmInputValue, setBpm]);

  const handleBpmKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitBpm();
    } else if (e.key === 'Escape') {
      setShowBpmInput(false);
    }
  };

  const handleActionComplete = useCallback(() => {
  }, []);

  const handleClearClick = () => {
    setShowConfirmDialog(true);
  };

  const confirmClear = () => {
    clearAll();
    setShowConfirmDialog(false);
  };

  const getButtonStyle = (type: 'play' | 'clear'): React.CSSProperties => {
    const isPressed = isButtonPressed === type;
    const isHovered = isButtonHovered === type;

    if (type === 'play') {
      const baseBg = isPlaying ? '#E74C3C' : '#2ECC71';
      return {
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: baseBg,
        boxShadow: isHovered
          ? '0 8px 25px rgba(0, 0, 0, 0.4), 0 0 15px rgba(0, 168, 255, 0.3)'
          : '0 4px 15px rgba(0, 0, 0, 0.3)',
        filter: isHovered ? 'brightness(1.2)' : 'brightness(1)',
        transform: isPressed ? 'scale(0.9)' : 'scale(1)',
        transition: 'all 0.15s ease-out',
        outline: 'none',
      };
    } else {
      return {
        padding: '12px 24px',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        backgroundColor: '#95A5A6',
        color: '#2C3E50',
        fontWeight: 600,
        fontSize: '14px',
        boxShadow: isHovered
          ? '0 6px 20px rgba(0, 0, 0, 0.3)'
          : '0 2px 10px rgba(0, 0, 0, 0.2)',
        filter: isHovered ? 'brightness(1.2)' : 'brightness(1)',
        transform: isPressed ? 'scale(0.95)' : 'scale(1)',
        transition: 'all 0.15s ease-out',
        outline: 'none',
      };
    }
  };

  const noteCount = notes.length;

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        backgroundColor: '#1E1E2E',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 10,
        }}
      >
        {showBpmInput ? (
          <input
            ref={bpmInputRef}
            type="number"
            min={30}
            max={300}
            value={bpmInputValue}
            onChange={handleBpmChange}
            onBlur={commitBpm}
            onKeyDown={handleBpmKeyDown}
            style={{
              width: '80px',
              height: '36px',
              backgroundColor: '#2D2D3F',
              border: '2px solid #00A8FF',
              borderRadius: '6px',
              color: '#FFFFFF',
              fontSize: '16px',
              fontWeight: 600,
              textAlign: 'center',
              outline: 'none',
            }}
          />
        ) : (
          <div
            onClick={handleBpmClick}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2D2D3F',
              borderRadius: '6px',
              border: '1px solid #00A8FF40',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = '#00A8FF';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 10px rgba(0, 168, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = '#00A8FF40';
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
          >
            <span style={{ fontSize: '12px', color: '#888', marginRight: '6px' }}>BPM</span>
            <span style={{ fontSize: '16px', color: '#FFFFFF', fontWeight: 600 }}>{bpm}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: '#888' }}>
            音符: <span style={{ color: '#00A8FF', fontWeight: 600 }}>{noteCount}</span>
          </div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            状态: <span style={{ color: isPlaying ? '#2ECC71' : '#E74C3C', fontWeight: 600 }}>
              {isPlaying ? '播放中' : '已停止'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '2px', margin: 0 }}>
          <span style={{ color: '#FF6B6B' }}>C</span>
          <span style={{ color: '#FFD93D' }}>O</span>
          <span style={{ color: '#6BCB77' }}>L</span>
          <span style={{ color: '#4D96FF' }}>O</span>
          <span style={{ color: '#C084FC' }}>R</span>
          <span style={{ color: '#FFFFFF' }}>CHORD</span>
        </h1>
        <p style={{ fontSize: '11px', color: '#666', marginTop: '4px', textAlign: 'right', margin: '4px 0 0 0' }}>
          Ctrl+Z 撤销
        </p>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '80px 20px 20px',
        }}
      >
        <div
          style={{
            width: '80%',
            minWidth: '800px',
            maxWidth: '1400px',
            height: '60%',
            minHeight: `${ROWS * (MIN_CELL_SIZE + CELL_PADDING) + CELL_PADDING + 40}px`,
          }}
        >
          <GridCanvas onActionComplete={handleActionComplete} />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '24px',
          padding: '24px',
          paddingBottom: '40px',
        }}
      >
        <button
          style={getButtonStyle('play')}
          onMouseDown={() => setIsButtonPressed('play')}
          onMouseUp={() => setIsButtonPressed(null)}
          onMouseEnter={() => setIsButtonHovered('play')}
          onMouseLeave={() => {
            setIsButtonHovered(null);
            setIsButtonPressed(null);
          }}
          onClick={togglePlayback}
        >
          {isPlaying ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="6" y="5" width="4" height="14" rx="1" fill="white" />
              <rect x="14" y="5" width="4" height="14" rx="1" fill="white" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M8 5V19L19 12L8 5Z" fill="white" />
            </svg>
          )}
        </button>

        <button
          style={getButtonStyle('clear')}
          onMouseDown={() => setIsButtonPressed('clear')}
          onMouseUp={() => setIsButtonPressed(null)}
          onMouseEnter={() => setIsButtonHovered('clear')}
          onMouseLeave={() => {
            setIsButtonHovered(null);
            setIsButtonPressed(null);
          }}
          onClick={handleClearClick}
        >
          清空网格
        </button>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '20px',
          display: 'flex',
          gap: '16px',
          fontSize: '11px',
          color: '#555',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'linear-gradient(135deg, hsl(30,80%,60%), hsl(30,80%,80%))' }} />
          <span>行0: 正弦波 (根音)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'linear-gradient(135deg, hsl(75,80%,70%), hsl(75,80%,90%))' }} />
          <span>行1: 方波 (三度)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'linear-gradient(135deg, hsl(120,80%,80%), hsl(120,80%,100%))' }} />
          <span>行2: 锯齿波 (五度)</span>
        </div>
      </div>

      {showConfirmDialog && (
        <div
          onClick={() => setShowConfirmDialog(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '350px',
              backgroundColor: '#2D2D3F',
              borderRadius: '12px',
              padding: '28px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 168, 255, 0.1)',
              border: '1px solid #3D3D5F',
            }}
          >
            <h3 style={{ color: '#FFFFFF', fontSize: '18px', marginBottom: '12px', fontWeight: 600, marginTop: 0 }}>
              确认清空
            </h3>
            <p style={{ color: '#AAA', fontSize: '14px', lineHeight: 1.5, marginBottom: '24px' }}>
              此操作将清除网格中的所有音符，并且正在播放的旋律将被停止。确定要继续吗？
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfirmDialog(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: '1px solid #444',
                  backgroundColor: 'transparent',
                  color: '#AAA',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#3D3D5F';
                  (e.currentTarget as HTMLElement).style.color = '#FFF';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = '#AAA';
                }}
              >
                取消
              </button>
              <button
                onClick={confirmClear}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#E74C3C',
                  color: '#FFF',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.filter = 'brightness(1.2)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.filter = 'brightness(1)';
                }}
              >
                确定清空
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
