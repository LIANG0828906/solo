import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, SKILLS, getSkillsForClass, getClassColor, Skill, ClassId, CLASS_DATA } from '@/store/gameStore';

const NODE_SIZE = 60;
const X_SPACING = 160;
const Y_SPACING = 90;
const PADDING = 50;

function getNodePosition(skill: Skill) {
  return {
    x: PADDING + skill.position.x * X_SPACING,
    y: PADDING + skill.position.y * Y_SPACING,
  };
}

function SkillNode({
  skill,
  isUnlocked,
  canUnlock,
  classColor,
  onClick,
}: {
  skill: Skill;
  isUnlocked: boolean;
  canUnlock: boolean;
  classColor: string;
  onClick: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`absolute rounded-full flex items-center justify-center cursor-pointer select-none
        ${isUnlocked ? 'skill-node-unlocked' : ''}
      `}
      style={{
        width: NODE_SIZE,
        height: NODE_SIZE,
        left: getNodePosition(skill).x - NODE_SIZE / 2,
        top: getNodePosition(skill).y - NODE_SIZE / 2,
        border: isUnlocked
          ? `3px solid #d4a843`
          : canUnlock
            ? `2px solid rgba(212, 168, 67, 0.5)`
            : `2px solid rgba(100, 100, 100, 0.3)`,
        background: isUnlocked
          ? `radial-gradient(circle, ${classColor}44, ${classColor}22)`
          : 'rgba(55, 65, 81, 0.5)',
        boxShadow: isUnlocked ? '0 0 12px rgba(212, 168, 67, 0.5)' : 'none',
      }}
    >
      <span
        className={`font-display text-xs font-bold ${isUnlocked ? 'text-gold-light' : canUnlock ? 'text-gold/70' : 'text-gray-500'}`}
      >
        {skill.name.slice(0, 2)}
      </span>
    </motion.div>
  );
}

function SkillPopup({
  skill,
  isUnlocked,
  canUnlock,
  classColor,
  onUnlock,
  onClose,
}: {
  skill: Skill;
  isUnlocked: boolean;
  canUnlock: boolean;
  classColor: string;
  onUnlock: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60" />
      <motion.div
        className="relative glass-card p-6 w-80"
        style={{ background: '#1a2332', border: '1px solid #d4a843' }}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <h3 className="font-display text-lg text-gold mb-1">{skill.name}</h3>
        <p className="text-sm text-gray-300 mb-4">{skill.description}</p>

        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
          {skill.damage > 0 && (
            <div className="text-gray-400">
              伤害: <span className="font-display text-red-400">{skill.damage}</span>
            </div>
          )}
          {skill.healAmount > 0 && (
            <div className="text-gray-400">
              治疗: <span className="font-display text-green-400">{skill.healAmount}</span>
            </div>
          )}
          <div className="text-gray-400">
            冷却: <span className="font-display text-gold">{skill.cooldown}</span>
          </div>
          <div className="text-gray-400">
            类型: <span style={{ color: classColor }}>{skill.type}</span>
          </div>
        </div>

        <div className="flex gap-3">
          {!isUnlocked && canUnlock && (
            <button
              onClick={onUnlock}
              className="flex-1 py-2 rounded-lg font-display text-sm text-deep font-bold"
              style={{ background: 'linear-gradient(135deg, #d4a843, #f0d68a)' }}
            >
              解锁
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg font-display text-sm text-gray-300 border border-gray-600 hover:border-gold/50 transition-colors"
          >
            关闭
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function SkillTree() {
  const character = useGameStore((s) => s.character);
  const unlockSkill = useGameStore((s) => s.unlockSkill);
  const resetSkills = useGameStore((s) => s.resetSkills);
  const generateEnemyAndStart = useGameStore((s) => s.generateEnemyAndStart);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const classId = character?.classId as ClassId;
  const classSkills = useMemo(() => getSkillsForClass(classId), [classId]);
  const classColor = getClassColor(classId);

  const unlockedIds = new Set(character?.unlockedSkillIds ?? []);

  const canUnlock = (skill: Skill) => {
    if (!character || character.skillPoints <= 0) return false;
    if (unlockedIds.has(skill.id)) return false;
    if (skill.prerequisiteId && !unlockedIds.has(skill.prerequisiteId)) return false;
    return true;
  };

  const svgWidth = PADDING * 2 + 3 * X_SPACING + NODE_SIZE;
  const svgHeight = PADDING * 2 + 4 * Y_SPACING;

  const connections = useMemo(() => {
    return classSkills
      .filter((s) => s.prerequisiteId)
      .map((s) => {
        const parent = SKILLS.find((p) => p.id === s.prerequisiteId)!;
        return { from: getNodePosition(parent), to: getNodePosition(s) };
      });
  }, [classSkills]);

  if (!character) return null;

  return (
    <div className="flex flex-col items-center w-full h-full p-4">
      <div className="relative w-full mb-4">
        <h2 className="font-display text-xl text-gold text-center">
          {CLASS_DATA[classId].icon} {CLASS_DATA[classId].name} 技能树
        </h2>
        <div className="absolute top-0 right-0 font-display text-gold">
          技能点: <span className="text-gold-light text-lg">{character.skillPoints}</span>
        </div>
      </div>

      <div className="glass-card p-4 overflow-auto flex-1 w-full max-w-3xl">
        <div className="relative" style={{ width: svgWidth, height: svgHeight }}>
          <svg
            className="absolute inset-0 pointer-events-none"
            width={svgWidth}
            height={svgHeight}
          >
            {connections.map((conn, i) => (
              <line
                key={i}
                x1={conn.from.x}
                y1={conn.from.y}
                x2={conn.to.x}
                y2={conn.to.y}
                stroke="rgba(212, 168, 67, 0.25)"
                strokeWidth={2}
                strokeDasharray="6 4"
              />
            ))}
          </svg>

          {classSkills.map((skill) => (
            <SkillNode
              key={skill.id}
              skill={skill}
              isUnlocked={unlockedIds.has(skill.id)}
              canUnlock={canUnlock(skill)}
              classColor={classColor}
              onClick={() => setSelectedSkill(skill)}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-4 mt-4">
        <button
          onClick={resetSkills}
          className="px-6 py-2 rounded-lg font-display text-sm border border-gray-600 text-gray-300 hover:border-gold/50 hover:text-gold transition-colors"
        >
          重置技能
        </button>
        <button
          onClick={generateEnemyAndStart}
          className="px-6 py-2 rounded-lg font-display text-sm font-bold text-deep"
          style={{ background: 'linear-gradient(135deg, #d4a843, #f0d68a)' }}
        >
          进入战斗
        </button>
      </div>

      <AnimatePresence>
        {selectedSkill && (
          <SkillPopup
            skill={selectedSkill}
            isUnlocked={unlockedIds.has(selectedSkill.id)}
            canUnlock={canUnlock(selectedSkill)}
            classColor={classColor}
            onUnlock={() => {
              unlockSkill(selectedSkill.id);
              setSelectedSkill(null);
            }}
            onClose={() => setSelectedSkill(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
