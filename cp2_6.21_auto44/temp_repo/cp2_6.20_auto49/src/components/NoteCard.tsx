import { useState } from 'react';
import dayjs from 'dayjs';
import type { Note } from '@/types';
import TagCapsule from './TagCapsule';

interface NoteCardProps {
  note: Note;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent, noteId: string) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  draggable?: boolean;
}

export default function NoteCard({ note, onClick, onDragStart, onDragEnd, draggable = true }: NoteCardProps) {
  const [opacity, setOpacity] = useState(1);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    setOpacity(0.5);
    onDragStart?.(e, note.id);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setOpacity(1);
    onDragEnd?.(e);
  };

  return (
    <div
      className="backlink-item rounded-lg bg-white p-5 shadow-sm border border-gray-100 cursor-grab transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
      style={{ opacity }}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
    >
      <h3 className="font-sans font-bold text-lg mb-2">{note.title}</h3>
      <p className="font-serif text-gray-600 line-clamp-2 mb-3">{note.summary}</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {note.tags.map((tag) => (
          <TagCapsule key={tag.id} tag={tag} />
        ))}
      </div>
      <div className="text-sm text-gray-400">
        {dayjs(note.createdAt).format('YYYY-MM-DD')}
      </div>
    </div>
  );
}
