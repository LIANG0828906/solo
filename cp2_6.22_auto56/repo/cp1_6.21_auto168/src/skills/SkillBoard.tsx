import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSkills } from './SkillContext';
import SkillCard from './SkillCard';

const VIRTUAL_THRESHOLD = 50;
const CONTAINER_HEIGHT = 800;
const CARD_HEIGHT = 240;

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function SkillBoard() {
  const { skills, loading, searchKeyword, setSearchKeyword, loadSkills } = useSkills();
  const [inputValue, setInputValue] = useState(searchKeyword);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(inputValue, 500);

  useEffect(() => {
    setSearchKeyword(debouncedSearch);
    loadSkills({ search: debouncedSearch });
  }, [debouncedSearch, setSearchKeyword, loadSkills]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const { visibleSkills, paddingTop, paddingBottom } = useMemo(() => {
    if (skills.length <= VIRTUAL_THRESHOLD) {
      return { visibleSkills: skills, paddingTop: 0, paddingBottom: 0 };
    }

    const startIndex = Math.max(0, Math.floor(scrollTop / CARD_HEIGHT) - 2);
    const endIndex = Math.min(
      skills.length,
      Math.ceil((scrollTop + CONTAINER_HEIGHT) / CARD_HEIGHT) + 2
    );

    return {
      visibleSkills: skills.slice(startIndex, endIndex),
      paddingTop: startIndex * CARD_HEIGHT,
      paddingBottom: (skills.length - endIndex) * CARD_HEIGHT,
    };
  }, [skills, scrollTop]);

  const handleBook = (skillId: string) => {
    alert(`预约成功！技能ID: ${skillId}`);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1
            className="text-3xl font-bold text-white mb-2"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            技能广场
          </h1>
          <p className="text-[#94A3B8]">发现并学习感兴趣的技能</p>
        </div>

        <div className="relative mb-6 max-w-md">
          <input
            type="text"
            placeholder="搜索技能..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              'w-full bg-[#1E293B] text-white rounded-xl px-4 py-3 pl-11',
              'border-2 outline-none transition-all duration-300 ease',
              isFocused ? 'border-[#3B82F6]' : 'border-[#334155]',
              'placeholder:text-[#64748B]'
            )}
          />
          <Search
            className={cn(
              'absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ease',
              isFocused ? 'text-[#3B82F6]' : 'text-[#64748B]'
            )}
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-[#1E293B] rounded-xl border border-[#334155] p-4 h-52 animate-pulse"
              >
                <div className="h-6 bg-[#334155] rounded w-3/4 mb-3" />
                <div className="h-4 bg-[#334155] rounded w-full mb-2" />
                <div className="h-4 bg-[#334155] rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : skills.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20 text-[#64748B] animate-fade-in"
            style={{ animation: 'fadeIn 0.3s ease' }}
          >
            <Search className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-lg">暂无匹配技能</p>
            <p className="text-sm mt-1">试试其他关键词</p>
          </div>
        ) : (
          <div
            ref={containerRef}
            onScroll={handleScroll}
            className="overflow-y-auto"
            style={{
              maxHeight:
                skills.length > VIRTUAL_THRESHOLD ? `${CONTAINER_HEIGHT}px` : 'none',
            }}
          >
            <div
              style={{
                paddingTop,
                paddingBottom,
              }}
            >
              <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                style={{
                  animation: 'fadeIn 0.3s ease',
                }}
              >
                {visibleSkills.map((skill) => (
                  <div
                    key={skill.id}
                    style={{
                      animation: 'fadeIn 0.3s ease',
                    }}
                  >
                    <SkillCard
                      skill={skill}
                      isExpanded={expandedId === skill.id}
                      onToggle={() =>
                        setExpandedId(expandedId === skill.id ? null : skill.id)
                      }
                      onBook={() => handleBook(skill.id)}
                      searchKeyword={searchKeyword}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </div>
  );
}
