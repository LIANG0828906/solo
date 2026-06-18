import React, { useState, useEffect, useRef, useMemo } from 'react';
import Tapestry from './Tapestry';
import ColorPicker from './ColorPicker';
import { useTapestryStore, COLORS, INITIAL_COLOR, GRID_SIZE } from './store';

const App: React.FC = () => {
  const {
    grid,
    history,
    isPlaying,
    playIndex,
    playbackGrid,
    undo,
    clear,
    startPlayback,
    stopPlayback,
    setPlaybackGrid,
    setPlayIndex,
  } = useTapestryStore();

  const [showClearModal, setShowClearModal] = useState(false);
  const playbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying && playbackGrid) {
      if (playIndex < history.length) {
        playbackTimerRef.current = window.setTimeout(() => {
          const step = history[playIndex];
          const newGrid = [...playbackGrid];
          newGrid[step.index] = step.color;
          setPlaybackGrid(newGrid);
          setPlayIndex(playIndex + 1);
        }, 500);
      } else {
        stopPlayback();
      }
    }

    return () => {
      if (playbackTimerRef.current) {
        clearTimeout(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
    };
  }, [isPlaying, playIndex, history, playbackGrid, setPlaybackGrid, setPlayIndex, stopPlayback]);

  const handleClearClick = () => {
    if (history.length === 0) return;
    setShowClearModal(true);
  };

  const handleConfirmClear = () => {
    clear();
    setShowClearModal(false);
  };

  const handleCancelClear = () => {
    setShowClearModal(false);
  };

  const colorStats = useMemo(() => {
    const stats: { name: string; value: string; count: number; percentage: number }[] = [];
    const totalCells = GRID_SIZE * GRID_SIZE;

    COLORS.forEach((color) => {
      const count = grid.filter((c) => c === color.value).length;
      if (count > 0) {
        stats.push({
          name: color.name,
          value: color.value,
          count,
          percentage: (count / totalCells) * 100,
        });
      }
    });

    const initialCount = grid.filter((c) => c === INITIAL_COLOR).length;
    if (initialCount > 0 && initialCount < totalCells) {
      stats.push({
        name: '未着色',
        value: INITIAL_COLOR,
        count: initialCount,
        percentage: (initialCount / totalCells) * 100,
      });
    }

    return stats.sort((a, b) => b.count - a.count);
  }, [grid]);

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#2D3436',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 20px',
    fontSize: 14,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    transition: 'background-color 0.2s ease, transform 0.2s ease',
    fontWeight: 500,
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#1A1A2E',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 800,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px 20px',
          gap: 16,
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <h1
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: '#DFE6E9',
            marginRight: 32,
            letterSpacing: 2,
          }}
        >
          ✦ 情绪编织
        </h1>

        <button
          onClick={undo}
          disabled={isPlaying || history.length === 0}
          style={{
            ...buttonStyle,
            opacity: isPlaying || history.length === 0 ? 0.4 : 1,
            cursor: isPlaying || history.length === 0 ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(e) => {
            if (!isPlaying && history.length > 0) {
              e.currentTarget.style.backgroundColor = '#3D4852';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#2D3436';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          撤销
        </button>

        <button
          onClick={handleClearClick}
          disabled={isPlaying || history.length === 0}
          style={{
            ...buttonStyle,
            opacity: isPlaying || history.length === 0 ? 0.4 : 1,
            cursor: isPlaying || history.length === 0 ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(e) => {
            if (!isPlaying && history.length > 0) {
              e.currentTarget.style.backgroundColor = '#3D4852';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#2D3436';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"></path>
            <path d="M10 11v6M14 11v6"></path>
          </svg>
          清空
        </button>

        <button
          onClick={isPlaying ? stopPlayback : startPlayback}
          disabled={!isPlaying && history.length === 0}
          style={{
            ...buttonStyle,
            backgroundColor: isPlaying ? '#00B894' : '#2D3436',
            opacity: !isPlaying && history.length === 0 ? 0.4 : 1,
            cursor: !isPlaying && history.length === 0 ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(e) => {
            if (!(history.length === 0 && !isPlaying)) {
              e.currentTarget.style.backgroundColor = isPlaying ? '#00D9A8' : '#3D4852';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isPlaying ? '#00B894' : '#2D3436';
          }}
        >
          {isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1"></rect>
              <rect x="14" y="4" width="4" height="16" rx="1"></rect>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          )}
          {isPlaying ? `回放中 ${playIndex}/${history.length}` : '播放回放'}
        </button>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: 20,
          gap: 20,
        }}
      >
        <div style={{ position: 'relative' }}>
          <Tapestry />
        </div>
        <ColorPicker />
      </div>

      <div
        style={{
          width: '100%',
          backgroundColor: '#0F3460',
          padding: '16px 24px',
          minHeight: 80,
        }}
      >
        <div
          style={{
            maxWidth: 800,
            margin: '0 auto',
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: '#636E72',
              marginBottom: 8,
              fontWeight: 500,
            }}
          >
            情绪色彩统计（共 {history.length} 次编织）
          </div>

          {colorStats.length === 0 ? (
            <div style={{ fontSize: 12, color: '#636E72', opacity: 0.6 }}>
              点击画布开始编织你的情绪...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {colorStats.map((stat) => (
                <div
                  key={stat.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 100,
                      fontSize: 12,
                      color: '#636E72',
                      flexShrink: 0,
                    }}
                  >
                    {stat.name}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      height: 12,
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      borderRadius: 6,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${stat.percentage}%`,
                        backgroundColor: stat.value,
                        borderRadius: 6,
                        transition: 'width 0.3s ease-out',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      width: 50,
                      fontSize: 12,
                      color: '#636E72',
                      textAlign: 'right',
                      flexShrink: 0,
                    }}
                  >
                    {stat.percentage.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showClearModal && (
        <div
          onClick={handleCancelClear}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#16213E',
              borderRadius: 12,
              padding: 28,
              width: 360,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <h3
              style={{
                fontSize: 18,
                color: '#ffffff',
                marginBottom: 12,
                fontWeight: 600,
              }}
            >
              确认清空画布？
            </h3>
            <p
              style={{
                fontSize: 14,
                color: '#636E72',
                marginBottom: 24,
                lineHeight: 1.5,
              }}
            >
              此操作将清除已编织的 {history.length} 个色块，所有进度将无法恢复。
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancelClear}
                style={{
                  ...buttonStyle,
                  backgroundColor: 'transparent',
                  border: '1px solid #2D3436',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                取消
              </button>
              <button
                onClick={handleConfirmClear}
                style={{
                  ...buttonStyle,
                  backgroundColor: '#FF6B6B',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FF8787';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FF6B6B';
                }}
              >
                确认清空
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
