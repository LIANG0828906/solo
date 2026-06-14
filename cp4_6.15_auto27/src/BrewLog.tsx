import { useEffect, useMemo } from 'react';
import { useTeaStore } from '@/store/useTeaStore';
import { useBrewStore } from '@/store/useBrewStore';
import Timeline from '@/components/Timeline';
import ScoreChart from '@/components/ScoreChart';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, Filter } from 'lucide-react';
import type { Tea } from '@/types';

export default function BrewLog() {
  const { teas, loadTeas } = useTeaStore();
  const { brews, notes, loadByTeaId } = useBrewStore();

  useEffect(() => {
    loadTeas();
  }, [loadTeas]);

  const recentBrews = useMemo(() => {
    return [...brews].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [brews]);

  const teasWithBrews = useMemo(() => {
    return teas
      .map((t) => {
        const teaBrews = brews.filter((b) => b.teaId === t.id);
        return { tea: t, count: teaBrews.length };
      })
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [teas, brews]);

  const allScores = useMemo(() => {
    return brews
      .map((b) => {
        const note = notes.find((n) => n.brewRecordId === b.id);
        if (!note) return null;
        const tea = teas.find((t) => t.id === b.teaId);
        return {
          name: (tea as Tea)?.name?.slice(0, 4) || '?',
          score: note.overallScore,
        };
      })
      .filter(Boolean) as { name: string; score: number }[];
  }, [brews, notes, teas]);

  const avgOverall = useMemo(() => {
    if (notes.length === 0) return 0;
    return Math.round(notes.reduce((s, n) => s + n.overallScore, 0) / notes.length);
  }, [notes]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1">冲泡记录</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-light)' }}>
            共 {brews.length} 条冲泡记录 · 平均评分 {avgOverall} 分
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-3 space-y-5">
          <div className="tea-card p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              最近冲泡记录
            </h3>
            {recentBrews.length === 0 ? (
              <div
                className="py-16 text-center text-sm"
                style={{ color: 'var(--color-text-light)' }}
              >
                还没有冲泡记录，请前往茶叶档案详情页添加
              </div>
            ) : (
              <Timeline brews={recentBrews.slice(0, 10)} notes={notes} />
            )}
          </div>

          {allScores.length > 0 && (
            <div className="tea-card p-5">
              <h3 className="text-sm font-semibold mb-3">全部分值分布</h3>
              <ScoreChart brews={brews} notes={notes} />
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="tea-card p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              冲泡最多的茶叶
            </h3>
            {teasWithBrews.length === 0 ? (
              <p
                className="text-sm py-6 text-center"
                style={{ color: 'var(--color-text-light)' }}
              >
                暂无数据
              </p>
            ) : (
              <div className="space-y-2">
                {teasWithBrews.slice(0, 8).map(({ tea, count }) => (
                  <Link
                    key={tea.id}
                    to={`/teas/${tea.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg transition-all duration-300 hover:bg-white"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                      style={{ backgroundColor: 'var(--color-bg)' }}
                    >
                      🍵
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{tea.name}</div>
                      <div className="text-xs" style={{ color: 'var(--color-text-light)' }}>
                        {tea.variety} · {tea.year}年
                      </div>
                    </div>
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: 'rgba(107, 142, 35, 0.12)',
                        color: 'var(--color-tea-dark)',
                      }}
                    >
                      {count} 次
                    </span>
                    <ChevronRight className="w-4 h-4" style={{ color: 'var(--color-text-light)' }} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
