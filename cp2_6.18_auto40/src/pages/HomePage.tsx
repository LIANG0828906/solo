import { useMemo } from 'react';
import { SearchPanel } from '@/components/SearchPanel';
import { SkillCard } from '@/components/SkillCard';
import { useFilteredSkills } from '@/store/useStore';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

export function HomePage() {
  const filteredSkills = useFilteredSkills();
  
  const { visibleCount, sentinelRef, hasMore, isLoading } = useInfiniteScroll({
    totalItems: filteredSkills.length,
    initialLoad: 12,
    loadMore: 8,
    threshold: 200,
  });

  const visibleSkills = useMemo(
    () => filteredSkills.slice(0, visibleCount),
    [filteredSkills, visibleCount]
  );

  return (
    <div className="page">
      <h1 className="page-title">发现技能</h1>
      <div className="home-container">
        <SearchPanel />
        
        <div style={{ flex: 1 }}>
          {filteredSkills.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-text">没有找到匹配的技能，试试其他关键词吧</div>
            </div>
          ) : (
            <>
              <div className="skill-waterfall">
                {visibleSkills.map((skill) => (
                  <SkillCard key={skill.id} skill={skill} />
                ))}
              </div>
              
              <div ref={sentinelRef} className="loading-sentinel">
                {isLoading ? '加载中...' : hasMore ? '向下滚动加载更多' : '已加载全部'}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
