import React, { useState, useRef, useEffect } from 'react';
import { useMusicStore } from '../store/musicStore';
import { audioEngine } from '../utils/audioEngine';
import { getNoteName } from '../utils/parser';

interface PianoKey {
  midiNumber: number;
  isBlack: boolean;
  x: number;
  width: number;
}

const WHITE_KEY_WIDTH = 24;
const WHITE_KEY_HEIGHT = 120;
const BLACK_KEY_WIDTH = 14;
const BLACK_KEY_HEIGHT = 72;

function generateKeys(): PianoKey[] {
  const keys: PianoKey[] = [];
  const whiteNotes = [0, 2, 4, 5, 7, 9, 11];
  
  let whiteKeyCount = 0;
  for (let midi = 21; midi <= 108; midi++) {
    const pitchClass = midi % 12;
    const isBlack = !whiteNotes.includes(pitchClass);
    
    if (!isBlack) {
      keys.push({
        midiNumber: midi,
        isBlack: false,
        x: whiteKeyCount * WHITE_KEY_WIDTH,
        width: WHITE_KEY_WIDTH,
      });
      whiteKeyCount++;
    }
  }

  const blackKeyOffsets: Record<number, number> = {
    1: 0.65,
    3: 1.65,
    6: 3.6,
    8: 4.6,
    10: 5.6,
  };

  let whiteIdx = 0;
  for (let midi = 21; midi <= 108; midi++) {
    const pitchClass = midi % 12;
    const isBlack = !whiteNotes.includes(pitchClass);
    
    if (!isBlack) {
      whiteIdx++;
    } else {
      const offset = blackKeyOffsets[pitchClass] || 0.5;
      const baseWhiteIndex = whiteIdx - 1 + offset;
      keys.push({
        midiNumber: midi,
        isBlack: true,
        x: baseWhiteIndex * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2,
        width: BLACK_KEY_WIDTH,
      });
    }
  }

  keys.sort((a, b) => {
    if (a.isBlack === b.isBlack) return a.x - b.x;
    return a.isBlack ? 1 : -1;
  });

  return keys;
}

const PianoKeyboard: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { highlightedNotes, currentNoteIndex, notes, playProgress, addHighlightedNote, removeHighlightedNote } = useMusicStore();
  const [hoveredKey, setHoveredKey] = useState<number | null>(null);
  const [tappedKeys, setTappedKeys] = useState<Set<number>>(new Set());

  const [keys] = useState<PianoKey[]>(() => generateKeys());
  const whiteKeyCount = keys.filter(k => !k.isBlack).length;
  const totalWidth = whiteKeyCount * WHITE_KEY_WIDTH;

  const currentPlayingNote = currentNoteIndex >= 0 ? notes[currentNoteIndex] : null;
  const highlightedMidis = new Set(highlightedNotes);
  if (currentPlayingNote) {
    highlightedMidis.add(currentPlayingNote.midiNumber);
  }

  const handleKeyClick = (midiNumber: number) => {
    audioEngine.resume();
    audioEngine.playNote(midiNumber, 0.5);
    addHighlightedNote(midiNumber);
    
    setTappedKeys(prev => new Set(prev).add(midiNumber));
    setTimeout(() => {
      setTappedKeys(prev => {
        const next = new Set(prev);
        next.delete(midiNumber);
        return next;
      });
      removeHighlightedNote(midiNumber);
    }, 500);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container && window.innerWidth < 768 && currentPlayingNote) {
      const keyEl = container.querySelector(`[data-midi="${currentPlayingNote.midiNumber}"]`) as HTMLElement | null;
      if (keyEl) {
        const containerRect = container.getBoundingClientRect();
        const keyRect = keyEl.getBoundingClientRect();
        const scrollLeft = keyEl.offsetLeft - container.clientWidth / 2 + (keyEl.offsetWidth as number) / 2;
        container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
      }
    }
  }, [currentNoteIndex]);

  return (
    <div
      ref={containerRef}
      className="piano-scroll"
      style={{
        position: 'relative',
        width: '100%',
        overflowX: 'auto',
        overflowY: 'hidden',
        padding: '12px 0',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: totalWidth,
          height: WHITE_KEY_HEIGHT + 30,
          margin: '0 auto',
        }}
      >
        {keys.map((key) => {
          const isHighlighted = highlightedMidis.has(key.midiNumber);
          const isHovered = hoveredKey === key.midiNumber;
          const isTapped = tappedKeys.has(key.midiNumber);
          const noteName = getNoteName(key.midiNumber);

          if (key.isBlack) {
            return (
              <div
                key={key.midiNumber}
                data-midi={key.midiNumber}
                onMouseEnter={() => setHoveredKey(key.midiNumber)}
                onMouseLeave={() => setHoveredKey(null)}
                onClick={() => handleKeyClick(key.midiNumber)}
                style={{
                  position: 'absolute',
                  left: key.x,
                  top: 15,
                  width: key.width,
                  height: BLACK_KEY_HEIGHT,
                  backgroundColor: isTapped ? '#85C1E9' : (isHighlighted ? '#F39C12' : '#1B1B1B'),
                  borderRadius: '0 0 3px 3px',
                  cursor: 'pointer',
                  zIndex: 10,
                  transition: 'background-color 0.1s ease, box-shadow 0.1s ease',
                  boxShadow: isHighlighted ? '0 0 12px rgba(243, 156, 18, 0.8)' : '0 2px 4px rgba(0,0,0,0.5)',
                  animation: isHighlighted ? 'pulse-glow 0.6s ease-in-out infinite' : (isTapped ? 'key-tap 0.5s ease-out forwards' : 'none'),
                }}
              >
                {isHovered && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -22,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '10px',
                      color: '#ECF0F1',
                      backgroundColor: '#2C3E50',
                      padding: '2px 4px',
                      borderRadius: '3px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {noteName}
                  </div>
                )}
                {isHighlighted && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -18,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '12px',
                      color: '#999',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {Math.round(playProgress * 100)}%
                  </div>
                )}
              </div>
            );
          }

          return (
            <div
              key={key.midiNumber}
              data-midi={key.midiNumber}
              onMouseEnter={() => setHoveredKey(key.midiNumber)}
              onMouseLeave={() => setHoveredKey(null)}
              onClick={() => handleKeyClick(key.midiNumber)}
              style={{
                position: 'absolute',
                left: key.x,
                top: 15,
                width: key.width,
                height: WHITE_KEY_HEIGHT,
                backgroundColor: isTapped ? '#85C1E9' : (isHighlighted ? '#F39C12' : '#F5F5F5'),
                border: '1px solid #CCC',
                borderRight: 'none',
                borderRadius: '0 0 3px 3px',
                cursor: 'pointer',
                zIndex: 1,
                transition: 'background-color 0.1s ease, box-shadow 0.1s ease',
                boxShadow: isHighlighted ? '0 0 16px rgba(243, 156, 18, 0.9)' : 'inset 0 -2px 4px rgba(0,0,0,0.1)',
                animation: isHighlighted ? 'pulse-glow 0.6s ease-in-out infinite' : (isTapped ? 'key-tap 0.5s ease-out forwards' : 'none'),
              }}
            >
              {isHovered && (
                <div
                  style={{
                    position: 'absolute',
                    top: -22,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '10px',
                    color: '#121212',
                    backgroundColor: '#3498DB',
                    padding: '2px 4px',
                    borderRadius: '3px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {noteName}
                </div>
              )}
              {isHighlighted && (
                <div
                  style={{
                    position: 'absolute',
                    top: 4,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '12px',
                    color: '#999',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {Math.round(playProgress * 100)}%
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PianoKeyboard;
