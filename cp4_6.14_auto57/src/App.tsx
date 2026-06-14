import { useMemo, useState, useEffect, useCallback } from 'react';
import EmojiGrid from './components/EmojiGrid';
import CollectionSidebar from './components/CollectionSidebar';
import { EMOJIS, CATEGORIES, type EmojiItem } from './data/emojis';

const STORAGE_KEY = 'emoji_collection';
const MAX_COLLECTION = 100;

interface CollectedItem {
  emoji: string;
  name: string;
  addedAt: number;
}

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [collected, setCollected] = useState<CollectedItem[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isFullWarning, setIsFullWarning] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCollected(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collected));
    } catch {
      // ignore
    }
  }, [collected]);

  const collectedEmojis = useMemo(() => new Set(collected.map((c) => c.emoji)), [collected]);

  const matchesQuery = useCallback(
    (item: EmojiItem, query: string): boolean => {
      if (!query) return true;
      const q = query.toLowerCase().trim();
      if (!q) return true;
      if (item.name.toLowerCase().includes(q)) return true;
      for (const kw of item.keywords) {
        if (kw.toLowerCase().includes(q)) return true;
      }
      const category = CATEGORIES.find((c) => c.id === item.category);
      if (category && category.label.toLowerCase().includes(q)) return true;
      return false;
    },
    []
  );

  const filteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return EMOJIS.filter((e) => matchesQuery(e, searchQuery));
  }, [searchQuery, matchesQuery]);

  const addToCollection = useCallback(
    (item: EmojiItem) => {
      setCollected((prev) => {
        if (prev.some((c) => c.emoji === item.emoji)) return prev;
        if (prev.length >= MAX_COLLECTION) {
          setIsFullWarning(true);
          return prev;
        }
        setIsFullWarning(false);
        return [{ emoji: item.emoji, name: item.name, addedAt: Date.now() }, ...prev];
      });
    },
    []
  );

  const removeFromCollection = useCallback((emoji: string) => {
    setCollected((prev) => {
      const result = prev.filter((c) => c.emoji !== emoji);
      if (result.length < MAX_COLLECTION) {
        setIsFullWarning(false);
      }
      return result;
    });
  }, []);

  const isCollected = useCallback(
    (emoji: string) => collectedEmojis.has(emoji),
    [collectedEmojis]
  );

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const exportCollection = useCallback(() => {
    if (collected.length === 0) return;
    const sorted = [...collected].sort((a, b) => b.addedAt - a.addedAt);
    const lines = sorted.map((c) => `${c.emoji}\t${c.name}`);
    const content = lines.join('\n');
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const filename = `emoji_collection_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
      now.getDate()
    )}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.txt`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [collected]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">表情符号收藏管理器</h1>
        <p className="app-subtitle">快速浏览、搜索和收藏您喜欢的表情符号</p>
      </header>

      <div className="main-layout">
        <main className="main-content">
          <div className="search-container">
            {isFullWarning && (
              <div className="search-warning">收藏已满，请先移除部分表情</div>
            )}
            <div className="search-input-wrapper">
              <svg
                className="search-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="搜索表情符号，如：微笑、smile..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          {filteredBySearch !== null && (
            <div className="search-result-count">
              找到 {filteredBySearch.length} 个结果
            </div>
          )}

          <EmojiGrid
            categories={CATEGORIES}
            emojis={EMOJIS}
            searchResults={filteredBySearch}
            onEmojiClick={addToCollection}
            isCollected={isCollected}
            matchesQuery={matchesQuery}
            searchQuery={searchQuery}
          />
        </main>

        <div className="sidebar-divider" />

        <CollectionSidebar
          collected={collected}
          maxLimit={MAX_COLLECTION}
          onRemove={removeFromCollection}
          onExport={exportCollection}
          isOpen={sidebarOpen}
          onClose={closeSidebar}
        />
      </div>

      <div
        className={`sidebar-backdrop ${sidebarOpen ? 'visible' : 'hidden-backdrop'}`}
        onClick={closeSidebar}
      />

      <button
        className="floating-btn"
        onClick={toggleSidebar}
        aria-label="打开收藏夹"
      >
        ♥
        {collected.length > 0 && (
          <span className="floating-badge">{collected.length}</span>
        )}
      </button>
    </div>
  );
}

export default App;
