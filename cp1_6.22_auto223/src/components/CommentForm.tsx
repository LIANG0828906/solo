import { useState } from 'react';
import { Send } from 'lucide-react';
import type { CreateCommentRequest } from '@/types';

interface CommentFormProps {
  onSubmit: (data: Omit<CreateCommentRequest, 'authorName'>) => void;
  authorName: string;
  onAuthorNameChange: (name: string) => void;
  loading: boolean;
  placeholder?: string;
  maxLength?: number;
}

export const CommentForm: React.FC<CommentFormProps> = ({
  onSubmit,
  authorName,
  onAuthorNameChange,
  loading,
  placeholder = '写下你的书评和感悟...',
  maxLength = 2000,
}) => {
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState<{ content?: string; authorName?: string }>({});

  const charCount = content.length;
  const charCountClass = charCount > maxLength ? 'error' : charCount > maxLength * 0.9 ? 'warning' : '';

  const validate = (): boolean => {
    const newErrors: { content?: string; authorName?: string } = {};
    
    if (!authorName.trim()) newErrors.authorName = '请输入您的姓名';
    if (!content.trim()) newErrors.content = '请输入评论内容';
    else if (content.length > maxLength) newErrors.content = `评论内容不能超过${maxLength}字`;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ content: content.trim() });
      setContent('');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 32 }}>
      <div className="form-group">
        <label className="form-label">您的姓名</label>
        <input
          type="text"
          className="form-input"
          value={authorName}
          onChange={e => onAuthorNameChange(e.target.value)}
          placeholder="请输入您的姓名"
        />
        {errors.authorName && <span className="form-error">{errors.authorName}</span>}
      </div>

      <div className="form-group">
        <label className="form-label">评论内容</label>
        <textarea
          className="form-textarea"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={placeholder}
          rows={4}
          maxLength={maxLength + 100}
        />
        <div className={`char-count ${charCountClass}`}>
          {charCount} / {maxLength}
        </div>
        {errors.content && <span className="form-error">{errors.content}</span>}
      </div>

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? (
          <span className="loading-spinner" style={{ width: 16, height: 16 }} />
        ) : (
          <>
            <Send size={16} />
            发表评论
          </>
        )}
      </button>
    </form>
  );
};
