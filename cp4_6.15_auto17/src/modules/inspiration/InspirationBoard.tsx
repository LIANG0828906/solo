import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Type, Image, Music, Video, MoreHorizontal, Search, Trash2, ArrowRight, Calendar, Tag } from 'lucide-react';
import { useStore } from '@/shared/store';
import type { Inspiration, InspirationCategory } from '@/shared/types';
import { cn } from '@/lib/utils';

const categoryConfig: Record<InspirationCategory, { label: string; icon: typeof Type; color: string; barColor: string }> = {
  text: { label: '文字', icon: Type, color: 'text-category-text', barColor: 'bg-category-text' },
  image: { label: '图像', icon: Image, color: 'text-category-image', barColor: 'bg-category-image' },
  music: { label: '音乐', icon: Music, color: 'text-category-music', barColor: 'bg-category-music' },
  video: { label: '视频', icon: Video, color: 'text-category-video', barColor: 'bg-category-video' },
  other: { label: '其他', icon: MoreHorizontal, color: 'text-category-other', barColor: 'bg-category-other' },
};

const categoryFilters: { value: InspirationCategory | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'text', label: '文字' },
  { value: 'image', label: '图像' },
  { value: 'music', label: '音乐' },
  { value: 'video', label: '视频' },
  { value: 'other', label: '其他' },
];

interface InspirationCardProps {
  inspiration: Inspiration;
  tagNames: string[];
  onConvert: (id: string) => void;
  onDelete: (id: string) => void;
  isNew: boolean;
  onAnimationEnd: (id: string) => void;
}

function InspirationCard({
  inspiration,
  tagNames,
  onConvert,
  onDelete,
  isNew,
  onAnimationEnd,
}: InspirationCardProps) {
  const config = categoryConfig[inspiration.category];
  const Icon = config.icon;

  const handleAnimationEnd = () => {
    if (isNew) {
      onAnimationEnd(inspiration.id);
    }
  };

  return (
    <div
      className={cn(
        'glass-card rounded-xl overflow-hidden card-elastic relative',
        isNew ? 'animate-float-up opacity-0' : '',
      )}
      onAnimationEnd={handleAnimationEnd}
    >
      <div className={cn('h-1.5 w-full', config.barColor)} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Icon size={16} className={cn(config.color, 'shrink-0')} />
            <h3 className="font-display font-semibold text-white text-lg leading-tight line-clamp-1">
              {inspiration.title}
            </h3>
          </div>
        </div>
        <p className="text-forge-muted text-sm line-clamp-2 mb-3 min-h-[2.5rem]">
          {inspiration.description}
        </p>
        <div className="flex items-center gap-2 text-xs text-forge-muted mb-3">
          <Calendar size={12} />
          <span>{new Date(inspiration.createdAt).toLocaleDateString('zh-CN')}</span>
        </div>
        {tagNames.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tagNames.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-forge-surface/50 text-forge-muted text-[10px] font-medium"
              >
                <Tag size={8} />
                {tag}
              </span>
            ))}
            {tagNames.length > 3 && (
              <span className="px-2 py-0.5 rounded-full bg-forge-surface/50 text-forge-muted text-[10px] font-medium">
                +{tagNames.length - 3}
              </span>
            )}
          </div>
        )}
        <div className="flex gap-2 pt-3 border-t border-forge-border/50">
          <button
            type="button"
            onClick={() => onConvert(inspiration.id)}
            className={cn(
              'btn-elastic flex-1 py-2 rounded-lg text-xs font-semibold',
              'bg-forge-accent/15 text-forge-accent hover:bg-forge-accent/25',
              'flex items-center justify-center gap-1.5',
            )}
          >
            <ArrowRight size={12} />
            转化为项目
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('确定要删除这个灵感吗？')) {
                onDelete(inspiration.id);
              }
            }}
            className={cn(
              'btn-elastic p-2 rounded-lg text-forge-muted hover:text-red-400 hover:bg-red-400/10',
            )}
            aria-label="删除灵感"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InspirationBoard() {
  const navigate = useNavigate();
  const inspirations = useStore((s) => s.inspirations);
  const tags = useStore((s) => s.tags);
  const deleteInspiration = useStore((s) => s.deleteInspiration);
  const inspirationToProject = useStore((s) => s.inspirationToProject);

  const [categoryFilter, setCategoryFilter] = useState<InspirationCategory | 'all'>('all');
  const [tagSearch, setTagSearch] = useState('');
  const [newInspirationIds, setNewInspirationIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          const first = inspirations[0];
          if (first && !newInspirationIds.has(first.id)) {
            setNewInspirationIds((prev) => new Set([...prev, first.id]));
          }
        }
      });
    });
    const gridEl = document.querySelector('.inspiration-grid');
    if (gridEl) observer.observe(gridEl, { childList: true });
    return () => observer.disconnect();
  }, [inspirations, newInspirationIds]);

  const filteredInspirations = useMemo(() => {
    return inspirations.filter((item) => {
      const categoryMatch = categoryFilter === 'all' || item.category === categoryFilter;
      const tagNames = item.tagIds.map((id) => tags.find((t) => t.id === id)?.name || '').filter(Boolean);
      const tagMatch = !tagSearch || tagNames.some((name) => name.toLowerCase().includes(tagSearch.toLowerCase()));
      return categoryMatch && tagMatch;
    });
  }, [inspirations, categoryFilter, tagSearch, tags]);

  const getTagNames = (tagIds: string[]) => {
    return tagIds.map((id) => tags.find((t) => t.id === id)?.name || '').filter(Boolean);
  };

  const handleConvert = async (id: string) => {
    try {
      const project = await inspirationToProject(id);
      navigate(`/project/${project.id}`);
    } catch (err) {
      console.error('Failed to convert:', err);
    }
  };

  const handleDelete = (id: string) => {
    deleteInspiration(id);
  };

  const handleAnimationEnd = (id: string) => {
    setNewInspirationIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-forge-bg">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <header className="mb-8">
          <h1 className="font-display text-4xl font-bold text-white mb-2">
            灵感看板
          </h1>
          <p className="text-forge-muted">
            捕捉每一个稍纵即逝的灵感火花
          </p>
        </header>

        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {categoryFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setCategoryFilter(filter.value)}
                className={cn(
                  'btn-elastic px-4 py-2 rounded-xl text-sm font-medium transition-all',
                  categoryFilter === filter.value
                    ? 'bg-forge-accent text-white shadow-lg shadow-forge-accent/25'
                    : 'glass-card text-forge-muted hover:text-white',
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="relative max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-forge-muted" />
            <input
              type="text"
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              placeholder="按标签搜索灵感..."
              className={cn(
                'w-full pl-11 pr-4 py-2.5 rounded-xl bg-forge-card/70 border border-forge-border',
                'text-white placeholder-forge-muted/60 focus:outline-none focus:border-forge-accent',
                'backdrop-blur-sm transition-colors',
              )}
            />
          </div>
        </div>

        {filteredInspirations.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-forge-surface/50 flex items-center justify-center">
              <MoreHorizontal size={36} className="text-forge-muted" />
            </div>
            <h3 className="font-display text-xl font-semibold text-white mb-2">
              {inspirations.length === 0 ? '还没有任何灵感' : '没有符合条件的灵感'}
            </h3>
            <p className="text-forge-muted">
              {inspirations.length === 0
                ? '点击右下角的 + 按钮，记录你的第一个灵感吧'
                : '试试调整筛选条件'}
            </p>
          </div>
        ) : (
          <div className="inspiration-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInspirations.map((inspiration, index) => (
              <InspirationCard
                key={inspiration.id}
                inspiration={inspiration}
                tagNames={getTagNames(inspiration.tagIds)}
                onConvert={handleConvert}
                onDelete={handleDelete}
                isNew={index === 0 && newInspirationIds.has(inspiration.id)}
                onAnimationEnd={handleAnimationEnd}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
