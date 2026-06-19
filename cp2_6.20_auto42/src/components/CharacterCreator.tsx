import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore, CLASS_DATA, SKILLS, getSkillsForClass, ClassId } from '@/store/gameStore';

const classIds: ClassId[] = ['warrior', 'mage', 'assassin'];

export default function CharacterCreator() {
  const createCharacter = useGameStore((s) => s.createCharacter);
  const [selected, setSelected] = useState<ClassId | null>(null);

  return (
    <div className="w-full max-w-4xl">
      <motion.h2
        className="font-display text-2xl text-center text-gold mb-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        选择你的职业
      </motion.h2>
      <p className="text-center text-gray-400 text-sm mb-8">
        每个职业拥有独特的初始属性和技能树
      </p>

      <div className="grid grid-cols-3 gap-6 mb-8">
        {classIds.map((id, idx) => {
          const cd = CLASS_DATA[id];
          const skills = getSkillsForClass(id).filter(s => s.isBase);
          const isSelected = selected === id;

          return (
            <motion.div
              key={id}
              className={`glass-card p-5 cursor-pointer transition-all duration-300 ${
                isSelected ? 'ring-2' : 'hover:scale-[1.02]'
              }`}
              style={{
                borderColor: isSelected ? cd.color : undefined,
                boxShadow: isSelected ? `0 0 20px ${cd.color}40` : undefined,
                animationDelay: `${idx * 0.1}s`,
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.15 }}
              onClick={() => setSelected(id)}
              whileHover={{ scale: isSelected ? 1 : 1.03 }}
            >
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                  style={{
                    border: `3px solid ${cd.color}`,
                    boxShadow: `0 0 15px ${cd.color}30`,
                    background: 'rgba(0,0,0,0.3)',
                  }}
                >
                  {cd.icon}
                </div>
                <h3
                  className="font-display text-lg font-bold"
                  style={{ color: cd.colorLight }}
                >
                  {cd.name}
                </h3>

                <div className="w-full space-y-1.5 text-xs">
                  {[
                    { label: 'HP', value: cd.baseHp, max: 120, color: '#22c55e' },
                    { label: 'ATK', value: cd.baseAtk, max: 25, color: '#ef4444' },
                    { label: 'DEF', value: cd.baseDef, max: 15, color: '#3b82f6' },
                    { label: 'SPD', value: cd.baseSpd, max: 18, color: '#eab308' },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center gap-2">
                      <span className="text-gray-500 w-8 font-display">{stat.label}</span>
                      <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(stat.value / stat.max) * 100}%`,
                            backgroundColor: stat.color,
                          }}
                        />
                      </div>
                      <span className="text-gray-300 font-display w-6 text-right">
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="w-full border-t border-white/10 pt-3 mt-1">
                  <p className="text-xs text-gray-500 mb-2 font-display">基础技能</p>
                  {skills.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between text-xs py-0.5"
                    >
                      <span style={{ color: cd.colorLight }}>{s.name}</span>
                      <span className="text-gray-500">{s.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        className="flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: selected ? 1 : 0.3 }}
      >
        <button
          disabled={!selected}
          onClick={() => selected && createCharacter(selected)}
          className="px-10 py-3 rounded-xl font-display text-sm font-bold transition-all duration-300 disabled:cursor-not-allowed"
          style={{
            background: selected
              ? `linear-gradient(135deg, ${CLASS_DATA[selected].color}, ${CLASS_DATA[selected].colorLight})`
              : 'rgba(100,100,100,0.3)',
            color: selected ? '#0a0e27' : '#666',
            boxShadow: selected ? `0 0 20px ${CLASS_DATA[selected].color}40` : 'none',
          }}
        >
          确认选择
        </button>
      </motion.div>
    </div>
  );
}
