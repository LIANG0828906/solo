import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

const RARITY_COLORS: Record<string, string> = {
  common: '#b0b0b0',
  uncommon: '#4ecdc4',
  rare: '#5dade2',
  epic: '#bb8fce',
  legendary: '#f8c630',
};

const LOG_COLORS: Record<string, string> = {
  player_attack: '#2dc653',
  monster_attack: '#e63946',
  skill: '#4ecdc4',
  loot: '#f8c630',
  system: '#b0b0b0',
  level_up: '#ff6b9d',
};

function HealthBar({ current, max, label, colorStart, colorEnd, height = 16 }: {
  current: number;
  max: number;
  label: string;
  colorStart: string;
  colorEnd: string;
  height?: number;
}) {
  const percent = Math.max(0, Math.min(100, (current / max) * 100));

  return (
    <div style={{ marginBottom: 8 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 3,
          fontSize: 11,
          color: '#aaaaaa',
        }}
      >
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span>{current} / {max}</span>
      </div>
      <div
        style={{
          width: '100%',
          height,
          background: '#0a0a14',
          borderRadius: height / 2,
          overflow: 'hidden',
          border: '1px solid #2a2a44',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
        }}
      >
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: `linear-gradient(90deg, ${colorStart}, ${colorEnd})`,
            borderRadius: height / 2,
            boxShadow: `0 0 10px ${colorStart}50, inset 0 1px 0 rgba(255,255,255,0.2)`,
            position: 'relative',
          }}
        />
      </div>
    </div>
  );
}

function SkillButton({ skill, index, onClick, isCombatActive }: {
  skill: any;
  index: number;
  onClick: () => void;
  isCombatActive: boolean;
}) {
  const onCooldown = skill.currentCooldown > 0;
  const cooldownPercent = onCooldown ? (skill.currentCooldown / skill.cooldown) * 100 : 0;

  return (
    <motion.button
      whileHover={isCombatActive && !onCooldown ? { scale: 1.08, y: -2 } : {}}
      whileTap={isCombatActive && !onCooldown ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={!isCombatActive || onCooldown}
      className={clsx('skill-button', { 'on-cooldown': onCooldown })}
      style={{
        position: 'relative',
        width: 64,
        height: 64,
        borderRadius: 14,
        border: `2px solid ${skill.color}`,
        background: `linear-gradient(135deg, #1a1a2e, #2a2a4e)`,
        cursor: isCombatActive && !onCooldown ? 'pointer' : 'not-allowed',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        boxShadow: isCombatActive && !onCooldown
          ? `0 0 18px ${skill.color}50, inset 0 1px 0 rgba(255,255,255,0.1)`
          : 'inset 0 1px 0 rgba(255,255,255,0.05)',
        opacity: onCooldown ? 0.6 : 1,
        transition: 'box-shadow 0.2s',
        padding: 0,
      }}
    >
      <div
        style={{
          fontSize: 28,
          lineHeight: 1,
          filter: isCombatActive && !onCooldown
            ? `drop-shadow(0 0 6px ${skill.color})`
            : 'none',
        }}
      >
        {skill.icon}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 2,
          left: 0,
          right: 0,
          fontSize: 10,
          color: skill.color,
          fontWeight: 700,
          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
        }}
      >
        {index + 1}
      </div>

      {onCooldown && (
        <>
          <motion.div
            initial={{ clipPath: 'inset(0% 0 0 0)' }}
            animate={{ clipPath: `inset(${100 - cooldownPercent}% 0 0 0)` }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              pointerEvents: 'none',
            }}
          />
          <svg
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              transform: 'rotate(-90deg)',
              pointerEvents: 'none',
            }}
          >
            <motion.circle
              cx="50%"
              cy="50%"
              r="42%"
              fill="none"
              stroke={skill.color}
              strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 42}`}
              initial={{ strokeDashoffset: 0 }}
              animate={{
                strokeDashoffset: `${(1 - cooldownPercent / 100) * 2 * Math.PI * 42}`,
              }}
              style={{ filter: `drop-shadow(0 0 3px ${skill.color})` }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: 16,
              fontWeight: 800,
              color: '#fff',
              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
            }}
          >
            {skill.currentCooldown}
          </div>
        </>
      )}
    </motion.button>
  );
}

function CombatLog() {
  const { combat } = useGameStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [combat.combatLogs.length]);

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #0f0f1a, #1a1a2e)',
        borderRadius: 12,
        border: '1px solid #2a2a44',
        padding: 10,
        height: 180,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: '#8888aa',
          marginBottom: 6,
          paddingBottom: 6,
          borderBottom: '1px solid #2a2a44',
          fontWeight: 600,
          letterSpacing: 1,
        }}
      >
        📜 战斗日志
      </div>
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <AnimatePresence initial={false}>
          {combat.combatLogs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -15, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 15, height: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                fontSize: 12,
                color: LOG_COLORS[log.type] || '#b0b0b0',
                padding: '3px 6px',
                borderRadius: 4,
                background: `${LOG_COLORS[log.type]}10`,
                borderLeft: `2px solid ${LOG_COLORS[log.type]}50`,
                lineHeight: 1.4,
              }}
            >
              {log.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MonsterDisplay() {
  const { combat } = useGameStore();
  const monster = combat.currentMonster;

  if (!monster) return null;

  const monsterIcons: Record<string, string> = {
    slime: '🟢',
    goblin: '👺',
    skeleton: '💀',
    orc: '👹',
    boss: '🐉',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 16,
        background: monster.isBoss
          ? 'linear-gradient(135deg, #3d1a1a, #2a1a1a)'
          : 'linear-gradient(135deg, #1a1a2e, #2a2a4e)',
        borderRadius: 16,
        border: monster.isBoss ? '2px solid #ffd700' : '1px solid #3a3a5c',
        boxShadow: monster.isBoss
          ? '0 0 30px rgba(255,215,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)'
          : 'inset 0 1px 0 rgba(255,255,255,0.05)',
        minWidth: 200,
      }}
    >
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          rotate: [0, -2, 2, 0],
        }}
        transition={{
          duration: monster.isBoss ? 1.5 : 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          fontSize: monster.isBoss ? 80 : 60,
          marginBottom: 8,
          filter: monster.isBoss
            ? 'drop-shadow(0 0 20px rgba(255,100,100,0.6))'
            : 'drop-shadow(0 4px 12px rgba(230,57,70,0.4))',
        }}
      >
        {monsterIcons[monster.type]}
      </motion.div>

      <div
        style={{
          fontSize: monster.isBoss ? 20 : 16,
          fontWeight: 700,
          color: monster.isBoss ? '#ffd700' : '#e63946',
          marginBottom: 4,
          textShadow: '0 2px 8px rgba(0,0,0,0.5)',
        }}
      >
        {monster.isBoss && '👑 '}{monster.name}
      </div>

      <div
        style={{
          fontSize: 11,
          color: '#8888aa',
          marginBottom: 10,
        }}
      >
        攻击: {monster.attack} | 防御: {monster.defense} | 经验: {monster.expReward}
      </div>

      <div style={{ width: '100%' }}>
        <HealthBar
          current={monster.hp}
          max={monster.maxHp}
          label="❤️ HP"
          colorStart="#e63946"
          colorEnd="#f8c630"
          height={20}
        />
      </div>
    </div>
  );
}

function InventoryPanel() {
  const { player, equipItem, useItem } = useGameStore();

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #0f0f1a, #1a1a2e)',
        borderRadius: 12,
        border: '1px solid #2a2a44',
        padding: 10,
        height: 140,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: '#8888aa',
          marginBottom: 6,
          paddingBottom: 6,
          borderBottom: '1px solid #2a2a44',
          fontWeight: 600,
          letterSpacing: 1,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>🎒 背包</span>
        <span>{player.inventory.length}/20</span>
      </div>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        {player.equippedWeapon && (
          <div
            style={{
              fontSize: 11,
              padding: '4px 8px',
              background: `${RARITY_COLORS[player.equippedWeapon.rarity]}15`,
              borderRadius: 4,
              borderLeft: `2px solid ${RARITY_COLORS[player.equippedWeapon.rarity]}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ color: RARITY_COLORS[player.equippedWeapon.rarity] }}>
              ⚔️ {player.equippedWeapon.name} (+{player.equippedWeapon.attack}攻)
            </span>
            <span style={{ color: '#666', fontSize: 10 }}>装备中</span>
          </div>
        )}
        {player.equippedArmor && (
          <div
            style={{
              fontSize: 11,
              padding: '4px 8px',
              background: `${RARITY_COLORS[player.equippedArmor.rarity]}15`,
              borderRadius: 4,
              borderLeft: `2px solid ${RARITY_COLORS[player.equippedArmor.rarity]}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ color: RARITY_COLORS[player.equippedArmor.rarity] }}>
              🛡️ {player.equippedArmor.name} (+{player.equippedArmor.defense}防)
            </span>
            <span style={{ color: '#666', fontSize: 10 }}>装备中</span>
          </div>
        )}
        {player.inventory.length === 0 && !player.equippedWeapon && !player.equippedArmor ? (
          <div style={{ fontSize: 11, color: '#555', textAlign: 'center', padding: 10 }}>
            背包空空如也...
          </div>
        ) : (
          player.inventory.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ x: 4 }}
              onClick={() => {
                if (item.type === 'potion') {
                  useItem(item.id);
                } else {
                  equipItem(item);
                }
              }}
              style={{
                fontSize: 11,
                padding: '4px 8px',
                background: `${RARITY_COLORS[item.rarity]}10`,
                borderRadius: 4,
                borderLeft: `2px solid ${RARITY_COLORS[item.rarity]}50`,
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'background 0.15s',
              }}
            >
              <span style={{ color: RARITY_COLORS[item.rarity] }}>
                {item.type === 'weapon' ? '⚔️' : item.type === 'armor' ? '🛡️' : '🧪'} {item.name}
                {item.attack ? ` (+${item.attack}攻)` : ''}
                {item.defense ? ` (+${item.defense}防)` : ''}
                {item.hpRestore ? ` (+${item.hpRestore}HP)` : ''}
                {item.manaRestore ? ` (+${item.manaRestore}MP)` : ''}
              </span>
              <span style={{ color: '#666', fontSize: 9 }}>
                {item.type === 'potion' ? '使用' : '装备'}
              </span>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

export default function CombatUI() {
  const { player, combat } = useGameStore();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        width: 340,
        padding: 16,
        background: 'linear-gradient(135deg, #12121f, #1a1a2e)',
        borderRadius: 16,
        border: '2px solid #3b3b5c',
        boxShadow: '0 10px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          padding: '8px 12px',
          background: 'linear-gradient(90deg, #1a1a2e, #2a2a4e)',
          borderRadius: 10,
          border: '1px solid #3a3a5c',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 4,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#4ecdc4',
              textShadow: '0 0 10px rgba(78,205,196,0.4)',
            }}
          >
            🧙‍♂️ 冒险者 Lv.{player.stats.level}
          </span>
          <span style={{ fontSize: 12, color: '#f8c630' }}>💰 {player.stats.gold}</span>
        </div>

        <HealthBar
          current={player.stats.hp}
          max={player.stats.maxHp}
          label="❤️ 生命"
          colorStart="#e63946"
          colorEnd="#f8c630"
        />
        <HealthBar
          current={player.stats.mp}
          max={player.stats.maxMp}
          label="💧 法力"
          colorStart="#2196f3"
          colorEnd="#4ecdc4"
        />
        <HealthBar
          current={player.stats.exp}
          max={player.stats.expToNext}
          label="⭐ 经验"
          colorStart="#9b59b6"
          colorEnd="#ff6b9d"
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            color: '#8888aa',
            marginTop: 4,
            paddingTop: 4,
            borderTop: '1px solid #2a2a44',
          }}
        >
          <span>⚔️ 攻击: {player.stats.attack}</span>
          <span>🛡️ 防御: {player.stats.defense}</span>
          <span>💥 暴击: {Math.round(player.stats.critRate * 100)}%</span>
        </div>
      </div>

      {combat.isInCombat && (
        <MonsterDisplay />
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 10,
          padding: 10,
          background: 'linear-gradient(180deg, #0f0f1a, #1a1a2e)',
          borderRadius: 12,
          border: '1px solid #2a2a44',
        }}
      >
        {player.skills.map((skill, i) => (
          <SkillButton
            key={skill.id}
            skill={skill}
            index={i}
            onClick={() => {}}
            isCombatActive={combat.isInCombat}
          />
        ))}
      </div>

      <div
        style={{
          fontSize: 10,
          color: '#666688',
          textAlign: 'center',
          marginTop: -6,
        }}
      >
        按 1-4 释放技能 · WASD 移动
      </div>

      <CombatLog />

      <InventoryPanel />
    </div>
  );
}
