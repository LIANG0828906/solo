import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Search, BookOpen, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Skill, SkillCategory } from '../types';
import { SKILL_CATEGORIES } from '../types';
import { useSkillStore } from '../store/useSkillStore';
import SkillCard from './SkillCard';

export interface SkillListProps {
  skills?: Skill[];
  onSkillClick?: (skill: Skill) => void;
  onExchangeClick?: (skill: Skill) => void;
  showUserInfo?: boolean;
  className?: string;
}

export default function SkillList({
  skills: externalSkills,
  onSkillClick,
  onExchangeClick,
  showUserInfo = true,
  className,
}: SkillListProps) {
  const { skills: storeSkills, searchSkills, isLoading } = useSkillStore();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filteredSkills, setFilteredSkills] = useState<Skill[]>([]);

  const skills = externalSkills || storeSkills;

  const skillsByCategory = useMemo(() => {
    const categories: Record<SkillCategory, Skill[]> = {
      programming: [],
      design: [],
      language: [],
      other: [],
    };

    const targetSkills = searchKeyword ? filteredSkills : skills;

    for (const skill of targetSkills) {
      categories[skill.category].push(skill);
    }

    for (const cat of Object.keys(categories) as SkillCategory[]) {
      categories[cat].sort((a, b) => b.createdAt - a.createdAt);
    }

    return categories;
  }, [skills, filteredSkills, searchKeyword]);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSearch = useCallback(
    (keyword: string) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(async () => {
        if (!keyword.trim()) {
          setFilteredSkills([]);
          return;
        }
        const results = await searchSkills(keyword);
        setFilteredSkills(results);
      }, 100);
    },
    [searchSkills]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchKeyword(value);
    debouncedSearch(value);
  };

  const handleClearSearch = () => {
    setSearchKeyword('');
    setFilteredSkills([]);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const getCategoryLabel = (category: SkillCategory) => {
    const cat = SKILL_CATEGORIES.find((c) => c.value === category);
    return cat?.label || category;
  };

  const hasResults = searchKeyword ? filteredSkills.length > 0 : skills.length > 0;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="mb-6">
        <div className="relative max-w-xl mx-auto">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchKeyword}
            onChange={handleSearchChange}
            placeholder="搜索技能名称、描述或标签..."
            className={cn(
              'w-full pl-12 pr-10 py-3 text-base',
              'bg-white border border-gray-200 rounded-xl',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
              'transition-all duration-200',
              'placeholder:text-gray-400'
            )}
          />
          {searchKeyword && (
            <button
              onClick={handleClearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">加载中...</div>
        </div>
      )}

      {!isLoading && !hasResults && (
        <div className="flex-1 flex flex-col items-center justify-center py-16">
          <div className="w-24 h-24 mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <BookOpen size={48} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            {searchKeyword ? '未找到相关技能' : '暂无技能'}
          </h3>
          <p className="text-sm text-gray-500">
            {searchKeyword ? '试试其他关键词吧' : '快来发布第一个技能吧'}
          </p>
        </div>
      )}

      {!isLoading && hasResults && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SKILL_CATEGORIES.map((category) => (
            <div key={category.value} className="flex flex-col">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
                {getCategoryLabel(category.value)}
                <span className="text-sm font-normal text-gray-400">
                  ({skillsByCategory[category.value].length})
                </span>
              </h2>
              <div className="flex flex-col gap-4">
                {skillsByCategory[category.value].map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    showUserInfo={showUserInfo}
                    onClick={onSkillClick}
                    onExchangeClick={onExchangeClick}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
