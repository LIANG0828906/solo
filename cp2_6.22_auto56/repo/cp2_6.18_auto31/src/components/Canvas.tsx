import { useState, useRef, useEffect, useCallback } from 'react';
import { useMoodStore } from '../store';
import { MoodType, MOOD_THEME, MoodEntry } from '../types';
import MoodIcon from './MoodIcon';

interface CanvasProps {
  gradientStart: string;
  gradientEnd: string;
  selectedEntry: MoodEntry | null;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  color: string;
}

interface BubblePosition {
  x: number;
  y: number;
}

export default function Canvas({ gradientStart, gradientEnd, selectedEntry }: CanvasProps) {
  const [showBubble, setShowBubble] = useState(false);
  const [bubblePos, setBubblePos] = useState<BubblePosition>({ x: 0, y: 0 });
  const [text, setText] = useState('');
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [currentGradient, setCurrentGradient] = useState({ start: gradientStart, end: gradientEnd });
  const [animatingGradient, setAnimatingGradient] = useState(false);
  const rippleIdRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const addEntry = useMoodStore((s) => s.addEntry);

  useEffect(() => {
    if (!animatingGradient) {
      setCurrentGradient({ start: gradientStart, end: gradientEnd });
    }
  }, [gradientStart, gradientEnd, animatingGradient]);

  const animateGradient = useCallback((targetStart: string, targetEnd: string, centerX: number, centerY: number) => {
    const rippleId = rippleIdRef.current++;
    setRipples((prev) => [
      ...prev,
      { id: rippleId, x: centerX, y: centerY, color: targetStart },
    ]);

    setTimeout(() => {
      setCurrentGradient({ start: targetStart, end: targetEnd });
      setAnimatingGradient(true);
    }, 150);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== rippleId));
    }, 300);

    setTimeout(() => {
      setAnimatingGradient(false);
    }, 500);
  }, []);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (showBubble) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const bubbleWidth = 360;
      const bubbleHeight = 300;
      let posX = x - bubbleWidth / 2;
      let posY = y - bubbleHeight / 2;

      if (posX < 20) posX = 20;
      if (posX + bubbleWidth > rect.width - 20) posX = rect.width - bubbleWidth - 20;
      if (posY < 20) posY = 20;
      if (posY + bubbleHeight > rect.height - 20) posY = rect.height - bubbleHeight - 20;

      setBubblePos({ x: posX, y: posY });
      setShowBubble(true);
      setText('');
      setSelectedMood(null);
    },
    [showBubble]
  );

  const handleSubmit = useCallback(() => {
    if (!selectedMood || !text.trim()) return;
    addEntry(selectedMood, text.trim());

    const theme = MOOD_THEME[selectedMood];
    animateGradient(theme.color, theme.gradientEnd, bubblePos.x + 180, bubblePos.y + 150);

    setShowBubble(false);
    setText('');
    setSelectedMood(null);
  }, [selectedMood, text, addEntry, animateGradient, bubblePos]);

  const handleCloseBubble = useCallback(() => {
    setShowBubble(false);
    setText('');
    setSelectedMood(null);
  }, []);

  useEffect(() => {
    if (selectedEntry) {
      const theme = MOOD_THEME[selectedEntry.mood];
      setAnimatingGradient(true);
      setCurrentGradient({ start: theme.color, end: theme.gradientEnd });
      const timer = setTimeout(() => setAnimatingGradient(false), 500);
      return () => clearTimeout(timer);
    }
  }, [selectedEntry]);

  return (
    <div
      ref={containerRef}
      onClick={handleCanvasClick}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(180deg, ${currentGradient.start} 0%, ${currentGradient.end} 100%)`,
        transition: animatingGradient ? 'background 0.5s ease' : 'none',
        cursor: showBubble ? 'default' : 'pointer',
      }}
    >
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          style={{
            position: 'absolute',
            left: ripple.x,
            top: ripple.y,
            width: 0,
            height: 0,
            borderRadius: '50%',
            background: ripple.color,
            opacity: 0.6,
            transform: 'translate(-50%, -50%)',
            animation: 'rippleExpand 0.3s cubic-bezier(0.33, 1, 0.68, 1) forwards',
            pointerEvents: 'none',
          }}
        />
      ))}

      <style>{`
        @keyframes rippleExpand {
          0% {
            width: 0;
            height: 0;
            opacity: 0.8;
          }
          100% {
            width: 4000px;
            height: 4000px;
            opacity: 0;
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes bounceHover {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
      `}</style>

      {!showBubble && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.9)',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎨</div>
          <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '8px' }}>
            点击画布记录此刻心情
          </div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>
            用色彩和文字，定格你的情绪瞬间
          </div>
        </div>
      )}

      {showBubble && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            left: bubblePos.x,
            top: bubblePos.y,
            width: '360px',
            padding: '24px',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#333' }}>
              记录心情
            </div>
            <button
              onClick={handleCloseBubble}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'transparent',
                color: '#666',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              ✕
            </button>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 200))}
            placeholder="写下此刻的感受..."
            style={{
              width: '100%',
              height: '80px',
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              background: 'rgba(255, 255, 255, 0.8)',
              fontSize: '14px',
              lineHeight: 1.5,
              color: '#333',
              marginBottom: '8px',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = selectedMood
                ? MOOD_THEME[selectedMood].color
                : '#999';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)';
            }}
          />
          <div
            style={{
              textAlign: 'right',
              fontSize: '12px',
              color: '#999',
              marginBottom: '16px',
            }}
          >
            {text.length}/200
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                fontSize: '13px',
                color: '#666',
                marginBottom: '10px',
              }}
            >
              选择心情
            </div>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              {(Object.keys(MOOD_THEME) as MoodType[]).map((mood) => {
                const theme = MOOD_THEME[mood];
                const isSelected = selectedMood === mood;
                return (
                  <button
                    key={mood}
                    onClick={() => setSelectedMood(mood)}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: isSelected
                        ? `${theme.color}20`
                        : 'rgba(255, 255, 255, 0.6)',
                      border: isSelected
                        ? `2px solid ${theme.color}`
                        : '2px solid transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    title={theme.label}
                    type="button"
                  >
                    <MoodIcon mood={mood} size={28} />
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!selectedMood || !text.trim()}
            style={{
              width: '100%',
              height: '44px',
              borderRadius: '12px',
              background:
                selectedMood && text.trim()
                  ? `linear-gradient(135deg, ${MOOD_THEME[selectedMood].color} 0%, ${MOOD_THEME[selectedMood].gradientEnd} 100%)`
                  : '#ccc',
              color: 'white',
              fontSize: '15px',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              opacity: selectedMood && text.trim() ? 1 : 0.6,
              cursor: selectedMood && text.trim() ? 'pointer' : 'not-allowed',
            }}
            onMouseEnter={(e) => {
              if (selectedMood && text.trim()) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            保存心情
          </button>
        </div>
      )}
    </div>
  );
}
