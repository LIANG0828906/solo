import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Score, Note, Collaborator } from './types';

interface EditorProps {
  score: Score;
  collaborators: Collaborator[];
  currentUser: Collaborator;
  selectedTool: string;
  selectedStaff: 'treble' | 'bass';
  highlightedNoteId: string | null;
  currentPlayPosition: number;
  isPlaying: boolean;
  onAddNote: (pitch: number, octave: number, position: number) => void;
  onDeleteNote: (noteId: string) => void;
  onMoveNote: (noteId: string, newPosition: number, newPitch: number) => void;
  onCursorUpdate?: (position: number | null) => void;
}

const CANVAS_PADDING_LEFT = 100;
const CANVAS_PADDING_RIGHT = 80;
const STAFF_LINE_SPACING = 10;
const STAFF_TOP_TREBLE = 120;
const STAFF_TOP_BASS = 260;
const BEAT_WIDTH = 70;
const MIN_BEATS = 32;

const PITCH_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const Editor: React.FC<EditorProps> = ({
  score,
  collaborators,
  currentUser,
  selectedTool,
  selectedStaff,
  highlightedNoteId,
  currentPlayPosition,
  isPlaying,
  onAddNote,
  onDeleteNote,
  onMoveNote,
  onCursorUpdate
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverInfo, setHoverInfo] = useState<{
    position: number;
    pitch: number;
    octave: number;
    x: number;
    y: number;
  } | null>(null);
  const [draggingNote, setDraggingNote] = useState<{
    noteId: string;
    startX: number;
    startY: number;
    origPosition: number;
    origPitch: number;
    origOctave: number;
  } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 450 });
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const lastCursorSentRef = useRef<number>(-1);

  const totalBeats = useMemo(() => {
    if (score.notes.length === 0) return MIN_BEATS;
    const maxBeat = Math.max(...score.notes.map(n => n.position + n.duration));
    return Math.max(MIN_BEATS, Math.ceil(maxBeat) + 4);
  }, [score.notes]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({
          width: Math.max(1200, CANVAS_PADDING_LEFT + totalBeats * BEAT_WIDTH + CANVAS_PADDING_RIGHT),
          height: Math.max(450, rect.height - 20)
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [totalBeats]);

  const getPitchY = useCallback((pitch: number, octave: number, staff: 'treble' | 'bass') => {
    const staffTop = staff === 'treble' ? STAFF_TOP_TREBLE : STAFF_TOP_BASS;
    const baseMIDI = staff === 'treble' ? 67 : 50;
    const targetMIDI = octave * 12 + pitch;
    const halfSteps = targetMIDI - baseMIDI;
    const staffPositions = halfSteps / 2;
    return staffTop + 4 * STAFF_LINE_SPACING - staffPositions * (STAFF_LINE_SPACING / 2);
  }, []);

  const getPitchFromY = useCallback((y: number, staff: 'treble' | 'bass') => {
    const staffTop = staff === 'treble' ? STAFF_TOP_TREBLE : STAFF_TOP_BASS;
    const baseMIDI = staff === 'treble' ? 67 : 50;
    const staffPositions = (staffTop + 4 * STAFF_LINE_SPACING - y) / (STAFF_LINE_SPACING / 2);
    const halfSteps = Math.round(staffPositions * 2);
    const midi = baseMIDI + halfSteps;
    return {
      pitch: ((midi % 12) + 12) % 12,
      octave: Math.floor(midi / 12)
    };
  }, []);

  const drawStaff = useCallback((ctx: CanvasRenderingContext2D, staffTop: number, startX: number, endX: number) => {
    ctx.strokeStyle = '#d0d0d0';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = staffTop + i * STAFF_LINE_SPACING;
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
  }, []);

  const drawClef = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, type: 'treble' | 'bass') => {
    ctx.font = '48px serif';
    ctx.fillStyle = '#333';
    ctx.textBaseline = 'middle';
    ctx.fillText(type === 'treble' ? '𝄞' : '𝄢', x, y);
  }, []);

  const drawTimeSignature = useCallback((ctx: CanvasRenderingContext2D, x: number, top: number, bottom: number) => {
    ctx.font = 'bold 28px serif';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(top), x, top - 15);
    ctx.fillText(String(bottom), x, top + 15);
    ctx.textAlign = 'left';
  }, []);

  const drawBarLines = useCallback((ctx: CanvasRenderingContext2D, beatsPerBar: number, startX: number, endX: number, staffTop: number) => {
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    const totalWidth = endX - startX;
    const bars = Math.ceil(totalWidth / (BEAT_WIDTH * beatsPerBar));
    for (let i = 0; i <= bars; i++) {
      const x = startX + i * BEAT_WIDTH * beatsPerBar;
      if (x > endX) break;
      ctx.beginPath();
      ctx.moveTo(x, staffTop);
      ctx.lineTo(x, staffTop + 4 * STAFF_LINE_SPACING);
      ctx.stroke();
    }
  }, []);

  const drawNoteHead = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    duration: number,
    isHighlighted: boolean,
    isSelected: boolean,
    highlightIntensity: number = 1
  ) => {
    ctx.save();
    if (isHighlighted) {
      ctx.shadowColor = `rgba(74, 158, 255, ${highlightIntensity})`;
      ctx.shadowBlur = 15 * highlightIntensity;
    } else if (isSelected) {
      ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
      ctx.shadowBlur = 10;
    }

    ctx.fillStyle = isHighlighted
      ? `rgba(74, 158, 255, ${0.6 + 0.4 * highlightIntensity})`
      : (isSelected ? '#FFD700' : '#1a1a1a');
    ctx.beginPath();
    ctx.ellipse(x, y, 7, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();

    if (duration >= 2) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.beginPath();
      ctx.ellipse(x, y, 4, 2.5, -0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }, []);

  const drawNote = useCallback((
    ctx: CanvasRenderingContext2D,
    note: Note,
    isHighlighted: boolean,
    isSelected: boolean,
    highlightIntensity: number = 1
  ) => {
    const x = CANVAS_PADDING_LEFT + note.position * BEAT_WIDTH;
    const y = getPitchY(note.pitch, note.octave, note.staff);
    const staffTop = note.staff === 'treble' ? STAFF_TOP_TREBLE : STAFF_TOP_BASS;

    const needsLedger = (() => {
      if (note.staff === 'treble') {
        return y < staffTop - STAFF_LINE_SPACING || y > staffTop + 5 * STAFF_LINE_SPACING;
      }
      return y < staffTop - STAFF_LINE_SPACING || y > staffTop + 5 * STAFF_LINE_SPACING;
    })();

    if (needsLedger) {
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1;
      const ledgerLines = Math.ceil(Math.abs(y - (staffTop + 2 * STAFF_LINE_SPACING)) / STAFF_LINE_SPACING);
      for (let i = 1; i <= ledgerLines; i++) {
        let ledgerY: number;
        if (y < staffTop) {
          ledgerY = staffTop - i * STAFF_LINE_SPACING;
          if (ledgerY < y - STAFF_LINE_SPACING / 2) continue;
        } else {
          ledgerY = staffTop + (4 + i) * STAFF_LINE_SPACING;
          if (ledgerY > y + STAFF_LINE_SPACING / 2) continue;
        }
        ctx.beginPath();
        ctx.moveTo(x - 10, ledgerY);
        ctx.lineTo(x + 10, ledgerY);
        ctx.stroke();
      }
    }

    drawNoteHead(ctx, x, y, note.duration, isHighlighted, isSelected, highlightIntensity);

    if (note.duration < 4) {
      const stemColor = isHighlighted
        ? `rgba(74, 158, 255, ${0.6 + 0.4 * highlightIntensity})`
        : (isSelected ? '#FFD700' : '#1a1a1a');
      ctx.strokeStyle = stemColor;
      ctx.lineWidth = 2;
      const stemUp = y > staffTop + 2 * STAFF_LINE_SPACING;
      const stemX = stemUp ? x - 7 : x + 7;
      const stemStartY = y;
      const stemEndY = stemUp ? y - 35 : y + 35;
      ctx.beginPath();
      ctx.moveTo(stemX, stemStartY);
      ctx.lineTo(stemX, stemEndY);
      ctx.stroke();

      if (note.duration < 1) {
        const flagCount = note.duration <= 0.25 ? 2 : 1;
        for (let f = 0; f < flagCount; f++) {
          ctx.beginPath();
          ctx.moveTo(stemX, stemUp ? stemEndY + f * 10 : stemEndY - f * 10);
          ctx.quadraticCurveTo(
            stemX + (stemUp ? 12 : -12),
            (stemUp ? stemEndY : stemEndY) + (stemUp ? 5 + f * 10 : -5 - f * 10),
            stemX + (stemUp ? 8 : -8),
            (stemUp ? stemEndY : stemEndY) + (stemUp ? 15 + f * 10 : -15 - f * 10)
          );
          ctx.stroke();
        }
      }
    }

    if (note.accidental) {
      ctx.font = '16px serif';
      ctx.fillStyle = '#333';
      ctx.textBaseline = 'middle';
      const symbol = note.accidental === 'sharp' ? '♯' : note.accidental === 'flat' ? '♭' : '♮';
      ctx.fillText(symbol, x - 18, y);
    }
  }, [getPitchY, drawNoteHead]);

  const drawPlaybackCursor = useCallback((ctx: CanvasRenderingContext2D, position: number, height: number) => {
    if (!isPlaying) return;
    const x = CANVAS_PADDING_LEFT + position * BEAT_WIDTH;

    const gradient = ctx.createLinearGradient(x - 15, 0, x + 15, 0);
    gradient.addColorStop(0, 'rgba(74, 158, 255, 0)');
    gradient.addColorStop(0.5, 'rgba(74, 158, 255, 0.18)');
    gradient.addColorStop(1, 'rgba(74, 158, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - 15, 0, 30, height);

    ctx.strokeStyle = 'rgba(74, 158, 255, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 40);
    ctx.lineTo(x, height - 40);
    ctx.stroke();
  }, [isPlaying]);

  const drawCollaboratorCursor = useCallback((ctx: CanvasRenderingContext2D, collab: Collaborator) => {
    if (collab.cursorPosition === null) return;
    const x = CANVAS_PADDING_LEFT + collab.cursorPosition * BEAT_WIDTH;

    const staffTop = selectedStaff === 'treble' ? STAFF_TOP_TREBLE : STAFF_TOP_BASS;
    const staffBottom = (selectedStaff === 'treble' ? STAFF_TOP_BASS : STAFF_TOP_BASS) + 4 * STAFF_LINE_SPACING;
    const cursorTop = Math.min(STAFF_TOP_TREBLE, staffTop) - 20;
    const cursorBottom = Math.max(STAFF_TOP_TREBLE + 4 * STAFF_LINE_SPACING, staffBottom) + 40;

    ctx.save();
    ctx.strokeStyle = collab.color;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.lineDashOffset = 0;
    ctx.beginPath();
    ctx.moveTo(x, cursorTop);
    ctx.lineTo(x, cursorBottom - 48);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = 'bold 12px sans-serif';
    const labelWidth = Math.max(50, ctx.measureText(collab.name).width + 20);
    const labelX = x + 4;
    const labelY = cursorTop;
    const labelHeight = 22;

    const roundedRect = (rx: number, ry: number, rw: number, rh: number, rr: number) => {
      ctx.beginPath();
      ctx.moveTo(rx + rr, ry);
      ctx.lineTo(rx + rw - rr, ry);
      ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rr);
      ctx.lineTo(rx + rw, ry + rh - rr);
      ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rr, ry + rh);
      ctx.lineTo(rx + rr, ry + rh);
      ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rr);
      ctx.lineTo(rx, ry + rr);
      ctx.quadraticCurveTo(rx, ry, rx + rr, ry);
      ctx.closePath();
    };

    roundedRect(labelX, labelY, labelWidth, labelHeight, 4);
    ctx.fillStyle = collab.color + 'E6';
    ctx.fill();
    ctx.strokeStyle = collab.color;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(collab.name, labelX + 10, labelY + labelHeight / 2);

    ctx.beginPath();
    ctx.moveTo(x, cursorTop + labelHeight + 2);
    ctx.lineTo(x - 5, cursorTop + labelHeight + 8);
    ctx.lineTo(x + 5, cursorTop + labelHeight + 8);
    ctx.closePath();
    ctx.fillStyle = collab.color + 'E6';
    ctx.fill();

    ctx.restore();
  }, [selectedStaff]);

  const drawHoverPreview = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!hoverInfo || draggingNote) return;
    const x = hoverInfo.x;
    const y = hoverInfo.y;

    ctx.save();
    ctx.globalAlpha = 0.45;

    const durationMap: Record<string, number> = {
      whole: 4, half: 2, quarter: 1, eighth: 0.5, sixteenth: 0.25
    };
    const previewNote: Note = {
      id: 'preview',
      pitch: hoverInfo.pitch,
      octave: hoverInfo.octave,
      duration: durationMap[selectedTool] || 1,
      position: hoverInfo.position,
      staff: selectedStaff
    };
    drawNote(ctx, previewNote, false, false);

    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = currentUser.color + '90';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, STAFF_TOP_TREBLE - 40);
    ctx.lineTo(x, STAFF_TOP_BASS + 4 * STAFF_LINE_SPACING + 60);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }, [hoverInfo, draggingNote, selectedTool, selectedStaff, currentUser.color, drawNote]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.width * dpr;
    canvas.height = canvasSize.height * dpr;
    canvas.style.width = `${canvasSize.width}px`;
    canvas.style.height = `${canvasSize.height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    const startX = CANVAS_PADDING_LEFT;
    const endX = CANVAS_PADDING_LEFT + totalBeats * BEAT_WIDTH;

    drawStaff(ctx, STAFF_TOP_TREBLE, startX, endX);
    drawStaff(ctx, STAFF_TOP_BASS, startX, endX);

    drawClef(ctx, CANVAS_PADDING_LEFT - 50, STAFF_TOP_TREBLE + 20, 'treble');
    drawClef(ctx, CANVAS_PADDING_LEFT - 50, STAFF_TOP_BASS + 20, 'bass');

    drawTimeSignature(ctx, CANVAS_PADDING_LEFT - 10, STAFF_TOP_TREBLE + 20,
      score.timeSignature.numerator, score.timeSignature.denominator);
    drawTimeSignature(ctx, CANVAS_PADDING_LEFT - 10, STAFF_TOP_BASS + 20,
      score.timeSignature.numerator, score.timeSignature.denominator);

    drawBarLines(ctx, score.timeSignature.numerator, startX, endX, STAFF_TOP_TREBLE);
    drawBarLines(ctx, score.timeSignature.numerator, startX, endX, STAFF_TOP_BASS);

    drawPlaybackCursor(ctx, currentPlayPosition, canvasSize.height);

    score.notes.forEach(note => {
      const isHighlighted = note.id === highlightedNoteId;
      const isSelected = note.id === selectedNoteId;
      const isDragging = draggingNote?.noteId === note.id;
      if (!isDragging) {
        drawNote(ctx, note, isHighlighted, isSelected);
      }
    });

    if (draggingNote) {
      const note = score.notes.find(n => n.id === draggingNote.noteId);
      if (note) {
        ctx.save();
        ctx.globalAlpha = 0.75;
        const deltaX = (hoverInfo?.x ?? 0) - draggingNote.startX;
        const deltaY = (hoverInfo?.y ?? 0) - draggingNote.startY;
        const newPosition = Math.max(0, Math.round((draggingNote.origPosition * BEAT_WIDTH + deltaX) / BEAT_WIDTH * 2) / 2);
        const pitchResult = getPitchFromY(draggingNote.startY + deltaY, note.staff);
        const draggedNote: Note = {
          ...note,
          position: newPosition,
          pitch: pitchResult.pitch,
          octave: pitchResult.octave
        };
        drawNote(ctx, draggedNote, false, true);
        ctx.restore();
      }
    }

    collaborators.forEach(c => drawCollaboratorCursor(ctx, c));
    drawHoverPreview(ctx);

  }, [
    score, canvasSize, totalBeats, hoverInfo, draggingNote, selectedNoteId,
    highlightedNoteId, currentPlayPosition, collaborators, selectedStaff, currentUser,
    drawStaff, drawClef, drawTimeSignature, drawBarLines, drawNote,
    drawPlaybackCursor, drawCollaboratorCursor, drawHoverPreview, getPitchFromY
  ]);

  const getCanvasCoords = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);

  const getInfoFromCoords = useCallback((x: number, y: number) => {
    const position = Math.max(0, Math.round((x - CANVAS_PADDING_LEFT) / BEAT_WIDTH * 2) / 2);
    const staff: 'treble' | 'bass' = y < (STAFF_TOP_TREBLE + STAFF_TOP_BASS) / 2 + 40 ? 'treble' : 'bass';
    const { pitch, octave } = getPitchFromY(y, staff);
    return { position, pitch, octave, staff };
  }, [getPitchFromY]);

  const findNoteAtPosition = useCallback((x: number, y: number): Note | null => {
    for (const note of score.notes) {
      const noteX = CANVAS_PADDING_LEFT + note.position * BEAT_WIDTH;
      const noteY = getPitchY(note.pitch, note.octave, note.staff);
      if (Math.abs(x - noteX) < 14 && Math.abs(y - noteY) < 12) {
        return note;
      }
    }
    return null;
  }, [score.notes, getPitchY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const { x, y } = getCanvasCoords(e);
    const info = getInfoFromCoords(x, y);
    setHoverInfo({ ...info, x, y });

    if (onCursorUpdate && !draggingNote) {
      if (Math.abs(info.position - lastCursorSentRef.current) > 0.25) {
        lastCursorSentRef.current = info.position;
        onCursorUpdate(info.position);
      }
    }

    if (draggingNote) {
      e.preventDefault();
    }
  }, [getCanvasCoords, getInfoFromCoords, draggingNote, onCursorUpdate]);

  const handleMouseLeave = useCallback(() => {
    setHoverInfo(null);
    if (onCursorUpdate) {
      onCursorUpdate(null);
      lastCursorSentRef.current = -1;
    }
  }, [onCursorUpdate]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const { x, y } = getCanvasCoords(e);
    const clickedNote = findNoteAtPosition(x, y);

    if (clickedNote) {
      setSelectedNoteId(clickedNote.id);
      setDraggingNote({
        noteId: clickedNote.id,
        startX: x,
        startY: y,
        origPosition: clickedNote.position,
        origPitch: clickedNote.pitch,
        origOctave: clickedNote.octave
      });
    } else {
      setSelectedNoteId(null);
    }
  }, [getCanvasCoords, findNoteAtPosition]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    const { x, y } = getCanvasCoords(e);

    if (draggingNote) {
      const note = score.notes.find(n => n.id === draggingNote.noteId);
      if (note) {
        const deltaX = x - draggingNote.startX;
        const deltaY = y - draggingNote.startY;
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
          const newPosition = Math.max(0, Math.round((draggingNote.origPosition * BEAT_WIDTH + deltaX) / BEAT_WIDTH * 2) / 2);
          const pitchResult = getPitchFromY(draggingNote.startY + deltaY, note.staff);
          if (newPosition !== draggingNote.origPosition || pitchResult.pitch !== draggingNote.origPitch || pitchResult.octave !== draggingNote.origOctave) {
            const newMidiPitch = pitchResult.octave * 12 + pitchResult.pitch;
            onMoveNote(draggingNote.noteId, newPosition, newMidiPitch);
          }
        }
      }
      setDraggingNote(null);
    } else {
      const info = getInfoFromCoords(x, y);
      const clickedNote = findNoteAtPosition(x, y);
      if (!clickedNote) {
        onAddNote(info.pitch, info.octave, info.position);
      }
    }
  }, [getCanvasCoords, draggingNote, score.notes, getInfoFromCoords, findNoteAtPosition, getPitchFromY, onAddNote, onMoveNote]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const { x, y } = getCanvasCoords(e);
    const clickedNote = findNoteAtPosition(x, y);
    if (clickedNote) {
      onDeleteNote(clickedNote.id);
      if (selectedNoteId === clickedNote.id) {
        setSelectedNoteId(null);
      }
    }
  }, [getCanvasCoords, findNoteAtPosition, onDeleteNote, selectedNoteId]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNoteId) {
      onDeleteNote(selectedNoteId);
      setSelectedNoteId(null);
    }
  }, [selectedNoteId, onDeleteNote]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        padding: 20,
        backgroundColor: '#ffffff',
        outline: 'none'
      }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          cursor: draggingNote ? 'grabbing' : 'crosshair',
          userSelect: 'none'
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
      />
      <div style={{
        marginTop: 20,
        padding: '12px 16px',
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        fontSize: 13,
        color: '#666',
        borderLeft: '3px solid #4a9eff'
      }}>
        <strong>操作提示：</strong>
        <span style={{ marginLeft: 12 }}>
          左键单击空白处添加音符 · 左键拖动音符移动位置 · 右键单击或按 Delete 删除音符
        </span>
        {hoverInfo && (
          <span style={{ marginLeft: 16, color: '#4a9eff', fontWeight: 500 }}>
            | 位置: {hoverInfo.position} · 音高: {PITCH_NAMES[hoverInfo.pitch]}{hoverInfo.octave}
          </span>
        )}
        {collaborators.length > 0 && (
          <span style={{
            marginLeft: 16,
            padding: '2px 8px',
            backgroundColor: 'rgba(76, 205, 196, 0.12)',
            borderRadius: 4,
            color: '#4ECDC4',
            fontWeight: 500,
            fontSize: 12
          }}>
            👥 {collaborators.length} 人正在协作
          </span>
        )}
      </div>
    </div>
  );
};

export default Editor;
