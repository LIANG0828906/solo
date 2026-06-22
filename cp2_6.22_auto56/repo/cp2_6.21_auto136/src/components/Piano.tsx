import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { midiToPitch } from '../core/MusicEngine';

interface PianoProps {
  onKeyPress: (midi: number, pitch: string) => void;
  onKeyRelease?: (midi: number, pitch: string) => void;
  highlightedMidis?: number[];
  activeMidis?: number[];
  upcomingMidis?: number[];
  compactMode?: boolean;
}

const WHITE_KEY_WIDTH = 30;
const BLACK_KEY_WIDTH = 18;
const WHITE_KEY_HEIGHT = 120;
const BLACK_KEY_HEIGHT = 72;
const WHITE_KEY_COLOR = '#f8f4e8';
const BLACK_KEY_COLOR = '#2c2c2c';
const WHITE_KEY_PRESSED = '#a0c4ff';
const BLACK_KEY_PRESSED = '#4a6fa5';
const HIGHLIGHT_COLOR = '#ffd166';

const NOTE_PATTERN = [true, false, true, false, true, true, false, true, false, true, false, true];

const KEYBOARD_MAP: Record<string, number> = {
  '1': 48, '!': 49, '2': 50, '@': 51, '3': 52, '4': 53, '$': 54, '5': 55, '%': 56, '6': 57, '^': 58, '7': 59,
  q: 60, w: 61, e: 62, r: 63, t: 64, y: 65, u: 66, i: 67, o: 68, p: 69,
  a: 70, s: 71,
  z: 72, x: 73, c: 74, v: 75, b: 76, n: 77, m: 78, ',': 79, '.': 80, '/': 81,
  '9': 82, '0': 83,
  '-': 84, '=': 85,
  '8': 74,
  '[': 74, ']': 75,
  ';': 76, "'": 77,
  '\\': 78,
  '`': 47,
  '~': 47,
};

const KEY_LABEL_MAP: Record<number, string> = {};
Object.entries(KEYBOARD_MAP).forEach(([key, midi]) => {
  if (!KEY_LABEL_MAP[midi]) {
    KEY_LABEL_MAP[midi] = key.toUpperCase();
  }
});

interface KeyInfo {
  midi: number;
  isBlack: boolean;
  x: number;
  label?: string;
}

export const Piano: React.FC<PianoProps> = ({
  onKeyPress,
  onKeyRelease,
  highlightedMidis = [],
  activeMidis = [],
  upcomingMidis = [],
  compactMode = false,
}) => {
  const minMidi = compactMode ? 36 : 21;
  const maxMidi = compactMode ? 96 : 108;
  const [pressedMidis, setPressedMidis] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const { keys, totalWidth } = useMemo(() => {
    const keyList: KeyInfo[] = [];
    let whiteIndex = 0;
    for (let midi = minMidi; midi <= maxMidi; midi++) {
      const noteIdx = midi % 12;
      const isBlack = !NOTE_PATTERN[noteIdx];
      if (!isBlack) {
        keyList.push({
          midi,
          isBlack: false,
          x: whiteIndex * WHITE_KEY_WIDTH,
          label: KEY_LABEL_MAP[midi],
        });
        whiteIndex++;
      }
    }
    const whiteCount = whiteIndex;
    for (let midi = minMidi; midi <= maxMidi; midi++) {
      const noteIdx = midi % 12;
      const isBlack = !NOTE_PATTERN[noteIdx];
      if (isBlack) {
        let precedingWhites = 0;
        for (let m = minMidi; m < midi; m++) {
          const ni = m % 12;
          if (NOTE_PATTERN[ni]) precedingWhites++;
        }
        keyList.push({
          midi,
          isBlack: true,
          x: precedingWhites * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2,
          label: KEY_LABEL_MAP[midi],
        });
      }
    }
    keyList.sort((a, b) => (a.isBlack === b.isBlack ? a.x - b.x : a.isBlack ? 1 : -1));
    return { keys: keyList, totalWidth: whiteCount * WHITE_KEY_WIDTH };
  }, [minMidi, maxMidi]);

  const handlePress = useCallback(
    (midi: number) => {
      setPressedMidis((prev) => {
        if (prev.has(midi)) return prev;
        const next = new Set(prev);
        next.add(midi);
        return next;
      });
      onKeyPress(midi, midiToPitch(midi));
    },
    [onKeyPress]
  );

  const handleRelease = useCallback(
    (midi: number) => {
      setPressedMidis((prev) => {
        if (!prev.has(midi)) return prev;
        const next = new Set(prev);
        next.delete(midi);
        return next;
      });
      if (onKeyRelease) {
        onKeyRelease(midi, midiToPitch(midi));
      }
    },
    [onKeyRelease]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      const midi = KEYBOARD_MAP[key];
      if (midi !== undefined && midi >= minMidi && midi <= maxMidi) {
        e.preventDefault();
        handlePress(midi);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const midi = KEYBOARD_MAP[key];
      if (midi !== undefined) {
        e.preventDefault();
        handleRelease(midi);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handlePress, handleRelease, minMidi, maxMidi]);

  const highlightedSet = useMemo(() => new Set(highlightedMidis), [highlightedMidis]);
  const activeSet = useMemo(() => new Set(activeMidis), [activeMidis]);
  const upcomingSet = useMemo(() => new Set(upcomingMidis), [upcomingMidis]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'inline-block',
        padding: '18px 22px 24px 22px',
        background: 'linear-gradient(145deg, #0f3460 0%, #16213e 100%)',
        borderRadius: '18px',
        boxShadow:
          '0 14px 50px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.08)',
        outline: '1px solid rgba(160,196,255,0.08)',
        outlineOffset: '-3px',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: totalWidth,
          height: WHITE_KEY_HEIGHT,
        }}
      >
        {keys.map((key) => {
          const isPressed = pressedMidis.has(key.midi) || activeSet.has(key.midi);
          const isHighlighted = highlightedSet.has(key.midi);
          const isUpcoming = upcomingSet.has(key.midi);
          let bgColor = key.isBlack ? BLACK_KEY_COLOR : WHITE_KEY_COLOR;
          if (isHighlighted) {
            bgColor = HIGHLIGHT_COLOR;
          } else if (isPressed) {
            bgColor = key.isBlack ? BLACK_KEY_PRESSED : WHITE_KEY_PRESSED;
          } else if (isUpcoming) {
            bgColor = key.isBlack
              ? '#5c4f2e'
              : '#fff3c4';
          }
          const borderStyle = key.isBlack
            ? '1px solid #111'
            : '1px solid #ccc';
          return (
            <div
              key={key.midi}
              onMouseDown={(e) => {
                e.preventDefault();
                handlePress(key.midi);
              }}
              onMouseUp={() => handleRelease(key.midi)}
              onMouseLeave={() => {
                if (pressedMidis.has(key.midi)) handleRelease(key.midi);
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                handlePress(key.midi);
              }}
              onTouchEnd={() => handleRelease(key.midi)}
              style={{
                position: 'absolute',
                left: key.x,
                top: 0,
                width: key.isBlack ? BLACK_KEY_WIDTH : WHITE_KEY_WIDTH,
                height: key.isBlack ? BLACK_KEY_HEIGHT : WHITE_KEY_HEIGHT,
                backgroundColor: bgColor,
                border: borderStyle,
                borderRadius: key.isBlack
                  ? '2px 2px 5px 5px'
                  : '2px 2px 7px 7px',
                cursor: 'pointer',
                transition:
                  'background-color 0.1s ease-out, box-shadow 0.1s ease-out, transform 0.1s ease-out, border-color 0.1s ease-out',
                boxShadow: key.isBlack
                  ? isPressed
                    ? 'inset 0 4px 8px rgba(0,0,0,0.85), inset 0 1px 0 rgba(0,0,0,0.9), 0 6px 12px rgba(0,0,0,0.55), 0 2px 3px rgba(0,0,0,0.4)'
                    : '0 5px 10px rgba(0,0,0,0.6), inset 0 -3px 6px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.15)'
                  : isPressed
                  ? 'inset 0 5px 12px rgba(0,0,0,0.22), inset 0 1px 2px rgba(0,0,0,0.15), 0 7px 14px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.2)'
                  : '0 4px 8px rgba(0,0,0,0.28), inset 0 -2px 4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)',
                transform: isPressed
                  ? `translateY(${key.isBlack ? 1 : 2}px) scaleX(0.995)`
                  : 'translateY(0) scaleX(1)',
                zIndex: key.isBlack ? 10 : 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'center',
                paddingTop: key.isBlack ? 2 : 3,
                paddingBottom: 6,
                overflow: 'visible',
              }}
            >
              {key.label && (
                <span
                  style={{
                    fontSize: 9,
                    lineHeight: 1,
                    color: key.isBlack
                      ? isPressed
                        ? 'rgba(255,255,255,0.95)'
                        : 'rgba(180,190,220,0.75)'
                      : isPressed
                      ? 'rgba(26,54,93,0.9)'
                      : 'rgba(100,110,140,0.7)',
                    fontFamily: 'monospace',
                    padding: '2px 3px 1px 3px',
                    borderRadius: 3,
                    backgroundColor: key.isBlack
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.045)',
                    whiteSpace: 'nowrap',
                    fontWeight: 500,
                    letterSpacing: 0.2,
                    alignSelf: 'center',
                  }}
                >
                  {key.label}
                </span>
              )}
              <div style={{ flex: 1 }} />
              {!key.isBlack && (
                <span
                  style={{
                    fontSize: 8,
                    color: 'rgba(140,140,160,0.85)',
                    marginTop: 2,
                    fontFamily: 'monospace',
                  }}
                >
                  {midiToPitch(key.midi)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Piano;
