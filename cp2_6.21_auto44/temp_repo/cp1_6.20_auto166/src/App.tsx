import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { GameState, Card, AIAction } from './types';
import { apiService } from './services/apiService';
import GameBoard from './components/GameBoard';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedHandCard, setSelectedHandCard] = useState<Card | null>(null);
  const [selectedBoardMinion, setSelectedBoardMinion] = useState<Card | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAITurn, setIsAITurn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [attackingMinionId, setAttackingMinionId] = useState<string | null>(null);
  const [attackTargetId, setAttackTargetId] = useState<string | null>(null);
  const [particles, setParticles] = useState<
    { id: number; x: number; y: number; dx: number; dy: number }[]
  >([]);
  const particleIdRef = useRef(0);
  const aiActionRef = useRef(false);

  const startGame = useCallback(async () => {
    setIsLoading(true);
    try {
      const state = await apiService.startGame();
      setGameState(state);
      setShowStartScreen(false);
      setSelectedHandCard(null);
      setSelectedBoardMinion(null);
      setErrorMessage(null);
    } catch (e: any) {
      setErrorMessage(e.message || '连接服务器失败，请确认后端已启动');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const showError = (msg: string) => {
    setErrorMessage(msg);
  };

  const spawnParticles = (x: number, y: number) => {
    const newParticles = Array.from({ length: 12 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * 40;
      return {
        id: particleIdRef.current++,
        x,
        y,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
      };
    });
    setParticles((p) => [...p, ...newParticles]);
    setTimeout(() => {
      setParticles((p) => p.filter((pp) => !newParticles.find((np) => np.id === pp.id)));
    }, 600);
  };

  const handleSelectHandCard = (card: Card) => {
    if (!gameState || gameState.currentPlayer !== 'player') return;
    setSelectedBoardMinion(null);

    if ((card as any).__disabled) {
      showError('费用不足');
      return;
    }

    if (selectedHandCard?.instanceId === card.instanceId) {
      setSelectedHandCard(null);
    } else {
      setSelectedHandCard(card);
    }
  };

  const handlePlayCard = async (card: Card) => {
    if (!gameState || gameState.currentPlayer !== 'player') return;

    if (card.cost > gameState.player.mana) {
      showError('费用不足');
      return;
    }

    if (gameState.player.board.length >= 7 && card.type === 'minion') {
      showError('战场已满（最多7个随从）');
      return;
    }

    try {
      const state = await apiService.playCard(gameState.gameId, card.instanceId!);
      setGameState(state);
      setSelectedHandCard(null);
    } catch (e: any) {
      showError(e.message || '出牌失败');
    }
  };

  const handleSelectBoardMinion = (card: Card) => {
    if (!gameState || gameState.currentPlayer !== 'player') return;
    setSelectedHandCard(null);

    if (!card.canAttack || card.hasAttacked) {
      showError('该随从本回合无法攻击');
      return;
    }

    if (selectedBoardMinion?.instanceId === card.instanceId) {
      setSelectedBoardMinion(null);
    } else {
      setSelectedBoardMinion(card);
    }
  };

  const handleAttack = async (
    attacker: Card,
    targetId: string,
    targetType: 'minion' | 'hero'
  ) => {
    if (!gameState) return;

    setAttackingMinionId(attacker.instanceId!);
    setAttackTargetId(targetId);

    setTimeout(() => {
      spawnParticles(window.innerWidth / 2, window.innerHeight / 2);
    }, 150);

    setTimeout(async () => {
      try {
        const state = await apiService.attack(
          gameState.gameId,
          attacker.instanceId!,
          targetId,
          targetType
        );
        setGameState(state);
      } catch (e: any) {
        showError(e.message || '攻击失败');
      } finally {
        setTimeout(() => {
          setAttackingMinionId(null);
          setAttackTargetId(null);
        }, 300);
        setSelectedBoardMinion(null);
      }
    }, 300);
  };

  const runAITurn = useCallback(
    async (state: GameState) => {
      if (state.gameOver || state.currentPlayer !== 'ai') {
        setIsAITurn(false);
        aiActionRef.current = false;
        return;
      }

      if (aiActionRef.current) return;
      aiActionRef.current = true;
      setIsAITurn(true);

      const loop = async (curState: GameState) => {
        if (curState.gameOver || curState.currentPlayer !== 'ai') {
          setGameState(curState);
          setIsAITurn(false);
          aiActionRef.current = false;
          return;
        }

        try {
          const action: AIAction | null = await apiService.getAIAction(curState.gameId);

          if (!action || action.type === 'endTurn') {
            const newState = await apiService.endTurn(curState.gameId);
            setGameState(newState);
            setIsAITurn(false);
            aiActionRef.current = false;
            return;
          }

          if (action.type === 'playCard' || action.type === 'attack') {
            setAttackingMinionId(null);
            setAttackTargetId(null);

            if (action.type === 'attack') {
              setAttackingMinionId(action.cardInstanceId!);
              setAttackTargetId(action.targetId!);
              setTimeout(() => {
                spawnParticles(window.innerWidth / 2, window.innerHeight / 2);
              }, 150);
            }

            await new Promise((r) => setTimeout(r, 200));

            const newState = await apiService.executeAIAction(curState.gameId, action);
            setGameState(newState);

            setTimeout(() => {
              setAttackingMinionId(null);
              setAttackTargetId(null);
            }, 200);

            await new Promise((r) => setTimeout(r, 200));

            await loop(newState);
            return;
          }
        } catch (e) {
          console.error('AI action error:', e);
          setIsAITurn(false);
          aiActionRef.current = false;
          return;
        }
      };

      await loop(state);
    },
    []
  );

  const handleEndTurn = async () => {
    if (!gameState || gameState.currentPlayer !== 'player' || isAITurn) return;

    setSelectedHandCard(null);
    setSelectedBoardMinion(null);

    try {
      const state = await apiService.endTurn(gameState.gameId);
      setGameState(state);

      if (state.currentPlayer === 'ai' && !state.gameOver) {
        runAITurn(state);
      }
    } catch (e: any) {
      showError(e.message || '结束回合失败');
    }
  };

  useEffect(() => {
    if (gameState && gameState.currentPlayer === 'ai' && !gameState.gameOver && !isAITurn && !aiActionRef.current) {
      const t = setTimeout(() => runAITurn(gameState), 600);
      return () => clearTimeout(t);
    }
  }, [gameState, isAITurn, runAITurn]);

  if (showStartScreen) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at 50% 30%, #2a2a4a 0%, #1e1e2f 70%)',
          padding: 20,
        }}
      >
        <div
          style={{
            maxWidth: 600,
            width: '100%',
            padding: 48,
            borderRadius: 24,
            background: 'linear-gradient(135deg, rgba(60, 40, 80, 0.8), rgba(30, 20, 50, 0.9))',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            textAlign: 'center',
            animation: 'fadeInScale 600ms ease-out',
          }}
        >
          <div style={{ fontSize: 72, marginBottom: 16 }}>⚔️</div>
          <h1
            style={{
              fontSize: 42,
              fontWeight: 'bold',
              marginBottom: 8,
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            AI 卡牌对战
          </h1>
          <p style={{ fontSize: 16, color: '#aaa', marginBottom: 32, lineHeight: 1.8 }}>
            回合制卡牌对战游戏原型
            <br />
            使用预设卡组与AI对手对战
            <br />
            每步战斗数据均被记录用于平衡性分析
          </p>

          {errorMessage && (
            <div
              style={{
                background: 'rgba(220,38,38,0.3)',
                border: '1px solid rgba(220,38,38,0.5)',
                padding: 12,
                borderRadius: 10,
                color: '#fecaca',
                marginBottom: 20,
                fontSize: 13,
              }}
            >
              {errorMessage}
            </div>
          )}

          <button
            onClick={startGame}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '16px 32px',
              fontSize: 18,
              fontWeight: 'bold',
              borderRadius: 14,
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              background: isLoading
                ? 'linear-gradient(135deg, #555, #333)'
                : 'linear-gradient(135deg, #FFD700, #FF8C00)',
              color: '#1a1a1a',
              transition: 'all 200ms',
              boxShadow: isLoading
                ? 'none'
                : '0 8px 30px rgba(255, 215, 0, 0.4)',
              transform: isLoading ? 'none' : 'scale(1)',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) (e.target as HTMLButtonElement).style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.transform = 'scale(1)';
            }}
          >
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                正在连接服务器...
              </span>
            ) : (
              '🎮 开始游戏'
            )}
          </button>

          <div
            style={{
              marginTop: 32,
              padding: 20,
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 12,
              fontSize: 12,
              color: '#888',
              textAlign: 'left',
              lineHeight: 1.8,
            }}
          >
            <div style={{ fontWeight: 'bold', color: '#aaa', marginBottom: 8, fontSize: 13 }}>
              📖 游戏规则：
            </div>
            <div>• 每回合获得法力水晶，用于出牌</div>
            <div>• 随从需要召唤1回合后才能攻击（冲锋除外）</div>
            <div>• 嘲讽随从必须优先被攻击</div>
            <div>• 将对方英雄血量降至0即获胜</div>
          </div>
        </div>
      </div>
    );
  }

  if (!gameState) return null;

  if (gameState.gameOver) {
    const isWin = gameState.winner === 'player';
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isWin
            ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 140, 0, 0.1))'
            : 'linear-gradient(135deg, rgba(128, 128, 128, 0.15), rgba(60, 60, 60, 0.1))',
          padding: 20,
          animation: 'fadeInScale 800ms ease-out',
        }}
      >
        <div
          style={{
            maxWidth: 520,
            width: '100%',
            padding: 48,
            borderRadius: 24,
            background: isWin
              ? 'linear-gradient(135deg, #3a3520, #2a2515)'
              : 'linear-gradient(135deg, #2a2a2a, #1a1a1a)',
            border: `2px solid ${isWin ? 'rgba(255, 215, 0, 0.5)' : 'rgba(128, 128, 128, 0.3)'}`,
            boxShadow: isWin
              ? '0 20px 60px rgba(255, 215, 0, 0.2)'
              : '0 20px 60px rgba(0,0,0,0.6)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 80, marginBottom: 12 }}>
            {isWin ? '🏆' : '💀'}
          </div>
          <h2
            style={{
              fontSize: 38,
              fontWeight: 'bold',
              marginBottom: 8,
              color: isWin ? '#FFD700' : '#888',
              textShadow: isWin ? '0 0 30px rgba(255, 215, 0, 0.5)' : 'none',
            }}
          >
            {isWin ? '胜利！' : '失败'}
          </h2>
          <p style={{ fontSize: 15, color: '#888', marginBottom: 32 }}>
            {isWin ? '你击败了AI对手，恭喜！' : '很遗憾，你被AI击败了'}
          </p>

          <div
            style={{
              background: 'rgba(0,0,0,0.4)',
              borderRadius: 16,
              padding: 24,
              marginBottom: 28,
              textAlign: 'left',
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 'bold',
                color: '#FFD700',
                marginBottom: 16,
                textAlign: 'center',
              }}
            >
              📊 战斗统计
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}
            >
              <StatItem label="总回合数" value={String(gameState.stats.totalTurns)} />
              <StatItem
                label="总伤害量"
                value={String(gameState.stats.totalDamage)}
                color="#ff6b6b"
              />
              <StatItem
                label="玩家出牌"
                value={String(gameState.stats.playerCardsPlayed)}
                color="#6bb3ff"
              />
              <StatItem
                label="AI 出牌"
                value={String(gameState.stats.aiCardsPlayed)}
                color="#ff6b9d"
              />
            </div>

            {gameState.battleLogs.length > 0 && (
              <>
                <div
                  style={{
                    height: 1,
                    background: 'rgba(255,255,255,0.1)',
                    margin: '16px 0',
                  }}
                />
                <div style={{ fontSize: 12, color: '#777', marginBottom: 8 }}>
                  最近战斗记录 ({Math.min(gameState.battleLogs.length, 6)}条)：
                </div>
                <div
                  style={{
                    maxHeight: 120,
                    overflowY: 'auto',
                    fontSize: 11,
                    color: '#999',
                    lineHeight: 1.7,
                  }}
                >
                  {gameState.battleLogs.slice(-6).map((log, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '2px 0',
                        borderBottom: '1px dashed rgba(255,255,255,0.05)',
                      }}
                    >
                      <span
                        style={{
                          color: log.actor === 'player' ? '#6bb3ff' : '#ff6b9d',
                        }}
                      >
                        [{log.actor === 'player' ? '玩家' : 'AI'}]
                      </span>{' '}
                      {log.detail}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={startGame}
            style={{
              width: '100%',
              padding: '14px 28px',
              fontSize: 16,
              fontWeight: 'bold',
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              background: isWin
                ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                : 'linear-gradient(135deg, #555, #333)',
              color: isWin ? '#1a1a1a' : '#fff',
              transition: 'all 200ms',
            }}
          >
            🔄 再来一局
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <GameBoard
        gameState={gameState}
        selectedHandCard={selectedHandCard}
        selectedBoardMinion={selectedBoardMinion}
        onSelectHandCard={handleSelectHandCard}
        onPlayCard={handlePlayCard}
        onSelectBoardMinion={handleSelectBoardMinion}
        onAttack={handleAttack}
        onEndTurn={handleEndTurn}
        isAITurn={isAITurn}
        errorMessage={errorMessage}
        attackingMinionId={attackingMinionId}
        attackTargetId={attackTargetId}
      />

      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'fixed',
            left: p.x,
            top: p.y,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #FFD700, #FF6B35)',
            boxShadow: '0 0 10px #FFD700',
            pointerEvents: 'none',
            animation: 'particle 600ms ease-out forwards',
            zIndex: 9999,
            ['--dx' as any]: `${p.dx}px`,
            ['--dy' as any]: `${p.dy}px`,
          }}
        />
      ))}
    </div>
  );
};

const StatItem: React.FC<{ label: string; value: string; color?: string }> = ({
  label,
  value,
  color = '#fff',
}) => (
  <div
    style={{
      background: 'rgba(255,255,255,0.04)',
      padding: 12,
      borderRadius: 10,
    }}
  >
    <div style={{ fontSize: 11, color: '#777', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 'bold', color }}>{value}</div>
  </div>
);

export default App;
