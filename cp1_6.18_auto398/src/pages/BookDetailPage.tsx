import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import StarRating from '@/components/StarRating';

const BookDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { books, currentBook, updateBook, deleteBook, fetchBooks } = useStore();
  const [tagInput, setTagInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    tags: [] as string[],
    rating: 0,
    status: 'wishlist' as 'reading' | 'finished' | 'wishlist',
    pagesRead: 0,
  });

  const book = books.find((b) => b.id === id) || currentBook;

  useEffect(() => {
    if (book) {
      setForm({
        tags: book.tags || [],
        rating: book.rating || 0,
        status: book.status || 'wishlist',
        pagesRead: book.pagesRead || 0,
      });
    }
  }, [book?.id]);

  if (!book) {
    return (
      <div className="slide-up" style={{ textAlign: 'center', padding: 80 }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🔍</div>
        <h3 style={{ fontSize: 20, marginBottom: 8 }}>找不到这本书</h3>
        <button className="btn-primary" onClick={() => navigate('/')} style={{ marginTop: 16 }}>
          返回书架
        </button>
      </div>
    );
  }

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;
    if (form.tags.includes(tag)) {
      setTagInput('');
      return;
    }
    setForm({ ...form, tags: [...form.tags, tag] });
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setForm({ ...form, tags: form.tags.filter((t) => t !== tag) });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateBook(book.id, {
        ...book,
        tags: form.tags,
        rating: form.rating || undefined,
        status: form.status,
        pagesRead: form.pagesRead,
      });
      setIsEditing(false);
      await fetchBooks();
    } catch (e) {
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要从书架中删除这本书吗？')) return;
    try {
      await deleteBook(book.id);
      navigate('/');
    } catch (e) {
      alert('删除失败');
    }
  };

  const statusOptions = [
    { value: 'wishlist', label: '想读', icon: '📌', color: '#FBBF24' },
    { value: 'reading', label: '在读', icon: '📖', color: '#6C63FF' },
    { value: 'finished', label: '已读', icon: '✅', color: '#4ADE80' },
  ];

  const progress = book.totalPages && book.totalPages > 0
    ? Math.min(100, Math.round(((form.pagesRead || 0) / (book.totalPages || 1)) * 100))
    : 0;

  return (
    <div className="fade-in" style={{ maxWidth: 1000 }}>
      <button
        onClick={() => navigate(-1)}
        className="btn-ghost"
        style={{ marginBottom: 24, padding: '8px 18px', fontSize: 13 }}
      >
        ← 返回
      </button>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          gap: 36,
        }}
        className="detail-grid"
      >
        <div className="slide-up stagger-1">
          <div
            style={{
              position: 'sticky',
              top: 100,
              aspectRatio: '2/3',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)',
              background: 'linear-gradient(135deg, #2A2A4A, #1A1A2E)',
            }}
          >
            <img
              src={book.coverUrl || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=900&fit=crop'}
              alt={book.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>

        <div>
          <div className="slide-up stagger-2" style={{ marginBottom: 28 }}>
            {book.isbn && (
              <div
                style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  background: 'rgba(108,99,255,0.12)',
                  border: '1px solid rgba(108,99,255,0.3)',
                  color: '#B4AEFF',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 500,
                  marginBottom: 16,
                }}
              >
                ISBN: {book.isbn}
              </div>
            )}
            <h1
              style={{
                fontSize: 32,
                fontWeight: 700,
                lineHeight: 1.25,
                marginBottom: 10,
              }}
            >
              {book.title}
            </h1>
            <div style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 16 }}>
              作者：{(book.authors || []).join('、') || '未知作者'}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <StarRating value={form.rating || 0} size="lg" readonly={!isEditing} onChange={(v) => setForm({ ...form, rating: v })} />
              {(progress > 0 || isEditing) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>进度</span>
                  <div
                    style={{
                      width: 140,
                      height: 8,
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: 10,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${progress}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--accent), #A78BFA)',
                        borderRadius: 10,
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                    {progress}%
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="slide-up stagger-3" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => isEditing && setForm({ ...form, status: opt.value as any })}
                style={{
                  padding: '10px 18px',
                  borderRadius: 30,
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: form.status === opt.value ? `${opt.color}22` : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${form.status === opt.value ? opt.color : 'var(--glass-border)'}`,
                  color: form.status === opt.value ? opt.color : 'var(--text-secondary)',
                  transition: 'all 0.25s ease',
                  cursor: isEditing ? 'pointer' : 'default',
                }}
              >
                <span>{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>

          {book.description && (
            <div className="slide-up stagger-4" style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10, color: '#fff' }}>
                内容简介
              </h3>
              <div
                style={{
                  padding: 20,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 14,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                  fontSize: 14,
                }}
              >
                {book.description}
              </div>
            </div>
          )}

          <div className="slide-up stagger-5" style={{ marginBottom: 28 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>个人标签</h3>
            </div>

            <div
              style={{
                padding: 20,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--glass-border)',
                borderRadius: 14,
              }}
            >
              {form.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  {form.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 14px',
                        background: 'linear-gradient(135deg, rgba(108,99,255,0.2), rgba(167,139,250,0.2))',
                        border: '1px solid rgba(108,99,255,0.35)',
                        color: '#C7D2FE',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      🏷️ {tag}
                      {isEditing && (
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          style={{
                            color: '#F87171',
                            fontSize: 14,
                            fontWeight: 700,
                            lineHeight: 1,
                            marginLeft: 2,
                          }}
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}
              {isEditing && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="输入标签后按回车添加..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    style={{ flex: 1 }}
                  />
                  <button className="btn-primary" onClick={handleAddTag} style={{ padding: '10px 18px' }}>
                    添加
                  </button>
                </div>
              )}
              {!isEditing && form.tags.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '8px 0' }}>
                  暂无标签，点击编辑按钮添加
                </div>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="slide-up stagger-6" style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#fff' }}>
                阅读进度
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="number"
                  min={0}
                  max={book.totalPages || 9999}
                  value={form.pagesRead || 0}
                  onChange={(e) => setForm({ ...form, pagesRead: parseInt(e.target.value) || 0 })}
                  className="input-field"
                  style={{ width: 140 }}
                />
                <span style={{ color: 'var(--text-muted)' }}>
                  / {book.totalPages || '?'} 页
                </span>
              </div>
            </div>
          )}

          <div
            className="slide-up stagger-6"
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              flexWrap: 'wrap',
              paddingTop: 20,
              borderTop: '1px solid var(--glass-border)',
            }}
          >
            {!isEditing ? (
              <>
                <button className="btn-primary" onClick={() => setIsEditing(true)}>
                  ✏️ 编辑信息
                </button>
                <button className="btn-ghost" onClick={handleDelete} style={{ color: '#F87171', borderColor: 'rgba(248,113,113,0.3)' }}>
                  🗑️ 从书架删除
                </button>
              </>
            ) : (
              <>
                <button className="btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? '保存中...' : '💾 保存修改'}
                </button>
                <button className="btn-ghost" onClick={() => setIsEditing(false)}>
                  取消
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default BookDetailPage;
