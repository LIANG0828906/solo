import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AudioEngine } from '@/engine/AudioEngine';
import { useAudioStore } from '@/store/useAudioStore';
import { cn } from '@/lib/utils';

interface WhiteKeyData {
  note: number;
  keyboardKey?: string;
}

interface BlackKeyData {
  note: number;
  keyboardKey?: string;
  whiteKeyIndex: number;
}

interface FloatingNote {
  id: number;
  note: number;
  x: number;
}

const WHITE_KEY_WIDTH = 30;
const WHITE_KEY_HEIGHT = 150;
const BLACK_KEY_WIDTH = 18;
const BLACK_KEY_HEIGHT = 90;

const whiteKeys: WhiteKeyData[] = [
  { note: 48 },
  { note: 50 },
  { note: 52 },
  { note: 53 },
  { note: 55 },
  { note: 57 },
  { note: 59 },
  { note: 60, keyboardKey: 'z' },
  { note: 62, keyboardKey: 'x' },
  { note: 64, keyboardKey: 'c' },
  { note: 65, keyboardKey: 'v' },
  { note: 67, keyboardKey: 'b' },
  { note: 69, keyboardKey: 'n' },
  { note: 71, keyboardKey: 'm' },
  { note: 72, keyboardKey: 'q' },
  { note: 74, keyboardKey: 'w' },
  { note: 76, keyboardKey: 'e' },
  { note: 77, keyboardKey: 'r' },
  { note: 79, keyboardKey: 't' },
  { note: 81, keyboardKey: 'y' },
  { note: 83, keyboardKey: 'u' },
  { note: 84, keyboardKey: 'i' },
  { note: 86, keyboardKey: 'o' },
  { note: 88, keyboardKey: 'p' },
  { note: 89, keyboardKey: '[' },
];

const blackKeyIndices = [0, 1, 3, 4, 5, 7, 8, 10, 11, 12, 14, 15, 17, 18, 19, 21, 22];

const blackKeyMap: Record<number, string> = {
  7: 's',
  8: 'd',
  10: 'g',
  11: 'h',
  12: 'j',
  14: '1',
  15: '2',
  17: '3',
  18: '4',
  19: '5',
  21: '6',
  22: '7',
};

const blackKeys: BlackKeyData[] = blackKeyIndices.map((index) => ({
  note: whiteKeys[index].note + 1,
  keyboardKey: blackKeyMap[index],
  whiteKeyIndex: index,
}));

const VirtualKeyboard: React.FC = () => {
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [floatingNotes, setFloatingNotes] = useState<FloatingNote[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  const isMouseDownRef = useRef(false);
  const noteIdRef = useRef(0);

  const { tracks, selectedTrackId } = useAudioStore();

  const getActiveTrackIds = useCallback(() => {
    if (selectedTrackId) {
      const track = tracks.find((t) => t.id === selectedTrackId);
      return track ? [track.type] : [];
    }
    return tracks.filter((t) => t.enabled).map((t) => t.type);
  }, [tracks, selectedTrackId]);

  const playNote = useCallback(
    (note: number) => {
      const trackIds = getActiveTrackIds();
      if (trackIds.length === 0) return;

      const audioEngine = AudioEngine.getInstance();
      trackIds.forEach((trackId) => {
        audioEngine.playNote(trackId, note, 0.8);
      });

      setActiveNotes((prev) => {
        if (prev.has(note)) return prev;
        const next = new Set(prev);
        next.add(note);
        return next;
      });
    },
    [getActiveTrackIds]
  );

  const stopNote = useCallback(
    (note: number) => {
      const trackIds = getActiveTrackIds();
      if (trackIds.length === 0) return;

      const audioEngine = AudioEngine.getInstance();
      trackIds.forEach((trackId) => {
        audioEngine.stopNote(trackId, note);
      });

      setActiveNotes((prev) => {
        if (!prev.has(note)) return prev;
        const next = new Set(prev);
        next.delete(note);
        return next;
      });
    },
    [getActiveTrackIds]
  );

  const addFloatingNote = useCallback((note: number, x: number) => {
    const id = noteIdRef.current++;
    setFloatingNotes((prev) => [...prev, { id, note, x }]);
    setTimeout(() => {
      setFloatingNotes((prev) => prev.filter((n) => n.id !== id));
    }, 800);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.repeat) return;

      const key = e.key.toLowerCase();

      for (const wk of whiteKeys) {
        if (wk.keyboardKey === key) {
          playNote(wk.note);
          const index = whiteKeys.indexOf(wk);
          addFloatingNote(wk.note, index * WHITE_KEY_WIDTH + WHITE_KEY_WIDTH / 2);
          return;
        }
      }

      for (const bk of blackKeys) {
        if (bk.keyboardKey === key) {
          playNote(bk.note);
          const x = (bk.whiteKeyIndex + 1) * WHITE_KEY_WIDTH;
          addFloatingNote(bk.note, x);
          return;
        }
      }
    },
    [playNote, addFloatingNote]
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      for (const wk of whiteKeys) {
        if (wk.keyboardKey === key) {
          stopNote(wk.note);
          return;
        }
      }

      for (const bk of blackKeys) {
        if (bk.keyboardKey === key) {
          stopNote(bk.note);
          return;
        }
      }
    },
    [stopNote]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleMouseUp = () => {
      isMouseDownRef.current = false;
      setActiveNotes((prev) => {
        const audioEngine = AudioEngine.getInstance();
        const trackIds = getActiveTrackIds();
        prev.forEach((note) => {
          trackIds.forEach((trackId) => {
            audioEngine.stopNote(trackId, note);
          });
        });
        return new Set();
      });
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [getActiveTrackIds]);

  const handleWhiteMouseDown = (note: number, index: number) => {
    isMouseDownRef.current = true;
    playNote(note);
    addFloatingNote(note, index * WHITE_KEY_WIDTH + WHITE_KEY_WIDTH / 2);
  };

  const handleWhiteMouseEnter = (note: number, index: number) => {
    if (!isMouseDownRef.current) return;
    if (!activeNotes.has(note)) {
      playNote(note);
      addFloatingNote(note, index * WHITE_KEY_WIDTH + WHITE_KEY_WIDTH / 2);
    }
  };

  const handleBlackMouseDown = (note: number, whiteKeyIndex: number) => {
    isMouseDownRef.current = true;
    playNote(note);
    const x = (whiteKeyIndex + 1) * WHITE_KEY_WIDTH;
    addFloatingNote(note, x);
  };

  const handleBlackMouseEnter = (note: number, whiteKeyIndex: number) => {
    if (!isMouseDownRef.current) return;
    if (!activeNotes.has(note)) {
      playNote(note);
      const x = (whiteKeyIndex + 1) * WHITE_KEY_WIDTH;
      addFloatingNote(note, x);
    }
  };

  const renderKeyboard = (keys: WhiteKeyData[], bKeys: BlackKeyData[], startIndex: number) => {
    const width = keys.length * WHITE_KEY_WIDTH;

    return (
      <div className="relative" style={{ width, height: WHITE_KEY_HEIGHT }}>
        <div className="relative flex">
          {keys.map((key, idx) => {
            const globalIndex = startIndex + idx;
            const isActive = activeNotes.has(key.note);
            return (
              <div
                key={key.note}
                className={cn(
                  'relative cursor-pointer select-none transition-all duration-100',
                  'border border-gray-300',
                  'flex items-end justify-center pb-2'
                )}
                style={{
                  width: WHITE_KEY_WIDTH,
                  height: WHITE_KEY_HEIGHT,
                  backgroundColor: isActive ? '#d0d0d0' : '#e0e0e0',
                  borderRadius: '0 0 4px 4px',
                  transform: isActive ? 'translateY(2px)' : 'translateY(0)',
                  boxShadow: isActive
                    ? '0 2px 4px rgba(0,0,0,0.1)'
                    : '0 6px 10px rgba(0,0,0,0.15)',
                }}
                onMouseDown={() => handleWhiteMouseDown(key.note, globalIndex)}
                onMouseEnter={(e) => {
                  handleWhiteMouseEnter(key.note, globalIndex);
                  if (!isActive && isMouseDownRef.current) {
                    e.currentTarget.style.transform = 'translateY(2px)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }
                }}
                onMouseOver={(e) => {
                  if (!isActive && !isMouseDownRef.current) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 14px rgba(0,0,0,0.2)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 6px 10px rgba(0,0,0,0.15)';
                  }
                }}
                onMouseUp={() => stopNote(key.note)}
                onMouseLeave={() => {
                  if (isMouseDownRef.current) {
                    stopNote(key.note);
                  }
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleWhiteMouseDown(key.note, globalIndex);
                }}
                onTouchEnd={() => stopNote(key.note)}
              >
                {key.keyboardKey && (
                  <span className="text-xs text-gray-500 uppercase">{key.keyboardKey}</span>
                )}
              </div>
            );
          })}
        </div>

        {bKeys.map((key) => {
          const isActive = activeNotes.has(key.note);
          const leftPos = (key.whiteKeyIndex - startIndex + 1) * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2;

          if (leftPos < 0 || leftPos > keys.length * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH) {
            return null;
          }

          return (
            <div
              key={key.note}
              className={cn(
                'absolute top-0 cursor-pointer select-none transition-all duration-100 z-10',
                'flex items-end justify-center pb-1'
              )}
              style={{
                left: leftPos,
                width: BLACK_KEY_WIDTH,
                height: BLACK_KEY_HEIGHT,
                backgroundColor: isActive ? '#555' : '#1a1a1a',
                borderRadius: '0 0 3px 3px',
                transform: isActive ? 'translateY(2px)' : 'translateY(0)',
                boxShadow: isActive
                  ? '0 2px 4px rgba(0,0,0,0.2)'
                  : '0 4px 8px rgba(0,0,0,0.3)',
              }}
              onMouseDown={() => handleBlackMouseDown(key.note, key.whiteKeyIndex)}
              onMouseOver={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#333';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)';
                }
              }}
              onMouseOut={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#1a1a1a';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                }
              }}
              onMouseEnter={() => {
                handleBlackMouseEnter(key.note, key.whiteKeyIndex);
              }}
              onMouseUp={() => stopNote(key.note)}
              onMouseLeave={() => {
                if (isMouseDownRef.current) {
                  stopNote(key.note);
                }
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                handleBlackMouseDown(key.note, key.whiteKeyIndex);
              }}
              onTouchEnd={() => stopNote(key.note)}
            >
              {key.keyboardKey && (
                <span className="text-xs text-gray-400 uppercase">{key.keyboardKey}</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const midPoint = Math.ceil(whiteKeys.length / 2);
  const topWhiteKeys = whiteKeys.slice(0, midPoint);
  const bottomWhiteKeys = whiteKeys.slice(midPoint);
  const topBlackKeys = blackKeys.filter((bk) => bk.whiteKeyIndex < midPoint);
  const bottomBlackKeys = blackKeys.filter((bk) => bk.whiteKeyIndex >= midPoint);

  const allFloatingNotes = floatingNotes.map((fn) => {
    let adjustedX = fn.x;
    let adjustedY = 0;

    if (isMobile) {
      const halfWidth = midPoint * WHITE_KEY_WIDTH;
      if (fn.x < halfWidth) {
        adjustedY = 0;
      } else {
        adjustedX = fn.x - halfWidth;
        adjustedY = WHITE_KEY_HEIGHT + 20;
      }
    }

    return (
      <span
        key={fn.id}
        className="absolute pointer-events-none text-2xl font-bold z-20"
        style={{
          left: adjustedX - 10,
          top: adjustedY,
          color: '#f0c040',
          animation: 'floatUp 0.8s ease-out forwards',
        }}
      >
        ♪
      </span>
    );
  });

  return (
    <div
      className={cn(
        'relative flex justify-center items-center p-4',
        isMobile ? 'flex-col gap-5' : ''
      )}
    >
      <style>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(-60px);
            opacity: 0;
          }
        }
      `}</style>

      {allFloatingNotes}

      {isMobile ? (
        <>
          {renderKeyboard(topWhiteKeys, topBlackKeys, 0)}
          {renderKeyboard(bottomWhiteKeys, bottomBlackKeys, midPoint)}
        </>
      ) : (
        renderKeyboard(whiteKeys, blackKeys, 0)
      )}
    </div>
  );
};

export default VirtualKeyboard;
