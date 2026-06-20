import { useMemo } from 'react';
import { useGameStore } from './store';
import { Card, MinionCard, SpellCard, WeaponCard } from './card';
import { BoardMinion, BOARD_ROWS, BOARD_COLS } from './player';
import { Target, needsTarget } from './gameEngine';

const CARD_ICONS: Record<string, string> = {
  minion_1: '👤',
  minion_2: '🗿',
  minion_3: '🔥',
  minion_4: '🐎',
  minion_5: '🐉',
  minion_6: '💚',
  minion_7: '🐺',
  minion_8: '⚔️',
  spell_1: '💥',
  spell_2: '🌋',
  spell_3: '💖',
  spell_4: '✨',
  spell_5: '📜',
  spell_6: '👹',
  spell_7: '❄️',
  spell_8: '💪',
  weapon_1: '🗡️',
  weapon_2: '🪓',
  token_imp: '👺',
};

function getCardIcon(cardId: string): string {
  return CARD_ICONS[cardId] || '❓';
}

function getCardTypeLabel(type: string): string {
  switch (type) {
    case 'minion': return '随从';
    case 'spell': return '法术';
    case 'weapon': return '武器';
    default: return '';
  }
}

function HeroAvatar({
  isEnemy,
  name,
  health,
  maxHealth,
  manaCurrent,
  manaMax,
  weapon,
  targetable,
  onClick,
}: {
  isEnemy: boolean;
  name: string;
  health: number;
  maxHealth: number;
  manaCurrent: number;
  manaMax: number;
  weapon: { attack: number; durability: number } | null;
  targetable: boolean;
  onClick: () => void;
}) {
  const manaCrystals = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => i < manaMax);
  }, [manaMax]);

  return (
    <div className={`hero-info ${isEnemy ? 'ai-side' : ''}`}>
      <div
        className={`hero-avatar ${isEnemy ? 'enemy' : ''} ${targetable ? 'targetable' : ''}`}
        onClick={onClick}
      >
        {isEnemy ? '👹' : '🧙'}
      </div>
      <div className="hero-stats">
        <div className="hero-name">{name}</div>
        <div className="health-display">
          <span className="health-icon">❤️</span>
          <span className="health-value">{health}/{maxHealth}</span>
        </div>
        <div className="mana-display">
          {manaCrystals.map((filled, i) => (
            <span
              key={i}
              className={`mana-crystal ${i < manaCurrent && filled ? 'filled' : ''}`}
            />
          ))}
        </div>
        {weapon && (
          <div className="weapon-info">
            <span className="weapon-icon">⚔️</span>
            <span className="weapon-stats">{weapon.attack}/{weapon.durability}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function BoardCell({
  isEnemy,
  minion,
  isSelected,
  targetable,
  isDamaged,
  onClick,
}: {
  isEnemy: boolean;
  minion: BoardMinion | null;
  isSelected: boolean;
  targetable: boolean;
  isDamaged: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={`board-cell ${isEnemy ? 'enemy' : ''} ${targetable ? 'targetable' : ''}`}
      onClick={onClick}
    >
      {minion && (
        <div
          className={`minion-card 
            ${isSelected ? 'selected' : ''} 
            ${minion.canAttack && minion.attacksThisTurn < minion.maxAttacksPerTurn && !minion.frozen && !isEnemy ? 'can-attack' : ''}
            ${minion.taunt ? 'taunt' : ''}
            ${isDamaged ? 'damaged' : ''}
          `}
        >
          <div className="minion-name">{minion.name}</div>
          <div className="minion-icon">{getCardIcon(minion.cardId)}</div>
          <div className="minion-stats">
            <span className="minion-attack">⚔{minion.attack}</span>
            <span className={`minion-health ${minion.currentHealth < minion.maxHealth ? 'low' : ''}`}>
              ❤{minion.currentHealth}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function HandCard({
  card,
  index,
  isSelected,
  isPlayable,
  onClick,
}: {
  card: Card;
  index: number;
  isSelected: boolean;
  isPlayable: boolean;
  onClick: () => void;
}) {
  const minionCard = card.type === 'minion' ? (card as MinionCard) : null;
  const weaponCard = card.type === 'weapon' ? (card as WeaponCard) : null;

  return (
    <div
      className={`hand-card ${isSelected ? 'selected' : ''} ${!isPlayable ? 'unplayable' : ''}`}
      onClick={onClick}
      style={{ zIndex: isSelected ? 101 : index }}
    >
      <div className={`card-cost ${!isPlayable ? 'insufficient' : ''}`}>{card.cost}</div>
      <div className={`card-type-badge ${card.type}`}>{getCardTypeLabel(card.type)}</div>
      <div className="card-name">{card.name}</div>
      <div className="card-image">{getCardIcon(card.id)}</div>
      <div className="card-description">{card.description}</div>
      {(minionCard || weaponCard) && (
        <div className="card-bottom-stats">
          {minionCard && (
            <>
              <span className="card-stat attack">⚔{minionCard.attack}</span>
              <span className="card-stat health">❤{minionCard.health}</span>
            </>
          )}
          {weaponCard && (
            <>
              <span className="card-stat attack">⚔{weaponCard.attack}</span>
              <span className="card-stat health">🛡{weaponCard.durability}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const store = useGameStore();

  const isPlayerTurn = store.currentPlayer === 'player' && !store.gameOver;

  const handleCellClick = (side: 'player' | 'ai', row: number, col: number) => {
    if (!isPlayerTurn) return;
    store.selectMinion(side, row, col);
  };

  const handleHeroClick = (side: 'player' | 'ai') => {
    if (!isPlayerTurn) return;

    if (store.selectedCardIndex !== null && store.pendingTarget) {
      const target: Target = { type: 'hero', side };
      store.playCardOnTarget(target);
      return;
    }

    if (store.selectedMinion && side === 'ai') {
      const target: Target = { type: 'hero', side: 'ai' };
      store.attackWithSelected(target);
    }
  };

  const handleCardClick = (index: number) => {
    if (!isPlayerTurn) return;

    if (store.selectedCardIndex === index) {
      const card = store.player.hand[index];
      if (card && (card.type === 'weapon' || (card.type === 'spell' && !needsTarget((card as SpellCard).effect)))) {
        store.playCardNoTarget();
      } else {
        store.selectCard(null);
      }
    } else {
      store.selectCard(index);
    }
  };

  const canTargetEnemyHero = (): boolean => {
    if (store.selectedMinion) return true;
    if (store.selectedCardIndex !== null && store.pendingTarget) {
      const effect = store.pendingTarget.effect;
      return effect.target === 'any' || effect.target === 'enemy';
    }
    return false;
  };

  const canTargetPlayerHero = (): boolean => {
    if (store.selectedCardIndex !== null && store.pendingTarget) {
      const effect = store.pendingTarget.effect;
      return effect.target === 'any' || effect.target === 'friendly';
    }
    return false;
  };

  const isMinionTargetable = (side: 'player' | 'ai', minion: BoardMinion | null): boolean => {
    if (!minion) return false;
    if (store.selectedCardIndex !== null && store.pendingTarget) {
      const effectTarget = store.pendingTarget.effect.target;
      if (effectTarget === 'any') return true;
      if (effectTarget === 'enemy' && side === 'ai') return true;
      if (effectTarget === 'friendly' && side === 'player') return true;
    }
    if (store.selectedMinion && side === 'ai') return true;
    return false;
  };

  const isCellTargetable = (side: 'player' | 'ai', row: number, col: number): boolean => {
    if (side === 'player' && store.selectedCardIndex !== null) {
      const card = store.player.hand[store.selectedCardIndex];
      if (card?.type === 'minion' && !store.player.board[row][col]) {
        return true;
      }
    }
    const minion = side === 'player' ? store.player.board[row][col] : store.ai.board[row][col];
    return isMinionTargetable(side, minion);
  };

  const renderBoard = (side: 'player' | 'ai') => {
    const player = side === 'player' ? store.player : store.ai;
    const cells = [];
    const rows = side === 'ai' ? [0, 1, 2] : [2, 1, 0];

    for (const row of rows) {
      for (let col = 0; col < BOARD_COLS; col++) {
        const minion = player.board[row][col];
        const isSelected =
          store.selectedMinion?.side === side &&
          store.selectedMinion?.row === row &&
          store.selectedMinion?.col === col;
        const targetable = isCellTargetable(side, row, col);
        const isDamaged = minion
          ? store.animationState.damagingTargets.includes(minion.instanceId)
          : false;

        cells.push(
          <BoardCell
            key={`${side}-${row}-${col}`}
            isEnemy={side === 'ai'}
            minion={minion}
            isSelected={isSelected}
            targetable={targetable}
            isDamaged={isDamaged}
            onClick={() => handleCellClick(side, row, col)}
          />
        );
      }
    }
    return cells;
  };

  if (store.gameOver) {
    return (
      <div className="game-container">
        <div className="game-over-overlay">
          <div className="game-over-content">
            <div className={`game-over-title ${store.winner === 'player' ? 'victory' : 'defeat'}`}>
              {store.winner === 'player' ? '🏆 胜利！' : '💀 失败...'}
            </div>
            <div className="game-over-subtitle">
              {store.winner === 'player'
                ? '恭喜你击败了AI对手！'
                : 'AI对手取得了胜利，再接再厉！'}
            </div>
            <button className="restart-btn" onClick={() => store.resetGame()}>
              重新开始
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`game-container ${store.animationState.screenShake ? 'shake' : ''}`}>
      <div className="deck-info enemy-deck">
        🎴 AI牌库: {store.ai.deck.length}张 | 手牌: {store.ai.hand.length}张
      </div>

      <div className="hero-section">
        <HeroAvatar
          isEnemy={true}
          name={store.ai.name}
          health={store.ai.hero.health}
          maxHealth={store.ai.hero.maxHealth}
          manaCurrent={store.ai.mana.current}
          manaMax={store.ai.mana.max}
          weapon={store.ai.weapon}
          targetable={canTargetEnemyHero()}
          onClick={() => handleHeroClick('ai')}
        />

        <div className="turn-info">
          <div className="turn-number">回合 {store.turn}</div>
          <div className="current-turn">
            {store.isAiThinking ? (
              <div className="thinking-indicator">
                <span>对手正在思考</span>
                <div className="thinking-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            ) : isPlayerTurn ? (
              <span style={{ color: '#34d399' }}>你的回合</span>
            ) : (
              <span style={{ color: '#dc2626' }}>对手回合</span>
            )}
          </div>
        </div>

        <HeroAvatar
          isEnemy={false}
          name={store.player.name}
          health={store.player.hero.health}
          maxHealth={store.player.hero.maxHealth}
          manaCurrent={store.player.mana.current}
          manaMax={store.player.mana.max}
          weapon={store.player.weapon}
          targetable={canTargetPlayerHero()}
          onClick={() => handleHeroClick('player')}
        />
      </div>

      <div className="instructions">
        <div className="instructions-title">📖 操作说明</div>
        <div>• 点击手牌选中卡牌</div>
        <div>• 随从卡：点击己方空格放置</div>
        <div>• 法术卡：选中后点击目标</div>
        <div>• 武器/无目标法术：双击使用</div>
        <div>• 随从：选中后点击敌方攻击</div>
      </div>

      <div className="board-area">
        <div className="enemy-board">{renderBoard('ai')}</div>
        <div className="player-board">{renderBoard('player')}</div>
      </div>

      <button
        className={`end-turn-btn ${isPlayerTurn ? 'player-turn' : ''}`}
        disabled={!isPlayerTurn || store.isAiThinking}
        onClick={() => store.endTurn()}
      >
        {isPlayerTurn ? '结束回合' : '等待中...'}
      </button>

      <div className="battle-log">
        {store.battleLog.slice(-15).map((log, i) => (
          <div key={i} className="log-entry">
            {log}
          </div>
        ))}
      </div>

      <div className="hand-area">
        <div className="deck-info player-deck">
          🎴 牌库: {store.player.deck.length}张
        </div>
        <div className="hand-cards">
          {store.player.hand.map((card, index) => (
            <HandCard
              key={card.id + '-' + index}
              card={card}
              index={index}
              isSelected={store.selectedCardIndex === index}
              isPlayable={card.cost <= store.player.mana.current && isPlayerTurn}
              onClick={() => handleCardClick(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
