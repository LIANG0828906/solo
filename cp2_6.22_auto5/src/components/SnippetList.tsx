import { useState, useMemo } from 'react';
import type { Snippet, ThemeName } from '../types';
import { LANGUAGES } from '../types';

interface SnippetListProps {
  snippets: Snippet[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: (title: string, language: string, expiration: string) => void;
  theme: ThemeName;
  onToggleTheme: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  loading: boolean;
}

type SortMode = 'time' | 'language' | 'favorite';

export default function SnippetList({
  snippets,
  selectedId,
  onSelect,
  onToggleFavorite,
  onDelete,
  onNew,
  theme,
  onToggleTheme,
  sidebarOpen,
  onToggleSidebar,
  loading,
}: SnippetListProps) {
  const [search, setSearch] = useState('');
  const [filterLang, setFilterLang] = useState<string>('all');
  const [sortMode, setSortMode] = useState<SortMode>('time');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLang, setNewLang] = useState('javascript');
  const [newExpiration, setNewExpiration] = useState('never');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = [...snippets];

    if (filterLang !== 'all') {
      result = result.filter((s) => s.language === filterLang);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.content.toLowerCase().includes(q)
      );
    }

    switch (sortMode) {
      case 'time':
        result.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'language':
        result.sort((a, b) => a.language.localeCompare(b.language));
        break;
      case 'favorite':
        result.sort((a, b) => {
          if (a.favorite === b.favorite) return b.createdAt - a.createdAt;
          return a.favorite ? -1 : 1;
        });
        break;
    }

    return result;
  }, [snippets, search, filterLang, sortMode]);

  const usedLanguages = useMemo(() => {
    const langs = new Set(snippets.map((s) => s.language));
    return LANGUAGES.filter((l) => langs.has(l.value));
  }, [snippets]);

  const handleNew = () => {
    if (!newTitle.trim()) return;
    onNew(newTitle.trim(), newLang, newExpiration);
    setNewTitle('');
    setNewLang('javascript');
    setNewExpiration('never');
    setShowNewForm(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    setTimeout(() => {
      onDelete(id);
      setDeletingId(null);
    }, 300);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = Date.now();
    const diff = now - ts;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const getExpiryLabel = (expiresAt: number | null) => {
    if (!expiresAt) return '永久';
    const diff = expiresAt - Date.now();
    if (diff <= 0) return '已过期';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟后过期`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时后过期`;
    return `${Math.floor(diff / 86400000)}天后过期`;
  };

  return (
    <div className={`sidebar ${!sidebarOpen ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          CodeClip
        </div>
        <div className="sidebar-actions">
          <button className="btn btn-icon btn-ghost" onClick={onToggleSidebar} title="切换面板">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <div className="search-box">
        <div className="search-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="search-input"
            type="text"
            placeholder="搜索片段..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="filter-bar">
        <button
          className={`filter-chip ${filterLang === 'all' ? 'active' : ''}`}
          onClick={() => setFilterLang('all')}
        >
          全部
        </button>
        {usedLanguages.map((l) => (
          <button
            key={l.value}
            className={`filter-chip ${filterLang === l.value ? 'active' : ''}`}
            onClick={() => setFilterLang(l.value)}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="sort-controls">
        <span className="sort-label">排序:</span>
        <button
          className={`sort-btn ${sortMode === 'time' ? 'active' : ''}`}
          onClick={() => setSortMode('time')}
        >
          时间
        </button>
        <button
          className={`sort-btn ${sortMode === 'language' ? 'active' : ''}`}
          onClick={() => setSortMode('language')}
        >
          语言
        </button>
        <button
          className={`sort-btn ${sortMode === 'favorite' ? 'active' : ''}`}
          onClick={() => setSortMode('favorite')}
        >
          收藏
        </button>
      </div>

      <div className="snippet-list">
        {loading && <div style={{ textAlign: 'center', padding: 20 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)', fontSize: 13 }}>
            {search ? '未找到匹配的片段' : '暂无片段，点击下方按钮创建'}
          </div>
        )}
        {filtered.map((snippet) => (
          <div
            key={snippet.id}
            className={`snippet-item ${selectedId === snippet.id ? 'selected' : ''} ${deletingId === snippet.id ? 'snippet-exit' : 'snippet-enter'}`}
            onClick={() => onSelect(snippet.id)}
          >
            <div className="snippet-item-header">
              <span className="snippet-item-title">{snippet.title}</span>
              <svg
                className={`snippet-item-fav ${snippet.favorite ? 'active' : ''}`}
                viewBox="0 0 24 24"
                fill={snippet.favorite ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(snippet.id);
                }}
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <div className="snippet-item-meta">
              <span className="snippet-item-lang">{snippet.language}</span>
              <span>{formatTime(snippet.createdAt)}</span>
              <span>{getExpiryLabel(snippet.expiresAt)}</span>
            </div>
            <div className="snippet-item-preview">
              {snippet.content.slice(0, 60) || '(空)'}
            </div>
          </div>
        ))}
      </div>

      <div className="new-snippet-form">
        {!showNewForm ? (
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowNewForm(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            新建片段
          </button>
        ) : (
          <div className="snippet-enter">
            <div className="form-group">
              <label className="form-label">标题</label>
              <input
                className="form-input"
                type="text"
                placeholder="输入片段标题..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNew()}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">语言</label>
              <select
                className="form-select"
                value={newLang}
                onChange={(e) => setNewLang(e.target.value)}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">有效期</label>
              <div className="expiration-options">
                {[
                  { value: '1h', label: '1小时' },
                  { value: '24h', label: '24小时' },
                  { value: '7d', label: '7天' },
                  { value: 'never', label: '永久' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    className={`expiration-option ${newExpiration === opt.value ? 'active' : ''}`}
                    onClick={() => setNewExpiration(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleNew}>
                创建
              </button>
              <button className="btn" onClick={() => setShowNewForm(false)}>
                取消
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
