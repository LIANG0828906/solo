import { useState } from 'react';
import { useMixerStore } from '@/store/useMixerStore';
import { Check } from 'lucide-react';

export default function RhythmEditor() {
  const showRhythmEditor = useMixerStore((s) => s.showRhythmEditor);
  const editingGenreId = useMixerStore((s) => s.editingGenreId);
  const genres = useMixerStore((s) => s.genres);
  const closeRhythmEditor = useMixerStore((s) => s.closeRhythmEditor);
  const setRhythmPattern = useMixerStore((s) => s.setRhythmPattern);

  const genre = genres.find((g) => g.id === editingGenreId);

  const [pattern, setPattern] = useState<boolean[][]>(
    genre?.rhythmPattern.map((row) => [...row]) ?? [
      [false, false, false, false, false, false, false, false],
      [false, false, false, false, false, false, false, false],
      [false, false, false, false, false, false, false, false],
      [false, false, false, false, false, false, false, false],
    ]
  );

  if (!showRhythmEditor || !genre) return null;

  const toggleCell = (beat: number, step: number) => {
    const newPattern = pattern.map((row) => [...row]);
    newPattern[beat][step] = !newPattern[beat][step];
    setPattern(newPattern);
  };

  const handleConfirm = () => {
    setRhythmPattern(genre.id, pattern);
    closeRhythmEditor();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeRhythmEditor();
      }}
    >
      <div
        className="flex flex-col gap-4 p-6"
        style={{
          background: '#1A1A2E',
          borderRadius: 16,
          width: 400,
          height: 300,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: genre.color }}
            />
            <span className="text-base font-semibold" style={{ color: genre.color }}>
              {genre.name} - 节奏编辑
            </span>
          </div>
        </div>

        <div className="flex gap-1 text-xs" style={{ color: '#6B7280' }}>
          <span className="w-6 shrink-0" />
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <span key={n} className="flex-1 text-center">
              {n}
            </span>
          ))}
        </div>

        <div className="flex-1 flex flex-col gap-1.5 overflow-auto">
          {pattern.map((beat, beatIdx) => (
            <div key={beatIdx} className="flex gap-1 items-center">
              <span
                className="w-6 shrink-0 text-xs text-center font-medium"
                style={{ color: '#6B7280' }}
              >
                {beatIdx + 1}
              </span>
              {beat.map((active, stepIdx) => (
                <button
                  key={stepIdx}
                  onClick={() => toggleCell(beatIdx, stepIdx)}
                  className="flex-1 aspect-square rounded transition-all duration-200 ease-out"
                  style={{
                    background: active ? genre.color : '#3D3D5C',
                    boxShadow: active
                      ? `0 0 8px ${genre.color}40`
                      : 'none',
                    minHeight: 24,
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={closeRhythmEditor}
            className="px-4 py-1.5 rounded-md text-sm transition-colors duration-200 ease-out"
            style={{
              background: '#2D2D44',
              color: '#E0E0E0',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#3D3D5C';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#2D2D44';
            }}
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition-colors duration-200 ease-out"
            style={{
              background: genre.color,
              color: '#0D0D1A',
              fontWeight: 600,
            }}
          >
            <Check size={14} />
            确定
          </button>
        </div>
      </div>
    </div>
  );
}
