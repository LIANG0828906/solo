import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useDreamStore, type Tag } from '../stores/dreamStore';

const TAG_COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181',
  '#AA96DA', '#FCBAD3', '#A8D8EA', '#FF9F43', '#6C5CE7'
];

function getRandomColor(): string {
  return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
}

function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

export default function DreamEditor() {
  const {
    editorOpen,
    editingDream,
    closeEditor,
    addDream,
    updateDream
  } = useDreamStore();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(getTodayDate());
  const [emotionRating, setEmotionRating] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [hoverRating, setHoverRating] = useState(0);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (editingDream) {
      setTitle(editingDream.title);
      setDate(editingDream.date);
      setEmotionRating(editingDream.emotionRating);
      setTags(editingDream.tags);
      setContent(editingDream.content);
    } else {
      setTitle('');
      setDate(getTodayDate());
      setEmotionRating(3);
      setTags([]);
      setContent('');
    }
    setTagInput('');
    setHoverRating(0);
  }, [editingDream, editorOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('请输入梦境标题');
      return;
    }

    if (!content.trim()) {
      alert('请输入梦境内容');
      return;
    }

    const dreamData = {
      title: title.trim(),
      date,
      emotionRating,
      tags,
      content: content.trim()
    };

    if (editingDream) {
      updateDream(editingDream.id, dreamData);
    } else {
      addDream(dreamData);
    }

    closeEditor();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const tagName = tagInput.trim();
      if (tagName && tags.length < 5 && !tags.some(t => t.name === tagName)) {
        const newTag: Tag = {
          id: uuidv4(),
          name: tagName,
          color: getRandomColor()
        };
        setTags([...tags, newTag]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tagId: string) => {
    setTags(tags.filter(t => t.id !== tagId));
  };

  if (!editorOpen) return null;

  return (
    <div className="modal-overlay" onClick={closeEditor}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {editingDream ? '编辑梦境' : '记录新梦'}
          </h2>
          <button className="modal-close" onClick={closeEditor}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">标题</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={e => setTitle(e.target.value.slice(0, 50))}
              placeholder="给这个梦起个名字..."
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label className="form-label">日期</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">情绪评分</label>
            <div
              className="rating-input"
              onMouseLeave={() => setHoverRating(0)}
            >
              {[1, 2, 3, 4, 5].map(rating => (
              <span
                key={rating}
                className="rating-star"
                style={{
                  color: (hoverRating || emotionRating) >= rating ? '#FFD700' : '#444455'
                }}
                onClick={() => setEmotionRating(rating as 1 | 2 | 3 | 4 | 5)}
                onMouseEnter={() => setHoverRating(rating)}
              >
                ★
              </span>
            ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              关键词标签
              {tags.length > 0 && ` (${tags.length}/5)`}
            </label>
            <div className="tags-input-wrapper">
              {tags.map(tag => (
                <span
                  key={tag.id}
                  className="tag-pill"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                  <span
                    className="tag-remove"
                    onClick={() => removeTag(tag.id)}
                  >
                    ×
                  </span>
                </span>
              ))}
              {tags.length < 5 && (
                <input
                  type="text"
                  className="tags-input"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入后按回车添加..."
                />
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">梦境情节</label>
            <div className="textarea-wrapper">
              <textarea
                className="form-input"
                value={content}
                onChange={e => setContent(e.target.value.slice(0, 1000))}
                placeholder="描述你的梦境..."
                maxLength={1000}
                rows={6}
              />
              <span className="char-count">{content.length}/1000</span>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={closeEditor}
            >
              取消
            </button>
            <button type="submit" className="btn-primary">
              {editingDream ? '保存修改' : '保存梦境'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
