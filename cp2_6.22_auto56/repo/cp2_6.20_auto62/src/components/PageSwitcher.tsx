import { useState, useRef, useEffect } from 'react';
import { Plus, X, Edit3 } from 'lucide-react';
import { useBoardStore } from '../store/boardStore';

export default function PageSwitcher() {
  const {
    boards,
    activeBoardId,
    pageTransition,
    addBoard,
    removeBoard,
    switchBoard,
    renameBoard,
  } = useBoardStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  useEffect(() => {
    if (activeTabRef.current && scrollRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeBoardId]);

  const handleDoubleClick = (id: string, name: string) => {
    setEditingId(id);
    setEditValue(name);
  };

  const handleRename = (id: string) => {
    const trimmed = editValue.trim();
    if (trimmed) {
      renameBoard(id, trimmed);
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === 'Enter') {
      handleRename(id);
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditValue('');
    }
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (boards.length > 1) {
      removeBoard(id);
    }
  };

  const containerStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    gap: '8px',
    background: 'var(--color-glass)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-sm)',
    zIndex: 10,
  };

  const scrollContainerStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    overflowY: 'hidden',
    scrollbarWidth: 'thin',
    paddingBottom: '2px',
    alignItems: 'center',
  };

  const getTabStyle = (id: string, isActive: boolean): React.CSSProperties => ({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    minWidth: '100px',
    maxWidth: '200px',
    height: '36px',
    borderRadius: '8px',
    background: isActive ? 'var(--color-primary)' : 'var(--color-glass)',
    color: isActive ? '#ffffff' : 'var(--color-text)',
    fontSize: '13px',
    fontWeight: isActive ? 600 : 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    transition: 'all var(--transition-fast)',
    transform: hoveredId === id ? 'scale(1.05)' : 'scale(1)',
    cursor: 'pointer',
    userSelect: 'none',
    flexShrink: 0,
    boxShadow: isActive ? '0 2px 8px rgba(33, 150, 243, 0.4)' : 'var(--shadow-sm)',
    border: isActive ? 'none' : '1px solid var(--color-border)',
  });

  const tabActiveStyle: React.CSSProperties = {
    outline: 'none',
    transform: 'scale(0.95)',
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    background: 'rgba(255, 255, 255, 0.95)',
    color: 'var(--color-text)',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: 500,
    border: '2px solid var(--color-primary)',
    outline: 'none',
  };

  const deleteBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    opacity: hoveredId === null ? 0 : (hoveredId === 'add' ? 1 : 0),
    transition: 'opacity var(--transition-fast), background-color var(--transition-fast)',
    flexShrink: 0,
  };

  const addBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: hoveredId === 'add' ? 'var(--color-primary)' : 'var(--color-glass)',
    color: hoveredId === 'add' ? '#ffffff' : 'var(--color-text)',
    transition: 'all var(--transition-fast)',
    transform: hoveredId === 'add' ? 'scale(1.05)' : 'scale(1)',
    flexShrink: 0,
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--color-border)',
  };

  const editIconStyle: React.CSSProperties = {
    width: '14px',
    height: '14px',
    opacity: 0.7,
    flexShrink: 0,
  };

  const [pressedId, setPressedId] = useState<string | null>(null);

  return (
    <div style={containerStyle}>
      <div
        ref={scrollRef}
        style={{
          ...scrollContainerStyle,
          ...(pageTransition.active
            ? {
                animation: `slideIn${
                  pageTransition.direction === 'right' ? 'Right' : 'Left'
                } 0.4s cubic-bezier(0.4, 0, 0.2, 1)`,
              }
            : {}),
        }}
      >
        {boards.map((board) => {
          const isActive = board.id === activeBoardId;
          const isEditing = editingId === board.id;
          const isHovered = hoveredId === board.id;
          const isPressed = pressedId === board.id;

          return (
            <button
              key={board.id}
              ref={isActive ? activeTabRef : null}
              style={{
                ...getTabStyle(board.id, isActive),
                ...(isPressed ? tabActiveStyle : {}),
              }}
              onClick={() => !isEditing && switchBoard(board.id)}
              onMouseEnter={() => setHoveredId(board.id)}
              onMouseLeave={() => {
                setHoveredId(null);
                setPressedId(null);
              }}
              onMouseDown={() => setPressedId(board.id)}
              onMouseUp={() => setPressedId(null)}
              onDoubleClick={() => handleDoubleClick(board.id, board.name)}
            >
              {isEditing ? (
                <input
                  ref={inputRef}
                  style={inputStyle}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleRename(board.id)}
                  onKeyDown={(e) => handleKeyDown(e, board.id)}
                  onClick={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <Edit3 style={editIconStyle} />
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {board.name}
                  </span>
                </>
              )}
              {!isEditing && boards.length > 1 && (
                <button
                  style={{
                    ...deleteBtnStyle,
                    opacity: isHovered ? 1 : 0,
                    pointerEvents: isHovered ? 'auto' : 'none',
                  }}
                  onMouseEnter={(e) => e.stopPropagation()}
                  onClick={(e) => handleRemove(e, board.id)}
                  title="删除页面"
                >
                  <X width={14} height={14} />
                </button>
              )}
            </button>
          );
        })}
      </div>

      <button
        style={{
          ...addBtnStyle,
          ...(pressedId === 'add' ? { transform: 'scale(0.95)' } : {}),
        }}
        onMouseEnter={() => setHoveredId('add')}
        onMouseLeave={() => {
          setHoveredId(null);
          setPressedId(null);
        }}
        onMouseDown={() => setPressedId('add')}
        onMouseUp={() => setPressedId(null)}
        onClick={() => addBoard()}
        title="新建页面"
      >
        <Plus width={18} height={18} />
      </button>
    </div>
  );
}
