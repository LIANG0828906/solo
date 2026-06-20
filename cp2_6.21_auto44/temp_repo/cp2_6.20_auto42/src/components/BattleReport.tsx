import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useGameStore, SKILLS, getClassColor, getClassColorLight, CLASS_DATA } from '@/store/gameStore';
import type { BattleLog } from '@/store/gameStore';

function useCountUp(target: number, duration = 1, delay = 0): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let rafId: number;
    let timeoutId: number;

    const start = () => {
      const step = (timestamp: number) => {
        if (startTimestamp === null) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) {
          rafId = requestAnimationFrame(step);
        }
      };
      rafId = requestAnimationFrame(step);
    };

    if (delay > 0) {
      timeoutId = window.setTimeout(start, delay * 1000);
    } else {
      start();
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [target, duration, delay]);

  return value;
}

function StatCard({
  label,
  value,
  icon,
  animated,
  delay = 0,
  suffix = '',
}: {
  label: string;
  value: number;
  icon: string;
  animated?: boolean;
  delay?: number;
  suffix?: string;
}) {
  const displayValue = useCountUp(value, 1, delay);

  return (
    <motion.div
      className="glass-card p-4 flex flex-col items-center gap-1"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: delay + 0.1 }}
    >
      <span className="text-2xl">{icon}</span>
      <span className="font-display text-xl text-gold">
        {animated ? displayValue : value}
        {suffix}
      </span>
      <span className="text-xs text-gray-500">{label}</span>
    </motion.div>
  );
}

function SkillBar({
  name,
  count,
  maxCount,
  color,
  onClick,
  selected,
}: {
  name: string;
  count: number;
  maxCount: number;
  color: string;
  onClick: () => void;
  selected: boolean;
}) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <motion.div
      className={`cursor-pointer transition-all duration-200 rounded p-1 -m-1 ${
        selected ? 'bg-gold/10' : 'hover:bg-white/5'
      }`}
      onClick={onClick}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`text-xs w-20 truncate ${selected ? 'text-gold' : 'text-gray-400'}`}
        >
          {name}
        </span>
        <span
          className={`font-display text-xs ${selected ? 'text-gold-light' : 'text-gold'}`}
        >
          {count}
        </span>
      </div>
      <div className="h-4 bg-black/40 rounded overflow-hidden">
        <motion.div
          className="h-full rounded"
          style={{
            backgroundColor: color,
            boxShadow: selected ? `0 0 12px ${color}` : 'none',
          }}
          initial={{ width: 0 }}
          animate={{
            width: `${pct}%`,
            filter: selected ? 'brightness(1.3)' : 'brightness(1)',
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}

export default function BattleReport() {
  const battleRecord = useGameStore((s) => s.battleRecord);
  const resetGame = useGameStore((s) => s.resetGame);
  const setPhase = useGameStore((s) => s.setPhase);

  const [highlightedSkillId, setHighlightedSkillId] = useState<string | null>(null);

  if (!battleRecord) return null;

  const { player, enemy, logs } = battleRecord;
  const playerColor = getClassColor(player.classId);
  const playerColorLight = getClassColorLight(player.classId);
  const enemyColor = getClassColor(enemy.classId);
  const enemyColorLight = getClassColorLight(enemy.classId);

  const playerHitRate = battleRecord.playerTotalAttacks > 0
    ? Math.round((battleRecord.playerHitCount / battleRecord.playerTotalAttacks) * 100)
    : 0;
  const enemyHitRate = battleRecord.enemyTotalAttacks > 0
    ? Math.round((battleRecord.enemyHitCount / battleRecord.enemyTotalAttacks) * 100)
    : 0;

  const mvpSkill = SKILLS.find((s) => s.id === battleRecord.mvpSkillId);
  const mvpColor = mvpSkill ? getClassColor(mvpSkill.classId) : '#d4a843';

  const allUsageEntries = [
    ...Object.entries(battleRecord.playerSkillUsage),
    ...Object.entries(battleRecord.enemySkillUsage),
  ];
  const maxUsage = Math.max(...allUsageEntries.map(([, c]) => c), 1);

  const handleBarClick = (skillId: string) => {
    setHighlightedSkillId((prev) => (prev === skillId ? null : skillId));
  };

  return (
    <motion.div
      className="w-full max-w-4xl"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="text-center mb-6">
        <motion.div
          className="inline-block"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, ease: 'easeOut', duration: 0.5 }}
        >
          <h2
            className="font-display text-3xl font-bold mb-2"
            style={{
              color: battleRecord.winner === 'player' ? playerColorLight : enemyColorLight,
            }}
          >
            {battleRecord.winner === 'player' ? '胜利' : '失败'}
          </h2>
        </motion.div>
        <p className="text-gray-400 text-sm">
          {battleRecord.winner === 'player' ? '你的技能搭配取得了胜利！' : '敌方更胜一筹，试试新的搭配？'}
        </p>
      </div>

      <div className="glass-card p-5 mb-6">
        <h3 className="font-display text-sm text-gold mb-4 tracking-wider text-center">— 数据总览 —</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="总回合" value={battleRecord.totalRounds} icon="⚔️" animated delay={0.1} />
          <StatCard
            label="玩家伤害"
            value={battleRecord.playerTotalDamage}
            icon="💥"
            animated
            delay={0.2}
          />
          <StatCard
            label="敌方伤害"
            value={battleRecord.enemyTotalDamage}
            icon="🛡️"
            animated
            delay={0.3}
          />
          <StatCard label="玩家命中率" value={playerHitRate} icon="🎯" animated delay={0.4} suffix="%" />
          <StatCard label="敌方命中率" value={enemyHitRate} icon="🎯" animated delay={0.5} suffix="%" />
          <StatCard
            label="MVP技能次数"
            value={mvpSkill ? logs.filter(l => l.skillId === mvpSkill.id).length : 0}
            icon="🏆"
            animated
            delay={0.6}
          />
        </div>
      </div>

      {mvpSkill && (
        <motion.div
          className="glass-card p-4 mb-6 flex items-center gap-4"
          style={{
            borderLeft: `4px solid ${mvpColor}`,
            background: 'linear-gradient(90deg, rgba(212,168,67,0.08), rgba(26,35,50,0.7))',
          }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35, duration: 0.5, ease: 'easeOut' }}
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Trophy size={36} className="text-gold" />
          </motion.div>
          <div className="flex-1">
            <p className="font-display text-gold text-sm mb-0.5">MVP 技能 · 输出最高</p>
            <p className="text-white font-bold text-lg">{mvpSkill.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{mvpSkill.description}</p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: playerColor, boxShadow: `0 0 8px ${playerColor}80` }}
            />
            <span className="font-display text-sm" style={{ color: playerColorLight }}>
              {CLASS_DATA[player.classId].name}（玩家）
            </span>
          </div>
          {Object.entries(battleRecord.playerSkillUsage).map(([id, count]) => {
            const skill = SKILLS.find((s) => s.id === id);
            return skill ? (
              <div key={id} className="mb-2">
                <SkillBar
                  name={skill.name}
                  count={count}
                  maxCount={maxUsage}
                  color={playerColor}
                  onClick={() => handleBarClick(id)}
                  selected={highlightedSkillId === id}
                />
              </div>
            ) : null;
          })}
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: enemyColor, boxShadow: `0 0 8px ${enemyColor}80` }}
            />
            <span className="font-display text-sm" style={{ color: enemyColorLight }}>
              {CLASS_DATA[enemy.classId].name}（敌方）
            </span>
          </div>
          {Object.entries(battleRecord.enemySkillUsage).map(([id, count]) => {
            const skill = SKILLS.find((s) => s.id === id);
            return skill ? (
              <div key={id} className="mb-2">
                <SkillBar
                  name={skill.name}
                  count={count}
                  maxCount={maxUsage}
                  color={enemyColor}
                  onClick={() => handleBarClick(id)}
                  selected={highlightedSkillId === id}
                />
              </div>
            ) : null;
          })}
        </div>
      </div>

      <div className="glass-card p-4 mb-6 max-h-60 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-sm text-gold">战斗日志</h3>
          {highlightedSkillId && (
            <button
              onClick={() => setHighlightedSkillId(null)}
              className="text-xs text-gray-400 hover:text-gold transition-colors"
            >
              清除高亮
            </button>
          )}
        </div>
        <div className="space-y-1">
          {logs.map((log: BattleLog, i: number) => {
            const actorColor = log.isPlayer ? playerColor : enemyColor;
            const isHighlighted = highlightedSkillId === log.skillId;
            return (
              <div
                key={i}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-all duration-200 ${
                  isHighlighted
                    ? 'bg-gold/15 scale-[1.01]'
                    : highlightedSkillId
                      ? 'opacity-40'
                      : ''
                }`}
                style={{
                  borderLeft: isHighlighted ? `4px solid #d4a843` : `3px solid ${actorColor}`,
                }}
              >
                <span className="text-gold font-display w-8">R{log.round}</span>
                <span style={{ color: actorColor }}>{log.actorName}</span>
                <span className="text-gray-500">{log.skillName}</span>
                {log.healAmount > 0 && (
                  <span className="text-green-400">+{log.healAmount}HP</span>
                )}
                {log.damage > 0 && log.hit && (
                  <span className="text-red-400">-{log.damage}</span>
                )}
                {!log.hit && <span className="text-gray-600">未命中</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={resetGame}
          className="px-6 py-2 rounded-lg font-display text-sm border border-gray-600 text-gray-300 hover:border-gold/50 hover:text-gold transition-colors"
        >
          重新开始
        </button>
        <button
          onClick={() => setPhase('skill-tree')}
          className="px-6 py-2 rounded-lg font-display text-sm font-bold text-deep"
          style={{ background: 'linear-gradient(135deg, #d4a843, #f0d68a)' }}
        >
          调整技能再战
        </button>
      </div>
    </motion.div>
  );
}
