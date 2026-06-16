import React, { useState, useEffect, useRef, useCallback } from 'react';
import wsService from './WebSocketService';
import type { RoomLayout, RoomElement, PlayerState, LeaderboardEntry, ServerMessage } from './types';

const MOVE_SPEED = 5;
const INTERACTION_DISTANCE = 60;
const WALL_HEIGHT = 40;

const DEMO_LAYOUT: RoomLayout = {
  width: 800,
  height: 600,
  name: '演示密室',
  elements: [
    { id: 'w1', type: 'wall', x: 0, y: 0, width: 800, height: 20 },
    { id: 'w2', type: 'wall', x: 0, y: 580, width: 800, height: 20 },
    { id: 'w3', type: 'wall', x: 0, y: 0, width: 20, height: 600 },
    { id: 'w4', type: 'wall', x: 780, y: 0, width: 20, height: 600 },
    { id: 'w5', type: 'wall', x: 300, y: 100, width: 20, height: 200 },
    { id: 'w6', type: 'wall', x: 300, y: 400, width: 20, height: 180 },
    { id: 'item1', type: 'item', x: 200, y: 200, width: 50, height: 50, label: '宝箱',
      interaction: { type: 'click_text', content: '这是一个古老的宝箱，上面刻着神秘的符文。你发现了一张纸条："先点亮烛台，再凝视画像..."' } },
    { id: 'item2', type: 'item', x: 400, y: 300, width: 50, height: 50, label: '烛台',
      interaction: { type: 'sequence_trigger', triggerId: 'seq1' } },
    { id: 'item3', type: 'item', x: 550, y: 150, width: 50, height: 50, label: '画像',
      interaction: { type: 'sequence_trigger', triggerId: 'seq1' } },
    { id: 'item4', type: 'item', x: 500, y: 450, width: 50, height: 50, label: '密码箱',
      interaction: { type: 'password', password: '1234' } },
    { id: 'clue1', type: 'clue', x: 150, y: 400, width: 40, height: 40, label: '纸条',
      interaction: { type: 'click_text', content: '密码箱的密码是 1-2-3-4。' } },
    { id: 'exit1', type: 'exit', x: 720, y: 280, width: 40, height: 60, label: '出口' },
  ],
  puzzles: [
    { id: 'puz1', level: 1, type: 'sequence', solution: ['item2', 'item3'],
      hint: '按正确顺序点亮机关', unlocksExit: true }
  ],
  startPosition: { x: 100, y: 300 },
};

const ELEMENT_ICONS: Record<string, string> = {
  wall: '▓',
  item: '📦',
  clue: '📜',
  exit: '🚪',
};

export default function PlayerPage({ roomId, onBack }: { roomId: string; onBack: () => void }) {
  const [layout, setLayout] = useState<RoomLayout>(DEMO_LAYOUT);
  const [player, setPlayer] = useState<PlayerState>({
    id: 'local',
    nickname: '',
    x: DEMO_LAYOUT.startPosition.x,
    y: DEMO_LAYOUT.startPosition.y,
    currentLevel: 1,
    startTime: Date.now(),
    inventory: [],
    solvedPuzzles: [],
    sequenceProgress: [],
  });
  const [otherPlayers, setOtherPlayers] = useState<PlayerState[]>([]);
  const [showCrack, setShowCrack] = useState(false);
  const [showText, setShowText] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<RoomElement | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [exitUnlocked, setExitUnlocked] = useState(false);
  const [nearbyElement, setNearbyElement] = useState<RoomElement | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [connected, setConnected] = useState(false);

  const keysRef = useRef<Set<string>>(new Set());
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; color: string }>>([]);

  const triggerErrorFlash = useCallback(() => {
    setShowCrack(true);
    setTimeout(() => setShowCrack(false), 500);
  }, []);

  const triggerParticles = useCallback((x: number, y: number) => {
    const colors = ['#daa520', '#cd853f', '#b8860b', '#ffd700'];
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30;
      const speed = 2 + Math.random() * 5;
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 45 + Math.random() * 25,
        size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }, []);

  useEffect(() => {
    const pCanvas = particleCanvasRef.current;
    if (!pCanvas) return;
    const pCtx = pCanvas.getContext('2d');
    if (!pCtx) return;

    const animate = () => {
      pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);

      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life -= 1 / p.maxLife;

        if (p.life <= 0) return false;

        pCtx.globalAlpha = p.life;
        pCtx.fillStyle = p.color;
        pCtx.beginPath();
        pCtx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        pCtx.fill();

        pCtx.globalAlpha = p.life * 0.6;
        pCtx.shadowColor = p.color;
        pCtx.shadowBlur = 12;
        pCtx.fill();
        pCtx.shadowBlur = 0;
        pCtx.globalAlpha = 1;

        return true;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  useEffect(() => {
    if (!gameStarted) return;
    wsService.connect().then(() => {
      setConnected(true);
      wsService.send({ type: 'join_room', roomId, nickname: player.nickname, role: 'player' });
    }).catch(() => {
      console.log('Using offline mode');
    });

    const unsub = wsService.onMessage((msg: ServerMessage) => {
      switch (msg.type) {
        case 'room_state':
          setLayout(msg.layout);
          setOtherPlayers(msg.players.filter(p => p.id !== 'local'));
          setExitUnlocked(msg.exitUnlocked);
          break;
        case 'player_joined':
          if (msg.player.id !== 'local') {
            setOtherPlayers(prev => [...prev.filter(p => p.id !== msg.player.id), msg.player]);
          }
          break;
        case 'player_left':
          setOtherPlayers(prev => prev.filter(p => p.id !== msg.playerId));
          break;
        case 'player_moved':
          setOtherPlayers(prev => prev.map(p =>
            p.id === msg.playerId ? { ...p, x: msg.x, y: msg.y } : p
          ));
          break;
        case 'show_text':
          setShowText(msg.content);
          break;
        case 'unlock_exit':
          setExitUnlocked(true);
          break;
        case 'puzzle_solved':
          setPlayer(prev => ({ ...prev, solvedPuzzles: [...prev.solvedPuzzles, msg.puzzleId], sequenceProgress: [] }));
          triggerParticles(player.x, player.y);
          break;
        case 'puzzle_failed':
          triggerErrorFlash();
          setPlayer(prev => ({ ...prev, sequenceProgress: [] }));
          break;
        case 'game_complete':
          setShowLeaderboard(true);
          setLeaderboard(msg.rankings);
          setMyRank(msg.rank);
          break;
      }
    });

    return () => {
      wsService.disconnect();
      unsub();
    };
  }, [gameStarted, roomId, player.nickname, player.x, player.y, triggerErrorFlash, triggerParticles]);

  useEffect(() => {
    if (!gameStarted) return;
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - player.startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [gameStarted, player.startTime]);

  const checkWallCollision = useCallback((newX: number, newY: number) => {
    const playerSize = 15;
    for (const elem of layout.elements) {
      if (elem.type === 'wall') {
        if (newX + playerSize > elem.x && newX - playerSize < elem.x + elem.width &&
            newY + playerSize > elem.y && newY - playerSize < elem.y + elem.height) {
          return true;
        }
      }
    }
    return false;
  }, [layout.elements]);

  useEffect(() => {
    if (!gameStarted) return;

    let playerX = player.x;
    let playerY = player.y;
    let lastSent = 0;

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = (timestamp - lastTimeRef.current) / 16.67;
      lastTimeRef.current = timestamp;

      let dx = 0, dy = 0;
      if (keysRef.current.has('ArrowUp') || keysRef.current.has('w') || keysRef.current.has('W')) dy -= MOVE_SPEED * delta;
      if (keysRef.current.has('ArrowDown') || keysRef.current.has('s') || keysRef.current.has('S')) dy += MOVE_SPEED * delta;
      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a') || keysRef.current.has('A')) dx -= MOVE_SPEED * delta;
      if (keysRef.current.has('ArrowRight') || keysRef.current.has('d') || keysRef.current.has('D')) dx += MOVE_SPEED * delta;

      if (dx !== 0 || dy !== 0) {
        const newX = Math.max(30, Math.min(layout.width - 30, playerX + dx));
        const newY = Math.max(30, Math.min(layout.height - 30, playerY + dy));

        if (!checkWallCollision(newX, playerY)) playerX = newX;
        if (!checkWallCollision(playerX, newY)) playerY = newY;

        if (Math.abs(playerX - player.x) > 2 || Math.abs(playerY - player.y) > 2) {
          setPlayer(prev => ({ ...prev, x: playerX, y: playerY }));
        }

        if (timestamp - lastSent > 50) {
          wsService.send({ type: 'player_move', x: playerX, y: playerY });
          lastSent = timestamp;
        }
      }

      let nearest: RoomElement | null = null;
      let minDist = INTERACTION_DISTANCE;
      for (const elem of layout.elements) {
        if (elem.type === 'wall') continue;
        const elemCx = elem.x + elem.width / 2;
        const elemCy = elem.y + elem.height / 2;
        const dist = Math.sqrt((playerX - elemCx) ** 2 + (playerY - elemCy) ** 2);
        if (dist < minDist && elem.interaction) {
          minDist = dist;
          nearest = elem;
        }
      }
      setNearbyElement(nearest);

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationRef.current);
  }, [gameStarted, layout, checkWallCollision]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleInteract();
      }
      if (e.key === 'Escape') {
        if (showText) setShowText(null);
        else if (showPassword) setShowPassword(null);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [showText, showPassword, nearbyElement, exitUnlocked, player.sequenceProgress]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const threshold = 20;

    keysRef.current.clear();
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > threshold) keysRef.current.add('ArrowRight');
      else if (dx < -threshold) keysRef.current.add('ArrowLeft');
    } else {
      if (dy > threshold) keysRef.current.add('ArrowDown');
      else if (dy < -threshold) keysRef.current.add('ArrowUp');
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    keysRef.current.clear();
  };

  const handleInteract = () => {
    if (!nearbyElement) return;

    const elem = nearbyElement;
    wsService.send({ type: 'player_interact', elementId: elem.id, action: 'click' });
    triggerParticles(elem.x + elem.width / 2, elem.y + elem.height / 2);

    if (elem.interaction?.type === 'click_text') {
      setShowText(elem.interaction.content || '');
    } else if (elem.interaction?.type === 'password') {
      setShowPassword(elem);
      setPasswordInput('');
    } else if (elem.interaction?.type === 'sequence_trigger') {
      const newProgress = [...player.sequenceProgress, elem.id];
      setPlayer(prev => ({ ...prev, sequenceProgress: newProgress }));

      const puzzle = layout.puzzles.find(p => p.type === 'sequence');
      if (puzzle && Array.isArray(puzzle.solution)) {
        const expectedId = puzzle.solution[newProgress.length - 1];
        if (elem.id !== expectedId) {
          triggerErrorFlash();
          setPlayer(prev => ({ ...prev, sequenceProgress: [] }));
        } else if (newProgress.length === puzzle.solution.length) {
          setExitUnlocked(true);
          setPlayer(prev => ({ ...prev, solvedPuzzles: [...prev.solvedPuzzles, puzzle.id], sequenceProgress: [] }));
          triggerParticles(player.x, player.y);
          setTimeout(() => {
            setShowText('🎉 机关解锁！出口已打开，快去寻找出口吧！');
          }, 300);
        }
      }
    } else if (elem.type === 'exit') {
      if (exitUnlocked) {
        const time = Date.now() - player.startTime;
        wsService.send({ type: 'player_interact', elementId: elem.id, action: 'exit', payload: { time } });

        const mockScores: LeaderboardEntry[] = [
          { nickname: '逃脱大师', timeMs: 45000, rank: 1 },
          { nickname: '密室达人', timeMs: 62000, rank: 2 },
          { nickname: '解谜王者', timeMs: 78000, rank: 3 },
          { nickname: '探险者', timeMs: 95000, rank: 4 },
          { nickname: '新手玩家', timeMs: 120000, rank: 5 },
          { nickname: '迷途羔羊', timeMs: 150000, rank: 6 },
        ];
        const myTime = time;
        const myRank = mockScores.filter(s => s.timeMs < myTime).length + 1;
        const myEntry: LeaderboardEntry = { nickname: player.nickname, timeMs: myTime, rank: myRank };
        const allScores = [...mockScores, myEntry].sort((a, b) => a.timeMs - b.timeMs).slice(0, 10);
        allScores.forEach((s, i) => s.rank = i + 1);

        setLeaderboard(allScores);
        setMyRank(myRank);
        setShowLeaderboard(true);
      } else {
        triggerErrorFlash();
        setShowText('门被锁住了...你需要解开房间里的谜题才能打开。');
      }
    }
  };

  const handlePasswordSubmit = () => {
    if (!showPassword) return;
    if (passwordInput === showPassword.interaction?.password) {
      setShowPassword(null);
      triggerParticles(showPassword.x + showPassword.width / 2, showPassword.y + showPassword.height / 2);
      setShowText('✓ 密码正确！你发现了隐藏的线索...');
      setPlayer(prev => ({ ...prev, inventory: [...prev.inventory, showPassword.id] }));
    } else {
      triggerErrorFlash();
      setPasswordInput('');
    }
  };

  const handleFloorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scale = Math.min(rect.width / layout.width, rect.height / layout.height);
    const offsetX = (rect.width - layout.width * scale) / 2;
    const offsetY = (rect.height - layout.height * scale) / 2;
    const clickX = (e.clientX - rect.left - offsetX) / scale;
    const clickY = (e.clientY - rect.top - offsetY) / scale;

    const dx = clickX - player.x;
    const dy = clickY - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 5) return;

    const steps = Math.ceil(dist / MOVE_SPEED);
    let step = 0;
    const moveInterval = setInterval(() => {
      if (step >= steps) {
        clearInterval(moveInterval);
        return;
      }
      const t = step / steps;
      const targetX = player.x + dx * t;
      const targetY = player.y + dy * t;
      if (!checkWallCollision(targetX, player.y)) {
        setPlayer(prev => ({ ...prev, x: targetX }));
      }
      if (!checkWallCollision(player.x, targetY)) {
        setPlayer(prev => ({ ...prev, y: targetY }));
      }
      wsService.send({ type: 'player_move', x: player.x + dx * t, y: player.y + dy * t });
      step++;
    }, 16);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatMs = (ms: number) => {
    const total = Math.floor(ms / 1000);
    return formatTime(total);
  };

  const handleStartGame = () => {
    if (!nicknameInput.trim()) {
      triggerErrorFlash();
      return;
    }
    setPlayer(prev => ({
      ...prev,
      nickname: nicknameInput.trim(),
      startTime: Date.now(),
    }));
    setGameStarted(true);
  };

  if (!gameStarted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="glass-panel" style={{ padding: '48px', maxWidth: '450px', width: '100%', textAlign: 'center' }}>
          <h1 className="copper-text" style={{ fontSize: '32px', marginBottom: '8px' }}>{layout.name}</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>准备进入密室...</p>
          {showCrack && <div className="crack-overlay" />}
          <div className="property-group">
            <label>请输入你的昵称</label>
            <input
              value={nicknameInput}
              onChange={e => setNicknameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStartGame()}
              placeholder="神秘侦探"
              style={{ width: '100%', fontSize: '16px', padding: '12px', textAlign: 'center' }}
              autoFocus
            />
          </div>
          <button className="btn-copper" style={{ width: '100%', fontSize: '16px', padding: '14px', marginTop: '8px' }} onClick={handleStartGame}>
            ◆ 开始解谜
          </button>
          <button className="btn-ghost" style={{ width: '100%', marginTop: '12px' }} onClick={onBack}>
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="player-canvas-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {showCrack && <div className="crack-overlay" />}

      <canvas ref={particleCanvasRef} width={800} height={600}
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1000 }} />

      <div className="room-25d" style={{ width: layout.width, height: layout.height }}>
        <div className="floor-3d" style={{ width: layout.width, height: layout.height }} onClick={handleFloorClick} />

        {layout.elements.filter(e => e.type === 'wall').map(wall => (
          <div key={wall.id} className="wall-3d" style={{
            left: wall.x,
            top: wall.y,
            width: wall.width,
            height: wall.height,
          }}>
            <div className="wall-face" style={{
              width: wall.width,
              height: wall.height,
            }} />
            {wall.height <= 30 && (
              <div className="wall-face" style={{
                width: wall.width,
                height: WALL_HEIGHT,
                transform: `rotateX(-90deg) translateZ(${wall.height / 2}px) translateY(-${WALL_HEIGHT / 2}px)`,
                transformOrigin: 'bottom',
              }} />
            )}
            {wall.width <= 30 && (
              <div className="wall-face" style={{
                width: WALL_HEIGHT,
                height: wall.height,
                transform: `rotateY(90deg) translateZ(${wall.width / 2}px) translateX(${WALL_HEIGHT / 2}px)`,
                transformOrigin: 'right',
              }} />
            )}
          </div>
        ))}

        {layout.elements.filter(e => e.type !== 'wall').map(elem => (
          <div
            key={elem.id}
            className={`element-item ${elem.type}-element ${elem.interaction ? 'interactable' : ''} ${elem.type === 'exit' && exitUnlocked ? 'unlocked' : ''}`}
            style={{
              left: elem.x + elem.width / 2,
              top: elem.y + elem.height / 2,
              width: elem.width,
              height: elem.height,
              background: elem.type === 'item' ? 'linear-gradient(135deg, #cd853f 0%, #8b4513 100%)' :
                         elem.type === 'clue' ? 'linear-gradient(135deg, #9370db 0%, #4b0082 100%)' :
                         elem.type === 'exit' ? (exitUnlocked ? 'linear-gradient(135deg, #4a7c23 0%, #2d5016 100%)' : 'linear-gradient(135deg, #4a3728 0%, #2d1f15 100%)') : undefined,
            }}
            onClick={e => { e.stopPropagation(); if (nearbyElement?.id === elem.id) handleInteract(); }}
          >
            {ELEMENT_ICONS[elem.type]}
            {nearbyElement?.id === elem.id && (
              <div className="interact-hint visible">
                {elem.type === 'exit' ? (exitUnlocked ? '按空格/点击进入' : '🔒 需要解谜') : '按空格/点击交互'}
              </div>
            )}
          </div>
        ))}

        {otherPlayers.map(op => (
          <div key={op.id} className="player-character" style={{
            left: op.x,
            top: op.y,
            width: 24,
            height: 24,
            background: 'radial-gradient(circle at 30% 30%, #9370db, #4b0082)',
            boxShadow: '0 0 12px rgba(147, 112, 219, 0.8)',
            opacity: 0.7,
          }} title={op.nickname} />
        ))}

        <div className="player-character" style={{ left: player.x, top: player.y }} />
      </div>

      <div className="hud-panel" style={{ top: '20px', left: '20px' }}>
        <div className="glass-panel" style={{ padding: '16px 24px' }}>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: '24px', fontWeight: 700 }} className="copper-text">
            ⏱ {formatTime(elapsedTime)}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {player.nickname} · 关卡 {player.currentLevel}
          </div>
          {player.sequenceProgress.length > 0 && (
            <div style={{ fontSize: '12px', color: 'var(--accent-copper-mid)', marginTop: '8px' }}>
              🔮 机关进度: {player.sequenceProgress.length}/2
            </div>
          )}
          {exitUnlocked && (
            <div style={{ fontSize: '12px', color: '#4a7c23', marginTop: '4px' }}>
              🔓 出口已解锁
            </div>
          )}
        </div>
      </div>

      <div className="hud-panel" style={{ top: '20px', right: '20px' }}>
        <div className="glass-panel" style={{ padding: '12px', display: 'flex', gap: '8px' }}>
          {connected ? (
            <span style={{ color: '#4a7c23', fontSize: '12px' }}>● 实时同步中</span>
          ) : (
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>○ 离线模式</span>
          )}
          <button className="btn-ghost" style={{ fontSize: '12px', padding: '4px 12px', marginLeft: '8px' }} onClick={onBack}>
            退出
          </button>
        </div>
      </div>

      {nearbyElement && (
        <div className="hud-panel" style={{ bottom: '120px', left: '50%', transform: 'translateX(-50%)' }}>
          <div className="glass-panel" style={{ padding: '12px 24px', textAlign: 'center' }}>
            <span className="copper-text" style={{ fontWeight: 600 }}>{nearbyElement.label}</span>
            <span style={{ color: 'var(--text-secondary)', marginLeft: '12px', fontSize: '13px' }}>
              按 [空格] 或 [点击] 交互
            </span>
          </div>
        </div>
      )}

      <div className="touch-controls">
        <div></div>
        <div className="touch-btn" onTouchStart={() => keysRef.current.add('ArrowUp')} onTouchEnd={() => keysRef.current.delete('ArrowUp')}>↑</div>
        <div></div>
        <div className="touch-btn" onTouchStart={() => keysRef.current.add('ArrowLeft')} onTouchEnd={() => keysRef.current.delete('ArrowLeft')}>←</div>
        <div className="touch-btn" onClick={handleInteract} style={{ background: 'linear-gradient(135deg, var(--accent-copper-start), var(--accent-copper-end))', color: '#1a1a2e' }}>●</div>
        <div className="touch-btn" onTouchStart={() => keysRef.current.add('ArrowRight')} onTouchEnd={() => keysRef.current.delete('ArrowRight')}>→</div>
        <div></div>
        <div className="touch-btn" onTouchStart={() => keysRef.current.add('ArrowDown')} onTouchEnd={() => keysRef.current.delete('ArrowDown')}>↓</div>
        <div></div>
      </div>

      {showText && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999 }} onClick={() => setShowText(null)} />
          <div className="glass-panel text-popup">
            <p style={{ fontSize: '18px', lineHeight: 1.8, marginBottom: '24px' }}>{showText}</p>
            <button className="btn-copper" style={{ width: '100%' }} onClick={() => setShowText(null)}>
              继续探索
            </button>
          </div>
        </>
      )}

      {showPassword && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999 }} onClick={() => setShowPassword(null)} />
          <div className="glass-panel password-modal" onClick={e => e.stopPropagation()}>
            <h3 className="copper-text" style={{ marginBottom: '16px', fontSize: '20px' }}>🔐 {showPassword.label}</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>请输入密码：</p>
            <input
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePasswordSubmit()}
              placeholder="••••"
              style={{ width: '100%', fontSize: '24px', textAlign: 'center', letterSpacing: '8px', marginBottom: '16px' }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowPassword(null)}>取消</button>
              <button className="btn-copper" style={{ flex: 1 }} onClick={handlePasswordSubmit}>确认</button>
            </div>
          </div>
        </>
      )}

      {showLeaderboard && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999 }} />
          <div className="glass-panel leaderboard-card fade-in" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000, width: '90%', maxWidth: '450px' }}>
            <h2 className="copper-text" style={{ textAlign: 'center', fontSize: '28px', marginBottom: '8px' }}>🎉 通关成功！</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              用时: <span className="copper-text" style={{ fontWeight: 700, fontSize: '24px' }}>{formatMs(elapsedTime * 1000)}</span>
            </p>

            <h3 style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--accent-copper-mid)' }}>🏆 排行榜</h3>

            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
              {leaderboard.map((entry) => (
                <div
                  key={entry.nickname}
                  className={`leaderboard-row ${myRank === entry.rank && entry.nickname === player.nickname ? 'my-rank' : ''}`}
                >
                  <div className={`rank-number ${entry.rank <= 3 ? `rank-${entry.rank}` : ''}`}
                    style={entry.rank > 3 ? { background: 'rgba(205, 133, 63, 0.2)', color: 'var(--accent-copper-mid)' } : {}}>
                    {entry.rank}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{entry.nickname}</div>
                  </div>
                  <div style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                    {formatMs(entry.timeMs)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={onBack}>返回首页</button>
              <button className="btn-copper" style={{ flex: 1 }} onClick={() => window.location.reload()}>再玩一次</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
