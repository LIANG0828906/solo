import { useState, useRef, useEffect } from 'react';
import { Star, User, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Skill } from './SkillContext';

interface SkillCardProps {
  skill: Skill;
  isExpanded: boolean;
  onToggle: () => void;
  onBook: () => void;
  searchKeyword?: string;
}

function highlightText(text: string, keyword: string) {
  if (!keyword.trim()) return text;
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, index) =>
    regex.test(part) ? (
      <span key={index} className="bg-yellow-400/30 text-yellow-200 rounded px-0.5">
        {part}
      </span>
    ) : (
      part
    )
  );
}

export default function SkillCard({
  skill,
  isExpanded,
  onToggle,
  onBook,
  searchKeyword = '',
}: SkillCardProps) {
  const [contentHeight, setContentHeight] = useState<number | 'auto'>('auto');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(isExpanded ? contentRef.current.scrollHeight : 44);
    }
  }, [isExpanded, skill.description]);

  const fullStars = Math.floor(skill.rating);
  const hasHalfStar = skill.rating % 1 >= 0.5;

  return (
    <div
      className={cn(
        'bg-[#1E293B] rounded-xl border border-[#334155] p-4 cursor-pointer',
        'transition-all duration-300 ease hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-900/20 hover:border-[#475569]'
      )}
      onClick={onToggle}
    >
      <div className="flex items-start justify-between mb-3">
        <h3
          className="text-white text-lg font-bold leading-tight"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {highlightText(skill.name, searchKeyword)}
        </h3>
        <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full flex-shrink-0 ml-2">
          {skill.category}
        </span>
      </div>

      <div
        className="overflow-hidden transition-all duration-300 ease"
        style={{ height: contentHeight }}
      >
        <div ref={contentRef}>
          <p className="text-[#94A3B8] text-sm leading-relaxed">
            {highlightText(skill.description, searchKeyword)}
          </p>

          {isExpanded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBook();
              }}
              className={cn(
                'mt-4 w-full bg-[#3B82F6] text-white rounded-lg py-2 px-4',
                'text-sm font-medium transition-all duration-300 ease',
                'hover:bg-[#60A5FA] active:scale-[0.98]'
              )}
            >
              <Calendar className="inline w-4 h-4 mr-2" />
              预约
            </button>
          )}
        </div>
      </div>

      {!isExpanded && (
        <div className="mt-1">
          <span className="text-xs text-[#60A5FA]">展开更多 ↓</span>
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#334155]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#334155] overflow-hidden flex items-center justify-center">
            <img
              src={skill.instructor.avatar}
              alt={skill.instructor.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex items-center gap-1 text-[#94A3B8] text-xs">
            <User className="w-3 h-3" />
            <span>{skill.instructor.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={cn(
                'w-4 h-4',
                i < fullStars
                  ? 'text-[#F59E0B] fill-[#F59E0B]'
                  : i === fullStars && hasHalfStar
                  ? 'text-[#F59E0B] fill-[#F59E0B]'
                  : 'text-[#475569]'
              )}
            />
          ))}
          <span className="text-[#F59E0B] text-xs font-medium ml-1">
            {skill.rating.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
}
