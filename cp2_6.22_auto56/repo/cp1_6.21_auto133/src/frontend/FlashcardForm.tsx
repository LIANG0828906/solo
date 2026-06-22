import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Flashcard } from './types';
import { api } from './api';

const FlashcardForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit && id) {
      loadCard(id);
    }
  }, [isEdit, id]);

  const loadCard = async (cardId: string) => {
    try {
      const card = await api.getCard(cardId);
      setTitle(card.title);
      setContent(card.content);
      setTags(card.tags);
    } catch (err) {
      setError('加载卡片失败');
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newTag = tagInput.trim();
      
      if (!newTag) return;
      
      if (tags.length >= 3) {
        setError('最多只能添加3个标签');
        return;
      }
      
      let formattedTag = newTag;
      if (!formattedTag.startsWith('#')) {
        formattedTag = '#' + formattedTag;
      }
      
      if (tags.includes(formattedTag)) {
        setError('标签已存在');
        return;
      }
      
      setTags([...tags, formattedTag]);
      setTagInput('');
      setError(null);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isEdit && id) {
        await api.updateCard(id, title, content, tags);
      } else {
        await api.createCard(title, content, tags);
      }
      navigate('/cards');
    } catch (err: any) {
      setError(err.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formWrapper}>
        <h1 style={styles.title}>
          {isEdit ? '编辑卡片' : '创建新卡片'}
        </h1>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={50}
              placeholder="输入卡片标题（最多50字符）"
              style={styles.input}
              required
            />
            <div style={styles.charCount}>
              {title.length}/50
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={500}
              placeholder="输入卡片内容（支持Markdown格式，最多500字符）"
              style={styles.textarea}
              required
              rows={8}
            />
            <div style={styles.charCount}>
              {content.length}/500
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>标签（最多3个，按Enter添加）</label>
            <div style={styles.tagInputWrapper}>
              {tags.map(tag => (
                <span key={tag} style={styles.tagBadge}>
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    style={styles.tagRemove}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={tags.length >= 3 ? '已达最大标签数' : '输入标签，按Enter添加'}
                style={{ ...styles.tagInput, ...(tags.length >= 3 ? styles.tagInputDisabled : {}) }}
                disabled={tags.length >= 3}
              />
            </div>
          </div>

          <div style={styles.actions}>
            <button
              type="button"
              onClick={() => navigate('/cards')}
              style={styles.cancelButton}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !content.trim()}
              style={{
                ...styles.submitButton,
                ...((loading || !title.trim() || !content.trim()) ? styles.submitButtonDisabled : {})
              }}
            >
              {loading ? '保存中...' : (isEdit ? '保存修改' : '创建卡片')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '32px 24px'
  } as React.CSSProperties,

  formWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 4px 12px rgba(203, 213, 225, 0.3)'
  } as React.CSSProperties,

  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#1E293B',
    margin: '0 0 24px 0'
  } as React.CSSProperties,

  error: {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px'
  } as React.CSSProperties,

  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px'
  } as React.CSSProperties,

  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px'
  } as React.CSSProperties,

  label: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#334155'
  } as React.CSSProperties,

  input: {
    height: '40px',
    padding: '0 16px',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.25s ease-out',
    fontFamily: 'inherit',
    '&:focus': {
      borderColor: '#3B82F6'
    }
  } as React.CSSProperties,

  textarea: {
    padding: '12px 16px',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical' as const,
    transition: 'border-color 0.25s ease-out',
    fontFamily: 'inherit',
    lineHeight: 1.6,
    '&:focus': {
      borderColor: '#3B82F6'
    }
  } as React.CSSProperties,

  charCount: {
    fontSize: '12px',
    color: '#94A3B8',
    textAlign: 'right' as const
  } as React.CSSProperties,

  tagInputWrapper: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    padding: '8px',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    minHeight: '40px',
    alignItems: 'center',
    transition: 'border-color 0.25s ease-out',
    '&:focus-within': {
      borderColor: '#3B82F6'
    }
  } as React.CSSProperties,

  tagInput: {
    flex: 1,
    minWidth: '120px',
    height: '32px',
    padding: '0 8px',
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    fontFamily: 'inherit'
  } as React.CSSProperties,

  tagInputDisabled: {
    backgroundColor: '#F1F5F9',
    cursor: 'not-allowed',
    color: '#94A3B8'
  } as React.CSSProperties,

  tagBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#EBF4FF',
    color: '#3B82F6',
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500
  } as React.CSSProperties,

  tagRemove: {
    background: 'none',
    border: 'none',
    color: '#3B82F6',
    fontSize: '16px',
    cursor: 'pointer',
    padding: 0,
    width: '16px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1
  } as React.CSSProperties,

  actions: {
    display: 'flex',
    justifyContent: 'flex-end' as const,
    gap: '12px',
    marginTop: '8px'
  } as React.CSSProperties,

  cancelButton: {
    padding: '10px 24px',
    backgroundColor: '#E2E8F0',
    color: '#475569',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'transform 0.15s ease',
    fontFamily: 'inherit',
    '&:hover': {
      transform: 'scale(1.02)'
    }
  } as React.CSSProperties,

  submitButton: {
    padding: '10px 24px',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'transform 0.15s ease',
    fontFamily: 'inherit',
    '&:hover': {
      transform: 'scale(1.02)'
    }
  } as React.CSSProperties,

  submitButtonDisabled: {
    backgroundColor: '#94A3B8',
    cursor: 'not-allowed',
    '&:hover': {
      transform: 'none'
    }
  } as React.CSSProperties
};

export default FlashcardForm;
