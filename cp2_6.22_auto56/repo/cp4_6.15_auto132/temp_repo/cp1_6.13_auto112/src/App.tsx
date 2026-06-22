import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { GameState } from './types';
import { GameEngine } from './game/GameEngine';
import { GameBoard } from './ui/GameBoard';

type GameMode = 'local' | 'server';

const App: React.FC = () => {
  const [mode, setMode] = useState<GameMode>('local');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameId, setGameId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const engineRef = useRef<GameEngine | null>(null);
  const pendingSpellRef = useRef<{ playerId: number; spellId: string } | null>(null);
  const serverSyncRef = useRef<number | null>(null);
  const frozenSkipRef = useRef<number | null>(null);

  const clearFrozenSkip = useCallback(() => {
    if (frozenSkipRef.current) {
      clearTimeout(frozenSkipRef.current);
      frozenSkipRef.current = null;
    }
  }, []);

  const initLocalGame = useCallback(() => {
    clearFrozenSkip();
    engineRef.current = new GameEngine();
    setGameState(engineRef.current.getState());
    setLoading(false);
  }, [clearFrozenSkip]);

  const initServerGame = useCallback(async () => {
    try {
      clearFrozenSkip();
      setLoading(true);
      setError('');
      const resp = await axios.post('/api/game/init');
      if (resp.data.success) {
        setGameState(resp.data.state);
        setGameId(resp.data.gameId);
        setLoading(false);
      }
    } catch (e: any) {
      console.warn('连接后端失败，切换到本地模式:', e.message);
      setError('后端服务不可用，已切换到本地模式');
      setMode('local');
      initLocalGame();
      setTimeout(() => setError(''), 4000);
    }
  }, [initLocalGame, clearFrozenSkip]);

  useEffect(() => {
    if (mode === 'local') {
      initLocalGame();
    } else {
      initServerGame();
    }
    return () => {
      if (serverSyncRef.current) {
        clearInterval(serverSyncRef.current);
        serverSyncRef.current = null;
      }
      clearFrozenSkip();
    };
  }, [mode, initLocalGame, initServerGame, clearFrozenSkip]);

  useEffect(() => {
    if (mode === 'server' && gameId) {
      serverSyncRef.current = window.setInterval(async () => {
        try {
          const resp = await axios.post(`/api/game/${gameId}/sync`);
          if (resp.data.success && resp.data.state) {
            setGameState((prev) => {
              if (!prev) return resp.data.state;
              const prevState = JSON.stringify(prev);
              const newState = JSON.stringify(resp.data.state);
              if (prevState !== newState) {
                return resp.data.state;
              }
              return prev;
            });
          }
        } catch {}
      }, 400);
    }
    return () => {
      if (serverSyncRef.current) {
        clearInterval(serverSyncRef.current);
        serverSyncRef.current = null;
      }
    };
  }, [mode, gameId]);

  useEffect(() => {
    if (
      gameState &&
      !gameState.gameOver &&
      gameState.phase === 'selecting' &&
      gameState.players[gameState.currentPlayer].status === 'frozen' &&
      mode === 'local' &&
      !frozenSkipRef.current
    ) {
      frozenSkipRef.current = window.setTimeout(() => {
        if (engineRef.current) {
          const frozenId = gameState!.currentPlayer;
          const newState = engineRef.current.skipFrozenTurn(frozenId);
          setGameState(newState);
        }
        frozenSkipRef.current = null;
      }, 1500);
    }
    return () => {
      if (frozenSkipRef.current && gameState?.players[gameState.currentPlayer]?.status !== 'frozen') {
        clearTimeout(frozenSkipRef.current);
        frozenSkipRef.current = null;
      }
    };
  }, [gameState, mode]);

  const getAnimationDuration = (element: string): number => {
    const d: Record<string, number> = { fire: 600, ice: 800, thunder: 1000, wind: 500 };
    return (d[element] || 600) + 320;
  };

  const handleSpellSelect = useCallback(async (playerId: number, spellId: string) => {
    if (!gameState || gameState.gameOver || gameState.phase !== 'selecting') return;
    if (gameState.players[gameState.currentPlayer].status === 'frozen') return;
    clearFrozenSkip();
    if (mode === 'local' && engineRef.current) {
      const spell = gameState.players[playerId].hand.find(s => s.id === spellId);
      if (!spell) return;
      const result = engineRef.current.playSpell(playerId, spellId);
      if (!result.effect) return;
      pendingSpellRef.current = { playerId, spellId };
      setGameState(result.state);
      const duration = getAnimationDuration(spell.element);
      setTimeout(() => {
        if (engineRef.current && pendingSpellRef.current) {
          const { playerId: p, spellId: s } = pendingSpellRef.current;
          engineRef.current!.resolveSpell(p, s);
          const next = engineRef.current!.nextRound();
          setGameState(next);
          pendingSpellRef.current = null;
        }
      }, duration);
    } else if (mode === 'server') {
      const spell = gameState.players[playerId].hand.find(s => s.id === spellId);
      if (!spell) return;
      try {
        const resp = await axios.post(`/api/game/${gameId}/play`, { playerId, spellId });
        if (resp.data.success) {
          setGameState(resp.data.state);
          const duration = getAnimationDuration(spell.element);
          setTimeout(async () => {
            try {
              const r = await axios.get(`/api/game/${gameId}`);
              if (r.data.success) setGameState(r.data.state);
            } catch {}
          }, duration + 80);
        }
      } catch (e: any) {
        setError(e.response?.data?.error || '操作失败');
        setTimeout(() => setError(''), 2500);
      }
    }
  }, [gameState, mode, gameId, clearFrozenSkip]);

  const handleReset = useCallback(async () => {
    clearFrozenSkip();
    pendingSpellRef.current = null;
    if (mode === 'local') {
      if (engineRef.current) {
        const s = engineRef.current.reset();
        setGameState(s);
      }
    } else {
      try {
        const resp = await axios.post(`/api/game/${gameId}/reset`);
        if (resp.data.success) {
          setGameState(resp.data.state);
          setGameId(resp.data.gameId);
        }
      } catch {
        initLocalGame();
        setMode('local');
      }
    }
  }, [mode, gameId, initLocalGame, clearFrozenSkip]);

  if (loading || !gameState) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        color: '#e0e0e0',
        background: '#1a1a2e',
        flexDirection: 'column',
        gap: 20,
      }}>
        <div style={{ fontSize: 32, fontWeight: 'bold', letterSpacing: 2 }}>
          ✨ 正在加载 ArcaneForge...
        </div>
        <div style={{ color: '#888', fontSize: 14 }}>正在初始化奥术熔炉</div>
        <div style={{
          width: 200,
          height: 4,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 2,
          overflow: 'hidden',
          marginTop: 10,
        }}>
          <div style={{
            width: '60%',
            height: '100%',
            background: 'linear-gradient(90deg, #FFD700, #E25822, #00BFFF, #32CD32)',
            animation: 'loading 1.5s ease-in-out infinite',
          }} />
        </div>
        <style>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh' }}>
      <div style={{
        position: 'fixed',
        top: 12,
        right: 12,
        zIndex: 1000,
        display: 'flex',
        gap: 8,
        alignItems: 'center',
      }}>
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 10,
          padding: 5,
          gap: 4,
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(8px)',
        }}>
          <button
            onClick={() => { setMode('local'); initLocalGame(); }}
            style={{
              padding: '7px 16px',
              borderRadius: 7,
              border: 'none',
              background: mode === 'local' ? 'rgba(255,215,0,0.22)' : 'transparent',
              color: mode === 'local' ? '#FFD700' : '#aaa',
              cursor: 'pointer',
              fontSize: 12,
              transition: 'all 0.3s',
              fontWeight: mode === 'local' ? 'bold' : 'normal',
            }}
          >
            🎮 本地对战
          </button>
          <button
            onClick={() => { setMode('server'); initServerGame(); }}
            style={{
              padding: '7px 16px',
              borderRadius: 7,
              border: 'none',
              background: mode === 'server' ? 'rgba(100,200,255,0.22)' : 'transparent',
              color: mode === 'server' ? '#87CEEB' : '#aaa',
              cursor: 'pointer',
              fontSize: 12,
              transition: 'all 0.3s',
              fontWeight: mode === 'server' ? 'bold' : 'normal',
            }}
          >
            🌐 联机模式
          </button>
        </div>
      </div>
      {error && (
        <div style={{
          position: 'fixed',
          top: 64,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, rgba(255,80,80,0.25), rgba(200,40,40,0.15))',
          border: '1px solid #ff6666',
          color: '#ffaaaa',
          padding: '10px 24px',
          borderRadius: 10,
          zIndex: 999,
          fontSize: 13,
          boxShadow: '0 4px 20px rgba(255,100,100,0.2)',
          fontWeight: 500,
        }}>
          ⚠️ {error}
        </div>
      )}
      <GameBoard
        gameState={gameState}
        onSpellSelect={handleSpellSelect}
        onReset={handleReset}
      />
    </div>
  );
};

export default App;
