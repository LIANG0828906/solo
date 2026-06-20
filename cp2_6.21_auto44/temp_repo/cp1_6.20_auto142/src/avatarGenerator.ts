const PIXEL_SIZE = 8;
const GRID_SIZE = 8;

const COLOR_PALETTES = [
  { skin: '#ffcc99', hair: '#663300', armor: '#4466aa', accent: '#88aaff' },
  { skin: '#eebb88', hair: '#996633', armor: '#aa4444', accent: '#ff8888' },
  { skin: '#ddaa77', hair: '#333333', armor: '#44aa66', accent: '#88ffaa' },
  { skin: '#ffbb99', hair: '#cc9900', armor: '#8844aa', accent: '#cc88ff' },
  { skin: '#ccaa88', hair: '#660000', armor: '#666666', accent: '#aaaaaa' },
  { skin: '#ffddaa', hair: '#003366', armor: '#aa8844', accent: '#ffcc88' }
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const PIXEL_ART_TEMPLATES = [
  [
    '  HHHH  ',
    ' HHHHHH ',
    ' HSSeSSH',
    ' SSSSSS ',
    'AAAAAAAA',
    'AAAAAAA A',
    ' A AA A ',
    ' L    L '
  ],
  [
    '  HHHH  ',
    ' HHHHHH ',
    ' HSSSSH ',
    ' SSSSSS ',
    'AAAAAAAA',
    'A AAAAAA',
    ' A AA A ',
    ' L    L '
  ],
  [
    '   HH   ',
    '  HHHH  ',
    ' HSSSSH ',
    ' SSSSSS ',
    'AAAAAAAA',
    'AAAAAAAA',
    ' A AA A ',
    ' L    L '
  ],
  [
    '  HHHH  ',
    ' HHHHHH ',
    ' XSSSSX ',
    ' SSSSSS ',
    'AAAAAAAA',
    'A AAA AA',
    ' A AA A ',
    ' L    L '
  ]
];

export function generateAvatar(canvas: HTMLCanvasElement, seed?: string): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const actualSeed = seed || Math.random().toString(36).substring(2);
  const random = seededRandom(hashString(actualSeed));

  const paletteIndex = Math.floor(random() * COLOR_PALETTES.length);
  const palette = COLOR_PALETTES[paletteIndex];
  const templateIndex = Math.floor(random() * PIXEL_ART_TEMPLATES.length);
  const template = PIXEL_ART_TEMPLATES[templateIndex];

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const offsetX = (canvas.width - GRID_SIZE * PIXEL_SIZE) / 2;
  const offsetY = (canvas.height - GRID_SIZE * PIXEL_SIZE) / 2;

  for (let y = 0; y < template.length; y++) {
    const row = template[y];
    for (let x = 0; x < row.length; x++) {
      const pixel = row[x];
      let color: string | null = null;

      switch (pixel) {
        case 'H': color = palette.hair; break;
        case 'S': color = palette.skin; break;
        case 'A': color = palette.armor; break;
        case 'L': color = palette.armor; break;
        case 'X': color = palette.accent; break;
        case 'e':
          color = '#ffffff';
          break;
        default:
          color = null;
      }

      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(
          offsetX + x * PIXEL_SIZE,
          offsetY + y * PIXEL_SIZE,
          PIXEL_SIZE,
          PIXEL_SIZE
        );

        if (pixel === 'e') {
          ctx.fillStyle = '#000000';
          ctx.fillRect(
            offsetX + x * PIXEL_SIZE + PIXEL_SIZE / 4,
            offsetY + y * PIXEL_SIZE + PIXEL_SIZE / 4,
            PIXEL_SIZE / 2,
            PIXEL_SIZE / 2
          );
        }
      }
    }
  }
}
