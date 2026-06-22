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

const PADDING_LEFT = 100;
const PADDING_RIGHT = 80;
const LINE_SPACING = 10;
const TREBLE_TOP = 120;
const BASS_TOP = 260;
const BEAT_WIDTH = 70;
const MIN_BEATS = 32;
const NOTE_HEAD_RX = 7;
const NOTE_HEAD_RY = 5;
const NOTE_ROTATION = -0.3;

const TREBLE_BASE_MIDI = 67;
const BASS_BASE_MIDI = 50;

const PITCH_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const COLLAB_COLOR_POOL = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
];

const DURATION_MAP: Record<string, number> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  sixteenth: 0.25
};

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
    staff: 'treble' | 'bass';
    x: number;
    y: number;
  } | null>(null);

  const [dragging, setDragging] = useState<{
    noteId: string;
    startX: number;
    startY: number;
    origPosition: number;
    origPitch: number;
    origOctave: number;
    origStaff: 'treble' | 'bass';
  } | null>(null);

  const [canvasSize, setCanvasSize] = useState({ width: 1400, height: 480 });
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const lastSentPositionRef = useRef<number>(-999);
  const animFrameRef = useRef<number | null>(null);
  const highlightAnimRef = useRef(0);

  const totalBeats = useMemo(() => {
    if (score.notes.length === 0) return MIN_BEATS;
    const maxEnd = Math.max(...score.notes.map(n => n.position + n.duration));
    return Math.max(MIN_BEATS, Math.ceil(maxEnd) + 4);
  }, [score.notes]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({
          width: Math.max(1400, PADDING_LEFT + totalBeats * BEAT_WIDTH + PADDING_RIGHT),
          height: Math.max(480, Math.floor(rect.height) - 20)
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [totalBeats]);

  useEffect(() => {
    let start = performance.now();
    const loop = (now: number) => {
      highlightAnimRef.current = (Math.sin((now - start) / 180) + 1) / 2;
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const getStaffTop = (staff: 'treble' | 'bass'): number => {
    return staff === 'treble' ? TREBLE_TOP : BASS_TOP;
  };

  const getBaseMIDI = (staff: 'treble' | 'bass'): number => {
    return staff === 'treble' ? TREBLE_BASE_MIDI : BASS_BASE_MIDI;
  };

  const midiToY = useCallback((midi: number, staff: 'treble' | 'bass'): number => {
    const staffTop = getStaffTop(staff);
    const baseMIDI = getBaseMIDI(staff);
    const halfSteps = midi - baseMIDI;
    const staffPositions = halfSteps / 2;
    return staffTop + 4 * LINE_SPACING - staffPositions * (LINE_SPACING / 2);
  }, []);

  const yToMIDI = useCallback((y: number, staff: 'treble' | 'bass'): number => {
    const staffTop = getStaffTop(staff);
    const baseMIDI = getBaseMIDI(staff);
    const staffPositions = (staffTop + 4 * LINE_SPACING - y) / (LINE_SPACING / 2);
    const halfSteps = Math.round(staffPositions * 2);
    return baseMIDI + halfSteps;
  }, []);

  const midiToPitchOctave = (midi: number): { pitch: number; octave: number } => {
    const m = ((midi % 12) + 12) % 12;
    return { pitch: m, octave: Math.floor(midi / 12) };
  };

  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  const drawStaffLines = useCallback((ctx: CanvasRenderingContext2D) => {
    const startX = PADDING_LEFT;
    const endX = PADDING_LEFT + totalBeats * BEAT_WIDTH;

    ctx.strokeStyle = '#d0d0d0';
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';

    for (let i = 0; i < 5; i++) {
      const yT = TREBLE_TOP + i * LINE_SPACING;
      ctx.beginPath();
      ctx.moveTo(startX, yT);
      ctx.lineTo(endX, yT);
      ctx.stroke();

      const yB = BASS_TOP + i * LINE_SPACING;
      ctx.beginPath();
      ctx.moveTo(startX, yB);
      ctx.lineTo(endX, yB);
      ctx.stroke();
    }
  }, [totalBeats]);

  const drawClefs = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#2a2a3e';

    ctx.font = '52px "Times New Roman", serif';
    ctx.fillText('𝄞', PADDING_LEFT - 55, TREBLE_TOP + 20);

    ctx.font = '42px "Times New Roman", serif';
    ctx.fillText('𝄢', PADDING_LEFT - 55, BASS_TOP + 20);
  }, []);

  const drawTimeSignatures = useCallback((ctx: CanvasRenderingContext2D) => {
    const { numerator, denominator } = score.timeSignature;
    ctx.font = 'bold 24px "Georgia", serif';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const x = PADDING_LEFT - 10;
    ctx.fillText(String(numerator), x, TREBLE_TOP + 8);
    ctx.fillText(String(denominator), x, TREBLE_TOP + 32);
    ctx.fillText(String(numerator), x, BASS_TOP + 8);
    ctx.fillText(String(denominator), x, BASS_TOP + 32);

    ctx.textAlign = 'left';
  }, [score.timeSignature]);

  const drawBarLines = useCallback((ctx: CanvasRenderingContext2D) => {
    const beatsPerBar = score.timeSignature.numerator;
    const totalWidth = totalBeats * BEAT_WIDTH;
    const bars = Math.ceil(totalWidth / (BEAT_WIDTH * beatsPerBar));

    ctx.strokeStyle = '#9a9aa8';
    ctx.lineWidth = 1;

    for (let i = 0; i <= bars; i++) {
      const x = PADDING_LEFT + i * BEAT_WIDTH * beatsPerBar;
      if (x > PADDING_LEFT + totalWidth) break;

      ctx.beginPath();
      ctx.moveTo(x, TREBLE_TOP);
      ctx.lineTo(x, TREBLE_TOP + 4 * LINE_SPACING);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, BASS_TOP);
      ctx.lineTo(x, BASS_TOP + 4 * LINE_SPACING);
      ctx.stroke();
    }
  }, [score.timeSignature.numerator, totalBeats]);

  const drawLedgerLines = useCallback((
    ctx: CanvasRenderingContext2D,
    noteCenterX: number,
    midiNote: number,
    staff: 'treble' | 'bass'
  ) => {
    const staffTop = getStaffTop(staff);
    const baseMIDI = getBaseMIDI(staff);
    const halfSteps = midiNote - baseMIDI;

    const topLineMIDI = baseMIDI + 8;
    const bottomLineMIDI = baseMIDI - 8;

    const ledgerHalf = 10;

    if (midiNote > topLineMIDI) {
      const stepsAbove = midiNote - topLineMIDI;
      const numLedgers = Math.floor(stepsAbove / 2);
      for (let i = 1; i <= numLedgers; i++) {
        const ledgerMIDI = topLineMIDI + i * 2;
        if (ledgerMIDI <= midiNote) {
          const y = midiToY(ledgerMIDI, staff);
          ctx.strokeStyle = '#888';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(noteCenterX - ledgerHalf, y);
          ctx.lineTo(noteCenterX + ledgerHalf, y);
          ctx.stroke();
        }
      }
    } else if (midiNote < bottomLineMIDI) {
      const stepsBelow = bottomLineMIDI - midiNote;
      const numLedgers = Math.floor(stepsBelow / 2);
      for (let i = 1; i <= numLedgers; i++) {
        const ledgerMIDI = bottomLineMIDI - i * 2;
        if (ledgerMIDI >= midiNote) {
          const y = midiToY(ledgerMIDI, staff);
          ctx.strokeStyle = '#888';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(noteCenterX - ledgerHalf, y);
          ctx.lineTo(noteCenterX + ledgerHalf, y);
          ctx.stroke();
        }
      }
    }
  }, [midiToY]);

  const drawNoteHead = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    duration: number,
    isHighlighted: boolean,
    isSelected: boolean,
    highlightPulse: number,
    isPreview: boolean = false
  ) => {
    ctx.save();

    if (isHighlighted) {
      const intensity = 0.5 + 0.5 * highlightPulse;
      ctx.shadowColor = `rgba(74, 158, 255, ${intensity})`;
      ctx.shadowBlur = 15;
    } else if (isSelected) {
      ctx.shadowColor = 'rgba(255, 200, 0, 0.7)';
      ctx.shadowBlur = 10;
    }

    ctx.translate(x, y);
    ctx.rotate(NOTE_ROTATION);

    const filled = duration < 2;

    if (isHighlighted) {
      const intensity = 0.6 + 0.4 * highlightPulse;
      ctx.fillStyle = `rgba(74, 158, 255, ${intensity})`;
    } else if (isSelected) {
      ctx.fillStyle = '#e6b800';
    } else if (isPreview) {
      ctx.fillStyle = 'rgba(74, 158, 255, 0.6)';
    } else {
      ctx.fillStyle = '#1a1a2e';
    }

    ctx.beginPath();
    ctx.ellipse(0, 0, NOTE_HEAD_RX, NOTE_HEAD_RY, 0, 0, Math.PI * 2);
    ctx.fill();

    if (!filled) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.ellipse(0, 0, NOTE_HEAD_RX - 2.5, NOTE_HEAD_RY - 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.restore();
  }, []);

  const drawSingleNote = useCallback((
    ctx: CanvasRenderingContext2D,
    note: Note,
    isHighlighted: boolean,
    isSelected: boolean,
    highlightPulse: number,
    isPreview: boolean = false
  ) => {
    const x = PADDING_LEFT + note.position * BEAT_WIDTH;
    const midiNote = note.octave * 12 + note.pitch;
    const y = midiToY(midiNote, note.staff);
    const staffTop = getStaffTop(note.staff);

    drawLedgerLines(ctx, x, midiNote, note.staff);

    drawNoteHead(ctx, x, y, note.duration, isHighlighted, isSelected, highlightPulse, isPreview);

    if (note.duration < 4) {
      const stemColor = isHighlighted
        ? `rgba(74, 158, 255, ${0.7 + 0.3 * highlightPulse})`
        : isSelected
          ? '#e6b800'
          : isPreview
            ? 'rgba(74, 158, 255, 0.6)'
            : '#1a1a2e';

      const stemUp = y > staffTop + 2 * LINE_SPACING;
      const stemX = stemUp ? x - NOTE_HEAD_RX : x + NOTE_HEAD_RX;
      const stemStartY = y;
      const stemLen = 35;
      const stemEndY = stemUp ? y - stemLen : y + stemLen;

      ctx.strokeStyle = stemColor;
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(stemX, stemStartY);
      ctx.lineTo(stemX, stemEndY);
      ctx.stroke();

      if (note.duration < 1) {
        const flagCount = note.duration <= 0.25 ? 2 : 1;
        const flagSpacing = 10;

        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        for (let f = 0; f < flagCount; f++) {
          const baseY = stemUp
            ? stemEndY + f * flagSpacing
            : stemEndY - f * flagSpacing;

          const c1x = stemX;
          const c1y = baseY;
          const c2x = stemX + (stemUp ? 14 : -14);
          const c2y = baseY + (stemUp ? 4 : -4);
          const c3x = stemX + (stemUp ? 8 : -8);
          const c3y = baseY + (stemUp ? 16 : -16);

          ctx.strokeStyle = stemColor;
          ctx.beginPath();
          ctx.moveTo(c1x, c1y);
          ctx.quadraticCurveTo(c2x, c2y, c3x, c3y);
          ctx.stroke();
        }
      }
    }
  }, [midiToY, drawLedgerLines, drawNoteHead]);

  const drawPlaybackIndicator = useCallback((ctx: CanvasRenderingContext2D, position: number, height: number) => {
    if (!isPlaying && position <= 0) return;

    const x = PADDING_LEFT + position * BEAT_WIDTH;

    const glowWidth = 36;
    const gradient = ctx.createLinearGradient(x - glowWidth, 0, x + glowWidth, 0);
    gradient.addColorStop(0, 'rgba(74, 158, 255, 0)');
    gradient.addColorStop(0.4, 'rgba(74, 158, 255, 0.12)');
    gradient.addColorStop(0.5, 'rgba(74, 158, 255, 0.22)');
    gradient.addColorStop(0.6, 'rgba(74, 158, 255, 0.12)');
    gradient.addColorStop(1, 'rgba(74, 158, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - glowWidth, 0, glowWidth * 2, height);

    ctx.strokeStyle = 'rgba(74, 158, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, 30);
    ctx.lineTo(x, height - 30);
    ctx.stroke();
  }, [isPlaying]);

  const drawCollaboratorCursorInternal = useCallback((ctx: CanvasRenderingContext2D, collab: Collaborator) => {
    if (collab.cursorPosition === null || collab.cursorPosition < 0) return;

    const x = PADDING_LEFT + collab.cursorPosition * BEAT_WIDTH;
    const cursorTop = TREBLE_TOP - 30;
    const cursorBottom = BASS_TOP + 4 * LINE_SPACING + 25;

    ctx.save();

    ctx.strokeStyle = collab.color;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.lineDashOffset = 0;
    ctx.beginPath();
    ctx.moveTo(x, cursorTop);
    ctx.lineTo(x, cursorBottom);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = 'bold 12px "Microsoft YaHei", "PingFang SC", sans-serif';
    const nameText = collab.name;
    const textMetrics = ctx.measureText(nameText);
    const labelPaddingH = 10;
    const labelPaddingV = 4;
    const labelWidth = Math.max(48, textMetrics.width + labelPaddingH * 2);
    const labelHeight = 22;
    const labelX = x + 4;
    const labelY = cursorTop;

    drawRoundedRect(ctx, labelX, labelY, labelWidth, labelHeight, 4);
    ctx.fillStyle = collab.color + 'E6';
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(nameText, labelX + labelPaddingH, labelY + labelHeight / 2);

    const arrowTipX = x;
    const arrowTipY = labelY + labelHeight + 1;
    const arrowSize = 5;
    ctx.beginPath();
    ctx.moveTo(arrowTipX, arrowTipY);
    ctx.lineTo(arrowTipX - arrowSize, arrowTipY + arrowSize);
    ctx.lineTo(arrowTipX + arrowSize, arrowTipY + arrowSize);
    ctx.closePath();
    ctx.fillStyle = collab.color + 'E6';
    ctx.fill();

    ctx.restore();
  }, []);

  const drawHoverPreviewInternal = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!hoverInfo || dragging) return;

    ctx.save();
    ctx.globalAlpha = 0.4;

    const previewDuration = DURATION_MAP[selectedTool] ?? 1;
    const previewNote: Note = {
      id: '__preview__',
      pitch: hoverInfo.pitch,
      octave: hoverInfo.octave,
      duration: previewDuration,
      position: hoverInfo.position,
      staff: hoverInfo.staff
    };
    drawSingleNote(ctx, previewNote, false, false, 0, true);

    ctx.globalAlpha = 0.6;
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = currentUser.color + '80';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(hoverInfo.x, TREBLE_TOP - 45);
    ctx.lineTo(hoverInfo.x, BASS_TOP + 4 * LINE_SPACING + 55);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }, [hoverInfo, dragging, selectedTool, currentUser.color, drawSingleNote]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.width * dpr;
    canvas.height = canvasSize.height * dpr;
    canvas.style.width = `${canvasSize.width}px`;
    canvas.style.height = `${canvasSize.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    drawStaffLines(ctx);
    drawClefs(ctx);
    drawTimeSignatures(ctx);
    drawBarLines(ctx);

    drawPlaybackIndicator(ctx, currentPlayPosition, canvasSize.height);

    for (const note of score.notes) {
      const isHighlighted = note.id === highlightedNoteId;
      const isSelected = note.id === selectedNoteId;
      const isDragging = dragging?.noteId === note.id;
      if (!isDragging) {
        drawSingleNote(ctx, note, isHighlighted, isSelected, highlightAnimRef.current);
      }
    }

    if (dragging && hoverInfo) {
      const note = score.notes.find(n => n.id === dragging.noteId);
      if (note) {
        ctx.save();
        ctx.globalAlpha = 0.7;

        const deltaX = hoverInfo.x - dragging.startX;
        const deltaY = hoverInfo.y - dragging.startY;

        const newPosPx = dragging.origPosition * BEAT_WIDTH + deltaX;
        const newPosition = Math.max(0, Math.round(newPosPx / BEAT_WIDTH * 2) / 2);

        const origMIDI = dragging.origOctave * 12 + dragging.origPitch;
        const origY = midiToY(origMIDI, dragging.origStaff);
        const newY = origY + deltaY;
        const newMIDI = yToMIDI(newY, dragging.origStaff);
        const { pitch: newPitch, octave: newOctave } = midiToPitchOctave(newMIDI);

        const draggedNote: Note = {
          ...note,
          position: newPosition,
          pitch: newPitch,
          octave: newOctave
        };
        drawSingleNote(ctx, draggedNote, false, true, highlightAnimRef.current);
        ctx.restore();
      }
    }

    for (const c of collaborators) {
      drawCollaboratorCursorInternal(ctx, c);
    }

    drawHoverPreviewInternal(ctx);
  }, [
    canvasSize,
    drawStaffLines,
    drawClefs,
    drawTimeSignatures,
    drawBarLines,
    drawPlaybackIndicator,
    drawSingleNote,
    drawCollaboratorCursorInternal,
    drawHoverPreviewInternal,
    score.notes,
    highlightedNoteId,
    selectedNoteId,
    dragging,
    hoverInfo,
    currentPlayPosition,
    collaborators,
    midiToY,
    yToMIDI
  ]);

  useEffect(() => {
    let rafId: number;
    const loop = () => {
      render();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [render]);

  const getCanvasXY = useCallback((e: React.MouseEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width) / (window.devicePixelRatio || 1),
      y: (e.clientY - rect.top) * (canvas.height / rect.height) / (window.devicePixelRatio || 1)
    };
  }, []);

  const coordsToInfo = useCallback((x: number, y: number) => {
    const rawPosition = (x - PADDING_LEFT) / BEAT_WIDTH;
    const snappedPosition = Math.max(0, Math.round(rawPosition * 2) / 2);

    const staffDivideY = (TREBLE_TOP + BASS_TOP) / 2 + 2 * LINE_SPACING;
    const staff: 'treble' | 'bass' = y < staffDivideY ? 'treble' : 'bass';

    const midi = yToMIDI(y, staff);
    const { pitch, octave } = midiToPitchOctave(midi);

    return { position: snappedPosition, pitch, octave, staff };
  }, [yToMIDI]);

  const findNoteAt = useCallback((x: number, y: number): Note | null => {
    for (let i = score.notes.length - 1; i >= 0; i--) {
      const note = score.notes[i];
      const noteX = PADDING_LEFT + note.position * BEAT_WIDTH;
      const midiNote = note.octave * 12 + note.pitch;
      const noteY = midiToY(midiNote, note.staff);
      const dx = x - noteX;
      const dy = y - noteY;
      const distSq = dx * dx + dy * dy;
      if (distSq <= 260) {
        return note;
      }
    }
    return null;
  }, [score.notes, midiToY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const { x, y } = getCanvasXY(e);
    const info = coordsToInfo(x, y);
    setHoverInfo({ ...info, x, y });

    if (onCursorUpdate && !dragging) {
      if (Math.abs(info.position - lastSentPositionRef.current) > 0.25) {
        lastSentPositionRef.current = info.position;
        onCursorUpdate(info.position);
      }
    }
  }, [getCanvasXY, coordsToInfo, onCursorUpdate, dragging]);

  const handleMouseLeave = useCallback(() => {
    setHoverInfo(null);
    if (onCursorUpdate) {
      lastSentPositionRef.current = -999;
      onCursorUpdate(null);
    }
  }, [onCursorUpdate]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;

    const { x, y } = getCanvasXY(e);
    const hitNote = findNoteAt(x, y);

    if (hitNote) {
      setSelectedNoteId(hitNote.id);
      setDragging({
        noteId: hitNote.id,
        startX: x,
        startY: y,
        origPosition: hitNote.position,
        origPitch: hitNote.pitch,
        origOctave: hitNote.octave,
        origStaff: hitNote.staff
      });
    } else {
      setSelectedNoteId(null);
    }
  }, [getCanvasXY, findNoteAt]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;

    const { x, y } = getCanvasXY(e);

    if (dragging) {
      const note = score.notes.find(n => n.id === dragging.noteId);
      if (note) {
        const deltaX = x - dragging.startX;
        const deltaY = y - dragging.startY;
        const moved = Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5;

        if (moved) {
          const newPosPx = dragging.origPosition * BEAT_WIDTH + deltaX;
          const newPosition = Math.max(0, Math.round(newPosPx / BEAT_WIDTH * 2) / 2);

          const origMIDI = dragging.origOctave * 12 + dragging.origPitch;
          const origY = midiToY(origMIDI, dragging.origStaff);
          const newY = origY + deltaY;
          const newMIDI = yToMIDI(newY, dragging.origStaff);

          const posChanged = newPosition !== dragging.origPosition;
          const pitchChanged = newMIDI !== origMIDI;

          if (posChanged || pitchChanged) {
            onMoveNote(dragging.noteId, newPosition, newMIDI);
          }
        }
      }
      setDragging(null);
    } else {
      const hitNote = findNoteAt(x, y);
      if (!hitNote) {
        const info = coordsToInfo(x, y);
        const effectiveStaff = selectedStaff;
        const midi = yToMIDI(y, effectiveStaff);
        const { pitch, octave } = midiToPitchOctave(midi);
        onAddNote(pitch, octave, info.position);
      }
    }
  }, [
    getCanvasXY,
    findNoteAt,
    coordsToInfo,
    dragging,
    score.notes,
    midiToY,
    yToMIDI,
    onAddNote,
    onMoveNote,
    selectedStaff
  ]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const { x, y } = getCanvasXY(e);
    const hitNote = findNoteAt(x, y);
    if (hitNote) {
      onDeleteNote(hitNote.id);
      if (selectedNoteId === hitNote.id) {
        setSelectedNoteId(null);
      }
    }
  }, [getCanvasXY, findNoteAt, onDeleteNote, selectedNoteId]);

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
        outline: 'none',
        boxSizing: 'border-box'
      }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          cursor: dragging ? 'grabbing' : 'crosshair',
          userSelect: 'none',
          WebkitUserSelect: 'none'
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
        color: '#555',
        borderLeft: '3px solid #4a9eff'
      }}>
        <strong style={{ color: '#333' }}>操作提示：</strong>
        <span style={{ marginLeft: 10 }}>
          左键单击空白处添加音符 · 左键拖动音符移动位置/音高 · 右键单击或按 Delete 删除
        </span>
        {hoverInfo && (
          <span style={{
            marginLeft: 14,
            color: '#4a9eff',
            fontWeight: 600,
            fontFamily: 'monospace'
          }}>
            | 位置: {hoverInfo.position.toFixed(1)} · 音高: {PITCH_NAMES[hoverInfo.pitch]}{hoverInfo.octave} · {hoverInfo.staff === 'treble' ? '高音谱' : '低音谱'}
          </span>
        )}
        {collaborators.length > 0 && (
          <span style={{
            marginLeft: 14,
            padding: '3px 10px',
            backgroundColor: 'rgba(76, 205, 196, 0.12)',
            borderRadius: 5,
            color: '#2fa89f',
            fontWeight: 600,
            fontSize: 12
          }}>
            👥 {collaborators.length} 人协作中
          </span>
        )}
      </div>
    </div>
  );
};

export default Editor;
