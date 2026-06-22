type SpriteType = 'ninja' | 'mage' | 'knight';
type Direction = 'up' | 'down' | 'left' | 'right';
type ActionType = 'idle' | 'walk' | 'jump' | 'attack';

interface ColorPalette {
  body: string;
  bodyDark: string;
  skin: string;
  skinDark: string;
  eye: string;
  accent: string;
  accentDark: string;
  weapon: string;
  weaponDark: string;
}

const palettes: Record<SpriteType, ColorPalette> = {
  ninja: {
    body: '#2D2D2D',
    bodyDark: '#1A1A1A',
    skin: '#E8BEAC',
    skinDark: '#D4A574',
    eye: '#FFFFFF',
    accent: '#D32F2F',
    accentDark: '#B71C1C',
    weapon: '#607D8B',
    weaponDark: '#455A64',
  },
  mage: {
    body: '#5E35B1',
    bodyDark: '#311B92',
    skin: '#FFCCBC',
    skinDark: '#FFAB91',
    eye: '#00BCD4',
    accent: '#FFD54F',
    accentDark: '#FFC107',
    weapon: '#8D6E63',
    weaponDark: '#6D4C41',
  },
  knight: {
    body: '#78909C',
    bodyDark: '#546E7A',
    skin: '#FFCCBC',
    skinDark: '#FFAB91',
    eye: '#FFFFFF',
    accent: '#FFD700',
    accentDark: '#FFA000',
    weapon: '#CFD8DC',
    weaponDark: '#90A4AE',
  },
};

const FRAME_SIZE = 32;
const COLS = 8;
const ROWS = 8;
const TOTAL_FRAMES = COLS * ROWS;

const FRAMES_PER_ANIM = 4;
const DIRECTIONS: Direction[] = ['down', 'left', 'right', 'up'];
const ACTIONS: ActionType[] = ['idle', 'walk', 'jump', 'attack'];

function getFrameIndex(action: ActionType, direction: Direction, frame: number): number {
  const actionIdx = ACTIONS.indexOf(action);
  const dirIdx = DIRECTIONS.indexOf(direction);
  return (actionIdx * 4 + dirIdx) * FRAMES_PER_ANIM + frame;
}

function drawPixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

function drawRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawCharacter(
  ctx: CanvasRenderingContext2D,
  palette: ColorPalette,
  type: SpriteType,
  direction: Direction,
  action: ActionType,
  frame: number,
  offsetX: number,
  offsetY: number
): void {
  const bobY = action === 'walk' ? (frame % 2 === 0 ? 0 : -1) : action === 'idle' ? Math.floor(frame / 2) % 2 : 0;
  const legOffset = action === 'walk' ? (frame % 2 === 0 ? 1 : -1) : 0;
  const armSwing = action === 'walk' ? (frame % 2 === 0 ? 1 : -1) : 0;
  const attackFrame = action === 'attack' ? frame : 0;

  const baseY = offsetY + bobY;

  if (direction === 'up') {
    drawBackCharacter(ctx, palette, type, action, frame, offsetX, baseY, legOffset, armSwing, attackFrame);
  } else {
    drawFrontCharacter(ctx, palette, type, direction, action, frame, offsetX, baseY, legOffset, armSwing, attackFrame);
  }
}

function drawFrontCharacter(
  ctx: CanvasRenderingContext2D,
  palette: ColorPalette,
  type: SpriteType,
  direction: Direction,
  action: ActionType,
  frame: number,
  offsetX: number,
  offsetY: number,
  legOffset: number,
  armSwing: number,
  attackFrame: number
): void {
  const cx = offsetX + 16;
  const top = offsetY + 8;

  const flip = direction === 'left';
  const dirOffset = flip ? -1 : 1;

  drawRect(ctx, cx - 6 + dirOffset * legOffset, top + 18, 4, 5, palette.bodyDark);
  drawRect(ctx, cx + 2 - dirOffset * legOffset, top + 18, 4, 5, palette.bodyDark);

  drawRect(ctx, cx - 7, top + 10, 14, 10, palette.body);
  drawRect(ctx, cx - 7, top + 18, 14, 2, palette.bodyDark);

  drawRect(ctx, cx - 8 + dirOffset * armSwing, top + 11, 3, 7, palette.body);
  drawRect(ctx, cx + 5 - dirOffset * armSwing, top + 11, 3, 7, palette.body);

  if (action === 'attack') {
    const attackExtend = attackFrame < 2 ? attackFrame * 4 : (3 - attackFrame) * 4;
    if (flip) {
      drawRect(ctx, cx - 12 - attackExtend, top + 9, 4, 8, palette.weapon);
      drawRect(ctx, cx - 12 - attackExtend, top + 9, 1, 8, palette.weaponDark);
    } else {
      drawRect(ctx, cx + 8 + attackExtend, top + 9, 4, 8, palette.weapon);
      drawRect(ctx, cx + 11 + attackExtend, top + 9, 1, 8, palette.weaponDark);
    }
  }

  drawRect(ctx, cx - 6, top, 12, 11, palette.skin);
  drawRect(ctx, cx - 6, top, 12, 2, palette.skinDark);
  drawRect(ctx, cx - 6, top + 9, 12, 2, palette.skinDark);

  if (type === 'ninja') {
    drawRect(ctx, cx - 6, top + 3, 12, 5, palette.body);
    drawRect(ctx, cx - 6, top + 3, 12, 1, palette.bodyDark);
    drawPixel(ctx, cx - 3, top + 5, palette.eye);
    drawPixel(ctx, cx + 2, top + 5, palette.eye);
  } else if (type === 'mage') {
    drawRect(ctx, cx - 5, top - 3, 10, 3, palette.body);
    drawRect(ctx, cx - 3, top - 5, 6, 2, palette.body);
    drawPixel(ctx, cx - 1, top - 6, palette.accent);
    drawPixel(ctx, cx - 3, top + 5, palette.eye);
    drawPixel(ctx, cx + 2, top + 5, palette.eye);
  } else {
    drawRect(ctx, cx - 6, top, 12, 4, palette.body);
    drawRect(ctx, cx - 6, top, 12, 1, palette.bodyDark);
    drawPixel(ctx, cx - 3, top + 5, palette.eye);
    drawPixel(ctx, cx + 2, top + 5, palette.eye);
    drawPixel(ctx, cx - 2, top + 7, palette.skinDark);
    drawPixel(ctx, cx + 1, top + 7, palette.skinDark);
  }

  if (type === 'knight') {
    drawRect(ctx, cx - 5, top + 1, 10, 2, palette.accent);
    drawRect(ctx, cx - 1, top - 2, 2, 3, palette.accent);
  }

  if (type === 'mage' && action !== 'attack') {
    const staffX = flip ? cx - 10 : cx + 8;
    drawRect(ctx, staffX, top + 4, 2, 14, palette.weapon);
    drawRect(ctx, staffX, top + 2, 2, 2, palette.accent);
    drawPixel(ctx, staffX + 1, top + 1, palette.accent);
  }

  if (type === 'ninja' && action !== 'attack') {
    const swordX = flip ? cx - 9 : cx + 7;
    drawRect(ctx, swordX, top + 12, 2, 6, palette.weapon);
    drawRect(ctx, swordX, top + 10, 2, 2, palette.accent);
  }
}

function drawBackCharacter(
  ctx: CanvasRenderingContext2D,
  palette: ColorPalette,
  type: SpriteType,
  action: ActionType,
  frame: number,
  offsetX: number,
  offsetY: number,
  legOffset: number,
  armSwing: number,
  _attackFrame: number
): void {
  const cx = offsetX + 16;
  const top = offsetY + 8;

  drawRect(ctx, cx - 6 + legOffset, top + 18, 4, 5, palette.bodyDark);
  drawRect(ctx, cx + 2 - legOffset, top + 18, 4, 5, palette.bodyDark);

  drawRect(ctx, cx - 7, top + 10, 14, 10, palette.body);
  drawRect(ctx, cx - 7, top + 18, 14, 2, palette.bodyDark);

  drawRect(ctx, cx - 8 + armSwing, top + 11, 3, 7, palette.body);
  drawRect(ctx, cx + 5 - armSwing, top + 11, 3, 7, palette.body);

  drawRect(ctx, cx - 6, top, 12, 11, palette.skinDark);
  drawRect(ctx, cx - 6, top, 12, 3, palette.skin);

  if (type === 'ninja') {
    drawRect(ctx, cx - 6, top + 2, 12, 6, palette.body);
    drawRect(ctx, cx - 6, top + 2, 12, 1, palette.bodyDark);
  } else if (type === 'mage') {
    drawRect(ctx, cx - 5, top - 3, 10, 3, palette.body);
    drawRect(ctx, cx - 3, top - 5, 6, 2, palette.body);
    drawPixel(ctx, cx - 1, top - 6, palette.accent);
    drawRect(ctx, cx - 5, top + 2, 10, 4, palette.body);
  } else {
    drawRect(ctx, cx - 6, top, 12, 5, palette.body);
    drawRect(ctx, cx - 6, top, 12, 1, palette.bodyDark);
    drawRect(ctx, cx - 5, top + 1, 10, 2, palette.accent);
  }
}

export function generateSpriteSheet(type: SpriteType): string {
  const canvas = document.createElement('canvas');
  canvas.width = FRAME_SIZE * COLS;
  canvas.height = FRAME_SIZE * ROWS;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = 'transparent';
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const palette = palettes[type];

  for (let actionIdx = 0; actionIdx < ACTIONS.length; actionIdx++) {
    const action = ACTIONS[actionIdx];
    for (let dirIdx = 0; dirIdx < DIRECTIONS.length; dirIdx++) {
      const direction = DIRECTIONS[dirIdx];
      for (let frame = 0; frame < FRAMES_PER_ANIM; frame++) {
        const globalFrameIdx = getFrameIndex(action, direction, frame);
        const col = globalFrameIdx % COLS;
        const row = Math.floor(globalFrameIdx / COLS);
        const x = col * FRAME_SIZE;
        const y = row * FRAME_SIZE;

        drawCharacter(ctx, palette, type, direction, action, frame, x, y);
      }
    }
  }

  return canvas.toDataURL('image/png');
}

export function generateAllSprites(): Record<SpriteType, string> {
  return {
    ninja: generateSpriteSheet('ninja'),
    mage: generateSpriteSheet('mage'),
    knight: generateSpriteSheet('knight'),
  };
}
