import type { Note } from '@/types';
import { cn } from '@/lib/utils';

interface NotesListProps {
  notes: Note[];
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hours}:${minutes}`;
}

export default function NotesList({ notes }: NotesListProps) {
  const displayNotes = notes.slice(0, 30);

  return (
    <div
      className="w-full"
      style={{
        columnCount: 'auto',
        columnWidth: '200px',
        columnGap: '12px',
      }}
    >
      {displayNotes.map((note) => (
        <div
          key={note.id}
          className={cn(
            'break-inside-avoid mb-3 p-3 rounded-lg',
            'hover:opacity-90 transition-opacity cursor-pointer'
          )}
          style={{
            backgroundColor: '#0F3460',
            width: '200px',
            padding: '12px',
          }}
        >
          <p
            className="text-white text-sm mb-2"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: '1.5',
            }}
          >
            {note.content}
          </p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">{formatTimestamp(note.timestamp)}</span>
            <span className="text-pink-400 truncate max-w-[100px]">{note.recordTitle}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
