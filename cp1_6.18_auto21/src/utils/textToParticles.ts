import { v4 as uuidv4 } from 'uuid';

export type EmotionType = 'joy' | 'sadness' | 'calm';
export type AnimationMode = 'ripple' | 'spiral' | 'firework';

export interface Particle {
  id: string;
  char: string;
  unicode: number;
  strokeCount: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  color: string;
  glowColor: string;
  glowRadius: number;
  glowOpacity: number;
  scale: number;
  rotation: number;
  opacity: number;
  delay: number;
  speedFactor: number;
  emotion: EmotionType;
  baseX: number;
  baseY: number;
  angle: number;
  spiralAngle: number;
}

export interface Ripple {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  createdAt: number;
}

const JOY_KEYWORDS = ['喜', '乐', '欢', '笑', '明', '阳', '光', '暖', '花', '香', '甜', '美', '爱', '心', '悦'];
const SADNESS_KEYWORDS = ['悲', '伤', '哀', '愁', '泪', '雨', '夜', '寒', '冷', '孤', '独', '寂', '寞', '恨', '怨'];

const EMOTION_COLORS: Record<EmotionType, string> = {
  joy: '#FF8C00',
  sadness: '#4169E1',
  calm: '#40E0D0',
};

const STROKE_COUNT_MAP: Record<string, number> = {
  '一': 1, '二': 2, '三': 3, '四': 5, '五': 4,
  '六': 4, '七': 2, '八': 2, '九': 2, '十': 2,
  '人': 2, '大': 3, '小': 3, '中': 4, '天': 4,
  '地': 6, '日': 4, '月': 4, '水': 4, '火': 4,
  '山': 3, '石': 5, '木': 4, '林': 8, '森': 12,
  '风': 4, '云': 4, '雨': 8, '雪': 11, '雷': 13,
  '花': 7, '草': 9, '树': 9, '叶': 5, '果': 8,
  '春': 9, '夏': 10, '秋': 9, '冬': 5, '年': 6,
  '爱': 10, '情': 11, '心': 4, '思': 9, '念': 8,
  '诗': 8, '书': 4, '画': 8, '歌': 14, '舞': 14,
  '光': 6, '影': 15, '星': 9, '辰': 7,
};

function estimateStrokeCount(char: string): number {
  if (STROKE_COUNT_MAP[char]) {
    return STROKE_COUNT_MAP[char];
  }
  const code = char.charCodeAt(0);
  if (code >= 0x4E00 && code <= 0x9FFF) {
    const base = Math.floor((code - 0x4E00) / 500);
    return Math.max(3, Math.min(25, base + 5));
  }
  return 8;
}

function analyzeEmotion(text: string): EmotionType {
  let joyScore = 0;
  let sadnessScore = 0;

  for (const char of text) {
    if (JOY_KEYWORDS.includes(char)) joyScore += 2;
    if (SADNESS_KEYWORDS.includes(char)) sadnessScore += 2;
  }

  if (joyScore > sadnessScore) return 'joy';
  if (sadnessScore > joyScore) return 'sadness';
  return 'calm';
}

function getGradientColor(index: number, total: number): string {
  const ratio = total <= 1 ? 0.5 : index / (total - 1);
  const r1 = 255, g1 = 215, b1 = 0;
  const r2 = 192, g2 = 192, b2 = 192;

  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);

  return `rgb(${r}, ${g}, ${b})`;
}

export function createRipple(x: number, y: number): Ripple {
  return {
    id: uuidv4(),
    x,
    y,
    radius: 0,
    maxRadius: 100,
    opacity: 0.8,
    createdAt: Date.now(),
  };
}

interface TextToParticlesOptions {
  text: string;
  canvasWidth: number;
  canvasHeight: number;
  fontSize?: number;
  spacing?: number;
}

export function textToParticles(options: TextToParticlesOptions): Particle[] {
  const { text, canvasWidth, canvasHeight, fontSize = 32, spacing = 20 } = options;

  const chars = Array.from(text).slice(0, 200);
  const emotion = analyzeEmotion(text);
  const totalWidth = chars.length * (fontSize + spacing) - spacing;
  const startX = (canvasWidth - totalWidth) / 2 + fontSize / 2;
  const centerY = canvasHeight / 2;

  return chars.map((char, index) => {
    const baseX = startX + index * (fontSize + spacing);
    const baseY = centerY;
    const angle = Math.atan2(baseY - canvasHeight / 2, baseX - canvasWidth / 2);

    return {
      id: uuidv4(),
      char,
      unicode: char.charCodeAt(0),
      strokeCount: estimateStrokeCount(char),
      x: baseX,
      y: baseY,
      targetX: baseX,
      targetY: baseY,
      vx: 0,
      vy: 0,
      color: getGradientColor(index, chars.length),
      glowColor: EMOTION_COLORS[emotion],
      glowRadius: 10 + Math.random() * 10,
      glowOpacity: 0.3 + Math.random() * 0.3,
      scale: 1,
      rotation: 0,
      opacity: 0,
      delay: index * 50,
      speedFactor: 0.5 + Math.random() * 0.7,
      emotion,
      baseX,
      baseY,
      angle,
      spiralAngle: index * 0.5,
    };
  });
}

export function updateParticle(
  particle: Particle,
  mode: AnimationMode,
  canvasWidth: number,
  canvasHeight: number,
  deltaTime: number,
  elapsed: number
): Particle {
  const dt = deltaTime / 16.67;
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  const effectiveTime = Math.max(0, elapsed - particle.delay);

  let { x, y, vx, vy, targetX, targetY, scale, rotation, opacity, spiralAngle } = particle;

  if (opacity < 1) {
    opacity = Math.min(1, opacity + 0.02 * dt);
  }

  switch (mode) {
    case 'ripple': {
      const baseRadius = Math.sqrt(
        Math.pow(particle.baseX - centerX, 2) + Math.pow(particle.baseY - centerY, 2)
      );
      const expansion = Math.min(effectiveTime * 0.15 * particle.speedFactor, 300);
      const radius = baseRadius + expansion;
      targetX = centerX + Math.cos(particle.angle) * radius;
      targetY = centerY + Math.sin(particle.angle) * radius;
      x += (targetX - x) * 0.05 * dt;
      y += (targetY - y) * 0.05 * dt;
      rotation += 0.01 * dt;
      break;
    }

    case 'spiral': {
      spiralAngle += 0.03 * particle.speedFactor * dt;
      const spiralRadius = spiralAngle * 15;
      targetX = centerX + Math.cos(spiralAngle) * spiralRadius;
      targetY = centerY + Math.sin(spiralAngle) * spiralRadius - spiralAngle * 8;
      x += (targetX - x) * 0.08 * dt;
      y += (targetY - y) * 0.08 * dt;
      rotation = spiralAngle;
      break;
    }

    case 'firework': {
      if (effectiveTime < 100) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        vx = Math.cos(angle) * speed * particle.speedFactor;
        vy = Math.sin(angle) * speed * particle.speedFactor - 2;
      }
      vy += 0.15 * dt;
      vx *= 0.98;
      vy *= 0.98;
      x += vx * dt;
      y += vy * dt;
      rotation += 0.05 * dt;
      break;
    }
  }

  return {
    ...particle,
    x,
    y,
    vx,
    vy,
    targetX,
    targetY,
    scale,
    rotation,
    opacity,
    spiralAngle,
  };
}

export function updateRipple(ripple: Ripple, deltaTime: number): Ripple {
  const dt = deltaTime / 16.67;
  const age = Date.now() - ripple.createdAt;
  const progress = Math.min(1, age / 500);

  return {
    ...ripple,
    radius: ripple.maxRadius * progress,
    opacity: 0.8 * (1 - progress),
  };
}
