import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Highlighter } from '../components/Highlighter';
import { ChatPanel } from '../components/ChatPanel';
import type { Room, User, Highlight, Message } from '../utils/types';
import { bookParagraphs } from '../utils/mockBook';

interface BookViewerProps {
  room: Room;
  users: User[];
  highlights: Highlight[];
  messages: Message[];
  currentUser: User | null;
  selectedHighlightId: string | null;
  blinkParagraphIndex: number | null;
  onAddHighlight: (highlight: Omit<Highlight, 'id' | 'createdAt' | 'userId' | 'color'>) => void;
  onSelectHighlight: (highlightId: string | null) => void;
  onUpdateAnnotation: (highlightId: string, annotation: string) => void;
  onSendMessage: (content: string, highlightId?: string, paragraphIndex?: number) => void;
  onLeaveRoom: () => void;
}

const PARAGRAPH_HEIGHT = 140;
const BUFFER_ROWS = 8;

export const BookViewer: React.FC<BookViewerProps> = ({
  room,
  users,
  highlights,
  messages,
  currentUser,
  selectedHighlightId,
  blinkParagraphIndex,
  onAddHighlight,
  onSelectHighlight,
  onUpdateAnnotation,
  onSendMessage,
  onLeaveRoom,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(800);

  useEffect(() => {
    const updateHeight = () => {
      if (scrollContainerRef.current) {
        setViewportHeight(scrollContainerRef.current.clientHeight);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalHeight = bookParagraphs.length * PARAGRAPH_HEIGHT;
  const startIdx = Math.max(0, Math.floor(scrollTop / PARAGRAPH_HEIGHT) - BUFFER_ROWS);
  const visibleCount = Math.ceil(viewportHeight / PARAGRAPH_HEIGHT) + BUFFER_ROWS * 2;
  const endIdx = Math.min(bookParagraphs.length, startIdx + visibleCount);

  const visibleParagraphs: { index: number; text: string }[] = [];
  for (let i = startIdx; i < endIdx; i++) {
    visibleParagraphs.push({ index: i, text: bookParagraphs[i] });
  }

  return (
    <div className="book-viewer">
      <div className="viewer-header">
        <button className="btn btn-secondary" onClick={onLeaveRoom}>
          ← 返回房间列表
        </button>
        <div className="viewer-title">
          <h2>{room.name}</h2>
          <span className="viewer-bookname">《{room.bookName}》</span>
        </div>
        <div className="viewer-users">
          {users.length} 人在线
        </div>
      </div>

      <div className="viewer-main">
        <div
          ref={scrollContainerRef}
          className="book-reader"
          onScroll={handleScroll}
          onClick={() => onSelectHighlight(null)}
        >
          <div
            className="book-content"
            style={{
              height: `${totalHeight}px`,
              position: 'relative',
            }}
          >
            {visibleParagraphs.map(({ index, text }) => (
              <div
                key={index}
                className="paragraph-wrapper"
                style={{
                  position: 'absolute',
                  top: `${index * PARAGRAPH_HEIGHT}px`,
                  left: 0,
                  right: 0,
                  minHeight: `${PARAGRAPH_HEIGHT}px`,
                  padding: '20px 40px 20px 80px',
                }}
              >
                <div className="paragraph-number">{index + 1}</div>
                <Highlighter
                  text={text}
                  paragraphIndex={index}
                  highlights={highlights}
                  selectedHighlightId={selectedHighlightId}
                  onAddHighlight={onAddHighlight}
                  onSelectHighlight={onSelectHighlight}
                  onUpdateAnnotation={onUpdateAnnotation}
                  isBlinking={blinkParagraphIndex === index}
                />
              </div>
            ))}
          </div>
        </div>

        <ChatPanel
          messages={messages}
          users={users}
          currentUserId={currentUser?.id || null}
          onSendMessage={onSendMessage}
        />
      </div>
    </div>
  );
};
