import { useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Icon from '@mdi/react';
import { mdiChartLine, mdiTrophy } from '@mdi/js';
import { SearchPanel } from '@/components/SearchPanel';
import { SkillCard } from '@/components/SkillCard';
import {
  useStore,
  useFilteredSkills,
} from '@/store/useStore';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filteredSkills = useFilteredSkills();
  const {
    highlightedUserIds,
    setHighlightedUserIds,
    setSelectedTags,
    setSearchQuery,
    currentUser,
    skills,
    calculateMatchScore,
    getUserById,
  } = useStore();

  const filterSkill = searchParams.get('skill') || '';
  const prevFilterRef = useRef<string>('');

  useEffect(() => {
    if (filterSkill === prevFilterRef.current) return;
    prevFilterRef.current = filterSkill;

    if (filterSkill) {
      setSelectedTags([filterSkill]);
      setSearchQuery(filterSkill);

      const query = filterSkill.toLowerCase();
      const matchedUserMap = new Map<string, number>();
      const skillMatches = skills.filter(
        (s) =>
          s.userId !== currentUser.id &&
          (s.title.toLowerCase().includes(query) ||
            s.tags.some((t) => t.toLowerCase().includes(query)) ||
            s.category.toLowerCase().includes(query))
      );
      skillMatches.forEach((skill) => {
        if (!matchedUserMap.has(skill.userId)) {
          const user = getUserById(skill.userId);
          if (user) {
            matchedUserMap.set(skill.userId, calculateMatchScore(skill.userId));
          }
        }
      });
      const sortedUsers = Array.from(matchedUserMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => id);
      const topThree = sortedUsers.slice(0, 3);
      setHighlightedUserIds(topThree);
    } else {
      setSelectedTags([]);
      setSearchQuery('');
      setHighlightedUserIds([]);
    }
    return () => {
      setHighlightedUserIds([]);
    };
  }, [
    filterSkill,
    skills,
    currentUser.id,
    getUserById,
    calculateMatchScore,
    setSelectedTags,
    setSearchQuery,
    setHighlightedUserIds,
  ]);

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

  const avgMatchScore = useMemo(() => {
    if (filteredSkills.length === 0) return 0;
    const scores = filteredSkills.map((s) => calculateMatchScore(s.userId));
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [filteredSkills, calculateMatchScore]);

  const topMatchScore = useMemo(() => {
    if (!filterSkill || highlightedUserIds.length === 0) return 0;
    return calculateMatchScore(highlightedUserIds[0]);
  }, [filterSkill, highlightedUserIds, calculateMatchScore]);

  const clearSkillFilter = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('skill');
    setSearchParams(newParams);
    setSelectedTags([]);
    setSearchQuery('');
    setHighlightedUserIds([]);
  };

  return (
    <div className="page">
      <h1 className="page-title">发现技能</h1>

      {filterSkill && (
        <div
          style={{
            marginBottom: 24,
            padding: '16px 24px',
            background:
              'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(245,158,11,0.1))',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(99,102,241,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Icon path={mdiTrophy} size={1.2} color="#6366F1" />
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 15,
                  color: 'var(--color-text-primary)',
                }}
              >
                正在为「{filterSkill}」寻找最佳交换伙伴
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--color-text-secondary)',
                  marginTop: 4,
                }}
              >
                共找到 {filteredSkills.length} 位匹配用户，已高亮匹配度 Top 3
                {topMatchScore > 0 && (
                  <span style={{ marginLeft: 12 }}>
                    · 最高匹配度：
                    <span style={{ color: '#22C55E', fontWeight: 600 }}>
                      {topMatchScore}%
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            className="btn btn-secondary"
            style={{ fontSize: 13, padding: '8px 16px', whiteSpace: 'nowrap' }}
            onClick={clearSkillFilter}
          >
            清除筛选
          </button>
        </div>
      )}

      {!filterSkill && (
        <div
          style={{
            marginBottom: 24,
            padding: '20px 24px',
            background: 'var(--color-bg)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #6366F1, #F59E0B)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <Icon path={mdiChartLine} size={1.3} />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 16,
                  color: 'var(--color-text-primary)',
                }}
              >
                技能匹配度分析
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--color-text-secondary)',
                  marginTop: 4,
                }}
              >
                基于你的技能标签和雷达图数据，智能计算与其他用户的互补程度
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                }}
              >
                {filteredSkills.length}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--color-text-tertiary)',
                  marginTop: 2,
                }}
              >
                候选用户
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color:
                    avgMatchScore >= 60
                      ? '#22C55E'
                      : avgMatchScore >= 40
                        ? '#F97316'
                        : '#9CA3AF',
                }}
              >
                {avgMatchScore}%
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--color-text-tertiary)',
                  marginTop: 2,
                }}
              >
                平均匹配度
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="home-container">
        <SearchPanel />

        <div style={{ flex: 1 }}>
          {filteredSkills.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-text">
                没有找到匹配的技能，试试其他关键词吧
              </div>
            </div>
          ) : (
            <>
              <div className="skill-waterfall">
                {visibleSkills.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    showMatchBadge={true}
                    highlighted={highlightedUserIds.includes(skill.userId)}
                  />
                ))}
              </div>

              <div ref={sentinelRef} className="loading-sentinel">
                {isLoading
                  ? '加载中...'
                  : hasMore
                    ? '向下滚动加载更多'
                    : '已加载全部'}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
