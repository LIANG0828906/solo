import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { DURATION_NAMES } from '../music/scoreParser';
import type { MatchResult } from '../music/noteMatcher';

const NOTE_RANGE_MIN = 48;
const NOTE_RANGE_MAX = 84;

function noteToY(note: string, height: number): number {
  const noteName = note.replace(/\d/g, '');
  const octave = parseInt(note.match(/\d/)?.[0] || '4', 10);
  const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const semitone = noteOrder.indexOf(noteName);
  const midi = octave * 12 + semitone;
  const range = NOTE_RANGE_MAX - NOTE_RANGE_MIN;
  const ratio = (midi - NOTE_RANGE_MIN) / range;
  return height * (1 - ratio) * 0.9 + height * 0.05;
}

function durationToSize(duration: number): number {
  const base = 24;
  const scale = 4 / duration;
  return Math.max(14, base * Math.sqrt(scale));
}

interface TooltipData {
  x: number;
  y: number;
  note: string;
  duration: number;
}

export function ScoreView() {
  const currentScore = useGameStore((s) => s.currentScore);
  const currentIndex = useGameStore((s) => s.currentScoreIndex);
  const matchResults = useGameStore((s) => s.matchResults);
  const scoreName = useGameStore((s) => s.scoreName);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  if (currentScore.length === 0) {
    return (
      <div className="w-full bg-bgScore rounded-xl p-8 min-h-[320px] flex items-center justify-center border border-accentCyan/20">
        <div className="text-center">
          <div className="text-6xl mb-4">🎹</div>
          <p className="text-gray-400 text-lg">请在下方选择一首曲目开始练习</p>
        </div>
      </div>
    );
  }

  const viewWidth = Math.max(600, currentScore.length * 70 + 80);
  const viewHeight = 320;

  const getNoteState = (idx: number): 'current' | 'correct' | 'pending' => {
    if (idx === currentIndex) return 'current';
    const result = matchResults.find((r: MatchResult) => r.index === idx);
    if (result?.correct) return 'correct';
    return 'pending';
  };

  return (
    <div className="w-full bg-bgScore rounded-xl p-4 border border-accentCyan/20 relative">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-accentCyan font-semibold text-lg" style={{ textShadow: '0 0 8px rgba(78,205,196,0.5)' }}>
          🎵 {scoreName}
        </h3>
        <span className="text-gray-400 text-sm">
          进度: {Math.min(currentIndex, currentScore.length)} / {currentScore.length}
        </span>
      </div>

      <div className="w-full overflow-x-auto">
        <div
          className="relative"
          style={{ width: `${viewWidth}px`, height: `${viewHeight}px` }}
          onMouseLeave={() => setTooltip(null)}
        >
          <div className="absolute inset-0 pointer-events-none">
            {['C4', 'C5', 'C6'].map((n) => (
              <div
                key={n}
                className="absolute left-0 right-0 border-t border-dashed border-gray-600/40"
                style={{ top: `${noteToY(n, viewHeight)}px` }}
              >
                <span className="text-[10px] text-gray-500 absolute -left-1 -top-2 bg-bgScore px-1">{n}</span>
              </div>
            ))}
          </div>

          {currentScore.map((noteObj, idx) => {
            const state = getNoteState(idx);
            const x = idx * 70 + 40;
            const y = noteToY(noteObj.note, viewHeight);
            const size = durationToSize(noteObj.duration);

            let color = '#FFE66D';
            let shadow = 'none';
            let extraClass = '';

            if (state === 'current') {
              color = '#FFE66D';
              shadow = '0 0 14px rgba(78, 205, 196, 0.9), 0 0 28px rgba(78, 205, 196, 0.4)';
            } else if (state === 'correct') {
              color = '#6BCB77';
              shadow = '0 0 10px rgba(107, 203, 119, 0.7)';
              extraClass = 'animate-bounce-note';
            }

            return (
              <div
                key={idx}
                className={`absolute flex flex-col items-center pointer-events-auto ${extraClass}`}
                style={{ left: `${x - 50}px`, top: `${y - 40}px`, width: '100px' }}
              >
                <span className="text-[10px] text-gray-300 mb-1 font-medium">{noteObj.note}</span>
                <div
                  onMouseEnter={(e) => {
                    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
                    const parent = (e.currentTarget.closest('[data-score-root]') as HTMLElement) || null;
                    const px = rect.left - (parent?.getBoundingClientRect().left || 0) + rect.width / 2;
                    const py = rect.top - (parent?.getBoundingClientRect().top || 0);
                    setTooltip({
                      x: px,
                      y: py - 8,
                      note: noteObj.note,
                      duration: noteObj.duration,
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  className="rounded-full cursor-pointer transition-all duration-200 flex items-center justify-center"
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundColor: color,
                    boxShadow: state === 'current' ? `0 0 0 4px rgba(78, 205, 196, 0.4), ${shadow}` : shadow,
                    transform: state === 'current' ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
                <span className="text-[10px] text-gray-400 mt-1">
                  {DURATION_NAMES[noteObj.duration] || `${noteObj.duration}分`}
                </span>
              </div>
            );
          })}

          {tooltip && (
            <div
              className="absolute z-20 pointer-events-none rounded-lg px-3 py-2 text-white text-xs whitespace-nowrap"
              style={{
                left: `${tooltip.x}px`,
                top: `${tooltip.y - 52}px`,
                transform: 'translateX(-50%)',
                backgroundColor: '#1A1A2E',
                border: '1px solid rgba(78, 205, 196, 0.4)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              }}
            >
              <div className="font-semibold text-accentCyan">音高: {tooltip.note}</div>
              <div className="text-gray-300">时值: {DURATION_NAMES[tooltip.duration] || `${tooltip.duration}分音符`}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
