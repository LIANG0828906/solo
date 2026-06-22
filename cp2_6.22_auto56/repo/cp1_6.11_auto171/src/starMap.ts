export interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  brightness: number;
  name: string;
  isKey: boolean;
}

export interface FragmentShape {
  bezierPoints: { cp1x: number; cp1y: number; cp2x: number; cp2y: number; ex: number; ey: number };
  innerArcStart: number;
  innerArcEnd: number;
}

export interface StarFragment {
  id: number;
  stars: Star[];
  shape: FragmentShape;
  correctX: number;
  correctY: number;
  correctRotation: number;
  currentX: number;
  currentY: number;
  currentRotation: number;
  initialX: number;
  initialY: number;
  initialRotation: number;
  isLocked: boolean;
  animation: FragmentAnimation | null;
  scale: number;
}

export interface FragmentAnimation {
  type: 'snap' | 'spring' | null;
  startTime: number;
  duration: number;
  startX: number;
  startY: number;
  startRotation: number;
  targetX: number;
  targetY: number;
  targetRotation: number;
  startScale: number;
  targetScale: number;
}

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 650;
export const STAR_MAP_CENTER_X = 400;
export const STAR_MAP_CENTER_Y = 325;
export const STAR_MAP_RADIUS = 250;
export const SNAP_THRESHOLD = 20;
export const FRAGMENT_COUNT = 6;

export const STAR_NAMES = [
  '天枢', '天璇', '天玑', '天权', '玉衡', '开阳', '摇光',
  '角宿', '亢宿', '氐宿', '房宿', '心宿', '尾宿', '箕宿',
  '斗宿', '牛宿', '女宿', '虚宿', '危宿', '室宿', '壁宿'
];

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t;
  const p = 0.3;
  return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
}

export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

export function generateStars(): Star[] {
  const stars: Star[] = [];
  const count = 50 + Math.floor(Math.random() * 31);
  
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * (STAR_MAP_RADIUS - 20);
    const x = STAR_MAP_CENTER_X + Math.cos(angle) * r;
    const y = STAR_MAP_CENTER_Y + Math.sin(angle) * r;
    const size = 0.3 + Math.random() * 0.9;
    const colorRatio = Math.random();
    const rColor = Math.round(250 - colorRatio * 15);
    const gColor = Math.round(240 - colorRatio * 30);
    const bColor = Math.round(230 - colorRatio * 60);
    const brightness = 0.5 + Math.random() * 0.5;
    const isKey = Math.random() < 0.25;
    
    stars.push({
      id: i,
      x,
      y,
      size,
      color: `rgb(${rColor}, ${gColor}, ${bColor})`,
      brightness,
      name: STAR_NAMES[i % STAR_NAMES.length],
      isKey,
    });
  }
  
  return stars.sort((a, b) => b.brightness - a.brightness);
}

export function generateFragments(stars: Star[]): StarFragment[] {
  const fragments: StarFragment[] = [];
  const sliceAngle = (Math.PI * 2) / FRAGMENT_COUNT;
  
  for (let i = 0; i < FRAGMENT_COUNT; i++) {
    const startAngle = i * sliceAngle;
    const endAngle = (i + 1) * sliceAngle;
    const midAngle = startAngle + sliceAngle / 2;
    
    const bezierAngleStart = startAngle + 0.2 + Math.random() * 0.2;
    const bezierAngleEnd = endAngle - 0.2 - Math.random() * 0.2;
    const cp1R = STAR_MAP_RADIUS * (0.4 + Math.random() * 0.3);
    const cp2R = STAR_MAP_RADIUS * (0.4 + Math.random() * 0.3);
    const startR = STAR_MAP_RADIUS * (0.9 + Math.random() * 0.05);
    const endR = STAR_MAP_RADIUS * (0.9 + Math.random() * 0.05);
    
    const sp1x = STAR_MAP_CENTER_X + Math.cos(bezierAngleStart) * startR;
    const sp1y = STAR_MAP_CENTER_Y + Math.sin(bezierAngleStart) * startR;
    const cp1x = STAR_MAP_CENTER_X + Math.cos(bezierAngleStart + 0.3) * cp1R;
    const cp1y = STAR_MAP_CENTER_Y + Math.sin(bezierAngleStart + 0.3) * cp1R;
    const cp2x = STAR_MAP_CENTER_X + Math.cos(bezierAngleEnd - 0.3) * cp2R;
    const cp2y = STAR_MAP_CENTER_Y + Math.sin(bezierAngleEnd - 0.3) * cp2R;
    const ep1x = STAR_MAP_CENTER_X + Math.cos(bezierAngleEnd) * endR;
    const ep1y = STAR_MAP_CENTER_Y + Math.sin(bezierAngleEnd) * endR;
    
    const fragStars = stars.filter(star => {
      const dx = star.x - STAR_MAP_CENTER_X;
      const dy = star.y - STAR_MAP_CENTER_Y;
      const starAngle = Math.atan2(dy, dx);
      let normAngle = starAngle;
      if (normAngle < 0) normAngle += Math.PI * 2;
      let normStart = startAngle;
      let normEnd = endAngle;
      if (normStart < 0) normStart += Math.PI * 2;
      if (normEnd < 0) normEnd += Math.PI * 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > STAR_MAP_RADIUS - 10) return false;
      if (normEnd > normStart) {
        return normAngle >= normStart && normAngle <= normEnd;
      } else {
        return normAngle >= normStart || normAngle <= normEnd;
      }
    });
    
    const offsetAngle = midAngle;
    const offsetDist = 150 + Math.random() * 100;
    const initX = STAR_MAP_CENTER_X + Math.cos(offsetAngle) * offsetDist;
    const initY = STAR_MAP_CENTER_Y + Math.sin(offsetAngle) * offsetDist;
    const initRot = (Math.random() - 0.5) * (Math.PI / 3);
    
    fragments.push({
      id: i,
      stars: fragStars,
      shape: {
        bezierPoints: { cp1x, cp1y, cp2x, cp2y, ex: ep1x, ey: ep1y },
        innerArcStart: startAngle,
        innerArcEnd: endAngle,
      },
      correctX: STAR_MAP_CENTER_X,
      correctY: STAR_MAP_CENTER_Y,
      correctRotation: 0,
      currentX: initX,
      currentY: initY,
      currentRotation: initRot,
      initialX: initX,
      initialY: initY,
      initialRotation: initRot,
      isLocked: false,
      animation: null,
      scale: 1,
    });
  }
  
  return fragments;
}

export function checkSnap(fragment: StarFragment): boolean {
  const dx = fragment.currentX - fragment.correctX;
  const dy = fragment.currentY - fragment.correctY;
  return Math.sqrt(dx * dx + dy * dy) < SNAP_THRESHOLD;
}

export function isAllFragmentsLocked(fragments: StarFragment[]): boolean {
  return fragments.every(f => f.isLocked);
}

export function findStarAtPoint(
  stars: Star[],
  x: number,
  y: number,
  rotationDeg: number = 0
): Star | null {
  const rad = (rotationDeg * Math.PI) / 180;
  const cosR = Math.cos(-rad);
  const sinR = Math.sin(-rad);
  
  for (const star of stars) {
    const relX = star.x - STAR_MAP_CENTER_X;
    const relY = star.y - STAR_MAP_CENTER_Y;
    const rotX = relX * cosR - relY * sinR + STAR_MAP_CENTER_X;
    const rotY = relX * sinR + relY * cosR + STAR_MAP_CENTER_Y;
    
    const dx = x - rotX;
    const dy = y - rotY;
    if (Math.sqrt(dx * dx + dy * dy) < 10) {
      return star;
    }
  }
  return null;
}

export function getRotatedStarPos(star: Star, rotationDeg: number): { x: number; y: number } {
  const rad = (rotationDeg * Math.PI) / 180;
  const cosR = Math.cos(rad);
  const sinR = Math.sin(rad);
  const relX = star.x - STAR_MAP_CENTER_X;
  const relY = star.y - STAR_MAP_CENTER_Y;
  return {
    x: relX * cosR - relY * sinR + STAR_MAP_CENTER_X,
    y: relX * sinR + relY * cosR + STAR_MAP_CENTER_Y,
  };
}

export function updateFragmentAnimation(fragment: StarFragment, currentTime: number): void {
  if (!fragment.animation) return;
  
  const anim = fragment.animation;
  const elapsed = currentTime - anim.startTime;
  const progress = Math.min(elapsed / anim.duration, 1);
  
  let eased: number;
  if (anim.type === 'snap') {
    eased = easeOutBack(progress);
  } else if (anim.type === 'spring') {
    eased = easeOutElastic(progress);
  } else {
    eased = easeOutQuad(progress);
  }
  
  fragment.currentX = lerp(anim.startX, anim.targetX, eased);
  fragment.currentY = lerp(anim.startY, anim.targetY, eased);
  fragment.currentRotation = lerp(anim.startRotation, anim.targetRotation, eased);
  fragment.scale = lerp(anim.startScale, anim.targetScale, eased);
  
  if (progress >= 1) {
    fragment.animation = null;
    if (anim.type === 'snap') {
      fragment.isLocked = true;
      fragment.scale = 1;
    } else if (anim.type === 'spring') {
      fragment.scale = 1;
    }
  }
}
