import React, { useState, useMemo } from 'react';
import { marked } from 'marked';
import BookSearch from '../components/BookSearch';
import { BookInfo } from '../api/bookApi';
import { useReviewStore } from '../stores/reviewStore';
import { useUserStore } from '../stores/userStore';

interface ReviewEditorProps {
  onBack: () => void;
}

const ReviewEditor: React.FC<ReviewEditorProps> = ({ onBack }) => {
  const [selectedBook, setSelectedBook] = useState<BookInfo | null>(null);
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const addReview = useReviewStore((s) => s.addReview);
  const user = useUserStore((s) => s.user);

  const previewHtml = useMemo(() => {
    try {
      return marked(content || '*在左侧开始撰写你的书评...*');
    } catch {
      return '';
    }
  }, [content]);

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim() && tags.length < 5) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!selectedBook || !content.trim()) return;
    addReview({
      bookTitle: selectedBook.title,
      bookCover: selectedBook.cover,
      author: selectedBook.author,
      content: content.trim(),
      tags,
      userId: user?.id || '',
    });
    onBack();
  };

  return (
    <div>
      <button className="back-btn" onClick={onBack}>
        ← 返回书评广场
      </button>
      <div className="editor-container">
        <h2 style={{ fontSize: 20, color: '#2c3e50', marginBottom: 20 }}>✍️ 撰写书评</h2>
        <BookSearch onSelect={setSelectedBook} />
        {selectedBook && (
          <div className="selected-book-info">
            <img className="selected-book-cover" src={selectedBook.cover} alt={selectedBook.title} />
            <div className="selected-book-details">
              <h3>{selectedBook.title}</h3>
              <p>作者: {selectedBook.author}</p>
              <p>ISBN: {selectedBook.isbn}</p>
            </div>
          </div>
        )}
        <div className="editor-area">
          <div className="editor-left">
            <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500, color: '#2c3e50' }}>
              书评内容（支持 Markdown）
            </div>
            <textarea
              className="editor-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="用 Markdown 撰写你的书评..."
            />
          </div>
          <div className="editor-right">
            <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500, color: '#2c3e50' }}>
              实时预览
            </div>
            <div
              className="editor-preview"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        </div>
        <div className="tags-input-area">
          <div className="tags-input-label">标签（最多5个，回车添加）</div>
          <div className="tags-container">
            {tags.map((tag, i) => (
              <span key={i} className="tag-capsule">
                {tag}
                <button className="tag-capsule-remove" onClick={() => removeTag(i)}>
                  ×
                </button>
              </span>
            ))}
            {tags.length < 5 && (
              <input
                className="tags-input-inline"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="输入标签..."
              />
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <button
            className="settings-save-btn"
            onClick={handleSubmit}
            disabled={!selectedBook || !content.trim()}
            style={{
              opacity: selectedBook && content.trim() ? 1 : 0.5,
              cursor: selectedBook && content.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            提交书评
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewEditor;
