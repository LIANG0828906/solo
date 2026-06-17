import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Board } from './Board';
import { SetupView, InfoPanels, GameResultOverlay } from './UI';
import { useGameState } from './GameState';
import { AnimationModule } from './AnimationModule';
import { EventBus, type EventName } from './EventBus';
import { AIModule } from './AIModule';

function App() {
  const {
    gamePhase,
    useAI,
    currentPlayer,
    decrementCountdown,
    selectPiece,
    performAttack,
    selectedPieceId,
  } = useGameState();

  useEffect(() => {
    AnimationModule.start();
    return () => AnimationModule.stop();
  }, []);

  useEffect(() => {
    if (gamePhase !== 'playing') return;

    const timer = setInterval(() => {
      decrementCountdown();
    }, 1000);

    return () => clearInterval(timer);
  }, [gamePhase, decrementCountdown]);

  useEffect(() => {
    if (gamePhase !== 'playing') return;
    if (!useAI || currentPlayer !== 2) return;

    const aiTimer = setTimeout(() => {
      const action = AIModule.getBestAction(2);
      if (action) {
        selectPiece(action.attackerId);
        setTimeout(() => {
          performAttack(action.attackerId, action.targetId);
        }, 400);
      } else {
        const state = useGameState.getState();
        if (state.currentPlayer === 2) {
          state.endTurn();
        }
      }
    }, 900);

    return () => clearTimeout(aiTimer);
  }, [gamePhase, useAI, currentPlayer, selectPiece, performAttack]);

  useEffect(() => {
    const off = EventBus.on('AI_ACTION' as EventName, () => {
      const action = AIModule.getBestAction(2);
      if (action) {
        selectPiece(action.attackerId);
        setTimeout(() => {
          performAttack(action.attackerId, action.targetId);
        }, 350);
      }
    });
    return off;
  }, [selectPiece, performAttack]);

  if (gamePhase === 'setup') {
    return <SetupView />;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background:
          'radial-gradient(ellipse at 30% 20%, #1A1A2E 0%, #0F0F1E 50%, #000000 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'auto',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 24,
          zIndex: 40,
        }}
      >
        <div
          style={{
            fontSize: 26,
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #E94560, #533483, #0F3460)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: 2,
          }}
        >
          ✨ 魔法棋局
        </div>
        <div
          style={{
            color: '#7070A0',
            fontSize: 12,
            marginTop: 4,
            letterSpacing: 1,
          }}
        >
          {useAI ? '模式：人机对战 · 玩家 🔵 VS 🔴 AI' : '模式：双人对战 · 🔵 VS 🔴'}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: 24,
          zIndex: 40,
          color: '#606090',
          fontSize: 12,
          lineHeight: 1.8,
          maxWidth: 300,
        }}
      >
        <div style={{ color: '#8080B0', marginBottom: 4 }}>🎮 操作指南</div>
        <div>• 点击己方棋子选中并查看攻击范围</div>
        <div>• 点击红框内敌方棋子发起攻击</div>
        <div>• 击杀全部敌方棋子即可获胜</div>
        {!!selectedPieceId && (
          <div style={{ color: '#FFB74D', marginTop: 8 }}>✨ 已选中棋子，点击红色范围攻击敌人</div>
        )}
      </div>

      <Board />
      <InfoPanels />
      <GameResultOverlay />
    </div>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
