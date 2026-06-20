import React, { useCallback } from 'react'
import { useNoteStore } from '../stores/noteStore'
import NoteCard from './NoteCard'

const NoteBoard: React.FC = () => {
  const { getFilteredNotes, draggingId, setDraggingId } = useNoteStore()
  const notes = useNoteStore((s) => s.getFilteredNotes())

  const handleBoardMouseUp = useCallback(() => {
    if (draggingId) {
      setDraggingId(null)
    }
  }, [draggingId, setDraggingId])

  return (
    <div
      id="note-board"
      onMouseUp={handleBoardMouseUp}
      style={{
        width: '100%',
        height: 600,
        background: '#F4F1EA',
        border: '1px solid #E0D8C8',
        borderRadius: 12,
        position: 'relative',
        overflow: 'auto',
        flex: 1,
      }}
    >
      <style>{`
        #note-board::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        #note-board::-webkit-scrollbar-track {
          background: transparent;
        }
        #note-board::-webkit-scrollbar-thumb {
          background: #D4CFC4;
          border-radius: 4px;
        }
        #note-board::-webkit-scrollbar-thumb:hover {
          background: #C4BFB4;
        }

        .note-card {
          position: absolute;
          width: 200px;
          min-height: 80px;
          border-radius: 12px;
          padding: 0;
          user-select: none;
        }

        @media (max-width: 768px) {
          #note-board {
            height: 400px !important;
          }
          .note-card {
            width: 160px !important;
          }
        }
      `}</style>

      {notes.map((note) => (
        <NoteCard
          key={note.id}
          id={note.id}
          content={note.content}
          color={note.color}
          x={note.x}
          y={note.y}
          priority={note.priority}
          tags={note.tags}
          isDragging={draggingId === note.id}
          otherDragging={draggingId !== null && draggingId !== note.id}
        />
      ))}
    </div>
  )
}

export default NoteBoard
