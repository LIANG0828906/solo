interface RotorAngles {
  frontLeft: number;
  frontRight: number;
  rearLeft: number;
  rearRight: number;
}

interface TrailParticle {
  pos: [number, number, number];
  alpha: number;
  timestamp: number;
}

type WorkerMessage =
  | { type: 'init'; waypoints: Array<[number, number, number]> }
  | { type: 'start'; angles: RotorAngles }
  | { type: 'updateAngles'; angles: RotorAngles }
  | { type: 'reset' }
  | { type: 'frame'; delta: number };

type WorkerResponse =
  | { type: 'transform'; position: [number, number, number]; rotation: [number, number, number] }
  | { type: 'rotorSpeeds'; speeds: [number, number, number, number] }
  | { type: 'trailParticles'; particles: Array<{ pos: [number, number, number]; alpha: number }> }
  | { type: 'attitude'; pitch: number; yaw: number };

let isFlying = false;
let waypoints: Array<[number, number, number]> = [];
let currentAngles: RotorAngles = {
  frontLeft: 15,
  frontRight: 15,
  rearLeft: 15,
  rearRight: 15
};

let pathProgress = 0;
let currentPosition: [number, number, number] = [0, 3, 0];
let currentRotation: [number, number, number] = [0, 0, 0];

const trailParticles: TrailParticle[] = [];
const MAX_TRAIL_PARTICLES = 250;
const TRAIL_FADE_TIME = 5000;

let accumulatedTime = 0;
let lastTrailEmit = 0;

const degToRad = (deg: number): number => deg * Math.PI / 180;
const radToDeg = (rad: number): number => rad * 180 / Math.PI;

function catmullRom(p0: [number, number, number], p1: [number, number, number], p2: [number, number, number], p3: [number, number, number], t: number): [number, number, number] {
  const t2 = t * t;
  const t3 = t2 * t;
  
  const result: [number, number, number] = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    result[i] = 0.5 * (
      (2 * p1[i]) +
      (-p0[i] + p2[i]) * t +
      (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * t2 +
      (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * t3
    );
  }
  return result;
}

function getPositionOnPath(progress: number): [number, number, number] {
  if (waypoints.length < 2) return [0, 3, 0];
  
  const n = waypoints.length;
  const totalSegments = n - 1;
  const scaledProgress = progress * totalSegments;
  const segmentIndex = Math.min(Math.floor(scaledProgress), totalSegments - 1);
  const t = scaledProgress - segmentIndex;
  
  const p0 = waypoints[Math.max(0, segmentIndex - 1)];
  const p1 = waypoints[segmentIndex];
  const p2 = waypoints[Math.min(n - 1, segmentIndex + 1)];
  const p3 = waypoints[Math.min(n - 1, segmentIndex + 2)];
  
  return catmullRom(p0, p1, p2, p3, t);
}

function getPathTangent(progress: number): [number, number, number] {
  const eps = 0.001;
  const p1 = getPositionOnPath(Math.max(0, progress - eps));
  const p2 = getPositionOnPath(Math.min(1, progress + eps));
  
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const dz = p2[2] - p1[2];
  
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (len < 0.0001) return [0, 0, -1];
  
  return [dx / len, dy / len, dz / len];
}

function calculateRotorSpeeds(angles: RotorAngles): [number, number, number, number] {
  const maxSpeed = degToRad(720);
  const factor = maxSpeed / 60;
  
  return [
    angles.frontLeft * factor,
    angles.frontRight * factor,
    angles.rearLeft * factor,
    angles.rearRight * factor
  ] as [number, number, number, number];
}

function calculateAttitude(angles: RotorAngles): { pitch: number; yaw: number; roll: number } {
  const avgFront = (angles.frontLeft + angles.frontRight) / 2;
  const avgRear = (angles.rearLeft + angles.rearRight) / 2;
  const avgLeft = (angles.frontLeft + angles.rearLeft) / 2;
  const avgRight = (angles.frontRight + angles.rearRight) / 2;
  
  const pitch = (avgRear - avgFront) * 0.8;
  const roll = (avgRight - avgLeft) * 0.6;
  const yawDiff = (angles.frontLeft + angles.rearRight) - (angles.frontRight + angles.rearLeft);
  const yaw = yawDiff * 0.5;
  
  return { pitch, yaw, roll };
}

function addTrailParticle(position: [number, number, number], timestamp: number): void {
  trailParticles.unshift({
    pos: [...position],
    alpha: 1,
    timestamp
  });
  
  if (trailParticles.length > MAX_TRAIL_PARTICLES) {
    trailParticles.pop();
  }
}

function updateTrailParticles(currentTime: number): Array<{ pos: [number, number, number]; alpha: number }> {
  const result: Array<{ pos: [number, number, number]; alpha: number }> = [];
  
  for (let i = 0; i < MAX_TRAIL_PARTICLES; i++) {
    if (i < trailParticles.length) {
      const particle = trailParticles[i];
      const age = currentTime - particle.timestamp;
      const alpha = Math.max(0, 1 - age / TRAIL_FADE_TIME);
      result.push({
        pos: particle.pos,
        alpha
      });
    } else {
      result.push({
        pos: [0, -100, 0],
        alpha: 0
      });
    }
  }
  
  return result;
}

onmessage = (e: MessageEvent<WorkerMessage>) => {
  const message = e.data;
  
  switch (message.type) {
    case 'init':
      waypoints = message.waypoints;
      break;
      
    case 'start':
      isFlying = true;
      pathProgress = 0;
      currentAngles = message.angles;
      currentPosition = getPositionOnPath(0);
      trailParticles.length = 0;
      accumulatedTime = 0;
      lastTrailEmit = 0;
      break;
      
    case 'updateAngles':
      currentAngles = message.angles;
      break;
      
    case 'reset':
      isFlying = false;
      pathProgress = 0;
      currentPosition = [0, 3, 0];
      currentRotation = [0, 0, 0];
      trailParticles.length = 0;
      accumulatedTime = 0;
      lastTrailEmit = 0;
      currentAngles = {
        frontLeft: 15,
        frontRight: 15,
        rearLeft: 15,
        rearRight: 15
      };
      
      const resetResponse: WorkerResponse = {
        type: 'transform',
        position: [0, 3, 0],
        rotation: [0, 0, 0]
      };
      postMessage(resetResponse);
      
      const resetSpeeds: WorkerResponse = {
        type: 'rotorSpeeds',
        speeds: [0, 0, 0, 0]
      };
      postMessage(resetSpeeds);
      
      const resetTrail = updateTrailParticles(0);
      postMessage({ type: 'trailParticles', particles: resetTrail } as WorkerResponse);
      break;
      
    case 'frame':
      const delta = message.delta;
      accumulatedTime += delta;
      
      if (isFlying) {
        const baseSpeed = 0.08;
        const avgAngle = (currentAngles.frontLeft + currentAngles.frontRight + currentAngles.rearLeft + currentAngles.rearRight) / 4;
        const speedMultiplier = 0.5 + (avgAngle / 60) * 1.5;
        
        pathProgress += delta * baseSpeed * speedMultiplier;
        if (pathProgress >= 1) pathProgress = 0;
        
        currentPosition = getPositionOnPath(pathProgress);
        
        const tangent = getPathTangent(pathProgress);
        const attitude = calculateAttitude(currentAngles);
        
        const pathYaw = Math.atan2(tangent[0], tangent[2]);
        const pathPitch = Math.asin(Math.max(-1, Math.min(1, tangent[1])));
        
        currentRotation = [
          degToRad(attitude.pitch) + pathPitch,
          pathYaw + degToRad(attitude.yaw),
          degToRad(attitude.roll)
        ];
        
        const transformResponse: WorkerResponse = {
          type: 'transform',
          position: [...currentPosition],
          rotation: [...currentRotation]
        };
        postMessage(transformResponse);
        
        const speeds = calculateRotorSpeeds(currentAngles);
        const speedsResponse: WorkerResponse = {
          type: 'rotorSpeeds',
          speeds
        };
        postMessage(speedsResponse);
        
        const attitudeResponse: WorkerResponse = {
          type: 'attitude',
          pitch: attitude.pitch,
          yaw: radToDeg(pathYaw) + attitude.yaw
        };
        postMessage(attitudeResponse);
        
        if (accumulatedTime - lastTrailEmit > 20) {
          addTrailParticle(currentPosition, accumulatedTime);
          lastTrailEmit = accumulatedTime;
        }
        
        const trailData = updateTrailParticles(accumulatedTime);
        postMessage({ type: 'trailParticles', particles: trailData } as WorkerResponse);
        
      } else {
        const idleSpeeds = calculateRotorSpeeds(currentAngles).map(s => s * 0.1) as [number, number, number, number];
        const idleSpeedsResponse: WorkerResponse = {
          type: 'rotorSpeeds',
          speeds: idleSpeeds
        };
        postMessage(idleSpeedsResponse);
      }
      break;
  }
};

export {};
