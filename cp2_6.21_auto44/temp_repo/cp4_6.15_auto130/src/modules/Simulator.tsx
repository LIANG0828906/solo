import React, { useState, useEffect, useRef, useCallback } from 'react';
import { findPath, buildWalkableGrid, type PathPoint } from './Pathfinder';
import {
  TILE_DEFS,
  GRID_WIDTH,
  GRID_HEIGHT,
  type PlacedTile,
  type CollisionRect,
  type NPCData,
} from '../data/sampleMap';

interface SimulatorProps {
  tiles: PlacedTile[];
  collisions: CollisionRect[];
  npcs: NPCData[];
  isPlaying: boolean;
  playerPos: { x: number; y: number };
  activeDialog: { npcId: string; text: string } | null;
  onPlayerMove: (pos: { x: number; y: number }) => void;
  onPlayerMovingChange: (moving: boolean) => void;
  onPlayerDirectionChange: (dir: 'up' | 'down' | 'left' | 'right') => void;
  onDialogShow: (dialog: { npcId: string; text: string } | null) => void;
  onBlockedCellsChange: (cells: Set<string>) => void;
  onRequestMoveToTarget: (targetX: number, targetY: number, isNpcTarget?: string) => void;
}

interface TypewriterProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

const Typewriter: React.FC<TypewriterProps> = ({ text, speed = 40, onComplete }) => {
  const [displayed, setDisplayed] = useState('');
  const [complete, setComplete] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed('');
    setComplete(false);
    indexRef.current = 0;

    if (!text) {
      setComplete(true);
      onComplete?.();
      return;
    }

    const interval = setInterval(() => {
      indexRef.current += 1;
      if (indexRef.current >= text.length) {
        setDisplayed(text);
        setComplete(true);
        clearInterval(interval);
        onComplete?.();
      } else {
        setDisplayed(text.slice(0, indexRef.current));
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  const skipToEnd = useCallback(() => {
    if (!complete) {
      setDisplayed(text);
      setComplete(true);
      indexRef.current = text.length;
      onComplete?.();
    }
  }, [complete, text, onComplete]);

  return (
    <span onClick={skipToEnd} style={{ cursor: complete ? 'default' : 'pointer' }}>
      {displayed}
      {!complete && <span style={{ opacity: 0.6 }}>|</span>}
    </span>
  );
};

export const Simulator: React.FC<SimulatorProps> = ({
  tiles,
  collisions,
  npcs,
  isPlaying,
  playerPos,
  activeDialog,
  onPlayerMove,
  onPlayerMovingChange,
  onPlayerDirectionChange,
  onDialogShow,
  onBlockedCellsChange,
  onRequestMoveToTarget,
}) => {
  const pathRef = useRef<PathPoint[]>([]);
  const pathIndexRef = useRef(0);
  const moveIntervalRef = useRef<number | null>(null);
  const pendingNpcTargetRef = useRef<string | null>(null);
  const [typewriterComplete, setTypewriterComplete] = useState(false);

  const walkableGrid = buildWalkableGrid(
    tiles,
    collisions,
    npcs,
    TILE_DEFS,
    GRID_WIDTH,
    GRID_HEIGHT
  );

  const updateBlockedCells = useCallback(() => {
    const blocked = new Set<string>();
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        if (!walkableGrid[y][x]) {
          blocked.add(`${x},${y}`);
        }
      }
    }
    onBlockedCellsChange(blocked);
  }, [walkableGrid, onBlockedCellsChange]);

  useEffect(() => {
    updateBlockedCells();
  }, [updateBlockedCells]);

  const findNpcAdjacentCell = useCallback(
    (npcX: number, npcY: number): PathPoint | null => {
      const directions = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
      ];
      for (const { dx, dy } of directions) {
        const nx = npcX + dx;
        const ny = npcY + dy;
        if (
          nx >= 0 && nx < GRID_WIDTH &&
          ny >= 0 && ny < GRID_HEIGHT &&
          walkableGrid[ny][nx]
        ) {
          return { x: nx, y: ny };
        }
      }
      return null;
    },
    [walkableGrid]
  );

  const computeDirection = useCallback(
    (from: PathPoint, to: PathPoint): 'up' | 'down' | 'left' | 'right' => {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      if (dx > 0) return 'right';
      if (dx < 0) return 'left';
      if (dy > 0) return 'down';
      return 'up';
    },
    []
  );

  const startPathMovement = useCallback(
    (path: PathPoint[]) => {
      if (path.length <= 1) return;

      pathRef.current = path;
      pathIndexRef.current = 1;
      onPlayerMovingChange(true);

      if (moveIntervalRef.current) {
        clearInterval(moveIntervalRef.current);
      }

      moveIntervalRef.current = window.setInterval(() => {
        if (pathIndexRef.current >= pathRef.current.length) {
          if (moveIntervalRef.current) {
            clearInterval(moveIntervalRef.current);
            moveIntervalRef.current = null;
          }
          onPlayerMovingChange(false);

          if (pendingNpcTargetRef.current) {
            const npcId = pendingNpcTargetRef.current;
            const npc = npcs.find((n) => n.id === npcId);
            if (npc) {
              onDialogShow({ npcId: npc.id, text: npc.dialog });
            }
            pendingNpcTargetRef.current = null;
          }
          return;
        }

        const current = pathRef.current[pathIndexRef.current - 1];
        const next = pathRef.current[pathIndexRef.current];
        const dir = computeDirection(current, next);
        onPlayerDirectionChange(dir);
        onPlayerMove({ x: next.x, y: next.y });
        pathIndexRef.current += 1;
      }, 160);
    },
    [computeDirection, npcs, onDialogShow, onPlayerDirectionChange, onPlayerMove, onPlayerMovingChange]
  );

  const handleMoveToTarget = useCallback(
    (targetX: number, targetY: number, isNpcTarget?: string) => {
      const start = { x: playerPos.x, y: playerPos.y };
      const end = { x: targetX, y: targetY };

      if (isNpcTarget) {
        const npc = npcs.find((n) => n.id === isNpcTarget);
        if (npc) {
          const adjacent = findNpcAdjacentCell(npc.x, npc.y);
          if (!adjacent) return;

          const pathToAdjacent = findPath(walkableGrid, start, adjacent);
          if (pathToAdjacent.length > 0) {
            pendingNpcTargetRef.current = isNpcTarget;
            startPathMovement(pathToAdjacent);
          }
          return;
        }
      }

      const path = findPath(walkableGrid, start, end);
      if (path.length > 0) {
        pendingNpcTargetRef.current = null;
        startPathMovement(path);
      }
    },
    [playerPos, npcs, walkableGrid, findNpcAdjacentCell, startPathMovement]
  );

  useEffect(() => {
    (window as unknown as { __requestMove?: typeof handleMoveToTarget }).__requestMove = handleMoveToTarget;
    return () => {
      delete (window as unknown as { __requestMove?: typeof handleMoveToTarget }).__requestMove;
    };
  }, [handleMoveToTarget]);

  useEffect(() => {
    const handler = (window as unknown as { __moveToTargetHandler?: typeof onRequestMoveToTarget }).__moveToTargetHandler;
    if (handler) {
      (window as unknown as { __moveToTargetHandler?: typeof onRequestMoveToTarget }).__moveToTargetHandler = onRequestMoveToTarget;
    }
  }, [onRequestMoveToTarget]);

  useEffect(() => {
    if (!isPlaying) {
      if (moveIntervalRef.current) {
        clearInterval(moveIntervalRef.current);
        moveIntervalRef.current = null;
      }
      onPlayerMovingChange(false);
      pathRef.current = [];
      pathIndexRef.current = 0;
      pendingNpcTargetRef.current = null;
      return;
    }

    const keysPressed = new Set<string>();
    let lastMoveTime = 0;
    const MOVE_DELAY = 150;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (key === 'e') {
        return;
      }

      if (key === ' ') {
        e.preventDefault();
        if (activeDialog) {
          if (!typewriterComplete) {
            return;
          }
          onDialogShow(null);
          return;
        }

        const directions = [
          { dx: 0, dy: -1, dir: 'up' },
          { dx: 0, dy: 1, dir: 'down' },
          { dx: -1, dy: 0, dir: 'left' },
          { dx: 1, dy: 0, dir: 'right' },
        ];
        for (const { dx, dy, dir } of directions) {
          const nx = playerPos.x + dx;
          const ny = playerPos.y + dy;
          const npc = npcs.find((n) => n.x === nx && n.y === ny);
          if (npc) {
            onPlayerDirectionChange(dir);
            onDialogShow({ npcId: npc.id, text: npc.dialog });
            return;
          }
        }
        return;
      }

      if (['w', 'a', 's', 'd'].includes(key)) {
        keysPressed.add(key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.delete(e.key.toLowerCase());
    };

    const tick = () => {
      if (!isPlaying) return;

      const now = Date.now();
      if (now - lastMoveTime >= MOVE_DELAY && !activeDialog) {
        let dx = 0;
        let dy = 0;

        if (keysPressed.has('w')) dy -= 1;
        if (keysPressed.has('s')) dy += 1;
        if (keysPressed.has('a')) dx -= 1;
        if (keysPressed.has('d')) dx += 1;

        if (dx !== 0 || dy !== 0) {
          if (dx !== 0 && dy !== 0) dy = 0;

          const newX = playerPos.x + dx;
          const newY = playerPos.y + dy;

          if (
            newX >= 0 && newX < GRID_WIDTH &&
            newY >= 0 && newY < GRID_HEIGHT &&
            walkableGrid[newY][newX]
          ) {
            let dir: 'up' | 'down' | 'left' | 'right' = 'down';
            if (dx > 0) dir = 'right';
            else if (dx < 0) dir = 'left';
            else if (dy > 0) dir = 'down';
            else if (dy < 0) dir = 'up';

            onPlayerDirectionChange(dir);
            onPlayerMove({ x: newX, y: newY });
            onPlayerMovingChange(true);
            lastMoveTime = now;
          }
        } else {
          onPlayerMovingChange(false);
        }
      }

      requestAnimationFrame(tick);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    const rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(rafId);
    };
  }, [isPlaying, playerPos, walkableGrid, npcs, activeDialog, typewriterComplete, onDialogShow, onPlayerDirectionChange, onPlayerMove, onPlayerMovingChange]);

  useEffect(() => {
    return () => {
      if (moveIntervalRef.current) {
        clearInterval(moveIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setTypewriterComplete(false);
  }, [activeDialog?.text]);

  if (!activeDialog) return null;

  const npc = npcs.find((n) => n.id === activeDialog.npcId);

  return (
    <div className="dialog-overlay">
      <div className="dialog-bubble">
        <div className="dialog-speaker">
          {npc ? '📜 NPC 对话' : '📜 对话'}
        </div>
        <div className="dialog-text">
          <Typewriter
            text={activeDialog.text}
            speed={35}
            onComplete={() => setTypewriterComplete(true)}
          />
        </div>
        <div className="dialog-hint">
          {typewriterComplete ? '按 空格键 或 点击 关闭对话' : '点击跳过 · 按 空格 关闭'}
        </div>
      </div>
    </div>
  );
};

export default Simulator;
