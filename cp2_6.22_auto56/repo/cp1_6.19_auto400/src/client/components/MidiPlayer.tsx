import React, { useEffect, useRef, useCallback } from 'react';
import { Chord } from '../types';

interface MidiPlayerProps {
  chordSequence: Chord[][];
  bpm: number;
  isPlaying: boolean;
  currentMeasure: number;
  onMeasureChange: (measure: number) => void;
  onStop: () => void;
}

const NOTE_VALUES: Record<string, number> = {
  'C': 60, 'C#': 61, 'Db': 61, 'D': 62, 'D#': 63, 'Eb': 63,
  'E': 64, 'F': 65, 'F#': 66, 'Gb': 66, 'G': 67, 'G#': 68,
  'Ab': 68, 'A': 69, 'A#': 70, 'Bb': 70, 'B': 71
};

function parseChord(chordName: string): number[] {
  const match = chordName.match(/^([A-G][#b]?)(m|maj|min|dim|aug)?(7|9|11|13|sus2|sus4)?$/);
  if (!match) return [60, 64, 67];
  
  const root = match[1] || 'C';
  const quality = match[2] || '';
  const suffix = match[3] || '';
  
  const rootValue = NOTE_VALUES[root] || 60;
  const intervals: number[] = [0];
  
  if (quality === 'm' || quality === 'min') {
    intervals.push(3, 7);
  } else if (quality === 'dim') {
    intervals.push(3, 6);
  } else if (quality === 'aug') {
    intervals.push(4, 8);
  } else {
    intervals.push(4, 7);
  }
  
  if (suffix === '7') {
    intervals.push(quality === 'maj' ? 11 : 10);
  } else if (suffix === '9') {
    intervals.push(10, 14);
  } else if (suffix === 'sus4') {
    intervals[1] = 5;
  } else if (suffix === 'sus2') {
    intervals[1] = 2;
  }
  
  return intervals.map(i => rootValue + i);
}

export const MidiPlayer: React.FC<MidiPlayerProps> = ({
  chordSequence,
  bpm,
  isPlaying,
  currentMeasure,
  onMeasureChange,
  onStop
}) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeOscillatorsRef = useRef<OscillatorNode[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const beatDurationRef = useRef<number>(0);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const playNote = useCallback((frequency: number, startTime: number, duration: number) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
    
    activeOscillatorsRef.current.push(oscillator);
    
    oscillator.onended = () => {
      const index = activeOscillatorsRef.current.indexOf(oscillator);
      if (index > -1) {
        activeOscillatorsRef.current.splice(index, 1);
      }
    };
  }, []);

  const midiToFrequency = (midi: number): number => {
    return 440 * Math.pow(2, (midi - 69) / 12);
  };

  const playChord = useCallback((chordName: string, startTime: number, beatDuration: number) => {
    const notes = parseChord(chordName);
    const arpeggioDelay = beatDuration * 0.15;
    
    notes.forEach((midiNote, index) => {
      const noteStartTime = startTime + index * arpeggioDelay;
      const frequency = midiToFrequency(midiNote);
      const duration = beatDuration * 2 - index * arpeggioDelay * 0.5;
      playNote(frequency, noteStartTime, duration);
    });
  }, [playNote]);

  const stopAll = useCallback(() => {
    activeOscillatorsRef.current.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // ignore
      }
    });
    activeOscillatorsRef.current = [];
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      const ctx = initAudioContext();
      beatDurationRef.current = 60 / bpm;
      startTimeRef.current = ctx.currentTime + 0.1;
      
      const flatChords: { chord: string; measure: number; time: number }[] = [];
      let currentTime = 0;
      
      chordSequence.forEach((measure, measureIndex) => {
        if (measure.length === 0) {
          flatChords.push({ chord: '', measure: measureIndex, time: currentTime });
          currentTime += beatDurationRef.current * 4;
        } else {
          measure.forEach(chord => {
            flatChords.push({
              chord: chord.name,
              measure: measureIndex,
              time: currentTime
            });
            currentTime += beatDurationRef.current * 2;
          });
        }
      });

      if (flatChords.length === 0) {
        onStop();
        return;
      }

      const totalDuration = currentTime;

      flatChords.forEach(({ chord, measure, time }) => {
        if (chord) {
          playChord(chord, startTimeRef.current + time, beatDurationRef.current);
        }
      });

      const updateProgress = () => {
        const elapsed = ctx.currentTime - startTimeRef.current;
        const progress = elapsed / totalDuration;
        
        if (progress >= 1) {
          onStop();
          return;
        }

        const currentTimeInPlayback = elapsed;
        let cumulativeTime = 0;
        let foundMeasure = 0;
        
        for (let i = 0; i < chordSequence.length; i++) {
          const measure = chordSequence[i];
          const measureDuration = measure.length === 0
            ? beatDurationRef.current * 4
            : measure.length * beatDurationRef.current * 2;
          
          if (currentTimeInPlayback < cumulativeTime + measureDuration) {
            foundMeasure = i;
            break;
          }
          cumulativeTime += measureDuration;
          foundMeasure = i;
        }
        
        onMeasureChange(foundMeasure);
        
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      };

      animationFrameRef.current = requestAnimationFrame(updateProgress);
      
      return () => {
        stopAll();
      };
    } else {
      stopAll();
    }
  }, [isPlaying, chordSequence, bpm, initAudioContext, playChord, onMeasureChange, onStop, stopAll]);

  return null;
};

export default MidiPlayer;
