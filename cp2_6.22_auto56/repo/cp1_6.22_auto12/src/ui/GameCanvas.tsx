import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameState, Position } from '@/types';

interface GameCanvasProps {
  gameState: GameState;
  onMove: (dx: number, dy: number) => void;
  onInteract: () => void;
  onAttack: () => void;
  onFlee: () => void;
  onCollectLoot: () => void;
}

const TILE_SIZE = 32;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  onMove,
  onInteract,
  onAttack,
  onFlee,
  onCollectLoot,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [virtualJoystickActive, setVirtualJoystickActive] = useState(false);
  const [joystickPos, setJoystickPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [joystickStart, setJoystickStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastMoveRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());

  const getCameraOffset = useCallback((): Position => {
    const hero = gameState.hero;
    const offsetX = hero.position.x * TILE_SIZE - CANVAS_WIDTH / 2 + TILE_SIZE / 2;
    const offsetY = hero.position.y * TILE_SIZE - CANVAS_HEIGHT / 2 + TILE_SIZE / 2;
    return { x: offsetX, y: offsetY };
  }, [gameState.hero]);

  const drawTile = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    type: string,
    visible: boolean,
    explored: boolean,
    offsetX: number,
    offsetY: number,
  ) => {
    const screenX = x * TILE_SIZE - offsetX;
    const screenY = y * TILE_SIZE - offsetY;

    if (screenX < -TILE_SIZE || screenX > CANVAS_WIDTH ||
        screenY < -TILE_SIZE || screenY > CANVAS_HEIGHT) {
      return;
    }

    if (!explored) return;

    if (type === 'wall') {
      const gradient = ctx.createLinearGradient(screenX, screenY, screenX, screenY + TILE_SIZE);
      gradient.addColorStop(0, '#2d1f47');
      gradient.addColorStop(1, '#1a0f2e');
      ctx.fillStyle = gradient;
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

      ctx.strokeStyle = '#3d2b5c';
      ctx.lineWidth = 1;
      ctx.strokeRect(screenX + 0.5, screenY + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);

      ctx.fillStyle = '#4a3666';
      ctx.fillRect(screenX + 4, screenY + 4, 8, 8);
      ctx.fillRect(screenX + 20, screenY + 18, 8, 8);
    } else if (type === 'floor') {
      const gradient = ctx.createLinearGradient(screenX, screenY, screenX, screenY + TILE_SIZE);
      gradient.addColorStop(0, '#3d2b5c');
      gradient.addColorStop(1, '#2d1f47');
      ctx.fillStyle = gradient;
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

      ctx.fillStyle = 'rgba(107, 76, 154, 0.3)';
      const seed = (x * 7 + y * 13) % 5;
      ctx.fillRect(screenX + seed * 6 + 2, screenY + (seed + 2) * 5, 3, 3);
    } else if (type === 'stairs') {
      const gradient = ctx.createLinearGradient(screenX, screenY, screenX, screenY + TILE_SIZE);
      gradient.addColorStop(0, '#3d2b5c');
      gradient.addColorStop(1, '#2d1f47');
      ctx.fillStyle = gradient;
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

      ctx.fillStyle = '#d4af37';
      ctx.beginPath();
      ctx.moveTo(screenX + TILE_SIZE / 2, screenY + 6);
      ctx.lineTo(screenX + TILE_SIZE - 6, screenY + TILE_SIZE - 6);
      ctx.lineTo(screenX + 6, screenY + TILE_SIZE - 6);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#b8941f';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (!visible && explored) {
      ctx.fillStyle = 'rgba(10, 6, 18, 0.6)';
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    }
  }, []);

  const drawHero = useCallback((ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number) => {
    const hero = gameState.hero;
    let drawX = hero.position.x;
    let drawY = hero.position.y;

    if (hero.targetPosition) {
      const progress = hero.moveProgress;
      drawX = hero.position.x + (hero.targetPosition.x - hero.position.x) * progress;
      drawY = hero.position.y + (hero.targetPosition.y - hero.position.y) * progress;
    }

    const screenX = drawX * TILE_SIZE - offsetX + TILE_SIZE / 2;
    const screenY = drawY * TILE_SIZE - offsetY + TILE_SIZE / 2;

    ctx.save();
    ctx.translate(screenX, screenY);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 12, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    const bodyGradient = ctx.createLinearGradient(-8, -14, 8, 14);
    bodyGradient.addColorStop(0, '#6b4c9a');
    bodyGradient.addColorStop(1, '#4a3666');
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.roundRect(-8, -6, 16, 20, 4);
    ctx.fill();

    ctx.fillStyle = '#f0d9b5';
    ctx.beginPath();
    ctx.arc(0, -10, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(0, -12, 6, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-6, -12, 12, 2);

    ctx.fillStyle = '#2d1f47';
    ctx.fillRect(-4, -10, 2, 2);
    ctx.fillRect(2, -10, 2, 2);

    const swordAngle = hero.isAttacking ? -Math.PI / 4 + (hero.attackFrame / 6) * Math.PI / 2 : Math.PI / 6;
    ctx.save();
    ctx.translate(8, 0);
    ctx.rotate(swordAngle);
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(-1, -14, 2, 14);
    ctx.fillStyle = '#8b7355';
    ctx.fillRect(-3, -2, 6, 4);
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(-2, 1, 4, 2);
    ctx.restore();

    ctx.fillStyle = '#4a3666';
    ctx.fillRect(-6, 12, 4, 6);
    ctx.fillRect(2, 12, 4, 6);

    ctx.restore();
  }, [gameState.hero]);

  const drawMonster = useCallback((
    ctx: CanvasRenderingContext2D,
    monster: typeof gameState.monsters[0],
    offsetX: number,
    offsetY: number,
  ) => {
    const tile = gameState.map.tiles[monster.position.y]?.[monster.position.x];
    if (!tile || !tile.visible) return;

    const screenX = monster.position.x * TILE_SIZE - offsetX + TILE_SIZE / 2;
    const screenY = monster.position.y * TILE_SIZE - offsetY + TILE_SIZE / 2;

    ctx.save();
    ctx.translate(screenX, screenY);

    if (monster.isHit) {
      const shake = Math.sin(monster.hitFrame * 2) * 3;
      ctx.translate(shake, 0);
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 12, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    const colors: Record<string, string> = {
      slime: '#7cfc00',
      goblin: '#228b22',
      skeleton: '#f5f5dc',
      bat: '#4b0082',
      gargoyle: '#696969',
    };

    const bodyColor = colors[monster.sprite] || '#ff4444';

    if (monster.sprite === 'slime') {
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.ellipse(0, 4, 12, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-4, 0, 3, 0, Math.PI * 2);
      ctx.arc(4, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(-4, 1, 1.5, 0, Math.PI * 2);
      ctx.arc(4, 1, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (monster.sprite === 'skeleton') {
      ctx.fillStyle = bodyColor;
      ctx.fillRect(-6, -4, 12, 16);
      ctx.beginPath();
      ctx.arc(0, -10, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.fillRect(-5, -12, 3, 4);
      ctx.fillRect(2, -12, 3, 4);
      ctx.fillRect(-2, -6, 4, 2);
    } else if (monster.sprite === 'bat') {
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, 6, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.quadraticCurveTo(-14, -6, -12, 4);
      ctx.quadraticCurveTo(-8, 2, -6, 0);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.quadraticCurveTo(14, -6, 12, 4);
      ctx.quadraticCurveTo(8, 2, 6, 0);
      ctx.fill();
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(-3, -2, 2, 2);
      ctx.fillRect(1, -2, 2, 2);
    } else {
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(-4, -2, 3, 0, Math.PI * 2);
      ctx.arc(4, -2, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    const hpPercent = monster.hp / monster.maxHp;
    ctx.fillStyle = '#333';
    ctx.fillRect(-12, -20, 24, 4);
    ctx.fillStyle = hpPercent > 0.5 ? '#00ff00' : hpPercent > 0.25 ? '#ffff00' : '#ff0000';
    ctx.fillRect(-12, -20, 24 * hpPercent, 4);

    ctx.restore();
  }, [gameState.map.tiles]);

  const drawChest = useCallback((
    ctx: CanvasRenderingContext2D,
    chest: typeof gameState.chests[0],
    offsetX: number,
    offsetY: number,
  ) => {
    const tile = gameState.map.tiles[chest.position.y]?.[chest.position.x];
    if (!tile || !tile.visible) return;

    const screenX = chest.position.x * TILE_SIZE - offsetX + TILE_SIZE / 2;
    const screenY = chest.position.y * TILE_SIZE - offsetY + TILE_SIZE / 2;

    ctx.save();
    ctx.translate(screenX, screenY);

    if (chest.opened) {
      ctx.fillStyle = '#5c4033';
      ctx.fillRect(-10, -2, 20, 12);
      ctx.fillStyle = '#8b6914';
      ctx.fillRect(-10, -8, 20, 6);
    } else {
      ctx.fillStyle = '#8b6914';
      ctx.fillRect(-10, -6, 20, 16);
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(-10, -6, 20, 3);
      ctx.fillRect(-2, -2, 4, 6);

      const glowIntensity = (Math.sin(Date.now() / 300) + 1) / 2;
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 10 + glowIntensity * 10;
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(-1, 0, 2, 3);
    }

    ctx.restore();
  }, [gameState.map.tiles]);

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number) => {
    for (const p of gameState.particles) {
      const screenX = p.x - offsetX;
      const screenY = p.y - offsetY;

      if (screenX < -10 || screenX > CANVAS_WIDTH + 10 ||
          screenY < -10 || screenY > CANVAS_HEIGHT + 10) {
        continue;
      }

      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, [gameState.particles]);

  const drawCombatScene = useCallback((ctx: CanvasRenderingContext2D) => {
    const bgGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bgGradient.addColorStop(0, '#1a0f2e');
    bgGradient.addColorStop(0.5, '#2d1f47');
    bgGradient.addColorStop(1, '#0a0612');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(212, 175, 55, ${0.1 + Math.random() * 0.2})`;
      const px = (i * 73 + Date.now() * 0.02) % CANVAS_WIDTH;
      const py = (i * 41 + Date.now() * 0.03) % CANVAS_HEIGHT;
      ctx.beginPath();
      ctx.arc(px, py, 1 + Math.random(), 0, Math.PI * 2);
      ctx.fill();
    }

    const monster = gameState.combat.monster;
    if (monster) {
      ctx.save();
      ctx.translate(CANVAS_WIDTH * 0.7, CANVAS_HEIGHT * 0.4);

      if (monster.isHit) {
        const shake = Math.sin(monster.hitFrame * 2) * 5;
        ctx.translate(shake, 0);
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.ellipse(0, 80, 60, 15, 0, 0, Math.PI * 2);
      ctx.fill();

      const size = 70;
      const colors: Record<string, string> = {
        slime: '#7cfc00',
        goblin: '#228b22',
        skeleton: '#f5f5dc',
        bat: '#4b0082',
        gargoyle: '#696969',
      };
      const bodyColor = colors[monster.sprite] || '#ff4444';

      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(-20, -10, 12, 0, Math.PI * 2);
      ctx.arc(20, -10, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(-20, -10, 5, 0, Math.PI * 2);
      ctx.arc(20, -10, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px serif';
      ctx.textAlign = 'center';
      ctx.fillText(monster.name, 0, -size - 20);

      const hpPercent = monster.hp / monster.maxHp;
      ctx.fillStyle = '#333';
      ctx.fillRect(-50, -size - 40, 100, 10);
      ctx.fillStyle = hpPercent > 0.5 ? '#00ff00' : hpPercent > 0.25 ? '#ffff00' : '#ff0000';
      ctx.fillRect(-50, -size - 40, 100 * hpPercent, 10);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.strokeRect(-50, -size - 40, 100, 10);

      ctx.restore();
    }

    ctx.save();
    ctx.translate(CANVAS_WIDTH * 0.25, CANVAS_HEIGHT * 0.5);

    const hero = gameState.hero;
    const heroScale = 2.5;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(0, 70, 50, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    const swordAngle = hero.isAttacking ? -Math.PI / 3 + (hero.attackFrame / 6) * Math.PI * 0.8 : 0;
    ctx.save();
    ctx.translate(30 * heroScale / 3, -10);
    ctx.rotate(swordAngle);
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(-3, -80, 6, 80);
    ctx.fillStyle = '#8b7355';
    ctx.fillRect(-8, -8, 16, 10);
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(-5, 0, 10, 5);
    ctx.restore();

    const bodyGradient = ctx.createLinearGradient(-20, -30, 20, 40);
    bodyGradient.addColorStop(0, '#6b4c9a');
    bodyGradient.addColorStop(1, '#4a3666');
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.roundRect(-20, -10, 40, 50, 8);
    ctx.fill();

    ctx.fillStyle = '#f0d9b5';
    ctx.beginPath();
    ctx.arc(0, -25, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(0, -30, 15, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-15, -30, 30, 5);

    ctx.fillStyle = '#2d1f47';
    ctx.fillRect(-8, -26, 5, 5);
    ctx.fillRect(3, -26, 5, 5);

    ctx.fillStyle = '#4a3666';
    ctx.fillRect(-15, 35, 10, 15);
    ctx.fillRect(5, 35, 10, 15);

    ctx.restore();

    if (gameState.combat.showLoot) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const lootX = CANVAS_WIDTH / 2;
      const lootY = CANVAS_HEIGHT / 2 - 50;

      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 28px serif';
      ctx.textAlign = 'center';
      ctx.fillText('🏆 战利品', lootX, lootY - 60);

      const drops = gameState.combat.drops;
      const startX = lootX - (drops.length * 50 - 10) / 2;

      for (let i = 0; i < drops.length; i++) {
        const item = drops[i];
        const ix = startX + i * 50;
        const iy = lootY;

        const rarityColors: Record<string, string> = {
          common: '#9d9d9d',
          rare: '#4169e1',
          epic: '#9932cc',
          legendary: '#ffd700',
        };

        ctx.fillStyle = '#1a0f2e';
        ctx.fillRect(ix - 20, iy - 20, 40, 40);
        ctx.strokeStyle = rarityColors[item.rarity];
        ctx.lineWidth = 2;
        ctx.strokeRect(ix - 20, iy - 20, 40, 40);

        ctx.fillStyle = rarityColors[item.rarity];
        ctx.font = '20px serif';
        ctx.textAlign = 'center';
        const icons: Record<string, string> = { weapon: '⚔️', shield: '🛡️', potion: '🧪' };
        ctx.fillText(icons[item.type] || '📦', ix, iy + 7);
      }

      ctx.fillStyle = '#d4af37';
      ctx.font = '18px serif';
      ctx.fillText('按 空格 拾取战利品', lootX, lootY + 80);
    }
  }, [gameState.combat, gameState.hero]);

  const drawGameOver = useCallback((ctx: CanvasRenderingContext2D) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#1a0000');
    gradient.addColorStop(1, '#0a0000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#8b0000';
    ctx.font = 'bold 48px serif';
    ctx.textAlign = 'center';
    ctx.fillText('💀 游戏结束 💀', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

    ctx.fillStyle = '#d4af37';
    ctx.font = '20px serif';
    ctx.fillText(`你到达了第 ${gameState.floor} 层`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    ctx.fillText('按 R 键重新开始', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
  }, [gameState.floor]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0612';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (gameState.scene === 'exploration') {
      const offset = getCameraOffset();

      for (let y = 0; y < gameState.map.height; y++) {
        for (let x = 0; x < gameState.map.width; x++) {
          const tile = gameState.map.tiles[y][x];
          drawTile(ctx, x, y, tile.type, tile.visible, tile.explored, offset.x, offset.y);
        }
      }

      for (const chest of gameState.chests) {
        drawChest(ctx, chest, offset.x, offset.y);
      }

      for (const monster of gameState.monsters) {
        drawMonster(ctx, monster, offset.x, offset.y);
      }

      drawHero(ctx, offset.x, offset.y);
      drawParticles(ctx, offset.x, offset.y);
    } else if (gameState.scene === 'combat') {
      drawCombatScene(ctx);
    } else if (gameState.scene === 'gameOver') {
      drawGameOver(ctx);
    }
  }, [
    gameState,
    getCameraOffset,
    drawTile,
    drawHero,
    drawMonster,
    drawChest,
    drawParticles,
    drawCombatScene,
    drawGameOver,
  ]);

  useEffect(() => {
    let animationId: number;
    const loop = () => {
      render();
      animationId = requestAnimationFrame(loop);
    };
    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [render]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.scene === 'gameOver') {
        if (e.key.toLowerCase() === 'r') {
          window.location.reload();
        }
        return;
      }

      if (gameState.scene === 'combat') {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          if (gameState.combat.showLoot) {
            onCollectLoot();
          } else if (gameState.combat.turn === 'hero' && !gameState.combat.isAnimating) {
            onAttack();
          }
        } else if (e.key.toLowerCase() === 'f') {
          if (!gameState.combat.showLoot) {
            onFlee();
          }
        }
        return;
      }

      if (e.repeat) return;

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          onMove(0, -1);
          break;
        case 's':
        case 'arrowdown':
          onMove(0, 1);
          break;
        case 'a':
        case 'arrowleft':
          onMove(-1, 0);
          break;
        case 'd':
        case 'arrowright':
          onMove(1, 0);
          break;
        case ' ':
        case 'e':
          e.preventDefault();
          onInteract();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, onMove, onInteract, onAttack, onFlee, onCollectLoot]);

  useEffect(() => {
    let moveInterval: number | null = null;

    const checkMovement = () => {
      const now = Date.now();
      if (now - lastMoveRef.current < 100) return;

      let dx = 0, dy = 0;
      if (keysRef.current.has('w') || keysRef.current.has('arrowup')) dy = -1;
      else if (keysRef.current.has('s') || keysRef.current.has('arrowdown')) dy = 1;
      else if (keysRef.current.has('a') || keysRef.current.has('arrowleft')) dx = -1;
      else if (keysRef.current.has('d') || keysRef.current.has('arrowright')) dx = 1;

      if (dx !== 0 || dy !== 0) {
        onMove(dx, dy);
        lastMoveRef.current = now;
      }
    };

    moveInterval = window.setInterval(checkMovement, 50);

    return () => {
      if (moveInterval) clearInterval(moveInterval);
    };
  }, [onMove]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameState.scene !== 'exploration') return;
    const touch = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    if (x < rect.width / 2) {
      setVirtualJoystickActive(true);
      setJoystickStart({ x, y });
      setJoystickPos({ x, y });
    } else {
      onInteract();
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!virtualJoystickActive) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const dx = x - joystickStart.x;
    const dy = y - joystickStart.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 50;

    if (distance > maxDistance) {
      const ratio = maxDistance / distance;
      setJoystickPos({
        x: joystickStart.x + dx * ratio,
        y: joystickStart.y + dy * ratio,
      });
    } else {
      setJoystickPos({ x, y });
    }

    if (distance > 20) {
      const angle = Math.atan2(dy, dx);
      let moveDx = 0, moveDy = 0;

      if (Math.abs(dx) > Math.abs(dy)) {
        moveDx = dx > 0 ? 1 : -1;
      } else {
        moveDy = dy > 0 ? 1 : -1;
      }

      const now = Date.now();
      if (now - lastMoveRef.current > 150) {
        onMove(moveDx, moveDy);
        lastMoveRef.current = now;
      }
    }
  };

  const handleTouchEnd = () => {
    setVirtualJoystickActive(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          display: 'block',
          maxWidth: '100%',
          maxHeight: '100%',
          borderRadius: '8px',
          boxShadow: '0 0 30px rgba(107, 76, 154, 0.5)',
          border: '2px solid #6b4c9a',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      {virtualJoystickActive && (
        <>
          <div
            style={{
              position: 'absolute',
              left: joystickStart.x - 50,
              top: joystickStart.y - 50,
              width: 100,
              height: 100,
              borderRadius: '50%',
              border: '2px solid rgba(212, 175, 55, 0.5)',
              backgroundColor: 'rgba(107, 76, 154, 0.2)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: joystickPos.x - 25,
              top: joystickPos.y - 25,
              width: 50,
              height: 50,
              borderRadius: '50%',
              backgroundColor: 'rgba(212, 175, 55, 0.6)',
              pointerEvents: 'none',
            }}
          />
        </>
      )}
    </div>
  );
};
