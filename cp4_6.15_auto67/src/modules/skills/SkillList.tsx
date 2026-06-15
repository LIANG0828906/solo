import { useState, useEffect, useCallback, useRef } from 'react';
import { useSkillsStore } from '@/store/skillsStore';
import { CATEGORY_LABELS, type SkillCategory } from '@/data/mockSkills';
import SkillCard from './SkillCard';
import ExchangeRequest from '@/modules/exchange/ExchangeRequest';

const DEBOUNCE_MS = 300;

const SkillList = () => {
  const { getFilteredSkills, setSearchQuery, setFilterCategory, filterCategory, searchQuery } = useSkillsStore();
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<ReturnType<typeof getFilteredSkills>[number] | null>(null);
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [visible, setVisible] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const skills = getFilteredSkills();

  const handleSearchChange = useCallback((value: string) => {
    setLocalQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        setSearchQuery(value);
        setVisible(true);
      }, 200);
    }, DEBOUNCE_MS);
  }, [setSearchQuery]);

  const handleCategoryChange = useCallback((cat: SkillCategory | 'all') => {
    setVisible(false);
    setTimeout(() => {
      setFilterCategory(cat);
      setVisible(true);
    }, 200);
  }, [setFilterCategory]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const categories: (SkillCategory | 'all')[] = ['all', ...Object.keys(CATEGORY_LABELS) as SkillCategory[]];

  const categoryLabel = (cat: SkillCategory | 'all') =>
    cat === 'all' ? '全部' : CATEGORY_LABELS[cat];

  return (
    <div className="min-h-screen bg-[#F5F3EE] relative">
      <div className="sticky top-0 z-30 bg-[#F5F3EE] pt-6 pb-4">
        <div className="relative w-[80%] mx-auto">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={localQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="搜索技能..."
              className="w-full pl-12 pr-4 py-3 bg-white rounded-xl shadow-sm border border-gray-200 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#246A73]/40 focus:border-[#246A73] transition-all"
            />
          </div>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="absolute right-[-52px] top-1/2 -translate-y-1/2 p-2.5 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-[#246A73] transition-colors"
          >
            <svg className="w-5 h-5 text-[#246A73]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
        </div>
      </div>

      <div
        className={`fixed top-0 right-0 h-full z-40 transition-transform duration-300 ease-in-out
          ${filterOpen ? 'translate-x-0' : 'translate-x-full'}
          max-[768px]:w-full max-[768px]:bg-white
          w-72 bg-white shadow-2xl`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-semibold text-[#246A73]">筛选分类</h3>
            <button
              onClick={() => setFilterOpen(false)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-4 py-3 rounded-xl text-left font-medium transition-all duration-200
                  ${filterCategory === cat
                    ? 'bg-[#246A73] text-white shadow-md'
                    : 'bg-gray-50 text-gray-600 hover:bg-[#246A73]/10 hover:text-[#246A73]'
                  }`}
              >
                {categoryLabel(cat)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filterOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 transition-opacity"
          onClick={() => setFilterOpen(false)}
        />
      )}

      <div className="px-4 md:px-8 lg:px-12 pb-12">
        <div
          className={`columns-1 md:columns-2 lg:columns-3 gap-5 transition-opacity duration-300
            ${visible ? 'opacity-100' : 'opacity-0'}`}
        >
          {skills.map((skill) => (
            <div key={skill.id} className="break-inside-avoid mb-5">
              <SkillCard skill={skill} onRequestExchange={setSelectedSkill} />
            </div>
          ))}
        </div>

        {skills.length === 0 && visible && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg">未找到匹配的技能</p>
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
};

export default SkillList;
