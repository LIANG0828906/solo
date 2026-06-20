import { useRef, useEffect, useState, useCallback } from 'react';
import { useGameStore } from './store/useGameStore';
import { getRoomAt } from './mapGenerator';
import type { Room, DungeonMap } from './types';

const CANVAS_SIZE = 600;
const PLAYER_RADIUS = 12;
const CORRIDOR_SPEED = 200;
const ROOM_SPEED = 300;

const COLORS = {
  wall: '#3E2723',
  room: '#D3D3D3',
  corridor: '#B0B0B0',
  player: '#1565C0',
  playerGlow: '#42A5F5',
  unexplored: '#2A2A2A',
  roomBorder: '#9E9E9E',
};

export function GameBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const moveStartTimeRef = useRef<number>(0);
  const moveDurationRef = useRef<number>(0);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isAnimatingRef = useRef<boolean>(false);

  const [hoveredRoom, setHoveredRoom] = useState<Room | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const { map, player, movePlayer, setMoving, gameStatus, showEventModal } = useGameStore(
    (state) => ({
      map: state.map,
      player: state.player,
      movePlayer: state.movePlayer,
      setMoving: state.setMoving,
      gameStatus: state.gameStatus,
      showEventModal: state.showEventModal,
    })
  );

  const getCellSize = useCallback((): number => {
    if (!map) return 0;
    return Math.floor(CANVAS_SIZE / Math.max(map.width, map.height));
  }, [map]);

  const getOffset = useCallback((): { x: number; y: number } => {
    if (!map) return { x: 0, y: 0 };
    const cellSize = getCellSize();
    const mapPixelWidth = map.width * cellSize;
    const mapPixelHeight = map.height * cellSize;
    return {
      x: (CANVAS_SIZE - mapPixelWidth) / 2,
      y: (CANVAS_SIZE - mapPixelHeight) / 2,
    };
  }, [map, getCellSize]);

  const drawMap = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (!map) return;

      const cellSize = getCellSize();
      const offset = getOffset();

      ctx.fillStyle = '#1A1A1A';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          const cellType = map.grid[y][x];
          const px = offset.x + x * cellSize;
          const py = offset.y + y * cellSize;

          if (cellType === 'wall') {
            ctx.fillStyle = COLORS.wall;
            ctx.fillRect(px, py, cellSize, cellSize);
          } else if (cellType === 'room') {
            const room = getRoomAt(map, x, y);
            if (room && room.explored) {
              ctx.fillStyle = COLORS.room;
            } else {
              ctx.fillStyle = COLORS.unexplored;
            }
            ctx.fillRect(px, py, cellSize, cellSize);
          } else if (cellType === 'corridor') {
            ctx.fillStyle = COLORS.corridor;
            ctx.fillRect(px, py, cellSize, cellSize);
          }
        }
      }

      ctx.strokeStyle = '#1A1A1A';
      ctx.lineWidth = 1;
      for (let y = 0; y <= map.height; y++) {
        ctx.beginPath();
        ctx.moveTo(offset.x, offset.y + y * cellSize);
        ctx.lineTo(offset.x + map.width * cellSize, offset.y + y * cellSize);
        ctx.stroke();
      }
      for (let x = 0; x <= map.width; x++) {
        ctx.beginPath();
        ctx.moveTo(offset.x + x * cellSize, offset.y);
        ctx.lineTo(offset.x + x * cellSize, offset.y + map.height * cellSize);
        ctx.stroke();
      }
    },
    [map, getCellSize, getOffset]
  );

  const drawPlayer = useCallback(
    (ctx: CanvasRenderingContext2D, renderX: number, renderY: number) => {
      if (!map) return;

      const cellSize = getCellSize();
      const offset = getOffset();

      const px = offset.x + (renderX + 0.5) * cellSize;
      const py = offset.y + (renderY + 0.5) * cellSize;

      const gradient = ctx.createRadialGradient(px, py, 0, px, py, PLAYER_RADIUS * 2);
      gradient.addColorStop(0, 'rgba(66, 165, 245, 0.3)');
      gradient.addColorStop(1, 'rgba(66, 165, 245, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(px, py, PLAYER_RADIUS * 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = COLORS.player;
      ctx.beginPath();
      ctx.arc(px, py, PLAYER_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = COLORS.playerGlow;
      ctx.beginPath();
      ctx.arc(px - 3, py - 3, 4, 0, Math.PI * 2);
      ctx.fill();
    },
    [map, getCellSize, getOffset]
  );

  const render = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !map) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let renderX = player.renderX;
      let renderY = player.renderY;

      if (isAnimatingRef.current) {
        const elapsed = timestamp - moveStartTimeRef.current;
        const progress = Math.min(elapsed / moveDurationRef.current, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        renderX = startPosRef.current.x + (targetPosRef.current.x - startPosRef.current.x) * easeProgress;
        renderY = startPosRef.current.y + (targetPosRef.current.y - startPosRef.current.y) * easeProgress;

        if (progress >= 1) {
          isAnimatingRef.current = false;
          setMoving(false);
          renderX = targetPosRef.current.x;
          renderY = targetPosRef.current.y;
        }
      }

      drawMap(ctx);
      drawPlayer(ctx, renderX, renderY);

      if (isAnimatingRef.current) {
        animationRef.current = requestAnimationFrame(render);
      }
    },
    [map, player.renderX, player.renderY, drawMap, drawPlayer, setMoving]
  );

  const startMoveAnimation = useCallback(
    (fromX: number, fromY: number, toX: number, toY: number) => {
      if (!map) return;

      const cellType = map.grid[toY][toX];
      const duration = cellType === 'corridor' ? CORRIDOR_SPEED : ROOM_SPEED;

      startPosRef.current = { x: fromX, y: fromY };
      targetPosRef.current = { x: toX, y: toY };
      moveStartTimeRef.current = performance.now();
      moveDurationRef.current = duration;
      isAnimatingRef.current = true;

      animationRef.current = requestAnimationFrame(render);
    },
    [map, render]
  );

  useEffect(() => {
    if (player.isMoving && !isAnimatingRef.current) {
      startMoveAnimation(player.renderX, player.renderY, player.x, player.y);
    }
  }, [player.isMoving, player.x, player.y, player.renderX, player.renderY, startMoveAnimation]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !map) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawMap(ctx);
    drawPlayer(ctx, player.renderX, player.renderY);
  }, [map, drawMap, drawPlayer, player.renderX, player.renderY]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatus !== 'playing' || showEventModal) return;
      if (player.isMoving || isAnimatingRef.current) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          movePlayer('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          movePlayer('down');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          movePlayer('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          movePlayer('right');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus, showEventModal, player.isMoving, movePlayer]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!map) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    const cellSize = getCellSize();
    const offset = getOffset();

    const gridX = Math.floor((mouseX - offset.x) / cellSize);
    const gridY = Math.floor((mouseY - offset.y) / cellSize);

    if (
      gridX >= 0 &&
      gridX < map.width &&
      gridY >= 0 &&
      gridY < map.height
    ) {
      const room = getRoomAt(map, gridX, gridY);
      if (room && room.explored) {
        setHoveredRoom(room);
      } else {
        setHoveredRoom(null);
      }
    } else {
      setHoveredRoom(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredRoom(null);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="game-board-wrapper">
      <div className="game-board-container">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="game-canvas"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        {hoveredRoom && (
          <div
            className="room-tooltip"
            style={{
              left: mousePos.x + 10,
              top: mousePos.y + 10,
            }}
          >
            <p>{hoveredRoom.eventTriggered ? '已触发事件' : '尚未触发事件'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
