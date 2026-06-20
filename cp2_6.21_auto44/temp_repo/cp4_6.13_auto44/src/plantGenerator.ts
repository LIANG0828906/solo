export type Mood = 'happy' | 'calm' | 'anxious' | 'tired';

export interface MoodInfo {
  key: Mood;
  label: string;
  emoji: string;
  baseHue: number;
  saturationShift: number;
  lightnessShift: number;
  floatSpeed: number;
  floatType: 'fast' | 'steady' | 'irregular' | 'slow';
}

export const MOODS: Record<Mood, MoodInfo> = {
  happy: {
    key: 'happy',
    label: '开心',
    emoji: '😊',
    baseHue: 45,
    saturationShift: 10,
    lightnessShift: 8,
    floatSpeed: 1.8,
    floatType: 'fast',
  },
  calm: {
    key: 'calm',
    label: '平淡',
    emoji: '😌',
    baseHue: 135,
    saturationShift: 0,
    lightnessShift: 0,
    floatSpeed: 1.0,
    floatType: 'steady',
  },
  anxious: {
    key: 'anxious',
    label: '焦虑',
    emoji: '😟',
    baseHue: 280,
    saturationShift: 15,
    lightnessShift: -5,
    floatSpeed: 2.2,
    floatType: 'irregular',
  },
  tired: {
    key: 'tired',
    label: '疲惫',
    emoji: '😴',
    baseHue: 210,
    saturationShift: -20,
    lightnessShift: -8,
    floatSpeed: 0.5,
    floatType: 'slow',
  },
};

export interface Root {
  id: string;
  startX: number;
  startY: number;
  length: number;
  angle: number;
  thickness: number;
}

export interface Trunk {
  id: string;
  baseX: number;
  baseY: number;
  height: number;
  thickness: number;
  curve: number;
  segments: Array<{ x: number; y: number; thickness: number }>;
}

export interface Branch {
  id: string;
  parentId: string;
  startX: number;
  startY: number;
  length: number;
  angle: number;
  thickness: number;
  level: number;
  curve: number;
}

export interface Leaf {
  id: string;
  parentBranchId: string;
  x: number;
  y: number;
  size: number;
  angle: number;
  shape: 'round' | 'pointed' | 'heart' | 'long';
  color: { h: number; s: number; l: number };
  veinColor: { h: number; s: number; l: number };
}

export interface PlantData {
  version: number;
  seed: number;
  mood: Mood;
  moodInfo: MoodInfo;
  input: {
    steps: number;
    water: number;
    workHours: number;
  };
  metrics: {
    trunkHeight: number;
    trunkThickness: number;
    branchCount: number;
    leafCount: number;
    avgLeafSize: number;
    leafDensity: number;
  };
  colorPalette: {
    trunkStart: { h: number; s: number; l: number };
    trunkEnd: { h: number; s: number; l: number };
    branchStart: { h: number; s: number; l: number };
    branchEnd: { h: number; s: number; l: number };
    leafBaseHue: number;
    leafSatRange: [number, number];
    leafLightRange: [number, number];
    accent: { h: number; s: number; l: number };
  };
  animation: {
    totalDuration: number;
    floatSpeed: number;
    floatType: 'fast' | 'steady' | 'irregular' | 'slow';
    swayAmount: number;
  };
  roots: Root[];
  trunk: Trunk;
  branches: Branch[];
  leaves: Leaf[];
  viewBox: { x: number; y: number; w: number; h: number };
}

interface GenerateOptions {
  steps: number;
  water: number;
  workHours: number;
  mood: Mood;
}

function seedRandom(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function normalizeSteps(steps: number): number {
  return clamp(steps / 15000, 0, 1);
}

function normalizeWater(water: number): number {
  return clamp(water / 12, 0, 1);
}

function normalizeWork(work: number): number {
  return clamp(work / 14, 0, 1);
}

function generateTrunkSegments(
  baseX: number,
  baseY: number,
  height: number,
  thickness: number,
  curve: number,
  rand: () => number
): Trunk['segments'] {
  const segmentCount = Math.max(8, Math.floor(height / 18));
  const segments: Trunk['segments'] = [];
  let x = baseX;
  let y = baseY;

  for (let i = 0; i <= segmentCount; i++) {
    const t = i / segmentCount;
    const curveOffset = Math.sin(t * Math.PI * 1.5) * curve;
    const wobble = (rand() - 0.5) * 2 * (1 - t * 0.7);
    x = baseX + curveOffset + wobble;
    y = baseY - height * t;
    const segThickness = thickness * (1 - t * 0.75);
    segments.push({ x, y, thickness: Math.max(1, segThickness) });
  }

  return segments;
}

export function generatePlantData(options: GenerateOptions): PlantData {
  const { steps, water, workHours, mood } = options;
  const moodInfo = MOODS[mood];

  const seed =
    Math.floor(Date.now() / 1000) ^
    Math.floor(steps * 7.3) ^
    Math.floor(water * 13.7) ^
    Math.floor(workHours * 19.1) ^
    moodInfo.baseHue;
  const rand = seedRandom(seed);

  const stepsNorm = normalizeSteps(steps);
  const waterNorm = normalizeWater(water);
  const workNorm = normalizeWork(workHours);

  const viewBoxW = 320;
  const viewBoxH = 440;
  const groundY = viewBoxH - 50;
  const centerX = viewBoxW / 2;

  const trunkHeight = lerp(100, 260, stepsNorm);
  const trunkThickness = lerp(6, 16, stepsNorm);
  const trunkCurve = (rand() - 0.5) * 24;

  const trunkSegments = generateTrunkSegments(
    centerX,
    groundY,
    trunkHeight,
    trunkThickness,
    trunkCurve,
    rand
  );

  const rootCount = 4 + Math.floor(rand() * 4);
  const roots: Root[] = [];
  for (let i = 0; i < rootCount; i++) {
    const t = i / (rootCount - 1);
    roots.push({
      id: `root-${i}`,
      startX: centerX + (t - 0.5) * trunkThickness * 1.2,
      startY: groundY,
      length: lerp(22, 50, rand()) + waterNorm * 12,
      angle: lerp(-80, 80, t) + (rand() - 0.5) * 18,
      thickness: lerp(2, 4.5, rand()),
    });
  }

  const baseBranchCount = Math.floor(lerp(5, 14, waterNorm));
  const extraBranches = Math.floor(waterNorm * 6);
  const totalBranchCount = baseBranchCount + extraBranches;

  const branches: Branch[] = [];
  const angleSpread = lerp(50, 90, waterNorm);

  for (let i = 0; i < totalBranchCount; i++) {
    const level = i < Math.floor(totalBranchCount * 0.6) ? 1 : 2;
    const heightRatio =
      level === 1
        ? lerp(0.35, 0.92, i / Math.floor(totalBranchCount * 0.6))
        : lerp(0.55, 0.98, rand());

    const segIdx = Math.min(
      trunkSegments.length - 1,
      Math.floor(heightRatio * (trunkSegments.length - 1))
    );
    const seg = trunkSegments[segIdx];

    const side = i % 2 === 0 ? 1 : -1;
    const baseAngle = side * lerp(25, angleSpread, rand());
    const angleVariance = (rand() - 0.5) * 20 * (1 - waterNorm * 0.4);
    const angle = baseAngle + angleVariance;

    const length = lerp(
      30,
      level === 1 ? 85 : 50,
      rand() * 0.6 + 0.4 + waterNorm * 0.3
    );

    branches.push({
      id: `branch-${i}`,
      parentId: 'trunk',
      startX: seg.x,
      startY: seg.y,
      length,
      angle,
      thickness: Math.max(
        1.2,
        seg.thickness * (level === 1 ? 0.5 : 0.3) * (0.7 + rand() * 0.4)
      ),
      level,
      curve: (rand() - 0.5) * 12,
    });
  }

  const leafDensity = lerp(1.0, 0.3, workNorm);
  const workRedness = workNorm;
  const baseHue = moodInfo.baseHue;
  const leafBaseHue = lerp(
    baseHue >= 180 ? baseHue : lerp(110, baseHue, 0.35),
    lerp(0, 15, workRedness),
    workRedness * 0.4
  );

  const leaves: Leaf[] = [];
  const leafShapes: Leaf['shape'][] = ['round', 'pointed', 'heart', 'long'];

  const leafCountPerBranch = Math.max(1, Math.floor(lerp(6, 2, 1 - leafDensity)));

  for (let b = 0; b < branches.length; b++) {
    const branch = branches[b];
    const branchLeafCount =
      Math.floor(leafCountPerBranch * (0.6 + rand() * 0.8)) +
      (branch.level === 1 ? 1 : 0);

    for (let l = 0; l < branchLeafCount; l++) {
      if (rand() > leafDensity + 0.1) continue;

      const t = lerp(0.3, 1, l / Math.max(1, branchLeafCount - 1));
      const bx =
        branch.startX +
        Math.cos((branch.angle * Math.PI) / 180) * branch.length * t;
      const by =
        branch.startY +
        Math.sin((branch.angle * Math.PI) / 180) * branch.length * t +
        Math.sin(t * Math.PI) * branch.curve * 0.5;

      const size = lerp(
        10,
        lerp(24, 12, workNorm),
        rand() * 0.5 + 0.4
      );

      const hue = leafBaseHue + (rand() - 0.5) * 25;
      const saturation = clamp(
        45 + moodInfo.saturationShift + (rand() - 0.5) * 18 - workRedness * 10,
        20,
        70
      );
      const lightness = clamp(
        48 + moodInfo.lightnessShift + (rand() - 0.5) * 12 - workRedness * 12,
        28,
        68
      );

      leaves.push({
        id: `leaf-${b}-${l}`,
        parentBranchId: branch.id,
        x: bx + (rand() - 0.5) * 4,
        y: by + (rand() - 0.5) * 4,
        size,
        angle: branch.angle + (rand() - 0.5) * 45,
        shape: leafShapes[Math.floor(rand() * leafShapes.length)],
        color: { h: hue, s: saturation, l: lightness },
        veinColor: {
          h: hue - 8,
          s: clamp(saturation + 10, 0, 100),
          l: clamp(lightness - 18, 15, 80),
        },
      });
    }
  }

  const topSeg = trunkSegments[trunkSegments.length - 1];
  const crownLeafCount = Math.floor(lerp(2, 8, leafDensity * rand()));
  for (let c = 0; c < crownLeafCount; c++) {
    const t = c / Math.max(1, crownLeafCount - 1);
    const angle = lerp(-70, 70, t) + (rand() - 0.5) * 20;
    const dist = lerp(5, 22, rand());
    const size = lerp(10, 20, rand());

    const hue = leafBaseHue + (rand() - 0.5) * 20;
    const saturation = clamp(
      50 + moodInfo.saturationShift + (rand() - 0.5) * 10 - workRedness * 8,
      25,
      70
    );
    const lightness = clamp(
      50 + moodInfo.lightnessShift + (rand() - 0.5) * 10 - workRedness * 10,
      30,
      68
    );

    leaves.push({
      id: `leaf-crown-${c}`,
      parentBranchId: 'trunk',
      x: topSeg.x + Math.cos((angle * Math.PI) / 180) * dist,
      y: topSeg.y - lerp(2, 10, rand()) + Math.sin((angle * Math.PI) / 180) * dist * 0.3,
      size,
      angle,
      shape: leafShapes[Math.floor(rand() * leafShapes.length)],
      color: { h: hue, s: saturation, l: lightness },
      veinColor: {
        h: hue - 6,
        s: clamp(saturation + 8, 0, 100),
        l: clamp(lightness - 16, 15, 80),
      },
    });
  }

  const trunkHue = 28 + moodInfo.saturationShift * -0.3;
  const branchHue = trunkHue + 6;
  const accentHue = baseHue;

  const avgLeafSize =
    leaves.length > 0
      ? leaves.reduce((s, l) => s + l.size, 0) / leaves.length
      : 0;

  const data: PlantData = {
    version: 1,
    seed,
    mood,
    moodInfo,
    input: { steps, water, workHours },
    metrics: {
      trunkHeight: Math.round(trunkHeight),
      trunkThickness: Math.round(trunkThickness * 10) / 10,
      branchCount: branches.length,
      leafCount: leaves.length,
      avgLeafSize: Math.round(avgLeafSize * 10) / 10,
      leafDensity: Math.round(leafDensity * 100) / 100,
    },
    colorPalette: {
      trunkStart: { h: trunkHue, s: 38, l: 38 },
      trunkEnd: { h: trunkHue - 4, s: 30, l: 55 },
      branchStart: { h: branchHue, s: 42, l: 40 },
      branchEnd: { h: branchHue, s: 35, l: 58 },
      leafBaseHue,
      leafSatRange: [30, 65],
      leafLightRange: [32, 65],
      accent: { h: accentHue, s: 55 + moodInfo.saturationShift, l: 52 },
    },
    animation: {
      totalDuration: 2000,
      floatSpeed: moodInfo.floatSpeed,
      floatType: moodInfo.floatType,
      swayAmount:
        moodInfo.floatType === 'irregular'
          ? 3.5
          : moodInfo.floatType === 'slow'
          ? 1.5
          : moodInfo.floatType === 'fast'
          ? 2.8
          : 2.0,
    },
    roots,
    trunk: {
      id: 'trunk',
      baseX: centerX,
      baseY: groundY,
      height: trunkHeight,
      thickness: trunkThickness,
      curve: trunkCurve,
      segments: trunkSegments,
    },
    branches,
    leaves,
    viewBox: { x: 0, y: 0, w: viewBoxW, h: viewBoxH },
  };

  return data;
}

export function formatDate(d: Date | number | string): string {
  const date = typeof d === 'number' || typeof d === 'string' ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDateTime(d: Date | number | string): string {
  const date = typeof d === 'number' || typeof d === 'string' ? new Date(d) : d;
  const dStr = formatDate(date);
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${dStr} ${h}:${m}`;
}
