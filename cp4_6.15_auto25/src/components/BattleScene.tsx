import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { BattleState, Skill, CombatLogEntry } from '@/types';
import CharacterCard from './CharacterCard';
import CombatLog from './CombatLog';
import {
  applySkill,
  updateCooldowns,
  updateStatuses,
  regenerateMana,
  chooseAISkill,
  checkBattleEnd,
  createLogEntry,
} from '@/utils/combatEngine';
import { battleCharacters } from '@/data/skills';

type AnimationType = 'hit' | 'attack' | 'heal' | 'defense' | 'buff' | null;

const MAX_TURNS = 20;

const createInitialState = (): BattleState => ({
  player: JSON.parse(JSON.stringify(battleCharacters.player)),
  enemy: JSON.parse(JSON.stringify(battleCharacters.enemy)),
  currentTurn: 1,
  maxTurns: MAX_TURNS,
  phase: 'player',
  logs: [
    createLogEntry(1, '⚔️ 战斗开始！选择你的技能！', 'system'),
  ],
  winner: null,
  isAnimating: false,
});

const BattleScene: React.FC = () => {
  const [battleState, setBattleState] = useState<BattleState>(createInitialState);
  const [playerAnimation, setPlayerAnimation] = useState<AnimationType>(null);
  const [enemyAnimation, setEnemyAnimation] = useState<AnimationType>(null);
  const [logCollapsed, setLogCollapsed] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const turnTimerRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const addLogs = useCallback((
    prevLogs: CombatLogEntry[],
    turn: number,
    messages: string[],
    type: CombatLogEntry['type'],
  ): CombatLogEntry[] => {
    const newLogs = messages.map(msg => createLogEntry(turn, msg, type));
    return [...prevLogs, ...newLogs];
  }, []);

  const processPlayerTurn = useCallback((skill: Skill) => {
    if (battleState.isAnimating || battleState.phase !== 'player' || battleState.winner) {
      return;
    }

    if (skill.currentCooldown > 0) {
      setBattleState(prev => ({
        ...prev,
        logs: addLogs(prev.logs, prev.currentTurn, [`【${skill.name}】正在冷却中 (${skill.currentCooldown}回合)`], 'system'),
      }));
      return;
    }

    if (battleState.player.currentMp < skill.manaCost) {
      setBattleState(prev => ({
        ...prev,
        logs: addLogs(prev.logs, prev.currentTurn, [`魔法值不足！需要 ${skill.manaCost} MP`], 'system'),
      }));
      return;
    }

    const casterAnim: AnimationType =
      skill.type === 'attack' ? 'attack' :
      skill.type === 'defense' ? 'defense' :
      skill.type === 'heal' ? 'heal' : 'buff';
    setPlayerAnimation(casterAnim);

    setBattleState(prev => {
      const { updatedCaster, updatedTarget, result } = applySkill(prev.player, prev.enemy, skill);

      let logs = prev.logs;
      const logType: CombatLogEntry['type'] =
        skill.type === 'attack' ? 'attack' :
        skill.type === 'heal' ? 'heal' :
        skill.type === 'defense' ? 'defense' : 'buff';
      logs = addLogs(logs, prev.currentTurn, result.logs, logType);

      if (skill.type === 'attack' && result.damage > 0) {
        setTimeout(() => setEnemyAnimation('hit'), 200);
      }

      const endPlayer = regenerateMana(updateCooldowns(updatedCaster));
      const endTarget = updatedTarget;

      const tempState: BattleState = {
        ...prev,
        player: endPlayer,
        enemy: endTarget,
        logs,
        isAnimating: true,
      };

      const winner = checkBattleEnd(tempState);
      if (winner) {
        const resultMsg =
          winner === 'player' ? '🎉 恭喜！你获得了胜利！' :
          winner === 'enemy' ? '💀 很遗憾，你被击败了...' :
          '🤝 战斗平局！';
        return {
          ...tempState,
          logs: addLogs(logs, prev.currentTurn, [resultMsg], 'system'),
          winner,
          phase: 'ended',
          isAnimating: false,
        };
      }

      return {
        ...tempState,
        phase: 'enemy',
        isAnimating: false,
        logs: addLogs(logs, prev.currentTurn, ['━━━ 敌方回合 ━━━'], 'system'),
      };
    });
  }, [battleState, addLogs]);

  useEffect(() => {
    if (battleState.phase !== 'enemy' || battleState.winner || battleState.isAnimating) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const aiSkill = chooseAISkill(battleState.enemy);

      if (!aiSkill) {
        setBattleState(prev => {
          const logs = addLogs(prev.logs, prev.currentTurn, [`【${prev.enemy.name}】无法行动，跳过回合`], 'system');
          const updatedEnemy = regenerateMana(updateCooldowns(prev.enemy));
          const nextTurn = prev.currentTurn + 1;
          return {
            ...prev,
            enemy: updatedEnemy,
            logs: addLogs(logs, nextTurn, [`━━━ 第 ${nextTurn} 回合 · 你的回合 ━━━`], 'system'),
            phase: 'player',
            currentTurn: nextTurn,
            isAnimating: false,
          };
        });
        return;
      }

      const casterAnim: AnimationType =
        aiSkill.type === 'attack' ? 'attack' :
        aiSkill.type === 'defense' ? 'defense' :
        aiSkill.type === 'heal' ? 'heal' : 'buff';
      setEnemyAnimation(casterAnim);

      if (aiSkill.type === 'attack') {
        setTimeout(() => setPlayerAnimation('hit'), 200);
      }

      setBattleState(prev => {
        const { updatedCaster, updatedTarget, result } = applySkill(prev.enemy, prev.player, aiSkill);

        let logs = prev.logs;
        const logType: CombatLogEntry['type'] =
          aiSkill.type === 'attack' ? 'attack' :
          aiSkill.type === 'heal' ? 'heal' :
          aiSkill.type === 'defense' ? 'defense' : 'buff';
        logs = addLogs(logs, prev.currentTurn, result.logs, logType);

        let endEnemy = regenerateMana(updateCooldowns(updatedCaster));
        let endPlayer = updatedTarget;

        const enemyStatusUpdate = updateStatuses(endEnemy);
        endEnemy = enemyStatusUpdate.char;
        logs = addLogs(logs, prev.currentTurn, enemyStatusUpdate.logs, 'system');

        const playerStatusUpdate = updateStatuses(endPlayer);
        endPlayer = playerStatusUpdate.char;
        logs = addLogs(logs, prev.currentTurn, playerStatusUpdate.logs, 'system');

        const nextTurn = prev.currentTurn + 1;
        const tempState: BattleState = {
          ...prev,
          player: endPlayer,
          enemy: endEnemy,
          currentTurn: nextTurn,
          logs,
          isAnimating: false,
        };

        const winner = checkBattleEnd(tempState);
        if (winner) {
          const resultMsg =
            winner === 'player' ? '🎉 恭喜！你获得了胜利！' :
            winner === 'enemy' ? '💀 很遗憾，你被击败了...' :
            '🤝 战斗平局！';
          return {
            ...tempState,
            logs: addLogs(logs, nextTurn, [resultMsg], 'system'),
            winner,
            phase: 'ended',
            isAnimating: false,
          };
        }

        return {
          ...tempState,
          phase: 'player',
          logs: addLogs(logs, nextTurn, [`━━━ 第 ${nextTurn} 回合 · 你的回合 ━━━`], 'system'),
          isAnimating: false,
        };
      });
    }, 900);

    turnTimerRef.current = timeoutId;
    return () => {
      clearTimeout(timeoutId);
    };
  }, [battleState.phase, battleState.enemy, battleState.winner, battleState.isAnimating, battleState.currentTurn, addLogs]);

  useEffect(() => {
    if (battleState.winner && !showResult) {
      const timer = setTimeout(() => setShowResult(true), 800);
      return () => clearTimeout(timer);
    }
  }, [battleState.winner, showResult]);

  const handleAnimationEnd = useCallback((side: 'player' | 'enemy') => {
    if (side === 'player') {
      setPlayerAnimation(null);
    } else {
      setEnemyAnimation(null);
    }
  }, []);

  const restartBattle = useCallback(() => {
    setBattleState(createInitialState());
    setPlayerAnimation(null);
    setEnemyAnimation(null);
    setShowResult(false);
  }, []);

  useEffect(() => {
    return () => {
      if (turnTimerRef.current) clearTimeout(turnTimerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div className="battle-scene">
      <div className="battle-header">
        <h1 className="game-title">⚔️ 史诗卡牌对战 ⚔️</h1>
        <div className="turn-info">
          <span className="turn-label">回合</span>
          <span className="turn-number">{battleState.currentTurn}</span>
          <span className="turn-separator">/</span>
          <span className="turn-max">{battleState.maxTurns}</span>
        </div>
      </div>

      <div className="battle-layout">
        <div className="characters-column">
          <div className="character-section">
            <div className="section-label section-label--enemy">
              <span className="label-dot" />敌方
            </div>
            <CharacterCard
              character={battleState.enemy}
              isActive={battleState.phase === 'enemy'}
              animationType={enemyAnimation}
              onAnimationEnd={() => handleAnimationEnd('enemy')}
            />
          </div>

          <div className="vs-divider">
            <span className="vs-text">VS</span>
          </div>

          <div className="character-section">
            <div className="section-label section-label--player">
              <span className="label-dot" />己方
            </div>
            <CharacterCard
              character={battleState.player}
              isActive={battleState.phase === 'player'}
              animationType={playerAnimation}
              onAnimationEnd={() => handleAnimationEnd('player')}
            />
          </div>
        </div>

        <div className="controls-column">
          <div className="skill-panel">
            <div className="panel-header">
              <span className="panel-title">🎯 技能选择</span>
              {battleState.phase === 'player' && !battleState.winner ? (
                <span className="phase-indicator phase-indicator--player">你的回合</span>
              ) : battleState.phase === 'enemy' ? (
                <span className="phase-indicator phase-indicator--enemy">敌方行动中...</span>
              ) : (
                <span className="phase-indicator phase-indicator--ended">战斗结束</span>
              )}
            </div>
            <div className="skill-grid">
              {battleState.player.skills.map(skill => {
                const isDisabled =
                  skill.currentCooldown > 0 ||
                  battleState.player.currentMp < skill.manaCost ||
                  battleState.phase !== 'player' ||
                  battleState.isAnimating ||
                  !!battleState.winner;

                const typeColors: Record<string, string> = {
                  attack: 'attack',
                  defense: 'defense',
                  heal: 'heal',
                  buff: 'buff',
                };

                return (
                  <button
                    key={skill.id}
                    className={`skill-btn skill-btn--${typeColors[skill.type]} ${isDisabled ? 'skill-btn--disabled' : ''}`}
                    onClick={() => processPlayerTurn(skill)}
                    disabled={isDisabled}
                    title={`${skill.name}\n${skill.description}\n\n效果: ${skill.effect}\n消耗: ${skill.manaCost} MP | 冷却: ${skill.cooldown}回合`}
                  >
                    {skill.currentCooldown > 0 && (
                      <div className="skill-cooldown">{skill.currentCooldown}</div>
                    )}
                    <span className="skill-icon">{skill.icon}</span>
                    <span className="skill-name">{skill.name}</span>
                    <span className="skill-cost">{skill.manaCost} MP</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="log-wrapper">
            <div className="log-toggle" onClick={() => setLogCollapsed(!logCollapsed)}>
              <span>{logCollapsed ? '展开日志 ▼' : '收起日志 ▲'}</span>
            </div>
            <CombatLog logs={battleState.logs} collapsed={logCollapsed} />
          </div>
        </div>
      </div>

      {showResult && battleState.winner && (
        <div className="result-overlay">
          <div className="result-modal">
            <div className={`result-title result-title--${battleState.winner}`}>
              {battleState.winner === 'player' && '🏆 胜利！'}
              {battleState.winner === 'enemy' && '💀 失败'}
              {battleState.winner === 'draw' && '🤝 平局'}
            </div>
            <p className="result-subtitle">
              {battleState.winner === 'player' && '你击败了敌人，荣耀属于你！'}
              {battleState.winner === 'enemy' && '不要气馁，再来一次吧！'}
              {battleState.winner === 'draw' && '势均力敌，再战一场！'}
            </p>
            <p className="result-stats">
              共进行了 <strong>{battleState.currentTurn}</strong> 回合
            </p>
            <button className="restart-btn" onClick={restartBattle}>
              🔄 重新战斗
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BattleScene;
