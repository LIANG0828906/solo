import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GameState, Unit, Card, ElementType } from '../game/types';
import './BoardComponent.css';

interface BoardComponentProps {
  gameState: GameState;
  onCardPlay: (card: Card, position: { x: number; y: number }) => void;
  onUnitClick: (unit: Unit) => void;
  selectedUnit: Unit | null;
  selectedHandCard: Card | null;
  onHandCardSelect: (card: Card | null) => void;
  animating: boolean;
}

const elementColors: Record<ElementType, string> = {
  fire: '#ff5722',
  water: '#2196f3',
  earth: '#8d6e63',
  wind: '#81c784',
  neutral: '#9e9e9e'
};

const elementIcons: Record<ElementType, string> = {
  fire: '🔥',
  water: '💧',
  earth: '🪨',
  wind: '🌪️',
  neutral: '⚪'
};

const UnitCard: React.FC<{
  unit: Unit;
  onClick: () => void;
  isSelected: boolean;
  delay: number;
}> = ({ unit, onClick, isSelected, delay }) => {
  const isEnemy = unit.owner === 'enemy';
  const healthPercent = (unit.health / unit.maxHealth) * 100;

  return (
    <div
      className={`unit-card ${isEnemy ? 'enemy' : 'player'} ${isSelected ? 'selected' : ''} ${unit.canAttack ? 'can-attack' : ''}`}
      style={{
        animationDelay: `${delay}s`,
        borderColor: elementColors[unit.element]
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {unit.hasTaunt && <div className="taunt-badge">🛡️</div>}
      <div className="unit-element" style={{ background: elementColors[unit.element] }}>
        {elementIcons[unit.element]}
      </div>
      <div className="unit-name">{unit.name}</div>
      <div className="unit-stats">
        <span className="attack">⚔️ {unit.attack}</span>
        <span className="health" style={{ color: healthPercent > 50 ? '#00e676' : '#ff5722' }}>
          ❤️ {unit.health}
        </span>
      </div>
      <div className="health-bar">
        <div
          className="health-fill"
          style={{
            width: `${healthPercent}%`,
            background: healthPercent > 50 ? '#00e676' : '#ff5722'
          }}
        />
      </div>
    </div>
  );
};

const HandCard: React.FC<{
  card: Card;
  isSelected: boolean;
  canPlay: boolean;
  onClick: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}> = ({ card, isSelected, canPlay, onClick, onDragStart, onDragEnd }) => {
  const isMinion = card.type === 'minion';
  const isSpell = card.type === 'spell';

  return (
    <div
      className={`hand-card ${isSelected ? 'selected' : ''} ${canPlay ? 'playable' : 'unplayable'} ${isMinion ? 'minion-card' : 'spell-card'}`}
      style={{ borderColor: card.element ? elementColors[card.element as ElementType] : '#666' }}
      onClick={onClick}
      draggable={canPlay}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      onDragEnd={onDragEnd}
    >
      <div className="card-cost">{card.cost}</div>
      <div className="card-element" style={{ background: card.element ? elementColors[card.element as ElementType] : '#666' }}>
        {card.element ? elementIcons[card.element as ElementType] : ''}
      </div>
      <div className="card-name">{card.name}</div>
      {isMinion && (
        <div className="card-stats">
          <span className="atk">{card.attack}</span>
          <span className="hp">{card.health}</span>
        </div>
      )}
      {isSpell && <div className="spell-icon">✨</div>}
      <div className="card-description">{card.description}</div>
    </div>
  );
};

const BoardComponent: React.FC<BoardComponentProps> = ({
  gameState,
  onCardPlay,
  onUnitClick,
  selectedUnit,
  selectedHandCard,
  onHandCardSelect,
  animating
}) => {
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const [unitDelays, setUnitDelays] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (animating) {
      const delays = new Map<string, number>();
      let index = 0;
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const unit = gameState.board[y][x];
          if (unit) {
            delays.set(unit.id, index * 0.05);
            index++;
          }
        }
      }
      setUnitDelays(delays);
    }
  }, [animating, gameState.board]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((x: number, y: number, e: React.DragEvent) => {
    e.preventDefault();
    if (selectedHandCard && selectedHandCard.type === 'minion' && y >= 4) {
      if (!gameState.board[y][x]) {
        onCardPlay(selectedHandCard, { x, y });
      }
    }
    setIsDragging(false);
    setHoveredCell(null);
  }, [selectedHandCard, gameState.board, onCardPlay]);

  const handleCellClick = useCallback((x: number, y: number) => {
    const unit = gameState.board[y][x];
    if (unit && unit.owner === 'player') {
      onUnitClick(unit);
    }
  }, [gameState.board, onUnitClick]);

  const canPlaceCard = (x: number, y: number): boolean => {
    if (!selectedHandCard || selectedHandCard.type !== 'minion') return false;
    if (y < 4) return false;
    if (gameState.board[y][x]) return false;
    if (gameState.player.mana < selectedHandCard.cost) return false;
    return true;
  };

  return (
    <div className="board-container">
      <div className="enemy-info glass-effect">
        <div className="player-avatar enemy-avatar">👹</div>
        <div className="player-stats">
          <span className="health-text">❤️ {gameState.enemy.health}/{gameState.enemy.maxHealth}</span>
          <span className="mana-text">💎 {gameState.enemy.mana}/{gameState.enemy.maxMana}</span>
        </div>
        <div className="enemy-hand-count">
          手牌: {gameState.enemy.hand.length}
        </div>
      </div>

      <div
        className={`game-board ${animating ? 'animating' : ''}`}
        ref={boardRef}
        onDragOver={handleDragOver}
      >
        {gameState.board.map((row, y) =>
          row.map((unit, x) => {
            const canPlace = canPlaceCard(x, y);
            const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;
            const isSelected = selectedUnit && unit?.id === selectedUnit.id;

            return (
              <div
                key={`${x}-${y}`}
                className={`board-cell ${y < 4 ? 'enemy-zone' : 'player-zone'} ${canPlace && isDragging ? 'drop-target' : ''} ${isHovered && canPlace ? 'hovered' : ''}`}
                onDragEnter={() => setHoveredCell({ x, y })}
                onDragLeave={() => setHoveredCell(null)}
                onDrop={(e) => handleDrop(x, y, e)}
                onClick={() => handleCellClick(x, y)}
              >
                {unit && (
                  <UnitCard
                    unit={unit}
                    onClick={() => onUnitClick(unit)}
                    isSelected={!!isSelected}
                    delay={unitDelays.get(unit.id) || 0}
                  />
                )}
                {canPlace && isHovered && selectedHandCard && (
                  <div className="placement-preview">
                    <div className="preview-card">
                      <span>{selectedHandCard.name}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="player-info glass-effect">
        <div className="player-avatar player-avatar-main">🧙</div>
        <div className="player-stats">
          <span className="health-text">❤️ {gameState.player.health}/{gameState.player.maxHealth}</span>
          <span className="mana-text">💎 {gameState.player.mana}/{gameState.player.maxMana}</span>
        </div>
        {gameState.player.heroPower && (
          <div className="hero-power">
            <span className="hp-cost">{gameState.player.heroPower.cost}</span>
            <span className="hp-icon">⚡</span>
            <span className="hp-name">{gameState.player.heroPower.name}</span>
          </div>
        )}
      </div>

      <div className="hand-container">
        <div className="hand-label">手牌</div>
        <div className="hand-cards">
          {gameState.player.hand.map((card) => (
            <HandCard
              key={card.id}
              card={card}
              isSelected={selectedHandCard?.id === card.id}
              canPlay={card.cost <= gameState.player.mana && gameState.currentPlayer === 'player'}
              onClick={() => onHandCardSelect(selectedHandCard?.id === card.id ? null : card)}
              onDragStart={() => {
                setIsDragging(true);
                onHandCardSelect(card);
              }}
              onDragEnd={() => {
                setIsDragging(false);
                setHoveredCell(null);
              }}
            />
          ))}
          {gameState.player.hand.length === 0 && (
            <div className="empty-hand">没有手牌</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BoardComponent;
