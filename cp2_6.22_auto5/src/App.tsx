import { useState, useEffect, useCallback } from 'react';
import EditorPanel from './components/EditorPanel';
import SnippetList from './components/SnippetList';
import ShareModal from './components/ShareModal';
import { applyTheme } from './utils/themeManager';
import type { Snippet, ThemeName, Expiration } from './types';
import { LANGUAGES } from './types';

const THEMES: { value: ThemeName; label: string }[] = [
  { value: 'monokai', label: 'Monokai' },
  { value: 'dracula', label: 'Dracula' },
  { value: 'github', label: 'GitHub' },
];

export default function App() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeName>('monokai');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [shareSnippet, setShareSnippet] = useState<Snippet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const selectedSnippet = snippets.find((s) => s.id === selectedId) || null;

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const fetchSnippets = useCallback(async () => {
    try {
      const res = await fetch('/api/snippets');
      if (res.ok) {
        const data = await res.json();
        setSnippets(data);
      }
    } catch (err) {
      console.error('Failed to fetch snippets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSnippets();
    const interval = setInterval(fetchSnippets, 30000);
    return () => clearInterval(interval);
  }, [fetchSnippets]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreate = async (title: string, language: string, expiration: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: '', language, expiration }),
      });
      if (res.ok) {
        const snippet = await res.json();
        setSnippets((prev) => [snippet, ...prev]);
        setSelectedId(snippet.id);
        showToast('片段创建成功');
      }
    } catch (err) {
      console.error('Failed to create snippet:', err);
      showToast('创建失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/snippets/${id}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        setSnippets((prev) => prev.filter((s) => s.id !== id));
        if (selectedId === id) {
          setSelectedId(null);
        }
        showToast('片段已删除');
      }
    } catch (err) {
      console.error('Failed to delete snippet:', err);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    const snippet = snippets.find((s) => s.id === id);
    if (!snippet) return;
    try {
      const res = await fetch(`/api/snippets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorite: !snippet.favorite }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSnippets((prev) => prev.map((s) => (s.id === id ? updated : s)));
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleContentChange = async (content: string) => {
    if (!selectedId) return;
    setSnippets((prev) =>
      prev.map((s) => (s.id === selectedId ? { ...s, content } : s))
    );
    try {
      await fetch(`/api/snippets/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
    } catch (err) {
      console.error('Failed to save content:', err);
    }
  };

  const handleTitleChange = async (title: string) => {
    if (!selectedId) return;
    setSnippets((prev) =>
      prev.map((s) => (s.id === selectedId ? { ...s, title } : s))
    );
    try {
      await fetch(`/api/snippets/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
    } catch (err) {
      console.error('Failed to save title:', err);
    }
  };

  const handleLanguageChange = async (language: string) => {
    if (!selectedId) return;
    setSnippets((prev) =>
      prev.map((s) => (s.id === selectedId ? { ...s, language } : s))
    );
    try {
      await fetch(`/api/snippets/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language }),
      });
    } catch (err) {
      console.error('Failed to save language:', err);
    }
  };

  const handleShare = () => {
    if (!selectedSnippet) return;
    setShareSnippet(selectedSnippet);
  };

  const handleUpdateExpiration = async (id: string, expiration: Expiration) => {
    let expiresAt: number | null = null;
    switch (expiration) {
      case '1h': expiresAt = Date.now() + 3600000; break;
      case '24h': expiresAt = Date.now() + 86400000; break;
      case '7d': expiresAt = Date.now() + 604800000; break;
      case 'never': expiresAt = null; break;
    }
    setSnippets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, expiresAt } : s))
    );
    try {
      await fetch(`/api/snippets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresAt }),
      });
    } catch (err) {
      console.error('Failed to update expiration:', err);
    }
  };

  const cycleTheme = () => {
    const idx = THEMES.findIndex((t) => t.value === theme);
    const next = THEMES[(idx + 1) % THEMES.length];
    setTheme(next.value);
  };

  return (
    <div className="app-container">
      <SnippetList
        snippets={snippets}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDelete}
        onNew={handleCreate}
        theme={theme}
        onToggleTheme={cycleTheme}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        loading={loading}
      />

      <div className="main-content">
        {selectedSnippet ? (
          <>
            <div className="main-toolbar">
              <div className="toolbar-left">
                <input
                  className="title-input"
                  type="text"
                  value={selectedSnippet.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="片段标题..."
                />
                <select
                  className="lang-select"
                  value={selectedSnippet.language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="toolbar-right">
                <div className="theme-switcher">
                  {THEMES.map((t) => (
                    <button
                      key={t.value}
                      className={`theme-btn ${theme === t.value ? 'active' : ''}`}
                      onClick={() => setTheme(t.value)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <button className="btn btn-primary" onClick={handleShare}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  分享
                </button>
                <button className="btn btn-danger btn-icon" onClick={() => handleDelete(selectedSnippet.id)} title="删除">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
            <EditorPanel
              content={selectedSnippet.content}
              language={selectedSnippet.language}
              theme={theme}
              onChange={handleContentChange}
            />
          </>
        ) : (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <p>选择一个片段开始编辑，或创建新片段</p>
            {loading && <div className="spinner" />}
          </div>
        )}
      </div>

      {shareSnippet && (
        <ShareModal
          snippet={shareSnippet}
          onClose={() => setShareSnippet(null)}
          onUpdateExpiration={handleUpdateExpiration}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
