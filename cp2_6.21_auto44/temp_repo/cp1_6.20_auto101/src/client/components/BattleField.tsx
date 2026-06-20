
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  hexToPixel,
  pixelToHex,
  drawHexagon,
  createParticles,
  updateParticles,
  drawParticles,
  createDamageNumber,
  updateDamageNumbers,
  drawDamageNumbers,
  createShakeEffect,
  updateShakeEffects,
  type Particle,
  type DamageNumber,
  type ShakeEffect,
} from '../utils/animations';
import type { HexCoord, Unit, TerrainCell, Skill, BattleLog } from '../../server/battleEngine';

interface BattleFieldProps {
  grid: TerrainCell[][];
  units: Unit[];
  currentUnitId: string | null;
  selectedUnitId: string | null;
  selectedSkill: Skill | null;
  reachableHexes: HexCoord[];
  skillTargetHexes: HexCoord[];
  skillAreaHexes: HexCoord[];
  gameOver: boolean;
  onUnitClick: (unit: Unit) => void;
  onHexClick: (hex: HexCoord) => void;
  onHexHover: (hex: HexCoord | null) => void;
  hoveredHex: HexCoord | null;
}

const GRID_SIZE = 8;
const HEX_SIZE = 42;

const terrainColors: Record<string, { base: string; accent: string }> = {
  plain: { base: '#90c67c', accent: '#7ab368' },
  forest: { base: '#4a7c39', accent: '#3d6630' },
  rock: { base: '#8b8b8b', accent: '#6e6e6e' },
  river: { base: '#6bb3d9', accent: '#4a9cc4' },
  swamp: { base: '#6b7c3a', accent: '#5a6830' },
};

const terrainNames: Record<string, string> = {
  plain: '平原',
  forest: '树林',
  rock: '岩石',
  river: '河流',
  swamp: '沼泽',
};

const BattleField: React.FC<BattleFieldProps> = ({
  grid,
  units,
  currentUnitId,
  selectedUnitId,
  selectedSkill,
  reachableHexes,
  skillTargetHexes,
  skillAreaHexes,
  gameOver,
  onUnitClick,
  onHexClick,
  onHexHover,
  hoveredHex,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  
  const [particles, setParticles] = useState<Particle[]>([]);
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const [shakeEffects, setShakeEffects] = useState<ShakeEffect[]>([]);
  
  const canvasWidth = 700;
  const canvasHeight = 520;
  const offsetX = canvasWidth / 2;
  const offsetY = 80;

  const getPixelPosition = useCallback((q: number, r: number) => {
    const { x, y } = hexToPixel(q, r, HEX_SIZE);
    return { x: x + offsetX, y: y + offsetY };
  }, []);

  const getHexFromPixel = useCallback((x: number, y: number): HexCoord | null => {
    const hex = pixelToHex(x - offsetX, y - offsetY, HEX_SIZE);
    if (hex.q >= 0 && hex.q < GRID_SIZE && hex.r >= 0 && hex.r < GRID_SIZE) {
      return hex;
    }
    return null;
  }, []);

  const drawTerrain = useCallback((ctx: CanvasRenderingContext2D, cell: TerrainCell, q: number, r: number) => {
    const { x, y } = getPixelPosition(q, r);
    const colors = terrainColors[cell.type] || terrainColors.plain;
    
    drawHexagon(ctx, x, y, HEX_SIZE - 2, colors.base, colors.accent, 1);
    
    if (cell.type === 'forest') {
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const dist = HEX_SIZE * 0.4;
        const tx = x + Math.cos(angle) * dist;
        const ty = y + Math.sin(angle) * dist - 2;
        ctx.fillStyle = '#2d5016';
        ctx.beginPath();
        ctx.arc(tx, ty, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (cell.type === 'rock') {
      ctx.strokeStyle = '#5a5a5a';
      ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(x - HEX_SIZE * 0.5, y + i * 10 - 3);
        ctx.lineTo(x + HEX_SIZE * 0.5, y + i * 10 + 3);
        ctx.stroke();
      }
    } else if (cell.type === 'river') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      const time = Date.now() * 0.002;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(x, y + i * 8 - 8, HEX_SIZE * 0.3 + Math.sin(time + i) * 3, 0.2, Math.PI - 0.2);
        ctx.stroke();
      }
    } else if (cell.type === 'swamp') {
      const time = Date.now() * 0.003;
      for (let i = 0; i < 3; i++) {
        const bx = x + (i - 1) * 12;
        const by = y + Math.sin(time + i) * 3;
        ctx.fillStyle = 'rgba(100, 80, 50, 0.5)';
        ctx.beginPath();
        ctx.arc(bx, by, 5 + Math.sin(time * 2 + i) * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [getPixelPosition]);

  const drawUnit = useCallback((ctx: CanvasRenderingContext2D, unit: Unit, shake: ShakeEffect | undefined) => {
    const { x, y } = getPixelPosition(unit.position.q, unit.position.r);
    const ox = shake?.offsetX || 0;
    const oy = shake?.offsetY || 0;
    const drawX = x + ox;
    const drawY = y + oy;
    
    const isPlayer = unit.faction === 'player';
    const mainColor = isPlayer ? '#3b82f6' : '#ef4444';
    const darkColor = isPlayer ? '#1d4ed8' : '#b91c1c';
    const lightColor = isPlayer ? '#93c5fd' : '#fca5a5';
    
    if (unit.hp <= 0) {
      ctx.globalAlpha = 0.4;
    }
    
    if (currentUnitId === unit.id) {
      const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
      ctx.save();
      ctx.globalAlpha = pulse * 0.5;
      drawHexagon(ctx, drawX, drawY, HEX_SIZE + 6, '#fbbf24', '#f59e0b', 3);
      ctx.restore();
    }
    
    if (selectedUnitId === unit.id && currentUnitId === unit.id) {
      ctx.save();
      ctx.globalAlpha = 0.6;
      drawHexagon(ctx, drawX, drawY, HEX_SIZE + 3, '#fde68a', '#f59e0b', 2);
      ctx.restore();
    }
    
    drawHexagon(ctx, drawX, drawY, HEX_SIZE - 8, mainColor, darkColor, 2);
    
    ctx.fillStyle = lightColor;
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const icon = isPlayer ? '⚔️' : '👹';
    ctx.fillText(icon, drawX, drawY - 2);
    
    const hpPercent = unit.hp / unit.maxHp;
    const hpBarWidth = HEX_SIZE * 1.2;
    const hpBarHeight = 6;
    const hpBarX = drawX - hpBarWidth / 2;
    const hpBarY = drawY + HEX_SIZE * 0.55;
    
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(hpBarX - 1, hpBarY - 1, hpBarWidth + 2, hpBarHeight + 2);
    
    const hpColor = hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillStyle = hpColor;
    ctx.fillRect(hpBarX, hpBarY, hpBarWidth * hpPercent, hpBarHeight);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px Arial, sans-serif';
    ctx.fillText(`${unit.hp}/${unit.maxHp}`, drawX, hpBarY + hpBarHeight / 2);
    
    if (unit.buffs.length > 0) {
      const buffIcons = unit.buffs.map(b => b.icon).join('');
      ctx.font = '12px Arial';
      ctx.fillText(buffIcons, drawX, drawY - HEX_SIZE * 0.5);
    }
    
    ctx.globalAlpha = 1;
  }, [getPixelPosition, currentUnitId, selectedUnitId]);

  const drawHighlight = useCallback((ctx: CanvasRenderingContext2D, hex: HexCoord, color: string, alpha: number = 0.4) => {
    const { x, y } = getPixelPosition(hex.q, hex.r);
    ctx.save();
    ctx.globalAlpha = alpha;
    drawHexagon(ctx, x, y, HEX_SIZE - 4, color, undefined, 0);
    ctx.restore();
  }, [getPixelPosition]);

  const drawSkillArea = useCallback((ctx: CanvasRenderingContext2D, hex: HexCoord, color: string) => {
    const { x, y } = getPixelPosition(hex.q, hex.r);
    ctx.save();
    ctx.globalAlpha = 0.5;
    drawHexagon(ctx, x, y, HEX_SIZE - 5, color, '#ffffff', 2);
    ctx.restore();
  }, [getPixelPosition]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (timestamp: number) => {
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;
      
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      
      const gradient = ctx.createRadialGradient(
        canvasWidth / 2, canvasHeight / 2, 50,
        canvasWidth / 2, canvasHeight / 2, canvasWidth * 0.7
      );
      gradient.addColorStop(0, '#f5e6d3');
      gradient.addColorStop(1, '#e8d5b9');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      ctx.strokeStyle = 'rgba(139, 119, 87, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * 30);
        ctx.lineTo(canvasWidth, i * 30 + 20);
        ctx.stroke();
      }
      
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let q = 0; q < GRID_SIZE; q++) {
          if (grid[r] && grid[r][q]) {
            drawTerrain(ctx, grid[r][q], q, r);
          }
        }
      }
      
      if (selectedSkill && skillAreaHexes.length > 0) {
        skillAreaHexes.forEach(hex => {
          drawSkillArea(ctx, hex, selectedSkill.type === 'heal' || selectedSkill.type === 'shield' ? '#22c55e' : '#ef4444');
        });
      }
      
      if (selectedSkill && skillTargetHexes.length > 0) {
        skillTargetHexes.forEach(hex => {
          drawHighlight(ctx, hex, '#fbbf24', 0.3);
        });
      }
      
      if (reachableHexes.length > 0) {
        reachableHexes.forEach(hex => {
          drawHighlight(ctx, hex, '#22c55e', 0.4);
        });
      }
      
      if (hoveredHex) {
        drawHighlight(ctx, hoveredHex, '#ffffff', 0.3);
      }
      
      const updatedShakes = updateShakeEffects(shakeEffects, deltaTime);
      setShakeEffects(updatedShakes);
      
      const aliveUnits = [...units].sort((a, b) => {
        if (a.hp <= 0 && b.hp > 0) return -1;
        if (a.hp > 0 && b.hp <= 0) return 1;
        return 0;
      });
      
      aliveUnits.forEach(unit => {
        const shake = updatedShakes.find(s => s.unitId === unit.id);
        drawUnit(ctx, unit, shake);
      });
      
      const updatedParticles = updateParticles(particles, deltaTime);
      setParticles(updatedParticles);
      drawParticles(ctx, updatedParticles);
      
      const updatedDamageNumbers = updateDamageNumbers(damageNumbers, deltaTime);
      setDamageNumbers(updatedDamageNumbers);
      drawDamageNumbers(ctx, updatedDamageNumbers);
      
      animationRef.current = requestAnimationFrame(render);
    };
    
    animationRef.current = requestAnimationFrame(render);
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [grid, units, reachableHexes, skillTargetHexes, skillAreaHexes, hoveredHex, 
      selectedSkill, particles, damageNumbers, shakeEffects, drawTerrain, drawUnit, 
      drawHighlight, drawSkillArea]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameOver) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const hex = getHexFromPixel(x, y);
    if (!hex) return;
    
    const clickedUnit = units.find(
      u => u.position.q === hex.q && u.position.r === hex.r && u.hp > 0
    );
    
    if (clickedUnit) {
      onUnitClick(clickedUnit);
    } else {
      onHexClick(hex);
    }
  }, [units, gameOver, getHexFromPixel, onUnitClick, onHexClick]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const hex = getHexFromPixel(x, y);
    onHexHover(hex);
  }, [getHexFromPixel, onHexHover]);

  const handleMouseLeave = useCallback(() => {
    onHexHover(null);
  }, [onHexHover]);

  const getTerrainInfo = (hex: HexCoord): { name: string; cell: TerrainCell } | null => {
    if (hex.r >= 0 && hex.r < GRID_SIZE && hex.q >= 0 && hex.q < GRID_SIZE) {
      const cell = grid[hex.r]?.[hex.q];
      if (cell) {
        return { name: terrainNames[cell.type] || cell.type, cell };
      }
    }
    return null;
  };

  const terrainInfo = hoveredHex ? getTerrainInfo(hoveredHex) : null;
  const hoveredUnit = hoveredHex 
    ? units.find(u => u.position.q === hoveredHex.q && u.position.r === hoveredHex.r && u.hp > 0)
    : null;

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="rounded-2xl shadow-2xl cursor-pointer border-4 border-amber-700/30"
        style={{ 
          background: 'linear-gradient(135deg, #f5e6d3 0%, #e8d5b9 100%)',
        }}
      />
      
      {(terrainInfo || hoveredUnit) && hoveredHex && (
        <div 
          className="absolute pointer-events-none bg-gray-900/90 text-white px-3 py-2 rounded-lg text-sm z-10 shadow-xl border border-amber-500/30"
          style={{
            left: Math.min(canvasWidth - 180, Math.max(10, 
              hoveredHex ? getPixelPosition(hoveredHex.q, hoveredHex.r).x + 30 : 0
            )),
            top: Math.min(canvasHeight - 120, Math.max(10, 
              hoveredHex ? getPixelPosition(hoveredHex.q, hoveredHex.r).y - 20 : 0
            )),
          }}
        >
          {hoveredUnit && (
            <div className="mb-2 pb-2 border-b border-gray-700">
              <div className="font-bold text-amber-400">{hoveredUnit.name}</div>
              <div className="text-xs text-gray-400">
                {hoveredUnit.faction === 'player' ? '友方' : '敌方'}
              </div>
            </div>
          )}
          {terrainInfo && (
            <div>
              <div className="font-semibold text-green-400">{terrainInfo.name}</div>
              <div className="text-xs text-gray-300">
                移动消耗: {terrainInfo.cell.moveCost}
              </div>
              <div className="text-xs text-gray-300">
                防御加成: +{terrainInfo.cell.defenseBonus}
              </div>
              <div className="text-xs text-gray-300">
                攻击加成: {terrainInfo.cell.attackBonus >= 0 ? '+' : ''}{terrainInfo.cell.attackBonus}
              </div>
            </div>
          )}
        </div>
      )}
      
      {gameOver && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-2xl">
          <div className="text-center">
            <div className="text-4xl font-bold text-amber-400 mb-2">战斗结束</div>
            <div className="text-xl text-white">
              {/* winner text shown in parent */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BattleField;

