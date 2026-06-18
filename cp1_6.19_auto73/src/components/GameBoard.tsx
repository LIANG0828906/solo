import React from 'react';
import {
  CellType,
  Monster,
  Guard,
  Trap,
  CoinAnimation,
  ExplosionAnimation,
  Position,
  GRID_SIZE,
  CELL_SIZE,
} from '../game/types';
import { FiDollarSign, FiHeart } from 'react-icons/fi';

interface GameBoardProps {
  map: CellType[][];
  monsters: Monster[];
  guards: Guard[];
  traps: Trap[];
  coins: CoinAnimation[];
  explosions: ExplosionAnimation[];
  gold: number;
  lives: number;
  selectedItem: { type: 'trap' | 'guard'; subtype: string } | null;
  onCellClick: (pos: Position) => void;
  showWaveText: boolean;
  currentWave: number;
}

const GameBoard: React.FC<GameBoardProps> = ({
  map,
  monsters,
  guards,
  traps,
  coins,
  explosions,
  gold,
  lives,
  selectedItem,
  onCellClick,
  showWaveText,
  currentWave,
}) => {
  const getCellStyle = (cellType: CellType): React.CSSProperties => {
    const base: React.CSSProperties = {
      width: CELL_SIZE,
      height: CELL_SIZE,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      cursor: 'default',
      border: '1px solid #2C1810',
      backgroundImage:
        'repeating-linear-gradient(0deg, #3A2F2B 0px, #3A2F2B 15px, #2E2421 15px, #2E2421 16px), repeating-linear-gradient(90deg, transparent 0px, transparent 31px, #2E2421 31px, #2E2421 32px)',
      backgroundSize: '32px 16px',
    };

    switch (cellType) {
      case 'path':
      case 'entrance':
      case 'exit':
        return {
          ...base,
          backgroundColor: '#5D4E37',
          backgroundImage:
            'repeating-linear-gradient(45deg, #5D4E37 0px, #5D4E37 4px, #4A3F2D 4px, #4A3F2D 8px)',
        };
      case 'trap_area':
        return {
          ...base,
          backgroundColor: '#5A4A42',
          backgroundImage:
            'repeating-linear-gradient(0deg, #5A4A42 0px, #5A4A42 15px, #4A3A32 15px, #4A3A32 16px), repeating-linear-gradient(90deg, transparent 0px, transparent 31px, #4A3A32 31px, #4A3A32 32px)',
          cursor: selectedItem ? 'pointer' : 'default',
        };
      case 'wall':
      default:
        return base;
    }
  };

  const renderMonster = (monster: Monster) => {
    const x = monster.position.x * CELL_SIZE;
    const y = monster.position.y * CELL_SIZE;
    const hpPercent = (monster.currentHp / monster.maxHp) * 100;
    const isSlowed = monster.slowTimer > 0;

    return (
      <div
        key={monster.id}
        className={isSlowed ? 'animate-slow' : ''}
        style={{
          position: 'absolute',
          left: x + CELL_SIZE / 2 - 16,
          top: y + CELL_SIZE / 2 - 16,
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          transition: 'left 0.03s linear, top 0.03s linear',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -8,
            left: 0,
            width: 32,
            height: 4,
            backgroundColor: '#333',
            borderRadius: 2,
          }}
        >
          <div
            style={{
              width: `${hpPercent}%`,
              height: '100%',
              backgroundColor: hpPercent > 50 ? '#2ECC71' : hpPercent > 25 ? '#F39C12' : '#E74C3C',
              borderRadius: 2,
            }}
          />
        </div>
        {monster.type === 'skeleton' && <span>💀</span>}
        {monster.type === 'golem' && <span>🗿</span>}
        {monster.type === 'ghost' && <span style={{ opacity: 0.8 }}>👻</span>}
      </div>
    );
  };

  const renderGuard = (guard: Guard) => {
    const x = guard.position.x * CELL_SIZE;
    const y = guard.position.y * CELL_SIZE;

    return (
      <div
        key={guard.id}
        className="animate-scale-in"
        style={{
          position: 'absolute',
          left: x + 4,
          top: y + 4,
          width: CELL_SIZE - 8,
          height: CELL_SIZE - 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          zIndex: 5,
          pointerEvents: 'none',
        }}
      >
        {guard.type === 'swordsman' && (
          <div
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
            }}
          >
            ⚔️
          </div>
        )}
        {guard.type === 'archer' && (
          <div
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
            }}
          >
            🏹
          </div>
        )}
        {guard.type === 'mage' && (
          <div
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
            }}
          >
            🧙
          </div>
        )}
      </div>
    );
  };

  const renderTrap = (trap: Trap) => {
    const x = trap.position.x * CELL_SIZE;
    const y = trap.position.y * CELL_SIZE;

    return (
      <div
        key={trap.id}
        className="animate-scale-in"
        style={{
          position: 'absolute',
          left: x + 8,
          top: y + 8,
          width: CELL_SIZE - 16,
          height: CELL_SIZE - 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          zIndex: 4,
          pointerEvents: 'none',
          opacity: trap.triggered ? 0.5 : 1,
        }}
      >
        {trap.type === 'spike' && <span>🔺</span>}
        {trap.type === 'freeze' && <span>❄️</span>}
        {trap.type === 'bomb' && <span>💣</span>}
      </div>
    );
  };

  const renderCoin = (coin: CoinAnimation) => {
    const x = coin.position.x * CELL_SIZE + CELL_SIZE / 2 - 10;
    const y = coin.position.y * CELL_SIZE;

    return (
      <div
        key={coin.id}
        className="animate-coin-pop"
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: 20,
          height: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          zIndex: 20,
          pointerEvents: 'none',
          color: '#FFD700',
        }}
      >
        <FiDollarSign />
      </div>
    );
  };

  const renderExplosion = (explosion: ExplosionAnimation) => {
    const x = explosion.position.x * CELL_SIZE;
    const y = explosion.position.y * CELL_SIZE;

    return (
      <div
        key={explosion.id}
        className="animate-flame"
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: CELL_SIZE,
          height: CELL_SIZE,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
          zIndex: 15,
          pointerEvents: 'none',
          background: 'radial-gradient(circle, rgba(255,100,0,0.8) 0%, rgba(255,50,0,0.4) 50%, transparent 70%)',
          borderRadius: '50%',
        }}
      >
        🔥
      </div>
    );
  };

  const renderEntranceExit = (cellType: CellType, x: number, y: number) => {
    if (cellType === 'entrance') {
      return (
        <div
          style={{
            position: 'absolute',
            left: x * CELL_SIZE,
            top: y * CELL_SIZE,
            width: CELL_SIZE,
            height: CELL_SIZE,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            color: '#2ECC71',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          🚪
        </div>
      );
    }
    if (cellType === 'exit') {
      return (
        <div
          style={{
            position: 'absolute',
            left: x * CELL_SIZE,
            top: y * CELL_SIZE,
            width: CELL_SIZE,
            height: CELL_SIZE,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            color: '#E74C3C',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          🏁
        </div>
      );
    }
    return null;
  };

  return (
    <div
      style={{
        position: 'relative',
        backgroundColor: '#2C1810',
        padding: 8,
        borderRadius: 4,
        boxShadow: '0 0 20px rgba(0,0,0,0.5)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -48,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          backgroundColor: 'rgba(44, 62, 80, 0.85)',
          borderRadius: 4,
          fontSize: 12,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FFD700' }}>
          <FiDollarSign size={18} />
          <span>{gold}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#E74C3C' }}>
          <FiHeart size={18} />
          <span>{lives}</span>
        </div>
        <div style={{ color: '#95A5A6' }}>Wave: {currentWave}/10</div>
      </div>

      {showWaveText && (
        <div
          className="animate-wave-drop"
          style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 36,
            color: '#D35400',
            textShadow: '3px 3px 0 #2C1810, -1px -1px 0 #2C1810',
            zIndex: 50,
            pointerEvents: 'none',
          }}
        >
          Wave {currentWave}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          position: 'relative',
        }}
      >
        {map.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              style={getCellStyle(cell)}
              onClick={() => onCellClick({ x, y })}
            >
              {renderEntranceExit(cell, x, y)}
            </div>
          ))
        )}

        {traps.map(renderTrap)}
        {guards.map(renderGuard)}
        {monsters.map(renderMonster)}
        {explosions.map(renderExplosion)}
        {coins.map(renderCoin)}
      </div>
    </div>
  );
};

export default GameBoard;
