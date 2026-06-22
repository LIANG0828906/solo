import { useState, useRef } from 'react';
import { Plus, X, Type, Image, Music, Video, MoreHorizontal } from 'lucide-react';
import { useStore } from '@/shared/store';
import type { InspirationCategory } from '@/shared/types';
import { cn } from '@/lib/utils';

const categories: { value: InspirationCategory; label: string; icon: typeof Type; color: string }[] = [
  { value: 'text', label: '文字', icon: Type, color: 'text-category-text border-category-text' },
  { value: 'image', label: '图像', icon: Image, color: 'text-category-image border-category-image' },
  { value: 'music', label: '音乐', icon: Music, color: 'text-category-music border-category-music' },
  { value: 'video', label: '视频', icon: Video, color: 'text-category-video border-category-video' },
  { value: 'other', label: '其他', icon: MoreHorizontal, color: 'text-category-other border-category-other' },
];

export default function InspirationInput() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<InspirationCategory>('text');
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const titleRef = useRef<HTMLInputElement>(null);
  const addInspiration = useStore((s) => s.addInspiration);
  const getOrCreateTag = useStore((s) => s.getOrCreateTag);
  const allTags = useStore((s) => s.tags);

  const handleOpen = () => {
    setIsOpen(true);
    setTimeout(() => titleRef.current?.focus(), 100);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTitle('');
    setDescription('');
    setCategory('text');
    setTagInput('');
    setSelectedTags([]);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = tagInput.trim();
      if (trimmed && !selectedTags.includes(trimmed)) {
        setSelectedTags([...selectedTags, trimmed]);
      }
      setTagInput('');
    } else if (e.key === 'Backspace' && !tagInput && selectedTags.length) {
      setSelectedTags(selectedTags.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const tagIds: string[] = [];
      for (const tagName of selectedTags) {
        const tag = await getOrCreateTag(tagName);
        tagIds.push(tag.id);
      }
      await addInspiration({
        title: title.trim(),
        description: description.trim(),
        category,
        tagIds,
      });
      handleClose();
    } catch (err) {
      console.error('Failed to save inspiration:', err);
    }
  };

  const suggestedTags = allTags
    .filter((t) => !selectedTags.includes(t.name) && t.name.toLowerCase().includes(tagInput.toLowerCase()))
    .slice(0, 5);

  const pickSuggestedTag = (tagName: string) => {
    if (!selectedTags.includes(tagName)) {
      setSelectedTags([...selectedTags, tagName]);
    }
    setTagInput('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button
          type="button"
          onClick={handleOpen}
          className={cn(
            'btn-elastic w-14 h-14 rounded-full bg-forge-accent hover:bg-forge-accent-hover',
            'flex items-center justify-center text-white shadow-lg shadow-forge-accent/30',
          )}
          aria-label="记录灵感"
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className={cn(
            'glass-card rounded-2xl p-6 w-[420px] max-w-[90vw]',
            'animate-float-up',
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl font-bold text-white">捕捉灵感</h3>
            <button
              type="button"
              onClick={handleClose}
              className="btn-elastic p-1.5 rounded-full hover:bg-white/10 text-forge-muted hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-forge-muted mb-1.5">
                灵感标题
              </label>
              <input
                ref={titleRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="给这个灵感起个名字..."
                className={cn(
                  'w-full px-4 py-2.5 rounded-xl bg-forge-bg/60 border border-forge-border',
                  'text-white placeholder-forge-muted/60 focus:outline-none focus:border-forge-accent',
                  'transition-colors',
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-forge-muted mb-1.5">
                一句话描述
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="简单描述一下这个灵感..."
                rows={3}
                className={cn(
                  'w-full px-4 py-2.5 rounded-xl bg-forge-bg/60 border border-forge-border',
                  'text-white placeholder-forge-muted/60 focus:outline-none focus:border-forge-accent',
                  'resize-none transition-colors',
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-forge-muted mb-2">
                分类
              </label>
              <div className="flex gap-2 flex-wrap">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const active = category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={cn(
                        'btn-elastic px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5',
                        'border transition-all',
                        active
                          ? cn(cat.color, 'bg-white/5')
                          : 'text-forge-muted border-forge-border hover:border-forge-muted/50',
                      )}
                    >
                      <Icon size={14} />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-forge-muted mb-1.5">
                标签
              </label>
              <div
                className={cn(
                  'flex flex-wrap gap-2 px-4 py-2 rounded-xl bg-forge-bg/60 border border-forge-border',
                  'focus-within:border-forge-accent transition-colors min-h-[44px]',
                )}
              >
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-forge-accent/20 text-forge-accent text-xs font-medium"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-white"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder={selectedTags.length ? '' : '输入标签，回车添加...'}
                  className="flex-1 min-w-[120px] bg-transparent text-sm text-white placeholder-forge-muted/60 focus:outline-none"
                />
              </div>
              {suggestedTags.length > 0 && tagInput && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {suggestedTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => pickSuggestedTag(tag.name)}
                      className="px-2 py-1 text-xs rounded bg-forge-surface/50 text-forge-muted hover:text-white hover:bg-forge-surface transition-colors"
                    >
                      + {tag.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!title.trim()}
              className={cn(
                'btn-elastic w-full py-3 rounded-xl font-semibold text-white',
                'bg-forge-accent hover:bg-forge-accent-hover',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
                'transition-all',
              )}
            >
              保存灵感
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
