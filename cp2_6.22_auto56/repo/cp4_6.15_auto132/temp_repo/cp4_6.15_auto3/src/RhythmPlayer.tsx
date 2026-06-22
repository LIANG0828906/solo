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
const TRACK_KEYS = ['A', 'S', 'D', 'F'];
const FALL_DURATION = 2000;
const MAX_PARTICLES = 80;
const JUDGMENT_WINDOW = 150;

const PARTICLE_COLORS: Record<ThemeType, { perfect: string; good: string; miss: string }> = {
  neon: { perfect: '#ffd700', good: '#4da6ff', miss: '#ff4757' },
  retro: { perfect: '#ffff00', good: '#00ffff', miss: '#ff0044' },
  minimal: { perfect: '#ffffff', good: '#cccccc', miss: '#666666' },
};

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioContext();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
}

function generateTone(frequency: number, duration: number, type: OscillatorType = 'sine'): void {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (_) { /* ignore audio errors */ }
}

function playBeatSound(): void { generateTone(440, 0.1, 'square'); }
function playPerfectSound(): void { generateTone(880, 0.15, 'sine'); }
function playGoodSound(): void { generateTone(660, 0.1, 'sine'); }
function playMissSound(): void { generateTone(220, 0.2, 'sawtooth'); }

interface CanvasParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
  shape: 'pixel' | 'glow' | 'dot';
  active: boolean;
}

function createParticlePool(): CanvasParticle[] {
  const pool: CanvasParticle[] = [];
  for (let i = 0; i < MAX_PARTICLES; i++) {
    pool.push({ x: 0, y: 0, vx: 0, vy: 0, color: '#fff', life: 0, maxLife: 1, size: 4, shape: 'dot', active: false });
  }
  return pool;
}

const RhythmPlayer: React.FC<RhythmPlayerProps> = ({
  beats, difficulty, mode, theme, onScoreUpdate, onGameEnd, isPlaying, onStart
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlePoolRef = useRef<CanvasParticle[]>(createParticlePool());
  const audioStartTimeRef = useRef(0);
  const gameStartedRef = useRef(false);
  const animationFrameRef = useRef<number>();
  const lastFrameTimeRef = useRef(0);
  const [renderTime, setRenderTime] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [pressedKeys, setPressedKeys] = useState<Set<number>>(new Set());
  const [judgments, setJudgments] = useState<Array<{ id: string; type: JudgmentType; track: number; deviation?: number }>>([]);
  const [localBeats, setLocalBeats] = useState<Beat[]>(beats);
  const [flashMiss, setFlashMiss] = useState(false);
  const localBeatsRef = useRef<Beat[]>(beats);
  const scoreRef = useRef<Score>({
    total: 0, perfect: 0, good: 0, miss: 0, combo: 0, maxCombo: 0, totalDeviation: 0, hitCount: 0
  });
  const lastBeatIndexRef = useRef(0);
  const judgmentIdRef = useRef(0);
  const gameEndedRef = useRef(false);
  const canvasSizeRef = useRef({ w: 0, h: 0 });

  const config = DIFFICULTY_CONFIGS[difficulty];
  const duration = config.duration;

  const getParticleShape = useCallback((): 'pixel' | 'glow' | 'dot' => {
    switch (theme) {
      case 'retro': return 'pixel';
      case 'neon': return 'glow';
      default: return 'dot';
    }
  }, [theme]);

  const spawnParticles = useCallback((x: number, y: number, type: JudgmentType) => {
    const pool = particlePoolRef.current;
    const colors = PARTICLE_COLORS[theme];
    const color = type === 'perfect' ? colors.perfect : type === 'good' ? colors.good : colors.miss;
    const count = type === 'perfect' ? 30 : type === 'good' ? 15 : 8;
    const shape = getParticleShape();
    let spawned = 0;

    for (let i = 0; i < pool.length && spawned < count; i++) {
      if (!pool[i].active) {
        const angle = (Math.PI * 2 * spawned) / count + (Math.random() - 0.5) * 0.8;
        const speed = 1.5 + Math.random() * 4;
        pool[i] = {
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          color,
          life: 600,
          maxLife: 600,
          size: type === 'perfect' ? 8 : type === 'good' ? 6 : 5,
          shape,
          active: true,
        };
        spawned++;
      }
    }
  }, [theme, getParticleShape]);

  const drawParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particlePoolRef.current) {
      if (!p.active) continue;
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      if (p.shape === 'glow') {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.size * 2;
      } else {
        ctx.shadowBlur = 0;
      }

      if (p.shape === 'pixel') {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }, []);

  const updateParticles = useCallback((deltaMs: number) => {
    for (const p of particlePoolRef.current) {
      if (!p.active) continue;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12;
      p.life -= deltaMs;
      if (p.life <= 0) p.active = false;
    }
  }, []);

  const showJudgment = useCallback((type: JudgmentType, track: number, deviation?: number) => {
    const id = `j-${judgmentIdRef.current++}`;
    setJudgments(prev => [...prev, { id, type, track, deviation }]);
    setTimeout(() => {
      setJudgments(prev => prev.filter(j => j.id !== id));
    }, 600);
  }, []);

  const getGameTimeMs = useCallback((): number => {
    try {
      const ctx = getAudioContext();
      return (ctx.currentTime - audioStartTimeRef.current) * 1000;
    } catch {
      return 0;
    }
  }, []);

  const handleKeyPress = useCallback((track: number) => {
    if (!isPlaying || !gameStartedRef.current || !containerRef.current) return;

    const now = getGameTimeMs();

    const beatIndex = lastBeatIndexRef.current;
    let closestBeat: Beat | null = null;
    let closestDiff = Infinity;

    for (let i = Math.max(0, beatIndex - 5); i < Math.min(localBeatsRef.current.length, beatIndex + 10); i++) {
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
        spawnParticles(trackCenter, judgmentY, 'perfect');
      } else if (result.type === 'good') {
        scoreRef.current.good++;
        scoreRef.current.combo++;
        playGoodSound();
        showJudgment('good', track, result.deviation);
        spawnParticles(trackCenter, judgmentY, 'good');
      } else {
        scoreRef.current.miss++;
        scoreRef.current.combo = 0;
        playMissSound();
        showJudgment('miss', track, result.deviation);
        spawnParticles(trackCenter, judgmentY, 'miss');
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
  }, [isPlaying, mode, onScoreUpdate, showJudgment, spawnParticles, getGameTimeMs]);

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

    const gameLoop = () => {
      if (gameStartedRef.current) {
        const now = getGameTimeMs();
        const deltaMs = lastFrameTimeRef.current ? now - lastFrameTimeRef.current : 16.67;
        lastFrameTimeRef.current = now;

        setRenderTime(now);
        updateParticles(deltaMs);
        drawParticles();

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

              const rect = containerRef.current?.getBoundingClientRect();
              if (rect) {
                const trackWidth = rect.width / 4;
                const trackCenter = beat.track * trackWidth + trackWidth / 2;
                spawnParticles(trackCenter, rect.height - 100, 'miss');
              }

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
  }, [isPlaying, mode, duration, onScoreUpdate, onGameEnd, showJudgment, spawnParticles, updateParticles, drawParticles, getGameTimeMs]);

  useEffect(() => {
    if (isPlaying) {
      gameEndedRef.current = false;
      gameStartedRef.current = false;
      lastFrameTimeRef.current = 0;
      scoreRef.current = {
        total: 0, perfect: 0, good: 0, miss: 0, combo: 0, maxCombo: 0, totalDeviation: 0, hitCount: 0,
      };
      lastBeatIndexRef.current = 0;
      localBeatsRef.current = beats.map(b => ({ ...b, hit: false }));
      setLocalBeats([...localBeatsRef.current]);
      particlePoolRef.current = createParticlePool();
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
          try {
            const ctx = getAudioContext();
            audioStartTimeRef.current = ctx.currentTime;
          } catch {
            audioStartTimeRef.current = 0;
          }
          gameStartedRef.current = true;
          playBeatSound();
        }
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [isPlaying, beats]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      canvasSizeRef.current = { w: rect.width, h: rect.height };
    };

    resizeCanvas();
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  const getBeatPosition = (beat: Beat) => {
    const progress = (renderTime - beat.time + FALL_DURATION) / FALL_DURATION;
    return `${progress * 100}%`;
  };

  const progress = Math.min(100, (renderTime / duration) * 100);

  const activeTracks = Math.max(config.tracks, 1);

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
          className={`${styles.track} ${pressedKeys.has(track) ? styles.active : ''} ${track >= activeTracks ? styles.inactive : ''}`}
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
                {mode === 'practice' && j.deviation !== undefined ? (
                  <div
                    className={styles.deviationText}
                    style={{
                      color: j.type === 'perfect' ? 'var(--perfect-color)' : 'var(--good-color)',
                      textShadow: j.type === 'perfect' ? 'var(--perfect-glow)' : 'var(--good-glow)',
                    }}
                  >
                    {j.deviation > 0 ? '+' : ''}{j.deviation.toFixed(0)}ms
                  </div>
                ) : null}
              </React.Fragment>
            ))}

          <div className={`${styles.keyHint} ${pressedKeys.has(track) ? styles.pressed : ''}`}>
            {TRACK_KEYS[track]}
          </div>
        </div>
      ))}

      <div className={styles.judgmentLine} />

      <canvas
        ref={canvasRef}
        className={styles.particleCanvas}
      />

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
          {mode === 'practice' && (
            <div className={styles.practiceHint}>
              自由练习模式：无Miss判定，显示偏差毫秒数
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RhythmPlayer;
