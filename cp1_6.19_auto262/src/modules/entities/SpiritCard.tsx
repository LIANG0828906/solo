import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SpiritOnBoard } from '../game/GameStore';
import { ELEMENT_COLORS, ELEMENT_ICONS, ELEMENT_NAMES, SPIRIT_TEMPLATES } from './spiritData';

interface SpiritCardProps {
  spirit: SpiritOnBoard;
  isSelected: boolean;
  onClick: () => void;
  onSkillClick?: (skillId: string) => void;
  selectedSkill: string | null;
}

const RADAR_SIZE = 60;
const RADAR_CENTER = RADAR_SIZE / 2;
const RADAR_RADIUS = RADAR_SIZE / 2 - 8;

const STAT_LABELS = ['生命', '攻击', '防御', '速度', '范围', '特性'];

const RadarChart: React.FC<{ spirit: SpiritOnBoard }> = ({ spirit }) => {
  const template = SPIRIT_TEMPLATES.find(t => t.element === spirit.element);
  if (!template) return null;

  const stats = [
    spirit.stats.hp / 120,
    spirit.stats.attack / 30,
    spirit.stats.defense / 20,
    spirit.stats.speed / 10,
    spirit.stats.range / 4,
    spirit.stats.special / 100
  ];

  const points = stats.map((value, i) => {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    const r = value * RADAR_RADIUS;
    return {
      x: RADAR_CENTER + r * Math.cos(angle),
      y: RADAR_CENTER + r * Math.sin(angle)
    };
  });

  const gridPoints = [0.33, 0.66, 1].map(scale =>
    Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
      const r = scale * RADAR_RADIUS;
      return `${RADAR_CENTER + r * Math.cos(angle)},${RADAR_CENTER + r * Math.sin(angle)}`;
    }).join(' ')
  );

  const axisLines = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    return {
      x1: RADAR_CENTER,
      y1: RADAR_CENTER,
      x2: RADAR_CENTER + RADAR_RADIUS * Math.cos(angle),
      y2: RADAR_CENTER + RADAR_RADIUS * Math.sin(angle),
      label: STAT_LABELS[i],
      labelX: RADAR_CENTER + (RADAR_RADIUS + 10) * Math.cos(angle),
      labelY: RADAR_CENTER + (RADAR_RADIUS + 10) * Math.sin(angle)
    };
  });

  return (
    <svg width={RADAR_SIZE + 30} height={RADAR_SIZE + 30} className="block">
      {gridPoints.map((points, i) => (
        <polygon
          key={`grid-${i}`}
          points={points}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1"
        />
      ))}
      
      {axisLines.map((line, i) => (
        <g key={`axis-${i}`}>
          <line
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
          />
          <text
            x={line.labelX + 15}
            y={line.labelY + 15}
            fill="rgba(255,255,255,0.6)"
            fontSize="8"
            textAnchor="middle"
          >
            {line.label}
          </text>
        </g>
      ))}
      
      <polygon
        points={points.map(p => `${p.x},${p.y}`).join(' ')}
        fill={ELEMENT_COLORS[spirit.element]}
        fillOpacity="0.3"
        stroke={ELEMENT_COLORS[spirit.element]}
        strokeWidth="2"
      />
      
      {points.map((p, i) => (
        <circle
          key={`point-${i}`}
          cx={p.x}
          cy={p.y}
          r="3"
          fill={ELEMENT_COLORS[spirit.element]}
          stroke="#FFF"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
};

export const SpiritCard: React.FC<SpiritCardProps> = ({
  spirit,
  isSelected,
  onClick,
  onSkillClick,
  selectedSkill
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const elementColor = ELEMENT_COLORS[spirit.element];
  const elementIcon = ELEMENT_ICONS[spirit.element];
  const elementName = ELEMENT_NAMES[spirit.element];
  const template = SPIRIT_TEMPLATES.find(t => t.element === spirit.element);

  const canAct = spirit.canAct && spirit.owner === 'player';
  const canMove = canAct && !spirit.hasMoved;
  const canAttack = canAct && !spirit.hasAttacked;

  return (
    <motion.div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        layout
        onClick={onClick}
        className={`
          w-20 h-20 rounded-xl cursor-pointer overflow-hidden
          ${canAct ? 'can-act' : ''}
          ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent' : ''}
        `}
        style={{
          backgroundColor: elementColor,
          transition: 'transform 0.2s ease'
        }}
        whileHover={{ x: 6 }}
        whileTap={{ scale: 0.98 }}
        animate={{
          x: isHovered ? 6 : 0,
          scale: isSelected ? 1.05 : 1
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        <div className="relative w-full h-full p-2">
          <div
            className="absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center text-sm shadow-lg"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          >
            {elementIcon}
          </div>

          <div className="absolute top-1 right-1 text-[10px] font-bold bg-black/30 px-1 rounded">
            {elementName}
          </div>

          <div className="mt-5 text-center">
            <div className="text-xs font-bold text-white drop-shadow-md truncate">
              {spirit.name}
            </div>
            <div className="text-[10px] text-white/80 mt-0.5">
              ❤️{spirit.stats.hp} ⚔️{spirit.stats.attack} 🛡️{spirit.stats.defense}
            </div>
          </div>

          <div className="absolute bottom-1 left-1 right-1">
            <div className="h-1 bg-black/30 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(spirit.stats.hp / spirit.stats.maxHp) * 100}%`,
                  backgroundColor: spirit.stats.hp / spirit.stats.maxHp > 0.5 ? '#4ADE80' : '#EF4444'
                }}
              />
            </div>
          </div>

          {(canMove || canAttack) && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse border-2 border-white" />
          )}
        </div>
      </motion.div>

      <div className="text-[9px] text-white/60 mt-1 px-1 leading-tight">
        {spirit.passiveSkill}
      </div>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: -10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute left-full top-0 ml-3 z-50 w-64 glass-panel p-4 pointer-events-none"
          >
            <div className="flex items-start gap-3 mb-3">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                style={{ backgroundColor: elementColor }}
              >
                {elementIcon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white">{spirit.name}</div>
                <div className="text-xs text-white/60">
                  Lv.{spirit.level} {elementName}属性
                </div>
                <div className="text-xs text-white/80 mt-1">
                  经验: {spirit.experience}/100
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
              <div className="bg-white/5 rounded p-2 text-center">
                <div className="text-red-400">❤️ 生命</div>
                <div className="font-bold">{spirit.stats.hp}/{spirit.stats.maxHp}</div>
              </div>
              <div className="bg-white/5 rounded p-2 text-center">
                <div className="text-orange-400">⚔️ 攻击</div>
                <div className="font-bold">{spirit.stats.attack}</div>
              </div>
              <div className="bg-white/5 rounded p-2 text-center">
                <div className="text-blue-400">🛡️ 防御</div>
                <div className="font-bold">{spirit.stats.defense}</div>
              </div>
              <div className="bg-white/5 rounded p-2 text-center">
                <div className="text-green-400">💨 速度</div>
                <div className="font-bold">{spirit.stats.speed}</div>
              </div>
              <div className="bg-white/5 rounded p-2 text-center">
                <div className="text-purple-400">🎯 范围</div>
                <div className="font-bold">{spirit.stats.range}</div>
              </div>
              <div className="bg-white/5 rounded p-2 text-center">
                <div className="text-yellow-400">✨ 特性</div>
                <div className="font-bold">{spirit.stats.special}</div>
              </div>
            </div>

            <div className="mb-3">
              <div className="text-xs text-white/60 mb-1">被动技能</div>
              <div className="text-xs text-white/80 bg-white/5 rounded p-2">
                <span className="text-yellow-400 font-bold">{spirit.passiveSkill}：</span>
                {spirit.passiveDescription}
              </div>
            </div>

            <div className="mb-3">
              <div className="text-xs text-white/60 mb-1">主动技能</div>
              {spirit.activeSkills.map(skill => (
                <div
                  key={skill.id}
                  className={`
                    text-xs bg-white/5 rounded p-2 mb-1
                    ${skill.currentCooldown > 0 ? 'opacity-50' : ''}
                    ${selectedSkill === skill.id ? 'ring-1 ring-white/50' : ''}
                  `}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">{skill.name}</span>
                    <span className="text-white/60">
                      {skill.currentCooldown > 0 ? `冷却: ${skill.currentCooldown}` : '可用'}
                    </span>
                  </div>
                  <div className="text-white/70 mt-0.5">{skill.description}</div>
                  <div className="text-white/50 mt-0.5">
                    伤害: {skill.damage > 0 ? `${Math.round(skill.damage * 100)}%` : skill.damage < 0 ? `治疗 ${Math.abs(skill.damage)}` : '特殊'} | 范围: {skill.range}
                  </div>
                </div>
              ))}
            </div>

            {template && (
              <div>
                <div className="text-xs text-white/60 mb-1">属性成长</div>
                <div className="text-[10px] text-white/70 flex flex-wrap gap-1">
                  <span>❤️+{template.growthCurve.hp}</span>
                  <span>⚔️+{template.growthCurve.attack}</span>
                  <span>🛡️+{template.growthCurve.defense}</span>
                  <span>💨+{template.growthCurve.speed}</span>
                  <span>🎯+{template.growthCurve.range}</span>
                  <span>✨+{template.growthCurve.special}</span>
                </div>
              </div>
            )}

            <div className="mt-3 flex justify-center">
              <RadarChart spirit={spirit} />
            </div>

            <div className="mt-2 text-[10px] text-white/50 text-center">
              {canMove && !canAttack && '可移动'}
              {!canMove && canAttack && '可攻击'}
              {canMove && canAttack && '可移动 & 可攻击'}
              {!canMove && !canAttack && canAct && '本回合已行动完毕'}
              {!canAct && '等待回合'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
