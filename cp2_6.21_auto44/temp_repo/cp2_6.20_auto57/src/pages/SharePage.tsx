import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useShareStore } from '@/stores/useShareStore';
import { audioEngine } from '@/utils/audioEngine';

const LINE_SPACING = 12;
const LEFT_MARGIN = 60;
const NOTE_SPACING = 50;
const SVG_HEIGHT = 200;
const STAFF_Y = (SVG_HEIGHT - 4 * LINE_SPACING) / 2;
const E4_REF = 30;
const PITCHES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const PITCH_INDEX: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

function pitchToY(pitch: string, octave: number): number {
  const pos = octave * 7 + PITCH_INDEX[pitch] - E4_REF;
  return STAFF_Y + 4 * LINE_SPACING - pos * (LINE_SPACING / 2);
}

function getLedgerYs(pitch: string, octave: number): number[] {
  const pos = octave * 7 + PITCH_INDEX[pitch] - E4_REF;
  const ys: number[] = [];
  if (pos < 0) for (let e = -2; e >= pos; e -= 2) ys.push(STAFF_Y + 4 * LINE_SPACING - e * (LINE_SPACING / 2));
  if (pos > 8) for (let e = 10; e <= pos; e += 2) ys.push(STAFF_Y + 4 * LINE_SPACING - e * (LINE_SPACING / 2));
  return ys;
}

export default function SharePage() {
  const { id } = useParams<{ id: string }>();
  const loadShare = useShareStore(s => s.loadShare);
  const notes = useShareStore(s => s.notes);
  const tempo = useShareStore(s => s.tempo);
  const loaded = useShareStore(s => s.loaded);
  const error = useShareStore(s => s.error);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playIndex, setPlayIndex] = useState(-1);
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (id) loadShare(id);
    return () => { if (playTimerRef.current) clearTimeout(playTimerRef.current); };
  }, [id, loadShare]);

  const handlePlay = useCallback(() => {
    if (isPlaying) {
      audioEngine.stopAll();
      setIsPlaying(false);
      setPlayIndex(-1);
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
      return;
    }
    const sorted = [...notes].sort((a, b) => a.order - b.order);
    if (sorted.length === 0) return;
    setIsPlaying(true);
    let idx = 0;
    setPlayIndex(0);
    const playNext = () => {
      if (idx >= sorted.length) {
        setIsPlaying(false);
        setPlayIndex(-1);
        return;
      }
      const note = sorted[idx];
      setPlayIndex(idx);
      audioEngine.playNote(note.pitch, note.octave, note.duration, note.velocity, tempo);
      const beatMs = (60 / tempo) * 1000;
      const noteMs = note.duration * beatMs;
      idx++;
      playTimerRef.current = setTimeout(playNext, noteMs);
    };
    playNext();
  }, [isPlaying, notes, tempo]);

  const sorted = [...notes].sort((a, b) => a.order - b.order);
  const staffWidth = Math.max(800, LEFT_MARGIN + sorted.length * NOTE_SPACING + 40);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <div className="text-bark-500 font-body">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-body text-lg mb-2">{error}</p>
          <p className="text-bark-300 font-body text-sm">请检查链接是否正确</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment">
      <header className="bg-bark-900 text-parchment py-4 px-6">
        <h1 className="font-display text-2xl font-bold">NoteScribe 分享乐谱</h1>
        <p className="font-body text-bark-100 text-sm mt-1">Tempo: {tempo} BPM · {sorted.length} 个音符</p>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 overflow-x-auto">
          <svg width={staffWidth} height={SVG_HEIGHT} className="block">
            {[0, 1, 2, 3, 4].map(i => (
              <line key={i} x1={0} y1={STAFF_Y + i * LINE_SPACING} x2={staffWidth} y2={STAFF_Y + i * LINE_SPACING} stroke="#b0bec5" strokeWidth={1} />
            ))}
            <line x1={0} y1={STAFF_Y} x2={0} y2={STAFF_Y + 4 * LINE_SPACING} stroke="#b0bec5" strokeWidth={2} />
            <line x1={staffWidth} y1={STAFF_Y} x2={staffWidth} y2={STAFF_Y + 4 * LINE_SPACING} stroke="#b0bec5" strokeWidth={2} />
            {sorted.map((note, i) => {
              const x = LEFT_MARGIN + i * NOTE_SPACING;
              const y = pitchToY(note.pitch, note.octave);
              const active = isPlaying && playIndex === i;
              const hollow = note.type === 'whole' || note.type === 'half';
              const ledgerYs = getLedgerYs(note.pitch, note.octave);
              return (
                <g key={note.id} transform={`translate(${x},${y})`}
                  className={active ? 'note-pulse' : ''}>
                  {ledgerYs.map((ly, j) => (
                    <line key={j} x1={-14} y1={ly - y} x2={14} y2={ly - y} stroke="#b0bec5" strokeWidth={1} />
                  ))}
                  <ellipse cx={0} cy={0} rx={7} ry={5} fill={hollow ? 'none' : '#455a64'} stroke="#455a64" strokeWidth={1.5} transform="rotate(-15)" />
                  {note.type !== 'whole' && <line x1={8} y1={0} x2={8} y2={-30} stroke="#455a64" strokeWidth={1.5} />}
                  {note.type === 'eighth' && <path d="M8,-30 Q16,-22 10,-14" fill="none" stroke="#455a64" strokeWidth={1.5} />}
                </g>
              );
            })}
          </svg>
        </div>
        <div className="mt-6 flex justify-center">
          <button
            onClick={handlePlay}
            className={`tool-btn px-8 py-3 rounded-full font-body font-semibold text-sm transition-all ${
              isPlaying
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-bark-900 text-parchment hover:bg-bark-700'
            }`}
          >
            {isPlaying ? '■ 停止播放' : '▶ 播放乐谱'}
          </button>
        </div>
      </main>
    </div>
  );
}
