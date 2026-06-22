import React, { useState, useEffect, useCallback, useRef } from 'react';
import StatusPanel from './components/StatusPanel';
import MapPanel from './components/MapPanel';
import LogPanel from './components/LogPanel';
import { GameState } from './types';
import { getState, moveTeam, chooseEventOption, eventTimeout, resetGame } from './api';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const isChoosingRef = useRef<boolean>(false);

  const fetchState = useCallback(async () => {
    try {
      const state = await getState();
      setGameState(state);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取游戏状态失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const handleMove = useCallback(async (x: number, y: number) => {
    if (isMoving || !gameState || gameState.isEventActive) return;

    setIsMoving(true);
    try {
      const result = await moveTeam(x, y);
      if (result.success) {
        setGameState(result.state);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '移动失败');
    } finally {
      setIsMoving(false);
    }
  }, [isMoving, gameState]);

  const handleChooseOption = useCallback(async (optionId: string) => {
    if (isChoosingRef.current || !gameState || !gameState.isEventActive) return;

    isChoosingRef.current = true;
    try {
      const result = await chooseEventOption(optionId);
      if (result.success) {
        setGameState(result.state);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '选择失败');
    } finally {
      setTimeout(() => {
        isChoosingRef.current = false;
      }, 100);
    }
  }, [gameState]);

  const handleEventTimeout = useCallback(async () => {
    if (isChoosingRef.current || !gameState || !gameState.isEventActive) return;

    isChoosingRef.current = true;
    try {
      const result = await eventTimeout();
      if (result.success) {
        setGameState(result.state);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '超时处理失败');
    } finally {
      setTimeout(() => {
        isChoosingRef.current = false;
      }, 100);
    }
  }, [gameState]);

  const handleReset = useCallback(async () => {
    if (!confirm('确定要重新开始游戏吗？')) return;

    try {
      const result = await resetGame();
      if (result.success) {
        setGameState(result.state);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '重置失败');
    }
  }, []);

  if (loading) {
    return (
      <div className="app-container loading">
        <div className="loading-text">加载中...</div>
      </div>
    );
  }

  if (error && !gameState) {
    return (
      <div className="app-container error">
        <div className="error-text">错误: {error}</div>
        <button onClick={fetchState}>重试</button>
      </div>
    );
  }

  if (!gameState) return null;

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">🏕️ 荒野求生</h1>
        <div className="header-info">
          <span className="turn-info">第 {gameState.turnCount} 回合</span>
          <button className="reset-btn" onClick={handleReset}>
            重新开始
          </button>
        </div>
      </header>

      <main className="main-content">
        <StatusPanel characters={gameState.characters} />

        <div className="right-panel">
          <MapPanel
            position={gameState.position}
            currentEvent={gameState.currentEvent}
            isEventActive={gameState.isEventActive}
            eventStartTime={gameState.eventStartTime}
            onMove={handleMove}
            onChooseOption={handleChooseOption}
            onEventTimeout={handleEventTimeout}
            disabled={isMoving}
          />
          <LogPanel logs={gameState.logs} />
        </div>
      </main>

      {error && (
        <div className="error-toast" onClick={() => setError(null)}>
          {error}
        </div>
      )}

      <style>{`
        .app-container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background-color: #3e2723;
          padding: 12px;
          gap: 12px;
        }

        .app-container.loading,
        .app-container.error {
          align-items: center;
          justify-content: center;
        }

        .loading-text {
          color: #f5deb3;
          font-size: 24px;
        }

        .error-text {
          color: #e74c3c;
          font-size: 18px;
          margin-bottom: 16px;
        }

        .app-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 16px;
          background-color: #2c1e16;
          border: 2px solid #5d4037;
          border-radius: 6px;
        }

        .app-title {
          font-size: 24px;
          color: #ffb300;
          margin: 0;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }

        .header-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .turn-info {
          color: #f5deb3;
          font-size: 14px;
          background-color: rgba(93, 64, 55, 0.5);
          padding: 6px 12px;
          border-radius: 4px;
        }

        .reset-btn {
          height: 36px;
          padding: 0 16px;
          background-color: #5d4037;
          color: #f5deb3;
          border: 2px solid #7b5b4e;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .reset-btn:hover {
          background-color: #7b5b4e;
          border-color: #ffb300;
        }

        .reset-btn:active {
          background-color: #4e342e;
          transform: scale(0.98);
        }

        .main-content {
          flex: 1;
          display: flex;
          gap: 12px;
          min-height: 0;
        }

        .right-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-width: 0;
        }

        .error-toast {
          position: fixed;
          bottom: 20px;
          right: 20px;
          padding: 12px 20px;
          background-color: #e74c3c;
          color: white;
          border-radius: 6px;
          cursor: pointer;
          animation: slideIn 0.3s ease;
          z-index: 2000;
          font-size: 14px;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
