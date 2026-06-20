import React, { useState, useEffect, useRef } from 'react';
import type { Book, Highlight } from '../store';

const COLORS = {
  primaryBg: '#1A1A2E',
  cardBg: '#2D2D2D',
  text: '#EAEAEA',
  accent: '#D4A574',
  border: '#3A3A3A',
  highlightBg: '#FFE4B5',
  loadingColor: '#FF6B6B',
};

interface BookCardProps {
  book: Book;
  onRemove: (bookId: string) => void;
  onGenerateSummary: (book: Book) => void;
  onAddHighlight: (bookId: string, highlight: Highlight) => void;
  onRemoveHighlight: (bookId: string, highlightId: string) => void;
  onAddNote: (bookId: string, highlightId: string, note: string) => void;
}

interface SelectionInfo {
  text: string;
  x: number;
  y: number;
  startOffset: number;
  endOffset: number;
}

const BookCard: React.FC<BookCardProps> = ({
  book,
  onRemove,
  onGenerateSummary,
  onAddHighlight,
  onRemoveHighlight,
  onAddNote,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [displayedSummary, setDisplayedSummary] = useState('');
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [showNoteInput, setShowNoteInput] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const summaryRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typingRef.current) {
      clearTimeout(typingRef.current);
    }
    if (book.summary && book.summary !== displayedSummary) {
      setDisplayedSummary('');
      let index = 0;
      const typeNext = () => {
        if (index < book.summary.length) {
          setDisplayedSummary(book.summary.slice(0, index + 1));
          index++;
          typingRef.current = setTimeout(typeNext, 20);
        }
      };
      typeNext();
    } else if (!book.summary) {
      setDisplayedSummary('');
    }
    return () => {
      if (typingRef.current) {
        clearTimeout(typingRef.current);
      }
    };
  }, [book.summary]);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(book.id);
    }, 400);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('.remove-btn') ||
      target.closest('.summary-btn') ||
      target.closest('.summary-text') ||
      target.closest('.toolbar') ||
      target.closest('.note-bubble') ||
      target.closest('.note-btn')
    ) {
      return;
    }
    setIsExpanded(!isExpanded);
  };

  const handleTextSelection = () => {
    setTimeout(() => {
      const sel = window.getSelection();
      if (sel && sel.toString().trim() && summaryRef.current) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const cardRect = summaryRef.current.getBoundingClientRect();

        const summaryContent = summaryRef.current.textContent || '';
        const selectedText = sel.toString();
        const startOffset = summaryContent.indexOf(selectedText);
        const endOffset = startOffset + selectedText.length;

        if (startOffset !== -1) {
          setSelection({
            text: selectedText,
            x: rect.left - cardRect.left + rect.width / 2,
            y: rect.top - cardRect.top - 8,
            startOffset,
            endOffset,
          });
        }
      }
    }, 10);
  };

  const handleDocumentClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.summary-text') && !target.closest('.toolbar')) {
      setSelection(null);
    }
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleDocumentClick);
    return () => document.removeEventListener('mouseup', handleDocumentClick);
  }, []);

  const handleHighlight = () => {
    if (selection) {
      const highlight: Highlight = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: selection.text,
        startOffset: selection.startOffset,
        endOffset: selection.endOffset,
        note: '',
      };
      onAddHighlight(book.id, highlight);
      setSelection(null);
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleAddNoteFromToolbar = () => {
    if (selection) {
      const highlight: Highlight = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: selection.text,
        startOffset: selection.startOffset,
        endOffset: selection.endOffset,
        note: noteInput,
      };
      onAddHighlight(book.id, highlight);
      setSelection(null);
      setNoteInput('');
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleSaveNote = (highlightId: string) => {
    if (noteText.trim()) {
      onAddNote(book.id, highlightId, noteText.trim());
    }
    setShowNoteInput(null);
    setNoteText('');
  };

  const renderSummaryWithHighlights = () => {
    if (!displayedSummary) return null;

    const sortedHighlights = [...book.highlights].sort(
      (a, b) => a.startOffset - b.startOffset
    );

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedHighlights.forEach((highlight, idx) => {
      if (highlight.startOffset >= displayedSummary.length) return;

      if (highlight.startOffset > lastIndex) {
        parts.push(
          <span key={`text-${idx}`}>
            {displayedSummary.slice(lastIndex, highlight.startOffset)}
          </span>
        );
      }

      const end = Math.min(highlight.endOffset, displayedSummary.length);
      parts.push(
        <span
          key={`highlight-${highlight.id}`}
          style={{
            backgroundColor: COLORS.highlightBg,
            color: '#333',
            borderRadius: '2px',
            padding: '1px 2px',
            position: 'relative',
            cursor: 'pointer',
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (highlight.note) {
              setShowNoteInput(showNoteInput === highlight.id ? null : highlight.id);
            } else {
              setShowNoteInput(showNoteInput === highlight.id ? null : highlight.id);
              setNoteText('');
            }
          }}
        >
          {displayedSummary.slice(highlight.startOffset, end)}
          {highlight.note && (
            <div
              className="note-bubble"
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 10px)',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(45, 45, 45, 0.95)',
                border: `1px solid ${COLORS.accent}`,
                borderRadius: '8px',
                padding: '8px 12px',
                color: COLORS.text,
                fontSize: '12px',
                maxWidth: '200px',
                whiteSpace: 'normal',
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                lineHeight: 1.4,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  position: 'absolute',
                  bottom: '-6px',
                  left: '50%',
                  transform: 'translateX(-50%) rotate(45deg)',
                  width: '10px',
                  height: '10px',
                  backgroundColor: 'rgba(45, 45, 45, 0.95)',
                  borderRight: `1px solid ${COLORS.accent}`,
                  borderBottom: `1px solid ${COLORS.accent}`,
                }}
              />
              {highlight.note}
              <button
                className="remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveHighlight(book.id, highlight.id);
                }}
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '6px',
                  background: 'none',
                  border: 'none',
                  color: COLORS.text,
                  cursor: 'pointer',
                  fontSize: '14px',
                  opacity: 0.6,
                  padding: '0 4px',
                }}
              >
                ×
              </button>
            </div>
          )}
          {showNoteInput === highlight.id && !highlight.note && (
            <div
              className="note-bubble"
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 10px)',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(45, 45, 45, 0.95)',
                border: `1px solid ${COLORS.accent}`,
                borderRadius: '8px',
                padding: '10px',
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                width: '200px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  position: 'absolute',
                  bottom: '-6px',
                  left: '50%',
                  transform: 'translateX(-50%) rotate(45deg)',
                  width: '10px',
                  height: '10px',
                  backgroundColor: 'rgba(45, 45, 45, 0.95)',
                  borderRight: `1px solid ${COLORS.accent}`,
                  borderBottom: `1px solid ${COLORS.accent}`,
                }}
              />
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="输入笔记..."
                style={{
                  width: '100%',
                  minHeight: '60px',
                  backgroundColor: 'rgba(26, 26, 46, 0.8)',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '4px',
                  color: COLORS.text,
                  fontSize: '12px',
                  padding: '6px 8px',
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  marginTop: '8px',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  onClick={() => {
                    setShowNoteInput(null);
                    setNoteText('');
                  }}
                  style={{
                    padding: '4px 10px',
                    backgroundColor: 'transparent',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '4px',
                    color: COLORS.text,
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  取消
                </button>
                <button
                  className="note-btn"
                  onClick={() => handleSaveNote(highlight.id)}
                  style={{
                    padding: '4px 10px',
                    backgroundColor: COLORS.accent,
                    border: 'none',
                    borderRadius: '4px',
                    color: COLORS.primaryBg,
                    fontSize: '11px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  保存
                </button>
              </div>
            </div>
          )}
        </span>
      );
      lastIndex = end;
    });

    if (lastIndex < displayedSummary.length) {
      parts.push(
        <span key="text-end">{displayedSummary.slice(lastIndex)}</span>
      );
    }

    return parts;
  };

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '240px',
        minHeight: '340px',
        backgroundColor: COLORS.cardBg,
        borderRadius: '16px',
        overflow: 'hidden',
        position: 'relative',
        cursor: 'pointer',
        transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
        transform: isRemoving
          ? 'translateX(-120%)'
          : isHovered
          ? 'translateY(-8px)'
          : 'translateY(0)',
        opacity: isRemoving ? 0 : 1,
        boxShadow: isHovered
          ? '0 8px 20px rgba(0, 0, 0, 0.5)'
          : '0 4px 6px rgba(0, 0, 0, 0.3)',
        animation: isRemoving ? undefined : undefined,
      }}
    >
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinner {
          animation: spin 12s linear infinite;
        }
        @keyframes slideOutLeft {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(-120%);
            opacity: 0;
          }
        }
      `}</style>

      <button
        className="remove-btn"
        onClick={(e) => {
          e.stopPropagation();
          handleRemove();
        }}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          backgroundColor: 'rgba(26, 26, 46, 0.85)',
          border: `1px solid ${COLORS.border}`,
          color: COLORS.text,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          zIndex: 10,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.2s ease',
          lineHeight: 1,
        }}
      >
        ×
      </button>

      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '200px',
          overflow: 'hidden',
        }}
      >
        <img
          src={book.cover}
          alt={book.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>

      <div
        style={{
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <h3
          style={{
            margin: 0,
            color: COLORS.text,
            fontSize: '15px',
            fontWeight: 600,
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {book.title}
        </h3>
        <p
          style={{
            margin: 0,
            color: COLORS.accent,
            fontSize: '12px',
          }}
        >
          {book.author}
        </p>

        {!book.summary ? (
          <button
            className="summary-btn"
            onClick={(e) => {
              e.stopPropagation();
              onGenerateSummary(book);
            }}
            disabled={book.isGenerating}
            style={{
              marginTop: 'auto',
              padding: '8px 14px',
              backgroundColor: book.isGenerating ? 'transparent' : COLORS.accent,
              border: book.isGenerating ? `1px solid ${COLORS.border}` : 'none',
              borderRadius: '8px',
              color: book.isGenerating ? COLORS.loadingColor : COLORS.primaryBg,
              fontSize: '13px',
              fontWeight: 500,
              cursor: book.isGenerating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            {book.isGenerating ? (
              <>
                <svg
                  className="spinner"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={COLORS.loadingColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                生成中...
              </>
            ) : (
              '生成摘要'
            )}
          </button>
        ) : (
          <div
            style={{
              position: 'relative',
            }}
          >
            <div
              ref={summaryRef}
              className="summary-text"
              onMouseUp={handleTextSelection}
              style={{
                color: COLORS.text,
                fontSize: '12px',
                lineHeight: 1.6,
                maxHeight: isExpanded ? 'none' : '72px',
                overflow: 'hidden',
                userSelect: 'text',
                cursor: 'text',
              }}
            >
              {renderSummaryWithHighlights()}
              {displayedSummary.length < book.summary.length && (
                <span style={{ opacity: 0.7 }}>|</span>
              )}
            </div>

            {selection && (
              <div
                className="toolbar"
                style={{
                  position: 'absolute',
                  left: `${selection.x}px`,
                  top: `${selection.y}px`,
                  transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(45, 45, 45, 0.75)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: `1px solid ${COLORS.accent}`,
                  borderRadius: '12px',
                  padding: '6px',
                  display: 'flex',
                  gap: '4px',
                  zIndex: 20,
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {noteInput !== '' || selection.text ? (
                  <>
                    {noteInput === '' ? (
                      <>
                        <button
                          onClick={handleHighlight}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: 'rgba(255, 228, 181, 0.2)',
                            border: 'none',
                            borderRadius: '8px',
                            color: COLORS.highlightBg,
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          添加笔记
                        </button>
                        <button
                          onClick={() => setSelection(null)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: 'rgba(255, 107, 107, 0.15)',
                            border: 'none',
                            borderRadius: '8px',
                            color: COLORS.loadingColor,
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          取消高亮
                        </button>
                      </>
                    ) : null}
                  </>
                ) : null}
                {noteInput === '' && (
                  <input
                    type="text"
                    placeholder="或输入笔记..."
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddNoteFromToolbar();
                    }}
                    style={{
                      padding: '6px 10px',
                      backgroundColor: 'rgba(26, 26, 46, 0.6)',
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '8px',
                      color: COLORS.text,
                      fontSize: '12px',
                      outline: 'none',
                      width: '100px',
                    }}
                  />
                )}
                {noteInput && (
                  <button
                    onClick={handleAddNoteFromToolbar}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: COLORS.accent,
                      border: 'none',
                      borderRadius: '8px',
                      color: COLORS.primaryBg,
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    保存
                  </button>
                )}
              </div>
            )}

            {!isExpanded && displayedSummary.length > 80 && (
              <div
                style={{
                  marginTop: '6px',
                  color: COLORS.accent,
                  fontSize: '11px',
                  textAlign: 'right',
                  opacity: 0.8,
                }}
              >
                点击展开详情 ↓
              </div>
            )}
          </div>
        )}

        {book.highlights.length > 0 && (
          <div
            style={{
              marginTop: '6px',
              paddingTop: '8px',
              borderTop: `1px solid ${COLORS.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: COLORS.accent,
              fontSize: '11px',
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill={COLORS.highlightBg}
              stroke={COLORS.highlightBg}
              strokeWidth="1"
            >
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            {book.highlights.length} 条划线
          </div>
        )}
      </div>
    </div>
  );
};

export default BookCard;
