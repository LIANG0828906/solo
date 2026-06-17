import React, { useEffect, useState } from 'react';
import { useGameStore } from './store/gameStore';
import { useShallow } from 'zustand/react/shallow';
import { GameBoard } from './components/GameBoard';
import { HeroPanel } from './components/HeroPanel';
import { BattleLog } from './components/BattleLog';
import { GameOverModal } from './components/GameOverModal';
import { getAIAction } from './engine/aiEngine';

const App: React.FC = () => {
  const { phase, currentPlayer, turn, endTurn, isAnimating, moveHero, attack, useSkill, setIsAnimating, heroes, updateDisplayPosition } = useGameStore(
    useShallow((s) => ({
      phase: s.phase,
      currentPlayer: s.currentPlayer,
      turn: s.turn,
      endTurn: s.endTurn,
      isAnimating: s.isAnimating,
      moveHero: s.moveHero,
      attack: s.attack,
      useSkill: s.useSkill,
      setIsAnimating: s.setIsAnimating,
      heroes: s.heroes,
      updateDisplayPosition: s.updateDisplayPosition,
    }))
  );

  const [activeTab, setActiveTab] = useState<'hero' | 'log'>('hero');
  const [aiThinking, setAiThinking] = useState(false);

  useEffect(() => {
    if (phase !== 'ai_turn') return;
    if (isAnimating) return;

    setAiThinking(true);
    const thinkTimer = setTimeout(() => {
      const action = getAIAction(useGameStore.getState());

      const executeAction = () => {
        const currentState = useGameStore.getState();
        if (currentState.phase !== 'ai_turn') return;

        const aiAction = getAIAction(currentState);

        if (aiAction.type === 'move' && aiAction.target) {
          const success = moveHero('ai', aiAction.target);
          if (success) {
            setTimeout(() => {
              setIsAnimating(false);
              updateDisplayPosition('ai', aiAction.target!);
              setTimeout(executeAction, 200);
            }, 350);
            return;
          }
        } else if (aiAction.type === 'attack') {
          attack('ai');
          setTimeout(executeAction, 200);
          return;
        } else if (aiAction.type === 'skill' && aiAction.skillId) {
          useSkill('ai', aiAction.skillId);
          setTimeout(executeAction, 200);
          return;
        }

        setAiThinking(false);
        endTurn();
      };

      executeAction();
    }, 500);

    return () => {
      clearTimeout(thinkTimer);
    };
  }, [phase, isAnimating, moveHero, attack, useSkill, endTurn, setIsAnimating, updateDisplayPosition]);

  const handleEndTurn = () => {
    if (phase !== 'player_turn') return;
    if (isAnimating) return;
    endTurn();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: '#1A1A2E',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: 0,
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '16px 24px',
          background: '#16213E',
          borderBottom: '2px solid #0F3460',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 'bold', color: '#FFD700' }}>
          ⚔️ ShadowDuel 暗影对决
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 14, opacity: 0.9 }}>
            回合: <span style={{ color: '#FFD700', fontWeight: 'bold' }}>{turn}</span>
          </div>
          <div
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              background: currentPlayer === 'player' ? 'rgba(74, 144, 217, 0.3)' : 'rgba(231, 76, 60, 0.3)',
              border: `1px solid ${currentPlayer === 'player' ? '#4A90D9' : '#E74C3C'}`,
              fontSize: 13,
            }}
          >
            {phase === 'game_over'
              ? '游戏结束'
              : currentPlayer === 'player'
              ? aiThinking
                ? ''
                : '你的回合'
              : aiThinking
              ? 'AI思考中...'
              : 'AI回合'}
          </div>
          {phase === 'player_turn' && !isAnimating && (
            <button
              onClick={handleEndTurn}
              style={{
                padding: '8px 20px',
                background: '#2D2D44',
                border: '1px solid #4A90D9',
                color: 'white',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 13,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 0 8px rgba(106, 159, 181, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              结束回合
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          gap: 20,
          padding: 20,
          maxWidth: 1400,
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
        className="main-container"
      >
        <div
          className="left-panel-desktop"
          style={{
            width: 260,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <HeroPanel heroId="player" />
          <HeroPanel heroId="ai" />
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 0,
          }}
        >
          <GameBoard />
        </div>

        <div
          className="right-panel-desktop"
          style={{
            width: 240,
            flexShrink: 0,
            maxHeight: 'calc(100vh - 140px)',
          }}
        >
          <BattleLog />
        </div>

        <div
          className="mobile-tabs"
          style={{
            display: 'none',
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: '#16213E',
            borderTop: '2px solid #0F3460',
            zIndex: 100,
          }}
        >
          <div style={{ display: 'flex' }}>
            <button
              onClick={() => setActiveTab('hero')}
              style={{
                flex: 1,
                padding: '12px 0',
                background: activeTab === 'hero' ? '#2D2D44' : 'transparent',
                color: activeTab === 'hero' ? '#FFD700' : 'white',
                border: 'none',
                borderBottom: activeTab === 'hero' ? '2px solid #FFD700' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 'bold',
              }}
            >
              英雄
            </button>
            <button
              onClick={() => setActiveTab('log')}
              style={{
                flex: 1,
                padding: '12px 0',
                background: activeTab === 'log' ? '#2D2D44' : 'transparent',
                color: activeTab === 'log' ? '#FFD700' : 'white',
                border: 'none',
                borderBottom: activeTab === 'log' ? '2px solid #FFD700' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 'bold',
              }}
            >
              日志
            </button>
          </div>
          <div
            style={{
              maxHeight: 280,
              overflowY: 'auto',
              padding: 12,
              boxSizing: 'border-box',
            }}
          >
            {activeTab === 'hero' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <HeroPanel heroId="player" />
                <HeroPanel heroId="ai" />
              </div>
            ) : (
              <div style={{ height: 260 }}>
                <BattleLog />
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .left-panel-desktop,
          .right-panel-desktop {
            display: none !important;
          }
          .mobile-tabs {
            display: block !important;
          }
          .main-container {
            padding-bottom: 340px !important;
          }
        }
      `}</style>

      <GameOverModal />
    </div>
  );
};

export default App;
