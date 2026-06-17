import { useState, useEffect, useMemo } from 'react';
import {
  COUNTDOWN_SECONDS,
  ELEMENT_CONFIGS,
  PLAYER_COLORS,
  type ElementType,
  type GameStatistics,
  type Player,
  type PlayerId,
} from './entities';
import { useGameState } from './GameState';
import { EventBus, type EventName } from './EventBus';

const AVATARS = ['🧙‍♂️', '🧙‍♀️', '🦸‍♂️', '🦸‍♀️', '🥷', '👨‍🎤', '👩‍🎤', '🤖', '👾', '🐉'];

function BoardThumbnail({ p1Element, p2Element }: { p1Element: ElementType; p2Element: ElementType }) {
  const size = 200;
  const cellSize = size / 8;
  const p1Conf = ELEMENT_CONFIGS[p1Element];
  const p2Conf = ELEMENT_CONFIGS[p2Element];

  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        borderRadius: 12,
        background: 'linear-gradient(135deg, #3E2723 0%, #4E342E 50%, #3E2723 100%)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 0 40px rgba(0,0,0,0.3)',
        border: '3px solid #5D4037',
        overflow: 'hidden',
      }}
    >
      <svg style={{ position: 'absolute', inset: 0, width: size, height: size }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <line
            key={`v-${i}`}
            x1={i * cellSize}
            y1={0}
            x2={i * cellSize}
            y2={size}
            stroke="#5D4037"
            strokeWidth={1}
          />
        ))}
        {Array.from({ length: 9 }).map((_, i) => (
          <line
            key={`h-${i}`}
            x1={0}
            y1={i * cellSize}
            x2={size}
            y2={i * cellSize}
            stroke="#5D4037"
            strokeWidth={1}
          />
        ))}
      </svg>

      {[1, 3, 5, 7].map((x, i) => (
        <div
          key={`p1-${i}`}
          style={{
            position: 'absolute',
            left: x * cellSize + cellSize / 2 - 8,
            top: 6 * cellSize + cellSize / 2 - 8,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, ${p1Conf.colorStart}, ${p1Conf.colorEnd})`,
            boxShadow: `0 2px 4px rgba(0,0,0,0.5)`,
          }}
        />
      ))}
      {[0, 2, 4, 6].map((x, i) => (
        <div
          key={`p1b-${i}`}
          style={{
            position: 'absolute',
            left: x * cellSize + cellSize / 2 - 8,
            top: 7 * cellSize + cellSize / 2 - 8,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, ${p1Conf.colorStart}, ${p1Conf.colorEnd})`,
            boxShadow: `0 2px 4px rgba(0,0,0,0.5)`,
          }}
        />
      ))}

      {[1, 3, 5, 7].map((x, i) => (
        <div
          key={`p2-${i}`}
          style={{
            position: 'absolute',
            left: x * cellSize + cellSize / 2 - 8,
            top: 1 * cellSize + cellSize / 2 - 8,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, ${p2Conf.colorStart}, ${p2Conf.colorEnd})`,
            boxShadow: `0 2px 4px rgba(0,0,0,0.5)`,
          }}
        />
      ))}
      {[0, 2, 4, 6].map((x, i) => (
        <div
          key={`p2b-${i}`}
          style={{
            position: 'absolute',
            left: x * cellSize + cellSize / 2 - 8,
            top: 0 * cellSize + cellSize / 2 - 8,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, ${p2Conf.colorStart}, ${p2Conf.colorEnd})`,
            boxShadow: `0 2px 4px rgba(0,0,0,0.5)`,
          }}
        />
      ))}
    </div>
  );
}

function SetupPage() {
  const { initGame } = useGameState();
  const [p1Name, setP1Name] = useState('玩家一');
  const [p2Name, setP2Name] = useState('AI对手');
  const [p1Element, setP1Element] = useState<ElementType>('fire');
  const [p2Element, setP2Element] = useState<ElementType>('ice');
  const [p1Avatar, setP1Avatar] = useState(AVATARS[0]);
  const [p2Avatar, setP2Avatar] = useState(AVATARS[8]);
  const [useAI, setUseAI] = useState(true);

  const elementOptions: ElementType[] = ['fire', 'ice', 'wind', 'earth'];

  const handleStart = () => {
    const player1: Player = {
      id: 1,
      name: p1Name.trim() || '玩家一',
      element: p1Element,
      avatar: p1Avatar,
    };
    const player2: Player = {
      id: 2,
      name: useAI ? 'AI对手' : p2Name.trim() || '玩家二',
      element: p2Element,
      avatar: p2Avatar,
    };
    initGame(player1, player2, useAI);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        overflow: 'auto',
      }}
    >
      <div
        style={{
          fontSize: 56,
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #E94560, #533483, #0F3460)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 8,
          textShadow: '0 8px 32px rgba(233, 69, 96, 0.3)',
          letterSpacing: 4,
        }}
      >
        ✨ 魔法棋局 ✨
      </div>
      <div style={{ color: '#A0A0C0', marginBottom: 40, fontSize: 16, letterSpacing: 2 }}>
        回合制策略对战 · 四元素魔法之战
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 60,
          marginBottom: 40,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 280,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            padding: 24,
            background: 'rgba(15, 52, 96, 0.4)',
            borderRadius: 16,
            border: `2px solid ${PLAYER_COLORS[1]}66`,
            boxShadow: `0 4px 24px ${PLAYER_COLORS[1]}22`,
          }}
        >
          <div
            style={{
              color: PLAYER_COLORS[1],
              fontWeight: 'bold',
              fontSize: 18,
              marginBottom: -4,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            🔵 玩家一
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                fontSize: 40,
                width: 56,
                height: 56,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: 'rgba(65, 105, 225, 0.2)',
                border: '2px solid rgba(65, 105, 225, 0.4)',
                cursor: 'pointer',
                userSelect: 'none',
              }}
              onClick={() => setP1Avatar(AVATARS[(AVATARS.indexOf(p1Avatar) + 1) % AVATARS.length])}
            >
              {p1Avatar}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#8888AA', fontSize: 12, marginBottom: 4 }}>点击头像切换</div>
              <input
                type="text"
                value={p1Name}
                onChange={(e) => setP1Name(e.target.value)}
                maxLength={12}
                style={{
                  width: '100%',
                  height: 36,
                  background: '#0F3460',
                  border: '1px solid #1F4470',
                  borderRadius: 8,
                  color: 'white',
                  padding: '0 12px',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div>
            <div style={{ color: '#8888AA', fontSize: 12, marginBottom: 6 }}>选择元素属性</div>
            <select
              value={p1Element}
              onChange={(e) => setP1Element(e.target.value as ElementType)}
              style={{
                width: '100%',
                height: 40,
                background: '#0F3460',
                border: '1px solid #1F4470',
                borderRadius: 8,
                color: 'white',
                padding: '0 12px',
                fontSize: 16,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {elementOptions.map((el) => {
                const c = ELEMENT_CONFIGS[el];
                return (
                  <option key={el} value={el}>
                    {el === 'fire' ? '🔥' : el === 'ice' ? '❄️' : el === 'wind' ? '🌀' : '🪨'} {c.name}系 (HP:{c.hp} ATK:{c.attack} RNG:{c.range})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <BoardThumbnail p1Element={p1Element} p2Element={p2Element} />
          <div style={{ color: '#7070A0', fontSize: 12 }}>棋盘预览 200×200</div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: '#A0A0C0',
              cursor: 'pointer',
              fontSize: 14,
              padding: '8px 16px',
              background: 'rgba(15, 52, 96, 0.5)',
              borderRadius: 20,
              border: '1px solid rgba(100, 100, 200, 0.3)',
            }}
          >
            <input
              type="checkbox"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#E94560' }}
            />
            启用AI对手
          </label>
        </div>

        <div
          style={{
            width: 280,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            padding: 24,
            background: 'rgba(96, 15, 52, 0.4)',
            borderRadius: 16,
            border: `2px solid ${PLAYER_COLORS[2]}66`,
            boxShadow: `0 4px 24px ${PLAYER_COLORS[2]}22`,
            opacity: useAI ? 0.75 : 1,
          }}
        >
          <div
            style={{
              color: PLAYER_COLORS[2],
              fontWeight: 'bold',
              fontSize: 18,
              marginBottom: -4,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            🔴 玩家二 {useAI && <span style={{ fontSize: 12, opacity: 0.7 }}>(AI)</span>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                fontSize: 40,
                width: 56,
                height: 56,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: 'rgba(220, 20, 60, 0.2)',
                border: '2px solid rgba(220, 20, 60, 0.4)',
                cursor: useAI ? 'not-allowed' : 'pointer',
                userSelect: 'none',
              }}
              onClick={() => !useAI && setP2Avatar(AVATARS[(AVATARS.indexOf(p2Avatar) + 1) % AVATARS.length])}
            >
              {p2Avatar}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#8888AA', fontSize: 12, marginBottom: 4 }}>
                {useAI ? 'AI自动选择' : '点击头像切换'}
              </div>
              <input
                type="text"
                value={p2Name}
                onChange={(e) => setP2Name(e.target.value)}
                maxLength={12}
                disabled={useAI}
                style={{
                  width: '100%',
                  height: 36,
                  background: useAI ? '#1a1a2e' : '#0F3460',
                  border: '1px solid #1F4470',
                  borderRadius: 8,
                  color: 'white',
                  padding: '0 12px',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  opacity: useAI ? 0.5 : 1,
                  cursor: useAI ? 'not-allowed' : 'text',
                }}
              />
            </div>
          </div>

          <div>
            <div style={{ color: '#8888AA', fontSize: 12, marginBottom: 6 }}>选择元素属性</div>
            <select
              value={p2Element}
              onChange={(e) => setP2Element(e.target.value as ElementType)}
              disabled={useAI}
              style={{
                width: '100%',
                height: 40,
                background: useAI ? '#1a1a2e' : '#0F3460',
                border: '1px solid #1F4470',
                borderRadius: 8,
                color: 'white',
                padding: '0 12px',
                fontSize: 16,
                outline: 'none',
                cursor: useAI ? 'not-allowed' : 'pointer',
                opacity: useAI ? 0.5 : 1,
              }}
            >
              {elementOptions.map((el) => {
                const c = ELEMENT_CONFIGS[el];
                return (
                  <option key={el} value={el}>
                    {el === 'fire' ? '🔥' : el === 'ice' ? '❄️' : el === 'wind' ? '🌀' : '🪨'} {c.name}系 (HP:{c.hp} ATK:{c.attack} RNG:{c.range})
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={handleStart}
        style={{
          width: 220,
          height: 56,
          borderRadius: 28,
          background: 'linear-gradient(135deg, #E94560 0%, #533483 100%)',
          color: 'white',
          fontSize: 22,
          fontWeight: 'bold',
          border: 'none',
          cursor: 'pointer',
          letterSpacing: 4,
          boxShadow: '0 8px 32px rgba(233, 69, 96, 0.4)',
          transition: 'all 200ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.filter = 'brightness(1.2)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(233, 69, 96, 0.55)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = 'brightness(1)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(233, 69, 96, 0.4)';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.95)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1) translateY(-2px)';
        }}
      >
        ⚔️ 开始对战
      </button>

      <div
        style={{
          marginTop: 36,
          color: '#606090',
          fontSize: 12,
          textAlign: 'center',
          maxWidth: 520,
          lineHeight: 1.8,
        }}
      >
        💡 操作提示：选中己方棋子查看攻击范围，点击范围内红框高亮的敌方棋子发起攻击。
        <br />
        🔥火系高攻 · ❄️冰系均衡 · 🌀风系远程 · 🪨地系重装
      </div>
    </div>
  );
}

function PlayerInfoCard({
  playerId,
  player,
  isActive,
  countdown,
  pieceCount,
}: {
  playerId: PlayerId;
  player: Player;
  isActive: boolean;
  countdown: number;
  pieceCount: number;
}) {
  const color = PLAYER_COLORS[playerId];
  const countdownPercent = (countdown / COUNTDOWN_SECONDS) * 100;

  return (
    <div
      style={{
        width: 220,
        background: 'rgba(26, 26, 26, 0.92)',
        borderRadius: 12,
        padding: 16,
        color: 'white',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        border: isActive ? `2px solid ${color}` : '2px solid rgba(255,255,255,0.1)',
        boxShadow: isActive
          ? `0 0 24px ${color}66, 0 8px 24px rgba(0,0,0,0.5)`
          : '0 8px 24px rgba(0,0,0,0.4)',
        transition: 'all 300ms ease',
        backdropFilter: 'blur(10px)',
      }}
    >
      {isActive && (
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              width: '100%',
              height: 6,
              borderRadius: 3,
              background: 'rgba(255,255,255,0.1)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${countdownPercent}%`,
                height: '100%',
                background:
                  countdownPercent > 60
                    ? 'linear-gradient(90deg, #4CAF50, #8BC34A)'
                    : countdownPercent > 30
                      ? 'linear-gradient(90deg, #FFC107, #FF9800)'
                      : 'linear-gradient(90deg, #F44336, #E91E63)',
                transition: 'width 1s linear, background 0.5s ease',
              }}
            />
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 11,
              color: countdownPercent > 30 ? '#A0A0A0' : '#FF5252',
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 'bold',
            }}
          >
            <span>⏱️ 回合倒计时</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{countdown}s</span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
            background: `radial-gradient(circle at 30% 30%, ${color}66, ${color}22)`,
            border: `2px solid ${color}88`,
            boxShadow: isActive ? `0 0 12px ${color}88` : 'none',
          }}
        >
          {player.avatar}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: isActive ? color : 'white',
            }}
          >
            {player.name}
          </div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
            {player.element === 'fire' ? '🔥' : player.element === 'ice' ? '❄️' : player.element === 'wind' ? '🌀' : '🪨'}
            {' '}{ELEMENT_CONFIGS[player.element].name}系法师
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span style={{ color: '#888', fontSize: 12 }}>存活棋子</span>
        <span
          style={{
            fontSize: 22,
            fontWeight: 'bold',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #B0B0B0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontVariantNumeric: 'tabular-nums',
            textShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          {pieceCount}
        </span>
      </div>
    </div>
  );
}

export function InfoPanels() {
  const {
    players,
    currentPlayer,
    countdown,
    getPiecesByPlayer,
    undo,
    history,
    endTurn,
    gamePhase,
  } = useGameState();

  const p1 = players[1]!;
  const p2 = players[2]!;
  const p1Pieces = getPiecesByPlayer(1);
  const p2Pieces = getPiecesByPlayer(2);

  return (
    <div
      style={{
        position: 'fixed',
        top: 24,
        right: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        zIndex: 50,
      }}
    >
      <PlayerInfoCard
        playerId={1}
        player={p1}
        isActive={currentPlayer === 1 && gamePhase === 'playing'}
        countdown={currentPlayer === 1 ? countdown : COUNTDOWN_SECONDS}
        pieceCount={p1Pieces.length}
      />
      <PlayerInfoCard
        playerId={2}
        player={p2}
        isActive={currentPlayer === 2 && gamePhase === 'playing'}
        countdown={currentPlayer === 2 ? countdown : COUNTDOWN_SECONDS}
        pieceCount={p2Pieces.length}
      />

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => undo(1)}
          disabled={history.length === 0}
          style={{
            flex: 1,
            height: 40,
            borderRadius: 20,
            background: history.length > 0
              ? 'linear-gradient(135deg, #455A64, #37474F)'
              : 'rgba(255,255,255,0.05)',
            color: history.length > 0 ? 'white' : '#555',
            border: 'none',
            cursor: history.length > 0 ? 'pointer' : 'not-allowed',
            fontWeight: 600,
            fontSize: 13,
            letterSpacing: 1,
            transition: 'all 200ms ease',
            boxShadow: history.length > 0 ? '0 4px 16px rgba(0,0,0,0.3)' : 'none',
          }}
          onMouseEnter={(e) => {
            if (history.length > 0) {
              e.currentTarget.style.filter = 'brightness(1.15)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = 'brightness(1)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          ↩️ 撤销 ({history.length})
        </button>
        <button
          onClick={() => endTurn()}
          disabled={gamePhase !== 'playing'}
          style={{
            flex: 1,
            height: 40,
            borderRadius: 20,
            background: gamePhase === 'playing'
              ? 'linear-gradient(135deg, #FF9800, #F57C00)'
              : 'rgba(255,255,255,0.05)',
            color: gamePhase === 'playing' ? 'white' : '#555',
            border: 'none',
            cursor: gamePhase === 'playing' ? 'pointer' : 'not-allowed',
            fontWeight: 600,
            fontSize: 13,
            letterSpacing: 1,
            transition: 'all 200ms ease',
            boxShadow: gamePhase === 'playing' ? '0 4px 16px rgba(255,152,0,0.35)' : 'none',
          }}
          onMouseEnter={(e) => {
            if (gamePhase === 'playing') {
              e.currentTarget.style.filter = 'brightness(1.15)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = 'brightness(1)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          ⏭️ 跳过
        </button>
      </div>
    </div>
  );
}

function ResultPanel({
  winner,
  winnerPlayer,
  statistics,
  onRestart,
  onShare,
}: {
  winner: PlayerId;
  winnerPlayer: Player;
  statistics: GameStatistics;
  onRestart: () => void;
  onShare: () => void;
}) {
  const color = PLAYER_COLORS[winner];
  const [shared, setShared] = useState(false);

  const totalKills = useMemo(
    () => Object.values(statistics.pieceKills).reduce((s, v) => s + v, 0),
    [statistics.pieceKills]
  );

  const handleShare = () => {
    onShare();
    setShared(true);
    setTimeout(() => setShared(false), 2500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.78)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        backdropFilter: 'blur(8px)',
        animation: 'fade-in 0.4s ease',
      }}
    >
      <div
        style={{
          width: 440,
          minHeight: 460,
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F8F8F8 100%)',
          borderRadius: 24,
          padding: 32,
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(233, 69, 96, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          animation: 'slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          border: `2px solid ${color}44`,
        }}
      >
        <div
          style={{
            fontSize: 52,
            width: 100,
            height: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, ${color}33, ${color}11)`,
            border: `4px solid ${color}66`,
            boxShadow: `0 8px 32px ${color}44`,
            marginBottom: 16,
            animation: 'bounce-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {winnerPlayer.avatar}
        </div>

        <div
          style={{
            fontSize: 28,
            fontWeight: 'bold',
            background: `linear-gradient(135deg, ${color}, #533483)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 6,
          }}
        >
          🎉 {winnerPlayer.name} 获胜！
        </div>
        <div style={{ color: '#888', marginBottom: 24, fontSize: 14 }}>
          {winner === 1 ? '🔵 蓝方' : '🔴 红方'} 征服了魔法棋盘
        </div>

        <div
          style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, #F5F7FF, #EBF0FF)',
              borderRadius: 14,
              padding: '16px 12px',
              textAlign: 'center',
              border: '1px solid #E0E7FF',
            }}
          >
            <div style={{ color: '#666', fontSize: 11, marginBottom: 4, letterSpacing: 1 }}>总回合</div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 'bold',
                color: '#6366F1',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {statistics.totalTurns}
            </div>
          </div>
          <div
            style={{
              background: 'linear-gradient(180deg, #FFF5F5, #FFEBEB)',
              borderRadius: 14,
              padding: '16px 12px',
              textAlign: 'center',
              border: '1px solid #FFE0E0',
            }}
          >
            <div style={{ color: '#666', fontSize: 11, marginBottom: 4, letterSpacing: 1 }}>击杀数</div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 'bold',
                color: '#EF4444',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {totalKills}
            </div>
          </div>
          <div
            style={{
              background: 'linear-gradient(180deg, #FFFBF0, #FFF4E0)',
              borderRadius: 14,
              padding: '16px 12px',
              textAlign: 'center',
              border: '1px solid #FFE8C8',
            }}
          >
            <div style={{ color: '#666', fontSize: 11, marginBottom: 4, letterSpacing: 1 }}>总伤害</div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 'bold',
                color: '#F59E0B',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {statistics.totalDamage}
            </div>
          </div>
        </div>

        <div
          style={{
            width: '100%',
            padding: '14px 16px',
            background: 'rgba(0,0,0,0.03)',
            borderRadius: 12,
            marginBottom: 28,
            fontSize: 13,
            color: '#666',
            textAlign: 'center',
            lineHeight: 1.7,
          }}
        >
          {winner === 1
            ? `🔥 精彩对决！蓝方以 ${ELEMENT_CONFIGS[winnerPlayer.element].name}系魔法 `
            : `⚔️ 恭喜红方以 ${ELEMENT_CONFIGS[winnerPlayer.element].name}系力量 `}
          取得了最终胜利！
        </div>

        <div style={{ display: 'flex', gap: 14, width: '100%' }}>
          <button
            onClick={onRestart}
            style={{
              flex: 1,
              height: 52,
              borderRadius: 26,
              background: 'linear-gradient(135deg, #E94560 0%, #533483 100%)',
              color: 'white',
              border: 'none',
              fontSize: 17,
              fontWeight: 'bold',
              cursor: 'pointer',
              letterSpacing: 2,
              transition: 'all 200ms ease',
              boxShadow: '0 8px 28px rgba(233, 69, 96, 0.45)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'brightness(1.2)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 36px rgba(233, 69, 96, 0.55)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'brightness(1)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 28px rgba(233, 69, 96, 0.45)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1)';
            }}
          >
            🔄 再来一局
          </button>
          <button
            onClick={handleShare}
            style={{
              width: 140,
              height: 52,
              borderRadius: 26,
              background: shared
                ? 'linear-gradient(135deg, #10B981, #059669)'
                : 'linear-gradient(135deg, #3B82F6, #2563EB)',
              color: 'white',
              border: 'none',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 200ms ease',
              boxShadow: shared
                ? '0 8px 28px rgba(16, 185, 129, 0.45)'
                : '0 8px 28px rgba(59, 130, 246, 0.45)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'brightness(1.2)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'brightness(1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1)';
            }}
          >
            {shared ? '✓ 已复制' : '📤 分享'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(40px) scale(0.96); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes bounce-in {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.12); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export function GameResultOverlay() {
  const { winner, players, statistics, resetGame, gamePhase } = useGameState();
  const showResult = gamePhase === 'ended' && winner !== null && players[winner];

  useEffect(() => {
    const off = EventBus.on('SHARE_RESULT' as EventName, () => {
      const state = useGameState.getState();
      const recordData = {
        winner: state.winner,
        stats: state.statistics,
        p1: state.players[1]?.name,
        p2: state.players[2]?.name,
        ts: Date.now(),
      };
      try {
        const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(recordData))));
        const shareText = `[魔法棋局] 胜者: ${state.players[state.winner!]?.name} | 回合: ${state.statistics.totalTurns} | 伤害: ${state.statistics.totalDamage} | 记录: ${b64.slice(0, 32)}...`;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(shareText).catch(() => {});
        }
      } catch {
        /* ignore */
      }
    });
    return off;
  }, []);

  if (!showResult) return null;

  return (
    <ResultPanel
      winner={winner!}
      winnerPlayer={players[winner]!}
      statistics={statistics}
      onRestart={() => resetGame()}
      onShare={() => EventBus.emit('SHARE_RESULT' as EventName, { record: '' } as never)}
    />
  );
}

export function SetupView() {
  return <SetupPage />;
}
