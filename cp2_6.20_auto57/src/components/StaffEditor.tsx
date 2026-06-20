import { useRef, useState, useEffect, useCallback } from 'react';
import { useScoreStore, NoteData } from '@/stores/useScoreStore';

const LINE_SPACING = 12;
const LEFT_MARGIN = 60;
const NOTE_SPACING = 50;
const SVG_HEIGHT = 200;
const STAFF_Y = (SVG_HEIGHT - 4 * LINE_SPACING) / 2;
const E4_REF = 30;
const PITCHES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const PITCH_INDEX: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
const NOTE_TYPES = ['whole', 'half', 'quarter', 'eighth'] as const;
const TYPE_LABELS: Record<string, string> = { whole: '全音符', half: '二分音符', quarter: '四分音符', eighth: '八分音符' };

function pitchToY(pitch: string, octave: number): number {
  const pos = octave * 7 + PITCH_INDEX[pitch] - E4_REF;
  return STAFF_Y + 4 * LINE_SPACING - pos * (LINE_SPACING / 2);
}

function yToPitchOctave(y: number): { pitch: string; octave: number } {
  const pos = Math.round((STAFF_Y + 4 * LINE_SPACING - y) / (LINE_SPACING / 2));
  const absPos = pos + E4_REF;
  const octave = Math.max(3, Math.min(6, Math.floor(absPos / 7)));
  const pitchIndex = ((absPos % 7) + 7) % 7;
  return { pitch: PITCHES[pitchIndex], octave };
}

function getLedgerYs(pitch: string, octave: number): number[] {
  const pos = octave * 7 + PITCH_INDEX[pitch] - E4_REF;
  const ys: number[] = [];
  if (pos < 0) for (let e = -2; e >= pos; e -= 2) ys.push(STAFF_Y + 4 * LINE_SPACING - e * (LINE_SPACING / 2));
  if (pos > 8) for (let e = 10; e <= pos; e += 2) ys.push(STAFF_Y + 4 * LINE_SPACING - e * (LINE_SPACING / 2));
  return ys;
}

function svgPoint(svg: SVGSVGElement, cx: number, cy: number) {
  const r = svg.getBoundingClientRect();
  return { x: cx - r.left, y: cy - r.top };
}

export default function StaffEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ id: string; sx: number; sy: number; nx: number; ny: number; moved: boolean } | null>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const [cw, setCw] = useState(800);

  const notes = useScoreStore(s => s.notes);
  const isPlaying = useScoreStore(s => s.isPlaying);
  const currentPlayIndex = useScoreStore(s => s.currentPlayIndex);
  const selectedNoteId = useScoreStore(s => s.selectedNoteId);
  const showPropertyPanel = useScoreStore(s => s.showPropertyPanel);
  const updateNote = useScoreStore(s => s.updateNote);
  const setSelectedNoteId = useScoreStore(s => s.setSelectedNoteId);
  const setShowPropertyPanel = useScoreStore(s => s.setShowPropertyPanel);
  const reorderNotes = useScoreStore(s => s.reorderNotes);

  const staffWidth = Math.max(cw, LEFT_MARGIN + notes.length * NOTE_SPACING + 40);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(e => setCw(e[0].contentRect.width));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSelectedNoteId(null); setShowPropertyPanel(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setSelectedNoteId, setShowPropertyPanel]);

  useEffect(() => {
    if (!isPlaying || currentPlayIndex < 0) return;
    const el = containerRef.current;
    if (!el) return;
    const tx = LEFT_MARGIN + currentPlayIndex * NOTE_SPACING;
    if (tx > el.scrollLeft + el.clientWidth - 100 || tx < el.scrollLeft)
      el.scrollTo({ left: tx - 100, behavior: 'smooth' });
  }, [isPlaying, currentPlayIndex]);

  const handleMouseDown = useCallback((e: React.MouseEvent, note: NoteData) => {
    e.preventDefault();
    e.stopPropagation();
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svgPoint(svg, e.clientX, e.clientY);
    dragRef.current = {
      id: note.id, sx: pt.x, sy: pt.y,
      nx: LEFT_MARGIN + note.order * NOTE_SPACING,
      ny: pitchToY(note.pitch, note.octave), moved: false,
    };
    offsetRef.current = { x: 0, y: 0 };
    setDragOffset({ x: 0, y: 0 });
    setDragId(note.id);
  }, []);

  useEffect(() => {
    if (!dragId) return;
    const svg = svgRef.current;
    if (!svg) return;
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const pt = svgPoint(svg, e.clientX, e.clientY);
      const dx = pt.x - d.sx;
      const dy = pt.y - d.sy;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true;
      offsetRef.current = { x: dx, y: dy };
      setDragOffset({ x: dx, y: dy });
    };
    const onUp = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) { setDragId(null); return; }
      if (!d.moved) {
        const s = useScoreStore.getState();
        const note = s.notes.find(n => n.id === d.id);
        if (note) {
          if (s.selectedNoteId === note.id && s.showPropertyPanel) {
            s.setSelectedNoteId(null);
            s.setShowPropertyPanel(false);
          } else {
            s.setSelectedNoteId(note.id);
            s.setShowPropertyPanel(true);
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) setPopupPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          }
        }
      } else {
        const { x: dx, y: dy } = offsetRef.current;
        if (Math.abs(dy) > 10) {
          const { pitch, octave } = yToPitchOctave(d.ny + dy);
          updateNote(d.id, { pitch, octave });
        }
        if (Math.abs(dx) > 10) {
          const s = useScoreStore.getState();
          const note = s.notes.find(n => n.id === d.id);
          if (note) {
            const newOrder = Math.max(0, Math.min(s.notes.length - 1, note.order + Math.round(dx / NOTE_SPACING)));
            if (newOrder !== note.order) reorderNotes(note.order, newOrder);
          }
        }
      }
      dragRef.current = null;
      offsetRef.current = { x: 0, y: 0 };
      setDragOffset({ x: 0, y: 0 });
      setDragId(null);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragId, updateNote, reorderNotes]);

  const handleBgClick = useCallback(() => {
    setSelectedNoteId(null);
    setShowPropertyPanel(false);
  }, [setSelectedNoteId, setShowPropertyPanel]);

  const sorted = [...notes].sort((a, b) => a.order - b.order);
  const selectedNote = notes.find(n => n.id === selectedNoteId);

  return (
    <div ref={containerRef} className="relative overflow-x-auto overflow-y-hidden w-full h-full bg-white" onClick={handleBgClick}>
      <svg ref={svgRef} width={staffWidth} height={SVG_HEIGHT} className="block">
        {[0, 1, 2, 3, 4].map(i => (
          <line key={i} x1={0} y1={STAFF_Y + i * LINE_SPACING} x2={staffWidth} y2={STAFF_Y + i * LINE_SPACING} stroke="#b0bec5" strokeWidth={1} />
        ))}
        {sorted.map(note => {
          const x = LEFT_MARGIN + note.order * NOTE_SPACING;
          let y = pitchToY(note.pitch, note.octave);
          const isDrag = dragId === note.id;
          if (isDrag) y += dragOffset.y;
          const dx = isDrag ? dragOffset.x : 0;
          const active = isPlaying && currentPlayIndex === note.order;
          const ledgerYs = getLedgerYs(note.pitch, note.octave);
          const hollow = note.type === 'whole' || note.type === 'half';
          const fillColor = note.flashState === 'red' ? '#ef4444' : note.flashState === 'green' ? '#22c55e' : '#455a64';
          return (
            <g key={note.id} transform={`translate(${x + dx},${y})`}
              className={`${active ? 'note-pulse' : ''} ${note.flashState !== 'none' ? 'note-flash-' + note.flashState : ''}`} style={{ cursor: 'grab' }}
              onMouseDown={e => handleMouseDown(e, note)} onClick={e => e.stopPropagation()}>
              {ledgerYs.map((ly, i) => (
                <line key={i} x1={-14} y1={ly - y} x2={14} y2={ly - y} stroke="#b0bec5" strokeWidth={1} />
              ))}
              <ellipse cx={0} cy={0} rx={7} ry={5} fill={hollow ? 'none' : fillColor} stroke={fillColor} strokeWidth={1.5} transform="rotate(-15)" />
              {note.type !== 'whole' && <line x1={8} y1={0} x2={8} y2={-30} stroke={fillColor} strokeWidth={1.5} />}
              {note.type === 'eighth' && <path d="M8,-30 Q16,-22 10,-14" fill="none" stroke={fillColor} strokeWidth={1.5} />}
            </g>
          );
        })}
      </svg>
      {showPropertyPanel && selectedNote && (
        <div className="absolute bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-10 min-w-[180px]"
          style={{ left: Math.min(popupPos.x, cw - 200), top: Math.min(popupPos.y + 10, SVG_HEIGHT - 200) }}
          onClick={e => e.stopPropagation()}>
          <div className="mb-2">
            <label className="text-xs text-gray-600 block mb-1">音名</label>
            <select className="w-full border rounded px-2 py-1 text-sm" value={selectedNote.pitch}
              onChange={e => updateNote(selectedNote.id, { pitch: e.target.value })}>
              {PITCHES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="mb-2">
            <label className="text-xs text-gray-600 block mb-1">八度</label>
            <select className="w-full border rounded px-2 py-1 text-sm" value={selectedNote.octave}
              onChange={e => updateNote(selectedNote.id, { octave: Number(e.target.value) })}>
              {[3, 4, 5, 6].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="mb-2">
            <label className="text-xs text-gray-600 block mb-1">时值</label>
            <select className="w-full border rounded px-2 py-1 text-sm" value={selectedNote.type}
              onChange={e => updateNote(selectedNote.id, { type: e.target.value as NoteData['type'] })}>
              {NOTE_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">力度</label>
            <input type="range" min={1} max={127} value={selectedNote.velocity} className="w-full"
              onChange={e => updateNote(selectedNote.id, { velocity: Number(e.target.value) })} />
            <span className="text-xs text-gray-500">{selectedNote.velocity}</span>
          </div>
        </div>
      )}
      <style>{`
        .note-pulse { animation: note-pulse 0.8s ease-in-out infinite; }
        @keyframes note-pulse {
          0%, 100% { filter: drop-shadow(0 0 0px transparent); }
          50% { filter: drop-shadow(0 0 8px #ffd600); }
        }
        .note-flash-green { animation: note-flash-green 1.2s ease-out; }
        @keyframes note-flash-green {
          0% { filter: drop-shadow(0 0 4px #22c55e); }
          50% { filter: drop-shadow(0 0 16px #22c55e); }
          100% { filter: drop-shadow(0 0 0px transparent); }
        }
        .note-flash-red { animation: note-flash-red 1.2s ease-out; }
        @keyframes note-flash-red {
          0% { filter: drop-shadow(0 0 4px #ef4444); }
          50% { filter: drop-shadow(0 0 16px #ef4444); }
          100% { filter: drop-shadow(0 0 0px transparent); }
        }
      `}</style>
    </div>
  );
}
