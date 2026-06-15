import React, { useState, useRef, useEffect, useCallback } from 'react';
import { InspirationCard, Note, Book } from '../../types';

interface InspirationBoardProps {
  notes: Note[];
  books: Book[];
  onRemoveCard: (id: string) => void;
}

const STORAGE_KEY = 'inspiration_board_layout';

function loadLayout(): InspirationCard[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLayout(cards: InspirationCard[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

function tagToColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 45%, 55%)`;
}

const InspirationBoard: React.FC<InspirationBoardProps> = ({ notes, books, onRemoveCard }) => {
  const [cards, setCards] = useState<InspirationCard[]>(loadLayout);
  const [dragging, setDragging] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const boardRef = useRef<HTMLDivElement>(null);
  const dragInfoRef = useRef<{ startX: number; startY: number; cardX: number; cardY: number } | null>(null);

  useEffect(() => {
    saveLayout(cards);
  }, [cards]);

  const getBookTitle = useCallback(
    (bookId: string) => {
      const book = books.find((b) => b.id === bookId);
      return book ? book.title : '未知书籍';
    },
    [books]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, cardId: string) => {
      e.preventDefault();
      const card = cards.find((c) => c.id === cardId);
      if (!card) return;

      setDragging(cardId);
      dragInfoRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        cardX: card.x,
        cardY: card.y,
      };
    },
    [cards]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging || !dragInfoRef.current) return;
      const { startX, startY, cardX, cardY } = dragInfoRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      setCards((prev) =>
        prev.map((c) => (c.id === dragging ? { ...c, x: cardX + dx, y: cardY + dy } : c))
      );
    },
    [dragging]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    dragInfoRef.current = null;
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  const handleAddCard = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    const existing = cards.find((c) => c.noteId === noteId);
    if (existing) return;

    const newCard: InspirationCard = {
      id: `insp-${Date.now()}`,
      noteId: note.id,
      bookId: note.bookId,
      summary: note.highlightText || note.thought || `第${note.pageNumber}页笔记`,
      tags: note.tags,
      x: 20 + Math.random() * 200,
      y: 20 + Math.random() * 200,
    };
    setCards((prev) => [...prev, newCard]);
  };

  const handleRemoveCard = (cardId: string) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    onRemoveCard(cardId);
  };

  const handleClearBoard = () => {
    if (window.confirm('确定要清空灵感板吗？')) {
      setCards([]);
    }
  };

  const notesNotOnBoard = notes.filter((n) => !cards.some((c) => c.noteId === n.id));

  return (
    <div>
      <div className="inspiration-toolbar">
        <select
          className="add-to-board-select"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) {
              handleAddCard(e.target.value);
              e.target.value = '';
            }
          }}
        >
          <option value="" disabled>
            + 从笔记添加到灵感板...
          </option>
          {notesNotOnBoard.map((note) => (
            <option key={note.id} value={note.id}>
              {(note.highlightText || note.thought || '笔记').substring(0, 30)}...
              (第{note.pageNumber}页)
            </option>
          ))}
        </select>
        {cards.length > 0 && (
          <button className="btn btn-sm btn-secondary" onClick={handleClearBoard}>
            清空灵感板
          </button>
        )}
      </div>

      {cards.length === 0 ? (
        <div className="inspiration-board">
          <div className="inspiration-board-empty">
            <div style={{ fontSize: 48, marginBottom: 12 }}>💡</div>
            <div>灵感板是空的，从上方下拉菜单添加笔记卡片</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>拖拽卡片来自由排列你的灵感</div>
          </div>
        </div>
      ) : (
        <div
          ref={boardRef}
          className="inspiration-board"
          style={{ minHeight: Math.max(600, ...cards.map((c) => c.y + 200)) }}
        >
          {cards.map((card) => {
            const isDragging = dragging === card.id;
            return (
              <div
                key={card.id}
                className={`inspiration-card ${isDragging ? 'dragging' : 'inspiration-card-snapped'}`}
                style={{
                  left: card.x,
                  top: card.y,
                  borderLeft: `3px solid ${card.tags.length > 0 ? tagToColor(card.tags[0]) : 'var(--accent)'}`,
                }}
                onMouseDown={(e) => handleMouseDown(e, card.id)}
              >
                <button
                  className="inspiration-card-remove"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => handleRemoveCard(card.id)}
                >
                  ✕
                </button>
                <div className="inspiration-card-book">📖 {getBookTitle(card.bookId)}</div>
                <div className="inspiration-card-summary">{card.summary}</div>
                {card.tags.length > 0 && (
                  <div className="inspiration-card-tags">
                    {card.tags.map((tag) => (
                      <span key={tag} className="inspiration-card-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InspirationBoard;
