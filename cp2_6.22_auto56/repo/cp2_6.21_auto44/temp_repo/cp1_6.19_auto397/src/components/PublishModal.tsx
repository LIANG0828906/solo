import React, { useState } from 'react';
import './PublishModal.css';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (tags: string[], description: string) => void;
}

const PublishModal: React.FC<PublishModalProps> = ({ isOpen, onClose, onPublish }) => {
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handlePublish = () => {
    onPublish(tags, description.trim());
  };

  return (
    <div className="publish-modal-overlay" onClick={onClose}>
      <div className="publish-modal" onClick={(e) => e.stopPropagation()}>
        <button className="publish-modal-close" onClick={onClose}>
          ×
        </button>
        <h2 className="publish-modal-title">发布表情包 ✨</h2>

        <div className="publish-modal-section">
          <label className="publish-label">
            标签 <span className="publish-hint">（最多5个，回车添加）</span>
          </label>
          <div className="publish-tags-wrap">
            {tags.map((tag) => (
              <span key={tag} className="publish-tag">
                #{tag}
                <button onClick={() => handleRemoveTag(tag)} className="publish-tag-remove">
                  ×
                </button>
              </span>
            ))}
            {tags.length < 5 && (
              <input
                type="text"
                className="publish-tag-input"
                placeholder="输入标签..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value.slice(0, 10))}
                onKeyDown={handleKeyDown}
                maxLength={10}
              />
            )}
          </div>
        </div>

        <div className="publish-modal-section">
          <label className="publish-label">
            描述 <span className="publish-hint">（{description.length}/80）</span>
          </label>
          <textarea
            className="publish-textarea"
            placeholder="写点什么介绍你的表情包..."
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 80))}
            maxLength={80}
            rows={3}
          />
        </div>

        <div className="publish-modal-actions">
          <button className="publish-cancel ripple-btn" onClick={onClose}>
            取消
          </button>
          <button className="publish-confirm ripple-btn" onClick={handlePublish}>
            🚀 确认发布
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublishModal;
