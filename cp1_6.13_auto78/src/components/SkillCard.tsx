import { useState } from 'react';
import type { Skill } from '@/types';
import './SkillCard.css';

interface SkillCardProps {
  skill: Skill;
  onClick?: () => void;
}

export default function SkillCard({ skill, onClick }: SkillCardProps) {
  const [expanded, setExpanded] = useState(false);

  const renderStars = (level: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-lg ${i < level ? 'text-[#e8a838]' : 'text-gray-600'}`}
      >
        ★
      </span>
    ));
  };

  const handleClick = () => {
    setExpanded(!expanded);
    onClick?.();
  };

  return (
    <div
      className={`skill-card relative cursor-pointer p-4 backdrop-blur-md rounded-xl border border-[#2a2a4e] transition-all duration-300 ${
        expanded ? 'expanded' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-lg">{skill.name}</h3>
          <div className="flex gap-0.5">{renderStars(skill.level)}</div>
        </div>
        <p className="text-gray-400 text-sm">
          可用时间：每周 {skill.hoursPerWeek} 小时
        </p>
      </div>

      <div
        className={`skill-details overflow-hidden transition-all duration-400 ease-in-out ${
          expanded ? 'max-h-40 opacity-100 mt-3' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="pt-3 border-t border-[#2a2a4e]">
          <p className="text-gray-300 text-sm">
            {skill.description || '暂无详细描述'}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-gray-500 text-xs">技能等级：</span>
            <div className="flex gap-0.5">{renderStars(skill.level)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
