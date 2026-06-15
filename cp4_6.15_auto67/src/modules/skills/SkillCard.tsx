import { useState } from 'react';
import { CATEGORY_LABELS, CATEGORY_COLORS, type Skill, type SkillCategory } from '@/data/mockSkills';
import { useSkillsStore } from '@/store/skillsStore';

const MAX_SEARCH_COUNT = 100;

interface SkillCardProps {
  skill: Skill;
  onRequestExchange: (skill: Skill) => void;
}

export default function SkillCard({ skill, onRequestExchange }: SkillCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [clickScale, setClickScale] = useState(false);
  const appliedSkillIds = useSkillsStore((s) => s.appliedSkillIds);
  const isApplied = appliedSkillIds.has(skill.id);

  const color = CATEGORY_COLORS[skill.category];
  const percentage = Math.min((skill.searchCount / MAX_SEARCH_COUNT) * 100, 100);

  const handleCardClick = () => {
    setExpanded((prev) => !prev);
  };

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    setClickScale(true);
    setTimeout(() => setClickScale(false), 150);
    onRequestExchange(skill);
  };

  return (
    <div
      onClick={handleCardClick}
      className="relative cursor-pointer rounded-lg overflow-hidden transition-all duration-200 ease-in-out"
      style={{
        aspectRatio: '3/4',
        backgroundColor: expanded ? '#E8F5F0' : '#ffffff',
      }}
    >
      <div className="flex h-full flex-col p-4">
        <div className="flex items-start gap-3">
          <img
            src={skill.avatar}
            alt={skill.username}
            className="h-12 w-12 rounded-full border border-gray-200 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-[18px] font-bold leading-snug truncate text-gray-900">
              {skill.title}
            </h3>
            <div className="mt-1 flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-gray-500">
                {CATEGORY_LABELS[skill.category]}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-auto">
          <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden group">
            <div
              className="h-full rounded-full transition-colors duration-200 ease-in-out bg-gray-300 group-hover:bg-current"
              style={{
                width: `${percentage}%`,
                color: color,
              }}
            />
          </div>
          <p className="mt-1 text-[10px] text-gray-400">
            搜索热度 {skill.searchCount}
          </p>
        </div>

        <div
          className="overflow-hidden transition-all duration-300 ease-out"
          style={{
            maxHeight: expanded ? 300 : 0,
            opacity: expanded ? 1 : 0,
          }}
        >
          <div className="pt-3">
            <p className="text-sm leading-relaxed text-gray-600 line-clamp-4" style={{ maxHeight: '5.5em', overflow: 'hidden' }}>
              {skill.description.slice(0, 200)}
            </p>
            <p className="mt-2 text-xs text-gray-400 italic">
              {skill.userBio}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                {skill.pointsCost} 积分
              </span>
              <button
                onClick={handleApply}
                disabled={isApplied}
                className="rounded-md px-3 py-1 text-xs font-medium text-white transition-transform duration-150"
                style={{
                  backgroundColor: '#246A73',
                  transform: clickScale ? 'scale(0.92)' : 'scale(1)',
                }}
              >
                {isApplied ? '已申请' : '申请交换'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isApplied && (
        <span
          className="absolute bottom-2 right-2 h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
    </div>
  );
}
