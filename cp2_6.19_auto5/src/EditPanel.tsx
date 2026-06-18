import { useState, useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { useStore } from './store';
import type { Snippet } from './types';

export default function EditPanel() {
  const {
    isEditPanelOpen,
    isCreating,
    editingSnippet,
    categories,
    closeEditPanel,
    addSnippet,
    updateSnippet,
  } = useStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditPanelOpen) {
      if (isCreating) {
        setTitle('');
        setContent('');
        setTags([]);
        setCategoryId(null);
      } else if (editingSnippet) {
        setTitle(editingSnippet.title);
        setContent(editingSnippet.content);
        setTags([...editingSnippet.tags]);
        setCategoryId(editingSnippet.categoryId);
      }
    }
  }, [isEditPanelOpen, isCreating, editingSnippet]);

  const handleAddTag = useCallback(() => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags(prev => [...prev, trimmed]);
    }
    setTagInput('');
  }, [tagInput, tags]);

  const handleRemoveTag = useCallback((tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  }, []);

  const handleSave = useCallback(() => {
    if (!title.trim()) return;
    if (isCreating) {
      addSnippet({ title: title.trim(), content, tags, categoryId });
    } else if (editingSnippet) {
      updateSnippet(editingSnippet.id, { title: title.trim(), content, tags, categoryId });
    }
    closeEditPanel();
  }, [title, content, tags, categoryId, isCreating, editingSnippet, addSnippet, updateSnippet, closeEditPanel]);

  if (!isEditPanelOpen) return null;

  const flatCategories = categories.map(c => ({
    id: c.id,
    name: '　'.repeat(c.level) + c.name,
    level: c.level,
  }));

  return (
    <div className="edit-panel-overlay" onClick={closeEditPanel}>
      <div className="edit-panel" onClick={e => e.stopPropagation()}>
        <div className="edit-panel-header">
          <span className="edit-panel-title">{isCreating ? '新建片段' : '编辑片段'}</span>
          <button className="cat-action-btn" onClick={closeEditPanel} style={{ width: 30, height: 30 }}>
            <X size={18} />
          </button>
        </div>

        <div className="edit-panel-body">
          <div className="form-group">
            <label className="form-label">标题</label>
            <input
              className="form-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="输入片段标题..."
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">正文（支持Markdown）</label>
            <textarea
              className="form-textarea"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="## 标题&#10;&#10;正文内容..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">标签（回车添加）</label>
            <div className="tags-input-wrapper" onClick={() => tagInputRef.current?.focus()}>
              {tags.map(tag => (
                <span key={tag} className="tag-badge">
                  {tag}
                  <span className="tag-remove" onClick={() => handleRemoveTag(tag)}>×</span>
                </span>
              ))}
              <input
                ref={tagInputRef}
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); }
                }}
                placeholder={tags.length === 0 ? '输入标签后按回车...' : '添加标签...'}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">所属分类</label>
            <select
              className="form-select"
              value={categoryId ?? ''}
              onChange={e => setCategoryId(e.target.value || null)}
            >
              <option value="">无分类</option>
              {flatCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="edit-panel-footer">
          <button className="btn btn-secondary" onClick={closeEditPanel}>取消</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!title.trim()}>
            {isCreating ? '创建' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
