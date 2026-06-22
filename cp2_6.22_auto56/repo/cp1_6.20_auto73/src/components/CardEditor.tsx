import React, { useState, useEffect } from 'react';
import type { Card, CardTag, Priority } from '../types';
import { CARD_TAGS, PRIORITIES } from '../types';

interface CardEditorProps {
  card: Card | null;
  onUpdate: (card: Card) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const CardEditor: React.FC<CardEditorProps> = ({
  card,
  onUpdate,
  onDelete,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<CardTag[]>([]);
  const [priority, setPriority] = useState<Priority>('P2');

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setContent(card.content);
      setTags(card.tags);
      setPriority(card.priority);
    } else {
      setTitle('');
      setContent('');
      setTags([]);
      setPriority('P2');
    }
  }, [card]);

  const handleTagToggle = (tag: CardTag) => {
    setTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!card || !title.trim()) return;

    onUpdate({
      ...card,
      title: title.trim(),
      content: content.trim(),
      tags,
      priority,
      updatedAt: Date.now(),
    });
  };

  const handleDelete = () => {
    if (card && window.confirm('确定要删除这张卡片吗？')) {
      onDelete(card.id);
    }
  };

  if (!card) return null;

  return (
    <div className="card-editor-overlay" onClick={onClose}>
      <div className="card-editor" onClick={(e) => e.stopPropagation()}>
        <div className="editor-header">
          <h3>编辑卡片</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入卡片标题..."
              required
            />
          </div>
          <div className="form-group">
            <label>内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="输入卡片内容（支持Markdown）..."
              rows={8}
            />
          </div>
          <div className="form-group">
            <label>标签</label>
            <div className="tag-buttons">
              {CARD_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  className={`tag-btn ${tags.includes(tag) ? 'active' : ''}`}
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>优先级</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              {PRIORITIES.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-danger" onClick={handleDelete}>
              删除
            </button>
            <div className="action-right">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                取消
              </button>
              <button type="submit" className="btn btn-primary">
                保存
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CardEditor;
