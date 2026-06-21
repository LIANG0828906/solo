import React, { useEffect, useRef, useState, useCallback } from 'react';
import { NoteDrop } from './NoteDrop';
import { useGameStore, Player, SongData } from './store/gameStore';
import { useWebSocket } from './hooks/useWebSocket';

interface FireworkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

const KEY_MAP: Record<string, number> = {
  'd': 0, 'D': 0, 'ArrowLeft': 0,
  'f': 1, 'F': 1, 'ArrowDown': 1,
  'j': 2, 'J': 2, 'ArrowUp': 2,
  'k': 3, 'K': 3, 'ArrowRight': 3,
};

const TRACK_KEYS = ['D', 'F', 'J', 'K'];

export const GameBoard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const notesRef = useRef<NoteDrop[]>([]);
  const animationRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const fireworksRef = useRef<FireworkParticle[]>([]);
  const pressedKeysRef = useRef<Set<number>>(new Set());
  const keyGlowRef = useRef<Map<number, number>>(new Map());

  const {
    players,
    myPlayer,
    gameState,
    countdown,
    songData,
    startTime,
    comboPopups,
    lastHitType,
    showMissFlash,
  } = useGameStore();

  const { send } = useWebSocket();
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });
  const [showFireworks, setShowFireworks] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
  }, []);

  const playSound = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      // ignore audio errors
    }
  }, []);

  const playHitSound = useCallback((hitType: 'perfect' | 'good' | 'miss') => {
    if (hitType === 'perfect') {
      playSound(880, 0.08, 'square', 0.2);
      setTimeout(() => playSound(1320, 0.05, 'sine', 0.15), 20);
    } else if (hitType === 'good') {
      playSound(660, 0.08, 'triangle', 0.2);
    } else {
      playSound(150, 0.15, 'sawtooth', 0.15);
    }
  }, [playSound]);

  useEffect(() => {
    if (gameState !== 'playing' || !songData || !myPlayer) {
      notesRef.current = [];
      return;
    }

    notesRef.current = songData.notes.map(note => {
      return null as unknown as NoteDrop;
    }).filter(Boolean);
  }, [gameState, songData, myPlayer]);

  const createFirework = useCallback((x: number, y: number) => {
    const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6bd6', '#ffffff'];
    for (let i = 0; i < 40; i++) {
      const angle = (Math.PI * 2 * i) / 40 + Math.random() * 0.3;
      const speed = 3 + Math.random() * 5;
      fireworksRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 3,
      });
    }
  }, []);

  useEffect(() => {
    if (gameState === 'finished') {
      setShowFireworks(true);
      const interval = setInterval(() => {
        createFirework(
          Math.random() * dimensions.width,
          Math.random() * dimensions.height * 0.6
        );
      }, 400);

      const timeout = setTimeout(() => {
        clearInterval(interval);
        setShowFireworks(false);
      }, 3000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [gameState, dimensions, createFirework]);

  useEffect(() => {
    if (gameState !== 'playing' || !songData || !myPlayer) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const trackIndex = KEY_MAP[e.key];
      if (trackIndex === undefined) return;
      e.preventDefault();

      pressedKeysRef.current.add(trackIndex);
      keyGlowRef.current.set(trackIndex, performance.now());

      const currentTime = Date.now();
      const judgeLineY = dimensions.height * 0.85;

      for (let i = 0; i < songData.notes.length; i++) {
        const noteData = songData.notes[i];
        if (noteData.track !== trackIndex) continue;

        let note = notesRef.current[i];
        if (!note) {
          const playerIndex = players.findIndex(p => p.id === myPlayer.id);
          const layout = calculateLayout(dimensions.width, dimensions.height, players.length);
          const playerArea = layout.playerAreas[playerIndex];
          if (playerArea) {
            const trackX = playerArea.x + playerArea.width * (trackIndex + 0.5) / 4;
            note = new NoteDrop(
              noteData.index,
              noteData.track,
              noteData.time,
              myPlayer.color,
              trackX,
              dimensions.height / 2000
            );
            notesRef.current[i] = note;
          }
        }

        if (note) {
          const hitResult = note.checkHit(trackIndex, currentTime, startTime, judgeLineY);
          if (hitResult) {
            playHitSound(hitResult);
            send({
              type: 'NOTE_HIT',
              noteIndex: noteData.index,
              timestamp: currentTime,
              trackIndex,
            });
            break;
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const trackIndex = KEY_MAP[e.key];
      if (trackIndex !== undefined) {
        pressedKeysRef.current.delete(trackIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, songData, startTime, myPlayer, players, dimensions, send, playHitSound]);

  useEffect(() => {
    if (lastHitType) {
      playHitSound(lastHitType);
    }
  }, [lastHitType, playHitSound]);

  function calculateLayout(width: number, height: number, playerCount: number) {
    const isMobile = width < 768;
    const cols = isMobile ? 1 : (playerCount <= 2 ? 2 : Math.min(playerCount, 4));
    const rows = isMobile ? Math.ceil(playerCount / 1) : (playerCount <= 2 ? 1 : Math.ceil(playerCount / 2));
    
    const padding = 16;
    const gap = 12;
    const topBarHeight = 80;
    const availableWidth = width - padding * 2 - gap * (cols - 1);
    const availableHeight = height - topBarHeight - padding * 2 - gap * (rows - 1);
    
    const areaWidth = availableWidth / cols;
    const areaHeight = availableHeight / rows;

    const playerAreas = [];
    for (let i = 0; i < playerCount; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      playerAreas.push({
        x: padding + col * (areaWidth + gap),
        y: topBarHeight + padding + row * (areaHeight + gap),
        width: areaWidth,
        height: areaHeight,
      });
    }

    return { playerAreas, judgeLineY: height * 0.85 };
  }

  const handleTouchTrack = useCallback((trackIndex: number, playerIndex: number) => {
    if (gameState !== 'playing' || !songData || !myPlayer) return;

    const currentTime = Date.now();
    const judgeLineY = dimensions.height * 0.85;
    const myIndex = players.findIndex(p => p.id === myPlayer.id);
    if (playerIndex !== myIndex) return;

    keyGlowRef.current.set(trackIndex, performance.now());

    for (let i = 0; i < songData.notes.length; i++) {
      const noteData = songData.notes[i];
      if (noteData.track !== trackIndex) continue;

      let note = notesRef.current[i];
      if (!note) {
        const layout = calculateLayout(dimensions.width, dimensions.height, players.length);
        const playerArea = layout.playerAreas[myIndex];
        if (playerArea) {
          const trackX = playerArea.x + playerArea.width * (trackIndex + 0.5) / 4;
          note = new NoteDrop(
            noteData.index,
            noteData.track,
            noteData.time,
            myPlayer.color,
            trackX,
            dimensions.height / 2000
          );
          notesRef.current[i] = note;
        }
      }

      if (note) {
        const hitResult = note.checkHit(trackIndex, currentTime, startTime, judgeLineY);
        if (hitResult) {
          playHitSound(hitResult);
          send({
            type: 'NOTE_HIT',
            noteIndex: noteData.index,
            timestamp: currentTime,
            trackIndex,
          });
          break;
        }
      }
    }
  }, [gameState, songData, startTime, myPlayer, players, dimensions, send, playHitSound]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (timestamp: number) => {
      const deltaTime = lastFrameRef.current ? timestamp - lastFrameRef.current : 16;
      lastFrameRef.current = timestamp;

      const { width, height } = dimensions;
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, width, height);

      const layout = calculateLayout(width, height, players.length);
      const judgeLineY = layout.judgeLineY;
      const currentTime = Date.now();

      players.forEach((player, playerIndex) => {
        const area = layout.playerAreas[playerIndex];
        if (!area) return;

        const gradient = ctx.createLinearGradient(area.x, area.y, area.x, area.y + area.height);
        gradient.addColorStop(0, player.color + '33');
        gradient.addColorStop(0.5, player.color + '11');
        gradient.addColorStop(1, player.color + '33');
        ctx.fillStyle = gradient;
        ctx.fillRect(area.x, area.y, area.width, area.height);

        ctx.strokeStyle = player.color + '66';
        ctx.lineWidth = 2;
        ctx.strokeRect(area.x, area.y, area.width, area.height);

        const trackWidth = area.width / 4;
        for (let i = 0; i < 4; i++) {
          const trackX = area.x + i * trackWidth;
          ctx.strokeStyle = 'rgba(255,255,255,0.08)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(trackX, area.y);
          ctx.lineTo(trackX, area.y + area.height);
          ctx.stroke();

          const glowStart = keyGlowRef.current.get(i);
          if (glowStart && (timestamp - glowStart) < 150 && player.id === myPlayer?.id) {
            const alpha = 1 - (timestamp - glowStart) / 150;
            ctx.strokeStyle = player.color;
            ctx.lineWidth = 4 * alpha;
            ctx.shadowColor = player.color;
            ctx.shadowBlur = 20 * alpha;
            ctx.beginPath();
            ctx.moveTo(trackX, area.y);
            ctx.lineTo(trackX, area.y + area.height);
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        }

        ctx.save();
        ctx.fillStyle = player.color + 'aa';
        ctx.shadowColor = player.color;
        ctx.shadowBlur = 15;
        ctx.fillRect(area.x, judgeLineY - 3, area.width, 6);
        ctx.restore();

        if (player.id === myPlayer?.id) {
          for (let i = 0; i < 4; i++) {
            const keyX = area.x + trackWidth * (i + 0.5);
            const keyY = judgeLineY + 40;
            const isPressed = pressedKeysRef.current.has(i);
            
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(keyX - 25, keyY - 20, 50, 40, 8);
            ctx.fillStyle = isPressed ? player.color : 'rgba(255,255,255,0.1)';
            ctx.fill();
            ctx.strokeStyle = isPressed ? '#ffffff' : player.color + '88';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = isPressed ? '#ffffff' : '#cccccc';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(TRACK_KEYS[i], keyX, keyY);
            ctx.restore();
          }
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`${player.nickname}`, area.x + 8, area.y + 8);
        ctx.fillStyle = player.color;
        ctx.font = 'bold 24px Arial';
        ctx.fillText(`${player.score}`, area.x + 8, area.y + 30);
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '14px Arial';
        ctx.fillText(`Combo: ${player.combo}`, area.x + 8, area.y + 60);
      });

      if (gameState === 'playing' && songData && myPlayer) {
        const elapsed = currentTime - startTime;
        const travelDuration = judgeLineY / (height / 2000) * 1000;
        const myIndex = players.findIndex(p => p.id === myPlayer.id);
        const playerArea = layout.playerAreas[myIndex];

        if (playerArea) {
          const trackWidth = playerArea.width / 4;
          
          songData.notes.forEach((noteData, i) => {
            const startSpawnTime = noteData.time - travelDuration;
            const endTime = noteData.time + 200;
            
            if (elapsed >= startSpawnTime && elapsed <= endTime) {
              let note = notesRef.current[i];
              if (!note && elapsed < noteData.time + 100) {
                const trackX = playerArea.x + trackWidth * (noteData.track + 0.5);
                note = new NoteDrop(
                  noteData.index,
                  noteData.track,
                  noteData.time,
                  myPlayer.color,
                  trackX,
                  height / 2000
                );
                notesRef.current[i] = note;
              }
              if (note) {
                note.update(currentTime, startTime, judgeLineY, deltaTime);
                note.draw(ctx, judgeLineY);
              }
            }
          });
        }
      }

      fireworksRef.current = fireworksRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.life -= deltaTime / 1500;

        if (p.life > 0) {
          ctx.save();
          ctx.globalAlpha = p.life;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.restore();
          return true;
        }
        return false;
      });

      if (showFireworks && Math.random() < 0.1) {
        createFirework(
          Math.random() * width,
          Math.random() * height * 0.5
        );
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationRef.current);
  }, [dimensions, players, gameState, songData, startTime, myPlayer, showFireworks, createFirework]);

  const renderCountdown = () => {
    if (gameState !== 'countdown') return null;
    return (
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
        <div
          key={countdown}
          className="countdown-number text-[200px] font-bold text-white drop-shadow-[0_0_30px_rgba(99,102,241,0.8)]"
          style={{ textShadow: '0 0 40px #6366f1, 0 0 80px #6366f1' }}
        >
          {countdown > 0 ? countdown : 'GO!'}
        </div>
      </div>
    );
  };

  const renderComboPopups = () => (
    <>
      {comboPopups.map(popup => (
        <div
          key={popup.id}
          className="combo-popup fixed left-1/2 top-1/3 -translate-x-1/2 text-6xl font-bold pointer-events-none z-40"
          style={{
            background: 'linear-gradient(135deg, #ffd700, #ffed4e, #ffd700)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 30px rgba(255, 215, 0, 0.5)',
          }}
        >
          {popup.combo}连击！
        </div>
      ))}
    </>
  );

  return (
    <div className={`relative w-full h-full overflow-hidden ${showMissFlash ? 'miss-flash' : ''}`}>
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="block"
      />

      {players.map((player, playerIndex) => {
        const myIndex = players.findIndex(p => p.id === myPlayer?.id);
        if (playerIndex !== myIndex) return null;
        const layout = calculateLayout(dimensions.width, dimensions.height, players.length);
        const area = layout.playerAreas[playerIndex];
        if (!area) return null;
        const trackWidth = area.width / 4;

        return (
          <div
            key={player.id}
            className="absolute md:hidden"
            style={{
              left: area.x,
              top: layout.judgeLineY + 20,
              width: area.width,
              height: 80,
            }}
          >
            <div className="grid grid-cols-4 gap-1 h-full px-1">
              {TRACK_KEYS.map((key, i) => (
                <button
                  key={key}
                  onTouchStart={() => handleTouchTrack(i, playerIndex)}
                  onMouseDown={() => handleTouchTrack(i, playerIndex)}
                  className="rounded-lg text-white font-bold text-xl active:scale-95 transition-transform"
                  style={{
                    backgroundColor: player.color + '88',
                    border: `2px solid ${player.color}`,
                  }}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {renderCountdown()}
      {renderComboPopups()}

      {lastHitType && gameState === 'playing' && (
        <div className="fixed left-1/2 top-1/4 -translate-x-1/2 pointer-events-none z-30">
          <div
            className={`text-4xl font-bold ${lastHitType === 'perfect' ? 'glow-gold' : ''}`}
            style={{
              color: lastHitType === 'perfect' ? '#ffd700' : lastHitType === 'good' ? '#4ade80' : '#ef4444',
              textShadow: lastHitType === 'perfect' ? '0 0 20px rgba(255, 215, 0, 0.8)' : 'none',
            }}
          >
            {lastHitType.toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
};
