import { useState, useMemo, useEffect } from 'react';
import { useNoteStore, Note } from '@/store/noteStore';
import { COLORS, SIDEBAR_WIDTH } from '@/utils/constants';
import { Plus, Search, Trash2, Tag } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface TimelineProps {
  isOpen: boolean;
  onClose?: () => void;
}

type DateGroup = 'today' | 'yesterday' | 'earlier';

const formatDate = (date: number): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
};

const getDateGroup = (timestamp: number): DateGroup => {
  const now = new Date();
  const noteDate = new Date(timestamp);

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const noteDay = new Date(noteDate.getFullYear(), noteDate.getMonth(), noteDate.getDate());

  if (noteDay.getTime() === today.getTime()) {
    return 'today';
  } else if (noteDay.getTime() === yesterday.getTime()) {
    return 'yesterday';
  } else {
    return 'earlier';
  }
};

const getDateGroupLabel = (group: DateGroup): string => {
  const labels: Record<DateGroup, string> = {
    today: '今天',
    yesterday: '昨天',
    earlier: '更早',
  };
  return labels[group];
};

const highlightText = (text: string, query: string): React.ReactNode => {
  if (!query.trim()) return text;

  const lowerQuery = query.toLowerCase();
  const lowerText = text.toLowerCase();
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let index = lowerText.indexOf(lowerQuery);

  while (index !== -1) {
    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index));
    }
    parts.push(
      <span
        key={`highlight-${index}`}
        style={{ backgroundColor: COLORS.yellow, color: '#000' }}
      >
        {text.slice(index, index + query.length)}
      </span>
    );
    lastIndex = index + query.length;
    index = lowerText.indexOf(lowerQuery, lastIndex);
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
};

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

const Timeline = ({ isOpen, onClose }: TimelineProps) => {
  const {
    notes,
    currentNoteId,
    setCurrentNote,
    createNote,
    deleteNote,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
  } = useNoteStore();

  const [searchInput, setSearchInput] = useState('');
  const [hoveredNoteId, setHoveredNoteId] = useState<string | null>(null);
  const [animatingNoteId, setAnimatingNoteId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchInput, 200);

  useEffect(() => {
    setSearchQuery(debouncedSearch);
  }, [debouncedSearch, setSearchQuery]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach((note) => {
      note.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchesSearch =
        debouncedSearch === '' ||
        note.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        note.content.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        note.tags.some((tag) => tag.toLowerCase().includes(debouncedSearch.toLowerCase()));

      const matchesTag = selectedTag === null || note.tags.includes(selectedTag);

      return matchesSearch && matchesTag;
    });
  }, [notes, debouncedSearch, selectedTag]);

  const groupedNotes = useMemo(() => {
    const groups: Record<DateGroup, Note[]> = {
      today: [],
      yesterday: [],
      earlier: [],
    };

    const sortedNotes = [...filteredNotes].sort((a, b) => b.createdAt - a.createdAt);

    sortedNotes.forEach((note) => {
      const group = getDateGroup(note.createdAt);
      groups[group].push(note);
    });

    return groups;
  }, [filteredNotes]);

  const handleNoteClick = (noteId: string) => {
    setAnimatingNoteId(noteId);
    setCurrentNote(noteId);
    setTimeout(() => {
      setAnimatingNoteId(null);
    }, 300);
    if (onClose && window.innerWidth <= 768) {
      onClose();
    }
  };

  const handleCreateNote = () => {
    const newNote = createNote();
    setAnimatingNoteId(newNote.id);
    setTimeout(() => {
      setAnimatingNoteId(null);
    }, 300);
    if (onClose && window.innerWidth <= 768) {
      onClose();
    }
  };

  const handleDeleteNote = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这条笔记吗？')) {
      deleteNote(noteId);
    }
  };

  const handleTagClick = (tag: string) => {
    if (selectedTag === tag) {
      setSelectedTag(null);
    } else {
      setSelectedTag(tag);
    }
  };

  const groupOrder: DateGroup[] = ['today', 'yesterday', 'earlier'];

  const sidebarStyle: React.CSSProperties = {
    width: `${SIDEBAR_WIDTH}px`,
    backgroundColor: COLORS.woodDark,
    color: '#fff',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transition: 'transform 0.3s ease',
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex: 100,
    transform: isOpen ? 'translateX(0)' : `translateX(-${SIDEBAR_WIDTH}px)`,
  };

  const headerStyle: React.CSSProperties = {
    padding: '16px',
    borderBottom: `1px solid ${COLORS.woodMedium}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  };

  const newNoteButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    borderRadius: '50px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    width: '100%',
  };

  const newNoteButtonHoverStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    color: COLORS.woodDark,
  };

  const iconWrapperStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: COLORS.woodMedium,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  };

  const searchContainerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  };

  const searchIconStyle: React.CSSProperties = {
    position: 'absolute',
    left: '12px',
    color: '#999',
    width: '16px',
    height: '16px',
  };

  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px 10px 36px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: COLORS.woodMedium,
    color: '#fff',
    fontSize: '13px',
    outline: 'none',
  };

  const tagContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    padding: '8px 0',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  };

  const tagButtonStyle = (isSelected: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: isSelected ? COLORS.gold : COLORS.woodMedium,
    color: isSelected ? '#000' : '#fff',
    fontSize: '12px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease',
  });

  const notesListStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
  };

  const dateGroupStyle: React.CSSProperties = {
    padding: '16px 16px 8px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    position: 'sticky',
    top: 0,
    backgroundColor: COLORS.woodDark,
    zIndex: 1,
  };

  const noteItemStyle = (isActive: boolean, isAnimating: boolean): React.CSSProperties => ({
    position: 'relative',
    padding: '12px 16px',
    cursor: 'pointer',
    backgroundColor: isActive ? COLORS.woodMedium : 'transparent',
    borderLeft: `3px solid ${isActive ? COLORS.gold : 'transparent'}`,
    transition: 'background-color 0.2s ease',
    animation: isAnimating ? 'slideIn 0.3s ease-out' : 'none',
  });

  const noteTitleStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '6px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    paddingRight: '24px',
  };

  const noteMetaStyle: React.CSSProperties = {
    fontSize: '11px',
    color: '#999',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const deleteButtonStyle: React.CSSProperties = {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'all 0.2s ease',
  };

  const deleteButtonVisibleStyle: React.CSSProperties = {
    ...deleteButtonStyle,
    opacity: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  };

  const [isNewNoteHovered, setIsNewNoteHovered] = useState(false);

  return (
    <aside style={sidebarStyle}>
      <div style={headerStyle}>
        <button
          style={{
            ...newNoteButtonStyle,
            ...(isNewNoteHovered ? newNoteButtonHoverStyle : {}),
          }}
          onClick={handleCreateNote}
          onMouseEnter={() => setIsNewNoteHovered(true)}
          onMouseLeave={() => setIsNewNoteHovered(false)}
        >
          <div
            style={{
              ...iconWrapperStyle,
              backgroundColor: isNewNoteHovered ? COLORS.woodDark : COLORS.woodMedium,
            }}
          >
            <Plus size={18} color={isNewNoteHovered ? '#fff' : COLORS.gold} />
          </div>
          新建笔记
        </button>

        <div style={searchContainerStyle}>
          <Search style={searchIconStyle} />
          <input
            type="text"
            placeholder="搜索笔记..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={searchInputStyle}
          />
        </div>

        {allTags.length > 0 && (
          <div style={tagContainerStyle}>
            <button
              style={tagButtonStyle(selectedTag === null)}
              onClick={() => setSelectedTag(null)}
            >
              <Tag size={12} />
              全部
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                style={tagButtonStyle(selectedTag === tag)}
                onClick={() => handleTagClick(tag)}
              >
                <Tag size={12} />
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={notesListStyle}>
        {groupOrder.map((group) => (
          groupedNotes[group].length > 0 && (
            <div key={group}>
              <div style={dateGroupStyle}>
                {getDateGroupLabel(group)}
              </div>
              {groupedNotes[group].map((note) => {
                const isActive = currentNoteId === note.id;
                const isHovered = hoveredNoteId === note.id;
                const isAnimating = animatingNoteId === note.id;

                return (
                  <div
                    key={note.id}
                    style={noteItemStyle(isActive, isAnimating)}
                    onClick={() => handleNoteClick(note.id)}
                    onMouseEnter={() => setHoveredNoteId(note.id)}
                    onMouseLeave={() => setHoveredNoteId(null)}
                  >
                    <div style={noteTitleStyle}>
                      {highlightText(truncateText(note.title, 20), debouncedSearch)}
                    </div>
                    <div style={noteMetaStyle}>
                      <span>{formatDate(note.createdAt)}</span>
                      <span>{note.charCount} 字</span>
                    </div>
                    <button
                      style={isHovered ? deleteButtonVisibleStyle : deleteButtonStyle}
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      title="删除笔记"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )
        ))}

        {filteredNotes.length === 0 && (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#999',
              fontSize: '13px',
            }}
          >
            {debouncedSearch || selectedTag
              ? '没有找到匹配的笔记'
              : '暂无笔记，点击上方按钮创建'}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(-30px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: ${COLORS.woodMedium};
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #8D6E63;
        }
      `}</style>
    </aside>
  );
};

export default Timeline;
