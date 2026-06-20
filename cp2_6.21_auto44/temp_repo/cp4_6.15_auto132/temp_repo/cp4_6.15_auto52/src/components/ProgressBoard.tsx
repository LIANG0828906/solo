import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useLibrary } from '@/context/LibraryContext';
import { calculatePriorityScore, getPriorityLevel, getPriorityColor } from '@/utils/priority';
import type { Book, ReadingStatus } from '@/types';
import Particles from './Particles';

const COLUMNS: { id: ReadingStatus; title: string; color: string }[] = [
  { id: 'want-to-read', title: '想读', color: '#E74C3C' },
  { id: 'reading', title: '在读', color: '#F39C12' },
  { id: 'finished', title: '读完', color: '#27AE60' },
];

export default function ProgressBoard() {
  const { books, updateBookStatus, reorderWantToRead, selectBook } = useLibrary();
  const [celebrationPos, setCelebrationPos] = useState<{ x: number; y: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const booksByStatus = (status: ReadingStatus): Book[] =>
    books
      .filter((b) => b.status === status)
      .sort((a, b) => a.priority - b.priority);

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination, draggableId } = result;
      if (!destination) return;

      const sourceStatus = source.droppableId as ReadingStatus;
      const destStatus = destination.droppableId as ReadingStatus;

      if (sourceStatus === destStatus && source.index === destination.index) return;

      if (sourceStatus === destStatus && sourceStatus === 'want-to-read') {
        reorderWantToRead(source.index, destination.index);
        return;
      }

      if (sourceStatus !== destStatus) {
        const book = books.find((b) => b.id === draggableId);
        if (book) {
          updateBookStatus(book.id, destStatus);
          if (destStatus === 'finished') {
            const el = document.querySelector(`[data-rfd-draggable-id="${draggableId}"]`);
            if (el) {
              const rect = el.getBoundingClientRect();
              setCelebrationPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
              setTimeout(() => setCelebrationPos(null), 2000);
            }
          }
        }
        if (sourceStatus === 'want-to-read') {
          reorderWantToRead(source.index, Math.min(destination.index, booksByStatus('want-to-read').length - 1));
        }
      }
    },
    [books, updateBookStatus, reorderWantToRead]
  );

  return (
    <div className="progress-board-page" ref={boardRef}>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="board-columns">
          {COLUMNS.map((col) => {
            const columnBooks = booksByStatus(col.id);
            return (
              <Droppable key={col.id} droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`board-column ${snapshot.isDraggingOver ? 'column-highlight' : ''}`}
                  >
                    <div className="column-header" style={{ borderColor: col.color }}>
                      <div className="column-dot" style={{ backgroundColor: col.color }} />
                      <h3>{col.title}</h3>
                      <span className="column-count">{columnBooks.length}</span>
                    </div>
                    <div className="column-body">
                      {columnBooks.map((book, index) => (
                        <Draggable key={book.id} draggableId={book.id} index={index}>
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              className={`board-card ${dragSnapshot.isDragging ? 'board-card-dragging' : ''}`}
                              onClick={() => {
                                if (!dragSnapshot.isDragging) selectBook(book.id);
                              }}
                              data-rfd-draggable-id={book.id}
                            >
                              <div className="board-card-inner">
                                <div className="board-card-title">{book.title}</div>
                                <div className="board-card-author">{book.author}</div>
                                {col.id === 'want-to-read' && (
                                  <div className="board-card-priority">
                                    <span
                                      className="mini-dot"
                                      style={{
                                        backgroundColor: getPriorityColor(
                                          getPriorityLevel(index, columnBooks.length)
                                        ),
                                      }}
                                    />
                                    <span className="priority-text">
                                      优先级: {calculatePriorityScore(index + 1, book.difficulty)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>
      {celebrationPos && <Particles x={celebrationPos.x} y={celebrationPos.y} />}
    </div>
  );
}
