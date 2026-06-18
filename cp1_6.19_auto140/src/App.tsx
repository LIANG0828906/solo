import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { analyzeEmotion, emotionColors, type EmotionType, type EmotionResult } from './emotionAnalyzer';
import { generateMelody, type Note, MIN_NOTE, MAX_NOTE, NOTE_RANGE } from './melodyGenerator';
import { AudioEngine } from './audioEngine';

interface SavedMelody {
  id: string;
  date: string;
  dateLabel: string;
  text: string;
  emotion: EmotionType;
  intensity: number;
  notes: Note[];
}

const TOTAL_BARS = 8;
const BEATS_PER_BAR = 4;
const TOTAL_BEATS = TOTAL_BARS * BEATS_PER_BAR;
const NOTE_WIDTH = 8;
const PIXELS_PER_BEAT = 40;
const PIANO_ROLL_WIDTH = TOTAL_BEATS * PIXELS_PER_BEAT;
const PIANO_ROLL_HEIGHT = 220;

const PlayIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="white" style={{ display: 'block' }}>
    <polygon points="8,5 20,12 8,19" />
  </svg>
);

const PauseIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="white" style={{ display: 'block' }}>
    <rect x="6" y="5" width="4" height="14" rx="1" />
    <rect x="14" y="5" width="4" height="14" rx="1" />
  </svg>
);

const HeartIcon: React.FC<{ size?: number; filled?: boolean }> = ({ size = 14, filled = true }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'white' : 'none'} stroke="white" strokeWidth="2" style={{ display: 'block' }}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const SparkleIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="white" style={{ display: 'block' }}>
    <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" />
    <circle cx="19" cy="19" r="1.2" />
    <circle cx="5" cy="18" r="1" />
  </svg>
);

const PianoRoll: React.FC<{
  notes: Note[];
  activeNoteIndex: number;
  emotion: EmotionType;
  onSeek?: (beat: number) => void;
}> = ({ notes, activeNoteIndex, emotion, onSeek }) => {
  const colors = emotionColors[emotion];
  const rollRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const indicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeNoteIndex >= 0 && notes[activeNoteIndex]) {
      const note = notes[activeNoteIndex];
      const x = note.startTime * PIXELS_PER_BEAT;
      const container = rollRef.current;
      if (container) {
        const viewWidth = container.clientWidth;
        const targetScroll = Math.max(0, x - viewWidth / 2 + NOTE_WIDTH / 2);
        container.scrollTo({ left: targetScroll, behavior: 'smooth' });
        setScrollLeft(targetScroll);
      }
    }
  }, [activeNoteIndex, notes]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || !rollRef.current) return;
    const rect = rollRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + rollRef.current.scrollLeft;
    const beat = x / PIXELS_PER_BEAT;
    onSeek(Math.max(0, Math.min(TOTAL_BEATS, beat)));
  };

  const gridLines = [];
  for (let beat = 0; beat <= TOTAL_BEATS; beat++) {
    const isBar = beat % BEATS_PER_BAR === 0;
    gridLines.push(
      <div
        key={`v-${beat}`}
        style={{
          position: 'absolute',
          left: beat * PIXELS_PER_BEAT,
          top: 0,
          bottom: 0,
          width: 1,
          background: isBar ? 'rgba(108, 99, 255, 0.35)' : 'rgba(0, 0, 0, 0.06)',
          zIndex: 1
        }}
      />
    );
  }

  const pitchStep = PIANO_ROLL_HEIGHT / NOTE_RANGE;
  const hLines = [];
  for (let i = 0; i <= NOTE_RANGE; i += 3) {
    hLines.push(
      <div
        key={`h-${i}`}
        style={{
          position: 'absolute',
          top: i * pitchStep,
          left: 0,
          right: 0,
          height: 1,
          background: 'rgba(0, 0, 0, 0.04)',
          zIndex: 1
        }}
      />
    );
  }

  return (
    <div
      ref={rollRef}
      style={{
        width: '100%',
        height: PIANO_ROLL_HEIGHT,
        overflowX: 'auto',
        overflowY: 'hidden',
        background: 'linear-gradient(180deg, #FAFAFF 0%, #F5F5FB 100%)',
        borderRadius: 10,
        border: '1px solid #E8E8F0',
        cursor: onSeek ? 'pointer' : 'default',
        scrollbarWidth: 'thin',
        scrollbarColor: '#C8C8D8 transparent'
      }}
      onClick={handleClick}
    >
      <div
        style={{
          position: 'relative',
          width: PIANO_ROLL_WIDTH,
          height: PIANO_ROLL_HEIGHT,
          minWidth: '100%'
        }}
      >
        {gridLines}
        {hLines}

        {notes.map((note, idx) => {
          const noteIdx = note.note - MIN_NOTE;
          const y = (NOTE_RANGE - 1 - noteIdx) * pitchStep;
          const x = note.startTime * PIXELS_PER_BEAT;
          const w = Math.max(NOTE_WIDTH, note.duration * PIXELS_PER_BEAT * 0.9);
          const h = Math.max(6, pitchStep * 0.85);
          const isActive = idx === activeNoteIndex;

          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: w,
                height: h,
                borderRadius: 4,
                background: `linear-gradient(180deg, ${colors.from} 0%, ${colors.to} 100%)`,
                boxShadow: isActive
                  ? `0 0 0 2px white, 0 0 12px ${colors.from}, 0 2px 8px rgba(0,0,0,0.2)`
                  : `0 1px 3px rgba(0,0,0,0.15)`,
                border: isActive ? '2px solid rgba(255,255,255,0.95)' : 'none',
                transition: 'box-shadow 0.2s ease, border 0.2s ease, transform 0.1s ease',
                transform: isActive ? 'translateY(-1px) scaleY(1.05)' : 'none',
                zIndex: isActive ? 10 : 2
              }}
            />
          );
        })}

        <div
          ref={indicatorRef}
          style={{
            position: 'absolute',
            top: 0,
            left: scrollLeft,
            width: 2,
            height: '100%',
            background: 'transparent',
            pointerEvents: 'none',
            zIndex: 5
          }}
        />
      </div>
    </div>
  );
};

const EmotionInputArea: React.FC<{
  text: string;
  onTextChange: (t: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}> = ({ text, onTextChange, onAnalyze, isAnalyzing }) => {
  const [focused, setFocused] = useState(false);
  const [buttonPressed, setButtonPressed] = useState(false);
  const [ripples, setRipples] = useState<number[]>([]);

  const handleButtonClick = () => {
    const id = Date.now();
    setRipples(prev => [...prev, id]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r !== id));
    }, 700);
    onAnalyze();
  };

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, justifyContent: 'center' }}>
      <textarea
        value={text}
        onChange={e => onTextChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="今天的心情如何？写下此刻的想法… ✍️"
        style={{
          width: 500,
          maxWidth: 'calc(100% - 72px)',
          height: 180,
          background: '#FEFEFE',
          borderRadius: 12,
          border: `2px solid ${focused ? 'transparent' : '#E0E0E0'}`,
          padding: 16,
          fontSize: 16,
          lineHeight: 1.6,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          resize: 'none',
          outline: 'none',
          transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
          boxShadow: focused
            ? '0 0 0 2px transparent, 0 4px 20px rgba(108, 99, 255, 0.1)'
            : '0 2px 8px rgba(0,0,0,0.04)',
          backgroundImage: focused
            ? 'linear-gradient(#FEFEFE, #FEFEFE), linear-gradient(135deg, #6C63FF 0%, #FF6584 100%)'
            : undefined,
          backgroundOrigin: focused ? 'border-box' : undefined,
          backgroundClip: focused ? 'padding-box, border-box' : undefined,
          color: '#2D2D3A'
        }}
      />

      <button
        onClick={handleButtonClick}
        onMouseDown={() => setButtonPressed(true)}
        onMouseUp={() => setButtonPressed(false)}
        onMouseLeave={() => setButtonPressed(false)}
        disabled={isAnalyzing || !text.trim()}
        style={{
          position: 'relative',
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6C63FF 0%, #FF6584 100%)',
          border: '2px solid white',
          boxShadow: '0 4px 16px rgba(108, 99, 255, 0.35)',
          cursor: isAnalyzing || !text.trim() ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 0,
          transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease, opacity 0.2s ease',
          transform: buttonPressed ? 'scale(0.95)' : 'scale(1)',
          opacity: isAnalyzing || !text.trim() ? 0.5 : 1,
          overflow: 'hidden'
        }}
        onMouseEnter={e => {
          if (!isAnalyzing && text.trim()) {
            e.currentTarget.style.transform = 'scale(1.05)';
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = buttonPressed ? 'scale(0.95)' : 'scale(1)';
        }}
      >
        {ripples.map(id => (
          <span
            key={id}
            style={{
              position: 'absolute',
              borderRadius: '50%',
              left: '50%',
              top: '50%',
              width: 10,
              height: 10,
              marginLeft: -5,
              marginTop: -5,
              background: 'rgba(255,255,255,0.5)',
              animation: 'ripple 0.7s ease-out forwards',
              pointerEvents: 'none'
            }}
          />
        ))}
        <SparkleIcon size={22} />
      </button>

      <style>{`
        @keyframes ripple {
          to {
            width: 100px;
            height: 100px;
            margin-left: -50px;
            margin-top: -50px;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

const MelodyPlayerArea: React.FC<{
  notes: Note[];
  emotion: EmotionType;
  isPlaying: boolean;
  activeNoteIndex: number;
  onPlayPause: () => void;
  onSave: () => void;
  showSaveToast: boolean;
  hasMelody: boolean;
}> = ({ notes, emotion, isPlaying, activeNoteIndex, onPlayPause, onSave, showSaveToast, hasMelody }) => {
  const colors = emotionColors[emotion];

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 820, margin: '0 auto' }}>
      {hasMelody && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
            padding: '8px 14px',
            background: `linear-gradient(135deg, ${colors.from}22 0%, ${colors.to}22 100%)`,
            borderRadius: 20,
            width: 'fit-content',
            border: `1px solid ${colors.from}44`
          }}
        >
          <span style={{ fontSize: 18 }}>{colors.emoji}</span>
          <span style={{ fontSize: 13, color: '#4A4A5A', fontWeight: 500 }}>
            情绪分析：{colors.label}
          </span>
        </div>
      )}

      <PianoRoll notes={notes} activeNoteIndex={activeNoteIndex} emotion={emotion} />

      {!hasMelody && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            borderRadius: 10
          }}
        >
          <div style={{ textAlign: 'center', color: '#9A9AAB' }}>
            <div style={{ fontSize: 42, marginBottom: 8 }}>🎹</div>
            <div style={{ fontSize: 14 }}>输入心情文字，点击按钮生成旋律</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 16 }}>
        <button
          onClick={onPlayPause}
          disabled={!hasMelody}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: hasMelody ? '#6C63FF' : '#D8D8E0',
            border: 'none',
            cursor: hasMelody ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s ease, transform 0.15s ease',
            padding: 0
          }}
          onMouseEnter={e => {
            if (hasMelody) e.currentTarget.style.background = '#8B7FFF';
          }}
          onMouseLeave={e => {
            if (hasMelody) e.currentTarget.style.background = '#6C63FF';
          }}
          onMouseDown={e => {
            if (hasMelody) e.currentTarget.style.transform = 'scale(0.92)';
          }}
          onMouseUp={e => {
            if (hasMelody) e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        <button
          onClick={onSave}
          disabled={!hasMelody}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: hasMelody ? '#FF6584' : '#D8D8E0',
            border: 'none',
            cursor: hasMelody ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s ease, transform 0.15s ease',
            padding: 0
          }}
          onMouseEnter={e => {
            if (hasMelody) e.currentTarget.style.background = '#FF85A0';
          }}
          onMouseLeave={e => {
            if (hasMelody) e.currentTarget.style.background = '#FF6584';
          }}
          onMouseDown={e => {
            if (hasMelody) e.currentTarget.style.transform = 'scale(0.92)';
          }}
          onMouseUp={e => {
            if (hasMelody) e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <HeartIcon />
        </button>
      </div>

      {showSaveToast && (
        <div
          style={{
            position: 'absolute',
            bottom: -8,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 20px',
            background: 'linear-gradient(135deg, #6C63FF 0%, #FF6584 100%)',
            color: 'white',
            fontSize: 13,
            fontWeight: 500,
            borderRadius: 20,
            boxShadow: '0 4px 16px rgba(108, 99, 255, 0.3)',
            animation: 'toastIn 0.3s ease, toastOut 0.3s ease 1.2s forwards',
            whiteSpace: 'nowrap',
            zIndex: 100
          }}
        >
          旋律已保存 ✿
        </div>
      )}

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translate(-50%, 10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translate(-50%, 0); }
          to { opacity: 0; transform: translate(-50%, -10px); }
        }
      `}</style>
    </div>
  );
};

const TimelineArea: React.FC<{
  savedMelodies: SavedMelody[];
  currentPlayingId: string | null;
  onPlayMelody: (m: SavedMelody) => void;
}> = ({ savedMelodies, currentPlayingId, onPlayMelody }) => {
  return (
    <div style={{ width: '100%', maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 18 }}>📅</span>
        <h3 style={{ margin: 0, fontSize: 15, color: '#2D2D3A', fontWeight: 600 }}>
          情绪旋律时间线
        </h3>
        <span style={{ fontSize: 12, color: '#9A9AAB', marginLeft: 4 }}>
          （{savedMelodies.length} 条记录）
        </span>
      </div>

      {savedMelodies.length === 0 ? (
        <div
          style={{
            padding: 32,
            textAlign: 'center',
            background: '#FAFAFF',
            borderRadius: 12,
            border: '1px dashed #E0E0EB',
            color: '#9A9AAB',
            fontSize: 13
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎼</div>
          还没有保存的旋律，记录第一条心情吧～
        </div>
      ) : (
        <>
          <div
            className="timeline-horizontal"
            style={{
              display: 'flex',
              gap: 12,
              overflowX: 'auto',
              padding: '8px 4px 16px',
              scrollbarWidth: 'thin'
            }}
          >
            {savedMelodies.map(melody => {
              const colors = emotionColors[melody.emotion];
              const isPlaying = currentPlayingId === melody.id;
              return (
                <div
                  key={melody.id}
                  onClick={() => onPlayMelody(melody)}
                  style={{
                    width: 120,
                    height: 80,
                    minWidth: 120,
                    borderRadius: 8,
                    background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)`,
                    padding: 10,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    transform: isPlaying ? 'translateY(-2px) scale(1.03)' : 'none',
                    boxShadow: isPlaying
                      ? `0 6px 20px ${colors.from}80`
                      : '0 2px 8px rgba(0,0,0,0.12)',
                    overflow: 'hidden',
                    color: 'white'
                  }}
                  onMouseEnter={e => {
                    if (!isPlaying) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isPlaying) {
                      e.currentTarget.style.transform = 'none';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.95 }}>
                      {melody.dateLabel}
                    </span>
                    <span style={{ fontSize: 14 }}>{colors.emoji}</span>
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      opacity: 0.9,
                      lineHeight: 1.3,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      wordBreak: 'break-all'
                    }}
                  >
                    {melody.text}
                  </div>
                  {isPlaying && (
                    <div
                      style={{
                        position: 'absolute',
                        right: 8,
                        bottom: 8,
                        display: 'flex',
                        gap: 2,
                        alignItems: 'flex-end',
                        height: 14
                      }}
                    >
                      {[0, 1, 2].map(i => (
                        <div
                          key={i}
                          style={{
                            width: 3,
                            background: 'rgba(255,255,255,0.9)',
                            borderRadius: 2,
                            animation: `eq 0.8s ease-in-out ${i * 0.15}s infinite alternate`
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div
            className="timeline-vertical"
            style={{ display: 'none', flexDirection: 'column', gap: 10 }}
          >
            {savedMelodies.map(melody => {
              const colors = emotionColors[melody.emotion];
              const isPlaying = currentPlayingId === melody.id;
              return (
                <div
                  key={melody.id}
                  onClick={() => onPlayMelody(melody)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    borderRadius: 10,
                    background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)`,
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    transform: isPlaying ? 'translateX(4px)' : 'none',
                    boxShadow: isPlaying
                      ? `0 4px 16px ${colors.from}60`
                      : '0 2px 8px rgba(0,0,0,0.1)',
                    color: 'white'
                  }}
                >
                  <div style={{ fontSize: 28, flexShrink: 0 }}>{colors.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2, opacity: 0.95 }}>
                      {melody.dateLabel} · {colors.label}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        opacity: 0.9,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {melody.text}
                    </div>
                  </div>
                  {isPlaying && (
                    <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 16 }}>
                      {[0, 1, 2].map(i => (
                        <div
                          key={i}
                          style={{
                            width: 3,
                            background: 'rgba(255,255,255,0.9)',
                            borderRadius: 2,
                            animation: `eq 0.8s ease-in-out ${i * 0.15}s infinite alternate`
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <style>{`
        @keyframes eq {
          0% { height: 4px; }
          100% { height: 14px; }
        }
        @media (max-width: 768px) {
          .timeline-horizontal { display: none !important; }
          .timeline-vertical { display: flex !important; }
        }
      `}</style>
    </div>
  );
};

function App() {
  const [text, setText] = useState('');
  const [currentEmotion, setCurrentEmotion] = useState<EmotionResult>({ emotion: 'calm', intensity: 0.5 });
  const [currentNotes, setCurrentNotes] = useState<Note[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeNoteIndex, setActiveNoteIndex] = useState(-1);
  const [savedMelodies, setSavedMelodies] = useState<SavedMelody[]>([]);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [playingSavedId, setPlayingSavedId] = useState<string | null>(null);

  const audioEngineRef = useRef<AudioEngine | null>(null);
  const currentNotesRef = useRef<Note[]>([]);

  useEffect(() => {
    const engine = new AudioEngine({ bpm: 100 });
    engine.setOnNoteStart(idx => setActiveNoteIndex(idx));
    engine.setOnComplete(() => {
      setIsPlaying(false);
      setActiveNoteIndex(-1);
      setPlayingSavedId(null);
    });
    audioEngineRef.current = engine;

    return () => {
      engine.destroy();
    };
  }, []);

  useEffect(() => {
    currentNotesRef.current = currentNotes;
  }, [currentNotes]);

  const handleAnalyze = useCallback(() => {
    if (!text.trim()) return;

    setIsAnalyzing(true);
    setActiveNoteIndex(-1);

    setTimeout(() => {
      const emotionResult = analyzeEmotion(text);
      const notes = generateMelody(emotionResult.emotion, emotionResult.intensity, text);

      setCurrentEmotion(emotionResult);
      setCurrentNotes(notes);
      setIsAnalyzing(false);

      if (audioEngineRef.current) {
        audioEngineRef.current.stop();
      }
      setIsPlaying(false);
      setPlayingSavedId(null);
    }, 80);
  }, [text]);

  const handlePlayPause = useCallback(() => {
    const engine = audioEngineRef.current;
    if (!engine || currentNotesRef.current.length === 0) return;

    const state = engine.getState();

    if (state === 'playing') {
      engine.pause();
      setIsPlaying(false);
    } else if (state === 'paused') {
      engine.resume();
      setIsPlaying(true);
    } else {
      engine.play(currentNotesRef.current);
      setIsPlaying(true);
      setPlayingSavedId(null);
    }
  }, []);

  const handleSave = useCallback(() => {
    if (currentNotes.length === 0) return;

    const now = new Date();
    const dateStr = now.toISOString();
    const dateLabel = `${now.getMonth() + 1}/${now.getDate()}`;

    const saved: SavedMelody = {
      id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      date: dateStr,
      dateLabel,
      text,
      emotion: currentEmotion.emotion,
      intensity: currentEmotion.intensity,
      notes: [...currentNotes]
    };

    setSavedMelodies(prev => [saved, ...prev]);
    setShowSaveToast(true);

    setTimeout(() => {
      setShowSaveToast(false);
    }, 1500);
  }, [text, currentEmotion, currentNotes]);

  const handlePlaySaved = useCallback((melody: SavedMelody) => {
    const engine = audioEngineRef.current;
    if (!engine) return;

    setCurrentEmotion({ emotion: melody.emotion, intensity: melody.intensity });
    setCurrentNotes(melody.notes);
    currentNotesRef.current = melody.notes;
    setActiveNoteIndex(-1);

    setTimeout(() => {
      engine.play(melody.notes);
      setIsPlaying(true);
      setPlayingSavedId(melody.id);
    }, 30);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F7F7FF 0%, #FFF5F8 50%, #F0F7FF 100%)',
        padding: '32px 20px 60px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎵</div>
          <h1
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #6C63FF 0%, #FF6584 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: -0.5
            }}
          >
            情绪日记 · 旋律生成器
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#8A8A9A' }}>
            用文字记录心情，聆听属于你的专属旋律
          </p>
        </div>

        <section style={{ marginBottom: 40 }}>
          <EmotionInputArea
            text={text}
            onTextChange={setText}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
          />
        </section>

        <section style={{ marginBottom: 44 }}>
          <MelodyPlayerArea
            notes={currentNotes}
            emotion={currentEmotion.emotion}
            isPlaying={isPlaying}
            activeNoteIndex={activeNoteIndex}
            onPlayPause={handlePlayPause}
            onSave={handleSave}
            showSaveToast={showSaveToast}
            hasMelody={currentNotes.length > 0}
          />
        </section>

        <section>
          <TimelineArea
            savedMelodies={savedMelodies}
            currentPlayingId={playingSavedId}
            onPlayMelody={handlePlaySaved}
          />
        </section>

        <div style={{ textAlign: 'center', marginTop: 48, fontSize: 11, color: '#B8B8C8' }}>
          ✿ 每一段旋律，都是独一无二的情绪印记 ✿
        </div>
      </div>
    </div>
  );
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<App />);
}
