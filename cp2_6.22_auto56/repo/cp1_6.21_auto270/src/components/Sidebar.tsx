import { Filter, Sparkles, Calendar, Tag, Type, PenLine, Mic, X, Shuffle } from 'lucide-react';
import { useInspirationStore } from '@/store';
import type { InspirationType } from '@/types';

const typeConfig: { value: InspirationType; label: string; icon: React.ReactNode }[] = [
  { value: 'text', label: '文字', icon: <Type size={14} /> },
  { value: 'drawing', label: '手绘', icon: <PenLine size={14} /> },
  { value: 'voice', label: '语音', icon: <Mic size={14} /> },
];

export default function Sidebar() {
  const { filters, setFilters, allTags, openRandom } = useInspirationStore();

  const toggleType = (type: InspirationType) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];
    setFilters({ types: newTypes });
  };

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];
    setFilters({ tags: newTags });
  };

  const clearFilters = () => {
    setFilters({ tags: [], types: [], dateRange: null });
  };

  const hasActiveFilters = filters.tags.length > 0 || filters.types.length > 0;

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-[#1E293B] rounded-r-2xl shadow-2xl z-40 flex flex-col">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-2 text-white">
          <Sparkles size={22} className="text-accent-blue" />
          <h1 className="text-lg font-bold">瞬间灵感</h1>
        </div>
        <p className="text-white/50 text-xs mt-1">捕捉每一个创意火花</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-white/80">
              <Filter size={15} />
              <span className="text-xs font-semibold uppercase tracking-wider">筛选</span>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-white/50 hover:text-white text-xs flex items-center gap-1 transition-colors"
              >
                <X size={12} />
                清除
              </button>
            )}
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-1.5 text-white/60 text-xs mb-2.5">
                <Tag size={12} />
                记录类型
              </div>
              <div className="flex flex-wrap gap-2">
                {typeConfig.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => toggleType(t.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      filters.types.includes(t.value)
                        ? 'bg-accent-blue text-white shadow-md'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-white/60 text-xs mb-2.5">
                <Tag size={12} />
                标签
              </div>
              <div className="flex flex-wrap gap-2">
                {allTags.length === 0 ? (
                  <p className="text-white/30 text-xs">暂无标签</p>
                ) : (
                  allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        filters.tags.includes(tag)
                          ? 'bg-accent-blue text-white shadow-md'
                          : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {tag}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-white/60 text-xs mb-2.5">
                <Calendar size={12} />
                日期范围
              </div>
              <div className="space-y-2">
                <select
                  onChange={(e) => {
                    if (!e.target.value) {
                      setFilters({ dateRange: null });
                      return;
                    }
                    const now = Date.now();
                    const ranges: Record<string, number> = {
                      today: 1,
                      week: 7,
                      month: 30,
                    };
                    const days = ranges[e.target.value] || 7;
                    setFilters({
                      dateRange: { start: now - days * 86400000, end: now },
                    });
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 outline-none focus:border-accent-blue transition-colors"
                >
                  <option value="" className="bg-[#1E293B]">全部时间</option>
                  <option value="today" className="bg-[#1E293B]">今天</option>
                  <option value="week" className="bg-[#1E293B]">最近一周</option>
                  <option value="month" className="bg-[#1E293B]">最近一月</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 border-t border-white/10">
        <button
          onClick={openRandom}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-accent-blue to-[#6366F1] text-white py-3 rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-accent-blue/30 transition-all hover:-translate-y-0.5"
        >
          <Shuffle size={16} />
          随机回忆
        </button>
      </div>
    </aside>
  );
}
