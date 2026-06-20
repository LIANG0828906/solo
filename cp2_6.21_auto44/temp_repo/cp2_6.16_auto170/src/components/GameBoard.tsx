import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useGameStore } from '@/store';
import { useShallow } from 'zustand/react/shallow';
import type { RuneType, Spell, StatusEffect } from '@/types';
import { RUNE_CONFIG } from '@/gameLogic';
import { RuneSlot } from './RuneSlot';
import { RuneCard } from './RuneCard';
import { PlayerSprite, MonsterSprite } from './PixelSprite';
import { HealthBar } from './HealthBar';
import { SpellCard } from './SpellCard';
import { BattleLog } from './BattleLog';
import { ParticleEffect, type ParticleEffectHandle } from './ParticleEffect';

interface FloatingDamage {
  id: string;
  x: number;
  y: number;
  value: number;
  isHeal?: boolean;
  target: 'player' | 'monster';
}

interface FlyingSpell {
  id: string;
  icon: string;
  color: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  progress: number;
  duration: number;
}

const StatusChips: React.FC<{ effects: StatusEffect[] }> = ({ effects }) => {
  if (effects.length === 0) return <div className="status-effects" />;
  const labels: Record<StatusEffect['type'], string> = {
    burn: '🔥燃烧',
    freeze: '❄️冻结',
    poison: '☠️中毒',
    stun: '💫眩晕',
    heal: '💚恢复',
    shield: '🛡️护盾',
  };
  return (
    <div className="status-effects">
      {effects.slice(0, 4).map((e, i) => (
        <span key={i} className={`status-chip ${e.type}`}>
          {labels[e.type]}
          {e.duration > 0 ? `(${e.duration})` : ''}
        </span>
      ))}
    </div>
  );
};

const spellColorMap: Record<Spell['animationType'], string> = {
  fireball: '#FF6B35',
  ice: '#60A5FA',
  earth: '#A16207',
  wind: '#86EFAC',
  light: '#FDE047',
  dark: '#A855F7',
  explosion: '#F97316',
};

export const GameBoard: React.FC = function GameBoard() {
  const {
    runes,
    craftSlots,
    learnedSpells,
    battle,
    battleLogs,
    isCrafting,
    lastCraftResult,
    craftFailShake,
    animatingSpellId,
    monsterHit,
    playerHit,
    floatingDrops,
    placeRuneInSlot,
    removeRuneFromSlot,
    clearCraftSlots,
    clearLastCraftResult,
    castSpell,
    restartGame,
  } = useGameStore(
    useShallow((s) => ({
      runes: s.runes,
      craftSlots: s.craftSlots,
      learnedSpells: s.learnedSpells,
      battle: s.battle,
      battleLogs: s.battleLogs,
      isCrafting: s.isCrafting,
      lastCraftResult: s.lastCraftResult,
      craftFailShake: s.craftFailShake,
      animatingSpellId: s.animatingSpellId,
      monsterHit: s.monsterHit,
      playerHit: s.playerHit,
      floatingDrops: s.floatingDrops,
      placeRuneInSlot: s.placeRuneInSlot,
      removeRuneFromSlot: s.removeRuneFromSlot,
      clearCraftSlots: s.clearCraftSlots,
      clearLastCraftResult: s.clearLastCraftResult,
      castSpell: s.castSpell,
      restartGame: s.restartGame,
    }))
  );

  const particleRef = useRef<ParticleEffectHandle>(null);
  const craftParticleRef = useRef<ParticleEffectHandle>(null);
  const battleSceneRef = useRef<HTMLDivElement>(null);
  const craftCenterRef = useRef<HTMLDivElement>(null);

  const [floatingDamages, setFloatingDamages] = useState<FloatingDamage[]>([]);
  const [flyingSpells, setFlyingSpells] = useState<FlyingSpell[]>([]);

  const runeList = useMemo(() => Object.values(runes), [runes]);
  const { monster, player, phase, turn, isPlayerStunned, bossSkillCooldown } = battle;
  const canCast = phase === 'player_turn' && !isPlayerStunned && learnedSpells.length > 0;

  // 合成成功 - 粒子特效
  useEffect(() => {
    if (lastCraftResult && craftCenterRef.current) {
      const rect = craftCenterRef.current.getBoundingClientRect();
      const parentRect = craftCenterRef.current.offsetParent?.getBoundingClientRect();
      if (parentRect) {
        const cx = rect.left - parentRect.left + rect.width / 2;
        const cy = rect.top - parentRect.top + rect.height / 2;
        const colors = lastCraftResult.recipe.map((r) => RUNE_CONFIG[r].color);
        craftParticleRef.current?.burst(cx, cy, [...colors, '#FFD700', '#FFF'], 40);
      }
      const t = setTimeout(() => clearLastCraftResult(), 2500);
      return () => clearTimeout(t);
    }
  }, [lastCraftResult, clearLastCraftResult]);

  // 施放法术 - 飞行物+伤害
  const previousAnimatingId = useRef<string | null>(null);
  const previousMonsterHp = useRef(monster?.hp ?? 0);
  const previousPlayerHp = useRef(player.hp);

  useEffect(() => {
    if (animatingSpellId && previousAnimatingId.current !== animatingSpellId) {
      previousAnimatingId.current = animatingSpellId;
      const spell = learnedSpells.find((s) => s.id === animatingSpellId);
      if (!spell || !battleSceneRef.current) return;
      const rect = battleSceneRef.current.getBoundingClientRect();

      const color = spellColorMap[spell.animationType] || '#FFF';
      const flying: FlyingSpell = {
        id: spell.id + '-' + Date.now(),
        icon: spell.icon,
        color,
        startX: rect.width * 0.2,
        startY: rect.height * 0.5,
        endX: rect.width * 0.78,
        endY: rect.height * 0.45,
        progress: 0,
        duration: 700,
      };
      setFlyingSpells((prev) => [...prev, flying]);

      const start = performance.now();
      const tick = () => {
        setFlyingSpells((prev) => {
          const list = prev.map((f) =>
            f.id === flying.id
              ? { ...f, progress: Math.min(1, (performance.now() - start) / f.duration) }
              : f
          );
          const item = list.find((f) => f.id === flying.id);
          if (item && item.progress >= 1) {
            // 命中 - 粒子
            if (battleSceneRef.current) {
              const bRect = battleSceneRef.current.getBoundingClientRect();
              particleRef.current?.burst(
                item.endX,
                item.endY,
                [color, '#FFD700', '#FFF', '#FFF'],
                28
              );
            }
            return list.filter((f) => f.id !== flying.id);
          }
          if (item && item.progress < 1) {
            requestAnimationFrame(tick);
          }
          return list;
        });
      };
      requestAnimationFrame(tick);
    }
    if (!animatingSpellId) {
      previousAnimatingId.current = null;
    }
  }, [animatingSpellId, learnedSpells]);

  // HP变化 - 浮动伤害数字
  useEffect(() => {
    if (monster && monster.hp !== previousMonsterHp.current) {
      const diff = previousMonsterHp.current - monster.hp;
      if (diff > 0 && battleSceneRef.current) {
        const rect = battleSceneRef.current.getBoundingClientRect();
        const id = 'dmg-' + Date.now() + '-m';
        setFloatingDamages((prev) => [
          ...prev,
          { id, x: rect.width * 0.78, y: rect.height * 0.4, value: diff, target: 'monster' },
        ]);
        setTimeout(() => {
          setFloatingDamages((prev) => prev.filter((d) => d.id !== id));
        }, 1000);
      }
      previousMonsterHp.current = monster.hp;
    }
  }, [monster?.hp]);

  useEffect(() => {
    if (player.hp !== previousPlayerHp.current) {
      const diff = previousPlayerHp.current - player.hp;
      if (Math.abs(diff) > 0 && battleSceneRef.current) {
        const rect = battleSceneRef.current.getBoundingClientRect();
        const id = 'dmg-' + Date.now() + '-p';
        setFloatingDamages((prev) => [
          ...prev,
          {
            id,
            x: rect.width * 0.22,
            y: rect.height * 0.4,
            value: Math.abs(diff),
            isHeal: diff < 0,
            target: 'player',
          },
        ]);
        setTimeout(() => {
          setFloatingDamages((prev) => prev.filter((d) => d.id !== id));
        }, 1000);
      }
      previousPlayerHp.current = player.hp;
    }
  }, [player.hp]);

  const phaseChip = useMemo(() => {
    switch (phase) {
      case 'player_turn':
        return { label: '你的回合', cls: 'player' };
      case 'player_animating':
        return { label: '施法中…', cls: 'player' };
      case 'enemy_turn':
        return { label: '敌方回合', cls: 'enemy' };
      case 'enemy_animating':
        return { label: '敌方攻击中…', cls: 'enemy' };
      case 'victory':
        return { label: '胜利！', cls: 'victory' };
      case 'defeat':
        return { label: '失败…', cls: 'defeat' };
    }
  }, [phase]);

  const handleSpellClick = useCallback(
    (spell: Spell) => {
      if (!canCast) return;
      castSpell(spell.id);
    },
    [canCast, castSpell]
  );

  return (
    <div className="game-board">
      {/* ===== 合成面板 ===== */}
      <div className="craft-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: 22, color: 'var(--accent-gold)', textShadow: '0 0 12px rgba(255,215,0,0.4)', letterSpacing: 2 }}>
            ⚔️ SpellForge
          </h1>
          <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: 12 }} onClick={restartGame}>
            🔄 重开
          </button>
        </div>

        {/* 符文背包 */}
        <div>
          <div className="backpack-title">🎒 符文背包 · 拖拽到合成槽</div>
          <div className="rune-backpack" style={{ position: 'relative' }}>
            {runeList.map((rune) => (
              <RuneCard key={rune.id} rune={rune} disabled={isCrafting} />
            ))}
            <div ref={craftCenterRef} style={{ position: 'absolute', top: '50%', left: '50%' }} />
            <ParticleEffect ref={craftParticleRef} />
          </div>
        </div>

        {/* 合成面板 */}
        <div>
          <div className="backpack-title">⚗️ 符文合成</div>
          <div className={`craft-slots ${craftFailShake ? 'shake' : ''}`}>
            {craftSlots.map((type, i) => (
              <RuneSlot
                key={i}
                index={i}
                runeType={type as RuneType | null}
                isFail={craftFailShake}
                onDrop={placeRuneInSlot}
                onClick={removeRuneFromSlot}
                disabled={isCrafting}
              />
            ))}
          </div>
        </div>

        {/* 合成按钮/结果 */}
        <div className="btn-row">
          <button
            className="btn"
            disabled={craftSlots.every((s) => s === null) || isCrafting}
            onClick={clearCraftSlots}
          >
            ↩️ 清空
          </button>
        </div>

        <div className="craft-result-area">
          {lastCraftResult && (
            <div className="craft-result-spell">
              <span className="spell-icon-lg">{lastCraftResult.icon}</span>
              <span className="spell-name">学会新法术：{lastCraftResult.name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                ⚔ {lastCraftResult.baseDamage} 伤害 · CD {lastCraftResult.cooldown}
              </span>
            </div>
          )}
        </div>

        {/* 法术列表 */}
        <div className="spell-list-wrapper">
          <div className="section-title">
            ✨ 已学法术 ({learnedSpells.length}) · 点击施放
          </div>
          {learnedSpells.length === 0 ? (
            <div className="spell-empty-hint">
              还没有任何法术，收集符文进行合成吧！
              <br />
              <span style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8, display: 'block' }}>
                提示：4火=炽焰风暴 · 火+火+水+风=暴风雪 · 火水土风=元素爆发
              </span>
            </div>
          ) : (
            <div className="spell-list">
              {learnedSpells.map((spell) => (
                <SpellCard
                  key={spell.id}
                  spell={spell}
                  disabled={!canCast}
                  onClick={() => handleSpellClick(spell)}
                />
              ))}
            </div>
          )}
        </div>

        <BattleLog logs={battleLogs} />
      </div>

      {/* ===== 魔法分界线 ===== */}
      <div className="magic-divider" />

      {/* ===== 战斗面板 ===== */}
      <div className="battle-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="backpack-title" style={{ marginBottom: 0 }}>
            🏰 第 {player.currentStage} 关 {monster?.isBoss && '⚠️ BOSS战'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Lv.{player.level} · HP上限 {player.maxHp} · 防御 {player.defense}
          </div>
        </div>

        <div className="battle-scene" ref={battleSceneRef}>
          {/* 回合指示 */}
          <div className="turn-info">
            <span className={`chip ${phaseChip.cls}`}>{phaseChip.label}</span>
            <span className="chip">回合 {turn}</span>
            {monster?.isBoss && bossSkillCooldown > 0 && (
              <span className="chip boss">BOSS技能 CD {bossSkillCooldown}</span>
            )}
            {isPlayerStunned && <span className="chip boss">💫 眩晕中</span>}
          </div>

          <div className="battle-arena">
            {/* 玩家侧 */}
            <div className="character">
              <HealthBar name={`你 (Lv.${player.level})`} current={player.hp} max={player.maxHp} align="left" />
              <StatusChips effects={player.statusEffects} />
              <PlayerSprite casting={!!animatingSpellId} hit={playerHit} />
            </div>

            {/* 怪物侧 */}
            {monster && (
              <div className="character">
                <HealthBar
                  name={monster.name}
                  current={monster.hp}
                  max={monster.maxHp}
                  align="right"
                />
                <StatusChips effects={monster.statusEffects} />
                <MonsterSprite
                  shape={monster.shape}
                  color={monster.color}
                  isBoss={monster.isBoss}
                  hit={monsterHit}
                />
              </div>
            )}
          </div>

          {/* 法术飞行 */}
          {flyingSpells.map((f) => {
            const t = f.progress;
            const ease = 1 - Math.pow(1 - t, 3);
            const x = f.startX + (f.endX - f.startX) * ease;
            const y =
              f.startY + (f.endY - f.startY) * ease - Math.sin(Math.PI * ease) * 60;
            return (
              <div
                key={f.id}
                className="spell-projectile"
                style={{
                  left: x - 20,
                  top: y - 20,
                  color: f.color,
                  transform: `rotate(${t * 360}deg)`,
                }}
              >
                {f.icon}
              </div>
            );
          })}

          {/* 浮动伤害 */}
          {floatingDamages.map((d) => (
            <div
              key={d.id}
              className={`damage-number ${d.isHeal ? 'heal' : ''}`}
              style={{ left: d.x - 20, top: d.y }}
            >
              {d.isHeal ? '+' : '-'}{d.value}
            </div>
          ))}

          {/* 符文掉落飘动 */}
          {floatingDrops.map((drop) => {
            return (
              <div
                key={drop.id}
                style={{
                  position: 'absolute',
                  right: '22%',
                  top: '35%',
                  fontSize: 28,
                  zIndex: 80,
                  filter: `drop-shadow(0 0 8px ${RUNE_CONFIG[drop.type].color})`,
                  animation: 'drop-float 1.6s ease forwards',
                }}
              >
                {RUNE_CONFIG[drop.type].icon}
              </div>
            );
          })}

          {/* 粒子画布 */}
          <ParticleEffect ref={particleRef} />

          {/* 游戏结束遮罩 */}
          {phase === 'defeat' && (
            <div className="game-overlay">
              <h2 className="defeat">💀 战败</h2>
              <div className="stats">
                你在第 <b style={{ color: 'var(--accent-gold)' }}>{player.currentStage}</b> 关倒下了
                <br />
                学会法术 {learnedSpells.length} 个 · 角色等级 {player.level}
              </div>
              <button className="btn btn-primary" onClick={restartGame}>
                ⚔️ 再战一次
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes drop-float {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(-320px, 60px) scale(0.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
