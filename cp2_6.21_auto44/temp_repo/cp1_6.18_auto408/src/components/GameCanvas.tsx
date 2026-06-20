import { useRef, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { playNote } from '@/utils/soundEngine';

const PLAYER_HALF_SIZE = 4;
const TRIGGER_DISTANCE_CELLS = 3;

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const initializedRef = useRef(false);

  const {
    walls,
    playerPosition,
    totems,
    exitPosition,
    exitActivated,
    gameStatus,
    keys,
    cellPixelSize,
    canvasSize,
    wallThickness,
    passageWidth,
    playerSpeed,
    collectedCount,
    initGame,
    setPlayerPosition,
    triggerTotem,
    triggerVictory,
    updateTime,
    setKey,
  } = useGameStore();

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      initGame();
    }
  }, [initGame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) {
        setKey(key, true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) {
        setKey(key, false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setKey]);

  const checkCollision = (x: number, y: number) => {
    const corners = [
      { x: x - PLAYER_HALF_SIZE, y: y - PLAYER_HALF_SIZE },
      { x: x + PLAYER_HALF_SIZE, y: y - PLAYER_HALF_SIZE },
      { x: x - PLAYER_HALF_SIZE, y: y + PLAYER_HALF_SIZE },
      { x: x + PLAYER_HALF_SIZE, y: y + PLAYER_HALF_SIZE },
    ];

    for (const corner of corners) {
      const cx = Math.floor(corner.x);
      const cy = Math.floor(corner.y);
      if (cx < 0 || cy < 0 || cx >= canvasSize || cy >= canvasSize) {
        return true;
      }
      if (walls.has(`${cx},${cy}`)) {
        return true;
      }
    }
    return false;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = Math.min(window.innerWidth - 64, window.innerHeight - 64, 720) / canvasSize;
    canvas.width = canvasSize * scale;
    canvas.height = canvasSize * scale;
    ctx.scale(scale, scale);

    const gameLoop = (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }
      const deltaTime = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;

      if (gameStatus === 'playing') {
        let dx = 0;
        let dy = 0;
        if (keys.has('w')) dy -= 1;
        if (keys.has('s')) dy += 1;
        if (keys.has('a')) dx -= 1;
        if (keys.has('d')) dx += 1;

        if (dx !== 0 || dy !== 0) {
          const len = Math.sqrt(dx * dx + dy * dy);
          dx = (dx / len) * playerSpeed * deltaTime;
          dy = (dy / len) * playerSpeed * deltaTime;

          let newX = playerPosition.x + dx;
          let newY = playerPosition.y;
          if (!checkCollision(newX, newY)) {
            setPlayerPosition(newX, newY);
          }

          newX = playerPosition.x;
          newY = playerPosition.y + dy;
          if (!checkCollision(newX, newY)) {
            setPlayerPosition(newX, newY);
          }
        }

        const triggerDistance = TRIGGER_DISTANCE_CELLS * cellPixelSize;
        for (const totem of totems) {
          if (totem.status === 'idle') {
            const distX = playerPosition.x - totem.position.x;
            const distY = playerPosition.y - totem.position.y;
            const distance = Math.sqrt(distX * distX + distY * distY);
            if (distance <= triggerDistance) {
              triggerTotem(totem.id);
              playNote(totem.frequency, 0.3);
            }
          }
        }

        if (exitActivated) {
          const distX = playerPosition.x - exitPosition.x;
          const distY = playerPosition.y - exitPosition.y;
          const distance = Math.sqrt(distX * distX + distY * distY);
          if (distance < passageWidth / 2) {
            triggerVictory();
          }
        }

        updateTime();
      }

      const bgGradient = ctx.createRadialGradient(
        canvasSize * 0.3,
        canvasSize * 0.2,
        0,
        canvasSize * 0.5,
        canvasSize * 0.5,
        canvasSize * 0.8
      );
      bgGradient.addColorStop(0, '#2A1A4E');
      bgGradient.addColorStop(0.4, '#1A0A2E');
      bgGradient.addColorStop(1, '#0D0518');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      ctx.fillStyle = '#24143A';
      const wallArr: string[] = Array.from(walls);
      for (const w of wallArr) {
        const [wx, wy] = w.split(',').map(Number);
        ctx.fillRect(wx, wy, 1, 1);
      }

      const now = performance.now();
      for (const totem of totems) {
        ctx.save();
        ctx.translate(totem.position.x, totem.position.y);

        let glowColor = '#4A90D9';
        if (totem.status === 'collected') {
          const glowProgress = Math.min((now - totem.glowStart) / 300, 1);
          const r = Math.round(74 + (0 - 74) * glowProgress);
          const g = Math.round(144 + (255 - 144) * glowProgress);
          const b = Math.round(217 + (170 - 217) * glowProgress);
          glowColor = `rgb(${r},${g},${b})`;
        }

        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 12;

        ctx.fillStyle = glowColor;
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♪', 0, 0);

        ctx.restore();
      }

      ctx.save();
      ctx.translate(exitPosition.x, exitPosition.y);

      const exitRotation = (now / 4000) * Math.PI * 2;
      let exitColor = '#FFD700';
      let exitScale = 1;

      if (exitActivated) {
        exitColor = '#00FF66';
        exitScale = 1 + 0.2 * Math.sin((now / 500) * Math.PI);
      }

      ctx.rotate(exitRotation);
      ctx.scale(exitScale, exitScale);

      const beamGradient = ctx.createLinearGradient(0, -cellPixelSize, 0, cellPixelSize);
      beamGradient.addColorStop(0, 'transparent');
      beamGradient.addColorStop(0.5, exitColor);
      beamGradient.addColorStop(1, 'transparent');

      ctx.shadowColor = exitColor;
      ctx.shadowBlur = 20;
      ctx.fillStyle = beamGradient;
      ctx.fillRect(-2, -cellPixelSize, 4, cellPixelSize * 2);
      ctx.fillRect(-cellPixelSize, -2, cellPixelSize * 2, 4);

      ctx.restore();

      ctx.save();
      ctx.translate(playerPosition.x, playerPosition.y);
      ctx.rotate(Math.PI / 4);

      ctx.shadowColor = '#00AAFF';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#00AAFF';
      ctx.fillRect(-5, -5, 10, 10);

      ctx.restore();

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(gameLoopRef.current);
    };
  }, [
    walls,
    playerPosition,
    totems,
    exitPosition,
    exitActivated,
    gameStatus,
    keys,
    cellPixelSize,
    canvasSize,
    wallThickness,
    passageWidth,
    playerSpeed,
    collectedCount,
    setPlayerPosition,
    triggerTotem,
    triggerVictory,
    updateTime,
  ]);

  return <canvas ref={canvasRef} style={{ display: 'block', borderRadius: '8px' }} />;
}
