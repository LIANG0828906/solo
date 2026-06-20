import type { PixelTemplate, RaceTemplates, ClassTemplates, Race, CharacterClass } from '@/types/character';

const CHAR_WIDTH = 16;
const CHAR_HEIGHT = 20;

function createEmptyTemplate(w: number = CHAR_WIDTH, h: number = CHAR_HEIGHT): PixelTemplate {
  return {
    width: w,
    height: h,
    data: Array.from({ length: h }, () => Array(w).fill(0)),
  };
}

function drawPixel(tpl: PixelTemplate, x: number, y: number, v: number = 1) {
  if (x >= 0 && x < tpl.width && y >= 0 && y < tpl.height) {
    tpl.data[y][x] = v;
  }
}

function fillRect(tpl: PixelTemplate, x: number, y: number, w: number, h: number, v: number = 1) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      drawPixel(tpl, x + dx, y + dy, v);
    }
  }
}

function drawSymmetric(tpl: PixelTemplate, x: number, y: number, w: number, h: number, v: number = 1) {
  const cx = Math.floor(tpl.width / 2);
  fillRect(tpl, cx - Math.ceil(w / 2) + x, y, w, h, v);
}

function createHumanBody(): PixelTemplate {
  const t = createEmptyTemplate();
  drawSymmetric(t, 0, 1, 6, 5, 1);
  drawPixel(t, 5, 2, 2); drawPixel(t, 10, 2, 2);
  drawPixel(t, 5, 3, 3); drawPixel(t, 10, 3, 3);
  drawSymmetric(t, 0, 5, 2, 1, 4);
  drawSymmetric(t, 0, 6, 6, 1, 1);
  drawSymmetric(t, 0, 7, 8, 4, 1);
  drawPixel(t, 3, 8, 2); drawPixel(t, 12, 8, 2);
  drawPixel(t, 3, 9, 3); drawPixel(t, 12, 9, 3);
  drawSymmetric(t, 0, 11, 8, 1, 4);
  drawSymmetric(t, -2, 12, 4, 5, 1);
  drawSymmetric(t, 2, 12, 4, 5, 1);
  drawPixel(t, 5, 13, 2); drawPixel(t, 10, 13, 2);
  drawSymmetric(t, -2, 17, 4, 2, 4);
  drawSymmetric(t, 2, 17, 4, 2, 4);
  return t;
}

function createElfBody(): PixelTemplate {
  const t = createEmptyTemplate();
  drawSymmetric(t, 0, 1, 6, 5, 1);
  drawPixel(t, 4, 0, 1); drawPixel(t, 11, 0, 1);
  drawPixel(t, 3, 1, 1); drawPixel(t, 12, 1, 1);
  drawPixel(t, 5, 2, 2); drawPixel(t, 10, 2, 2);
  drawPixel(t, 5, 3, 3); drawPixel(t, 10, 3, 3);
  drawSymmetric(t, 0, 5, 2, 1, 4);
  drawSymmetric(t, 0, 6, 6, 1, 1);
  drawSymmetric(t, 0, 7, 7, 4, 1);
  drawPixel(t, 3, 8, 2); drawPixel(t, 12, 8, 2);
  drawPixel(t, 3, 9, 3); drawPixel(t, 12, 9, 3);
  drawSymmetric(t, 0, 11, 7, 1, 4);
  drawSymmetric(t, -2, 12, 4, 6, 1);
  drawSymmetric(t, 2, 12, 4, 6, 1);
  drawPixel(t, 5, 13, 2); drawPixel(t, 10, 13, 2);
  drawSymmetric(t, -2, 18, 4, 1, 4);
  drawSymmetric(t, 2, 18, 4, 1, 4);
  return t;
}

function createOrcBody(): PixelTemplate {
  const t = createEmptyTemplate();
  drawSymmetric(t, 0, 0, 8, 6, 1);
  drawPixel(t, 4, 3, 2); drawPixel(t, 11, 3, 2);
  drawPixel(t, 4, 4, 3); drawPixel(t, 11, 4, 3);
  drawSymmetric(t, -1, 5, 2, 1, 5);
  drawSymmetric(t, 1, 5, 2, 1, 5);
  drawSymmetric(t, 0, 6, 8, 1, 4);
  drawSymmetric(t, 0, 7, 10, 4, 1);
  drawPixel(t, 2, 8, 2); drawPixel(t, 13, 8, 2);
  drawPixel(t, 2, 9, 3); drawPixel(t, 13, 9, 3);
  drawSymmetric(t, 0, 11, 10, 1, 4);
  drawSymmetric(t, -3, 12, 5, 5, 1);
  drawSymmetric(t, 3, 12, 5, 5, 1);
  drawPixel(t, 4, 13, 2); drawPixel(t, 11, 13, 2);
  drawSymmetric(t, -3, 17, 5, 2, 4);
  drawSymmetric(t, 3, 17, 5, 2, 4);
  return t;
}

function createHairStyle1(): PixelTemplate {
  const t = createEmptyTemplate();
  drawSymmetric(t, 0, 0, 8, 1, 1);
  drawSymmetric(t, -1, 1, 10, 1, 1);
  drawPixel(t, 2, 2, 1); drawPixel(t, 13, 2, 1);
  drawPixel(t, 2, 3, 1); drawPixel(t, 13, 3, 1);
  drawPixel(t, 2, 4, 1);
  return t;
}

function createHairStyle2(): PixelTemplate {
  const t = createEmptyTemplate();
  drawSymmetric(t, 0, 0, 6, 2, 1);
  drawSymmetric(t, -1, 1, 8, 1, 1);
  drawPixel(t, 1, 3, 1); drawPixel(t, 14, 3, 1);
  drawPixel(t, 0, 4, 1); drawPixel(t, 15, 4, 1);
  drawPixel(t, 0, 5, 1); drawPixel(t, 15, 5, 1);
  drawPixel(t, 1, 6, 1);
  return t;
}

function createHairStyle3(): PixelTemplate {
  const t = createEmptyTemplate();
  drawSymmetric(t, 0, 0, 6, 1, 1);
  drawPixel(t, 5, 0, 1); drawPixel(t, 10, 0, 1);
  drawPixel(t, 4, 1, 1); drawPixel(t, 11, 1, 1);
  drawSymmetric(t, 0, 1, 6, 2, 1);
  drawSymmetric(t, 0, 3, 8, 1, 1);
  return t;
}

function createWarriorClothes(): PixelTemplate {
  const t = createEmptyTemplate();
  drawSymmetric(t, 0, 6, 6, 1, 1);
  drawSymmetric(t, 0, 7, 8, 4, 1);
  drawSymmetric(t, 0, 8, 2, 3, 2);
  drawPixel(t, 3, 9, 3); drawPixel(t, 12, 9, 3);
  drawPixel(t, 5, 7, 4); drawPixel(t, 10, 7, 4);
  drawPixel(t, 5, 9, 4); drawPixel(t, 10, 9, 4);
  return t;
}

function createMageClothes(): PixelTemplate {
  const t = createEmptyTemplate();
  drawSymmetric(t, 0, 6, 6, 1, 1);
  drawSymmetric(t, 0, 7, 8, 5, 1);
  drawSymmetric(t, -1, 8, 10, 4, 1);
  drawSymmetric(t, -2, 11, 12, 1, 1);
  drawPixel(t, 4, 8, 2); drawPixel(t, 11, 8, 2);
  drawSymmetric(t, 0, 10, 4, 1, 4);
  return t;
}

function createRogueClothes(): PixelTemplate {
  const t = createEmptyTemplate();
  drawSymmetric(t, 0, 6, 6, 1, 1);
  drawSymmetric(t, 0, 7, 8, 4, 1);
  drawPixel(t, 3, 7, 2); drawPixel(t, 12, 7, 2);
  drawPixel(t, 5, 8, 4); drawPixel(t, 10, 8, 4);
  drawPixel(t, 3, 9, 3); drawPixel(t, 12, 9, 3);
  drawSymmetric(t, -1, 10, 4, 1, 2);
  drawSymmetric(t, 1, 10, 4, 1, 2);
  return t;
}

function createSword(): PixelTemplate {
  const t = createEmptyTemplate();
  fillRect(t, 13, 2, 1, 9, 1);
  fillRect(t, 14, 3, 1, 7, 2);
  fillRect(t, 11, 11, 5, 1, 3);
  fillRect(t, 13, 12, 1, 2, 4);
  drawPixel(t, 13, 1, 2);
  return t;
}

function createStaff(): PixelTemplate {
  const t = createEmptyTemplate();
  fillRect(t, 2, 4, 1, 12, 4);
  drawPixel(t, 2, 2, 1);
  drawPixel(t, 1, 3, 1); drawPixel(t, 3, 3, 1);
  fillRect(t, 1, 4, 3, 1, 1);
  drawPixel(t, 2, 3, 5);
  drawPixel(t, 1, 4, 5); drawPixel(t, 3, 4, 5);
  drawPixel(t, 2, 5, 5);
  return t;
}

function createDaggers(): PixelTemplate {
  const t = createEmptyTemplate();
  fillRect(t, 1, 7, 1, 4, 1);
  drawPixel(t, 2, 8, 2);
  drawPixel(t, 1, 11, 4);
  fillRect(t, 14, 6, 1, 3, 1);
  drawPixel(t, 13, 7, 2);
  drawPixel(t, 14, 9, 4);
  return t;
}

function createAmulet(): PixelTemplate {
  const t = createEmptyTemplate();
  drawPixel(t, 8, 7, 1);
  drawPixel(t, 7, 8, 1); drawPixel(t, 9, 8, 1);
  drawPixel(t, 8, 9, 1);
  drawPixel(t, 8, 8, 2);
  return t;
}

function createEarrings(): PixelTemplate {
  const t = createEmptyTemplate();
  drawPixel(t, 3, 4, 1);
  drawPixel(t, 12, 4, 1);
  drawPixel(t, 3, 5, 2);
  drawPixel(t, 12, 5, 2);
  return t;
}

function createWarPaint(): PixelTemplate {
  const t = createEmptyTemplate();
  drawPixel(t, 5, 4, 1); drawPixel(t, 10, 4, 1);
  drawPixel(t, 4, 5, 1); drawPixel(t, 5, 5, 1);
  drawPixel(t, 10, 5, 1); drawPixel(t, 11, 5, 1);
  return t;
}

export const RACE_TEMPLATES: Record<Race, RaceTemplates> = {
  human: {
    body: createHumanBody(),
    hair: [createHairStyle1(), createHairStyle2(), createHairStyle3()],
    defaultHairIndex: 0,
  },
  elf: {
    body: createElfBody(),
    hair: [createHairStyle2(), createHairStyle3(), createHairStyle1()],
    defaultHairIndex: 0,
  },
  orc: {
    body: createOrcBody(),
    hair: [createHairStyle3(), createHairStyle1(), createHairStyle2()],
    defaultHairIndex: 0,
  },
};

export const CLASS_TEMPLATES: Record<CharacterClass, ClassTemplates> = {
  warrior: {
    clothes: createWarriorClothes(),
    weapon: createSword(),
    accessory: createWarPaint(),
  },
  mage: {
    clothes: createMageClothes(),
    weapon: createStaff(),
    accessory: createAmulet(),
  },
  rogue: {
    clothes: createRogueClothes(),
    weapon: createDaggers(),
    accessory: createEarrings(),
  },
};

export const SPRITE_SIZE = { width: CHAR_WIDTH, height: CHAR_HEIGHT };
export const EXPORT_SIZE = 100;
export const PREVIEW_SCALE = 3;
