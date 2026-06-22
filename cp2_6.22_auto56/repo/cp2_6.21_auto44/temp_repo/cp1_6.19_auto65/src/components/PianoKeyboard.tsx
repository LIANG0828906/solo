import React, { useState, useRef, useCallback, useEffect } from 'react';

interface PianoKeyboardProps {
  onNotePlay: (pitch: number) => void;
}

interface KeyConfig {
  pitch: number;
  label: string;
  type: 'white' | 'black';
  whiteIndex?: number;
  offset?: number;
}

const WHITE_KEY_WIDTH = 50;
const WHITE_KEY_GAP = 2;

const KEYS: KeyConfig[] = [
  { pitch: 60, label: 'C4', type: 'white' },
  { pitch: 61, label: 'C#4', type: 'black', whiteIndex: 0, offset: 35 },
  { pitch: 62, label: 'D4', type: 'white' },
  { pitch: 63, label: 'D#4', type: 'black', whiteIndex: 1, offset: 87 },
  { pitch: 64, label: 'E4', type: 'white' },
  { pitch: 65, label: 'F4', type: 'white' },
  { pitch: 66, label: 'F#4', type: 'black', whiteIndex: 3, offset: 191 },
  { pitch: 67, label: 'G4', type: 'white' },
  { pitch: 68, label: 'G#4', type: 'black', whiteIndex: 4, offset: 243 },
  { pitch: 69, label: 'A4', type: 'white' },
  { pitch: 70, label: 'A#4', type: 'black', whiteIndex: 5, offset: 295 },
  { pitch: 71, label: 'B4', type: 'white' },
  { pitch: 72, label: 'C5', type: 'white' },
  { pitch: 73, label: 'C#5', type: 'black', whiteIndex: 7, offset: 399 },
  { pitch: 74, label: 'D5', type: 'white' },
  { pitch: 75, label: 'D#5', type: 'black', whiteIndex: 8, offset: 451 },
  { pitch: 76, label: 'E5', type: 'white' },
  { pitch: 77, label: 'F5', type: 'white' },
  { pitch: 78, label: 'F#5', type: 'black', whiteIndex: 10, offset: 555 },
  { pitch: 79, label: 'G5', type: 'white' },
  { pitch: 80, label: 'G#5', type: 'black', whiteIndex: 11, offset: 607 },
  { pitch: 81, label: 'A5', type: 'white' },
  { pitch: 82, label: 'A#5', type: 'black', whiteIndex: 12, offset: 659 },
  { pitch: 83, label: 'B5', type: 'white' },
];

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const PianoKeyboard: React.FC<PianoKeyboardProps> = ({ onNotePlay }) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [activeKeys, setActiveKeys] = useState<Set<number>>(new Set());

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const playNote = useCallback((pitch: number) => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const duration = 0.3;
    const fadeIn = 0.02;
    const fadeOut = 0.1;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(midiToFreq(pitch), now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + fadeIn);
    gain.gain.setValueAtTime(0.3, now + duration - fadeOut);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }, [getAudioContext]);

  const handleKeyClick = useCallback((pitch: number) => {
    playNote(pitch);
    onNotePlay(pitch);

    setActiveKeys(prev => {
      const next = new Set(prev);
      next.add(pitch);
      return next;
    });

    window.setTimeout(() => {
      setActiveKeys(prev => {
        const next = new Set(prev);
        next.delete(pitch);
        return next;
      });
    }, 150);
  }, [playNote, onNotePlay]);

  useEffect(() => {
    const keyMap: Record<string, number> = {
      'a': 60, 'w': 61, 's': 62, 'e': 63, 'd': 64,
      'f': 65, 't': 66, 'g': 67, 'y': 68, 'h': 69,
      'u': 70, 'j': 71, 'k': 72, 'o': 73, 'l': 74,
      'p': 75, ';': 76,
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const pitch = keyMap[e.key.toLowerCase()];
      if (pitch !== undefined) {
        handleKeyClick(pitch);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyClick]);

  const whiteKeys = KEYS.filter(k => k.type === 'white');
  const blackKeys = KEYS.filter(k => k.type === 'black');

  const totalWidth = whiteKeys.length * (WHITE_KEY_WIDTH + WHITE_KEY_GAP) - WHITE_KEY_GAP;

  return (
    <div className="piano-keyboard">
      <div className="keyboard-container" style={{ width: totalWidth }}>
        {whiteKeys.map((key) => (
          <div
            key={key.pitch}
            className={`white-key ${activeKeys.has(key.pitch) ? 'active' : ''}`}
            onClick={() => handleKeyClick(key.pitch)}
          >
            <span className="white-key-label">{key.label}</span>
          </div>
        ))}
        {blackKeys.map((key) => (
          <div
            key={key.pitch}
            className={`black-key ${activeKeys.has(key.pitch) ? 'active' : ''}`}
            style={{ left: key.offset }}
            onClick={() => handleKeyClick(key.pitch)}
          />
        ))}
      </div>
    </div>
  );
};

export default PianoKeyboard;
