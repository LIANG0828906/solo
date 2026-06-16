import React, { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import { CharacterClass, Team, DamageType, Character } from '../game/CombatEngine';

const CELL_SIZE = 50;
const GRID_COLS = 12;
const GRID_ROWS = 8;
const CANVAS_WIDTH = GRID_COLS * CELL_SIZE;
const CANVAS_HEIGHT = GRID_ROWS * CELL_SIZE;

const PIXEL_ART: Record<CharacterClass, number[][]> = {
  [CharacterClass.Warrior]: [
    [0,0,0,1,1,1,1,0,0,0],
    [0,0,1,2,2,2,2,1,0,0],
    [0,1,2,2,3,3,2,2,1,0],
    [0,1,2,3,3,3,3,2,1,0],
    [0,0,1,2,2,2,2,1,0,0],
    [0,1,1,1,1,1,1,1,1,0],
    [1,1,0,1,4,4,1,0,1,1],
    [1,0,0,1,4,4,1,0,0,1],
  ],
  [CharacterClass.Archer]: [
    [0,0,0,1,1,1,1,0,0,0],
    [0,0,1,5,5,5,5,1,0,0],
    [0,1,5,5,3,3,5,5,1,0],
    [0,1,5,3,3,3,3,5,1,0],
    [0,0,1,5,5,5,5,1,0,0],
    [0,0,0,1,6,6,1,0,0,0],
    [0,0,1,1,6,6,1,1,0,0],
    [0,0,1,0,1,1,0,1,0,0],
  ],
  [CharacterClass.Mage]: [
    [0,0,0,1,7,7,1,0,0,0],
    [0,0,1,7,7,7,7,1,0,0],
    [0,1,7,7,3,3,7,7,1,0],
    [0,1,7,3,3,3,3,7,1,0],
    [0,0,1,7,7,7,7,1,0,0],
    [0,0,0,1,7,7,1,0,0,0],
    [0,0,1,1,7,7,1,1,0,0],
    [0,0,1,0,1,1,0,1,0,0],
  ],
};

const PALETTE: Record<number, string> = {
  1: '#555566',
  2: '#CC4444',
  3: '#FFEEBB',
  4: '#886644',
  5: '#44AA66',
  6: '#664422',
  7: '#7744CC',
};

const ENEMY_PALETTE: Record<number, string> = {
  1: '#555566',
  2: '#AA2222',
  3: '#FFEEBB',
  4: '#886644',
  5: '#338855',
  6: '#664422',
  7: '#5522AA',
};

function drawPixelCharacter(
  ctx: CanvasRenderingContext2D,
  character: Character,
  offsetX: number,
  offsetY: number,
  isShaking: boolean,
  shakeOffset: number
) {
  const art = PIXEL_ART[character.class];
  const palette = character.team === Team.Enemy ? ENEMY_PALETTE : PALETTE;
  const pixelSize = 3;
  const artWidth = 10 * pixelSize;
  const artHeight = 8 * pixelSize;
  const drawX = offsetX + (CELL_SIZE - artWidth) / 2 + (isShaking ? shakeOffset : 0);
  const drawY = offsetY + (CELL_SIZE - artHeight) / 2 - 2;

  for (let row = 0; row < art.length; row++) {
    for (let col = 0; col < art[row].length; col++) {
      const colorIndex = art[row][col];
      if (colorIndex === 0) continue;
      ctx.fillStyle = palette[colorIndex] || '#888888';
      ctx.fillRect(drawX + col * pixelSize, drawY + row * pixelSize, pixelSize, pixelSize);
    }
  }
}

function drawHealthBar(
  ctx: CanvasRenderingContext2D,
  character: Character,
  centerX: number,
  bottomY: number,
  animProgress: number
) {
  const barWidth = 30;
  const barHeight = 4;
  const x = centerX - barWidth / 2;
  const y = bottomY - 6;

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x, y, barWidth, barHeight);

  const hpRatio = character.hp / character.maxHp;
  const displayRatio = hpRatio + (1 - hpRatio) * (1 - Math.min(animProgress, 1));
  const ratio = Math.min(1, displayRatio);

  const r = Math.round(255 * (1 - ratio));
  const g = Math.round(255 * ratio);
  ctx.fillStyle = `rgb(${r},${g},0)`;
  ctx.fillRect(x, y, barWidth * Math.max(0, ratio), barHeight);
}

const BattleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const hpAnimRef = useRef<Map<string, { from: number; to: number; startTime: number }>>(new Map());

  const characters = useGameStore(s => s.characters);
  const highlightedCells = useGameStore(s => s.highlightedCells);
  const actionMode = useGameStore(s => s.actionMode);

  const selectCharacter = useGameStore(s => s.selectCharacter);
  const moveCharacter = useGameStore(s => s.moveCharacter);
  const attackCharacter = useGameStore(s => s.attackCharacter);
  const setActionMode = useGameStore(s => s.setActionMode);
  const setHighlightedCells = useGameStore(s => s.setHighlightedCells);

  const prevHpRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const currentHps = new Map<string, number>();
    characters.forEach(c => currentHps.set(c.id, c.hp));
    const prevHps = prevHpRef.current;

    for (const [id, hp] of currentHps) {
      const prevHp = prevHps.get(id);
      if (prevHp !== undefined && prevHp !== hp) {
        hpAnimRef.current.set(id, {
          from: prevHp,
          to: hp,
          startTime: performance.now(),
        });
      }
    }
    prevHpRef.current = currentHps;
  }, [characters]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
      const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);

      if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) return;

      const clickedCharId = useGameStore.getState().grid.getCharacterAt(x, y);
      const state = useGameStore.getState();
      const selectedId = state.selectedCharacterId;

      if (clickedCharId) {
        const clickedChar = state.characters.find(c => c.id === clickedCharId);
        if (!clickedChar) return;

        if (selectedId && clickedChar.team !== state.characters.find(c => c.id === selectedId)?.team) {
          const attacker = state.characters.find(c => c.id === selectedId);
          if (attacker && attacker.team === Team.Ally) {
            const dist = Math.abs(clickedChar.x - attacker.x) + Math.abs(clickedChar.y - attacker.y);
            if (dist <= attacker.attackRange) {
              attackCharacter(selectedId, clickedCharId);
              return;
            }
          }
        }

        selectCharacter(clickedCharId);
      } else {
        if (selectedId && actionMode === 'move') {
          const isHighlighted = highlightedCells.some(c => c.x === x && c.y === y);
          if (isHighlighted) {
            moveCharacter(selectedId, x, y);
            setActionMode('idle');
            setHighlightedCells([]);
          }
        }
        selectCharacter(null);
      }
    },
    [actionMode, highlightedCells, selectCharacter, moveCharacter, attackCharacter, setActionMode, setHighlightedCells]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (timestamp: number) => {

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#F5F0E8';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.strokeStyle = '#CCCCCC';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= GRID_COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE, 0);
        ctx.lineTo(x * CELL_SIZE, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y <= GRID_ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL_SIZE);
        ctx.lineTo(CANVAS_WIDTH, y * CELL_SIZE);
        ctx.stroke();
      }

      const state = useGameStore.getState();
      const highlighted = state.highlightedCells;
      const selectedId = state.selectedCharacterId;

      for (const cell of highlighted) {
        const occupant = state.grid.getCharacterAt(cell.x, cell.y);
        ctx.fillStyle = occupant ? 'rgba(229,115,115,0.4)' : 'rgba(79,195,247,0.35)';
        ctx.fillRect(cell.x * CELL_SIZE, cell.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }

      if (selectedId) {
        const selected = state.characters.find(c => c.id === selectedId);
        if (selected) {
          const attackRange = state.grid.getAttackRange(selectedId, selected.attackRange);
          ctx.fillStyle = 'rgba(255,152,0,0.12)';
          for (const cell of attackRange) {
            const occupant = state.grid.getCharacterAt(cell.x, cell.y);
            if (occupant && occupant !== selectedId) {
              const occupantChar = state.characters.find(c => c.id === occupant);
              if (occupantChar && occupantChar.team !== selected.team) {
                ctx.fillStyle = 'rgba(244,67,54,0.25)';
              }
            } else {
              ctx.fillStyle = 'rgba(255,152,0,0.12)';
            }
            ctx.fillRect(cell.x * CELL_SIZE, cell.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          }
        }
      }

      const ringAngle = (timestamp / 2000) * Math.PI * 2;

      for (const character of state.characters) {
        if (!character.isAlive) continue;
        const cx = character.x * CELL_SIZE;
        const cy = character.y * CELL_SIZE;
        const centerX = cx + CELL_SIZE / 2;
        const centerY = cy + CELL_SIZE / 2;

        if (character.id === selectedId) {
          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate(ringAngle);
          ctx.beginPath();
          ctx.arc(0, 0, CELL_SIZE / 2 + 5, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255,213,79,0.6)';
          ctx.lineWidth = 2;
          ctx.stroke();
          const gradient = ctx.createRadialGradient(0, 0, CELL_SIZE / 2, 0, 0, CELL_SIZE / 2 + 8);
          gradient.addColorStop(0, 'rgba(255,213,79,0)');
          gradient.addColorStop(1, 'rgba(255,213,79,0.15)');
          ctx.fillStyle = gradient;
          ctx.fill();
          ctx.restore();
        }

        const isShaking = state.attackAnimations.has(character.id);
        let shakeOffset = 0;
        if (isShaking) {
          const animStart = state.attackAnimations.get(character.id)!;
          const elapsed = timestamp - animStart;
          if (elapsed < 300) {
            shakeOffset = Math.sin(elapsed * Math.PI * 2 * 10 / 1000) * 3;
          }
        }

        drawPixelCharacter(ctx, character, cx, cy, isShaking, shakeOffset);

        const hpAnim = hpAnimRef.current.get(character.id);
        let animProgress = 1;
        if (hpAnim) {
          animProgress = Math.min(1, (timestamp - hpAnim.startTime) / 300);
        }

        drawHealthBar(ctx, character, centerX, cy + CELL_SIZE, animProgress);

        ctx.font = '8px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = character.team === Team.Ally ? '#00BFA5' : '#FF5252';
        ctx.fillText(character.name, centerX, cy + CELL_SIZE - 1);
      }

      for (const damage of state.floatingDamages) {
        const elapsed = timestamp - damage.startTime;
        if (elapsed > 800) continue;
        const progress = elapsed / 800;
        const yOffset = progress * 80;
        const alpha = 1 - progress;

        ctx.save();
        ctx.font = 'bold 16px Orbitron, monospace';
        ctx.textAlign = 'center';
        const color = damage.damageType === DamageType.Physical ? '#FFFFFF' : '#CE93D8';
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(`-${damage.damage}`, damage.x, damage.y - yOffset);
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      onClick={handleCanvasClick}
      style={{
        cursor: actionMode === 'move' ? 'crosshair' : 'pointer',
        borderRadius: '4px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      }}
    />
  );
};

export default BattleCanvas;
