import React, { useState, useEffect } from 'react';
import { IdeaNode, NODE_COLORS } from '../types';

interface NodeEditorProps {
  node: IdeaNode;
  onSave: (data: Partial<IdeaNode>) => void;
  onClose: () => void;
  onDelete: () => void;
}

const TAG_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F'
];

const NodeEditor: React.FC<NodeEditorProps> = ({ node, onSave, onClose, onDelete }) => {
  const [title, setTitle] = useState(node.title);
  const [description, setDescription] = useState(node.description);
  const [color, setColor] = useState(node.color);
  const [tags, setTags] = useState<string[]>(node.tags);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    setTitle(node.title);
    setDescription(node.description);
    setColor(node.color);
    setTags(node.tags);
  }, [node]);

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave({
      title,
      description,
      color,
      tags
    });
    onClose();
  };

  const getTagColor = (tag: string) => {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
  };

  return (
    <div className="editor-overlay" onClick={onClose}>
      <div className="editor-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="editor-header">
          <div className="editor-title">
            {node.isGroup ? '编辑分组' : '编辑灵感'}
          </div>
          <button className="editor-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="editor-body">
          <div className="form-group">
            <label>标题</label>
            <input
              type="text"
              className="title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入灵感标题..."
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>详情</label>
            <textarea
              className="description-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="详细描述你的灵感..."
            />
          </div>

          <div className="form-group">
            <label>标签</label>
            <div className="tags-container">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="tag-chip"
                  style={{ backgroundColor: getTagColor(tag) }}
                >
                  {tag}
                  <button className="tag-remove" onClick={() => removeTag(idx)}>
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                className="tag-input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder={tags.length === 0 ? '输入标签，逗号分隔...' : ''}
              />
            </div>
          </div>

          <div className="form-group">
            <label>颜色</label>
            <div className="color-picker">
              {NODE_COLORS.map((c) => (
                <button
                  key={c}
                  className={`color-option ${color === c ? 'selected' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="editor-footer">
          <button className="btn-delete" onClick={onDelete}>
            删除
          </button>
          <div className="footer-right">
            <button className="btn-cancel" onClick={onClose}>
              取消
            </button>
            <button className="btn-save" onClick={handleSave}>
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeEditor;
