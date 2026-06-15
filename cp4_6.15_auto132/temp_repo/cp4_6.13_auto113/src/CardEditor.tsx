import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '@/store';
import { Card, extractTitle, generateId, getTagColor, loadCards } from '@/utils/storage';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Save, ArrowLeft, X } from 'lucide-react';

export default function CardEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const addCard = useStore((s) => s.addCard);
  const updateCard = useStore((s) => s.updateCard);

  const isEditing = Boolean(id);

  const existingCard = useMemo(() => {
    if (!id) return null;
    return loadCards().find((c) => c.id === id) ?? null;
  }, [id]);

  const [content, setContent] = useState(existingCard?.content ?? '');
  const [tags, setTags] = useState<string[]>(existingCard?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  const title = useMemo(() => extractTitle(content), [content]);

  const handleAddTag = useCallback(() => {
    const trimmed = tagInput.trim();
    if (!trimmed || tags.length >= 5 || tags.includes(trimmed)) return;
    setTags((prev) => [...prev, trimmed]);
    setTagInput('');
  }, [tagInput, tags]);

  const handleRemoveTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddTag();
      }
    },
    [handleAddTag]
  );

  const handleSave = useCallback(() => {
    if (!content.trim()) return;
    setSaving(true);

    const now = Date.now();
    const card: Card = {
      id: id ?? generateId(),
      title,
      content,
      tags,
      createdAt: existingCard?.createdAt ?? now,
      updatedAt: now,
    };

    const start = performance.now();
    if (isEditing) {
      updateCard(card);
    } else {
      addCard(card);
    }
    const elapsed = performance.now() - start;
    console.debug(`save latency: ${elapsed.toFixed(1)}ms`);

    setSaving(false);
    navigate('/');
  }, [content, title, tags, id, existingCard, isEditing, addCard, updateCard, navigate]);

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-brown hover:text-olive transition-colors"
        >
          <ArrowLeft size={16} />
          返回
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-brown/50">
            标题预览：<span className="font-medium text-olive">{title}</span>
          </span>
          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="flex items-center gap-1.5 bg-olive hover:bg-olive-light disabled:bg-brown/30 text-white px-5 py-2 rounded-full text-sm font-medium transition-colors"
          >
            <Save size={16} />
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <div className="bg-white rounded-xl shadow-sm border border-beige-deeper/50 overflow-hidden">
          <div className="px-4 py-2.5 bg-beige-dark border-b border-beige-deeper/50 flex items-center justify-between">
            <span className="text-xs font-medium text-brown">Markdown 编辑</span>
            <span className="text-xs text-brown/40">{content.length} 字符</span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="在这里输入 Markdown 内容...&#10;&#10;例如：&#10;# 我的第一个知识点&#10;&#10;这是知识点的详细描述..."
            className="w-full h-96 p-4 text-sm text-olive bg-transparent resize-none focus:outline-none font-mono leading-relaxed placeholder:text-brown/30"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-beige-deeper/50 overflow-hidden">
          <div className="px-4 py-2.5 bg-beige-dark border-b border-beige-deeper/50">
            <span className="text-xs font-medium text-brown">实时预览</span>
          </div>
          <div className="markdown-preview h-96 p-4 overflow-y-auto text-sm">
            {content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            ) : (
              <p className="text-brown/30 italic">预览区域...</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-beige-deeper/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium text-brown">标签</span>
          <span className="text-xs text-brown/40">（最多 5 个）</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: getTagColor(tag) }}
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:opacity-70 transition-opacity"
              >
                <X size={12} />
              </button>
            </span>
          ))}

          {tags.length < 5 && (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="输入标签..."
                className="bg-beige-dark text-olive placeholder:text-brown/40 rounded-full px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-gold/50 w-28"
              />
              <button
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
                className="text-xs text-olive hover:text-olive-light disabled:text-brown/30 transition-colors px-2 py-1"
              >
                添加
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
