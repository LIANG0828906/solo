import { useState, useEffect } from 'react';
import { useGameStore } from './store';
import { RUNES } from './types';
import type { Rune } from './types';
import { combineRunes } from './runeCombinationEngine';

function App() {
  const {
    gameState,
    selectedRunes,
    enemies,
    energy,
    frenzyMode,
    isCasting,
    screenFlash,
    damageNumbers,
    setGameState,
    setRune,
    removeRune,
    castSpell,
    generateEnemies,
    activateFrenzy,
    addDamageNumber,
    removeDamageNumber,
  } = useGameStore();

  const [maskPhase, setMaskPhase] = useState<'idle' | 'expanding' | 'shrinking'>('idle');
  const [displayState, setDisplayState] = useState<GameState>(gameState);

  type GameState = 'preview' | 'battle';

  useEffect(() => {
    if (gameState !== displayState) {
      setMaskPhase('expanding');
      const timer = setTimeout(() => {
        setDisplayState(gameState);
        setMaskPhase('shrinking');
        setTimeout(() => {
          setMaskPhase('idle');
        }, 300);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [gameState, displayState]);

  useEffect(() => {
    if (enemies.length === 0 && gameState === 'battle') {
      generateEnemies();
    }
  }, [gameState, enemies.length, generateEnemies]);

  const handleStartGame = () => {
    generateEnemies();
    setGameState('battle');
  };

  const handleRuneClick = (rune: Rune) => {
    const emptySlotIndex = selectedRunes.findIndex((r) => r === null);
    if (emptySlotIndex !== -1) {
      setRune(emptySlotIndex, rune);
    }
  };

  const handleSlotClick = (index: number) => {
    if (selectedRunes[index]) {
      removeRune(index);
    }
  };

  const handleCastSpell = () => {
    const runes = selectedRunes.filter((r): r is Rune => r !== null);
    if (runes.length === 0) return;

    castSpell();

    enemies.forEach((enemy, index) => {
      if (enemy.currentHp > 0) {
        const spell = combineRunes(runes);
        const damage = spell.type === 'aoe' || index === 0 ? spell.damage : 0;
        if (damage > 0) {
          const id = `dmg-${Date.now()}-${index}`;
          addDamageNumber(id, damage, enemy.id);
          setTimeout(() => {
            removeDamageNumber(id);
          }, 1000);
        }
      }
    });
  };

  const activeRunes = selectedRunes.filter((r): r is Rune => r !== null);
  const currentSpell = activeRunes.length > 0 ? combineRunes(activeRunes) : null;

  return (
    <div className="app">
      <div className="screen-glow" />

      <div className={`screen-flash ${screenFlash ? 'active' : ''}`} />

      <div
        className={`circle-mask ${
          maskPhase === 'expanding' ? 'expanding' : maskPhase === 'shrinking' ? 'shrinking' : ''
        }`}
      />

      {displayState === 'preview' && <PreviewPage onStart={handleStartGame} />}

      {displayState === 'battle' && (
        <BattlePage
          selectedRunes={selectedRunes}
          enemies={enemies}
          energy={energy}
          frenzyMode={frenzyMode}
          isCasting={isCasting}
          damageNumbers={damageNumbers}
          currentSpell={currentSpell}
          onRuneClick={handleRuneClick}
          onSlotClick={handleSlotClick}
          onCastSpell={handleCastSpell}
          onActivateFrenzy={activateFrenzy}
        />
      )}
    </div>
  );
}

function PreviewPage({ onStart }: { onStart: () => void }) {
  return (
    <div className="preview-page">
      <h1 className="preview-title">符文战斗</h1>
      <p className="preview-subtitle">
        收集神秘符文，组合强大法术，击败黑暗中的敌人。每一个符文都蕴含着古老的力量...
      </p>

      <div className="preview-runes">
        {RUNES.slice(0, 6).map((rune, index) => (
          <div
            key={rune.id}
            className={`rune-card ${rune.element}`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <span className="rune-icon">{rune.icon}</span>
            <span className="rune-name">{rune.name}</span>
          </div>
        ))}
      </div>

      <button className="btn btn-gold" onClick={onStart}>
        开始战斗
      </button>
    </div>
  );
}

interface BattlePageProps {
  selectedRunes: (Rune | null)[];
  enemies: Array<{ id: string; name: string; maxHp: number; currentHp: number; attackType: string }>;
  energy: number;
  frenzyMode: boolean;
  isCasting: boolean;
  damageNumbers: Array<{ id: string; value: number; targetId: string }>;
  currentSpell: { name: string; damage: number; type: string; description: string } | null;
  onRuneClick: (rune: Rune) => void;
  onSlotClick: (index: number) => void;
  onCastSpell: () => void;
  onActivateFrenzy: () => void;
}

function BattlePage({
  selectedRunes,
  enemies,
  energy,
  frenzyMode,
  isCasting,
  damageNumbers,
  currentSpell,
  onRuneClick,
  onSlotClick,
  onCastSpell,
  onActivateFrenzy,
}: BattlePageProps) {
  return (
    <div className="battle-page">
      <div className="rune-panel glass">
        <h2 className="rune-panel-title">符文列表</h2>
        <div className="rune-grid">
          {RUNES.map((rune) => (
            <div
              key={rune.id}
              className={`rune-card ${rune.element}`}
              onClick={() => onRuneClick(rune)}
            >
              <span className="rune-icon">{rune.icon}</span>
              <span className="rune-name">{rune.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="battle-scene glass">
        <div className="battle-scene-header">
          <div className="energy-bar-container">
            <div className="energy-label">
              <span>能量</span>
              <span>{energy}%</span>
            </div>
            <div className="energy-bar">
              <div className="energy-bar-fill" style={{ width: `${energy}%` }} />
            </div>
          </div>

          <button
            className={`btn ${frenzyMode ? 'btn-gold' : 'btn-ghost'}`}
            onClick={onActivateFrenzy}
            disabled={energy < 100 || frenzyMode}
          >
            {frenzyMode ? '狂热中' : '狂热模式'}
          </button>
        </div>

        <div className="enemies-container">
          {enemies.map((enemy) => (
            <div key={enemy.id} className={`enemy-card ${isCasting ? 'hit' : ''}`}>
              <div className="enemy-avatar">👹</div>
              <div className="enemy-name">{enemy.name}</div>
              <div className="enemy-hp-bar">
                <div
                  className="enemy-hp-fill"
                  style={{ width: `${(enemy.currentHp / enemy.maxHp) * 100}%` }}
                />
              </div>
              <div className="enemy-hp-text">
                {enemy.currentHp} / {enemy.maxHp}
              </div>

              {damageNumbers
                .filter((d) => d.targetId === enemy.id)
                .map((dmg) => (
                  <div key={dmg.id} className="damage-number">
                    -{dmg.value}
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>

      <div className="slots-panel glass-strong">
        <div className="spell-info">
          {currentSpell ? (
            <>
              <div className="spell-name">{currentSpell.name}</div>
              <div className="spell-desc">{currentSpell.description}</div>
            </>
          ) : (
            <>
              <div className="spell-name" style={{ color: 'var(--color-text-muted)' }}>
                等待施法
              </div>
              <div className="spell-desc">选择符文组合法术</div>
            </>
          )}
        </div>

        <div className="slots-container">
          {selectedRunes.map((rune, index) => (
            <div
              key={index}
              className={`slot ${rune ? 'has-rune' : ''}`}
              onClick={() => onSlotClick(index)}
            >
              {rune ? (
                <span className="slot-icon">{rune.icon}</span>
              ) : (
                <span className="empty-hint">+</span>
              )}
            </div>
          ))}
        </div>

        <button
          className="btn btn-primary cast-button"
          onClick={onCastSpell}
          disabled={selectedRunes.every((r) => r === null) || isCasting}
        >
          {isCasting ? '施法中...' : '释放法术'}
        </button>
      </div>
    </div>
  );
}

export default App;
