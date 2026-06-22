import { useState, useEffect, useRef } from 'react';
import { X, Tag, Save } from 'lucide-react';
import { useHiveStore } from '@/store';
import type { Card } from '@/types';

const PRESET_TAGS = ['写作', '小说', '散文', '设计', 'UI', '配色', '排版', '策划', '活动', '运营', '品牌'];

export function CardPanel() {
  const { isPanelOpen, editingCard, closePanel, addCard, updateCard } = useHiveStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggest, setShowTagSuggest] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPanelOpen) {
      setIsAnimating(true);
      setTitle(editingCard?.title || '');
      setContent(editingCard?.content || '');
      setTags(editingCard?.tags || []);
      setTagInput('');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true));
      });
    } else {
      setIsVisible(false);
      const t = setTimeout(() => setIsAnimating(false), 400);
      return () => clearTimeout(t);
    }
  }, [isPanelOpen, editingCard]);

  useEffect(() => {
    if (!isPanelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPanelOpen]);

  if (!isAnimating) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => closePanel(), 400);
  };

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (!t || tags.includes(t) || tags.length >= 5) return;
    setTags([...tags, t]);
    setTagInput('');
    setShowTagSuggest(false);
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleTagKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === '，' || e.key === ',') {
      e.preventDefault();
      if (tagInput.trim()) addTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('请填写标题');
      return;
    }
    try {
      if (editingCard) {
        const res = await fetch(`/api/cards/${editingCard.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: title.trim(), content: content.trim(), tags }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        updateCard(data.card as Card);
      } else {
        const res = await fetch('/api/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: title.trim(), content: content.trim(), tags }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        addCard(data.card as Card);
      }
      handleClose();
    } catch {
      alert('保存失败，请重试');
    }
  };

  const filteredSuggest = PRESET_TAGS.filter(t =>
    !tags.includes(t) && t.includes(tagInput.trim())
  ).slice(0, 6);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center pb-4 md:items-center md:pb-0"
      onClick={handleClose}
    >
      <div
        className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-400 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-2xl mx-3 mb-2 md:mx-0 md:mb-0 overflow-hidden shadow-2xl transition-all duration-[400ms] ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 md:translate-y-[60vh]'
        }`}
        style={{
          backgroundColor: '#FFF8E7',
          borderRadius: '24px',
          boxShadow: '0 25px 80px -20px rgba(139,69,19,0.35), 0 0 0 1px rgba(255,220,150,0.4) inset',
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-40 pointer-events-none opacity-50"
          style={{
            background: 'radial-gradient(ellipse at 20% 0%, rgba(255,200,120,0.5), transparent 60%), radial-gradient(ellipse at 80% 0%, rgba(255,170,100,0.35), transparent 60%)',
          }}
        />
        <div className="relative p-6 md:p-8">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ background: '#E67E22' }} />
                <span className="text-xs tracking-widest uppercase" style={{ color: '#A0522D' }}>
                  {editingCard ? 'Edit Spark' : 'New Spark'}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: '"Noto Serif SC", serif', color: '#3E2723' }}>
                {editingCard ? '编辑灵感卡片' : '记录新的灵感'}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-full transition-all hover:scale-95"
              style={{ color: '#5D4037', background: 'rgba(139,69,19,0.08)' }}
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#6D4C41' }}>
                标题 <span className="opacity-60">（{title.length}/35）</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 35))}
                placeholder="给这道灵光起个名字..."
                className="w-full px-1 py-3 text-lg outline-none bg-transparent border-b-2 transition-colors"
                style={{
                  fontFamily: '"Noto Serif SC", serif',
                  color: '#3E2723',
                  borderColor: title ? '#E67E22' : 'rgba(139,69,19,0.2)',
                }}
                maxLength={35}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#6D4C41' }}>
                灵感内容 <span className="opacity-60">（{content.length}/800）</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, 800))}
                placeholder="在这里尽情挥洒你的想法，无论碎片还是完整..."
                rows={6}
                className="w-full px-4 py-3 rounded-xl outline-none resize-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(224,213,193,0.6)',
                  color: '#3E2723',
                  lineHeight: 1.8,
                  fontFamily: '"Noto Sans SC", sans-serif',
                }}
                maxLength={800}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag size={14} style={{ color: '#6D4C41' }} />
                <label className="text-sm font-medium" style={{ color: '#6D4C41' }}>
                  标签 <span className="opacity-60">（{tags.length}/5，回车添加）</span>
                </label>
              </div>
              <div
                className="relative flex flex-wrap items-center gap-2 p-3 rounded-xl min-h-[56px] transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(224,213,193,0.6)',
                }}
              >
                {tags.map(tag => (
                  <span
                    key={tag}
                    onClick={() => removeTag(tag)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all duration-200 hover:scale-[0.95] hover:shadow-md"
                    style={{
                      background: 'linear-gradient(135deg, #F0B27A 0%, #FAD7A1 100%)',
                      color: '#5D4037',
                      boxShadow: '0 2px 6px rgba(230,126,34,0.15)',
                    }}
                  >
                    {tag}
                    <X size={12} strokeWidth={3} />
                  </span>
                ))}
                {tags.length < 5 && (
                  <div className="relative flex-1 min-w-[100px]">
                    <input
                      value={tagInput}
                      onChange={(e) => { setTagInput(e.target.value); setShowTagSuggest(true); }}
                      onKeyDown={handleTagKey}
                      onFocus={() => setShowTagSuggest(true)}
                      onBlur={() => setTimeout(() => setShowTagSuggest(false), 150)}
                      placeholder="输入标签..."
                      className="w-full bg-transparent outline-none text-sm py-1"
                      style={{ color: '#3E2723' }}
                    />
                    {showTagSuggest && tagInput && filteredSuggest.length > 0 && (
                      <div className="absolute top-full left-0 mt-1 z-10 bg-white rounded-lg shadow-xl overflow-hidden py-1 min-w-[140px]">
                        {filteredSuggest.map(t => (
                          <button
                            key={t}
                            onMouseDown={() => addTag(t)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 transition-colors"
                            style={{ color: '#5D4037' }}
                          >
                            + {t}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-7 pt-5" style={{ borderTop: '1px dashed rgba(139,69,19,0.2)' }}>
            <button
              onClick={handleClose}
              className="px-5 py-2.5 rounded-full text-sm font-medium transition-all hover:scale-[0.97]"
              style={{ color: '#5D4037', background: 'rgba(139,69,19,0.08)' }}
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:scale-[0.97] hover:shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #E67E22 0%, #F39C12 100%)',
                boxShadow: '0 8px 20px -6px rgba(230,126,34,0.6)',
              }}
            >
              <Save size={16} />
              {editingCard ? '保存修改' : '存入蜂巢'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
