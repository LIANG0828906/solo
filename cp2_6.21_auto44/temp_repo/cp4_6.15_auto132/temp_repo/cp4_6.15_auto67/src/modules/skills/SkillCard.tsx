import { useState } from 'react';
import { CATEGORY_LABELS, CATEGORY_COLORS, type Skill } from '@/data/mockSkills';
import { useSkillsStore } from '@/store/skillsStore';

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
  const percentage = Math.min(skill.searchCount, 100);

  const handleCardClick = () => {
    setExpanded((prev) => !prev);
  };

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isApplied) return;
    setClickScale(true);
    setTimeout(() => setClickScale(false), 150);
    onRequestExchange(skill);
  };

  return (
    <div
      onClick={handleCardClick}
      className="relative cursor-pointer rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 ease-in-out"
      style={{ backgroundColor: expanded ? '#E8F5F0' : '#ffffff' }}
    >
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: expanded ? 'auto 1fr' : 'auto 0fr' }}
      >
        <div
          className="p-4 flex flex-col transition-[aspect-ratio] duration-300 ease-out"
          style={{ aspectRatio: expanded ? 'auto' : '3/4' }}
        >
          <div className="flex items-start gap-3">
            <img
              src={skill.avatar}
              alt={skill.username}
              loading="lazy"
              className="h-12 w-12 rounded-full border border-gray-200 shrink-0 bg-gray-50"
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-[18px] font-bold leading-snug truncate text-gray-900">
                {skill.title}
              </h3>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-500">
                  {CATEGORY_LABELS[skill.category]}
                </span>
                <span className="text-xs text-gray-300">·</span>
                <span className="text-xs text-gray-400 truncate">@{skill.username}</span>
              </div>
            </div>
          </div>

          <div className="mt-auto">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] text-gray-400">搜索热度</p>
              <p className="text-[10px] font-medium" style={{ color }}>
                {percentage}%
              </p>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gray-300 transition-colors duration-200 ease-in-out"
                style={{ width: `${percentage}%` }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = color)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden min-h-0">
          <div
            className="p-4 pt-0 transition-all duration-300 ease-out"
            style={{
              opacity: expanded ? 1 : 0,
              transform: expanded ? 'translateY(0)' : 'translateY(8px)',
            }}
          >
            <p className="text-sm leading-relaxed text-gray-600" style={{ display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {skill.description.slice(0, 200)}
            </p>
            <p className="mt-2 text-xs text-gray-400 italic truncate">
              — {skill.userBio}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-100">
                {skill.pointsCost} 积分
              </span>
              <button
                onClick={handleApply}
                disabled={isApplied}
                className="rounded-lg px-4 py-1.5 text-xs font-semibold text-white transition-all duration-150 hover:opacity-90"
                style={{
                  backgroundColor: isApplied ? '#9CA3AF' : '#246A73',
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
          className="absolute bottom-2.5 right-2.5 h-2.5 w-2.5 rounded-full shadow-sm ring-2 ring-white z-10"
          style={{ backgroundColor: color }}
        />
      )}
    </div>
  );
}
