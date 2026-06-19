export interface Star {
  id: number;
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
  angularSpeed: number;
  angle: number;
  orbitRadius: number;
  height: number;
  twinklePhase: number;
  screenX?: number;
  screenY?: number;
  screenRadius?: number;
  depth?: number;
}

export interface Camera {
  rotationX: number;
  rotationY: number;
  zoom: number;
  focalLength: number;
}

export interface Settings {
  rotationSpeed: number;
  twinkleAmount: number;
  trailDuration: number;
  starCount: number;
  isMobile: boolean;
}

const STAR_COLORS = ['#FFFFFF', '#9AC4F8'];
const GOLDEN_ANGLE = 2.39996;

let starArray: Star[] = [];

export function generateStars(count: number): Star[] {
  const stars: Star[] = [];
  const galaxyScale = 250;
  const galaxyHeight = 80;

  for (let i = 0; i < count; i++) {
    const angle = i * GOLDEN_ANGLE;
    const radius = Math.sqrt(i / count) * galaxyScale;
    const height = (Math.random() - 0.5) * galaxyHeight * (1 - radius / galaxyScale);
    const isWhite = Math.random() > 0.4;

    stars.push({
      id: i,
      x: radius * Math.cos(angle),
      y: height,
      z: radius * Math.sin(angle),
      radius: 2 + Math.random() * 3,
      color: isWhite ? STAR_COLORS[0] : STAR_COLORS[1],
      angularSpeed: 0.01 + Math.random() * 0.02,
      angle: angle,
      orbitRadius: radius,
      height: height,
      twinklePhase: Math.random() * Math.PI * 2,
    });
  }

  return stars;
}

export function initStarfield(count: number): void {
  starArray = generateStars(count);
}

export function updateStars(deltaTime: number, settings: Settings): void {
  const { rotationSpeed } = settings;
  const speedMultiplier = rotationSpeed / 0.03;

  for (let i = 0; i < starArray.length; i++) {
    const star = starArray[i];
    star.angle += star.angularSpeed * speedMultiplier * deltaTime;
    star.x = star.orbitRadius * Math.cos(star.angle);
    star.z = star.orbitRadius * Math.sin(star.angle);
    star.twinklePhase += deltaTime * 3;
  }
}

export function projectStars(camera: Camera, centerX: number, centerY: number, settings: Settings): void {
  const { rotationX, rotationY, zoom, focalLength } = camera;
  const cosY = Math.cos(rotationY);
  const sinY = Math.sin(rotationY);
  const cosX = Math.cos(rotationX);
  const sinX = Math.sin(rotationX);

  for (let i = 0; i < starArray.length; i++) {
    const star = starArray[i];
    
    let x = star.x * cosY - star.z * sinY;
    let z = star.x * sinY + star.z * cosY;
    let y = star.y * cosX - z * sinX;
    z = star.y * sinX + z * cosX;

    const perspective = focalLength / (z + focalLength);
    const twinkle = 1 + Math.sin(star.twinklePhase) * settings.twinkleAmount * 0.1;

    star.screenX = centerX + x * perspective * zoom;
    star.screenY = centerY + y * perspective * zoom;
    star.screenRadius = star.radius * perspective * zoom * twinkle;
    star.depth = z;
  }

  starArray.sort((a, b) => (b.depth || 0) - (a.depth || 0));
}

export function drawStars(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  settings: Settings
): void {
  const { isMobile } = settings;

  for (let i = 0; i < starArray.length; i++) {
    const star = starArray[i];
    if (star.screenX === undefined || star.screenY === undefined || star.screenRadius === undefined) continue;
    if (star.depth && star.depth < -camera.focalLength * 0.8) continue;

    const r = star.screenRadius;
    if (r < 0.3) continue;

    ctx.beginPath();
    ctx.fillStyle = star.color;

    if (!isMobile && r > 1.5 && (star.depth || 0) > -50) {
      const gradient = ctx.createRadialGradient(
        star.screenX, star.screenY, 0,
        star.screenX, star.screenY, r * 2.5
      );
      gradient.addColorStop(0, star.color);
      gradient.addColorStop(0.4, star.color + 'CC');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.arc(star.screenX, star.screenY, r * 2.5, 0, Math.PI * 2);
    } else {
      ctx.arc(star.screenX, star.screenY, r, 0, Math.PI * 2);
    }
    
    ctx.fill();
  }
}

export function getStarAtPosition(screenX: number, screenY: number, threshold: number = 8): Star | null {
  for (let i = 0; i < starArray.length; i++) {
    const star = starArray[i];
    if (star.screenX === undefined || star.screenY === undefined || star.screenRadius === undefined) continue;
    
    const dx = star.screenX - screenX;
    const dy = star.screenY - screenY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < Math.max(star.screenRadius * 2, threshold)) {
      return star;
    }
  }
  return null;
}

export function getStars(): Star[] {
  return starArray;
}

export function getStarById(id: number): Star | undefined {
  return starArray.find(s => s.id === id);
}

export { starArray };
