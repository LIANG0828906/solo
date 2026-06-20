import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { CombatEngine } from './CombatEngine';
import StatusBar from '../../components/StatusBar';
import DiceRoller from '../../components/DiceRoller';
import { LOOT_ITEMS } from '../../data/gameData';
import type { CombatAction } from '../../types';
import './CombatUI.css';

function CombatUI() {
  const navigate = useNavigate();
  const {
    combat,
    character,
    startCombat,
    endCombat,
    updateCombat,
    addCombatLog,
    heal,
    takeDamage,
    restoreMana,
    gainExperience,
    addItem,
    updateCharacter,
  } = useGameStore();

  const [isAnimating, setIsAnimating] = useState(false);
  const [playerAttacking, setPlayerAttacking] = useState(false);
  const [enemyAttacking, setEnemyAttacking] = useState(false);
  const [showDice, setShowDice] = useState(false);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [diceModifier, setDiceModifier] = useState(0);
  const [combatEnded, setCombatEnded] = useState<'victory' | 'defeat' | null>(null);
  const [rewards, setRewards] = useState<{
    experience: number;
    gold: number;
    items: { name: string; icon: string }[];
  } | null>(null);

  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [combat?.log]);

  useEffect(() => {
    if (!combat && character) {
    }
  }, [combat, character]);

  if (!combat || !combat.enemy) {
    return (
      <div className="combat-container">
        <div className="no-combat parchment-panel">
          <h2>当前没有战斗</h2>
          <p>前往地牢探索以遭遇敌人</p>
          <button className="btn-primary" onClick={() => navigate('/game')}>
            返回地牢
          </button>
        </div>
      </div>
    );
  }

  const { enemy, turn, log, playerDefending } = combat;

  const handlePlayerAction = async (action: CombatAction) => {
    if (isAnimating || turn !== 'player' || !character || combatEnded) return;

    setIsAnimating(true);
    setShowDice(true);

    if (action === 'attack') {
      setPlayerAttacking(true);
      const result = CombatEngine.playerAttack(character, enemy);
      setDiceResult(result.diceRoll);
      setDiceModifier(result.attackModifier);

      setTimeout(() => {
        setPlayerAttacking(false);
        if (result.hit) {
          addCombatLog(
            `${result.critical ? '💥 暴击！' : ''}你对 ${enemy.name} 造成了 ${result.damage} 点伤害！`
          );

          const newEnemyHealth = Math.max(0, enemy.currentHealth - result.damage);
          updateCombat({
            enemy: { ...enemy, currentHealth: newEnemyHealth },
          });

          if (newEnemyHealth <= 0) {
            handleVictory();
            return;
          }
        } else {
          addCombatLog(`你攻击 ${enemy.name}，但未命中！`);
        }

        setTimeout(() => {
          setShowDice(false);
          setDiceResult(null);
          enemyTurn();
        }, 500);
      }, 800);
    } else if (action === 'cast') {
      if (character.currentMana < 15) {
        addCombatLog('法力不足！');
        setIsAnimating(false);
        setShowDice(false);
        return;
      }

      setPlayerAttacking(true);
      const result = CombatEngine.playerCastSpell(character, enemy);
      setDiceResult(result.diceRoll);
      setDiceModifier(result.spellModifier);

      updateCharacter({ currentMana: character.currentMana - result.manaCost });

      setTimeout(() => {
        setPlayerAttacking(false);
        if (result.hit) {
          addCombatLog(
            `${result.critical ? '✨ 法术暴击！' : ''}你的法术对 ${enemy.name} 造成了 ${result.damage} 点伤害！`
          );

          const newEnemyHealth = Math.max(0, enemy.currentHealth - result.damage);
          updateCombat({
            enemy: { ...enemy, currentHealth: newEnemyHealth },
          });

          if (newEnemyHealth <= 0) {
            handleVictory();
            return;
          }
        } else {
          addCombatLog(`你的法术被 ${enemy.name} 躲闪了！`);
        }

        setTimeout(() => {
          setShowDice(false);
          setDiceResult(null);
          enemyTurn();
        }, 500);
      }, 800);
    } else if (action === 'defend') {
      const result = CombatEngine.playerDefend(character);
      addCombatLog(`你摆出防御姿态，伤害减免 ${result.damageReduction} 点！`);
      updateCombat({ playerDefending: true });

      setTimeout(() => {
        setShowDice(false);
        enemyTurn();
      }, 500);
    } else if (action === 'item') {
      const potion = character.inventory.find(
        (i) => i.type === 'consumable' && i.effects?.health
      );
      if (potion && potion.effects?.health) {
        heal(potion.effects.health);
        addCombatLog(`你使用了 ${potion.name}，恢复了 ${potion.effects.health} 点生命！`);
      } else {
        addCombatLog('你没有可用的药水！');
        setIsAnimating(false);
        setShowDice(false);
        return;
      }

      setTimeout(() => {
        setShowDice(false);
        enemyTurn();
      }, 500);
    }
  };

  const enemyTurn = () => {
    if (!character || !combat.enemy || combatEnded) return;

    updateCombat({ turn: 'enemy' });

    setTimeout(() => {
      setEnemyAttacking(true);
      const result = CombatEngine.enemyAttack(combat.enemy!, character, playerDefending);

      setDiceResult(result.diceRoll);
      setDiceModifier(result.attackModifier);
      setShowDice(true);

      setTimeout(() => {
        setEnemyAttacking(false);
        if (result.hit) {
          takeDamage(result.damage);
          addCombatLog(
            `${result.critical ? '💢 暴击！' : ''}${enemy.name} 对你造成了 ${result.damage} 点伤害！`
          );

          const newHealth = character.currentHealth - result.damage;
          if (newHealth <= 0) {
            handleDefeat();
            return;
          }
        } else {
          addCombatLog(`${enemy.name} 的攻击被你躲开了！`);
        }

        setTimeout(() => {
          setShowDice(false);
          setDiceResult(null);
          updateCombat({ turn: 'player', playerDefending: false });
          setIsAnimating(false);
        }, 500);
      }, 600);
    }, 500);
  };

  const handleVictory = () => {
    const calcRewards = CombatEngine.calculateRewards(enemy);
    const itemDetails = calcRewards.items
      .map((id) => LOOT_ITEMS[id])
      .filter(Boolean)
      .map((item) => ({ name: item.name, icon: item.icon }));

    setRewards({
      experience: calcRewards.experience,
      gold: calcRewards.gold,
      items: itemDetails,
    });

    gainExperience(calcRewards.experience);
    updateCharacter({ gold: character!.gold + calcRewards.gold });

    calcRewards.items.forEach((itemId) => {
      const item = LOOT_ITEMS[itemId];
      if (item) {
        addItem({ ...item, id: `${itemId}-${Date.now()}-${Math.random()}` });
      }
    });

    addCombatLog(`🎉 你击败了 ${enemy.name}！`);
    addCombatLog(`获得 ${calcRewards.experience} 经验和 ${calcRewards.gold} 金币！`);
    setCombatEnded('victory');
    setIsAnimating(false);
    setShowDice(false);
  };

  const handleDefeat = () => {
    addCombatLog(`💀 你被 ${enemy.name} 击败了...`);
    setCombatEnded('defeat');
    setIsAnimating(false);
    setShowDice(false);
  };

  const handleLeaveCombat = () => {
    endCombat();
    setCombatEnded(null);
    setRewards(null);
    navigate('/game');
  };

  return (
    <div className="combat-container">
      <div className="combat-arena">
        <div className="enemy-section">
          <div className="enemy-info">
            <h3>{enemy.name}</h3>
            <StatusBar
              type="health"
              current={enemy.currentHealth}
              max={enemy.maxHealth}
              label="生命"
            />
          </div>
          <div className={`enemy-sprite ${enemyAttacking ? 'attacking' : ''}`}>
            <span className="enemy-icon">{enemy.icon}</span>
          </div>
        </div>

        {showDice && (
          <div className="combat-dice">
            <DiceRoller
              size="small"
              autoRoll
              dc={0}
              modifier={diceModifier}
              showResult={true}
            />
          </div>
        )}

        <div className="player-section">
          <div className={`player-sprite ${playerAttacking ? 'attacking' : ''}`}>
            <div
              className={`player-avatar-combat shape-${character?.avatarShape || 'circle'}`}
              style={{ backgroundColor: character?.avatarColor || '#e74c3c' }}
            >
              {character?.name.charAt(0).toUpperCase() || '英'}
            </div>
          </div>
          <div className="player-info">
            <h3>{character?.name || '勇者'}</h3>
            <StatusBar
              type="health"
              current={character?.currentHealth || 100}
              max={character?.maxHealth || 100}
              label="生命"
            />
            <StatusBar
              type="mana"
              current={character?.currentMana || 50}
              max={character?.maxMana || 50}
              label="法力"
            />
          </div>
        </div>
      </div>

      <div className="combat-log parchment-panel" ref={logRef}>
        {log.map((entry, i) => (
          <p key={i} className="log-entry">
            {entry}
          </p>
        ))}
      </div>

      {!combatEnded && (
        <div className="combat-actions">
          <button
            className="btn-primary action-btn"
            onClick={() => handlePlayerAction('attack')}
            disabled={isAnimating || turn !== 'player'}
          >
            ⚔️ 攻击
          </button>
          <button
            className="btn-primary action-btn"
            onClick={() => handlePlayerAction('cast')}
            disabled={isAnimating || turn !== 'player'}
          >
            ✨ 施法
          </button>
          <button
            className="btn-secondary action-btn"
            onClick={() => handlePlayerAction('defend')}
            disabled={isAnimating || turn !== 'player'}
          >
            🛡️ 防御
          </button>
          <button
            className="btn-secondary action-btn"
            onClick={() => handlePlayerAction('item')}
            disabled={isAnimating || turn !== 'player'}
          >
            🧪 道具
          </button>
        </div>
      )}

      {combatEnded && (
        <div className="combat-end-overlay">
          <div className="combat-end-panel parchment-panel fade-in">
            {combatEnded === 'victory' ? (
              <>
                <h2 className="victory-title">🎉 战斗胜利！</h2>
                <p className="end-message">你击败了 {enemy.name}！</p>
                {rewards && (
                  <div className="rewards">
                    <div className="reward-item">
                      <span>⭐ 经验值</span>
                      <strong>+{rewards.experience}</strong>
                    </div>
                    <div className="reward-item">
                      <span>💰 金币</span>
                      <strong>+{rewards.gold}</strong>
                    </div>
                    {rewards.items.length > 0 && (
                      <div className="reward-items">
                        <span>🎁 掉落</span>
                        <div className="reward-item-list">
                          {rewards.items.map((item, i) => (
                            <span key={i} className="reward-item-icon">
                              {item.icon} {item.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="defeat-title">💀 战斗失败</h2>
                <p className="end-message">你被 {enemy.name} 击败了...</p>
              </>
            )}
            <button className="btn-primary" onClick={handleLeaveCombat}>
              返回地牢
            </button>
          </div>
        </div>
      )}

      <div className="combat-hint">
        {turn === 'player' && !combatEnded && '轮到你行动了！'}
        {turn === 'enemy' && !combatEnded && '敌人回合...'}
      </div>
    </div>
  );
}

export default CombatUI;
