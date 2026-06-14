import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { Beat, Score, Particle, JudgmentType, ThemeType, GameMode } from './types';
import { judgeHit, calculateScore, DIFFICULTY_CONFIGS } from './BeatGenerator';
import styles from './styles/RhythmPlayer.module.css';

interface RhythmPlayerProps {
  beats: Beat[];
  difficulty: 'easy' | 'normal' | 'hard';
  mode: GameMode;
  theme: ThemeType;
  onScoreUpdate: (score: Score) => void;
  onGameEnd: (score: Score) => void;
  isPlaying: boolean;
  onStart: () => void;
}

const KEY_MAP: Record<string, number> = { 'a': 0, 's': 1, 'd': 2, 'f': 3 };
const TRACK_KEYS = ['A', 'S', 'D', 'D'];
const FALL_DURATION = 2000;
const MAX_PARTICLES = 80;
const JUDGMENT_WINDOW = 150;

const createAudioContext = (typeof window !== 'undefined' && window.AudioContext) 
  ? new window.AudioContext() 
  : null;

function generateTone(frequency: number, duration: number, type: OscillatorType = 'sine'): void {
  if (!createAudioContext) return;
  const oscillator = createAudioContext.createOscillator();
  const gainNode = createAudioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(createAudioContext.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = type;
  
  gainNode.gain.setValueAtTime(0.3, createAudioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, createAudioContext.currentTime + duration);
  
  oscillator.start(createAudioContext.currentTime);
  oscillator.stop(createAudioContext.currentTime + duration);
}

function playBeatSound(): void {
  generateTone(440, 0.1, 'square');
}

function playPerfectSound(): void {
  generateTone(880, 0.15, 'sine');
}

function playGoodSound(): void {
  generateTone(660, 0.1, 'sine');
}

function playMissSound(): void {
  generateTone(220, 0.2, 'sawtooth');
}

const RhythmPlayer: React.FC<RhythmPlayerProps> = ({
  beats, difficulty, mode, theme, onScoreUpdate, onGameEnd, isPlaying, onStart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentTimeRef = useRef(0);
  const startTimeRef = useRef(0);
  const animationFrameRef = useRef<number>();
  const [renderTime, setRenderTime] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [pressedKeys, setPressedKeys] = useState<Set<number>>(new Set());
  const [judgments, setJudgments] = useState<Array<{ id: string; type: JudgmentType; track: number; deviation?: number }>>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [localBeats, setLocalBeats] = useState<Beat[]>(beats);
  const [flashMiss, setFlashMiss] = useState(false);
  const localBeatsRef = useRef<Beat[]>(beats);
  const scoreRef = useRef<Score>({
    total: 0, perfect: 0, good: 0, miss: 0, combo: 0, maxCombo: 0, totalDeviation: 0, hitCount: 0 });
  const lastBeatIndexRef = useRef(0);
  const particleIdRef = useRef(0);
  const judgmentIdRef = useRef(0);
  const gameEndedRef = useRef(false);

  const config = DIFFICULTY_CONFIGS[difficulty];
  const duration = config.duration;

  const getParticleType = useCallback(() => {
    switch (theme) {
      case 'retro': return 'pixel';
      case 'neon': return 'glow';
      default: return 'dot';
    }
  }, [theme]);

  const createParticles = useCallback((x: number, y: number, type: JudgmentType) => {
    const particleType = getParticleType();
    const count = type === 'perfect' ? 30 : type === 'good' ? 15 : 0;
    if (count === 0) return;

    const color = type === 'perfect' 
      ? getComputedStyle(document.documentElement).getPropertyValue('--perfect-color').trim() || '#ffd700'
      : getComputedStyle(document.documentElement).getPropertyValue('--good-color').trim() || '#4da6ff';

    setParticles(prev => {
      if (prev.length >= MAX_PARTICLES) return prev;
      
      const newParticles: Particle[] = [];
      for (let i = 0; i < Math.min(count, MAX_PARTICLES - prev.length); i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const speed = 2 + Math.random() * 4;
        newParticles.push({
          id: `p-${particleIdRef.current++}`,
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          life: 600,
          maxLife: 600,
          size: type === 'perfect' ? 8 : 6,
          type: particleType,
        });
      }
      return [...prev, ...newParticles];
    });
  }, [getParticleType]);

  const showJudgment = useCallback((type: JudgmentType, track: number, deviation?: number) => {
    const id = `j-${judgmentIdRef.current++}`;
    setJudgments(prev => [...prev, { id, type, track, deviation }]);
    setTimeout(() => {
      setJudgments(prev => prev.filter(j => j.id !== id));
    }, 600);
  }, []);

  const handleKeyPress = useCallback((track: number) => {
    if (!isPlaying || !containerRef.current) return;

    const now = performance.now() - startTimeRef.current;

    const beatIndex = lastBeatIndexRef.current;
    let closestBeat: Beat | null = null;
    let closestDiff = Infinity;

    for (let i = Math.max(0, beatIndex - 5); i < Math.min(localBeatsRef.current.length, beatIndex + 5); i++) {
      const beat = localBeatsRef.current[i];
      if (beat.hit) continue;
      if (beat.track !== track) continue;
      
      const diff = Math.abs(now - beat.time);
      if (diff < closestDiff && diff < JUDGMENT_WINDOW) {
        closestDiff = diff;
        closestBeat = beat;
      }
    }

    if (closestBeat) {
      const result = judgeHit(now, closestBeat.time);
      
      if (mode === 'practice' && result.type === 'miss') {
        result.type = 'good';
      }

      const rect = containerRef.current.getBoundingClientRect();
      const trackWidth = rect.width / 4;
      const trackCenter = track * trackWidth + trackWidth / 2;
      const judgmentY = rect.height - 100;

      closestBeat.hit = true;
      closestBeat.judgment = result.type;
      closestBeat.deviation = result.deviation;

      setLocalBeats([...localBeatsRef.current]);

      if (result.type === 'perfect') {
        scoreRef.current.perfect++;
        scoreRef.current.combo++;
        playPerfectSound();
        showJudgment('perfect', track, result.deviation);
        createParticles(trackCenter, judgmentY, 'perfect');
      } else if (result.type === 'good') {
        scoreRef.current.good++;
        scoreRef.current.combo++;
        playGoodSound();
        showJudgment('good', track, result.deviation);
        createParticles(trackCenter, judgmentY, 'good');
      } else {
          scoreRef.current.miss++;
          scoreRef.current.combo = 0;
          playMissSound();
          showJudgment('miss', track, result.deviation);
          setFlashMiss(true);
          setTimeout(() => setFlashMiss(false), 300);
        }

      scoreRef.current.total += calculateScore(result.type, scoreRef.current.combo);
      scoreRef.current.maxCombo = Math.max(scoreRef.current.maxCombo, scoreRef.current.combo);
      scoreRef.current.totalDeviation += Math.abs(result.deviation || 0);
      scoreRef.current.hitCount++;

      const index = localBeatsRef.current.findIndex(b => b.id === closestBeat!.id);
      if (index > lastBeatIndexRef.current) {
        lastBeatIndexRef.current = index + 1;
      }

      onScoreUpdate({ ...scoreRef.current });
    }
  }, [isPlaying, mode, onScoreUpdate, showJudgment, createParticles]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in KEY_MAP && !e.repeat) {
        const track = KEY_MAP[key];
        setPressedKeys(prev => new Set(prev).add(track));
        handleKeyPress(track);
      }
      if (key === ' ' && !isPlaying) {
        e.preventDefault();
        onStart();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in KEY_MAP) {
        const track = KEY_MAP[key];
        setPressedKeys(prev => {
          const next = new Set(prev);
          next.delete(track);
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyPress, isPlaying, onStart]);

  useEffect(() => {
    if (!isPlaying) return;

    const gameLoop = (timestamp: number) => {
      if (startTimeRef.current) {
        currentTimeRef.current = timestamp - startTimeRef.current;
        setRenderTime(currentTimeRef.current);

        setParticles(prev => 
          prev
            .map(p => ({
              ...p,
              x: p.x + p.vx,
              y: p.y + p.vy,
              vy: p.vy + 0.1,
              life: p.life - 16.67,
            }))
            .filter(p => p.life > 0)
        );

        const now = currentTimeRef.current;
        for (let i = lastBeatIndexRef.current; i < localBeatsRef.current.length; i++) {
          const beat = localBeatsRef.current[i];
          if (!beat.hit && now > beat.time + 150) {
            if (mode !== 'practice') {
              beat.hit = true;
              beat.judgment = 'miss';
              scoreRef.current.miss++;
              scoreRef.current.combo = 0;
              scoreRef.current.hitCount++;
              playMissSound();
              showJudgment('miss', beat.track);
              setFlashMiss(true);
              setTimeout(() => setFlashMiss(false), 300);
              onScoreUpdate({ ...scoreRef.current });
              setLocalBeats([...localBeatsRef.current]);
            }
            lastBeatIndexRef.current = i + 1;
          }
        }

        if (now >= duration + 2000 && !gameEndedRef.current) {
          gameEndedRef.current = true;
          cancelAnimationFrame(animationFrameRef.current!);
          onGameEnd({ ...scoreRef.current });
          return;
        }
      }
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, mode, duration, onScoreUpdate, onGameEnd, showJudgment]);

  useEffect(() => {
    if (isPlaying) {
      gameEndedRef.current = false;
      scoreRef.current = {
        total: 0,
        perfect: 0,
        good: 0,
        miss: 0,
        combo: 0,
        maxCombo: 0,
        totalDeviation: 0,
        hitCount: 0,
      };
      lastBeatIndexRef.current = 0;
      localBeatsRef.current = beats.map(b => ({ ...b, hit: false }));
      setLocalBeats([...localBeatsRef.current]);
      setParticles([]);
      setJudgments([]);

      let count = 3;
      setCountdown(count);
      
      const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
          setCountdown(count);
          playBeatSound();
        } else {
          clearInterval(countdownInterval);
          setCountdown(null);
          startTimeRef.current = performance.now();
          playBeatSound();
        }
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [isPlaying, beats]);

  const getBeatPosition = (beat: Beat) => {
    const progress = (renderTime - beat.time + FALL_DURATION) / FALL_DURATION;
    return `${progress * 100}%`;
  };

  const progress = Math.min(100, (renderTime / duration) * 100);

  return (
    <div 
      ref={containerRef} 
      className={`${styles.container} ${flashMiss ? 'flash-miss' : ''}`}
      onTouchStart={(e) => {
        const touch = e.touches[0];
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const x = touch.clientX - rect.left;
          const track = Math.floor((x / rect.width) * 4);
          if (track >= 0 && track < 4) {
            handleKeyPress(track);
            setPressedKeys(prev => new Set(prev).add(track));
            setTimeout(() => {
              setPressedKeys(prev => {
                const next = new Set(prev);
                next.delete(track);
                return next;
              });
            }, 150);
          }
        }
      }}
    >
      <div className={styles.progressBar} style={{ width: `${progress}%` }} />

      {[0, 1, 2, 3].map(track => (
        <div
          key={track}
          className={`${styles.track} ${pressedKeys.has(track) ? styles.active : ''}`}
        >
          {localBeats
            .filter(beat => 
              beat.track === track && 
              !beat.hit &&
              renderTime >= beat.time - FALL_DURATION &&
              renderTime <= beat.time + 200
            )
            .map(beat => (
              <div
                key={beat.id}
                className={`${styles.beat} ${beat.judgment ? styles[beat.judgment] : ''}`}
                style={{ top: getBeatPosition(beat) }}
              />
            ))}

          {judgments
            .filter(j => j.track === track)
            .map(j => (
              <React.Fragment key={j.id}>
                <div className={`${styles.judgmentText} ${styles[j.type]}`}>
                  {j.type.toUpperCase()}
                </div>
                {j.deviation !== undefined && mode === 'practice' && (
                  <div className={styles.deviationText}>
                    {j.deviation > 0 ? '+' : ''}{j.deviation.toFixed(0)}ms
                  </div>
                )}
              </React.Fragment>
            ))}

          <div className={`${styles.keyHint} ${pressedKeys.has(track) ? styles.pressed : ''}`}>
            {TRACK_KEYS[track]}
          </div>
        </div>
      ))}

      <div className={styles.judgmentLine} />

      <div className={styles.particlesContainer}>
        {particles.map(p => (
          <div
            key={p.id}
            className={`${styles.particle} ${styles[p.type]}`}
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              background: p.color,
              opacity: p.life / p.maxLife,
              boxShadow: `0 0 ${p.size}px ${p.color}`,
            }}
          />
        ))}
      </div>

      {countdown !== null && (
        <div className={styles.countdown} key={countdown}>
          {countdown}
        </div>
      )}

      {!isPlaying && countdown === null && (
        <div className={styles.startOverlay}>
          <div className={styles.startText}>
            按下 空格键 开始游戏
          </div>
          <div className={styles.hintText}>
            使用 <span className={styles.highlightKey}>A</span>
            <span className={styles.highlightKey}>S</span>
            <span className={styles.highlightKey}>D</span>
            <span className={styles.highlightKey}>F</span> 击打对应轨道
          </div>
        </div>
      )}
    </div>
  );
};

export default RhythmPlayer;
