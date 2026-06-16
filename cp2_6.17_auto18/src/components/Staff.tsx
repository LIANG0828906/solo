import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useStore } from '../store';
import { Note } from '../utils/audio';

const Staff: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const stateRef = useRef({
    staffNotes: [] as Note[],
    isPlaying: false,
    playProgress: 0,
    isEditMode: false,
    beatWidth: 42,
  });

  const [draggingNote, setDraggingNote] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const updateNote = useStore(state => state.updateNote);
  const deleteNote = useStore(state => state.deleteNote);

  const staffNotes = useStore(state => state.staffNotes);
  const isPlaying = useStore(state => state.isPlaying);
  const playProgress = useStore(state => state.playProgress);
  const isEditMode = useStore(state => state.isEditMode);
  const beatWidth = useStore(state => state.beatWidth);

  useEffect(() => {
    stateRef.current.staffNotes = staffNotes;
    stateRef.current.isPlaying = isPlaying;
    stateRef.current.playProgress = playProgress;
    stateRef.current.isEditMode = isEditMode;
    stateRef.current.beatWidth = beatWidth;
  }, [staffNotes, isPlaying, playProgress, isEditMode, beatWidth]);

  const CANVAS_WIDTH = 700;
  const CANVAS_HEIGHT = 200;
  const LINE_SPACING = 10;
  const STAFF_TOP = 60;
  const NOTE_HEAD_RADIUS = 3;
  const STEM_HEIGHT = LINE_SPACING * 3.5;

  const PITCH_POSITIONS: Record<string, number> = {};
  const allNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5'];
  allNotes.forEach((note, i) => {
    PITCH_POSITIONS[note] = STAFF_TOP + LINE_SPACING * 7 - i * (LINE_SPACING / 2);
  });

  const sharpNotes = ['C#4', 'D#4', 'F#4', 'G#4', 'A#4', 'C#5', 'D#5', 'F#5', 'G#5', 'A#5'];
  sharpNotes.forEach(note => {
    const baseNote = note.replace('#', '');
    PITCH_POSITIONS[note] = PITCH_POSITIONS[baseNote];
  });

  const getPitchFromY = useCallback((y: number): string => {
    let closestNote = 'C4';
    let closestDist = Infinity;

    for (const [note, pos] of Object.entries(PITCH_POSITIONS)) {
      if (note.includes('#')) continue;
      const dist = Math.abs(y - pos);
      if (dist < closestDist) {
        closestDist = dist;
        closestNote = note;
      }
    }

    return closestNote;
  }, []);

  const drawStaff = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;

    for (let i = 0; i < 5; i++) {
      const y = STAFF_TOP + i * LINE_SPACING;
      ctx.beginPath();
      ctx.moveTo(30, y);
      ctx.lineTo(CANVAS_WIDTH - 20, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, STAFF_TOP);
    ctx.lineTo(30, STAFF_TOP + LINE_SPACING * 4);
    ctx.stroke();

    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px Roboto, sans-serif';
    ctx.fillText('高音谱号', 35, STAFF_TOP - 10);
  };

  const drawNote = (
    ctx: CanvasRenderingContext2D,
    note: Note,
    beatWidth: number,
    isHighlighted: boolean = false,
    isEditing: boolean = false
  ) => {
    const x = 50 + note.time * beatWidth * 4;
    const y = PITCH_POSITIONS[note.pitch] || STAFF_TOP + LINE_SPACING * 3.5;

    const isSharp = note.pitch.includes('#');
    const noteHeadX = x;
    const noteHeadY = y;

    ctx.save();

    if (isHighlighted) {
      ctx.fillStyle = '#C0392B';
      ctx.shadowColor = '#E74C3C';
      ctx.shadowBlur = 8;
    } else {
      ctx.fillStyle = '#2C3E50';
    }

    ctx.beginPath();
    ctx.ellipse(noteHeadX, noteHeadY, NOTE_HEAD_RADIUS * 1.3, NOTE_HEAD_RADIUS, -0.3, 0, Math.PI * 2);
    ctx.fill();

    if (isSharp) {
      ctx.fillStyle = isHighlighted ? '#C0392B' : '#2C3E50';
      ctx.font = 'bold 10px Roboto, sans-serif';
      ctx.fillText('#', noteHeadX - 12, noteHeadY + 3);
    }

    ctx.strokeStyle = isHighlighted ? '#C0392B' : '#2C3E50';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(noteHeadX + NOTE_HEAD_RADIUS, noteHeadY);
    ctx.lineTo(noteHeadX + NOTE_HEAD_RADIUS, noteHeadY - STEM_HEIGHT);
    ctx.stroke();

    if (isEditing) {
      ctx.strokeStyle = 'rgba(52, 152, 219, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(noteHeadX, noteHeadY, NOTE_HEAD_RADIUS + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  };

  const drawPlayhead = (ctx: CanvasRenderingContext2D, progress: number, notes: Note[], beatWidth: number) => {
    if (notes.length === 0) return;

    const maxTime = Math.max(...notes.map(n => n.time + n.duration));
    const x = 50 + progress * maxTime * beatWidth * 4;

    ctx.save();
    ctx.strokeStyle = 'rgba(231, 76, 60, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x, STAFF_TOP - 20);
    ctx.lineTo(x, STAFF_TOP + LINE_SPACING * 4 + 20);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(231, 76, 60, 0.9)';
    ctx.beginPath();
    ctx.moveTo(x, STAFF_TOP - 20);
    ctx.lineTo(x - 6, STAFF_TOP - 30);
    ctx.lineTo(x + 6, STAFF_TOP - 30);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  useEffect(() => {
    console.log('Staff useEffect - animation setup');
    const canvas = canvasRef.current;
    console.log('Staff canvas ref:', canvas);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    console.log('Staff ctx:', ctx);
    if (!ctx) return;

    let frameCount = 0;

    let lastFrameTime = 0;
    const targetFPS = 30;
    const frameInterval = 1000 / targetFPS;

    const render = (timestamp: number) => {
      frameCount++;
      if (frameCount <= 3) {
        console.log('Staff render frame:', frameCount, 'timestamp:', timestamp);
      }

      if (timestamp - lastFrameTime >= frameInterval) {
        const { staffNotes, isPlaying, playProgress, isEditMode, beatWidth } = stateRef.current;

        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#FEFEFE';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        drawStaff(ctx);

        const highlightTime = isPlaying
          ? (() => {
              const maxTime = Math.max(...staffNotes.map(n => n.time + n.duration));
              return playProgress * maxTime;
            })()
          : -1;

        const highlightWindow = 0.2;

        staffNotes.forEach(note => {
          const isHighlighted = isPlaying &&
            note.time <= highlightTime + highlightWindow &&
            note.time + note.duration >= highlightTime - highlightWindow;
          drawNote(ctx, note, beatWidth, isHighlighted, isEditMode);
        });

        if (isPlaying) {
          drawPlayhead(ctx, playProgress, staffNotes, beatWidth);
        }

        lastFrameTime = timestamp;
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      console.log('Staff useEffect cleanup - cancel animation');
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const getNoteAtPosition = useCallback((x: number, y: number): Note | null => {
    const { staffNotes, beatWidth } = stateRef.current;
    for (let i = staffNotes.length - 1; i >= 0; i--) {
      const note = staffNotes[i];
      const noteX = 50 + note.time * beatWidth * 4;
      const noteY = PITCH_POSITIONS[note.pitch] || STAFF_TOP + LINE_SPACING * 3.5;

      if (Math.abs(x - noteX) < 12 && Math.abs(y - noteY) < 12) {
        return note;
      }
    }
    return null;
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEditMode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const note = getNoteAtPosition(x, y);
    if (note) {
      setDraggingNote(note.id);
      setDragOffset({
        x: x - (50 + note.time * beatWidth * 4),
        y: y - (PITCH_POSITIONS[note.pitch] || STAFF_TOP + LINE_SPACING * 3.5),
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEditMode || !draggingNote) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX - dragOffset.x;
    const y = (e.clientY - rect.top) * scaleY - dragOffset.y;

    const newTime = Math.max(0, (x - 50) / (beatWidth * 4));
    const snappedTime = Math.round(newTime * 4) / 4;
    const newPitch = getPitchFromY(y);

    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = parseInt(newPitch.slice(-1));
    const noteName = newPitch.slice(0, -1);
    const midi = (octave + 1) * 12 + noteNames.indexOf(noteName);

    updateNote(draggingNote, {
      time: snappedTime,
      pitch: newPitch,
      midi,
    });
  };

  const handleMouseUp = () => {
    setDraggingNote(null);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEditMode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const note = getNoteAtPosition(x, y);
    if (note) {
      deleteNote(note.id);
    }
  };

  return (
    <div
      className="staff-container"
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        padding: '20px 0',
      }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        style={{
          maxWidth: '100%',
          height: 'auto',
          border: '1px solid #DDD',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          cursor: isEditMode ? 'pointer' : 'default',
        }}
      />
    </div>
  );
};

export default Staff;
