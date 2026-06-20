import React, { useState, useEffect, useRef, useCallback } from 'react';
import BattleTimeline from './components/BattleTimeline';
import LogPanel, { LogPanelHandle } from './components/LogPanel';
import { generateBattleLog } from './battleEngine';
import { BattleEvent } from './types';

const App: React.FC = () => {
  const [events, setEvents] = useState<BattleEvent[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const logPanelRef = useRef<LogPanelHandle>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const battleEvents = generateBattleLog();
    setEvents(battleEvents);
  }, []);

  const clearInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = window.setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= events.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 500);
    } else {
      clearInterval();
    }

    return clearInterval;
  }, [isPlaying, events.length, clearInterval]);

  const handleStepBack = () => {
    setIsPlaying(false);
    setCurrentIndex((prev) => Math.max(-1, prev - 1));
  };

  const handlePlayPause = () => {
    if (currentIndex >= events.length - 1) {
      setCurrentIndex(-1);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(-1);
    logPanelRef.current?.clear();
    const battleEvents = generateBattleLog();
    setEvents(battleEvents);
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#3a3a5c',
    color: '#c0c0c0',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, transform 0.1s ease',
    outline: 'none',
    userSelect: 'none'
  };

  return (
    <div
      style={{
        backgroundColor: '#1e1e2e',
        minHeight: '100vh',
        padding: '16px',
        boxSizing: 'border-box',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto'
        }}
      >
        <div
          style={{
            color: '#c0c0c0',
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '16px',
            padding: '12px 16px',
            backgroundColor: '#2a2a3c',
            borderRadius: '12px'
          }}
        >
          战斗回放 - 日志系统
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 400px',
            gap: '8px'
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <BattleTimeline events={events} currentIndex={currentIndex} />

            <div
              style={{
                backgroundColor: '#2a2a3c',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                justifyContent: 'center',
                gap: '16px'
              }}
            >
              <button
                onClick={handleStepBack}
                style={buttonStyle}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#5a5a7c')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3a3a5c')}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                ⏪ 回退一步
              </button>
              <button
                onClick={handlePlayPause}
                style={{
                  ...buttonStyle,
                  backgroundColor: isPlaying ? '#5a5a7c' : '#3a3a5c'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#5a5a7c')}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = isPlaying ? '#5a5a7c' : '#3a3a5c')
                }
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {isPlaying ? '⏸ 暂停回放' : currentIndex >= events.length - 1 ? '🔄 重新播放' : '▶ 自动回放'}
              </button>
              <button
                onClick={handleReset}
                style={buttonStyle}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#5a5a7c')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3a3a5c')}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                🔁 重置
              </button>
            </div>

            <div
              style={{
                backgroundColor: '#2a2a3c',
                borderRadius: '12px',
                padding: '12px 16px',
                color: '#888',
                fontSize: '13px',
                textAlign: 'center'
              }}
            >
              进度: {Math.max(0, currentIndex + 1)} / {events.length} 事件
              {isPlaying && <span style={{ marginLeft: '12px', color: '#5cff8c' }}>● 回放中</span>}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <LogPanel ref={logPanelRef} events={events} currentIndex={currentIndex} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
