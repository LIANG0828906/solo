import { useRef, useEffect, useCallback, useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { bfsPath, canMove, movePlayer, updateMonsterAI, checkBattle, checkWin } from "@/game/GameEngine";
import { MAZE_SIZE, PATH } from "@/game/MazeGenerator";
import type { Position, Monster } from "@/types/game";
import confetti from "canvas-confetti";

const CELL_SIZE = 32;

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: MAZE_SIZE * CELL_SIZE, height: MAZE_SIZE * CELL_SIZE });
  const [cellSize, setCellSize] = useState(CELL_SIZE);

  const map = useGameStore((s) => s.map);
  const player = useGameStore((s) => s.player);
  const playerHP = useGameStore((s) => s.playerHP);
  const monsters = useGameStore((s) => s.monsters);
  const gameOver = useGameStore((s) => s.gameOver);
  const gameWon = useGameStore((s) => s.gameWon);
  const autoPath = useGameStore((s) => s.autoPath);
  const autoPathIndex = useGameStore((s) => s.autoPathIndex);
  const explosions = useGameStore((s) => s.explosions);
  const damageNumbers = useGameStore((s) => s.damageNumbers);
  const pathHighlights = useGameStore((s) => s.pathHighlights);

  const setPlayer = useGameStore((s) => s.setPlayer);
  const setAutoPath = useGameStore((s) => s.setAutoPath);
  const advanceAutoPath = useGameStore((s) => s.advanceAutoPath);
  const clearAutoPath = useGameStore((s) => s.clearAutoPath);
  const damagePlayer = useGameStore((s) => s.damagePlayer);
  const killMonster = useGameStore((s) => s.killMonster);
  const addBattleLog = useGameStore((s) => s.addBattleLog);
  const addExplosion = useGameStore((s) => s.addExplosion);
  const addDamageNumber = useGameStore((s) => s.addDamageNumber);
  const addPathHighlight = useGameStore((s) => s.addPathHighlight);
  const removePathHighlights = useGameStore((s) => s.removePathHighlights);
  const updateMonsters = useGameStore((s) => s.updateMonsters);
  const setGameWon = useGameStore((s) => s.setGameWon);
  const setGameOver = useGameStore((s) => s.setGameOver);

  const lastMoveTime = useRef(0);
  const lastMonsterMoveTime = useRef(0);
  const lastAutoMoveTime = useRef(0);
  const animFrameRef = useRef(0);
  const confettiFired = useRef(false);
  const battleCooldown = useRef<Set<string>>(new Set());

  useEffect(() => {
    function handleResize() {
      if (!containerRef.current) return;
      const containerW = containerRef.current.clientWidth;
      const maxSize = Math.min(containerW, window.innerHeight - 80);
      const cs = Math.floor(maxSize / MAZE_SIZE);
      const clamped = Math.max(cs, 16);
      setCellSize(clamped);
      setCanvasSize({ width: clamped * MAZE_SIZE, height: clamped * MAZE_SIZE });
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleBattle = useCallback(
    (monsterId: string) => {
      if (battleCooldown.current.has(monsterId)) return;
      battleCooldown.current.add(monsterId);
      setTimeout(() => battleCooldown.current.delete(monsterId), 500);

      const monster = useGameStore.getState().monsters.find((m) => m.id === monsterId);
      if (!monster) return;

      damagePlayer(20);
      killMonster(monsterId);
      addBattleLog(`与怪物战斗，损失20生命`);
      addExplosion({ ...monster.position });
      addDamageNumber({ ...monster.position }, 20);
    },
    [damagePlayer, killMonster, addBattleLog, addExplosion, addDamageNumber]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = useGameStore.getState();
      if (state.gameOver || state.gameWon) return;

      const now = Date.now();
      if (now - lastMoveTime.current < 180) return;

      let dx = 0;
      let dy = 0;
      switch (e.key.toLowerCase()) {
        case "w": dy = -1; break;
        case "s": dy = 1; break;
        case "a": dx = -1; break;
        case "d": dx = 1; break;
        default: return;
      }

      e.preventDefault();
      clearAutoPath();

      const newPos = movePlayer(state.map, state.player, dx, dy);
      if (newPos.x !== state.player.x || newPos.y !== state.player.y) {
        lastMoveTime.current = now;
        setPlayer(newPos);

        const monsterId = checkBattle(newPos, state.monsters);
        if (monsterId) handleBattle(monsterId);

        if (checkWin(newPos)) {
          setGameWon(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clearAutoPath, setPlayer, handleBattle, setGameWon]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const state = useGameStore.getState();
      if (state.gameOver || state.gameWon) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const cx = Math.floor(((e.clientX - rect.left) * scaleX) / cellSize);
      const cy = Math.floor(((e.clientY - rect.top) * scaleY) / cellSize);

      if (cx < 0 || cx >= MAZE_SIZE || cy < 0 || cy >= MAZE_SIZE) return;
      if (state.map[cy][cx] !== PATH) return;

      const path = bfsPath(state.map, state.player, { x: cx, y: cy });
      if (path.length > 0) {
        setAutoPath(path);
      }
    },
    [cellSize, setAutoPath]
  );

  useEffect(() => {
    if (gameWon && !confettiFired.current) {
      confettiFired.current = true;
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#ffd700", "#ff6b6b", "#48dbfb", "#ff9ff3", "#54a0ff"],
      });
    }
    if (!gameWon) {
      confettiFired.current = false;
    }
  }, [gameWon]);

  useEffect(() => {
    let lastFrameTime = 0;

    function gameLoop(timestamp: number) {
      const delta = timestamp - lastFrameTime;
      if (delta < 33) {
        animFrameRef.current = requestAnimationFrame(gameLoop);
        return;
      }
      lastFrameTime = timestamp;

      const state = useGameStore.getState();
      if (state.gameOver || state.gameWon) {
        animFrameRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      const now = Date.now();

      if (state.autoPath.length > 0 && state.autoPathIndex < state.autoPath.length) {
        const stepDuration = state.autoPath.length > 10 ? 100 : 200;
        if (now - lastAutoMoveTime.current >= stepDuration) {
          lastAutoMoveTime.current = now;
          const nextPos = state.autoPath[state.autoPathIndex];
          addPathHighlight(nextPos);
          setPlayer(nextPos);
          advanceAutoPath();

          const monsterId = checkBattle(nextPos, state.monsters);
          if (monsterId) handleBattle(monsterId);

          if (checkWin(nextPos)) {
            setGameWon(true);
            clearAutoPath();
          }

          if (state.autoPathIndex + 1 >= state.autoPath.length) {
            setTimeout(() => {
              removePathHighlights();
              clearAutoPath();
            }, 300);
          }
        }
      }

      const aiInterval = 300;
      if (now - lastMonsterMoveTime.current >= aiInterval) {
        lastMonsterMoveTime.current = now;

        const updatedMonsters: Monster[] = state.monsters.map((m) => {
          if (m.mode === "chase") {
            const chaseState = updateMonsterAI(m, state.player, state.map);
            if (now - lastMonsterMoveTime.current >= 150 || true) {
              return chaseState;
            }
            return m;
          }
          return updateMonsterAI(m, state.player, state.map);
        });

        updateMonsters(updatedMonsters);

        const newMonsterId = checkBattle(state.player, updatedMonsters);
        if (newMonsterId) handleBattle(newMonsterId);
      }

      animFrameRef.current = requestAnimationFrame(gameLoop);
    }

    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [
    setPlayer,
    advanceAutoPath,
    addPathHighlight,
    removePathHighlights,
    clearAutoPath,
    handleBattle,
    setGameWon,
    updateMonsters,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cs = cellSize;
    const now = Date.now();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < MAZE_SIZE; y++) {
      for (let x = 0; x < MAZE_SIZE; x++) {
        ctx.fillStyle = map[y][x] === 1 ? "#3a3a5c" : "#1a1a2e";
        ctx.fillRect(x * cs, y * cs, cs, cs);
      }
    }

    const exitPulse = 1.0 + 0.2 * Math.sin(now / 250);
    const exitX = (MAZE_SIZE - 1) * cs + cs / 2;
    const exitY = (MAZE_SIZE - 1) * cs + cs / 2;
    const exitRadius = cs * 0.45 * exitPulse;

    const exitGlow = ctx.createRadialGradient(exitX, exitY, 0, exitX, exitY, exitRadius);
    exitGlow.addColorStop(0, "rgba(255, 215, 0, 0.9)");
    exitGlow.addColorStop(0.5, "rgba(255, 215, 0, 0.4)");
    exitGlow.addColorStop(1, "rgba(255, 215, 0, 0)");
    ctx.fillStyle = exitGlow;
    ctx.beginPath();
    ctx.arc(exitX, exitY, exitRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(exitX, exitY, cs * 0.3, 0, Math.PI * 2);
    ctx.stroke();

    pathHighlights.forEach((ph) => {
      const age = now - ph.createdAt;
      const alpha = Math.max(0, 1 - age / 300);
      ctx.fillStyle = `rgba(100, 160, 255, ${alpha * 0.5})`;
      ctx.fillRect(ph.position.x * cs, ph.position.y * cs, cs, cs);
    });

    if (autoPath.length > 0) {
      autoPath.forEach((pos, i) => {
        if (i >= autoPathIndex) {
          ctx.fillStyle = "rgba(100, 160, 255, 0.2)";
          ctx.fillRect(pos.x * cs, pos.y * cs, cs, cs);
        }
      });
    }

    const px = player.x * cs + cs / 2;
    const py = player.y * cs + cs / 2;

    const playerGlow = ctx.createRadialGradient(px, py, 0, px, py, cs * 0.8);
    playerGlow.addColorStop(0, "rgba(72, 152, 255, 0.6)");
    playerGlow.addColorStop(0.5, "rgba(72, 152, 255, 0.2)");
    playerGlow.addColorStop(1, "rgba(72, 152, 255, 0)");
    ctx.fillStyle = playerGlow;
    ctx.beginPath();
    ctx.arc(px, py, cs * 0.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#4898ff";
    ctx.beginPath();
    ctx.arc(px, py, cs * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#8ec5ff";
    ctx.beginPath();
    ctx.arc(px - cs * 0.1, py - cs * 0.1, cs * 0.12, 0, Math.PI * 2);
    ctx.fill();

    monsters.forEach((m) => {
      if (!m.alive) return;
      const mx = m.position.x * cs + cs / 2;
      const my = m.position.y * cs + cs / 2;
      const triSize = cs * 0.38;

      if (m.mode === "chase") {
        const chaseGlow = ctx.createRadialGradient(mx, my, 0, mx, my, cs * 0.6);
        chaseGlow.addColorStop(0, "rgba(230, 57, 70, 0.4)");
        chaseGlow.addColorStop(1, "rgba(230, 57, 70, 0)");
        ctx.fillStyle = chaseGlow;
        ctx.beginPath();
        ctx.arc(mx, my, cs * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "#e63946";
      ctx.beginPath();
      ctx.moveTo(mx, my - triSize);
      ctx.lineTo(mx - triSize, my + triSize * 0.7);
      ctx.lineTo(mx + triSize, my + triSize * 0.7);
      ctx.closePath();
      ctx.fill();

      if (m.mode === "chase") {
        ctx.fillStyle = "#ff6b6b";
        ctx.beginPath();
        ctx.moveTo(mx, my - triSize * 0.5);
        ctx.lineTo(mx - triSize * 0.4, my + triSize * 0.3);
        ctx.lineTo(mx + triSize * 0.4, my + triSize * 0.3);
        ctx.closePath();
        ctx.fill();
      }
    });

    explosions.forEach((exp) => {
      const age = now - exp.createdAt;
      const progress = Math.min(age / 300, 1);
      const scale = progress * 1.5;
      const alpha = 1 - progress;

      const ex = exp.position.x * cs + cs / 2;
      const ey = exp.position.y * cs + cs / 2;
      const size = cs * 0.4 * scale;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = "#ff4444";
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.moveTo(ex - size, ey - size);
      ctx.lineTo(ex + size, ey + size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ex + size, ey - size);
      ctx.lineTo(ex - size, ey + size);
      ctx.stroke();

      ctx.strokeStyle = "#ff8888";
      ctx.lineWidth = 2 * scale;
      const innerSize = size * 0.6;
      ctx.beginPath();
      ctx.moveTo(ex - innerSize, ey);
      ctx.lineTo(ex + innerSize, ey);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ex, ey - innerSize);
      ctx.lineTo(ex, ey + innerSize);
      ctx.stroke();
      ctx.restore();
    });

    damageNumbers.forEach((dn) => {
      const age = now - dn.createdAt;
      if (age > 1000) return;
      const progress = age / 1000;
      const alpha = 1 - progress;
      const yOffset = progress * 40;

      const dx = dn.position.x * cs + cs / 2;
      const dy = dn.position.y * cs - 5 - yOffset;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${Math.floor(cs * 0.5)}px Quicksand`;
      ctx.textAlign = "center";
      ctx.fillStyle = "#ff4444";
      ctx.strokeStyle = "rgba(0,0,0,0.8)";
      ctx.lineWidth = 3;
      ctx.strokeText(`-${dn.value}`, dx, dy);
      ctx.fillText(`-${dn.value}`, dx, dy);
      ctx.restore();
    });

    if (gameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `bold ${Math.floor(cs * 1.5)}px Cinzel`;
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("梦境破碎", canvas.width / 2, canvas.height / 2 - cs);

      ctx.font = `${Math.floor(cs * 0.6)}px Quicksand`;
      ctx.fillStyle = "#aaaacc";
      ctx.fillText("生命值已耗尽...", canvas.width / 2, canvas.height / 2 + cs * 0.3);
    }

    if (gameWon) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `bold ${Math.floor(cs * 1.5)}px Cinzel`;
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffd700";
      ctx.fillText("逃离迷宫!", canvas.width / 2, canvas.height / 2 - cs);

      ctx.font = `${Math.floor(cs * 0.6)}px Quicksand`;
      ctx.fillStyle = "#ddddee";
      ctx.fillText("你找到了出口!", canvas.width / 2, canvas.height / 2 + cs * 0.3);
    }
  }, [map, player, playerHP, monsters, gameOver, gameWon, autoPath, autoPathIndex, explosions, damageNumbers, pathHighlights, cellSize]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center w-full"
      style={{
        background: "radial-gradient(circle, #2a2a5e 0%, #0d0d1a 70%)",
        borderRadius: "12px",
        padding: "16px",
      }}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onClick={handleCanvasClick}
        style={{
          display: "block",
          borderRadius: "8px",
          cursor: "crosshair",
          maxWidth: "100%",
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
}
