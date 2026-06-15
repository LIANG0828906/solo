import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import Masonry from 'react-masonry-css';
import { Funnel, X } from 'lucide-react';
import { useSkillsStore } from '@/store/skillsStore';
import { CATEGORY_LABELS, CATEGORY_COLORS, type SkillCategory } from '@/data/mockSkills';
import SkillCard from './SkillCard';
import ExchangeRequest from '@/modules/exchange/ExchangeRequest';
import type { Skill } from '@/data/mockSkills';

const DEBOUNCE_MS = 300;

const breakpointColumns = {
  default: 3,
  1199: 2,
  767: 1,
};

export default function SkillList() {
  const setSearchQuery = useSkillsStore((s) => s.setSearchQuery);
  const setFilterCategory = useSkillsStore((s) => s.setFilterCategory);
  const filterCategory = useSkillsStore((s) => s.filterCategory);
  const searchQuery = useSkillsStore((s) => s.searchQuery);
  const incrementSearchCount = useSkillsStore((s) => s.incrementSearchCount);
  const skills = useSkillsStore((s) => s.getFilteredSkills());

  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const prevQueryRef = useRef(searchQuery);
  const [animateKey, setAnimateKey] = useState(0);

  const handleSearchChange = useCallback((value: string) => {
    setLocalQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, DEBOUNCE_MS);
  }, [setSearchQuery]);

  useEffect(() => {
    if (prevQueryRef.current !== searchQuery && searchQuery.trim()) {
      incrementSearchCount(searchQuery);
    }
    prevQueryRef.current = searchQuery;
    setAnimateKey((k) => k + 1);
  }, [searchQuery, incrementSearchCount]);

  const handleCategoryChange = useCallback((cat: SkillCategory | 'all') => {
    setFilterCategory(cat);
    setAnimateKey((k) => k + 1);
  }, [setFilterCategory]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const categories: (SkillCategory | 'all')[] = ['all', ...(Object.keys(CATEGORY_LABELS) as SkillCategory[])];

  const categoryLabel = (cat: SkillCategory | 'all') =>
    cat === 'all' ? '全部' : CATEGORY_LABELS[cat];

  return (
    <div className="min-h-screen bg-[#F5F3EE] relative">
      <div className="sticky top-[60px] z-30 bg-[#F5F3EE] pt-6 pb-4">
        <div className="relative w-[80%] mx-auto flex items-center gap-3">
          <div className="relative flex-1">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 shrink-0"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={localQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="搜索技能、作者或关键词..."
              className="w-full pl-12 pr-4 py-3 bg-white rounded-xl shadow-sm border border-gray-200 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#246A73]/30 focus:border-[#246A73] transition-all duration-200 ease-in-out"
            />
          </div>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="shrink-0 p-3 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-[#246A73] hover:text-[#246A73] text-gray-500 transition-all duration-200 ease-in-out"
          >
            <Funnel size={20} />
          </button>
        </div>
      </div>

      <div
        className={`fixed top-0 right-0 h-full z-40 transition-transform duration-300 ease-in-out
          ${filterOpen ? 'translate-x-0' : 'translate-x-full'}
          md:w-80 max-[767px]:w-full
          bg-white shadow-2xl`}
      >
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-semibold text-[#246A73] font-display">筛选分类</h3>
            <button
              onClick={() => setFilterOpen(false)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {categories.map((cat) => {
              const dotColor = cat === 'all'
                ? '#6B7280'
                : (CATEGORY_COLORS as Record<string, string>)[cat as string] ?? '#6B7280';
              return (
                <button
                  key={cat}
                  onClick={() => {
                    handleCategoryChange(cat);
                    setFilterOpen(false);
                  }}
                  className={`px-4 py-3 rounded-xl text-left font-medium transition-all duration-200 ease-in-out
                    ${filterCategory === cat
                      ? 'bg-[#246A73] text-white shadow-md'
                      : 'bg-gray-50 text-gray-600 hover:bg-[#246A73]/10 hover:text-[#246A73]'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{categoryLabel(cat)}</span>
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: dotColor }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {filterOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 transition-opacity"
          onClick={() => setFilterOpen(false)}
        />
      )}

      <div className="px-4 md:px-8 lg:px-12 pb-16">
        <Masonry
          key={animateKey}
          breakpointCols={breakpointColumns}
          className="flex w-auto"
          columnClassName="bg-clip-padding"
          style={{ columnGap: '24px' }}
        >
          {skills.map((skill, idx) => (
            <div
              key={skill.id}
              className="mb-6 animate-fade-in"
              style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
            >
              <SkillCard skill={skill} onRequestExchange={setSelectedSkill} />
            </div>
          ))}
        </Masonry>

        {skills.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-medium">未找到匹配的技能</p>
            <p className="text-sm mt-1 text-gray-400">试试其他关键词或筛选条件</p>
          </div>
        )}
      </div>

      {selectedSkill && (
        <ExchangeRequest
          skill={selectedSkill}
          onClose={() => setSelectedSkill(null)}
        />
      )}
    </div>
  );
}
