import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/appStore';
import { getTagColor } from '@/shared/cardTypes';
import { X } from 'lucide-react';

export default function CardEditor() {
  const isEditorOpen = useAppStore(s => s.isEditorOpen);
  const editingCard = useAppStore(s => s.editingCard);
  const closeEditor = useAppStore(s => s.closeEditor);
  const saveCard = useAppStore(s => s.saveCard);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditorOpen) {
      setTitle(editingCard?.title || '');
      setDescription(editingCard?.description || '');
      setTags(editingCard?.tags || []);
      setTagInput('');
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [isEditorOpen, editingCard]);

  const handleTagKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!tags.includes(newTag)) {
        setTags(prev => [...prev, newTag]);
      }
      setTagInput('');
    }
  }, [tagInput, tags]);

  const removeTag = useCallback((tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  }, []);

  const handleSave = useCallback(() => {
    if (!title.trim()) return;
    saveCard(
      { title: title.trim(), description: description.trim(), tags },
      editingCard?.id
    );
  }, [title, description, tags, editingCard, saveCard]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) closeEditor();
  }, [closeEditor]);

  if (!isEditorOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: '#000000AA' }}
      onClick={handleOverlayClick}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[#2A2A44] p-6 shadow-2xl"
        style={{ backgroundColor: '#1A1A2E' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-semibold text-lg text-[#E0E0E0]">
            {editingCard ? '编辑灵感' : '新建灵感'}
          </h2>
          <button
            onClick={closeEditor}
            className="p-1.5 rounded-lg hover:bg-[#2D2D44] transition-colors"
          >
            <X size={18} className="text-[#9999AA]" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#9999AA] mb-1.5">标题</label>
            <input
              ref={titleRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="输入灵感标题..."
              className="w-full px-3 py-2.5 rounded-lg border border-[#2A2A44] text-white placeholder-[#4A4A6A] text-sm focus:outline-none focus:border-[#6BCB77] transition-colors"
              style={{ backgroundColor: '#2D2D44' }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#9999AA] mb-1.5">描述</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="描述你的灵感..."
              rows={4}
              className="w-full px-3 py-2.5 rounded-lg border border-[#2A2A44] text-white placeholder-[#4A4A6A] text-sm focus:outline-none focus:border-[#6BCB77] transition-colors resize-none custom-scrollbar"
              style={{ backgroundColor: '#2D2D44', height: '120px' }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#9999AA] mb-1.5">标签</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-white cursor-pointer hover:brightness-125 transition-all active:scale-95"
                  style={{ backgroundColor: getTagColor(tag) + 'CC' }}
                  onClick={() => removeTag(tag)}
                >
                  {tag}
                  <X size={10} />
                </span>
              ))}
            </div>
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="输入标签后回车添加..."
              className="w-full px-3 py-2 rounded-lg border border-[#2A2A44] text-white placeholder-[#4A4A6A] text-xs focus:outline-none focus:border-[#6BCB77] transition-colors"
              style={{ backgroundColor: '#2D2D44' }}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={closeEditor}
            className="flex-1 px-4 py-2.5 rounded-lg border border-[#2A2A44] text-[#9999AA] text-sm font-medium hover:bg-[#2D2D44] transition-colors active:scale-95"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex-1 px-4 py-2.5 rounded-lg text-[#1A1A2E] text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: title.trim() ? '#6BCB77' : '#2D2D44' }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
