import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store';
import ChordBlock from './ChordBlock';
import { chordRoots, chordTypes } from '@/utils/colors';
import type { ChordRoot, ChordType } from '@/types';

export default function ChordEditor() {
  const chords = useAppStore((s) => s.chords);
  const addChord = useAppStore((s) => s.addChord);
  const reorderChords = useAppStore((s) => s.reorderChords);
  const playPos = useAppStore((s) => s.ui.chordPlayPosition);
  const setPlayPos = useAppStore((s) => s.setChordPlayPosition);

  const [root, setRoot] = useState<ChordRoot>('C');
  const [type, setType] = useState<ChordType>('Major');
  const dragFromRef = useRef<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const sortedChords = [...chords].sort((a, b) => a.order - b.order);

  useEffect(() => {
    let raf: number;
    let start: number | null = null;
    const duration = 8000;

    const tick = (ts: number) => {
      if (start === null) start = ts;
      const elapsed = (ts - start) % duration;
      setPlayPos(elapsed / duration);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [setPlayPos]);

  const handleDragStart = (index: number) => {
    dragFromRef.current = index;
  };

  const handleDragOver = (e: React.DragEvent, _index: number) => {
    e.preventDefault();
  };

  const handleDrop = (toIndex: number) => {
    if (dragFromRef.current !== null && dragFromRef.current !== toIndex) {
      reorderChords(dragFromRef.current, toIndex);
    }
    dragFromRef.current = null;
  };

  const gridLines: number[] = [];
  for (let i = 0; i < 6; i++) gridLines.push(i);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '50%',
        minHeight: 260,
        borderBottom: '1px solid #424242',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #2A2A2A',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 13,
            fontWeight: 700,
            color: '#64B5F6',
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          ♫ 和弦行进
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            value={root}
            onChange={(e) => setRoot(e.target.value as ChordRoot)}
            style={{
              padding: '6px 10px',
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
            value={type}
            onChange={(e) => setType(e.target.value as ChordType)}
            style={{
              padding: '6px 10px',
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
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => addChord(root, type)}
            style={{
              padding: '6px 16px',
              borderRadius: 4,
              backgroundColor: '#64B5F6',
              color: '#121212',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            + 添加
          </motion.button>
        </div>
      </div>

      <div
        ref={gridRef}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'auto',
          backgroundColor: '#1A1A1A',
          backgroundImage: `
            linear-gradient(to right, #2A2A2A 1px, transparent 1px),
            linear-gradient(to bottom, #2A2A2A 1px, transparent 1px)
          `,
          backgroundSize: '60px 40px',
          padding: 24,
        }}
      >
        {gridLines.map((i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${(i + 0.5) * 16.67}%`,
              height: 1,
              backgroundColor: '#252525',
              pointerEvents: 'none',
            }}
          />
        ))}

        <AnimatePresence>
          {playPos >= 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `calc(24px + ${playPos * 100}% - ${playPos * 48}px)`,
                width: 2,
                backgroundColor: '#EF5350',
                boxShadow: '0 0 8px #EF535088',
                zIndex: 10,
                pointerEvents: 'none',
              }}
            />
          )}
        </AnimatePresence>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            minHeight: 80,
          }}
        >
          {sortedChords.length === 0 ? (
            <div
              style={{
                color: '#555555',
                fontSize: 12,
                padding: 24,
                width: '100%',
                textAlign: 'center',
              }}
            >
              暂无和弦，选择根音与类型后点击「添加」创建，双击和弦块可编辑
            </div>
          ) : (
            sortedChords.map((chord, idx) => (
              <ChordBlock
                key={chord.id}
                chord={chord}
                index={idx}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
