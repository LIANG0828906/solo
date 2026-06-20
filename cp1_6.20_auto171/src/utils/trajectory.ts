import { PlayerStart, JumpParams, TrajectoryPoint, PHYSICS } from '@/types/shared';

export function calculateTrajectory(start: PlayerStart, params: JumpParams): TrajectoryPoint[] {
  const raw: TrajectoryPoint[] = [];
  const { GRAVITY, DT, MAX_T } = PHYSICS;
  let t = 0;
  while (t <= MAX_T) {
    const x = start.x + params.vx * t;
    const y = start.y - params.vy * t + 0.5 * GRAVITY * t * t;
    const vy = -params.vy + GRAVITY * t;
    raw.push({ x, y, t, vx: params.vx, vy });
    if (y > start.y + 500 && t > 0.1) break;
    t += DT;
  }
  if (raw.length === 0) return [];
  const result: TrajectoryPoint[] = [raw[0]];
  let acc = 0;
  for (let i = 1; i < raw.length; i++) {
    const prev = raw[i - 1];
    const curr = raw[i];
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const segLen = Math.sqrt(dx * dx + dy * dy);
    acc += segLen;
    while (acc >= PHYSICS.POINT_SPACING) {
      const overshoot = acc - PHYSICS.POINT_SPACING;
      const ratio = segLen > 0 ? (segLen - overshoot) / segLen : 0;
      const interp: TrajectoryPoint = {
        x: prev.x + dx * ratio,
        y: prev.y + dy * ratio,
        t: prev.t + DT * ratio,
        vx: params.vx,
        vy: prev.vy + GRAVITY * DT * ratio,
      };
      result.push(interp);
      acc -= PHYSICS.POINT_SPACING;
      if (result.length > 2000) break;
    }
    if (result.length > 2000) break;
  }
  const lastRaw = raw[raw.length - 1];
  const lastRes = result[result.length - 1];
  if (Math.hypot(lastRaw.x - lastRes.x, lastRaw.y - lastRes.y) > PHYSICS.POINT_SPACING * 0.5) {
    result.push(lastRaw);
  }
  return result;
}
