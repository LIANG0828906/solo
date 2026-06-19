import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore, SKILLS, getClassColor, getClassColorLight, CLASS_DATA } from '@/store/gameStore';
import type { BattleLog } from '@/store/gameStore';

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <motion.div
      className="glass-card p-4 flex flex-col items-center gap-1"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    >
      <span className="text-2xl">{icon}</span>
      <span className="font-display text-xl text-gold">{value}</span>
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
  highlight,
}: {
  name: string;
  count: number;
  maxCount: number;
  color: string;
  onClick: () => void;
  highlight: boolean;
}) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div
      className={`cursor-pointer transition-all duration-200 ${highlight ? 'ring-1 ring-gold/50' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs text-gray-400 w-20 truncate">{name}</span>
        <span className="font-display text-xs text-gold">{count}</span>
      </div>
      <div className="h-4 bg-black/40 rounded overflow-hidden">
        <motion.div
          className="h-full rounded"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export default function BattleReport() {
  const battleRecord = useGameStore((s) => s.battleRecord);
  const resetGame = useGameStore((s) => s.resetGame);
  const setPhase = useGameStore((s) => s.setPhase);
  const setHighlightedLogRound = useGameStore((s) => s.setHighlightedLogRound);
  const highlightedLogRound = useGameStore((s) => s.highlightedLogRound);

  const [filterRound, setFilterRound] = useState<number | null>(null);

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

  const filteredLogs = filterRound !== null
    ? logs.filter((l) => l.round === filterRound)
    : logs;

  const handleBarClick = (skillId: string) => {
    const logEntry = logs.find((l) => l.skillId === skillId);
    if (logEntry) {
      setFilterRound(logEntry.round);
      setHighlightedLogRound(logEntry.round);
    }
  };

  return (
    <motion.div
      className="w-full max-w-4xl"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        duration: 0.6,
        type: 'spring',
        stiffness: 120,
        damping: 18,
      }}
    >
      <div className="text-center mb-6">
        <motion.div
          className="inline-block"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.15 }}
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
        <h3 className="font-display text-sm text-gold mb-4 tracking-wider">— 数据总览 —</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="总回合" value={battleRecord.totalRounds} icon="⚔️" />
          <StatCard
            label="玩家伤害"
            value={battleRecord.playerTotalDamage}
            icon="💥"
          />
          <StatCard
            label="敌方伤害"
            value={battleRecord.enemyTotalDamage}
            icon="🛡️"
          />
          <StatCard label="玩家命中率" value={`${playerHitRate}%`} icon="🎯" />
          <StatCard label="敌方命中率" value={`${enemyHitRate}%`} icon="🎯" />
          <StatCard
            label="MVP技能"
            value={mvpSkill?.name ?? '-'}
            icon="🏆"
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
          transition={{ delay: 0.35 }}
        >
          <span className="text-3xl">🏆</span>
          <div className="flex-1">
            <p className="font-display text-gold text-sm mb-0.5">MVP 技能 · 输出最高</p>
            <p className="text-white font-bold">{mvpSkill.name}</p>
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
                  highlight={filterRound !== null}
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
                  highlight={filterRound !== null}
                />
              </div>
            ) : null;
          })}
        </div>
      </div>

      <div className="glass-card p-4 mb-6 max-h-60 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-sm text-gold">战斗日志</h3>
          {filterRound !== null && (
            <button
              onClick={() => { setFilterRound(null); setHighlightedLogRound(null); }}
              className="text-xs text-gray-400 hover:text-gold transition-colors"
            >
              清除筛选
            </button>
          )}
        </div>
        <div className="space-y-1">
          {filteredLogs.map((log: BattleLog, i: number) => {
            const actorColor = log.isPlayer ? playerColor : enemyColor;
            const isHighlighted = highlightedLogRound === log.round;
            return (
              <div
                key={i}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-all duration-200 ${
                  isHighlighted ? 'bg-gold/10' : ''
                }`}
                style={{ borderLeft: `3px solid ${actorColor}` }}
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
