import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { TAGS, FONTS } from '@/types';
import Toast from '@/components/Toast';
import type { Letter } from '@/types';

export default function CreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [font, setFont] = useState<string>('楷体');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});

  const getFontFamily = (f: string) => {
    switch (f) {
      case '楷体':
        return 'var(--font-kaiti)';
      case '宋体':
        return 'var(--font-songti)';
      case '仿宋':
        return 'var(--font-fangsong)';
      default:
        return 'var(--font-kaiti)';
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else if (selectedTags.length < 3) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const validate = () => {
    const newErrors: { title?: string; content?: string } = {};
    if (!title.trim()) newErrors.title = '请输入标题';
    else if (title.length > 30) newErrors.title = '标题不能超过30字';
    if (!content.trim()) newErrors.content = '请输入内容';
    else if (content.length > 500) newErrors.content = '内容不能超过500字';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          font,
          isPublic,
          tags: selectedTags.join(','),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '发布失败');
      }

      const data: Letter = await res.json();
      showToast('信笺发布成功！');
      setTimeout(() => {
        router.push('/');
      }, 800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '发布失败';
      showToast(msg);
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: '#FFFFFF',
          borderBottom: '1px solid #EEE8DC',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          justifyContent: 'space-between',
        }}
      >
        <Link href="/">
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#8B7355',
              fontSize: '0.95rem',
              transition: 'color 0.2s',
            }}
            className="back-link"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            返回首页
          </button>
        </Link>
        <h1 style={{ fontFamily: 'var(--font-kaiti)', fontSize: '1.3rem', color: '#2C1810' }}>
          写一封信笺
        </h1>
        <div style={{ width: 80 }} />
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.9rem',
                color: '#4A3B32',
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              标题 <span style={{ color: '#E84C3D' }}>*</span>
              <span style={{ float: 'right', color: '#8B7355', fontWeight: 400 }}>
                {title.length}/30
              </span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 30))}
              placeholder="给你的信笺起个名字..."
              style={{
                width: '100%',
                padding: '14px 18px',
                border: errors.title ? '1px solid #E84C3D' : '1px solid #E8E0D6',
                borderRadius: 10,
                fontSize: '1rem',
                background: '#FDF9F0',
                color: '#2C1810',
                outline: 'none',
                transition: 'border-color 0.2s',
                fontFamily: getFontFamily(font),
              }}
              className="form-input"
            />
            {errors.title && (
              <p style={{ color: '#E84C3D', fontSize: '0.8rem', marginTop: 6 }}>{errors.title}</p>
            )}
          </div>

          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.9rem',
                color: '#4A3B32',
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              内容 <span style={{ color: '#E84C3D' }}>*</span>
              <span style={{ float: 'right', color: '#8B7355', fontWeight: 400 }}>
                {content.length}/500
              </span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 500))}
              placeholder="写下你的诗句、故事或感悟..."
              rows={10}
              style={{
                width: '100%',
                padding: '16px 18px',
                border: errors.content ? '1px solid #E84C3D' : '1px solid #E8E0D6',
                borderRadius: 10,
                fontSize: '1rem',
                background: '#FDF9F0',
                color: '#2C1810',
                outline: 'none',
                resize: 'vertical',
                lineHeight: 1.8,
                transition: 'border-color 0.2s',
                fontFamily: getFontFamily(font),
              }}
              className="form-input"
            />
            {errors.content && (
              <p style={{ color: '#E84C3D', fontSize: '0.8rem', marginTop: 6 }}>{errors.content}</p>
            )}
          </div>

          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.9rem',
                color: '#4A3B32',
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              字体样式
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              {FONTS.map((f) => {
                const isActive = font === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFont(f)}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: 10,
                      border: isActive ? '2px solid #A67C52' : '1px solid #E8E0D6',
                      background: isActive ? '#FDF9F0' : '#FFFFFF',
                      fontSize: '1rem',
                      fontFamily: getFontFamily(f),
                      color: isActive ? '#A67C52' : '#4A3B32',
                      transition: 'all 0.2s',
                    }}
                    className="font-btn"
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.9rem',
                color: '#4A3B32',
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              内容标签（最多选择3个）
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {TAGS.map((tag) => {
                const isActive = selectedTags.includes(tag);
                const disabled = !isActive && selectedTags.length >= 3;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    disabled={disabled}
                    style={{
                      padding: '6px 16px',
                      borderRadius: 20,
                      fontSize: '0.85rem',
                      background: isActive ? '#A67C52' : '#E8E0D6',
                      color: isActive ? '#FFFFFF' : '#5C4A39',
                      opacity: disabled ? 0.4 : 1,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease-out',
                    }}
                    className="tag-select-btn"
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.9rem',
                color: '#4A3B32',
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              公开状态
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: isPublic ? '2px solid #A67C52' : '1px solid #E8E0D6',
                  background: isPublic ? '#FDF9F0' : '#FFFFFF',
                  color: isPublic ? '#A67C52' : '#4A3B32',
                  fontSize: '0.95rem',
                  transition: 'all 0.2s',
                }}
                className="toggle-btn"
              >
                🌿 公开信笺
              </button>
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: !isPublic ? '2px solid #A67C52' : '1px solid #E8E0D6',
                  background: !isPublic ? '#FDF9F0' : '#FFFFFF',
                  color: !isPublic ? '#A67C52' : '#4A3B32',
                  fontSize: '0.95rem',
                  transition: 'all 0.2s',
                }}
                className="toggle-btn"
              >
                🔒 私密信笺
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 12,
              background: '#A67C52',
              color: '#FFFFFF',
              fontSize: '1.05rem',
              fontWeight: 500,
              transition: 'all 0.2s ease-out',
              boxShadow: '0 2px 12px rgba(166,124,82,0.3)',
              opacity: submitting ? 0.7 : 1,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
            className="submit-btn"
          >
            {submitting ? '发布中...' : '✨ 发布信笺'}
          </button>
        </form>
      </div>

      <Toast message={toastMsg} visible={toastVisible} onClose={() => setToastVisible(false)} />

      <style jsx>{`
        .form-input:focus {
          border-color: #A67C52 !important;
        }
        .back-link:hover {
          color: #5C4A39 !important;
        }
        .font-btn:hover:not(.active),
        .toggle-btn:hover {
          transform: scale(1.02);
        }
        .tag-select-btn:hover:not(:disabled) {
          transform: scale(1.05);
        }
        .submit-btn:hover:not(:disabled) {
          transform: scale(1.02);
          background: #8B6642;
        }
      `}</style>
    </div>
  );
}
