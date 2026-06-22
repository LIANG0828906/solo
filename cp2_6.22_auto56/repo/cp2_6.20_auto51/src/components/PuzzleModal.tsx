import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { useGameStore } from '../store';
import { ALL_ITEMS, Puzzle, PuzzleType, ItemId } from '../types';

const NumberPuzzle = React.memo(function NumberPuzzle({
  puzzle,
  onSolve,
}: {
  puzzle: Puzzle;
  onSolve: () => void;
}) {
  const [input, setInput] = useState<string[]>(['', '', '']);
  const [error, setError] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const solution = puzzle.solution as string;

  const handleDigit = useCallback(
    (d: string, idx: number) => {
      const next = [...input];
      next[idx] = d;
      setInput(next);
      setError(false);
      if (d && idx < 2) {
        const el = document.getElementById(`num-input-${idx + 1}`);
        el?.focus();
      }
      const combined = next.join('');
      if (combined.length === 3) {
        if (combined === solution) {
          setTimeout(onSolve, 250);
        } else {
          setError(true);
          setShakeKey((k) => k + 1);
          setTimeout(() => {
            setInput(['', '', '']);
            setError(false);
            document.getElementById('num-input-0')?.focus();
          }, 700);
        }
      }
    },
    [input, solution, onSolve]
  );

  return (
    <div style={{ padding: '10px 10px 20px 10px', textAlign: 'center' }}>
      <motion.div
        key={shakeKey}
        animate={error ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : {}}
        transition={{ duration: 0.5 }}
        style={{ display: 'flex', gap: 16, justifyContent: 'center', margin: '24px 0' }}
      >
        {input.map((v, i) => (
          <motion.input
            key={i}
            id={`num-input-${i}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={v}
            onChange={(e) => {
              const c = e.target.value.slice(-1);
              if (/^\d?$/.test(c)) handleDigit(c, i);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !v && i > 0) {
                const el = document.getElementById(`num-input-${i - 1}`);
                el?.focus();
              }
            }}
            whileFocus={{ scale: 1.05, boxShadow: '0 0 20px rgba(245,214,160,0.5)' }}
            style={{
              width: 72,
              height: 92,
              fontSize: 44,
              fontWeight: 700,
              textAlign: 'center',
              background: error ? 'rgba(200,60,60,0.15)' : 'rgba(26,15,7,0.6)',
              border: `2.5px solid ${error ? '#e04a4a' : 'rgba(245,214,160,0.4)'}`,
              color: error ? '#ff9a9a' : '#f5d6a0',
              borderRadius: 12,
              outline: 'none',
              caretColor: '#f5d6a0',
              letterSpacing: 0,
            }}
          />
        ))}
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, maxWidth: 280, margin: '0 auto' }}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'C'].map((k) => (
          <motion.button
            key={k}
            whileHover={{ scale: 1.05, background: 'rgba(245,214,160,0.25)' }}
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              if (k === 'C') {
                setInput(['', '', '']);
                setError(false);
              } else if (k === '⌫') {
                for (let idx = 2; idx >= 0; idx--) {
                  if (input[idx]) {
                    const n = [...input];
                    n[idx] = '';
                    setInput(n);
                    break;
                  }
                }
              } else {
                const emptyIdx = input.findIndex((x) => !x);
                if (emptyIdx >= 0) handleDigit(k, emptyIdx);
              }
            }}
            style={{
              height: 54,
              fontSize: 22,
              fontWeight: 700,
              background: 'rgba(245,214,160,0.08)',
              border: '1.5px solid rgba(245,214,160,0.25)',
              color: '#f5d6a0',
              borderRadius: 10,
              cursor: 'pointer',
              letterSpacing: 2,
            }}
          >
            {k}
          </motion.button>
        ))}
      </div>
    </div>
  );
});

const PatternPuzzle = React.memo(function PatternPuzzle({
  puzzle,
  onSolve,
}: {
  puzzle: Puzzle;
  onSolve: () => void;
}) {
  const [sequence, setSequence] = useState<string[]>([]);
  const [error, setError] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const solution = puzzle.solution as string[];
  const symbols = ['△', '○', '□', '◇', '☆', '♡'];

  const handleClick = useCallback(
    (s: string) => {
      const next = [...sequence, s];
      setSequence(next);
      setError(false);
      const expectedPrefix = solution.slice(0, next.length);
      const matches = next.every((v, i) => v === expectedPrefix[i]);
      if (!matches) {
        setError(true);
        setShakeKey((k) => k + 1);
        setTimeout(() => {
          setSequence([]);
          setError(false);
        }, 650);
        return;
      }
      if (next.length === solution.length) {
        setTimeout(onSolve, 300);
      }
    },
    [sequence, solution, onSolve]
  );

  return (
    <div style={{ padding: '8px 12px 20px 12px', textAlign: 'center' }}>
      <motion.div
        key={shakeKey}
        animate={error ? { x: [0, -8, 8, -6, 6, 0] } : {}}
        transition={{ duration: 0.45 }}
        style={{
          margin: '20px auto',
          display: 'flex',
          gap: 14,
          justifyContent: 'center',
          minHeight: 64,
          padding: '14px 20px',
          background: 'rgba(26,15,7,0.5)',
          border: `2px dashed ${error ? '#e04a4a' : 'rgba(245,214,160,0.3)'}`,
          borderRadius: 12,
          width: 'fit-content',
          maxWidth: '100%',
        }}
      >
        {sequence.length === 0 ? (
          <span style={{ color: '#6b5032', alignSelf: 'center', letterSpacing: 2, fontSize: 14 }}>
            按正确顺序点击下方符号...
          </span>
        ) : (
          sequence.map((s, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, rotate: -90, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              style={{
                width: 54,
                height: 54,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 30,
                background: 'linear-gradient(135deg, rgba(196,154,108,0.3), rgba(139,90,43,0.3))',
                border: '2px solid rgba(245,214,160,0.5)',
                borderRadius: 10,
                color: error ? '#ff9a9a' : '#f5d6a0',
              }}
            >
              {s}
            </motion.div>
          ))
        )}
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, maxWidth: 340, margin: '0 auto' }}>
        {symbols.map((s, i) => (
          <motion.button
            key={s}
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.08, boxShadow: '0 0 18px rgba(245,214,160,0.35)' }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleClick(s)}
            disabled={error || sequence.length >= solution.length}
            style={{
              height: 78,
              fontSize: 42,
              background: 'linear-gradient(145deg, rgba(196,154,108,0.18), rgba(139,90,43,0.18))',
              border: '2px solid rgba(245,214,160,0.35)',
              color: '#f5d6a0',
              borderRadius: 14,
              cursor: error || sequence.length >= solution.length ? 'not-allowed' : 'pointer',
              opacity: error || sequence.length >= solution.length ? 0.45 : 1,
            }}
          >
            {s}
          </motion.button>
        ))}
      </div>

      <button
        onClick={() => {
          setSequence([]);
          setError(false);
        }}
        style={{
          marginTop: 18,
          padding: '6px 20px',
          background: 'transparent',
          border: '1px solid rgba(196,154,108,0.4)',
          color: '#c49a6c',
          borderRadius: 8,
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        🔄 重置
      </button>
    </div>
  );
});

const Slot = React.memo(function Slot({
  index,
  filledWith,
  onDrop,
}: {
  index: number;
  filledWith: ItemId | null;
  onDrop: (id: ItemId) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `slot_${index}` });
  const item = filledWith ? ALL_ITEMS[filledWith] : null;
  return (
    <motion.div
      ref={setNodeRef as any}
      animate={{
        borderColor: isOver ? '#f5d6a0' : filledWith ? '#a0e0ff' : 'rgba(245,214,160,0.3)',
        background: isOver
          ? 'rgba(245,214,160,0.15)'
          : filledWith
          ? 'rgba(160,224,255,0.08)'
          : 'rgba(26,15,7,0.4)',
        boxShadow: isOver ? '0 0 24px rgba(245,214,160,0.4)' : filledWith ? '0 0 16px rgba(160,224,255,0.25)' : 'none',
        scale: isOver ? 1.05 : 1,
      }}
      whileHover={filledWith ? { scale: 1.03 } : {}}
      transition={{ duration: 0.2 }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain') as ItemId;
        if (id) onDrop(id);
      }}
      style={{
        width: 130,
        height: 150,
        borderRadius: 14,
        border: `2.5px dashed`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        transition: 'all 0.25s',
        position: 'relative',
      }}
    >
      {filledWith ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={filledWith}
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            style={{ textAlign: 'center' }}
          >
            <div style={{ fontSize: 52, filter: 'drop-shadow(0 0 8px #a0e0ff)' }}>{item?.icon}</div>
            <div style={{ fontSize: 13, color: '#a0e0ff', marginTop: 6, fontWeight: 600 }}>{item?.name}</div>
          </motion.div>
        </AnimatePresence>
      ) : (
        <div style={{ textAlign: 'center', color: '#6b5032', fontSize: 12, padding: 10 }}>
          <div style={{ fontSize: 36, marginBottom: 6 }}>🧩</div>
          碎片 {index + 1}
          <div style={{ fontSize: 10, marginTop: 4, color: '#4a3822' }}>
            （从物品栏拖拽放置）
          </div>
        </div>
      )}
    </motion.div>
  );
});

const AssemblyPuzzle = React.memo(function AssemblyPuzzle({
  puzzle,
  onSolve,
}: {
  puzzle: Puzzle;
  onSolve: () => void;
}) {
  const [slots, setSlots] = useState<(ItemId | null)[]>([null, null, null]);
  const [error, setError] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const solution = puzzle.solution as ItemId[];
  const { collectedItems } = useGameStore();

  const availablePieces = useMemo(
    () => collectedItems.filter((id) => solution.includes(id) && !slots.includes(id)),
    [collectedItems, solution, slots]
  );

  const placeInSlot = useCallback(
    (idx: number, pieceId: ItemId) => {
      if (!solution.includes(pieceId)) return;
      const next = [...slots];
      const existingIdx = next.indexOf(pieceId);
      if (existingIdx >= 0) next[existingIdx] = null;
      next[idx] = pieceId;
      setSlots(next);
      setError(false);

      if (next.every(Boolean)) {
        const correct = next.every((v, i) => v === solution[i]);
        if (correct) {
          setTimeout(onSolve, 450);
        } else {
          setError(true);
          setShakeKey((k) => k + 1);
          setTimeout(() => {
            setSlots([null, null, null]);
            setError(false);
          }, 800);
        }
      }
    },
    [slots, solution, onSolve]
  );

  return (
    <div style={{ padding: '8px 8px 20px 8px', textAlign: 'center' }}>
      <div style={{ color: '#c49a6c', fontSize: 13, marginBottom: 18, lineHeight: 1.7 }}>
        按<span style={{ color: '#f5d6a0' }}>上 → 中 → 下</span>的顺序将图纸碎片拖入下方槽位
      </div>

      <motion.div
        key={shakeKey}
        animate={error ? { x: [0, -12, 12, -10, 10, -4, 4, 0] } : {}}
        transition={{ duration: 0.55 }}
        style={{
          display: 'flex',
          gap: 16,
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: 28,
        }}
      >
        {slots.map((s, i) => (
          <Slot key={i} index={i} filledWith={s} onDrop={(id) => placeInSlot(i, id)} />
        ))}
      </motion.div>

      <div style={{
        padding: 16,
        background: 'rgba(26,15,7,0.4)',
        border: '1px solid rgba(245,214,160,0.15)',
        borderRadius: 12,
        maxWidth: 520,
        margin: '0 auto',
      }}>
        <div style={{ fontSize: 12, color: '#8b6914', marginBottom: 10, letterSpacing: 1 }}>可用碎片（点击放置到第一个空位，或直接拖拽到上方槽位）</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', minHeight: 80 }}>
          {availablePieces.length === 0 ? (
            <span style={{ color: '#6b5032', fontSize: 13, alignSelf: 'center' }}>
              所有碎片已放置 ✓
            </span>
          ) : (
            availablePieces.map((id) => {
              const item = ALL_ITEMS[id];
              return (
                <motion.button
                  key={id}
                  draggable
                  onDragStart={(e: any) => {
                    if (e.dataTransfer) {
                      e.dataTransfer.setData('text/plain', id);
                    }
                  }}
                  whileHover={{ scale: 1.08, y: -4 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    const emptyIdx = slots.findIndex((s) => !s);
                    if (emptyIdx >= 0) placeInSlot(emptyIdx, id);
                  }}
                  style={{
                    width: 92,
                    height: 100,
                    background: 'linear-gradient(145deg, #3a2512, #1a0f07)',
                    border: '2px solid rgba(196,154,108,0.45)',
                    borderRadius: 12,
                    cursor: 'grab',
                    padding: 6,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                >
                  <div style={{ fontSize: 34 }}>{item.icon}</div>
                  <div style={{ fontSize: 11, color: '#c49a6c', fontWeight: 600 }}>{item.name}</div>
                </motion.button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
});

export default function PuzzleModal() {
  const { activePuzzleId, puzzles, closePuzzle, solvePuzzle } = useGameStore();
  const puzzle = activePuzzleId ? puzzles[activePuzzleId] : null;

  const handleSolve = useCallback(() => {
    if (!puzzle) return;
    solvePuzzle(puzzle.id);
  }, [puzzle, solvePuzzle]);

  if (!puzzle) return null;

  const renderPuzzleBody = (type: PuzzleType) => {
    switch (type) {
      case 'number':
        return <NumberPuzzle puzzle={puzzle} onSolve={handleSolve} />;
      case 'pattern':
        return <PatternPuzzle puzzle={puzzle} onSolve={handleSolve} />;
      case 'assembly':
        return <AssemblyPuzzle puzzle={puzzle} onSolve={handleSolve} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9500,
        background: 'rgba(10, 6, 4, 0.65)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closePuzzle();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.82, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -10 }}
        transition={{ type: 'spring', stiffness: 240, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 'min(620px, 94vw)',
          maxHeight: '92vh',
          background: 'linear-gradient(170deg, rgba(43,26,14,0.98), rgba(26,15,7,0.99))',
          border: '2px solid rgba(245,214,160,0.35)',
          borderRadius: 20,
          boxShadow: '0 30px 80px rgba(0,0,0,0.7), inset 0 0 40px rgba(245,214,160,0.04)',
          overflow: 'hidden',
          willChange: 'transform, opacity',
        }}
      >
        <div style={{
          padding: '18px 28px 14px 28px',
          borderBottom: '1px solid rgba(245,214,160,0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#8b6914', letterSpacing: 3, marginBottom: 4 }}>
              🔐 PUZZLE · {puzzle.type.toUpperCase()}
            </div>
            <h2 style={{ margin: 0, color: '#f5d6a0', fontSize: 22, letterSpacing: 2 }}>{puzzle.title}</h2>
            <div style={{ fontSize: 13, color: '#c49a6c', marginTop: 8, lineHeight: 1.6 }}>
              💡 {puzzle.hint}
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.15, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={closePuzzle}
            style={{
              background: 'rgba(245,214,160,0.08)',
              border: '1px solid rgba(245,214,160,0.3)',
              color: '#f5d6a0',
              width: 36,
              height: 36,
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: 16,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </motion.button>
        </div>

        <div style={{
          overflowY: 'auto',
          maxHeight: 'calc(92vh - 130px)',
          padding: '8px 18px 8px 18px',
        }}>
          <style>{`
            div::-webkit-scrollbar { width: 6px; }
            div::-webkit-scrollbar-track { background: rgba(245,214,160,0.04); border-radius: 999px; }
            div::-webkit-scrollbar-thumb {
              background: linear-gradient(180deg, #8b6914, #c49a6c, #8b6914);
              border-radius: 999px;
            }
          `}</style>
          {renderPuzzleBody(puzzle.type)}
        </div>
      </motion.div>
    </motion.div>
  );
}
