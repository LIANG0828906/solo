import { useEffect, useMemo, useState } from 'react';
import type { Note } from '../types';
import { formatDate } from '../utils/markdown';

interface NoteListProps {
  notes: Note[];
  currentNoteId: string | null;
  onSelect: (id: string) => void;
  onCreateNew: () => void;
  onDelete: (id: string) => void;
  searchKeyword: string;
  onSearchChange: (v: string) => void;
  selectedTag: string | null;
  onTagSelect: (t: string | null) => void;
}

interface FilteredItem extends Note {
  _animKey: number;
}

export default function NoteList({
  notes,
  currentNoteId,
  onSelect,
  onCreateNew,
  onDelete,
  searchKeyword,
  onSearchChange,
  selectedTag,
  onTagSelect,
}: NoteListProps) {
  const [debounced, setDebounced] = useState(searchKeyword);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchKeyword), 200);
    return () => clearTimeout(t);
  }, [searchKeyword]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [notes]);

  const filtered = useMemo<FilteredItem[]>(() => {
    const kw = debounced.trim().toLowerCase();
    const list = notes.filter((n) => {
      if (selectedTag && !n.tags.includes(selectedTag)) return false;
      if (kw && n.title.toLowerCase().indexOf(kw) === -1) return false;
      return true;
    }).map((n, i) => ({ ...n, _animKey: i }));
    list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return list;
  }, [notes, debounced, selectedTag]);

  return (
    <div className="note-list-container" style={listContainerStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🌱</span>
          <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: 0.5, color: '#fff', margin: 0 }}>
            数字花园
          </h1>
        </div>
        <button onClick={onCreateNew} style={newBtnStyle} title="新建笔记">
          <span style={{ fontSize: 18, lineHeight: 1 }}>＋</span>
        </button>
      </div>

      <div style={searchWrapStyle}>
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="🔍 搜索笔记标题..."
          style={searchInputStyle}
        />
      </div>

      {allTags.length > 0 && (
        <div style={tagsWrapStyle}>
          {selectedTag && (
            <button
              onClick={() => onTagSelect(null)}
              style={{ ...tagChipStyle, background: 'var(--accent)', marginRight: 6 }}
            >
              × 清除筛选
            </button>
          )}
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => onTagSelect(selectedTag === t ? null : t)}
              style={{
                ...tagChipStyle,
                background: selectedTag === t ? 'var(--accent)' : 'var(--tag-bg)',
                opacity: selectedTag && selectedTag !== t ? 0.45 : 1,
              }}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '8px 16px', letterSpacing: 0.3 }}>
        共 {filtered.length} 篇笔记
      </div>

      <div style={listScrollStyle}>
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>💭</div>
            {debounced || selectedTag ? '没有匹配的笔记' : '还没有笔记，点击右上角 ＋ 开始记录'}
          </div>
        )}
        {filtered.map((n, idx) => {
          const active = n.id === currentNoteId;
          const activeBg = 'linear-gradient(90deg, rgba(233,69,96,0.08), rgba(15,52,96,0.35))';
          return (
            <div
              key={n.id}
              className="note-item"
              onClick={() => onSelect(n.id)}
              style={{
                ...itemBaseStyle,
                animation: `fadeIn var(--transition-normal) ${Math.min(idx * 20, 120)}ms ease-out both`,
                borderLeftColor: active ? 'var(--accent)' : 'transparent',
                background: active ? activeBg : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = 'rgba(15,52,96,0.25)';
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={itemTitleStyle(active)}>{n.title}</h3>
                <button
                  className="note-del-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`确定删除笔记「${n.title}」？`)) onDelete(n.id);
                  }}
                  style={delBtnStyle}
                  title="删除笔记"
                >
                  <span style={{ fontSize: 15 }}>✕</span>
                </button>
              </div>
              <div style={itemMetaStyle}>
                <span>📅 {formatDate(n.updatedAt)}</span>
              </div>
              {n.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                  {n.tags.slice(0, 4).map((t) => (
                    <span
                      key={t}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTagSelect(t);
                      }}
                      style={{
                        display: 'inline-block',
                        background: 'var(--tag-bg)',
                        color: 'var(--tag-text)',
                        padding: '1px 7px',
                        borderRadius: 4,
                        fontSize: 11,
                        cursor: 'pointer',
                        transition: 'opacity 150ms',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.opacity = '0.8')}
                      onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const listContainerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--bg-sidebar)',
  borderRight: '1px solid var(--border-color)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '18px 18px 14px',
  borderBottom: '1px solid var(--border-color)',
};

const newBtnStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 8,
  background: 'linear-gradient(135deg, var(--accent), #ff6b8a)',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  boxShadow: '0 4px 12px rgba(233, 69, 96, 0.35)',
};

const searchWrapStyle: React.CSSProperties = { padding: '12px 14px 0' };

const searchInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 13px',
  background: 'rgba(26, 26, 46, 0.6)',
  border: '1px solid var(--border-color)',
  borderRadius: 8,
  fontSize: 13,
  color: 'var(--text-main)',
  transition: 'border-color 200ms, background 200ms',
};

const tagsWrapStyle: React.CSSProperties = {
  padding: '12px 14px 4px',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  borderBottom: '1px solid var(--border-color)',
  paddingBottom: 12,
};

const tagChipStyle: React.CSSProperties = {
  padding: '3px 10px',
  borderRadius: 12,
  color: '#fff',
  fontSize: 12,
  fontWeight: 500,
  transition: 'all 200ms',
};

const listScrollStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '6px 8px 16px',
};

const itemBaseStyle: React.CSSProperties = {
  padding: '12px 14px',
  margin: '4px 6px',
  borderRadius: 8,
  cursor: 'pointer',
  borderLeft: '3px solid transparent',
  transition: 'background var(--transition-fast), border-color var(--transition-fast)',
};

const itemTitleStyle = (active: boolean): React.CSSProperties => ({
  fontSize: 14,
  fontWeight: active ? 700 : 600,
  color: active ? '#fff' : 'var(--text-main)',
  marginBottom: 4,
  marginTop: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flex: 1,
  marginRight: 8,
});

const itemMetaStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--text-muted)',
  letterSpacing: 0.2,
};

const delBtnStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: 6,
  color: 'var(--text-muted)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 150ms',
};

if (typeof document !== 'undefined') {
  const id = '__dg_note_list_style';
  if (!document.getElementById(id)) {
    const styleEl = document.createElement('style');
    styleEl.id = id;
    styleEl.textContent = `
      .note-del-btn { opacity: 0; }
      .note-item:hover .note-del-btn { opacity: 0.85; background: rgba(233,69,96,0.15); color: var(--accent); }
      .note-list-container input:focus { border-color: var(--link-color) !important; background: rgba(15,52,96,0.5) !important; }
    `;
    document.head.appendChild(styleEl);
  }
}
