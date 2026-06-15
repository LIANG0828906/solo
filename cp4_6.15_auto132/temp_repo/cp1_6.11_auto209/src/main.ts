'use strict';

import { SandTable } from './sandTable';
import { UnitManager } from './unitManager';
import { UIManager, type Stats } from './ui';

type Side = 'red' | 'blue';
type UnitType = 'infantry' | 'cavalry' | 'archer' | 'scout' | 'heavyInfantry' | 'lightCavalry' | 'crossbowman' | 'spy';

interface GameState {
  initialRedStrength: number;
  initialBlueStrength: number;
  currentRedStrength: number;
  currentBlueStrength: number;
  redCasualties: number;
  blueCasualties: number;
  elapsedTime: number;
  isPaused: boolean;
  speedMultiplier: number;
  selectedUnitId: string | null;
  gameOver: boolean;
}

const canvas = document.getElementById('mainCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');

if (!ctx) {
  throw new Error('无法获取Canvas 2D上下文');
}

const sandTable = new SandTable();
const unitManager = new UnitManager();
const uiManager = new UIManager();

const sandboxMargin = 50;
const sandboxWidth = 1000;
const sandboxHeight = 700;
const frameBorderWidth = 20;

let gameState: GameState = {
  initialRedStrength: 0,
  initialBlueStrength: 0,
  currentRedStrength: 0,
  currentBlueStrength: 0,
  redCasualties: 0,
  blueCasualties: 0,
  elapsedTime: 0,
  isPaused: false,
  speedMultiplier: 1,
  selectedUnitId: null,
  gameOver: false
};

unitManager.setTerrainMultiplierCallback((x: number, y: number) => {
  return sandTable.getTerrainSpeedMultiplier(x, y);
});

function updateCanvasSize(): void {
  const viewportWidth = window.innerWidth;
  if (viewportWidth < 900) {
    canvas.width = 600;
    canvas.height = 520;
  } else {
    canvas.width = 1280;
    canvas.height = 800;
  }
  uiManager.setSandboxOffset(sandboxMargin + frameBorderWidth, sandboxMargin + frameBorderWidth);
}

updateCanvasSize();
window.addEventListener('resize', updateCanvasSize);

uiManager.setCallbacks({
  onPlaceUnit: (side: Side, type: UnitType, x: number, y: number) => {
    const clampedX = Math.max(20, Math.min(sandboxWidth - 20, x));
    const clampedY = Math.max(20, Math.min(sandboxHeight - 20, y));
    unitManager.createUnit(side, type, clampedX, clampedY);
    calculateInitialStrength();
  },
  onReset: () => {
    resetGame();
  },
  onPause: (paused: boolean) => {
    gameState.isPaused = paused;
  },
  onSpeedChange: (speed: number) => {
    gameState.speedMultiplier = speed;
  },
  onGeneralRally: (_x: number, _y: number) => {
    const units = unitManager.getAllUnits();
    const redUnits = units.filter(u => u.side === 'red');
    if (redUnits.length > 0) {
      const generalId = redUnits[0].id;
      unitManager.orderRally(generalId);
    }
  }
});

function calculateInitialStrength(): void {
  const units = unitManager.getAllUnits();
  let redStrength = 0;
  let blueStrength = 0;
  
  units.forEach(unit => {
    if (unit.side === 'red') {
      redStrength += unit.maxStrength;
    } else {
      blueStrength += unit.maxStrength;
    }
  });
  
  if (gameState.initialRedStrength === 0) {
    gameState.initialRedStrength = redStrength;
  }
  if (gameState.initialBlueStrength === 0) {
    gameState.initialBlueStrength = blueStrength;
  }
}

function resetGame(): void {
  gameState = {
    initialRedStrength: 0,
    initialBlueStrength: 0,
    currentRedStrength: 0,
    currentBlueStrength: 0,
    redCasualties: 0,
    blueCasualties: 0,
    elapsedTime: 0,
    isPaused: false,
    speedMultiplier: 1,
    selectedUnitId: null,
    gameOver: false
  };
  unitManager.clearAllUnits();
}

function updateStats(): void {
  const units = unitManager.getAllUnits();
  let redStrength = 0;
  let blueStrength = 0;
  
  units.forEach(unit => {
    if (unit.side === 'red') {
      redStrength += unit.strength;
    } else {
      blueStrength += unit.strength;
    }
  });
  
  gameState.currentRedStrength = redStrength;
  gameState.currentBlueStrength = blueStrength;
  gameState.redCasualties = gameState.initialRedStrength - redStrength;
  gameState.blueCasualties = gameState.initialBlueStrength - blueStrength;
  
  let result: 'victory' | 'defeat' | null = null;
  if (!gameState.gameOver) {
    if (gameState.initialRedStrength > 0 && redStrength <= 0) {
      result = 'defeat';
      gameState.gameOver = true;
    } else if (gameState.initialBlueStrength > 0 && blueStrength <= 0) {
      result = 'victory';
      gameState.gameOver = true;
    }
  }
  
  const stats: Stats = {
    ownTroops: redStrength,
    enemyTroops: blueStrength,
    ownCasualties: Math.max(0, gameState.redCasualties),
    enemyCasualties: Math.max(0, gameState.blueCasualties),
    time: gameState.elapsedTime,
    result: result
  };
  
  uiManager.updateStats(stats);
}

function getCanvasSandboxPosition(e: MouseEvent): { x: number; y: number } | null {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left - sandboxMargin - frameBorderWidth;
  const y = e.clientY - rect.top - sandboxMargin - frameBorderWidth;
  
  if (x >= 0 && x <= sandboxWidth && y >= 0 && y <= sandboxHeight) {
    return { x, y };
  }
  return null;
}

function handleCanvasClick(e: MouseEvent): void {
  if (e.button !== 0) return;
  
  const pos = getCanvasSandboxPosition(e);
  if (!pos) return;
  
  const unitId = unitManager.getUnitAt(pos.x, pos.y);
  
  if (gameState.selectedUnitId) {
    const selectedUnit = unitManager.getUnit(gameState.selectedUnitId);
    if (!selectedUnit) {
      gameState.selectedUnitId = null;
      return;
    }
    
    if (unitId) {
      const targetUnit = unitManager.getUnit(unitId);
      if (targetUnit && targetUnit.side !== selectedUnit.side) {
        unitManager.attackUnit(gameState.selectedUnitId, unitId);
      } else if (targetUnit && targetUnit.side === selectedUnit.side) {
        unitManager.selectUnit(unitId);
        gameState.selectedUnitId = unitId;
      }
    } else {
      unitManager.moveUnit(gameState.selectedUnitId, pos.x, pos.y);
    }
  } else if (unitId) {
    const unit = unitManager.getUnit(unitId);
    if (unit && unit.side === 'red') {
      unitManager.selectUnit(unitId);
      gameState.selectedUnitId = unitId;
    }
  }
}

canvas.addEventListener('mousedown', (e) => {
  if (e.button === 2) {
    e.preventDefault();
    return;
  }
  handleCanvasClick(e);
  uiManager.handleMouseDown(e, canvas);
});

canvas.addEventListener('mousemove', (e) => {
  uiManager.handleMouseMove(e, canvas);
  
  const pos = getCanvasSandboxPosition(e);
  if (pos) {
    const unitId = unitManager.getUnitAt(pos.x, pos.y);
    unitManager.getAllUnits().forEach(u => {
      unitManager.setHover(u.id, u.id === unitId);
    });
  }
});

canvas.addEventListener('mouseup', (e) => {
  uiManager.handleMouseUp(e, canvas);
});

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

sandTable.bindCanvas(canvas);

function drawWoodenBorder(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  context.save();
  
  context.fillStyle = '#8B4513';
  context.fillRect(x, y, w, h);
  
  context.globalAlpha = 0.3;
  context.strokeStyle = '#A0522D';
  context.lineWidth = 1;
  
  for (let i = 0; i < h; i += 2) {
    context.beginPath();
    context.moveTo(x, y + i);
    context.lineTo(x + w, y + i);
    context.stroke();
  }
  
  context.restore();
  
  context.strokeStyle = '#5D3A1A';
  context.lineWidth = 2;
  context.strokeRect(x, y, w, h);
}

if (ctx) {
  let lastTime = performance.now();

  function gameLoop(currentTime: number): void {
    const rawDeltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    const deltaTime = Math.min(rawDeltaTime, 0.1) * gameState.speedMultiplier;
    
    if (!gameState.isPaused && !gameState.gameOver) {
      gameState.elapsedTime += deltaTime;
      unitManager.update(deltaTime);
    }
    
    updateStats();
    
    ctx.fillStyle = '#4E342E';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const viewportWidth = window.innerWidth;
    let currentSandboxWidth = sandboxWidth;
    let currentSandboxHeight = sandboxHeight;
    let currentSandboxMargin = sandboxMargin;
    
    if (viewportWidth < 900) {
      currentSandboxWidth = 600;
      currentSandboxHeight = 420;
      currentSandboxMargin = 20;
    }
    
    drawWoodenBorder(
      ctx,
      currentSandboxMargin,
      currentSandboxMargin,
      currentSandboxWidth + frameBorderWidth * 2,
      currentSandboxHeight + frameBorderWidth * 2
    );
    
    ctx.save();
    ctx.translate(
      currentSandboxMargin + frameBorderWidth,
      currentSandboxMargin + frameBorderWidth
    );
    
    if (viewportWidth < 900) {
      const scaleX = currentSandboxWidth / sandboxWidth;
      const scaleY = currentSandboxHeight / sandboxHeight;
      ctx.scale(scaleX, scaleY);
    }
    
    sandTable.render(ctx);
    unitManager.render(ctx);
    
    ctx.restore();
    
    uiManager.render(ctx, rawDeltaTime * 1000);
    
    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
}
