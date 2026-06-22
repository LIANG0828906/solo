import type { Ship, Slot, Explosion, LaserBeam, Position, ShipType, Faction, ShipTemplate, GameStateData } from './gameState';
import { getShipMainColor, getShipTemplates } from './battleEngine';

export function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#0a0a2e');
  gradient.addColorStop(1, '#1a1a4e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  const starSeed = 12345;
  for (let i = 0; i < 100; i++) {
    const x = ((starSeed * (i + 1) * 7) % width);
    const y = ((starSeed * (i + 1) * 13) % height);
    const size = ((i % 3) + 1) * 0.5;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);

  for (let x = 0; x < width; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y < height; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.setLineDash([]);
}

export function drawSlot(ctx: CanvasRenderingContext2D, slot: Slot): void {
  const { position, faction, hovered, scale } = slot;
  const size = 50 * scale;

  ctx.save();
  ctx.translate(position.x, position.y);

  let borderColor = 'rgba(255, 255, 255, 0.25)';
  if (hovered) {
    borderColor = '#ffd700';
  }

  ctx.strokeStyle = borderColor;
  ctx.lineWidth = hovered ? 3 : 2;
  ctx.fillStyle = faction === 'blue'
    ? 'rgba(106, 180, 255, 0.1)'
    : 'rgba(255, 106, 106, 0.1)';

  if (slot.row === 'front') {
    ctx.beginPath();
    ctx.rect(-size / 2, -size / 2, size, size);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.rect(-size / 2, -size / 2, size, size);
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(slot.row === 'front' ? '前排' : '后排', 0, size / 2 + 15);

  ctx.restore();
}

export function drawShipShape(
  ctx: CanvasRenderingContext2D,
  type: ShipType,
  faction: Faction,
  size: number
): void {
  const color = faction === 'blue' ? '#6ab4ff' : '#ff6a6a';
  const darkColor = faction === 'blue' ? '#3a6ba0' : '#a03a3a';
  const glowColor = faction === 'blue' ? 'rgba(106, 180, 255, 0.5)' : 'rgba(255, 106, 106, 0.5)';

  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 10;

  switch (type) {
    case 'attack':
      ctx.beginPath();
      ctx.moveTo(size / 2, 0);
      ctx.lineTo(-size / 2, -size / 2.5);
      ctx.lineTo(-size / 3, 0);
      ctx.lineTo(-size / 2, size / 2.5);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = darkColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      break;

    case 'defense':
      ctx.beginPath();
      ctx.arc(0, 0, size / 2.2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = darkColor;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, size / 3.5, 0, Math.PI * 2);
      ctx.fillStyle = darkColor;
      ctx.fill();
      break;

    case 'speed':
      ctx.beginPath();
      ctx.moveTo(0, -size / 2);
      ctx.lineTo(size / 2.5, 0);
      ctx.lineTo(0, size / 2);
      ctx.lineTo(-size / 2.5, 0);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = darkColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
  }

  ctx.shadowBlur = 0;
}

export function drawShip(
  ctx: CanvasRenderingContext2D,
  ship: Ship,
  position: Position,
  selected: boolean = false
): void {
  if (!ship.isAlive) return;

  const size = 40;
  const flashIntensity = ship.flashTimer > 0 ? Math.sin(ship.flashTimer / 30) * 0.5 + 0.5 : 0;

  ctx.save();
  ctx.translate(position.x + ship.shakeOffset, position.y);

  if (selected) {
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.arc(0, 0, size / 2 + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawShipShape(ctx, ship.type, ship.faction, size);

  if (flashIntensity > 0) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = flashIntensity * 0.8;
    ctx.fillStyle = '#ff3333';
    ctx.beginPath();
    ctx.arc(0, 0, size / 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(ship.name, 0, -size / 2 - 10);

  const hpBarWidth = 40;
  const hpBarHeight = 4;
  const hpRatio = ship.hp / ship.maxHp;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(-hpBarWidth / 2, size / 2 + 6, hpBarWidth, hpBarHeight);

  const hpColor = hpRatio > 0.5 ? '#4ade80' : hpRatio > 0.25 ? '#fbbf24' : '#ef4444';
  ctx.fillStyle = hpColor;
  ctx.fillRect(-hpBarWidth / 2, size / 2 + 6, hpBarWidth * hpRatio, hpBarHeight);

  ctx.restore();
}

export function drawExplosion(ctx: CanvasRenderingContext2D, explosion: Explosion): void {
  explosion.particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.rect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    ctx.fill();
    ctx.restore();
  });
}

export function drawLaserBeam(ctx: CanvasRenderingContext2D, beam: LaserBeam): void {
  const progress = Math.min(1, beam.progress);
  const currentX = beam.startX + (beam.endX - beam.startX) * progress;
  const currentY = beam.startY + (beam.endY - beam.startY) * progress;

  ctx.save();
  ctx.strokeStyle = beam.color;
  ctx.lineWidth = 3;
  ctx.shadowColor = beam.color;
  ctx.shadowBlur = 8;

  ctx.beginPath();
  ctx.moveTo(beam.startX, beam.startY);
  ctx.lineTo(currentX, currentY);
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(currentX, currentY, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawDragShip(
  ctx: CanvasRenderingContext2D,
  template: ShipTemplate,
  position: Position,
  faction: Faction
): void {
  ctx.save();
  ctx.globalAlpha = 0.8;
  ctx.translate(position.x, position.y);
  drawShipShape(ctx, template.type, faction, 40);
  ctx.restore();
}

export function renderGame(
  ctx: CanvasRenderingContext2D,
  state: GameStateData,
  width: number,
  height: number
): void {
  drawBackground(ctx, width, height);
  drawGrid(ctx, width, height);

  state.blueSlots.forEach(slot => drawSlot(ctx, slot));
  state.redSlots.forEach(slot => drawSlot(ctx, slot));

  state.blueSlots.forEach(slot => {
    if (slot.ship) {
      drawShip(ctx, slot.ship, slot.position, state.selectedShip === slot.ship);
    }
  });

  state.redSlots.forEach(slot => {
    if (slot.ship) {
      drawShip(ctx, slot.ship, slot.position, state.selectedShip === slot.ship);
    }
  });

  state.laserBeams.forEach(beam => drawLaserBeam(ctx, beam));

  state.explosions.forEach(exp => drawExplosion(ctx, exp));

  if (state.draggingShipTemplate && state.phase === 'deploy') {
    drawDragShip(
      ctx,
      state.draggingShipTemplate,
      state.dragPosition,
      state.deployStep
    );
  }
}

export function isPointInSlot(x: number, y: number, slot: Slot): boolean {
  const size = 50 * slot.scale;
  return (
    x >= slot.position.x - size / 2 &&
    x <= slot.position.x + size / 2 &&
    y >= slot.position.y - size / 2 &&
    y <= slot.position.y + size / 2
  );
}

export function findSlotAtPosition(
  x: number,
  y: number,
  slots: Slot[]
): Slot | null {
  for (let i = slots.length - 1; i >= 0; i--) {
    if (isPointInSlot(x, y, slots[i])) {
      return slots[i];
    }
  }
  return null;
}

export function findShipAtPosition(
  x: number,
  y: number,
  slots: Slot[]
): Ship | null {
  for (let i = slots.length - 1; i >= 0; i--) {
    const slot = slots[i];
    if (slot.ship && slot.ship.isAlive) {
      const size = 25;
      if (
        x >= slot.position.x - size &&
        x <= slot.position.x + size &&
        y >= slot.position.y - size &&
        y <= slot.position.y + size
      ) {
        return slot.ship;
      }
    }
  }
  return null;
}
