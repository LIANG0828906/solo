import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Difficulty } from '../../types';
import { api } from '../../utils/api';
import './CardEditor.css';

function CardEditor() {
  const navigate = useNavigate();
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && tags.length < 3 && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;

    setIsSubmitting(true);
    try {
      await api.createCard({
        front: front.trim(),
        back: back.trim(),
        tags,
        initialDifficulty: difficulty
      });
      navigate('/');
    } catch (error) {
      console.error('创建卡片失败:', error);
      alert('创建失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="editor-container">
        <div className="glass-card editor-input-section">
          <h2 className="section-title">创建新卡片</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="front">正面内容</label>
              <textarea
                id="front"
                value={front}
                onChange={(e) => {
                  setFront(e.target.value);
                  setShowPreview(true);
                }}
                placeholder="输入问题或概念..."
                rows={4}
                required
                className="form-textarea"
              />
            </div>

            <div className="form-group">
              <label htmlFor="back">反面内容</label>
              <textarea
                id="back"
                value={back}
                onChange={(e) => {
                  setBack(e.target.value);
                  setShowPreview(true);
                }}
                placeholder="输入答案或解释..."
                rows={4}
                required
                className="form-textarea"
              />
            </div>

            <div className="form-group">
              <label>标签（最多3个）</label>
              <div className="tag-input-container">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="输入标签后按回车添加"
                  maxLength={20}
                  className="form-input"
                  disabled={tags.length >= 3}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="add-tag-btn"
                  disabled={tags.length >= 3 || !tagInput.trim()}
                >
                  添加
                </button>
              </div>
              <div className="tags-display">
                {tags.map((tag, index) => (
                  <span key={index} className="tag-chip">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="tag-remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>初始难度</label>
              <div className="difficulty-buttons">
                <button
                  type="button"
                  className={`difficulty-btn easy ${difficulty === 'easy' ? 'active' : ''}`}
                  onClick={() => setDifficulty('easy')}
                >
                  容易
                </button>
                <button
                  type="button"
                  className={`difficulty-btn medium ${difficulty === 'medium' ? 'active' : ''}`}
                  onClick={() => setDifficulty('medium')}
                >
                  中等
                </button>
                <button
                  type="button"
                  className={`difficulty-btn hard ${difficulty === 'hard' ? 'active' : ''}`}
                  onClick={() => setDifficulty('hard')}
                >
                  困难
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting || !front.trim() || !back.trim()}
            >
              {isSubmitting ? '创建中...' : '创建卡片'}
            </button>
          </form>
        </div>

        <div className={`preview-section ${showPreview || front || back ? 'visible' : ''}`}>
          <h3 className="section-title">卡片预览</h3>
          <div className="preview-card front">
            <div className="preview-label">正面</div>
            <div className="preview-content">
              {front || '正面内容将显示在这里...'}
            </div>
          </div>
          <div className="preview-card back">
            <div className="preview-label">反面</div>
            <div className="preview-content">
              {back || '反面内容将显示在这里...'}
            </div>
          </div>
          {tags.length > 0 && (
            <div className="preview-tags">
              {tags.map((tag, index) => (
                <span key={index} className="tag-chip">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CardEditor;
