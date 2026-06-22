import { useState } from 'react';
import type { Skill } from '@/types';
import './SkillCard.css';

interface SkillCardProps {
  skill: Skill & { availability?: string };
  onClick?: () => void;
  showDetails?: boolean;
}

export default function SkillCard({ skill, onClick, showDetails = false }: SkillCardProps) {
  const [expanded, setExpanded] = useState(false);

  const renderStars = (level: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-lg ${i < level ? 'text-[#e8a838]' : 'text-gray-600'}`}
        style={{ textShadow: i < level ? '0 0 8px rgba(232, 168, 56, 0.5)' : 'none' }}
      >
        ★
      </span>
    ));
  };

  const handleClick = () => {
    if (showDetails) {
      setExpanded(!expanded);
    }
    onClick?.();
  };

  const availability = skill.availability || '灵活安排';

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
        <div className="flex items-center gap-4 text-sm">
          <p className="text-gray-400">
            每周 {skill.hoursPerWeek} 小时
          </p>
          <span className="text-[#e8a838]/70 text-xs bg-[#e8a838]/10 px-2 py-0.5 rounded-full">
            {availability}
          </span>
        </div>
      </div>

      {showDetails && (
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
              <span className="text-[#e8a838] text-xs ml-2">Lv.{skill.level}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-gray-500 text-xs">可用时间：</span>
              <span className="text-gray-300 text-xs">{availability}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
