import React, { useEffect, useRef, useMemo } from 'react';
import { useGameStore } from '../stores/gameStore';
import { HexRenderer } from '../renderer/hexRenderer';
import { RuneType, SpellType, HEX_RADIUS, HEX_SPACING, GRID_COLS, GRID_ROWS } from '../engine/gameEngine';

const RUNE_LABELS: Record<RuneType, string> = {
  [RuneType.Fire]: '火',
  [RuneType.Water]: '水',
  [RuneType.Wood]: '木',
};

const RUNE_COLORS: Record<RuneType, string> = {
  [RuneType.Fire]: '#FF8C00',
  [RuneType.Water]: '#4169E1',
  [RuneType.Wood]: '#32CD32',
};

const SPELL_LABELS: Record<SpellType, string> = {
  [SpellType.Fireball]: '火球术',
  [SpellType.Frost]: '冰霜术',
  [SpellType.Vine]: '缠绕术',
};

const SPELL_ICONS: Record<SpellType, string> = {
  [SpellType.Fireball]: '🔥',
  [SpellType.Frost]: '❄',
  [SpellType.Vine]: '🌿',
};

function HpBar({ current, max, animated }: { current: number; max: number; animated?: number }) {
  const displayHp = animated !== undefined ? animated : current;
  const pct = Math.max(0, (displayHp / max) * 100);
  const currentPct = Math.max(0, (current / max) * 100);

  return (
    <div style={{
      width: 200,
      height: 16,
      background: '#333',
      borderRadius: 8,
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        width: `${currentPct}%`,
        height: '100%',
        background: 'linear-gradient(90deg, #FF4500, #FFD700)',
        borderRadius: 8,
        transition: 'width 0.4s ease-out',
      }} />
    </div>
  );
}

function PlayerInfo({ player, isCurrentTurn }: { player: 'player' | 'ai'; isCurrentTurn: boolean }) {
  const state = useGameStore();
  const pState = state.players[player];
  const isPlayer = player === 'player';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '8px 16px',
      background: isCurrentTurn ? 'rgba(106, 90, 205, 0.2)' : 'transparent',
      borderRadius: 8,
      border: isCurrentTurn ? '1px solid rgba(106, 90, 205, 0.5)' : '1px solid transparent',
      transition: 'all 0.3s ease',
    }}>
      <div style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: isPlayer
          ? 'linear-gradient(135deg, #9370DB, #8A2BE2)'
          : 'linear-gradient(135deg, #DC143C, #8B0000)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        flexShrink: 0,
      }}>
        {isPlayer ? 'P' : 'AI'}
      </div>
      <div>
        <div style={{ color: '#E0E0E0', fontSize: 14, marginBottom: 4 }}>
          {isPlayer ? '玩家' : 'AI'}
          {pState.skipNextTurn && <span style={{ color: '#87CEEB', marginLeft: 6, fontSize: 12 }}>❄ 冰冻</span>}
          {pState.cannotPlace && <span style={{ color: '#32CD32', marginLeft: 6, fontSize: 12 }}>🌿 缠绕</span>}
        </div>
        <HpBar current={pState.hp} max={pState.maxHp} />
        <div style={{ color: '#AAA', fontSize: 11, marginTop: 2 }}>{pState.hp} / {pState.maxHp}</div>
      </div>
    </div>
  );
}

function HandRune({ rune, index, selected, onClick }: { rune: RuneType; index: number; selected: boolean; onClick: () => void }) {
  const [bouncing, setBouncing] = React.useState(false);

  const handleClick = () => {
    setBouncing(true);
    setTimeout(() => setBouncing(false), 200);
    onClick();
  };

  const scale = bouncing ? 1.15 : selected ? 1.1 : 1;

  return (
    <div
      onClick={handleClick}
      style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: '#2D2D44',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        border: selected ? '2px solid #FFD700' : '2px solid transparent',
        boxShadow: selected ? '0 0 10px rgba(255, 215, 0, 0.5)' : 'none',
        transform: `scale(${scale})`,
        transition: 'transform 0.2s ease, border 0.15s ease, box-shadow 0.15s ease',
        userSelect: 'none',
      }}
    >
      <span style={{ color: '#fff', fontSize: 24 }}>
        {RUNE_LABELS[rune]}
      </span>
      <div style={{
        position: 'absolute',
        bottom: -2,
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: RUNE_COLORS[rune],
      }} />
    </div>
  );
}

function SpellCooldownSlot({ type, cooldown }: { type: SpellType; cooldown: number }) {
  return (
    <div style={{
      width: 32,
      height: 32,
      borderRadius: '50%',
      background: '#2D2D44',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <span style={{ fontSize: 14, zIndex: 1 }}>{SPELL_ICONS[type]}</span>
      {cooldown > 0 && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderTopColor: 'rgba(255, 255, 255, 0.8)',
            animation: 'spin 2s linear infinite',
          }} />
        </div>
      )}
    </div>
  );
}

function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<HexRenderer | null>(null);

  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new HexRenderer(canvasRef.current);
      rendererRef.current.start();
    }
    return () => {
      if (rendererRef.current) {
        rendererRef.current.stop();
        rendererRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{
      width: '100%',
      maxWidth: 800,
      display: 'flex',
      justifyContent: 'center',
    }}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          borderRadius: 4,
        }}
      />
    </div>
  );
}

function VictoryOverlay() {
  const gameOver = useGameStore(s => s.gameOver);
  const winner = useGameStore(s => s.winner);
  const initGame = useGameStore(s => s.initGame);

  if (!gameOver) return null;

  const isWin = winner === 'player';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      animation: 'fadeIn 0.5s ease',
    }}>
      <div style={{
        color: '#FFD700',
        fontSize: 48,
        fontWeight: 'bold',
        marginBottom: 24,
        textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
      }}>
        {isWin ? '胜 利' : '失 败'}
      </div>
      <div style={{ color: '#E0E0E0', fontSize: 18, marginBottom: 32 }}>
        {isWin ? '你成功击败了AI对手！' : 'AI对手获得了胜利...'}
      </div>
      <button
        onClick={initGame}
        style={{
          padding: '12px 36px',
          fontSize: 18,
          background: 'linear-gradient(135deg, #6A5ACD, #8A2BE2)',
          color: '#FFD700',
          border: '2px solid #FFD700',
          borderRadius: 8,
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => {
          (e.target as HTMLElement).style.transform = 'scale(1.05)';
          (e.target as HTMLElement).style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.5)';
        }}
        onMouseLeave={e => {
          (e.target as HTMLElement).style.transform = 'scale(1)';
          (e.target as HTMLElement).style.boxShadow = 'none';
        }}
      >
        重新开始
      </button>
    </div>
  );
}

export default function GameUI() {
  const state = useGameStore();
  const initGame = useGameStore(s => s.initGame);
  const selectHandRune = useGameStore(s => s.selectHandRune);
  const selectedHandIndex = useGameStore(s => s.selectedHandIndex);
  const isPlayerTurn = useGameStore(s => s.isPlayerTurn);
  const currentTurn = useGameStore(s => s.currentTurn);
  const turnCount = useGameStore(s => s.turnCount);
  const gameOver = useGameStore(s => s.gameOver);

  const playerHand = state.players.player.hand;
  const aiCooldowns = useMemo(() => {
    const grid = state.grid;
    let fireCd = 0, waterCd = 0, woodCd = 0;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let q = 0; q < GRID_COLS; q++) {
        const cell = grid[r]?.[q];
        if (cell?.owner === 'ai' && cell.cooldown > 0) {
          if (cell.rune === RuneType.Fire) fireCd = cell.cooldown;
          if (cell.rune === RuneType.Water) waterCd = cell.cooldown;
          if (cell.rune === RuneType.Wood) woodCd = cell.cooldown;
        }
      }
    }
    return { fireCd, waterCd, woodCd };
  }, [state.grid]);

  useEffect(() => {
    initGame();
  }, []);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: '#0D0D1A',
      overflow: 'auto',
      padding: '8px 0',
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 600px) {
          .hand-rune { width: 36px !important; height: 36px !important; }
          .hand-rune span { font-size: 18px !important; }
          .panel-text { font-size: 14px !important; }
        }
      `}</style>

      <div style={{
        width: '100%',
        maxWidth: 800,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 16px',
        marginBottom: 4,
      }}>
        <PlayerInfo player="player" isCurrentTurn={currentTurn === 'player'} />
        <div style={{
          color: '#E0E0E0',
          fontSize: 18,
          fontWeight: 'bold',
          textAlign: 'center',
        }}>
          <div>第 {turnCount} 回合</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
            {isPlayerTurn ? '你的回合' : 'AI思考中...'}
          </div>
        </div>
        <PlayerInfo player="ai" isCurrentTurn={currentTurn === 'ai'} />
      </div>

      <GameCanvas />

      <div style={{
        width: '100%',
        maxWidth: 800,
        marginTop: 8,
        padding: 16,
        background: '#1A1A2E',
        borderRadius: 12,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className="panel-text" style={{ color: '#E0E0E0', fontSize: 14, marginRight: 8 }}>
            手牌:
          </span>
          {playerHand.map((rune, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <HandRune
                rune={rune}
                index={i}
                selected={selectedHandIndex === i}
                onClick={() => selectHandRune(i)}
              />
            </div>
          ))}
          {playerHand.length === 0 && (
            <span style={{ color: '#666', fontSize: 13 }}>无手牌</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="panel-text" style={{ color: '#E0E0E0', fontSize: 14, marginRight: 8 }}>
            法术:
          </span>
          <SpellCooldownSlot type={SpellType.Fireball} cooldown={0} />
          <SpellCooldownSlot type={SpellType.Frost} cooldown={0} />
          <SpellCooldownSlot type={SpellType.Vine} cooldown={0} />
        </div>
      </div>

      <VictoryOverlay />
    </div>
  );
}
