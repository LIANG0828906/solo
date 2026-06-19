import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { NOTE_COLORS, COLLECT_ANIMATION_DURATION } from '@/constants';
import { Note as NoteType } from '@/types';

interface NoteItemProps {
  note: NoteType;
  cellSize: number;
}

function NoteItem({ note, cellSize }: NoteItemProps) {
  const noteSize = 20;
  const offset = (cellSize - noteSize) / 2;
  const color = NOTE_COLORS[note.color];

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: noteSize,
        height: noteSize,
        backgroundColor: color,
        boxShadow: `0 0 10px 2px ${color}80, 0 0 20px 4px ${color}40`,
        zIndex: 5,
        left: note.position.x * cellSize + offset,
        top: note.position.y * cellSize + offset,
      }}
      initial={{ scale: 1, opacity: 1 }}
      animate={{
        scale: note.collected ? 0 : 1,
        opacity: note.collected ? 0 : 1,
      }}
      transition={{
        duration: COLLECT_ANIMATION_DURATION,
        ease: 'easeInOut',
      }}
      whileHover={{
        scale: note.collected ? 0 : 1.1,
        transition: { duration: 0.2 },
      }}
    />
  );
}

interface NotesContainerProps {
  cellSize: number;
}

export default function Note({ cellSize }: NotesContainerProps) {
  const notes = useGameStore((state) => state.notes);

  return (
    <>
      {notes.map((note) => (
        <NoteItem key={note.id} note={note} cellSize={cellSize} />
      ))}
    </>
  );
}
