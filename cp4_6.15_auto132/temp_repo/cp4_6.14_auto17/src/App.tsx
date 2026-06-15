import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { HashRouter, Routes, Route, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import type { Note } from './types';
import NoteList from './components/NoteList';
import Editor from './components/Editor';
import GraphView from './components/GraphView';
import {
  loadNotes, saveNotes, createNote, updateNote, rebuildNoteLinks,
} from './utils/localStorage';

const SIDEBAR_WIDTH = 280;

function AppInner() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editorGraphPct, setEditorGraphPct] = useState(55);
  const [editorSplitPct, setEditorSplitPct] = useState(48);
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'graph'>('split');
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const draggingRef = useRef(false);
  const resizerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotes().then((ns) => {
      setNotes(ns);
      setLoaded(true);
      if (!params.id && ns.length > 0) {
        navigate(`/note/${ns[0].id}`, { replace: true });
      }
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveNotes(notes);
  }, [notes, loaded]);

  const currentNoteId = params.id ?? null;
  const currentNote = useMemo(
    () => notes.find((n) => n.id === currentNoteId) ?? null,
    [notes, currentNoteId],
  );

  // Refresh linked ids whenever notes content changes
  useEffect(() => {
    if (!loaded || notes.length === 0) return;
    const rebuilt = rebuildNoteLinks(notes);
    const changed = rebuilt.some((n, i) => {
      const orig = notes[i];
      return !orig || n.linkedIds.join(',') !== orig.linkedIds.join(',');
    });
    if (changed) setNotes(rebuilt);
  }, [notes.map((n) => n.content).join('|||')]);

  const handleCreate = useCallback(() => {
    const newNote = createNote({ content: '# 新笔记\n\n开始记录你的想法...\n' }, notes);
    setNotes((prev) => [...prev, newNote]);
    navigate(`/note/${newNote.id}`);
    setSearchKeyword('');
    setSelectedTag(null);
  }, [notes, navigate]);

  const handleDelete = useCallback((id: string) => {
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== id);
      // Cleanup references
      const cleaned = next.map((n) => ({
        ...n,
        linkedIds: n.linkedIds.filter((lid) => lid !== id),
      }));
      return cleaned;
    });
    if (currentNoteId === id) {
      const remaining = notes.filter((n) => n.id !== id);
      navigate(remaining.length > 0 ? `/note/${remaining[0].id}` : '/');
    }
  }, [currentNoteId, notes, navigate]);

  const handleSelect = useCallback((id: string) => {
    navigate(`/note/${id}`);
  }, [navigate]);

  const handleChangeContent = useCallback((content: string) => {
    if (!currentNoteId) return;
    setNotes((prev) => prev.map((n) =>
      n.id === currentNoteId ? updateNote(n, content, prev) : n));
  }, [currentNoteId]);

  const handleLinkClick = useCallback((title: string) => {
    const found = notes.find((n) => n.title.trim() === title.trim());
    if (found) {
      navigate(`/note/${found.id}`);
    } else {
      // auto-create note if not exist
      if (confirm(`笔记「${title}」不存在，要创建吗？`)) {
        const newNote = createNote({ content: `# ${title}\n\n` }, notes);
        setNotes((prev) => [...prev, newNote]);
        navigate(`/note/${newNote.id}`);
      }
    }
  }, [notes, navigate]);

  const handleTagClick = useCallback((tag: string) => {
    setSelectedTag(tag);
  }, []);

  // Resizer between editor and graph
  const startResize = (e: React.MouseEvent, mode: 'editor-graph' | 'editor-split') => {
    e.preventDefault();
    draggingRef.current = true;
    const startX = e.clientX;
    const container = e.currentTarget.parentElement?.parentElement as HTMLElement | null;
    const rect = container?.getBoundingClientRect();
    const containerWidth = rect?.width ?? 1000;
    const startPct = mode === 'editor-graph' ? editorGraphPct : editorSplitPct;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const delta = (dx / containerWidth) * 100;
      const next = Math.max(25, Math.min(75, startPct + delta));
      if (mode === 'editor-graph') setEditorGraphPct(next);
      else setEditorSplitPct(next);
    };
    const onUp = () => {
      draggingRef.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'col-resize';
  };

  if (!loaded) {
    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-main)',
      }}>
        <div style={{ fontSize: 16, color: 'var(--text-muted)' }}>🌱 加载数字花园中...</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--bg-main)' }}>
      <aside style={{
        width: SIDEBAR_WIDTH, minWidth: SIDEBAR_WIDTH, maxWidth: SIDEBAR_WIDTH,
        height: '100%', flexShrink: 0, display: 'flex',
      }}>
        <NoteList
          notes={notes}
          currentNoteId={currentNoteId}
          onSelect={handleSelect}
          onCreateNew={handleCreate}
          onDelete={handleDelete}
          searchKeyword={searchKeyword}
          onSearchChange={setSearchKeyword}
          selectedTag={selectedTag}
          onTagSelect={setSelectedTag}
        />
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>
        <div style={viewBarStyle}>
          <div style={{ display: 'flex', gap: 4, padding: '0 8px' }}>
            {(['split', 'editor', 'graph'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                style={{
                  ...tabBtnStyle,
                  background: viewMode === m ? 'var(--accent)' : 'rgba(15,52,96,0.4)',
                  color: viewMode === m ? '#fff' : 'var(--text-muted)',
                }}
              >
                {m === 'split' ? '🪟 分栏' : m === 'editor' ? '📝 编辑器' : '🔗 图谱'}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '0 16px', flex: 1, textAlign: 'center' }}>
            {location.pathname === '/' ? '请选择或创建一篇笔记' : `笔记ID: ${currentNoteId?.slice(0, 8) ?? ''}...`}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', minHeight: 0, minWidth: 0, position: 'relative' }}>
          {/* Editor area */}
          {(viewMode === 'split' || viewMode === 'editor') && (
            <section style={{
              width: viewMode === 'split' ? `${editorGraphPct}%` : '100%',
              minWidth: 0,
              height: '100%',
              display: 'flex',
              animation: 'fadeIn var(--transition-normal) ease-out',
            }}>
              <Editor
                note={currentNote}
                notes={notes}
                onChangeContent={handleChangeContent}
                onLinkClick={handleLinkClick}
                onTagClick={handleTagClick}
                splitPct={editorSplitPct}
              />
              <div
                style={resizerStyle}
                onMouseDown={(e) => startResize(e, 'editor-split')}
                title="拖拽调整编辑器分栏"
              >
                <div style={resizerHandleStyle} />
              </div>
            </section>
          )}

          {viewMode === 'split' && (
            <div
              ref={resizerRef}
              style={bigResizerStyle}
              onMouseDown={(e) => startResize(e, 'editor-graph')}
              title="拖拽调整编辑器/图谱比例"
            >
              <div style={bigResizerHandleStyle} />
            </div>
          )}

          {/* Graph area */}
          {(viewMode === 'split' || viewMode === 'graph') && (
            <section style={{
              width: viewMode === 'split' ? `${100 - editorGraphPct}%` : '100%',
              minWidth: 0,
              height: '100%',
              flexShrink: 0,
              animation: 'fadeIn var(--transition-normal) ease-out',
              borderLeft: viewMode === 'split' ? '1px solid var(--border-color)' : 'none',
            }}>
              <GraphView
                notes={notes}
                currentNoteId={currentNoteId}
                onSelectNote={handleSelect}
              />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

const viewBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '8px 12px',
  minHeight: 44,
  borderBottom: '1px solid var(--border-color)',
  background: 'rgba(22, 33, 62, 0.6)',
};

const tabBtnStyle: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 600,
  transition: 'all var(--transition-fast)',
};

const resizerStyle: React.CSSProperties = {
  position: 'absolute',
  right: 0,
  top: 44,
  bottom: 0,
  width: 6,
  cursor: 'col-resize',
  zIndex: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const resizerHandleStyle: React.CSSProperties = {
  width: 2,
  height: 60,
  background: 'var(--border-color)',
  borderRadius: 2,
  transition: 'background var(--transition-fast)',
};

const bigResizerStyle: React.CSSProperties = {
  position: 'absolute',
  top: 44,
  bottom: 0,
  width: 8,
  cursor: 'col-resize',
  zIndex: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const bigResizerHandleStyle: React.CSSProperties = {
  width: 3,
  height: 90,
  background: 'linear-gradient(180deg, transparent, var(--link-color), transparent)',
  borderRadius: 2,
  boxShadow: '0 0 10px rgba(74,144,217,0.3)',
};

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<AppInner />} />
        <Route path="/note/:id" element={<AppInner />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
