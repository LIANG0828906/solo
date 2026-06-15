import { useState, useRef, useEffect, useCallback } from 'react';
import { Player } from '../Player';
import type { NoteInfo, InstrumentType, PlayState, PlayerState } from '../types';

export function useScorePlayer() {
  const playerRef = useRef<Player | null>(null);
  const notesRef = useRef<NoteInfo[]>([]);
  
  const [playerState, setPlayerState] = useState<PlayerState>({
    playState: 'stopped',
    currentMeasure: 0,
    currentNoteIndex: -1,
    bpm: 120,
    instrument: 'piano'
  });
  
  const [highlightedNote, setHighlightedNote] = useState<NoteInfo | null>(null);
  const highlightTimerRef = useRef<number | null>(null);

  useEffect(() => {
    playerRef.current = new Player();
    return () => {
      if (playerRef.current) {
        playerRef.current.stop();
      }
      if (highlightTimerRef.current) {
        window.clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

  const handleNoteClick = useCallback(async (note: NoteInfo) => {
    if (!playerRef.current) return;
    
    if (highlightTimerRef.current) {
      window.clearTimeout(highlightTimerRef.current);
    }
    
    setHighlightedNote(note);
    
    highlightTimerRef.current = window.setTimeout(() => {
      setHighlightedNote(null);
      highlightTimerRef.current = null;
    }, 500);
    
    await playerRef.current.playNote(note.pitch, note.duration);
  }, []);

  const togglePlay = useCallback(async () => {
    if (!playerRef.current || notesRef.current.length === 0) return;

    const currentPlayState = playerRef.current.getPlayState();
    
    if (currentPlayState) {
      playerRef.current.pause();
      setPlayerState(prev => ({ ...prev, playState: 'paused' }));
    } else {
      const currentIndex = playerRef.current.getCurrentNoteIndex();
      if (currentIndex >= notesRef.current.length) {
        playerRef.current.resetPosition();
      }
      
      setPlayerState(prev => ({ ...prev, playState: 'playing' }));
      
      await playerRef.current.playSequence(notesRef.current, (noteIndex, measure) => {
        if (noteIndex === -1) {
          setPlayerState(prev => ({
            ...prev,
            playState: 'stopped',
            currentMeasure: 0,
            currentNoteIndex: -1
          }));
        } else {
          setPlayerState(prev => ({
            ...prev,
            currentMeasure: measure,
            currentNoteIndex: noteIndex
          }));
        }
      });
    }
  }, []);

  const setInstrument = useCallback((instrument: InstrumentType) => {
    if (!playerRef.current) return;
    playerRef.current.setInstrument(instrument);
    setPlayerState(prev => ({ ...prev, instrument }));
  }, []);

  const setBpm = useCallback((bpm: number) => {
    if (!playerRef.current) return;
    playerRef.current.setBpm(bpm);
    setPlayerState(prev => ({ ...prev, bpm }));
  }, []);

  const setNotes = useCallback((notes: NoteInfo[]) => {
    notesRef.current = notes;
    if (playerRef.current) {
      playerRef.current.stop();
      playerRef.current.resetPosition();
    }
    setPlayerState(prev => ({
      ...prev,
      playState: 'stopped',
      currentMeasure: 0,
      currentNoteIndex: -1
    }));
  }, []);

  const stop = useCallback(() => {
    if (!playerRef.current) return;
    playerRef.current.stop();
    setPlayerState(prev => ({
      ...prev,
      playState: 'stopped',
      currentMeasure: 0,
      currentNoteIndex: -1
    }));
  }, []);

  return {
    playerState,
    handleNoteClick,
    togglePlay,
    setInstrument,
    setBpm,
    setNotes,
    stop,
    highlightedNote,
    currentMeasure: playerState.currentMeasure,
    currentNoteIndex: playerState.currentNoteIndex,
    playState: playerState.playState as PlayState
  };
}
