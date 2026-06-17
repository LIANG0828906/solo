import type { PropElement, Character, DragState } from '../types';

const STAGE_BG = '#1C1C2E';
const GRID_COLOR = '#3D3D5C';
const GRID_SIZE = 20;
const SELECTED_BORDER = '#FFD700';
const CHAR_RADIUS = 8;

interface RenderState {
  props: PropElement[];
  characters: Character[];
  selectedElementId: string | null;
  dragState: DragState | null;
}

function drawBackground(ctx: CanvasRenderingContext2D): void {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  ctx.fillStyle = STAGE_BG;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = 1;

  for (let x = 0; x <= width; x += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y <= height; y += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawProp(ctx: CanvasRenderingContext2D, prop: PropElement, isSelected: boolean): void {
  ctx.save();

  ctx.fillStyle = prop.fillColor;

  if (isSelected) {
    ctx.strokeStyle = SELECTED_BORDER;
    ctx.lineWidth = 2;
  } else {
    ctx.strokeStyle = prop.borderColor;
    ctx.lineWidth = 1;
  }

  if (prop.type === 'rectangle') {
    ctx.fillRect(prop.x, prop.y, prop.width, prop.height);
    ctx.strokeRect(prop.x, prop.y, prop.width, prop.height);
  } else if (prop.type === 'circle') {
    const centerX = prop.x + prop.width / 2;
    const centerY = prop.y + prop.height / 2;
    const radiusX = prop.width / 2;
    const radiusY = prop.height / 2;

    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function drawCharacter(ctx: CanvasRenderingContext2D, char: Character, index: number, showOverlapHint: boolean): void {
  ctx.save();

  if (showOverlapHint) {
    ctx.globalAlpha = 0.5;
  }

  ctx.fillStyle = char.color;
  ctx.beginPath();
  ctx.arc(char.x, char.y, CHAR_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`#${index + 1}`, char.x + CHAR_RADIUS + 4, char.y);

  ctx.restore();
}

function checkCharacterOverlap(characters: Character[]): Set<string> {
  const overlapIds = new Set<string>();
  const minDistance = CHAR_RADIUS * 2;

  for (let i = 0; i < characters.length; i++) {
    for (let j = i + 1; j < characters.length; j++) {
      const dx = characters[i].x - characters[j].x;
      const dy = characters[i].y - characters[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        overlapIds.add(characters[i].id);
        overlapIds.add(characters[j].id);
      }
    }
  }

  return overlapIds;
}

export function render(ctx: CanvasRenderingContext2D, state: RenderState): void {
  drawBackground(ctx);

  for (const prop of state.props) {
    const isSelected = prop.id === state.selectedElementId;
    drawProp(ctx, prop, isSelected);
  }

  const overlapIds = checkCharacterOverlap(state.characters);

  for (let i = 0; i < state.characters.length; i++) {
    const char = state.characters[i];
    const showOverlapHint = overlapIds.has(char.id);
    drawCharacter(ctx, char, i, showOverlapHint);
  }
}
