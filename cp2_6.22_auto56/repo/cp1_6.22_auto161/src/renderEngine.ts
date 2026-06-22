import Konva from 'konva';
import { Obstacle, getObstacleVertices } from './levelDataService';

export interface LightCone {
  origin: { x: number; y: number };
  angle: number;
  halfConeAngle: number;
  range: number;
}

export interface ShadowPolygon {
  points: number[];
}

export interface PlayerRenderState {
  x: number;
  y: number;
  radius: number;
}

export interface FlashlightRenderState {
  angle: number;
  range: number;
  coneAngle: number;
  isOn: boolean;
  isFlickering: boolean;
}

export interface ButtonRenderState {
  id: string;
  x: number;
  y: number;
  radius: number;
  activated: boolean;
  pulsePhase: number;
}

export interface DoorRenderState {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  openProgress: number;
}

export interface PlatformRenderState {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Particle {
  x: number;
  y: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface BatteryPackRenderState {
  id: string;
  x: number;
  y: number;
  size: number;
  pulsePhase: number;
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function computeShadows(
  light: LightCone,
  obstacles: Obstacle[]
): ShadowPolygon[] {
  const shadows: ShadowPolygon[] = [];
  const { origin, angle, halfConeAngle, range } = light;
  const radAngle = degToRad(angle);
  const radHalfCone = degToRad(halfConeAngle);

  for (const obstacle of obstacles) {
    const vertices = getObstacleVertices(obstacle);
    if (vertices.length < 2) continue;

    let minAngle = Infinity;
    let maxAngle = -Infinity;
    let nearestVertex: { x: number; y: number } | null = null;
    let minDist = Infinity;

    for (const v of vertices) {
      const dx = v.x - origin.x;
      const dy = v.y - origin.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist && dist > 0) {
        minDist = dist;
        nearestVertex = v;
      }
      const vertexAngle = Math.atan2(dy, dx);
      let angleDiff = vertexAngle - radAngle;
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
      if (Math.abs(angleDiff) <= radHalfCone + 0.3) {
        minAngle = Math.min(minAngle, vertexAngle);
        maxAngle = Math.max(maxAngle, vertexAngle);
      }
    }

    if (!nearestVertex || minAngle === Infinity) continue;

    const shadowRange = range * 1.5;
    const p1 = {
      x: origin.x + Math.cos(minAngle - 0.05) * shadowRange,
      y: origin.y + Math.sin(minAngle - 0.05) * shadowRange,
    };
    const p2 = {
      x: origin.x + Math.cos(maxAngle + 0.05) * shadowRange,
      y: origin.y + Math.sin(maxAngle + 0.05) * shadowRange,
    };

    const points: number[] = [];
    for (const v of vertices) {
      points.push(v.x, v.y);
    }
    points.push(p2.x, p2.y, p1.x, p1.y);

    shadows.push({ points });
  }

  return shadows;
}

export function isPointInCone(
  point: { x: number; y: number },
  light: LightCone,
  innerOnly: boolean = false
): boolean {
  const dx = point.x - light.origin.x;
  const dy = point.y - light.origin.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > light.range || dist < 1) return false;

  const pointAngle = Math.atan2(dy, dx);
  const radAngle = degToRad(light.angle);
  const threshold = innerOnly ? degToRad(15) : degToRad(light.halfConeAngle);

  let diff = pointAngle - radAngle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;

  return Math.abs(diff) <= threshold;
}

export function pointInPolygon(
  point: { x: number; y: number },
  polygon: number[]
): boolean {
  let inside = false;
  const n = polygon.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i * 2],
      yi = polygon[i * 2 + 1];
    const xj = polygon[j * 2],
      yj = polygon[j * 2 + 1];
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + 1e-10) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function isPointInActiveLight(
  point: { x: number; y: number },
  light: LightCone,
  shadows: ShadowPolygon[]
): boolean {
  if (!isPointInCone(point, light, true)) return false;
  for (const shadow of shadows) {
    if (pointInPolygon(point, shadow.points)) return false;
  }
  return true;
}

export function circleInActiveLight(
  cx: number,
  cy: number,
  radius: number,
  light: LightCone,
  shadows: ShadowPolygon[]
): boolean {
  const samplePoints = [
    { x: cx, y: cy },
    { x: cx + radius * 0.7, y: cy },
    { x: cx - radius * 0.7, y: cy },
    { x: cx, y: cy + radius * 0.7 },
    { x: cx, y: cy - radius * 0.7 },
    { x: cx + radius * 0.5, y: cy + radius * 0.5 },
    { x: cx - radius * 0.5, y: cy - radius * 0.5 },
    { x: cx + radius * 0.5, y: cy - radius * 0.5 },
    { x: cx - radius * 0.5, y: cy + radius * 0.5 },
  ];
  for (const p of samplePoints) {
    if (!isPointInActiveLight(p, light, shadows)) return false;
  }
  return true;
}

export function drawScene(params: {
  layer: Konva.Layer;
  width: number;
  height: number;
  player: PlayerRenderState;
  flashlight: FlashlightRenderState;
  obstacles: Obstacle[];
  buttons: ButtonRenderState[];
  doors: DoorRenderState[];
  platforms: PlatformRenderState[];
  shadows: ShadowPolygon[];
  particles: Particle[];
  batteryPacks: BatteryPackRenderState[];
  exit: { x: number; y: number; width: number; height: number };
  allButtonsActivated: boolean;
}): void {
  const {
    layer,
    width,
    height,
    player,
    flashlight,
    obstacles,
    buttons,
    doors,
    platforms,
    shadows,
    particles,
    batteryPacks,
    exit,
    allButtonsActivated,
  } = params;

  layer.destroyChildren();

  const vignette = new Konva.Shape({
    sceneFunc: (ctx, shape) => {
      const grad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.3,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.7
      );
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.setAttr('fillStyle', grad);
      ctx.fillRect(0, 0, width, height);
      ctx.fillStrokeShape(shape);
    },
    listening: false,
    perfectDrawEnabled: false,
  });
  layer.add(vignette);

  const exitRect = new Konva.Rect({
    x: exit.x,
    y: exit.y,
    width: exit.width,
    height: exit.height,
    fill: allButtonsActivated ? '#00FF00' : '#333333',
    opacity: allButtonsActivated ? 0.8 : 0.4,
    stroke: allButtonsActivated ? '#00FF00' : '#555555',
    strokeWidth: 2,
    shadowColor: allButtonsActivated ? '#00FF00' : 'transparent',
    shadowBlur: allButtonsActivated ? 15 : 0,
  });
  layer.add(exitRect);

  for (const obs of obstacles) {
    if (obs.type === 'rect') {
      layer.add(
        new Konva.Rect({
          x: obs.x,
          y: obs.y,
          width: obs.width || 0,
          height: obs.height || 0,
          fill: '#AAAAAA',
          stroke: '#888888',
          strokeWidth: 1,
        })
      );
    } else {
      layer.add(
        new Konva.Line({
          points: [
            ...(obs.points || []).reduce<number[]>((acc, v, i) => {
              const base = i % 2 === 0 ? obs.x : obs.y;
              acc.push(base + v);
              return acc;
            }, []),
          ],
          closed: true,
          fill: '#AAAAAA',
          stroke: '#888888',
          strokeWidth: 1,
        })
      );
    }
  }

  if (flashlight.isOn && !flashlight.isFlickering) {
    drawLightCone(layer, player, flashlight);
  } else if (flashlight.isFlickering) {
    if (Math.random() > 0.5) {
      drawLightCone(layer, player, flashlight);
    }
  }

  for (const shadow of shadows) {
    layer.add(
      new Konva.Line({
        points: shadow.points,
        closed: true,
        fill: 'rgba(0,0,0,0.25)',
        listening: false,
        perfectDrawEnabled: false,
      })
    );
  }

  for (const door of doors) {
    const openOffset = door.openProgress * door.height;
    layer.add(
      new Konva.Rect({
        x: door.x,
        y: door.y + openOffset,
        width: door.width,
        height: door.height * (1 - door.openProgress),
        fill: door.openProgress < 1 ? '#5C4033' : 'transparent',
        stroke: door.openProgress < 1 ? '#3E2723' : 'transparent',
        strokeWidth: 2,
        listening: false,
      })
    );
  }

  for (const plat of platforms) {
    layer.add(
      new Konva.Rect({
        x: plat.x,
        y: plat.y,
        width: plat.width,
        height: plat.height,
        fill: '#666688',
        stroke: '#8888AA',
        strokeWidth: 1,
      })
    );
  }

  for (const btn of buttons) {
    const baseAlpha = btn.activated ? 1 : 0.8 + 0.2 * btn.pulsePhase;
    layer.add(
      new Konva.Circle({
        x: btn.x,
        y: btn.y,
        radius: btn.radius,
        fill: btn.activated ? '#00FF00' : '#8B0000',
        opacity: baseAlpha,
        shadowColor: btn.activated ? '#00FF00' : '#FF4444',
        shadowBlur: btn.activated ? 20 : 8,
        stroke: btn.activated ? '#88FF88' : '#AA0000',
        strokeWidth: 2,
      })
    );
  }

  for (const bp of batteryPacks) {
    const alpha = 0.6 + 0.4 * Math.abs(bp.pulsePhase);
    const half = bp.size / 2;
    layer.add(
      new Konva.Line({
        points: [
          bp.x,
          bp.y - half,
          bp.x + half,
          bp.y,
          bp.x,
          bp.y + half,
          bp.x - half,
          bp.y,
        ],
        closed: true,
        fill: '#FFFFFF',
        opacity: alpha,
        shadowColor: '#FFFFFF',
        shadowBlur: 10,
      })
    );
  }

  for (const p of particles) {
    layer.add(
      new Konva.Circle({
        x: p.x,
        y: p.y,
        radius: 3,
        fill: '#FFD700',
        opacity: p.alpha * 0.5,
      })
    );
  }

  layer.add(
    new Konva.Circle({
      x: player.x,
      y: player.y,
      radius: player.radius,
      fill: '#FFD700',
      stroke: '#FFA500',
      strokeWidth: 2,
      shadowColor: '#FFFED4',
      shadowBlur: 8,
    })
  );
}

function drawLightCone(
  layer: Konva.Layer,
  player: PlayerRenderState,
  flashlight: FlashlightRenderState
): void {
  const { angle, range, coneAngle } = flashlight;
  const radAngle = degToRad(angle);
  const halfCone = degToRad(coneAngle / 2);
  const feather = 15;

  const points: number[] = [player.x, player.y];
  const segments = 30;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const currentAngle = radAngle - halfCone + coneAngle * (degToRad(t) / (degToRad(1)));
    const actualAngle = radAngle - halfCone + (2 * halfCone * t);
    points.push(
      player.x + Math.cos(actualAngle) * range,
      player.y + Math.sin(actualAngle) * range
    );
  }

  const lightShape = new Konva.Shape({
    sceneFunc: (ctx, shape) => {
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const currentAngle = radAngle - halfCone + 2 * halfCone * t;
        const px = player.x + Math.cos(currentAngle) * range;
        const py = player.y + Math.sin(currentAngle) * range;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();

      const gradient = ctx.createRadialGradient(
        player.x,
        player.y,
        0,
        player.x,
        player.y,
        range
      );
      gradient.addColorStop(0, 'rgba(255,255,255,0.6)');
      gradient.addColorStop(0.5, 'rgba(255,254,212,0.3)');
      gradient.addColorStop(1, 'rgba(255,254,212,0)');
      ctx.setAttr('fillStyle', gradient);
      ctx.fill();
      ctx.fillStrokeShape(shape);
    },
    listening: false,
    perfectDrawEnabled: false,
    opacity: 0.9,
  });

  layer.add(lightShape);

  const corePoints: number[] = [];
  const coreHalfCone = degToRad(15);
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const currentAngle = radAngle - coreHalfCone + 2 * coreHalfCone * t;
    corePoints.push(
      player.x + Math.cos(currentAngle) * range,
      player.y + Math.sin(currentAngle) * range
    );
  }
  corePoints.unshift(player.x, player.y);
}
