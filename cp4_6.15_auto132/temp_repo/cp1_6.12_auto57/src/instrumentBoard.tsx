import React, { useState, useEffect, useRef, useCallback } from 'react';
import { audioEngine, noteToFrequency, type InstrumentType, type DrumType } from './audioEngine';
import { recorder, type RecordedNote } from './recorder';
import './instrumentBoard.css';

interface PianoKey {
  note: string;
  isBlack: boolean;
  keyboardKey?: string;
}

interface DrumPad {
  type: DrumType;
  name: string;
  color: string;
  key: string;
}

interface GuitarString {
  note: string;
  baseFreq: number;
  color: string;
}

const PIANO_KEYS: PianoKey[] = [];
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BLACK_KEYS = new Set(['C#', 'D#', 'F#', 'G#', 'A#']);

for (let octave = 1; octave <= 8; octave++) {
  for (let i = 0; i < 12; i++) {
    const noteName = NOTE_NAMES[i];
    const note = `${noteName}${octave}`;
    const isBlack = BLACK_KEYS.has(noteName);
    PIANO_KEYS.push({ note, isBlack });
    if (note === 'C8') break;
  }
}

const KEYBOARD_MAP: Record<string, string> = {
  'a': 'C4',
  'w': 'C#4',
  's': 'D4',
  'e': 'D#4',
  'd': 'E4',
  'f': 'F4',
  't': 'F#4',
  'g': 'G4',
  'y': 'G#4',
  'h': 'A4',
  'u': 'A#4',
  'j': 'B4',
  'k': 'C5',
  'l': 'D5'
};

PIANO_KEYS.forEach(key => {
  const kbKey = Object.entries(KEYBOARD_MAP).find(([, n]) => n === key.note)?.[0];
  if (kbKey) {
    key.keyboardKey = kbKey.toUpperCase();
  }
});

const DRUM_PADS: DrumPad[] = [
  { type: 'kick', name: '底鼓', color: '#e74c3c', key: '1' },
  { type: 'snare', name: '军鼓', color: '#3498db', key: '2' },
  { type: 'tom1', name: '嗵鼓1', color: '#2ecc71', key: '3' },
  { type: 'tom2', name: '嗵鼓2', color: '#e67e22', key: '4' },
  { type: 'hihat', name: '踩镲', color: '#f1c40f', key: '5' },
  { type: 'crash', name: '吊镲', color: '#9b59b6', key: '6' }
];

const GUITAR_STRINGS: GuitarString[] = [
  { note: 'E2', baseFreq: noteToFrequency('E2'), color: '#c0c0c0' },
  { note: 'A2', baseFreq: noteToFrequency('A2'), color: '#d4af37' },
  { note: 'D3', baseFreq: noteToFrequency('D3'), color: '#c0c0c0' },
  { note: 'G3', baseFreq: noteToFrequency('G3'), color: '#d4af37' },
  { note: 'B3', baseFreq: noteToFrequency('B3'), color: '#c0c0c0' },
  { note: 'E4', baseFreq: noteToFrequency('E4'), color: '#d4af37' }
];

const FRETS = 5;

const InstrumentBoard: React.FC = () => {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [activeDrums, setActiveDrums] = useState<Set<DrumType>>(new Set());
  const [activeGuitar, setActiveGuitar] = useState<Set<string>>(new Set());
  const [showTips, setShowTips] = useState(true);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number; pad: DrumType }[]>([]);
  const rippleIdRef = useRef(0);

  const playPianoKey = useCallback((note: string) => {
    audioEngine.playNote('piano', note);
    recorder.recordNote('piano', note);
    setActiveKeys(prev => new Set(prev).add(note));

    setTimeout(() => {
      setActiveKeys(prev => {
        const next = new Set(prev);
        next.delete(note);
        return next;
      });
    }, 150);
  }, []);

  const playDrumPad = useCallback((drumType: DrumType, event?: React.MouseEvent) => {
    audioEngine.playNote('drum', drumType);
    recorder.recordNote('drum', drumType);
    setActiveDrums(prev => new Set(prev).add(drumType));

    if (event) {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const id = rippleIdRef.current++;
      setRipples(prev => [...prev, { id, x, y, pad: drumType }]);
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id));
      }, 200);
    }

    setTimeout(() => {
      setActiveDrums(prev => {
        const next = new Set(prev);
        next.delete(drumType);
        return next;
      });
    }, 100);
  }, []);

  const playGuitarString = useCallback((stringIndex: number, fretIndex: number) => {
    const baseFreq = GUITAR_STRINGS[stringIndex].baseFreq;
    const freq = baseFreq * Math.pow(2, fretIndex / 12);

    const baseNote = GUITAR_STRINGS[stringIndex].note;
    const baseNoteName = baseNote.slice(0, -1);
    const baseOctave = parseInt(baseNote.slice(-1));
    const baseSemitone = NOTE_NAMES.indexOf(baseNoteName);
    const totalSemitones = baseSemitone + fretIndex;
    const noteName = NOTE_NAMES[totalSemitones % 12];
    const octave = baseOctave + Math.floor(totalSemitones / 12);
    const note = `${noteName}${octave}`;

    audioEngine.playNote('guitar', note, { stringIndex, fretIndex });
    recorder.recordNote('guitar', note, { stringIndex, fretIndex });

    const key = `${stringIndex}_${fretIndex}`;
    setActiveGuitar(prev => new Set(prev).add(key));
    setTimeout(() => {
      setActiveGuitar(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 150);
  }, []);

  const handleGuitarClick = useCallback((stringIndex: number, e: React.MouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const fretWidth = width / FRETS;
    const fretIndex = Math.min(Math.floor(x / fretWidth), FRETS - 1);
    playGuitarString(stringIndex, fretIndex);
  }, [playGuitarString]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();

      if (KEYBOARD_MAP[key]) {
        playPianoKey(KEYBOARD_MAP[key]);
      }

      const drumIndex = parseInt(key) - 1;
      if (drumIndex >= 0 && drumIndex < DRUM_PADS.length) {
        playDrumPad(DRUM_PADS[drumIndex].type);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playPianoKey, playDrumPad]);

  useEffect(() => {
    const handleNotePlay = (note: RecordedNote) => {
      if (note.instrument === 'piano') {
        setActiveKeys(prev => new Set(prev).add(note.note as string));
        setTimeout(() => {
          setActiveKeys(prev => {
            const next = new Set(prev);
            next.delete(note.note as string);
            return next;
          });
        }, 150);
      } else if (note.instrument === 'drum') {
        setActiveDrums(prev => new Set(prev).add(note.note as DrumType));
        setTimeout(() => {
          setActiveDrums(prev => {
            const next = new Set(prev);
            next.delete(note.note as DrumType);
            return next;
          });
        }, 100);
      } else if (note.instrument === 'guitar') {
        const key = `${note.stringIndex}_${note.fretIndex}`;
        setActiveGuitar(prev => new Set(prev).add(key));
        setTimeout(() => {
          setActiveGuitar(prev => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        }, 150);
      }
    };

    recorder.setOnNotePlay(handleNotePlay);
    return () => recorder.setOnNotePlay(() => {});
  }, []);

  const whiteKeys = PIANO_KEYS.filter(k => !k.isBlack);
  const blackKeys = PIANO_KEYS.filter(k => k.isBlack);

  const getBlackKeyPosition = (note: string): number => {
    const noteName = note.slice(0, -1);
    const octave = parseInt(note.slice(-1));
    const whiteKeysBefore = (octave - 1) * 7 + NOTE_NAMES.filter(n => !BLACK_KEYS.has(n) && NOTE_NAMES.indexOf(n) < NOTE_NAMES.indexOf(noteName)).length;

    const whiteKeyIndex = whiteKeysBefore;
    return whiteKeyIndex - 1;
  };

  return (
    <div className="instrument-board">
      <div className="instrument-section">
        <div className="section-header">
          <h3>🎹 钢琴</h3>
          <button className="toggle-tips-btn" onClick={() => setShowTips(!showTips)}>
            {showTips ? '隐藏提示' : '显示提示'}
          </button>
        </div>
        <div className="piano-container">
          <div className="piano-keys">
            {whiteKeys.map((key, index) => (
              <div
                key={key.note}
                className={`piano-key white-key ${activeKeys.has(key.note) ? 'active' : ''}`}
                onMouseDown={() => playPianoKey(key.note)}
                style={{ left: `${index * 100 / whiteKeys.length}%` }}
              >
                {showTips && key.keyboardKey && (
                  <span className="key-label">{key.keyboardKey}</span>
                )}
                {showTips && <span className="note-label">{key.note}</span>}
              </div>
            ))}
            {blackKeys.map((key) => {
              const position = getBlackKeyPosition(key.note);
              return (
                <div
                  key={key.note}
                  className={`piano-key black-key ${activeKeys.has(key.note) ? 'active' : ''}`}
                  onMouseDown={() => playPianoKey(key.note)}
                  style={{ left: `calc(${(position + 1) * 100 / whiteKeys.length}% - 3%)` }}
                >
                  {showTips && key.keyboardKey && (
                    <span className="key-label">{key.keyboardKey}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="instrument-section">
        <div className="section-header">
          <h3>🥁 鼓组</h3>
          <button className="toggle-tips-btn" onClick={() => setShowTips(!showTips)}>
            {showTips ? '隐藏提示' : '显示提示'}
          </button>
        </div>
        <div className="drum-pads">
          {DRUM_PADS.map((pad) => (
            <div
              key={pad.type}
              className={`drum-pad ${activeDrums.has(pad.type) ? 'active' : ''}`}
              style={{
                '--drum-color': pad.color,
                boxShadow: `0 0 20px ${pad.color}55, 0 0 40px ${pad.color}33`
              } as React.CSSProperties}
              onClick={(e) => playDrumPad(pad.type, e)}
            >
              <span className="drum-name">{pad.name}</span>
              {showTips && <span className="drum-key">{pad.key}</span>}
              {ripples.filter(r => r.pad === pad.type).map(ripple => (
                <div
                  key={ripple.id}
                  className="ripple"
                  style={{ left: ripple.x, top: ripple.y }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="instrument-section">
        <div className="section-header">
          <h3>🎸 吉他</h3>
          <button className="toggle-tips-btn" onClick={() => setShowTips(!showTips)}>
            {showTips ? '隐藏提示' : '显示提示'}
          </button>
        </div>
        <div className="guitar-container">
          <svg className="guitar-fretboard" viewBox="0 0 400 100" preserveAspectRatio="none">
            {GUITAR_STRINGS.map((string, sIndex) => (
              <g key={sIndex}>
                <line
                  x1="0"
                  y1={15 + sIndex * 14}
                  x2="400"
                  y2={15 + sIndex * 14}
                  stroke={string.color}
                  strokeWidth="2"
                  className={`guitar-string ${activeGuitar.has(`${sIndex}_0`) ? 'vibrating' : ''}`}
                />
                <rect
                  x="0"
                  y={15 + sIndex * 14 - 6}
                  width="400"
                  height="12"
                  fill="transparent"
                  className="string-click-area"
                  onClick={(e) => handleGuitarClick(sIndex, e)}
                />
              </g>
            ))}
            {Array.from({ length: FRETS + 1 }).map((_, i) => (
              <line
                key={`fret-${i}`}
                x1={(i * 400) / FRETS}
                y1="10"
                x2={(i * 400) / FRETS}
                y2="90"
                stroke="#555"
                strokeWidth="1"
              />
            ))}
            {[2, 4].map(fret => (
              <circle
                key={`dot-${fret}`}
                cx={((fret + 0.5) * 400) / FRETS}
                cy="50"
                r="3"
                fill="#888"
                className="fret-dot"
              />
            ))}
          </svg>
          {showTips && (
            <div className="guitar-labels">
              {GUITAR_STRINGS.map((string, i) => (
                <span key={i} className="guitar-string-label">
                  {string.note}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstrumentBoard;
