import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameBoard from './components/GameBoard';
import TrapPanel from './components/TrapPanel';
import WaveInfo from './components/WaveInfo';
import { GameEngine } from './game/GameEngine';
import {
  Position,
  TrapType,
  GuardType,
  INITIAL_GOLD,
  INITIAL_LIVES,
  TRAP_COST,
  GUARD_COST,
  Monster,
  Guard,
  Trap,
  CoinAnimation,
  ExplosionAnimation,
  CellType,
} from './game/types';

interface GameViewState {
  gold: number;
  lives: number;
  currentWave: number;
  waveInProgress: boolean;
  monsters: Monster[];
  guards: Guard[];
  traps: Trap[];
  coins: CoinAnimation[];
  explosions: ExplosionAnimation[];
  totalKills: number;
  totalGoldEarned: number;
}

const App: React.FC = () => {
  const engineRef = useRef<GameEngine>(new GameEngine(INITIAL_GOLD, INITIAL_LIVES));
  const mapRef = useRef<CellType[][]>(engineRef.current.getMap());
  const [, forceUpdate] = useState(0);
  const [viewState, setViewState] = useState<GameViewState>({
    gold: INITIAL_GOLD,
    lives: INITIAL_LIVES,
    currentWave: 0,
    waveInProgress: false,
    monsters: [],
    guards: [],
    traps: [],
    coins: [],
    explosions: [],
    totalKills: 0,
    totalGoldEarned: 0,
  });
  const [selectedItem, setSelectedItem] = useState<{
    type: 'trap' | 'guard';
    subtype: TrapType | GuardType;
  } | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [showWaveText, setShowWaveText] = useState(false);
  const lastTimeRef = useRef<number>(performance.now());
  const animationFrameRef = useRef<number>(0);

  const syncState = useCallback(() => {
    const state = engineRef.current.getState();
    setViewState({
      gold: state.gold,
      lives: state.lives,
      currentWave: state.currentWave,
      waveInProgress: state.waveInProgress,
      monsters: [...state.monsters],
      guards: [...state.guards],
      traps: [...state.traps],
      coins: [...state.coins],
      explosions: [...state.explosions],
      totalKills: state.totalKills,
      totalGoldEarned: state.totalGoldEarned,
    });
    forceUpdate((n) => n + 1);
  }, []);

  useEffect(() => {
    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      if (!isGameOver && !isVictory) {
        const result = engineRef.current.update(deltaTime);
        if (result.gameOver) {
          setIsGameOver(true);
        } else {
          const state = engineRef.current.getState();
          if (state.currentWave >= 10 && !state.waveInProgress && state.monsters.length === 0) {
            setIsVictory(true);
          }
        }
      }

      syncState();
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isGameOver, isVictory, syncState]);

  const handleCellClick = useCallback(
    (pos: Position) => {
      if (isGameOver || isVictory) return;
      if (!selectedItem) return;

      if (selectedItem.type === 'trap') {
        engineRef.current.placeTrap(selectedItem.subtype as TrapType, pos, TRAP_COST);
      } else if (selectedItem.type === 'guard') {
        engineRef.current.placeGuard(selectedItem.subtype as GuardType, pos, GUARD_COST);
      }
      syncState();
    },
    [selectedItem, isGameOver, isVictory, syncState]
  );

  const handleStartWave = useCallback(() => {
    if (engineRef.current.startWave()) {
      setShowWaveText(true);
      setTimeout(() => setShowWaveText(false), 1500);
      syncState();
    }
  }, [syncState]);

  const handleRestart = useCallback(() => {
    engineRef.current.reset(INITIAL_GOLD, INITIAL_LIVES);
    mapRef.current = engineRef.current.getMap();
    setIsGameOver(false);
    setIsVictory(false);
    setSelectedItem(null);
    setShowWaveText(false);
    syncState();
  }, [syncState]);

  const handleSelectItem = useCallback(
    (item: { type: 'trap' | 'guard'; subtype: TrapType | GuardType } | null) => {
      setSelectedItem(item);
    },
    []
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '80px 16px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <h1
        style={{
          fontSize: 20,
          color: '#D35400',
          marginBottom: 32,
          textShadow: '2px 2px 0 #2C1810',
        }}
      >
        ⚔️ 地下城守护者 🏰
      </h1>

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 16,
          alignItems: 'flex-start',
          justifyContent: 'center',
          maxWidth: 800,
          width: '100%',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            order: 2,
            flex: '1 1 240px',
            minWidth: 240,
            maxWidth: 280,
          }}
        >
          <TrapPanel
            selectedItem={selectedItem}
            onSelectItem={handleSelectItem}
            gold={viewState.gold}
          />
          <WaveInfo
            currentWave={viewState.currentWave}
            waveInProgress={viewState.waveInProgress}
            onStartWave={handleStartWave}
          />
        </div>

        <div style={{ order: 1, flex: '0 0 auto' }}>
          <GameBoard
            map={mapRef.current}
            monsters={viewState.monsters}
            guards={viewState.guards}
            traps={viewState.traps}
            coins={viewState.coins}
            explosions={viewState.explosions}
            gold={viewState.gold}
            lives={viewState.lives}
            selectedItem={selectedItem}
            onCellClick={handleCellClick}
            showWaveText={showWaveText}
            currentWave={viewState.currentWave}
          />
        </div>
      </div>

      {(isGameOver || isVictory) && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#4A3B32',
              padding: 32,
              borderRadius: 8,
              border: '4px solid #D35400',
              boxShadow: '0 0 30px rgba(211, 84, 0, 0.5)',
              minWidth: 320,
              textAlign: 'center',
            }}
          >
            <h2
              style={{
                fontSize: 24,
                color: isVictory ? '#2ECC71' : '#E74C3C',
                marginBottom: 24,
                textShadow: '2px 2px 0 #2C1810',
              }}
            >
              {isVictory ? '🎉 胜利！' : '💀 游戏结束'}
            </h2>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                marginBottom: 24,
                fontSize: 12,
                color: '#E8D5B7',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', backgroundColor: '#3A2F2B', borderRadius: 4 }}>
                <span>击败怪物数:</span>
                <span style={{ color: '#FFD700' }}>{viewState.totalKills}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', backgroundColor: '#3A2F2B', borderRadius: 4 }}>
                <span>存活波次:</span>
                <span style={{ color: '#FFD700' }}>{viewState.currentWave}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', backgroundColor: '#3A2F2B', borderRadius: 4 }}>
                <span>累计金币:</span>
                <span style={{ color: '#FFD700' }}>{viewState.totalGoldEarned}</span>
              </div>
            </div>

            <button
              onClick={handleRestart}
              style={{
                width: '100%',
                padding: '14px 24px',
                backgroundColor: '#3A3A3A',
                border: '3px solid #2C1810',
                borderRadius: 4,
                color: '#E8D5B7',
                fontSize: 12,
                fontFamily: "'Press Start 2P', sans-serif",
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                transform: 'translateY(0)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#555555';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3A3A3A';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(2px)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              重新开始
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 600px) {
          div[style*="flex-direction: row"] {
            flex-direction: column !important;
            align-items: center !important;
          }
          div[style*="order: 1"] {
            order: 1 !important;
          }
          div[style*="order: 2"] {
            order: 2 !important;
            width: 100% !important;
            max-width: 100% !important;
            gap: 0.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
