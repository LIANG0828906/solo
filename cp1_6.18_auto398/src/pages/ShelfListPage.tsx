import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { ShelfManager } from '@/shelves/ShelfManager';
import ShelfCard from '@/components/ShelfCard';
import { Book } from '@/types';

const ShelfListPage: React.FC = () => {
  const navigate = useNavigate();
  const { shelves, books, fetchShelves, fetchBooks, createShelf } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState('');
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchShelves();
    fetchBooks();
  }, []);

  const toggleBook = (id: string) => {
    setSelectedBooks((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const filteredBooks = books.filter(
    (b) =>
      !search ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      (b.authors || []).some((a) => a.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreate = async () => {
    setError(null);
    if (!name.trim()) {
      setError('请输入书单名称');
      return;
    }
    setCreating(true);
    try {
      const shelf = await ShelfManager.createShelf({
        name: name.trim(),
        description: description.trim() || undefined,
        theme: theme.trim() || undefined,
        bookIds: selectedBooks,
        isPublic,
      });
      setShowModal(false);
      setName('');
      setDescription('');
      setTheme('');
      setSelectedBooks([]);
      setIsPublic(false);
      navigate(`/shelf/${shelf.id}`);
    } catch (err: any) {
      setError(err.message || '创建失败');
    } finally {
      setCreating(false);
    }
  };

  const suggestedThemes = [
    { name: '治愈系小说', icon: '🌸', color: '#FF6B9D' },
    { name: '通勤路上听的', icon: '🎧', color: '#6C63FF' },
    { name: '深夜治愈读物', icon: '🌙', color: '#A78BFA' },
    { name: '科幻必读', icon: '🚀', color: '#4ADE80' },
    { name: '经典文学', icon: '📚', color: '#FBBF24' },
    { name: '历史人文', icon: '🏛️', color: '#F87171' },
  ];

  return (
    <div className="fade-in">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 28,
          flexWrap: 'wrap',
          gap: 16,
        }}
        className="slide-up"
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>📚 我的书单</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            按心情或场景创建主题书单，和朋友一起享受阅读
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          ✨ 创建新书单
        </button>
      </div>

      {suggestedThemes.length > 0 && (
        <div style={{ marginBottom: 28 }} className="slide-up stagger-1">
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, fontWeight: 500 }}>
            💡 热门主题灵感
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {suggestedThemes.map((t) => (
              <button
                key={t.name}
                onClick={() => {
                  setTheme(t.name);
                  setName(t.name);
                  setShowModal(true);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 18px',
                  background: `${t.color}15`,
                  border: `1px solid ${t.color}40`,
                  color: t.color,
                  borderRadius: 30,
                  fontSize: 13,
                  fontWeight: 500,
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 4px 16px ${t.color}30`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span>{t.icon}</span>
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {shelves.length === 0 ? (
        <div
          className="glass-card slide-up stagger-2"
          style={{ padding: 80, textAlign: 'center' }}
        >
          <div style={{ fontSize: 72, marginBottom: 20 }}>📚</div>
          <h3 style={{ fontSize: 22, marginBottom: 10, color: '#fff' }}>还没有任何书单</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: 14 }}>
            创建第一个主题书单，把你的珍藏好书分享给朋友们
          </p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            ✨ 立即创建
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 20,
          }}
        >
          {shelves.map((shelf, i) => (
            <ShelfCard key={shelf.id} shelf={shelf} index={i} />
          ))}
        </div>
      )}

      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            animation: 'fadeIn 0.25s ease both',
          }}
          onClick={() => !creating && setShowModal(false)}
        >
          <div
            className="glass-card fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 720,
              maxHeight: '88vh',
              overflow: 'auto',
              padding: 32,
              animation: 'slideUp 0.35s ease both',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 24,
              }}
            >
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 }}>✨ 创建新书单</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>把志同道合的书籍组合在一起吧</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                disabled={creating}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                  color: 'var(--text-secondary)',
                  fontSize: 18,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 8, display: 'block' }}>
                书单名称 <span style={{ color: '#F87171' }}>*</span>
              </label>
              <input
                type="text"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：治愈系小说推荐"
                maxLength={40}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 8, display: 'block' }}>
                  主题标签（选填）
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="例如：治愈、通勤、深夜"
                />
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 8, display: 'block' }}>
                  可见性
                </label>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '13px 18px',
                    background: isPublic ? 'rgba(108,99,255,0.12)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isPublic ? 'rgba(108,99,255,0.35)' : 'var(--glass-border)'}`,
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    style={{ display: 'none' }}
                  />
                  <div
                    style={{
                      width: 40,
                      height: 22,
                      borderRadius: 20,
                      background: isPublic ? 'var(--accent)' : 'rgba(255,255,255,0.2)',
                      position: 'relative',
                      transition: 'background 0.25s ease',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 2,
                        left: isPublic ? 20 : 2,
                        width: 18