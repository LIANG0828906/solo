import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, Plus } from 'lucide-react';
import { useNoteStore } from '@/store';
import { Note } from '@/types';
import NoteCard from '@/components/NoteCard';
import NoteEditor from '@/components/NoteEditor';
import NoteDetailModal from '@/components/NoteDetailModal';
import { getTagColor } from '@/components/NoteCard';

export default function App() {
  const notes = useNoteStore((s) => s.notes);
  const searchQuery = useNoteStore((s) => s.searchQuery);
  const activeTag = useNoteStore((s) => s.activeTag);
  const setSearchQuery = useNoteStore((s) => s.setSearchQuery);
  const setActiveTag = useNoteStore((s) => s.setActiveTag);

  const [localQuery, setLocalQuery] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [newNoteId, setNewNoteId] = useState<string | null>(null);
  const [detailNote, setDetailNote] = useState<Note | null>(null);
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

  const { visibleNotes, filterOutMap } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matchSearch = (n: Note) =>
      !q ||
      n.title.toLowerCase().includes(q) ||
      n.tags.some((t) => t.toLowerCase().includes(q));
    const matchTag = (n: Note) =>
      !activeTag || n.tags.includes(activeTag);

    const visible: Note[] = [];
    const filterMap = new Map<string, boolean>();

    notes.forEach((note) => {
      const passesSearch = matchSearch(note);
      const passesTag = matchTag(note);

      if (passesSearch) {
        visible.push(note);
        if (!passesTag && activeTag) {
          filterMap.set(note.id, true);
        }
      }
    });

    return { visibleNotes: visible, filterOutMap: filterMap };
  }, [notes, searchQuery, activeTag]);

  const handleCardClick = useCallback((note: Note) => {
    setDetailNote(note);
  }, []);

  const handleTagClick = useCallback(
    (tag: string) => {
      setActiveTag(activeTag === tag ? null : tag);
    },
    [activeTag, setActiveTag]
  );

  const handleNoteCreated = useCallback((noteId: string) => {
    setNewNoteId(noteId);
  }, []);

  useEffect(() => {
    if (newNoteId) {
      const timer = setTimeout(() => setNewNoteId(null), 700);
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
                type="button"
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
        {visibleNotes.map((note, idx) => (
          <NoteCard
            key={note.id}
            note={note}
            onClick={handleCardClick}
            isNew={note.id === newNoteId}
            isFilteredOut={filterOutMap.get(note.id) === true}
            animationIndex={idx}
          />
        ))}
        {visibleNotes.length === 0 && (
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

      <button
        type="button"
        className="fab-btn"
        onClick={() => setIsEditorOpen(true)}
      >
        <Plus size={24} />
      </button>

      <NoteEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onNoteCreated={handleNoteCreated}
      />

      <NoteDetailModal
        isOpen={detailNote !== null}
        onClose={() => setDetailNote(null)}
        note={detailNote}
      />
    </div>
  );
}
