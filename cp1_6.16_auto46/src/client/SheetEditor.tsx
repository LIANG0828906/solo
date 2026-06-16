import React, { useEffect, useRef, useState, useCallback } from 'react';
import Vex from 'vexflow';
import { v4 as uuidv4 } from 'uuid';
import type { Note, Annotation, SheetMusic, User, PitchClass, NoteDuration } from '../types';
import { PITCH_CLASSES, NOTE_DURATIONS } from '../types';
import { sheetDB } from './db';

const { Factory, StaveNote, Voice, Accidental } = Vex.Flow;

interface SheetEditorProps {
  sheet: SheetMusic;
  currentUser: User | null;
  ws: WebSocket | null;
  onAnnotationsChange: (annotations: Annotation[]) => void;
  highlightedMeasure: number | null;
  onJumpToMeasure: (measure: number) => void;
}

const SheetEditor: React.FC<SheetEditorProps> = ({
  sheet,
  currentUser,
  ws,
  onAnnotationsChange,
  highlightedMeasure,
  onJumpToMeasure,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewMode, setViewMode] = useState<'staff' | 'jianpu'>('staff');
  const [notes, setNotes] = useState<Note[]>(sheet.notes);
  const [annotations, setAnnotations] = useState<Annotation[]>(sheet.annotations);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [editPitch, setEditPitch] = useState<PitchClass>('C');
  const [editOctave, setEditOctave] = useState(4);
  const [editDuration, setEditDuration] = useState<NoteDuration>('q');
  const [annotationContent, setAnnotationContent] = useState('');
  const [annotationType, setAnnotationType] = useState<Annotation['type']>('comment');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayNoteIndex, setCurrentPlayNoteIndex] = useState(-1);
  const [showVisualizer, setShowVisualizer] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getFrequency = useCallback((pitch: PitchClass, octave: number): number => {
    const pitchIndex = PITCH_CLASSES.indexOf(pitch);
    const noteNumber = octave * 12 + pitchIndex;
    return 440 * Math.pow(2, (noteNumber - 69) / 12);
  }, []);

  const getDurationMs = useCallback((duration: NoteDuration): number => {
    const baseMs = 500;
    switch (duration) {
      case 'w': return baseMs * 4;
      case 'h': return baseMs * 2;
      case 'q': return baseMs;
      case '8': return baseMs / 2;
      case '16': return baseMs / 4;
      default: return baseMs;
    }
  }, []);

  const playNote = useCallback((note: Note, startTime: number): number => {
    if (!audioContextRef.current) return 0;

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const frequency = getFrequency(note.pitch as PitchClass, note.octave);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, startTime);

    const durationMs = getDurationMs(note.duration as NoteDuration);
    const durationSec = durationMs / 1000;

    gainNode.gain.setValueAtTime(0.3, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + durationSec);

    oscillator.connect(gainNode);
    if (analyserRef.current) {
      gainNode.connect(analyserRef.current);
    }
    gainNode.connect(ctx.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + durationSec);

    return durationMs;
  }, [getFrequency, getDurationMs]);

  const playAllNotes = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
    }

    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    setIsPlaying(true);
    let currentTime = ctx.currentTime + 0.1;
    let totalDelay = 100;

    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      if (!note) continue;

      setCurrentPlayNoteIndex(i);
      const duration = playNote(note, currentTime);
      currentTime += duration / 1000;

      await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), totalDelay);
      });
      totalDelay = duration;
    }

    setTimeout(() => {
      setIsPlaying(false);
      setCurrentPlayNoteIndex(-1);
    }, totalDelay);
  }, [notes, playNote]);

  const stopPlaying = useCallback(() => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsPlaying(false);
    setCurrentPlayNoteIndex(-1);
  }, []);

  useEffect(() => {
    if (!showVisualizer || !canvasRef.current || !analyserRef.current) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#FF8C00');
      gradient.addColorStop(1, '#32CD32');

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const dataValue = dataArray[i];
        const barHeight = ((dataValue ?? 0) / 255) * canvas.height;
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }

      analyser.getByteTimeDomainData(dataArray);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(74, 55, 40, 0.6)';
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const dataValue = dataArray[i];
        const v = (dataValue ?? 0) / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [showVisualizer, isPlaying]);

  const autoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(async () => {
      const updatedSheet: SheetMusic = {
        ...sheet,
        notes,
        annotations,
        updatedAt: Date.now(),
      };
      await sheetDB.saveSheet(updatedSheet);
    }, 500);
  }, [sheet, notes, annotations]);

  useEffect(() => {
    autoSave();
  }, [notes, annotations, autoSave]);

  useEffect(() => {
    onAnnotationsChange(annotations);
  }, [annotations, onAnnotationsChange]);

  const broadcastUpdate = useCallback((type: string, payload: unknown) => {
    if (ws && ws.readyState === WebSocket.OPEN && currentUser) {
      ws.send(JSON.stringify({
        type,
        userId: currentUser.id,
        userName: currentUser.nickname,
        userColor: currentUser.color,
        payload,
        timestamp: Date.now(),
      }));
    }
  }, [ws, currentUser]);

  useEffect(() => {
    if (!containerRef.current || notes.length === 0) return;

    const container = containerRef.current;
    container.innerHTML = '';

    if (viewMode === 'jianpu') {
      renderJianpu(container);
      return;
    }

    const factory = new Factory({
      renderer: { elementId: container.id, width: 900, height: 250 },
    });

    const system = factory.System();

    const notesPerMeasure = 4;
    const measures: Note[][] = [];

    for (let i = 0; i < notes.length; i += notesPerMeasure) {
      measures.push(notes.slice(i, i + notesPerMeasure));
    }

    measures.forEach((measureNotes, measureIndex) => {
      const staveNotes = measureNotes.map((note, noteIndex) => {
        const absoluteIndex = measureIndex * notesPerMeasure + noteIndex;
        const isPlaying = currentPlayNoteIndex === absoluteIndex;
        const hasAnnotation = annotations.some(a => a.noteId === note.id);
        const isHighlightedMeasure = highlightedMeasure === measureIndex + 1;

        const vexNote = new StaveNote({
          keys: [`${note.pitch.toLowerCase()}/${note.octave}`],
          duration: note.duration,
        });

        if (note.pitch.includes('#')) {
          vexNote.addModifier(new Accidental('#'), 0);
        }

        const svgNote = container.querySelector(`[id*="note-${absoluteIndex}"]`);
        if (svgNote) {
          if (isPlaying) {
            (svgNote as SVGElement).style.fill = '#FFD700';
          }
          if (isHighlightedMeasure) {
            (svgNote as SVGElement).style.stroke = '#FFD700';
            (svgNote as SVGElement).style.strokeWidth = '2';
          }
          if (hasAnnotation) {
            const ann = annotations.find(a => a.noteId === note.id);
            if (ann) {
              (svgNote as SVGElement).style.fill = ann.userColor;
            }
          }
        }

        return vexNote;
      });

      const voice = new Voice({ num_beats: 4, beat_value: 4 });
      voice.addTickables(staveNotes);

      const staveOptions = {
        voices: [voice],
        width: 180,
      } as unknown as Parameters<typeof system.addStave>[0];
      const stave = system.addStave(staveOptions);

      if (measureIndex === 0) {
        stave.addClef('treble').addTimeSignature('4/4');
      }
      stave.setEndBarType(measureIndex === measures.length - 1 ? 3 : 1);
    });

    factory.draw();

    const svg = container.querySelector('svg');
    if (svg) {
      svg.style.background = 'transparent';
    }

    notes.forEach((note, index) => {
      const noteElements = container.querySelectorAll('.vf-note');
      const noteElement = noteElements[index] as SVGElement | null;
      if (noteElement) {
        noteElement.setAttribute('data-note-id', note.id);
        noteElement.style.cursor = 'pointer';
        noteElement.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedNote(note);
          setEditPitch(note.pitch as PitchClass);
          setEditOctave(note.octave);
          setEditDuration(note.duration as NoteDuration);
          setShowEditModal(true);
        });
        noteElement.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          setSelectedNote(note);
          setShowAnnotationModal(true);
        });
      }
    });
  }, [notes, annotations, viewMode, currentPlayNoteIndex, highlightedMeasure]);

  const renderJianpu = (container: HTMLDivElement) => {
    const jianpuMap: Record<string, string> = {
      'C': '1', 'C#': '#1', 'D': '2', 'D#': '#2', 'E': '3',
      'F': '4', 'F#': '#4', 'G': '5', 'G#': '#5', 'A': '6', 'A#': '#6', 'B': '7',
    };

    const html = `
      <div style="padding: 20px; background: #FFF8EC; border: 1px solid #4A3728; border-radius: 8px;">
        <div style="display: flex; flex-wrap: wrap; gap: 20px; align-items: center;">
          ${notes.map((note, index) => {
            const octaveMark = note.octave > 4 ? '·'.repeat(note.octave - 4) : '';
            const lowOctaveMark = note.octave < 4 ? '·'.repeat(4 - note.octave) : '';
            const durationUnderline = note.duration === '8' ? '<u>' : note.duration === '16' ? '<u><u>' : '';
            const durationUnderlineClose = note.duration === '8' ? '</u>' : note.duration === '16' ? '</u></u>' : '';
            const isPlaying = currentPlayNoteIndex === index;
            const hasAnnotation = annotations.some(a => a.noteId === note.id);
            const ann = annotations.find(a => a.noteId === note.id);
            
            return `
              <div data-note-id="${note.id}" 
                   style="position: relative; cursor: pointer; padding: 10px; 
                          ${isPlaying ? 'background: rgba(255, 215, 0, 0.5);' : ''}
                          ${hasAnnotation && ann ? `border-left: 3px solid ${ann.userColor};` : ''}
                          border-radius: 4px; transition: all 0.2s;"
                   onclick="window.dispatchEvent(new CustomEvent('jianpu-note-click', { detail: '${note.id}' }))"
                   oncontextmenu="event.preventDefault(); window.dispatchEvent(new CustomEvent('jianpu-note-context', { detail: '${note.id}' }))">
                <div style="font-size: 32px; font-weight: bold; color: #4A3728; text-align: center;">
                  ${durationUnderline}${jianpuMap[note.pitch] || note.pitch}${durationUnderlineClose}
                </div>
                <div style="font-size: 12px; text-align: center; color: #8B7355;">
                  ${lowOctaveMark}${octaveMark || '&nbsp;'}
                </div>
                <div style="font-size: 10px; text-align: center; color: #8B7355; margin-top: 4px;">
                  ${note.duration === 'w' ? '全' : note.duration === 'h' ? '二分' : note.duration === 'q' ? '四分' : note.duration === '8' ? '八分' : '十六分'}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    container.innerHTML = html;

    const handleNoteClick = (e: CustomEvent) => {
      const noteId = e.detail as string;
      const note = notes.find(n => n.id === noteId);
      if (note) {
        setSelectedNote(note);
        setEditPitch(note.pitch as PitchClass);
        setEditOctave(note.octave);
        setEditDuration(note.duration as NoteDuration);
        setShowEditModal(true);
      }
    };

    const handleNoteContext = (e: CustomEvent) => {
      const noteId = e.detail as string;
      const note = notes.find(n => n.id === noteId);
      if (note) {
        setSelectedNote(note);
        setShowAnnotationModal(true);
      }
    };

    window.addEventListener('jianpu-note-click', handleNoteClick as EventListener);
    window.addEventListener('jianpu-note-context', handleNoteContext as EventListener);
  };

  const handleSaveNote = () => {
    if (!selectedNote) return;

    const updatedNotes = notes.map(note =>
      note.id === selectedNote.id
        ? { ...note, pitch: editPitch, octave: editOctave, duration: editDuration }
        : note
    );

    setNotes(updatedNotes);
    broadcastUpdate('note_update', { noteId: selectedNote.id, pitch: editPitch, octave: editOctave, duration: editDuration });
    setShowEditModal(false);
    setSelectedNote(null);
  };

  const handleAddAnnotation = () => {
    if (!selectedNote || !currentUser || !annotationContent.trim()) return;

    const newAnnotation: Annotation = {
      id: uuidv4(),
      noteId: selectedNote.id,
      userId: currentUser.id,
      userName: currentUser.nickname,
      userColor: currentUser.color,
      content: annotationContent.trim(),
      type: annotationType,
      timestamp: Date.now(),
      measure: Math.floor(notes.indexOf(selectedNote) / 4) + 1,
    };

    setAnnotations([...annotations, newAnnotation]);
    broadcastUpdate('annotation_add', newAnnotation);
    sheetDB.saveAnnotation(sheet.id, newAnnotation);
    setShowAnnotationModal(false);
    setAnnotationContent('');
    setSelectedNote(null);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || notes.length === 0) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    const noteIndex = Math.floor(ratio * notes.length);
    const clampedIndex = Math.max(0, Math.min(notes.length - 1, noteIndex));

    if (isPlaying) {
      stopPlaying();
    }
    setCurrentPlayNoteIndex(clampedIndex);
    onJumpToMeasure(Math.floor(clampedIndex / 4) + 1);
  };

  const addNewNote = () => {
    const newNote: Note = {
      id: uuidv4(),
      pitch: 'C',
      duration: 'q',
      octave: 4,
      measure: Math.floor(notes.length / 4) + 1,
      position: notes.length % 4,
    };
    setNotes([...notes, newNote]);
    broadcastUpdate('note_update', { action: 'add', note: newNote });
  };

  const deleteSelectedNote = () => {
    if (!selectedNote) return;
    setNotes(notes.filter(n => n.id !== selectedNote.id));
    setAnnotations(annotations.filter(a => a.noteId !== selectedNote.id));
    broadcastUpdate('note_update', { action: 'delete', noteId: selectedNote.id });
    setShowEditModal(false);
    setSelectedNote(null);
  };

  interface SheetEditorStyles {
    container: React.CSSProperties;
    toolbar: React.CSSProperties;
    title: React.CSSProperties;
    button: React.CSSProperties;
    buttonSecondary: React.CSSProperties;
    buttonActive: React.CSSProperties;
    sheetContainer: React.CSSProperties;
    visualizerContainer: React.CSSProperties;
    visualizerCanvas: React.CSSProperties;
    modalOverlay: React.CSSProperties;
    modal: React.CSSProperties;
    modalTitle: React.CSSProperties;
    formGroup: React.CSSProperties;
    label: React.CSSProperties;
    select: React.CSSProperties;
    input: React.CSSProperties;
    textarea: React.CSSProperties;
    modalButtons: React.CSSProperties;
    dangerButton: React.CSSProperties;
    annotationMarkers: React.CSSProperties;
    annotationMarker: React.CSSProperties;
    hint: React.CSSProperties;
  }

  const styles: SheetEditorStyles = {
    container: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      padding: '20px',
      overflowY: 'auto',
      background: `
        linear-gradient(135deg, rgba(245, 240, 230, 0.95) 0%, rgba(255, 248, 236, 0.9) 50%, rgba(245, 240, 230, 0.95) 100%),
        repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(74, 55, 40, 0.03) 50px, rgba(74, 55, 40, 0.03) 51px),
        repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(74, 55, 40, 0.02) 50px, rgba(74, 55, 40, 0.02) 51px)
      `,
    },
    toolbar: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '20px',
      padding: '12px 16px',
      backgroundColor: 'rgba(74, 55, 40, 0.1)',
      borderRadius: '8px',
      border: '1px solid rgba(74, 55, 40, 0.2)',
    },
    title: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#4A3728',
      marginRight: 'auto',
    },
    button: {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '6px',
      backgroundColor: '#4A3728',
      color: '#F5F0E6',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'all 0.2s ease',
    },
    buttonSecondary: {
      padding: '8px 16px',
      border: '1px solid #4A3728',
      borderRadius: '6px',
      backgroundColor: 'transparent',
      color: '#4A3728',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'all 0.2s ease',
    },
    buttonActive: {
      backgroundColor: '#FFD700',
      color: '#4A3728',
    },
    sheetContainer: {
      flex: 1,
      minHeight: '300px',
      backgroundColor: '#FFF8EC',
      border: '2px solid #4A3728',
      borderRadius: '12px',
      padding: '20px',
      overflow: 'auto',
      boxShadow: '0 4px 12px rgba(74, 55, 40, 0.15)',
    },
    visualizerContainer: {
      marginTop: '20px',
      padding: '16px',
      backgroundColor: 'rgba(74, 55, 40, 0.05)',
      borderRadius: '8px',
      border: '1px solid rgba(74, 55, 40, 0.2)',
    },
    visualizerCanvas: {
      width: '100%',
      height: '100px',
      borderRadius: '6px',
      backgroundColor: '#FFF8EC',
      cursor: 'pointer',
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(74, 55, 40, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modal: {
      backgroundColor: '#FFF8EC',
      border: '2px solid #4A3728',
      borderRadius: '12px',
      padding: '24px',
      minWidth: '350px',
      boxShadow: '0 8px 24px rgba(74, 55, 40, 0.3)',
    },
    modalTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#4A3728',
      marginBottom: '20px',
    },
    formGroup: {
      marginBottom: '16px',
    },
    label: {
      display: 'block',
      fontSize: '14px',
      color: '#4A3728',
      marginBottom: '8px',
      fontWeight: '500',
    },
    select: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #4A3728',
      borderRadius: '6px',
      backgroundColor: '#F5F0E6',
      color: '#4A3728',
      fontSize: '14px',
    },
    input: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #4A3728',
      borderRadius: '6px',
      backgroundColor: '#F5F0E6',
      color: '#4A3728',
      fontSize: '14px',
      boxSizing: 'border-box',
    },
    textarea: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #4A3728',
      borderRadius: '6px',
      backgroundColor: '#F5F0E6',
      color: '#4A3728',
      fontSize: '14px',
      minHeight: '80px',
      resize: 'vertical',
      boxSizing: 'border-box',
    },
    modalButtons: {
      display: 'flex',
      gap: '12px',
      marginTop: '20px',
      justifyContent: 'flex-end',
    },
    dangerButton: {
      padding: '8px 16px',
      border: '1px solid #C62828',
      borderRadius: '6px',
      backgroundColor: 'transparent',
      color: '#C62828',
      cursor: 'pointer',
      fontSize: '14px',
      marginRight: 'auto',
    },
    annotationMarkers: {
      marginTop: '12px',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
    },
    annotationMarker: {
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      cursor: 'pointer',
      border: '1px solid transparent',
    },
    hint: {
      fontSize: '12px',
      color: '#8B7355',
      marginTop: '8px',
      fontStyle: 'italic',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <span style={styles.title}>🎵 {sheet.name}</span>
        <button
          style={{
            ...styles.buttonSecondary,
            ...(viewMode === 'staff' ? styles.buttonActive : {}),
          }}
          onClick={() => setViewMode('staff')}
        >
          五线谱
        </button>
        <button
          style={{
            ...styles.buttonSecondary,
            ...(viewMode === 'jianpu' ? styles.buttonActive : {}),
          }}
          onClick={() => setViewMode('jianpu')}
        >
          简谱
        </button>
        <button style={styles.buttonSecondary} onClick={addNewNote}>
          ➕ 添加音符
        </button>
        <button
          style={{ ...styles.button, ...(isPlaying ? { backgroundColor: '#C62828' } : {}) }}
          onClick={isPlaying ? stopPlaying : playAllNotes}
        >
          {isPlaying ? '⏹ 停止' : '▶ 播放'}
        </button>
        <button
          style={{
            ...styles.buttonSecondary,
            ...(showVisualizer ? styles.buttonActive : {}),
          }}
          onClick={() => setShowVisualizer(!showVisualizer)}
        >
          📊 可视化
        </button>
      </div>

      <div style={styles.sheetContainer}>
        <div id="sheet-container" ref={containerRef} style={{ minHeight: '200px' }}></div>

        {annotations.length > 0 && (
          <div style={styles.annotationMarkers}>
            {annotations.map((ann) => (
              <span
                key={ann.id}
                style={{
                  ...styles.annotationMarker,
                  backgroundColor: `${ann.userColor}20`,
                  borderColor: ann.userColor,
                  color: ann.userColor,
                }}
                onClick={() => {
                  const noteIndex = notes.findIndex(n => n.id === ann.noteId);
                  if (noteIndex >= 0) {
                    setCurrentPlayNoteIndex(noteIndex);
                    onJumpToMeasure(ann.measure);
                  }
                }}
              >
                {ann.type === 'highlight' ? '⭐' : ann.type === 'dynamic' ? '🎵' : ann.type === 'error' ? '⚠️' : '💬'}
                {' '}第{ann.measure}小节 - {ann.userName}
              </span>
            ))}
          </div>
        )}

        <div style={styles.hint}>
          💡 提示：点击音符编辑音高和时值，右键点击音符添加批注
        </div>
      </div>

      {showVisualizer && (
        <div style={styles.visualizerContainer}>
          <canvas
            ref={canvasRef}
            width={800}
            height={100}
            style={styles.visualizerCanvas}
            onClick={handleCanvasClick}
          />
          <div style={{ fontSize: '12px', color: '#8B7355', marginTop: '8px', textAlign: 'center' }}>
            🖱️ 点击波形可跳转播放位置
          </div>
        </div>
      )}

      {showEditModal && selectedNote && (
        <div style={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>编辑音符</h3>

            <div style={styles.formGroup}>
              <label style={styles.label}>音高</label>
              <select
                style={styles.select}
                value={editPitch}
                onChange={(e) => setEditPitch(e.target.value as PitchClass)}
              >
                {PITCH_CLASSES.map((pitch) => (
                  <option key={pitch} value={pitch}>{pitch}</option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>八度</label>
              <select
                style={styles.select}
                value={editOctave}
                onChange={(e) => setEditOctave(Number(e.target.value))}
              >
                {[2, 3, 4, 5, 6].map((oct) => (
                  <option key={oct} value={oct}>{oct}</option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>时值</label>
              <select
                style={styles.select}
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value as NoteDuration)}
              >
                {NOTE_DURATIONS.map((dur) => (
                  <option key={dur} value={dur}>
                    {dur === 'w' ? '全音符' : dur === 'h' ? '二分音符' : dur === 'q' ? '四分音符' : dur === '8' ? '八分音符' : '十六分音符'}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.modalButtons}>
              <button style={styles.dangerButton} onClick={deleteSelectedNote}>
                🗑️ 删除
              </button>
              <button style={styles.buttonSecondary} onClick={() => setShowEditModal(false)}>
                取消
              </button>
              <button style={styles.button} onClick={handleSaveNote}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {showAnnotationModal && selectedNote && (
        <div style={styles.modalOverlay} onClick={() => setShowAnnotationModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>添加批注</h3>

            <div style={styles.formGroup}>
              <label style={styles.label}>批注类型</label>
              <select
                style={styles.select}
                value={annotationType}
                onChange={(e) => setAnnotationType(e.target.value as Annotation['type'])}
              >
                <option value="comment">💬 普通批注</option>
                <option value="highlight">⭐ 高潮段标记</option>
                <option value="dynamic">🎵 强弱记号</option>
                <option value="error">⚠️ 错误提醒</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>批注内容</label>
              <textarea
                style={styles.textarea}
                value={annotationContent}
                onChange={(e) => setAnnotationContent(e.target.value)}
                placeholder="输入批注内容..."
              />
            </div>

            <div style={styles.modalButtons}>
              <button style={styles.buttonSecondary} onClick={() => setShowAnnotationModal(false)}>
                取消
              </button>
              <button style={styles.button} onClick={handleAddAnnotation} disabled={!annotationContent.trim()}>
                添加批注
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SheetEditor;
