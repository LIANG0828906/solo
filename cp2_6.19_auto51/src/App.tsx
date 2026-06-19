import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { useNoteStore } from '@/store';
import { Note } from '@/types';
import NoteCard from '@/components/NoteCard';
import NoteEditor from '@/components/NoteEditor';
import { getTagColor } from '@/components/NoteCard';
import NoteDetail from '@/pages/NoteDetail';

function HomePage() {
  const navigate = useNavigate();
  const notes = useNoteStore((s) => s.notes);
  const searchQuery = useNoteStore((s) => s.searchQuery);
  const activeTag = useNoteStore((s) => s.activeTag);
  const setSearchQuery = useNoteStore((s) => s.setSearchQuery);
  const setActiveTag = useNoteStore((s) => s.setActiveTag);

  const [localQuery, setLocalQuery] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [newNoteId, setNewNoteId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(localQuery);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [localQuery, setSearchQuery]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [notes]);

  const filteredNotes = useMemo(() => {
    let result = notes;
    if (activeTag) {
      result = result.filter((n) => n.tags.includes(activeTag));
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [notes, searchQuery, activeTag]);

  const handleCardClick = useCallback(
    (note: Note) => {
      navigate(`/note/${note.id}`);
    },
    [navigate]
  );

  const handleTagClick = useCallback(
    (tag: string) => {
      setActiveTag(activeTag === tag ? null : tag);
    },
    [activeTag, setActiveTag]
  );

  const handleEditorClose = useCallback(() => {
    setIsEditorOpen(false);
  }, []);

  useEffect(() => {
    if (newNoteId) {
      const timer = setTimeout(() => setNewNoteId(null), 600);
      return () => clearTimeout(timer);
    }
  }, [newNoteId]);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-top">
          <h1 className="app-logo">KnowSpace</h1>
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input
              className="search-input"
              type="text"
              placeholder="搜索笔记标题或标签..."
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
            />
          </div>
        </div>
        {allTags.length > 0 && (
          <div className="tag-filter-bar">
            {allTags.map((tag) => (
              <button
                key={tag}
                className={`tag-filter-chip ${
                  activeTag === tag ? 'tag-filter-chip-active' : ''
                }`}
                style={{
                  '--tag-color': getTagColor(tag),
                } as React.CSSProperties}
                onClick={() => handleTagClick(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="card-grid">
        {filteredNotes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onClick={handleCardClick}
            isNew={note.id === newNoteId}
            isHidden={!!activeTag && !note.tags.includes(activeTag)}
          />
        ))}
        {filteredNotes.length === 0 && (
          <div className="empty-state">
            <p className="empty-title">
              {searchQuery || activeTag ? '没有匹配的笔记' : '还没有笔记'}
            </p>
            <p className="empty-desc">
              {searchQuery || activeTag
                ? '试试调整搜索条件或切换标签'
                : '点击右下角按钮创建第一条笔记'}
            </p>
          </div>
        )}
      </main>

      <button className="fab-btn" onClick={() => setIsEditorOpen(true)}>
        <Plus size={24} />
      </button>

      <NoteEditor isOpen={isEditorOpen} onClose={handleEditorClose} />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/note/:id" element={<NoteDetail />} />
    </Routes>
  );
}
