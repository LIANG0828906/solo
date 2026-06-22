import { useState, useRef, useEffect } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';
import { TagChip } from '@/components/TagChip';
import { EMOTION_TAGS, MAX_TAGS_PER_WORK, CATEGORY_COLORS } from '@/constants/tags';
import { useStore } from '@/store/useStore';
import type { Work } from '@/types';

interface WorkEditorProps {
  work?: Work;
  onClose: () => void;
}

export function WorkEditor({ work, onClose }: WorkEditorProps) {
  const addWork = useStore((state) => state.addWork);
  const updateWork = useStore((state) => state.updateWork);
  const deleteWork = useStore((state) => state.deleteWork);
  
  const [title, setTitle] = useState(work?.title || '');
  const [cover, setCover] = useState(work?.cover || '');
  const [tags, setTags] = useState<string[]>(work?.tags || []);
  const [story, setStory] = useState(work?.story || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCover(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleTag = (tagName: string) => {
    if (tags.includes(tagName)) {
      setTags(tags.filter((t) => t !== tagName));
    } else if (tags.length < MAX_TAGS_PER_WORK) {
      setTags([...tags, tagName]);
    }
  };

  const handleSave = () => {
    if (!title.trim() || !cover || tags.length === 0) return;
    
    if (work) {
      updateWork(work.id, { title, cover, tags, story });
    } else {
      addWork({ title, cover, tags, story });
    }
    onClose();
  };

  const handleDelete = () => {
    if (work && window.confirm('确定要删除这件作品吗？')) {
      deleteWork(work.id);
      onClose();
    }
  };

  const groupedTags = {
    warm: EMOTION_TAGS.filter((t) => t.category === 'warm'),
    cold: EMOTION_TAGS.filter((t) => t.category === 'cold'),
    mystery: EMOTION_TAGS.filter((t) => t.category === 'mystery'),
  };

  const categoryNames: Record<string, string> = {
    warm: '温暖类',
    cold: '冷峻类',
    mystery: '神秘类',
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-[#1A1A2E] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">
            {work ? '编辑作品' : '添加作品'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                作品标题
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入作品标题"
                className="w-full rounded-lg border border-white/10 bg-[#2D2D44] px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-[#FF6B6B] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                封面图片
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/20 bg-[#2D2D44]/50 transition-colors hover:border-[#FF6B6B]/50"
              >
                {cover ? (
                  <img src={cover} alt="预览" className="h-full w-full object-cover" />
                ) : (
                  <>
                    <Upload className="mb-2 h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-400">点击上传封面图片</span>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">
                  情绪标签
                </label>
                <span className="text-xs text-gray-500">
                  已选 {tags.length}/{MAX_TAGS_PER_WORK}
                </span>
              </div>
              
              <div className="space-y-4">
                {Object.entries(groupedTags).map(([category, categoryTags]) => (
                  <div key={category}>
                    <span 
                      className="mb-2 block text-xs font-medium"
                      style={{ color: CATEGORY_COLORS[category] }}
                    >
                      {categoryNames[category]}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {categoryTags.map((tag) => (
                        <TagChip
                          key={tag.name}
                          tag={tag.name}
                          selected={tags.includes(tag.name)}
                          onClick={() => toggleTag(tag.name)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                幕后故事
              </label>
              <textarea
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="分享这件作品背后的故事..."
                rows={5}
                className="w-full resize-none rounded-lg border border-white/10 bg-[#2D2D44] px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-[#FF6B6B] focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
          {work ? (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-red-400 transition-colors hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
              删除作品
            </button>
          ) : (
            <div />
          )}
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-gray-400 transition-colors hover:text-white"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || !cover || tags.length === 0}
              className="rounded-lg bg-[#FF6B6B] px-6 py-2 font-medium text-white transition-colors hover:bg-[#ff5555] disabled:cursor-not-allowed disabled:opacity-50"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
