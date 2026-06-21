import React, { useState, useCallback, useMemo } from 'react';
import { useStore } from './store/useStore';
import { createChord, getNoteName, type Note } from './utils/chordParser';
import {
  STRING_COUNT,
  FRET_COUNT,
  STRING_SPACING,
  FRET_WIDTH,
  ANIMATION_DURATIONS,
  HIGHLIGHT_COLOR,
  KEYS,
  KEY_MODES,
} from './utils/constants';
import { Trash2, Plus } from 'lucide-react';

const ChordEditor: React.FC = () => {
  const {
    currentKey,
    currentMode,
    chordSequence,
    activeNotes,
    selectedChordId,
    setCurrentKey,
    setCurrentMode,
    addChord,
    removeChord,
    updateChordDuration,
    setSelectedChordId,
  } = useStore();

  const [editingNotes, setEditingNotes] = useState<Note[]>([]);
  const [animatingNote, setAnimatingNote] = useState<string | null>(null);

  const editorWidth = FRET_WIDTH * (FRET_COUNT + 1);
  const editorHeight = (STRING_COUNT - 1) * STRING_SPACING + 80;

  const handleFretClick = useCallback((string: number, fret: number) => {
    const noteId = `${string}-${fret}`;
    setAnimatingNote(noteId);
    setTimeout(() => setAnimatingNote(null), ANIMATION_DURATIONS.click);

    setEditingNotes((prev) => {
      const existingIndex = prev.findIndex(
        (n) => n.string === string && n.fret === fret
      );
      if (existingIndex !== -1) {
        return prev.filter((_, i) => i !== existingIndex);
      }
      return [...prev, { string, fret }];
    });
  }, []);

  const handleAddChord = useCallback(() => {
    if (editingNotes.length === 0) return;
    const chord = createChord(editingNotes, 4);
    addChord(chord);
    setEditingNotes([]);
  }, [editingNotes, addChord]);

  const handleKeyChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setCurrentKey(e.target.value);
    },
    [setCurrentKey]
  );

  const handleModeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setCurrentMode(e.target.value);
    },
    [setCurrentMode]
  );

  const isActiveNote = useCallback(
    (string: number, fret: number): boolean => {
      return activeNotes.some((n) => n.string === string && n.fret === fret);
    },
    [activeNotes]
  );

  const isEditingNote = useCallback(
    (string: number, fret: number): boolean => {
      return editingNotes.some((n) => n.string === string && n.fret === fret);
    },
    [editingNotes]
  );

  const getNoteColor = useMemo(() => {
    if (editingNotes.length < 3) return '#6C63FF';
    const tempChord = createChord(editingNotes, 1);
    return tempChord.color;
  }, [editingNotes]);

  const renderFretboard = () => {
    const elements: React.ReactElement[] = [];

    for (let i = 0; i < STRING_COUNT; i++) {
      const y = 40 + i * STRING_SPACING;
      elements.push(
        <line
          key={`string-${i}`}
          x1={40}
          y1={y}
          x2={editorWidth}
          y2={y}
          stroke="#B0B0B0"
          strokeWidth={2 - i * 0.2}
        />
      );
    }

    for (let i = 0; i <= FRET_COUNT; i++) {
      const x = 40 + i * FRET_WIDTH;
      const thickness = i % 12 === 0 ? 3 : i % 3 === 0 ? 2 : 1;
      elements.push(
        <line
          key={`fret-${i}`}
          x1={x}
          y1={40}
          x2={x}
          y2={editorHeight - 40}
          stroke="#888"
          strokeWidth={thickness}
        />
      );

      if (i > 0) {
        elements.push(
          <text
            key={`fret-label-${i}`}
            x={x + FRET_WIDTH / 2}
            y={editorHeight - 15}
            fill="#666"
            fontSize={10}
            textAnchor="middle"
          >
            {i}
          </text>
        );
      }

      if (i === 3 || i === 5 || i === 7 || i === 9) {
        elements.push(
          <circle
            key={`marker-${i}`}
            cx={x + FRET_WIDTH / 2}
            cy={editorHeight / 2}
            r={4}
            fill="#666"
          />
        );
      }
      if (i === 12) {
        elements.push(
          <circle
            key={`marker-12a`}
            cx={x + FRET_WIDTH / 2}
            cy={editorHeight / 2 - 15}
            r={4}
            fill="#666"
          />,
          <circle
            key={`marker-12b`}
            cx={x + FRET_WIDTH / 2}
            cy={editorHeight / 2 + 15}
            r={4}
            fill="#666"
          />
        );
      }
    }

    for (let i = 0; i < STRING_COUNT; i++) {
      const y = 40 + i * STRING_SPACING;
      elements.push(
        <text
          key={`open-label-${i}`}
          x={20}
          y={y + 4}
          fill="#888"
          fontSize={10}
          textAnchor="middle"
        >
          {['e', 'B', 'G', 'D', 'A', 'E'][i]}
        </text>
      );
    }

    for (let string = 0; string < STRING_COUNT; string++) {
      for (let fret = 0; fret < FRET_COUNT; fret++) {
        const x = 40 + fret * FRET_WIDTH + FRET_WIDTH / 2;
        const y = 40 + string * STRING_SPACING;
        const noteId = `${string}-${fret}`;
        const isEditing = isEditingNote(string, fret);
        const isActive = isActiveNote(string, fret);
        const isAnimating = animatingNote === noteId;

        if (isEditing || isActive) {
          const color = isActive ? HIGHLIGHT_COLOR : getNoteColor;
          elements.push(
            <circle
              key={`note-${noteId}`}
              cx={x}
              cy={y}
              r={isAnimating ? 12 : 8}
              fill={color}
              style={{
                transition: `all ${ANIMATION_DURATIONS.click}ms cubic-bezier(0.68, -0.55, 0.265, 1.55)`,
                filter: isActive ? `drop-shadow(0 0 8px ${color})` : 'none',
              }}
            />
          );
          if (fret === 0) {
            elements.push(
              <circle
                key={`note-open-${noteId}`}
                cx={x}
                cy={y}
                r={10}
                fill="none"
                stroke={color}
                strokeWidth={2}
                style={{
                  transition: `all ${ANIMATION_DURATIONS.click}ms`,
                }}
              />
            );
          }
        }

        elements.push(
          <rect
            key={`click-${noteId}`}
            x={40 + fret * FRET_WIDTH}
            y={y - STRING_SPACING / 2}
            width={FRET_WIDTH}
            height={STRING_SPACING}
            fill="transparent"
            className="cursor-pointer"
            onClick={() => handleFretClick(string, fret)}
          />
        );
      }
    }

    return elements;
  };

  const getChordTypeName = (type: string): string => {
    const names: Record<string, string> = {
      major: '大三',
      minor: '小三',
      dominant7: '属七',
    };
    return names[type] || type;
  };

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">六线谱编辑</h2>
        <div className="flex gap-2">
          <select
            value={currentKey}
            onChange={handleKeyChange}
            className="h-11 px-4 rounded-lg bg-[var(--panel-bg)] text-[var(--bg-primary)] font-medium cursor-pointer hover:bg-white transition-all"
            style={{ height: '44px', borderRadius: '8px' }}
          >
            {KEYS.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
          <select
            value={currentMode}
            onChange={handleModeChange}
            className="h-11 px-4 rounded-lg bg-[var(--panel-bg)] text-[var(--bg-primary)] font-medium cursor-pointer hover:bg-white transition-all"
            style={{ height: '44px', borderRadius: '8px' }}
          >
            {KEY_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        className="bg-[var(--bg-secondary)] rounded-xl p-4 overflow-x-auto"
        style={{ minHeight: editorHeight + 32 }}
      >
        <svg
          width={editorWidth + 20}
          height={editorHeight}
          className="mx-auto"
        >
          {renderFretboard()}
        </svg>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: getNoteColor }}
          />
          <span className="text-sm text-[var(--text-secondary)]">
            {editingNotes.length === 0
              ? '点击六线谱添加指法'
              : `已添加 ${editingNotes.length} 个音符 - ${
                  editingNotes.length >= 3
                    ? `${getNoteName(editingNotes[0])}${getChordTypeName(createChord(editingNotes, 1).type)}`
                    : '至少需要3个音符构成和弦'
                }`}
          </span>
        </div>
        <button
          onClick={handleAddChord}
          disabled={editingNotes.length < 3}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-white transition-all hover:scale-105 disabled:hover:scale-100"
          style={{
            background: 'var(--accent-gradient)',
            opacity: editingNotes.length >= 3 ? 1 : 0.5,
          }}
        >
          <Plus size={18} />
          添加和弦
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
          和弦序列 ({chordSequence.length})
        </h3>
        {chordSequence.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-secondary)] border-2 border-dashed border-[var(--border-color)] rounded-xl">
            暂无和弦，请在上方六线谱添加
          </div>
        ) : (
          chordSequence.map((chord, index) => (
            <div
              key={chord.id}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                selectedChordId === chord.id
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                  : 'border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)]/50'
              }`}
              onClick={() =>
                setSelectedChordId(
                  selectedChordId === chord.id ? null : chord.id
                )
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: chord.color }}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">
                      {chord.rootNote} {getChordTypeName(chord.type)}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      {chord.notes.length} 个音符 · 持续 {chord.duration} 拍
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={chord.duration}
                    onChange={(e) =>
                      updateChordDuration(
                        chord.id,
                        parseInt(e.target.value)
                      )
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 py-1.5 rounded-lg bg-[var(--panel-bg)] text-[var(--bg-primary)] text-sm font-medium cursor-pointer"
                  >
                    {[1, 2, 3, 4, 6, 8].map((d) => (
                      <option key={d} value={d}>
                        {d}拍
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeChord(chord.id);
                    }}
                    className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-400/10 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChordEditor;
