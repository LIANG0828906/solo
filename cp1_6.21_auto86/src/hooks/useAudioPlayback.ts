import { useCallback, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { generateTimeline } from '../utils/rhythmCalculator';
import { getNoteFrequency } from '../utils/chordParser';
import type { Chord, Note } from '../utils/chordParser';

export const useAudioPlayback = () => {
  const {
    chordSequence,
    selectedPattern,
    isPlaying,
    tempo,
    totalBeats,
    setIsPlaying,
    setCurrentTime,
    setActiveNotes,
  } = useStore();

  const audioContextRef = useRef<AudioContext | null>(null);
  const activeOscillatorsRef = useRef<Map<string, { osc: OscillatorNode; gain: GainNode }>>(new Map());
  const animationFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const lastChordIdRef = useRef<string | null>(null);

  const playNote = useCallback((note: Note, startTime: number, duration: number) => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const frequency = getNoteFrequency(note);
    const noteId = `${note.string}-${note.fret}`;

    if (activeOscillatorsRef.current.has(noteId)) {
      const { osc, gain } = activeOscillatorsRef.current.get(noteId)!;
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.stop(ctx.currentTime + 0.1);
      activeOscillatorsRef.current.delete(noteId);
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filterNode = ctx.createBiquadFilter();

    oscillator.type = 'triangle';
    oscillator.frequency.value = frequency;

    filterNode.type = 'lowpass';
    filterNode.frequency.value = 2000;
    filterNode.Q.value = 1;

    oscillator.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(ctx.destination);

    const volume = 0.15;
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gainNode.gain.setValueAtTime(volume, startTime + duration - 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.05);

    activeOscillatorsRef.current.set(noteId, { osc: oscillator, gain: gainNode });

    oscillator.onended = () => {
      activeOscillatorsRef.current.delete(noteId);
    };
  }, []);

  const playChord = useCallback((chord: Chord, startTime: number, duration: number) => {
    chord.notes.forEach((note, index) => {
      const noteDelay = index * 0.02;
      playNote(note, startTime + noteDelay, duration);
    });
  }, [playNote]);

  const stopAllNotes = useCallback(() => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    activeOscillatorsRef.current.forEach(({ osc, gain }) => {
      try {
        gain.gain.cancelScheduledValues(ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.stop(ctx.currentTime + 0.1);
      } catch (e) {
        // Ignore errors from already stopped oscillators
      }
    });
    activeOscillatorsRef.current.clear();
    lastChordIdRef.current = null;
  }, []);

  const startPlayback = useCallback(() => {
    if (chordSequence.length === 0) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    const ctx = audioContextRef.current;
    const beatDuration = 60 / tempo;
    const timeline = generateTimeline(chordSequence, selectedPattern, totalBeats);
    const totalDuration = totalBeats * beatDuration;

    startTimeRef.current = ctx.currentTime;
    setIsPlaying(true);
    lastChordIdRef.current = null;

    timeline.forEach((block) => {
      if (block.chordId) {
        const chord = chordSequence.find((c) => c.id === block.chordId);
        if (chord) {
          const startTime = block.startTime * beatDuration;
          const duration = block.duration * beatDuration * 0.9;
          playChord(chord, startTimeRef.current + startTime, duration);
        }
      }
    });

    const updatePlayback = () => {
      if (!audioContextRef.current) return;

      const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
      const currentBeat = (elapsed / beatDuration) % totalBeats;
      setCurrentTime(currentBeat);

      const currentBlock = timeline.find(
        (block) =>
          currentBeat >= block.startTime &&
          currentBeat < block.startTime + block.duration
      );

      if (currentBlock?.chordId && currentBlock.chordId !== lastChordIdRef.current) {
        const chord = chordSequence.find((c) => c.id === currentBlock.chordId);
        if (chord) {
          setActiveNotes(chord.notes);
          lastChordIdRef.current = currentBlock.chordId;
        }
      } else if (!currentBlock?.chordId && lastChordIdRef.current !== null) {
        setActiveNotes([]);
        lastChordIdRef.current = null;
      }

      if (elapsed < totalDuration) {
        animationFrameRef.current = requestAnimationFrame(updatePlayback);
      } else {
        startTimeRef.current = ctx.currentTime;
        timeline.forEach((block) => {
          if (block.chordId) {
            const chord = chordSequence.find((c) => c.id === block.chordId);
            if (chord) {
              const startTime = block.startTime * beatDuration;
              const duration = block.duration * beatDuration * 0.9;
              playChord(chord, startTimeRef.current + startTime, duration);
            }
          }
        });
        animationFrameRef.current = requestAnimationFrame(updatePlayback);
      }
    };

    animationFrameRef.current = requestAnimationFrame(updatePlayback);
  }, [chordSequence, selectedPattern, tempo, totalBeats, setIsPlaying, setCurrentTime, setActiveNotes, playChord]);

  const stopPlayback = useCallback(() => {
    stopAllNotes();
    setIsPlaying(false);
    setCurrentTime(0);
    setActiveNotes([]);
    cancelAnimationFrame(animationFrameRef.current);
  }, [stopAllNotes, setIsPlaying, setCurrentTime, setActiveNotes]);

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }, [isPlaying, startPlayback, stopPlayback]);

  useEffect(() => {
    return () => {
      stopAllNotes();
      cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopAllNotes]);

  return {
    startPlayback,
    stopPlayback,
    togglePlayback,
    isPlaying,
  };
};
