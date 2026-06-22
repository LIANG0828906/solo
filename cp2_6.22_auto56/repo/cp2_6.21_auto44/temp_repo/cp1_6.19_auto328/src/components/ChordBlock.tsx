import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import type { Chord, ChordRoot, ChordType } from '@/types';
import { chordTypeColors, chordTypeShort, chordRoots, chordTypes } from '@/utils/colors';
import { useAppStore } from '@/store';

interface ChordBlockProps {
  chord: Chord;
  index: number;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (index: number) => void;
}

const ChordBlock = memo(function ChordBlock({ chord, index, onDragStart, onDragOver, onDrop }: ChordBlockProps) {
  const updateChord = useAppStore((s) => s.updateChord);
  const removeChord = useAppStore((s) => s.removeChord);
  const [editing, setEditing] = useState(false);

  const color = chordTypeColors[chord.type];
  const label = `${chord.root}${chordTypeShort[chord.type]}`;

  const handleDoubleClick = () => {
    setEditing(true);
  };

  if (editing) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          padding: 8,
          borderRadius: 8,
          backgroundColor: '#1E1E1E',
          border: `2px solid ${color}`,
          minWidth: 120,
          boxShadow: `0 0 0 2px ${color}33`,
        }}
      >
        <div style={{ display: 'flex', gap: 4 }}>
          <select
            value={chord.root}
            onChange={(e) => updateChord(chord.id, { root: e.target.value as ChordRoot })}
            style={{
              flex: 1,
              padding: '4px 6px',
              borderRadius: 4,
              backgroundColor: '#2A2A2A',
              color: '#FFFFFF',
              border: '1px solid #424242',
              fontSize: 12,
            }}
          >
            {chordRoots.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select
            value={chord.type}
            onChange={(e) => updateChord(chord.id, { type: e.target.value as ChordType })}
            style={{
              flex: 1,
              padding: '4px 6px',
              borderRadius: 4,
              backgroundColor: '#2A2A2A',
              color: '#FFFFFF',
              border: '1px solid #424242',
              fontSize: 12,
            }}
          >
            {chordTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setEditing(false)}
            style={{
              flex: 1,
              padding: '4px',
              borderRadius: 4,
              backgroundColor: '#64B5F6',
              color: '#121212',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            完成
          </button>
          <button
            onClick={() => removeChord(chord.id)}
            style={{
              padding: '4px 10px',
              borderRadius: 4,
              backgroundColor: '#EF5350',
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            删除
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={() => onDrop(index)}
      onDoubleClick={handleDoubleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80,
        height: 64,
        padding: '8px 16px',
        borderRadius: 8,
        backgroundColor: color,
        color: '#121212',
        fontFamily: "'Orbitron', sans-serif",
        fontSize: 18,
        fontWeight: 700,
        cursor: 'grab',
        userSelect: 'none',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        position: 'relative',
        transition: 'transform 0.15s ease',
        willChange: 'transform, opacity',
      }}
      onMouseDown={(e) => {
        (e.currentTarget as HTMLElement).style.cursor = 'grabbing';
      }}
      onMouseUp={(e) => {
        (e.currentTarget as HTMLElement).style.cursor = 'grab';
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      <span style={{ position: 'absolute', top: 4, left: 6, fontSize: 10, opacity: 0.6 }}>
        {index + 1}
      </span>
      {label}
      <span style={{ position: 'absolute', bottom: 2, right: 6, fontSize: 9, opacity: 0.5 }}>
        {chord.duration}♩
      </span>
    </motion.div>
  );
});

export default ChordBlock;
