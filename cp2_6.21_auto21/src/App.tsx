import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useGameStore } from './store';
import { Card, MinionCard, SpellCard, WeaponCard } from './card';
import { BoardMinion, BOARD_ROWS, BOARD_COLS, canMinionAttack as canMinionAttackPlayer } from './player';
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

interface RollingNumberProps {
  value: number;
  maxValue?: number;
  showMax?: boolean;
  color?: string;
  duration?: number;
}

const RollingNumber: React.FC<RollingNumberProps> = ({
  value,
  maxValue,
  showMax = false,
  color,
  duration = 500,
}) => {
  const digitsRef = useRef<(HTMLDivElement | null)[]>([]);
  const prevValueRef = useRef<number>(value);
  const displayValueRef = useRef<number>(value);

  useEffect(() => {
    const oldValue = displayValueRef.current;
    const newValue = value;
    const steps = Math.abs(newValue - oldValue);
    
    if (steps === 0) return;

    const animate = (progress: number) => {
      const currentValue = Math.round(oldValue + (newValue - oldValue) * progress);
      displayValueRef.current = currentValue;
      
      const str = String(currentValue).padStart(2, '0');
      digitsRef.current.forEach((el, idx) => {
        if (!el) return;
        const digit = parseInt(str[idx] || '0', 10);
        const inner = el.querySelector('.rolling-digit-inner') as HTMLElement;
        if (inner) {
          inner.style.transition = `transform ${duration}ms cubic-bezier(0.23, 1, 0.32, 1)`;
          inner.style.transform = `translateY(-${digit}em)`;
        }
      });
    };

    const startTime = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      animate(eased);
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    prevValueRef.current = newValue;

    return () => cancelAnimationFrame(rafId);
  }, [value, duration]);

  const displayStr = useMemo(() => {
    const v = String(displayValueRef.current || value).padStart(2, '0');
    return v;
  }, [value]);

  const setDigitRef = useCallback((idx: number) => (el: HTMLDivElement | null) => {
    digitsRef.current[idx] = el;
  }, []);

  const maxStr = maxValue !== undefined ? String(maxValue).padStart(2, '0') : '';

  return (
    <span className="rolling-number" style={{ color }}>
      {displayStr.split('').map((ch, idx) => (
        <div key={idx} className="rolling-digit" ref={setDigitRef(idx)} style={{ verticalAlign: 'middle' }}>
          <div
            className="rolling-digit-inner"
            style={{ transform: `translateY(-${parseInt(displayStr[idx] || '0', 10)}em)` }}
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <span key={n}>{n}</span>
            ))}
          </div>
        </div>
      ))}
      {showMax && maxValue !== undefined && (
        <span style={{ marginLeft: '2px', display: 'inline-flex' }}>/{maxStr}</span>
      )}
    </span>
  );
};

interface FlyingCard {
  id: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  icon: string;
}

interface DamagePopup {
  id: number;
  x: number;
  y: number;
  value: number;
  type: 'damage' | 'heal';
}

interface HeroAvatarProps {
  isEnemy: boolean;
  name: string;
  health: number;
  maxHealth: number;
  manaCurrent: number;
  manaMax: number;
  weapon: { attack: number; durability: number } | null;
  targetable: boolean;
  onClick: () => void;
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
}: HeroAvatarProps) {
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
          <RollingNumber
            value={health}
            maxValue={maxHealth}
            showMax
            color="#ef4444"
            duration={500}
          />
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

interface BoardCellProps {
  isEnemy: boolean;
  minion: BoardMinion | null;
  isSelected: boolean;
  targetable: boolean;
  isDamaged: boolean;
  onClick: () => void;
  cellRef?: (el: HTMLDivElement | null) => void;
}

function BoardCell({
  isEnemy,
  minion,
  isSelected,
  targetable,
  isDamaged,
  onClick,
  cellRef,
}: BoardCellProps) {
  return (
    <div
      ref={cellRef}
      className={`board-cell ${isEnemy ? 'enemy' : ''} ${targetable ? 'targetable' : ''}`}
      onClick={onClick}
    >
      {minion && (
        <div
          className={`minion-card 
            ${isSelected ? 'selected' : ''} 
            ${canMinionAttackPlayer(minion) && !isEnemy ? 'can-attack' : ''}
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

interface HandCardProps {
  card: Card;
  index: number;
  isSelected: boolean;
  isPlayable: boolean;
  onClick: () => void;
  cardRef?: (el: HTMLDivElement | null) => void;
}

function HandCard({
  card,
  index,
  isSelected,
  isPlayable,
  onClick,
  cardRef,
}: HandCardProps) {
  const minionCard = card.type === 'minion' ? (card as MinionCard) : null;
  const weaponCard = card.type === 'weapon' ? (card as WeaponCard) : null;

  return (
    <div
      ref={cardRef}
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

const App: React.FC = () => {
  const store = useGameStore();
  const [flyingCards, setFlyingCards] = useState<FlyingCard[]>([]);
  const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([]);
  const [showPhaseIndicator, setShowPhaseIndicator] = useState<string | null>(null);
  const flyingIdRef = useRef(0);
  const popupIdRef = useRef(0);
  const phaseRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const handCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const boardCellRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isPlayerTurn = store.currentPlayer === 'player' && !store.gameOver;

  const previousPlayerHealth = useRef(store.player.hero.health);
  const previousAiHealth = useRef(store.ai.hero.health);

  useEffect(() => {
    const prevPlayer = previousPlayerHealth.current;
    const prevAi = previousAiHealth.current;
    const playerDiff = store.player.hero.health - prevPlayer;
    const aiDiff = store.ai.hero.health - prevAi;

    if (playerDiff !== 0 || aiDiff !== 0) {
      const showPopup = (x: number, y: number, diff: number) => {
        const id = popupIdRef.current++;
        const type: 'damage' | 'heal' = diff < 0 ? 'damage' : 'heal';
        setDamagePopups((prev) => [...prev, { id, x, y, value: Math.abs(diff), type }]);
        setTimeout(() => {
          setDamagePopups((prev) => prev.filter((p) => p.id !== id));
        }, 1000);
      };

      if (playerDiff !== 0) {
        const heroes = document.querySelectorAll('.hero-section .hero-info');
        const playerHero = heroes[heroes.length - 1] as HTMLElement | undefined;
        if (playerHero) {
          const avatar = playerHero.querySelector('.hero-avatar') as HTMLElement | undefined;
          if (avatar) {
            const rect = avatar.getBoundingClientRect();
            showPopup(rect.left + rect.width / 2, rect.top + rect.height / 2, playerDiff);
          }
        }
      }
      if (aiDiff !== 0) {
        const heroes = document.querySelectorAll('.hero-section .hero-info');
        const aiHero = heroes[0] as HTMLElement | undefined;
        if (aiHero) {
          const avatar = aiHero.querySelector('.hero-avatar') as HTMLElement | undefined;
          if (avatar) {
            const rect = avatar.getBoundingClientRect();
            showPopup(rect.left + rect.width / 2, rect.top + rect.height / 2, aiDiff);
          }
        }
      }

      previousPlayerHealth.current = store.player.hero.health;
      previousAiHealth.current = store.ai.hero.health;
    }
  }, [store.player.hero.health, store.ai.hero.health]);

  const triggerCardFlight = useCallback((cardIndex: number, toX: number, toY: number) => {
    const cardEl = handCardRefs.current[cardIndex];
    if (!cardEl) return;

    const rect = cardEl.getBoundingClientRect();
    const fromX = rect.left + rect.width / 2;
    const fromY = rect.top + rect.height / 2;

    const icon = getCardIcon(store.player.hand[cardIndex]?.id || '');

    const id = flyingIdRef.current++;
    const flyingCardData: FlyingCard = {
      id,
      fromX,
      fromY,
      toX,
      toY,
      icon,
    };

    setFlyingCards((prev) => [...prev, flyingCardData]);

    const flyDuration = 300;

    requestAnimationFrame(() => {
      const overlayId = `flying-card-${id}`;
      setTimeout(() => {
        const el = document.getElementById(overlayId);
        if (el && (el as any).animate) {
          const inner = el.querySelector('.flying-card-inner') as HTMLElement;
          if (inner) {
            const animation = (inner as any).animate(
              [
                {
                  transform: `translate(0px, 0px) scale(1) rotate(0deg)`,
                  opacity: 1,
                  offset: 0,
                },
                {
                  transform: `translate(${toX - fromX}px, ${toY - fromY}px) scale(0.3) rotate(15deg)`,
                  opacity: 0,
                  offset: 1,
                },
              ],
              {
                duration: flyDuration,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                fill: 'forwards',
              }
            );
            animation.onfinish = () => {
              setFlyingCards((prev) => prev.filter((f) => f.id !== id));
            };
          }
        }
      }, 16);
    });
  }, [store.player.hand]);

  const handleCellClick = useCallback((side: 'player' | 'ai', row: number, col: number) => {
    if (!isPlayerTurn) return;

    if (side === 'player' && store.selectedCardIndex !== null) {
      const card = store.player.hand[store.selectedCardIndex];
      if (card?.type === 'minion' && !store.player.board[row][col]) {
        const cellKey = `${side}-${row}-${col}`;
        const cellEl = boardCellRefs.current[cellKey];
        if (cellEl) {
          const rect = cellEl.getBoundingClientRect();
          triggerCardFlight(
            store.selectedCardIndex!,
            rect.left + rect.width / 2,
            rect.top + rect.height / 2
          );
        }
      }
    }

    store.selectMinion(side, row, col);
  }, [isPlayerTurn, store, triggerCardFlight]);

  const handleHeroClick = useCallback((side: 'player' | 'ai') => {
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
  }, [isPlayerTurn, store]);

  const handleCardClick = useCallback((index: number) => {
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
  }, [isPlayerTurn, store]);

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

  const setBoardCellRef = useCallback((key: string) => (el: HTMLDivElement | null) => {
    boardCellRefs.current[key] = el;
  }, []);

  const setHandCardRef = useCallback((idx: number) => (el: HTMLDivElement | null) => {
    handCardRefs.current[idx] = el;
  }, []);

  const renderBoard = (side: 'player' | 'ai') => {
    const player = side === 'player' ? store.player : store.ai;
    const cells: React.ReactNode[] = [];
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
        const cellKey = `${side}-${row}-${col}`;

        cells.push(
          <BoardCell
            key={cellKey}
            isEnemy={side === 'ai'}
            minion={minion}
            isSelected={isSelected}
            targetable={targetable}
            isDamaged={isDamaged}
            onClick={() => handleCellClick(side, row, col)}
            cellRef={setBoardCellRef(cellKey)}
          />
        );
      }
    }
    return cells;
  };

  useEffect(() => {
    if (store.turn > phaseRef.current) {
      phaseRef.current = store.turn;
      if (store.currentPlayer === 'player') {
        setShowPhaseIndicator(`回合 ${store.turn}`);
        setTimeout(() => setShowPhaseIndicator(null), 1200);
      }
    }
  }, [store.turn, store.currentPlayer]);

  if (store.gameOver) {
    return (
      <div className="game-container" ref={containerRef}>
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
            <button
              className="restart-btn"
              onClick={() => {
                phaseRef.current = 0;
                store.resetGame();
              }}
            >
              重新开始
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`game-container ${store.animationState.screenShake ? 'shake' : ''}`}
      ref={containerRef}
    >
      {flyingCards.map((fc) => (
        <div
          id={`flying-card-${fc.id}`}
          key={fc.id}
          className="flying-card-overlay"
          style={{
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
          }}
        >
          <div
            className="flying-card-inner"
            style={{
              position: 'absolute',
              left: `${fc.fromX - 55}px`,
              top: `${fc.fromY - 80}px`,
            }}
          >
            {fc.icon}
          </div>
        </div>
      ))}

      {damagePopups.map((dp) => (
        <div
          key={dp.id}
          className={dp.type === 'damage' ? 'damage-popup' : 'heal-popup'}
          style={{ left: dp.x, top: dp.y }}
        >
          {dp.type === 'damage' ? '-' : '+'}
          {dp.value}
        </div>
      ))}

      {showPhaseIndicator && <div className="phase-indicator">{showPhaseIndicator}</div>}

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
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
            阶段:{' '}
            {store.phase === 'draw'
              ? '抽牌'
              : store.phase === 'main'
              ? '主阶段'
              : store.phase === 'combat'
              ? '战斗'
              : '结束'}
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
        <div style={{ marginTop: '8px', color: '#fbbf24' }}>
          出牌: {store.cardsPlayedThisTurn} | 攻击: {store.attacksMadeThisTurn}
        </div>
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
        <div className="deck-info player-deck">🎴 牌库: {store.player.deck.length}张</div>
        <div className="hand-cards">
          {store.player.hand.map((card, index) => (
            <HandCard
              key={card.id + '-' + index}
              card={card}
              index={index}
              isSelected={store.selectedCardIndex === index}
              isPlayable={card.cost <= store.player.mana.current && isPlayerTurn}
              onClick={() => handleCardClick(index)}
              cardRef={setHandCardRef(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
