export type EmotionType = 'joy' | 'miss' | 'adventure' | 'contemplation';

export interface PixelData {
  x: number;
  y: number;
  emotion: EmotionType;
  color: string;
  gridX: number;
  gridY: number;
}

export interface PlanetData {
  seed: number;
  pixels: PixelData[];
  emotionDistribution: Record<EmotionType, number>;
  radius: number;
}

const EMOTIONS: EmotionType[] = ['joy', 'miss', 'adventure', 'contemplation'];

const EMOTION_GRADIENTS: Record<EmotionType, [number, number, number][]> = {
  joy: [
    [255, 179, 71],
    [255, 215, 0],
    [255, 165, 0],
    [255, 193, 7],
    [255, 228, 132]
  ],
  miss: [
    [255, 182, 193],
    [155, 89, 182],
    [218, 112, 214],
    [186, 85, 211],
    [255, 150, 180]
  ],
  adventure: [
    [46, 204, 113],
    [52, 152, 219],
    [0, 184, 148],
    [39, 174, 96],
    [106, 198, 255]
  ],
  contemplation: [
    [52, 73, 94],
    [93, 109, 126],
    [75, 94, 115],
    [44, 62, 80],
    [108, 122, 137]
  ]
};

export const EMOTION_LABELS: Record<EmotionType, string> = {
  joy: '快乐',
  miss: '思念',
  adventure: '冒险',
  contemplation: '沉思'
};

function seededRandom(seed: number): () => number {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function lerpColor(
  c1: [number, number, number],
  c2: [number, number, number],
  t: number
): [number, number, number] {
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * t),
    Math.round(c1[1] + (c2[1] - c1[1]) * t),
    Math.round(c1[2] + (c2[2] - c1[2]) * t)
  ];
}

function rgbToString(rgb: [number, number, number]): string {
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

export function getEmotionColor(emotion: EmotionType, variance: number): string {
  const palette = EMOTION_GRADIENTS[emotion];
  const idx = Math.min(
    Math.floor(variance * palette.length),
    palette.length - 2
  );
  const t = variance * palette.length - idx;
  const color = lerpColor(palette[idx], palette[idx + 1], t);
  return rgbToString(color);
}

function pickEmotion(rand: () => number): EmotionType {
  const r = rand();
  if (r < 0.28) return 'joy';
  if (r < 0.52) return 'miss';
  if (r < 0.76) return 'adventure';
  return 'contemplation';
}

export function generatePlanet(seed: number, radius: number): PlanetData {
  const rand = seededRandom(seed);
  const pixelSize = 8;
  const pixels: PixelData[] = [];
  const distribution: Record<EmotionType, number> = {
    joy: 0,
    miss: 0,
    adventure: 0,
    contemplation: 0
  };

  const gridCount = Math.ceil((radius * 2) / pixelSize);
  const center = radius;

  for (let gy = 0; gy < gridCount; gy++) {
    for (let gx = 0; gx < gridCount; gx++) {
      const px = gx * pixelSize + pixelSize / 2;
      const py = gy * pixelSize + pixelSize / 2;
      const dx = px - center;
      const dy = py - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= radius - pixelSize / 2) {
        const emotion = pickEmotion(rand);
        const variance = rand();
        const color = getEmotionColor(emotion, variance);
        distribution[emotion]++;
        pixels.push({
          x: gx * pixelSize,
          y: gy * pixelSize,
          emotion,
          color,
          gridX: gx,
          gridY: gy
        });
      }
    }
  }

  const total = pixels.length || 1;
  for (const e of EMOTIONS) {
    distribution[e] = distribution[e] / total;
  }

  return {
    seed,
    pixels,
    emotionDistribution: distribution,
    radius
  };
}
