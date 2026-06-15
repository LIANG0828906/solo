export interface LaunchParams {
  angle: number;
  power: number;
  startX: number;
  startY: number;
}

export interface TrajectoryPoint {
  x: number;
  y: number;
}

export interface HitResult {
  hit: boolean;
  zoneId: 0 | 1 | 2 | null;
  zoneName: string;
  impactX: number;
  impactY: number;
  flightDuration: number;
  trajectory: TrajectoryPoint[];
  penetration: number;
}

export const POT_CONFIG = {
  centerX: 500,
  centerY: 300,
  radius: 75,
  potBottomY: 500,
  zones: [
    { id: 0 as const, name: '入门', depthPx: [0, 28], score: 10 },
    { id: 1 as const, name: '登堂', depthPx: [28, 65], score: 20 },
    { id: 2 as const, name: '入室', depthPx: [65, 110], score: 30 }
  ]
} as const;

export const ARROW_CONFIG = {
  GRAVITY: 980,
  POWER_BASE: 600,
  POWER_COEF: 5.5,
  FLIGHT_MIN: 0.5,
  FLIGHT_MAX: 1.5,
  TRAJECTORY_STEPS: 120
};

export function computeTrajectory(params: LaunchParams): TrajectoryPoint[] {
  const { angle, power, startX, startY } = params;
  const rad = (angle * Math.PI) / 180;
  const v0 = ARROW_CONFIG.POWER_BASE + power * ARROW_CONFIG.POWER_COEF;
  const vx = v0 * Math.cos(rad);
  const vy = v0 * Math.sin(rad);
  const duration = Math.max(
    ARROW_CONFIG.FLIGHT_MIN,
    Math.min(ARROW_CONFIG.FLIGHT_MAX, 0.55 + power * 0.0095)
  );
  const steps = ARROW_CONFIG.TRAJECTORY_STEPS;
  const dt = duration / steps;
  const pts: TrajectoryPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i * dt;
    const x = startX + vx * t;
    const y = startY - vy * t + 0.5 * ARROW_CONFIG.GRAVITY * t * t;
    pts.push({ x, y });
    if (y > 620) break;
  }
  return pts;
}

export function launchArrow(params: LaunchParams): HitResult {
  const trajectory = computeTrajectory(params);
  let hit = false;
  let zoneId: 0 | 1 | 2 | null = null;
  let zoneName = '';
  let penetration = 0;
  let impactX = trajectory[trajectory.length - 1].x;
  let impactY = trajectory[trajectory.length - 1].y;
  let flightDuration = (trajectory.length - 1) * ((Math.max(
    ARROW_CONFIG.FLIGHT_MIN,
    Math.min(ARROW_CONFIG.FLIGHT_MAX, 0.55 + params.power * 0.0095)
  )) / ARROW_CONFIG.TRAJECTORY_STEPS);

  const { centerX, centerY, radius, zones, potBottomY } = POT_CONFIG;
  const leftEdge = centerX - radius;
  const rightEdge = centerX + radius;

  for (let i = 1; i < trajectory.length; i++) {
    const prev = trajectory[i - 1];
    const curr = trajectory[i];
    const crossesX =
      (prev.x <= rightEdge && curr.x >= leftEdge) ||
      (curr.x <= rightEdge && prev.x >= leftEdge);

    if (crossesX) {
      const tPot = Math.max(0, Math.min(1,
        (curr.x >= prev.x)
          ? (leftEdge - prev.x) / Math.max(0.0001, curr.x - prev.x)
          : (rightEdge - prev.x) / Math.max(0.0001, curr.x - prev.x)
      ));
      const yAtEntry = prev.y + (curr.y - prev.y) * tPot;

      if (yAtEntry >= centerY - 15 && yAtEntry <= centerY + 20) {
        const enterY = Math.max(centerY, yAtEntry);
        let maxPenetrationY = enterY;
        let j = i;
        while (j < trajectory.length) {
          const tp = trajectory[j];
          if (tp.y > maxPenetrationY) maxPenetrationY = tp.y;
          if (tp.y > potBottomY || tp.x < leftEdge - 30 || tp.x > rightEdge + 30) break;
          j++;
        }
        penetration = maxPenetrationY - centerY;
        impactX = centerX + (Math.random() - 0.5) * radius * 0.5;
        impactY = Math.min(centerY + penetration, potBottomY);

        for (const z of zones) {
          if (penetration >= z.depthPx[0] && penetration < z.depthPx[1]) {
            zoneId = z.id;
            zoneName = z.name;
            hit = true;
            break;
          }
        }
        if (!hit && penetration >= zones[zones.length - 1].depthPx[1]) {
          zoneId = 2;
          zoneName = zones[2].name;
          hit = true;
        }
        if (!hit && penetration > 0) {
          zoneId = 0;
          zoneName = zones[0].name;
          hit = true;
        }
        break;
      }
    }
  }

  if (!hit) {
    for (let i = trajectory.length - 1; i >= 0; i--) {
      if (trajectory[i].y <= 580) {
        impactX = trajectory[i].x;
        impactY = 580;
        break;
      }
    }
  }

  return {
    hit,
    zoneId,
    zoneName,
    impactX,
    impactY,
    flightDuration,
    trajectory,
    penetration
  };
}

export function getArrowPosition(
  trajectory: TrajectoryPoint[],
  progress: number
): { pos: TrajectoryPoint; angleDeg: number } {
  const total = trajectory.length - 1;
  const idxF = Math.max(0, Math.min(total, progress * total));
  const idx = Math.floor(idxF);
  const frac = idxF - idx;
  const a = trajectory[idx];
  const b = trajectory[Math.min(total, idx + 1)];
  const pos = { x: a.x + (b.x - a.x) * frac, y: a.y + (b.y - a.y) * frac };
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  return { pos, angleDeg };
}

export function getZoneScore(zoneId: 0 | 1 | 2): number {
  return POT_CONFIG.zones[zoneId].score;
}
