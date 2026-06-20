export interface EditorState {
  grid: number[][];
  selectedColor: number;
  isDragging: boolean;
  dragStart: { row: number; col: number } | null;
  dragEnd: { row: number; col: number } | null;
  isSelecting: boolean;
  pulsePhase: number;
}

const COLORS = ['#ff4757', '#ffa502', '#ffd32a', '#2ed573'];
const GRID_ROWS = 8;
const GRID_COLS = 8;
const CELL_WIDTH = 80;
const CELL_HEIGHT = 25;
const CELL_PADDING = 2;
const GRID_OFFSET_TOP = 60;
const GRID_OFFSET_LEFT = 60;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

const PANEL_X = 680;
const PANEL_Y = 100;
const COLOR_BOX_SIZE = 30;
const COLOR_BOX_GAP = 15;

const STORAGE_KEY = 'brickBreaker_customLevels';

export function createEditorState(): EditorState {
  const grid: number[][] = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    grid.push(new Array(GRID_COLS).fill(0));
  }

  return {
    grid,
    selectedColor: 1,
    isDragging: false,
    dragStart: null,
    dragEnd: null,
    isSelecting: false,
    pulsePhase: 0
  };
}

export function updateEditor(state: EditorState, deltaTime: number): EditorState {
  const newState = { ...state };
  newState.pulsePhase = (state.pulsePhase + deltaTime / 1000 * 3) % (Math.PI * 2);
  return newState;
}

export function renderEditor(ctx: CanvasRenderingContext2D, state: EditorState, hoveredCell: { row: number; col: number } | null): void {
  const bgGradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  bgGradient.addColorStop(0, '#1a1a2e');
  bgGradient.addColorStop(1, '#16213e');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  for (let row = 0; row <= GRID_ROWS; row++) {
    const y = GRID_OFFSET_TOP + row * (CELL_HEIGHT + CELL_PADDING) - CELL_PADDING / 2;
    ctx.beginPath();
    ctx.moveTo(GRID_OFFSET_LEFT, y);
    ctx.lineTo(GRID_OFFSET_LEFT + GRID_COLS * (CELL_WIDTH + CELL_PADDING) - CELL_PADDING, y);
    ctx.stroke();
  }
  for (let col = 0; col <= GRID_COLS; col++) {
    const x = GRID_OFFSET_LEFT + col * (CELL_WIDTH + CELL_PADDING) - CELL_PADDING / 2;
    ctx.beginPath();
    ctx.moveTo(x, GRID_OFFSET_TOP);
    ctx.lineTo(x, GRID_OFFSET_TOP + GRID_ROWS * (CELL_HEIGHT + CELL_PADDING) - CELL_PADDING);
    ctx.stroke();
  }

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const x = GRID_OFFSET_LEFT + col * (CELL_WIDTH + CELL_PADDING);
      const y = GRID_OFFSET_TOP + row * (CELL_HEIGHT + CELL_PADDING);
      const colorIndex = state.grid[row][col];

      if (colorIndex > 0) {
        const color = COLORS[colorIndex - 1];
        const brickGradient = ctx.createLinearGradient(x, y, x, y + CELL_HEIGHT);
        brickGradient.addColorStop(0, lightenColor(color, 30));
        brickGradient.addColorStop(1, color);

        ctx.fillStyle = brickGradient;
        roundRect(ctx, x, y, CELL_WIDTH, CELL_HEIGHT, 4);
        ctx.fill();

        ctx.strokeStyle = lightenColor(color, 50);
        ctx.lineWidth = 1;
        roundRect(ctx, x + 0.5, y + 0.5, CELL_WIDTH - 1, CELL_HEIGHT - 1, 4);
        ctx.stroke();
      }
    }
  }

  if (state.isSelecting && state.dragStart && state.dragEnd) {
    const minRow = Math.min(state.dragStart.row, state.dragEnd.row);
    const maxRow = Math.max(state.dragStart.row, state.dragEnd.row);
    const minCol = Math.min(state.dragStart.col, state.dragEnd.col);
    const maxCol = Math.max(state.dragStart.col, state.dragEnd.col);

    const x = GRID_OFFSET_LEFT + minCol * (CELL_WIDTH + CELL_PADDING) - 2;
    const y = GRID_OFFSET_TOP + minRow * (CELL_HEIGHT + CELL_PADDING) - 2;
    const w = (maxCol - minCol + 1) * (CELL_WIDTH + CELL_PADDING) - CELL_PADDING + 4;
    const h = (maxRow - minRow + 1) * (CELL_HEIGHT + CELL_PADDING) - CELL_PADDING + 4;

    ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(100, 200, 255, 0.1)';
    ctx.fillRect(x, y, w, h);
  }

  if (hoveredCell && !state.isSelecting) {
    const x = GRID_OFFSET_LEFT + hoveredCell.col * (CELL_WIDTH + CELL_PADDING);
    const y = GRID_OFFSET_TOP + hoveredCell.row * (CELL_HEIGHT + CELL_PADDING);
    const pulse = 0.5 + 0.5 * Math.sin(state.pulsePhase);

    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 10 + pulse * 10;
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + pulse * 0.5})`;
    ctx.lineWidth = 2;
    roundRect(ctx, x - 1, y - 1, CELL_WIDTH + 2, CELL_HEIGHT + 2, 5);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  drawColorPanel(ctx, state);
  drawEditorButtons(ctx, state);
  drawEditorTitle(ctx);
}

function drawEditorTitle(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#ffffff';
  ctx.font = '24px Orbitron, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('关卡编辑器', CANVAS_WIDTH / 2 - 60, 35);
}

function drawColorPanel(ctx: CanvasRenderingContext2D, state: EditorState): void {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  roundRect(ctx, PANEL_X - 15, PANEL_Y - 20, 100, 220, 10);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '14px Orbitron, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('颜色', PANEL_X + 35, PANEL_Y - 5);

  for (let i = 0; i < 4; i++) {
    const x = PANEL_X;
    const y = PANEL_Y + 20 + i * (COLOR_BOX_SIZE + COLOR_BOX_GAP);
    const color = COLORS[i];

    ctx.fillStyle = color;
    roundRect(ctx, x, y, COLOR_BOX_SIZE, COLOR_BOX_SIZE, 6);
    ctx.fill();

    if (state.selectedColor === i + 1) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      roundRect(ctx, x - 4, y - 4, COLOR_BOX_SIZE + 8, COLOR_BOX_SIZE + 8, 8);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '11px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${i + 1}级`, x + COLOR_BOX_SIZE + 10, y + COLOR_BOX_SIZE / 2 + 4);
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('E键: 清空选中', PANEL_X - 10, PANEL_Y + 200);
}

function drawEditorButtons(ctx: CanvasRenderingContext2D, state: EditorState): void {
  const saveBtnX = PANEL_X - 15;
  const saveBtnY = 500;
  const btnWidth = 100;
  const btnHeight = 40;

  const btnGradient = ctx.createLinearGradient(saveBtnX, saveBtnY, saveBtnX, saveBtnY + btnHeight);
  btnGradient.addColorStop(0, '#2ed573');
  btnGradient.addColorStop(1, '#26af5e');

  ctx.fillStyle = btnGradient;
  roundRect(ctx, saveBtnX, saveBtnY, btnWidth, btnHeight, 8);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '14px Orbitron, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('保存关卡', saveBtnX + btnWidth / 2, saveBtnY + 25);

  const backBtnX = 20;
  const backBtnY = 20;
  const backBtnWidth = 80;
  const backBtnHeight = 35;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  roundRect(ctx, backBtnX, backBtnY, backBtnWidth, backBtnHeight, 8);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '12px Orbitron, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('返回', backBtnX + backBtnWidth / 2, backBtnY + 22);
}

export function getCellFromPosition(x: number, y: number): { row: number; col: number } | null {
  if (x < GRID_OFFSET_LEFT || x >= GRID_OFFSET_LEFT + GRID_COLS * (CELL_WIDTH + CELL_PADDING) - CELL_PADDING) {
    return null;
  }
  if (y < GRID_OFFSET_TOP || y >= GRID_OFFSET_TOP + GRID_ROWS * (CELL_HEIGHT + CELL_PADDING) - CELL_PADDING) {
    return null;
  }

  const col = Math.floor((x - GRID_OFFSET_LEFT) / (CELL_WIDTH + CELL_PADDING));
  const row = Math.floor((y - GRID_OFFSET_TOP) / (CELL_HEIGHT + CELL_PADDING));

  if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
    return { row, col };
  }

  return null;
}

export function isColorPanelClick(x: number, y: number): number | null {
  for (let i = 0; i < 4; i++) {
    const boxX = PANEL_X;
    const boxY = PANEL_Y + 20 + i * (COLOR_BOX_SIZE + COLOR_BOX_GAP);
    if (x >= boxX && x <= boxX + COLOR_BOX_SIZE && y >= boxY && y <= boxY + COLOR_BOX_SIZE) {
      return i + 1;
    }
  }
  return null;
}

export function isSaveButtonClick(x: number, y: number): boolean {
  const btnX = PANEL_X - 15;
  const btnY = 500;
  const btnWidth = 100;
  const btnHeight = 40;
  return x >= btnX && x <= btnX + btnWidth && y >= btnY && y <= btnY + btnHeight;
}

export function isBackButtonClick(x: number, y: number): boolean {
  const btnX = 20;
  const btnY = 20;
  const btnWidth = 80;
  const btnHeight = 35;
  return x >= btnX && x <= btnX + btnWidth && y >= btnY && y <= btnY + btnHeight;
}

export function fillCell(state: EditorState, row: number, col: number): EditorState {
  const newGrid = state.grid.map(r => [...r]);
  newGrid[row][col] = state.selectedColor;
  return { ...state, grid: newGrid };
}

export function clearCell(state: EditorState, row: number, col: number): EditorState {
  const newGrid = state.grid.map(r => [...r]);
  newGrid[row][col] = 0;
  return { ...state, grid: newGrid };
}

export function fillSelection(state: EditorState): EditorState {
  if (!state.dragStart || !state.dragEnd) return state;

  const minRow = Math.min(state.dragStart.row, state.dragEnd.row);
  const maxRow = Math.max(state.dragStart.row, state.dragEnd.row);
  const minCol = Math.min(state.dragStart.col, state.dragEnd.col);
  const maxCol = Math.max(state.dragStart.col, state.dragEnd.col);

  const newGrid = state.grid.map(r => [...r]);
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      newGrid[row][col] = state.selectedColor;
    }
  }

  return {
    ...state,
    grid: newGrid,
    isSelecting: false,
    dragStart: null,
    dragEnd: null
  };
}

export function clearSelection(state: EditorState): EditorState {
  if (!state.dragStart || !state.dragEnd) return state;

  const minRow = Math.min(state.dragStart.row, state.dragEnd.row);
  const maxRow = Math.max(state.dragStart.row, state.dragEnd.row);
  const minCol = Math.min(state.dragStart.col, state.dragEnd.col);
  const maxCol = Math.max(state.dragStart.col, state.dragEnd.col);

  const newGrid = state.grid.map(r => [...r]);
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      newGrid[row][col] = 0;
    }
  }

  return {
    ...state,
    grid: newGrid,
    isSelecting: false,
    dragStart: null,
    dragEnd: null
  };
}

export function saveCustomLevel(levelName: string, grid: number[][]): boolean {
  try {
    const levels = getCustomLevels();
    levels.push({ name: levelName, grid, createdAt: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(levels));
    return true;
  } catch (e) {
    console.error('Failed to save level:', e);
    return false;
  }
}

export function getCustomLevels(): { name: string; grid: number[][]; createdAt: number }[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to load levels:', e);
    return [];
  }
}

export function deleteCustomLevel(index: number): boolean {
  try {
    const levels = getCustomLevels();
    levels.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(levels));
    return true;
  } catch (e) {
    console.error('Failed to delete level:', e);
    return false;
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  width: number, height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

export { GRID_ROWS, GRID_COLS, CELL_WIDTH, CELL_HEIGHT, COLORS, CANVAS_WIDTH, CANVAS_HEIGHT };
