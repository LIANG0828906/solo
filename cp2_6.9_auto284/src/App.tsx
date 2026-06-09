import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import type { Lantern, LanternType, Riddle } from './utils/riddleData';
import { lanternColors } from './utils/riddleData';
import LanternDisplay from './components/LanternDisplay';
import RiddleCard from './components/RiddleCard';

const SLOT_COUNT = 6;
const BEAM_WIDTH = 800;
const SLOT_GAP = BEAM_WIDTH / (SLOT_COUNT + 1);

const playBellSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.3);
  } catch {
    // Silently fail if audio context is not available
  }
};

const SideLantern = ({ delay }: { delay: number }) => (
  <motion.div
    animate={{ opacity: [0.7, 1, 0.7] }}
    transition={{
  duration: 0.3,
  repeat: Infinity,
  ease: 'easeInOut',
  delay,
}}
    style={{
      width: 25,
      height: 35,
      backgroundColor: '#e74c3c',
      borderRadius: '50% 50% 45% 45%',
      position: 'relative',
      boxShadow: '0 0 10px #e74c3c, 0 0 20px rgba(231,76,60,0.5)',
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: -5,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 8,
        height: 6,
        backgroundColor: '#b8860b',
        borderRadius: 2,
      }}
    />
    <div
      style={{
        position: 'absolute',
        bottom: -8,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 2,
        height: 10,
        backgroundColor: '#d4a373',
      }}
    />
  </motion.div>
);

const WarehouseLantern = ({
  type,
  name,
  onDragStart,
}: {
  type: LanternType;
  name: string;
  onDragStart: (type: LanternType) => void;
}) => {
  const color = lanternColors[type];
  
  return (
    <motion.div
      draggable
      onDragStart={() => onDragStart(type)}
      whileHover={{ scale: 1.1, y: -4 }}
      whileTap={{ scale: 0.95 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'grab',
        gap: 8,
      }}
    >
      <div
        style={{
          width: 60,
          height: 90,
          backgroundColor: color,
          borderRadius: type === 'round' ? '50%' : type === 'walking' ? '10px 10px 50% 50%' : '30% 30% 50% 50%',
          boxShadow: `0 4px 12px rgba(0,0,0,0.3), 0 0 20px ${color}66`,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -5,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 20,
            height: 5,
            backgroundColor: '#b8860b',
            borderRadius: 2,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -5,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 20,
            height: 5,
            backgroundColor: '#b8860b',
            borderRadius: 2,
          }}
        />
      </div>
      <div
        style={{
          backgroundColor: '#f5f0e8',
          padding: '4px 12px',
          borderRadius: 4,
          fontSize: 14,
          color: '#2d3436',
          fontFamily: "'Ma Shan Zheng', cursive",
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      >
        {name}
      </div>
    </motion.div>
  );
};

const Visitor = ({
  position,
  isThinking,
  isShaking,
}: {
  position: { x: number; y: number };
  isThinking: boolean;
  isShaking: boolean;
}) => (
  <motion.div
    animate={{
      x: position.x,
      y: position.y,
      rotate: isShaking ? [-5 : 0,
    }}
    transition={{
      x: { duration: 1.5, ease: 'easeInOut' },
      y: { duration: 1.5, ease: 'easeInOut' },
      rotate: { duration: 0.2, repeat: isShaking ? 3 : 0 },
    }}
    style={{
      position: 'absolute',
      width: 30,
      height: 30,
      borderRadius: '50%',
      backgroundColor: 'rgba(255,255,255,0.3)',
      border: '2px solid rgba(255,255,255,0.6)',
      backdropFilter: 'blur(2px)',
      pointerEvents: 'none',
      zIndex: 50,
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: 8,
        left: 8,
        width: 4,
        height: 4,
        borderRadius: '50%',
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        top: 8,
        right: 8,
        width: 4,
        height: 4,
        borderRadius: '50%',
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}
    />
    {isThinking && (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          position: 'absolute',
          top: -20,
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#fff',
          fontSize: 16,
          whiteSpace: 'nowrap',
        }}
      >
        🤔
      </motion.div>
    )}
  </motion.div>
);

const Badge = () => (
  <motion.div
    initial={{ scale: 0, rotate: -180 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ type: 'spring', damping: 15, stiffness: 200 }}
    style={{
      position: 'absolute',
      top: 20,
      left: 20,
      width: 50,
      height: 50,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #ffd93d 0%, #b8860b 50%, #ffd93d 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 16px rgba(255,217,61,0.5), inset 0 2px 4px rgba(255,255,255,0.5)',
      border: '3px solid #8B4513',
      zIndex: 10,
    }}
  >
    <span
      style={{
        fontSize: 28,
        color: '#8B4513',
        fontWeight: 'bold',
        fontFamily: "'Ma Shan Zheng', cursive",
      }}
    >
      霸
    </span>
  </motion.div>
);

export default function App() {
  const [lanterns, setLanterns] = useState<Lantern[]>([]);
  const [draggedType, setDraggedType] = useState<LanternType | null>(null);
  const [editorLanternId, setEditorLanternId] = useState<string | null>(null);
  const [guessLanternId, setGuessLanternId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    correct: 0,
    total: 0,
    maxStreak: 0,
    currentStreak: 0,
  });
  const [hasBadge, setHasBadge] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [visitor, setVisitor] = useState({
    position: { x: 100, y: 450 },
    targetSlot: null as number | null,
    isThinking: false,
    isShaking: false,
  });
  const [flashState, setFlashState] = useState(false);
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const visitorTimerRef = useRef<number | null>(null);
  const thinkTimerRef = useRef<number | null>(null);
  const flashIntervalRef = useRef<number | null>(null);

  const getSlotX = (slotIndex: number) => {
    const beamLeft = (window.innerWidth - BEAM_WIDTH) / 2;
    return beamLeft + SLOT_GAP * (slotIndex + 1) - 40;
  };

  const handleDragStart = useCallback((type: LanternType) => {
    setDraggedType(type);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (slotIndex: number) => {
      if (!draggedType) return;
      
      const existingLantern = lanterns.find((l) => l.slotIndex === slotIndex);
      if (existingLantern) return;

      const newLantern: Lantern = {
        id: uuidv4(),
        type: draggedType,
        slotIndex,
        riddle: null,
        isSwinging: true,
        isExploding: false,
        isDimming: false,
      };

      setLanterns((prev) => [...prev, newLantern]);
      setDraggedType(null);
    },
    [draggedType, lanterns]
  );

  const handleLanternClick = useCallback((lanternId: string) => {
    const lantern = lanterns.find((l) => l.id === lanternId);
    if (lantern && !lantern.riddle) {
      setEditorLanternId(lanternId);
    }
  }, [lanterns]);

  const handleRiddleSubmit = useCallback(
    (riddle: Riddle) => {
      setLanterns((prev) =>
        prev.map((l) =>
          l.id === editorLanternId ? { ...l, riddle } : l
        )
      );
      setEditorLanternId(null);
    },
    [editorLanternId]
  );

  const handleGuessSubmit = useCallback(
    (answer: string) => {
      const lantern = lanterns.find((l) => l.id === guessLanternId);
      if (!lantern || !lantern.riddle) return;

      const isCorrect = answer.trim() === lantern.riddle.answer.trim();
      const slotIndex = lantern.slotIndex;

      if (isCorrect) {
        playBellSound();
        setLanterns((prev) =>
          prev.map((l) =>
            l.id === guessLanternId
              ? { ...l, isExploding: true }
              : l
          )
        );

        setStats((prev) => {
          const newCorrect = prev.correct + 1;
          const newStreak = prev.currentStreak + 1;
          const newMaxStreak = Math.max(prev.maxStreak, newStreak);
          const newTotal = prev.total + 1;

          if (newCorrect === 5) {
            triggerFlash();
          }
          if (newCorrect >= 10 && !hasBadge) {
            setHasBadge(true);
          }

          return {
            correct: newCorrect,
            total: newTotal,
            maxStreak: newMaxStreak,
            currentStreak: newStreak,
          };
        });

        setTimeout(() => {
          setLanterns((prev) =>
            prev.map((l) =>
              l.id === guessLanternId
                ? { ...l, isExploding: false }
                : l
            )
          );
        }, 600);
      } else {
        setLanterns((prev) =>
          prev.map((l) =>
            l.id === guessLanternId
              ? { ...l, isDimming: true }
              : l
          )
        );

        setVisitor((prev) => ({ ...prev, isShaking: true });

        setStats((prev) => ({
          ...prev,
          total: prev.total + 1,
          currentStreak: 0,
        }));

        setTimeout(() => {
          setLanterns((prev) =>
            prev.map((l) =>
              l.id === guessLanternId
                ? { ...l, isDimming: false }
                : l
            )
          );
          setVisitor((prev) => ({ ...prev, isShaking: false });
        }, 2000);
      }

      setGuessLanternId(null);
      setVisitor((prev) => ({ ...prev, isThinking: false, targetSlot: null }));
      
      setTimeout(() => {
        startVisitorAI();
      }, 2000);
    },
    [guessLanternId, lanterns, hasBadge]
  );

  const triggerFlash = useCallback(() => {
    setIsFlashing(true);
    let count = 0;
    const maxCount = 10;
    
    flashIntervalRef.current = window.setInterval(() => {
      setFlashState((prev) => !prev);
      count++;
      if (count >= maxCount) {
        if (flashIntervalRef.current) {
          clearInterval(flashIntervalRef.current);
        }
        setIsFlashing(false);
        setFlashState(false);
      }
    }, 300);
  }, []);

  const startVisitorAI = useCallback(() => {
    if (visitorTimerRef.current) {
      clearTimeout(visitorTimerRef.current);
    }
    if (thinkTimerRef.current) {
      clearTimeout(thinkTimerRef.current);
    }

    const availableLanterns = lanterns.filter((l) => l.riddle && !l.isDimming && !l.isExploding);
    if (availableLanterns.length === 0) {
      visitorTimerRef.current = window.setTimeout(startVisitorAI, 3000);
      return;
    }

    const randomLantern = availableLanterns[Math.floor(Math.random() * availableLanterns.length)];
    const targetSlot = randomLantern.slotIndex;

    if (targetSlot === null) return;

    const targetX = getSlotX(targetSlot) + 10;
    const targetY = 280;

    setVisitor((prev) => ({
      ...prev,
      position: { x: targetX, y: targetY },
      targetSlot,
    }));

    thinkTimerRef.current = window.setTimeout(() => {
      setVisitor((prev) => ({ ...prev, isThinking: true }));
      
      setTimeout(() => {
        setGuessLanternId(randomLantern.id);
      }, 1000);
    }, 1800);
  }, [lanterns]);

  useEffect(() => {
    const timer = setTimeout(startVisitorAI, 5000);
    return () => {
      clearTimeout(timer);
      if (visitorTimerRef.current) clearTimeout(visitorTimerRef.current);
      if (thinkTimerRef.current) clearTimeout(thinkTimerRef.current);
      if (flashIntervalRef.current) clearInterval(flashIntervalRef.current);
    };
  }, []);

  const handleScreenshot = useCallback(async () => {
    if (!gameAreaRef.current) return;

    try {
      const canvas = await html2canvas(gameAreaRef.current, {
        backgroundColor: '#1a1a2e',
        width: 800,
        height: 600,
        scale: 1,
      });

      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, '元宵灯市夜景.png');
        }
      });
    } catch (error) {
      console.error('截图失败:', error);
    }
  }, []);

  const editorLantern = lanterns.find((l) => l.id === editorLanternId);
  const guessLantern = lanterns.find((l) => l.id === guessLanternId);

  const renderSlots = () => {
    const slots = [];
    for (let i = 0; i < SLOT_COUNT; i++) {
      const lantern = lanterns.find((l) => l.slotIndex === i);
      slots.push(
        <div
          key={i}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(i)}
          style={{
            position: 'absolute',
            left: `${SLOT_GAP * (i + 1) - 40}px`,
            top: 0,
            width: 80,
            height: 20,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: 2,
              height: 20,
              backgroundColor: '#d4a373',
            }}
          />
          {lantern && (
            <div
              style={{
                position: 'absolute',
                top: 20,
                left: 0,
              }}
            >
              <LanternDisplay
                lantern={lantern}
                slotIndex={i}
                onClick={() => handleLanternClick(lantern.id)}
                isFlashing={isFlashing && flashState}
              />
            </div>
          )}
        </div>
      );
    }
    return slots;
  };

  const renderGoldLines = () => {
    const lines = [];
    for (let i = 0; i < SLOT_COUNT - 1; i++) {
      lines.push(
        <div
          key={`line-${i}`}
          style={{
            position: 'absolute',
            left: `${SLOT_GAP * (i + 1)}px`,
            top: 10,
            width: `${SLOT_GAP}px`,
            height: 1,
            backgroundColor: '#d4a373',
            opacity: 0.6,
          }}
        />
      );
    }
    return lines;
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#1a1a2e',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
      ref={gameAreaRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        minHeight: 700,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 80,
          background: 'linear-gradient(180deg, #000000 0%, transparent 100%)',
          clipPath: 'polygon(0 0, 100% 0, 100% 60%, 80% 40%, 60% 60%, 40% 40%, 20% 60%, 0 40%)',
          zIndex: 5,
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 100,
          left: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <SideLantern key={`left-${i}`} />
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 100,
          right: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <SideLantern key={`right-${i}`} />
        ))}
      </div>

      {hasBadge && <Badge />}

      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          backgroundColor: 'rgba(45, 52, 54, 0.8)',
          padding: '16px 24px',
          borderRadius: 12,
          color: '#f5f0e8',
          fontFamily: "'Ma Shan Zheng', cursive",
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          zIndex: 10,
        }}
      >
        <div style={{ fontSize: 18, marginBottom: 4 }}>
          今日猜谜：{stats.correct} / {stats.total}
        </div>
        <div style={{ fontSize: 16, color: '#d4a373' }}>
          最高连击：{stats.maxStreak}
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          top: 120,
          left: '50%',
          transform: 'translateX(-50%)',
          width: BEAM_WIDTH,
          height: 400,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: BEAM_WIDTH,
            height: 20,
            backgroundColor: '#5c3a21',
            borderRadius: 4,
            boxShadow: '0 4px 8px rgba(0,0,0,0.5)',
          }}
        />
        {renderGoldLines()}
        {renderSlots()}
      </div>

      <Visitor
        position={visitor.position}
        isThinking={visitor.isThinking}
        isShaking={visitor.isShaking}
      />

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 150,
          backgroundColor: '#e8dcc8',
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(0,0,0,0.03) 10px,
              rgba(0,0,0,0.03) 20px
            ),
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 10px,
              rgba(0,0,0,0.03) 10px,
              rgba(0,0,0,0.03) 20px
            )
          `,
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          borderTop: '4px solid #b8860b',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.3)',
        }}
      >
        <WarehouseLantern type="round" name="无骨灯" onDragStart={handleDragStart} />
        <WarehouseLantern type="walking" name="走马灯" onDragStart={handleDragStart} />
        <WarehouseLantern type="silk" name="纱灯" onDragStart={handleDragStart} />
      </div>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleScreenshot}
        style={{
          position: 'absolute',
          bottom: 170,
          right: 30,
          width: 60,
          height: 60,
          borderRadius: '50%',
          backgroundColor: '#e17055',
          border: 'none',
          color: '#fff',
          fontSize: 14,
          fontFamily: "'Ma Shan Zheng', cursive",
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(225, 112, 85, 0.5)',
          zIndex: 20,
        }}
      >
        留影
      </motion.button>
    </div>

    <AnimatePresence>
      {editorLanternId && editorLantern && (
        <RiddleCard
          riddle={editorLantern.riddle}
          mode="editor"
          onSubmit={handleRiddleSubmit}
          onClose={() => setEditorLanternId(null)}
        />
      )}
    </AnimatePresence>

    <AnimatePresence>
      {guessLanternId && guessLantern && guessLantern.riddle && (
        <RiddleCard
          riddle={guessLantern.riddle}
          mode="guess"
          onGuessSubmit={handleGuessSubmit}
          onClose={() => {
            setGuessLanternId(null);
            setVisitor((prev) => ({ ...prev, isThinking: false, targetSlot: null }));
            setTimeout(startVisitorAI, 1000);
          }}
        />
      )}
    </AnimatePresence>
  </div>
  );
}
