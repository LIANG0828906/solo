import React, { useState } from 'react';
import { NoteData } from '../types';
import Note from './Note';

interface NotePanelProps {
  notes: NoteData[];
  onUpdateNote: (note: NoteData) => void;
  onDeleteNote: (id: string) => void;
  onNoteDragStart?: (id: string) => void;
  onNoteDragEnd?: (id: string) => void;
  onNoteEditStart?: (id: string) => void;
  onNoteEditEnd?: (id: string) => void;
  onNoteColorChange?: (id: string) => void;
}

const NotePanel: React.FC<NotePanelProps> = ({
  notes,
  onUpdateNote,
  onDeleteNote,
  onNoteDragStart,
  onNoteDragEnd,
  onNoteEditStart,
  onNoteEditEnd,
  onNoteColorChange,
}) => {
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [zIndexCounter, setZIndexCounter] = useState(10);

  const handleNoteDragStart = (id: string) => {
    setActiveNoteId(id);
    setZIndexCounter((prev) => prev + 1);
    onNoteDragStart?.(id);
  };

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      {notes.map((note) => (
        <div key={note.id} style={{ pointerEvents: 'auto' }}>
          <Note
            note={note}
            onUpdate={onUpdateNote}
            onDelete={onDeleteNote}
            zIndex={activeNoteId === note.id ? zIndexCounter : 1}
            onDragStart={() => handleNoteDragStart(note.id)}
            onDragEnd={() => onNoteDragEnd?.(note.id)}
            onEditStart={() => onNoteEditStart?.(note.id)}
            onEditEnd={() => onNoteEditEnd?.(note.id)}
            onColorChange={() => onNoteColorChange?.(note.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default NotePanel;
