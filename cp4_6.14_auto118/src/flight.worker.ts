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
  lifeProgress: number;
}

interface Matrix4 {
  elements: number[];
}

type WorkerMessage =
  | { type: 'init'; waypoints: Array<[number, number, number]> }
  | { type: 'start'; angles: RotorAngles }
  | { type: 'updateAngles'; angles: RotorAngles }
  | { type: 'reset' }
  | { type: 'frame'; delta: number };

type WorkerResponse =
  | { type: 'transform'; position: [number, number, number]; rotation: [number, number, number]; matrix: number[] }
  | { type: 'rotorSpeeds'; speeds: [number, number, number, number]; rotations: [number, number, number, number] }
  | { type: 'trailParticles'; particles: Array<{ pos: [number, number, number]; alpha: number; lifeProgress: number }> }
  | { type: 'attitude'; pitch: number; yaw: number }
  | { type: 'debug'; message: string; data: unknown };

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
let currentRotorRotations: [number, number, number, number] = [0, 0, 0, 0];

const trailParticles: TrailParticle[] = [];
const MAX_TRAIL_PARTICLES = 250;
const TRAIL_FADE_TIME = 5000;

let accumulatedTime = 0;
let lastTrailEmit = 0;
let catmullRomCurve: { getPoint: (t: number) => [number, number, number]; getTangent: (t: number) => [number, number, number] } | null = null;

const degToRad = (deg: number): number => deg * Math.PI / 180;
const radToDeg = (rad: number): number => rad * 180 / Math.PI;

function createCatmullRomCurve(points: Array<[number, number, number]>, tension: number = 0.5) {
  console.log(`[FlightWorker] Creating CatmullRomCurve3 with ${points.length} waypoints`);
  
  const getPoint = (t: number): [number, number, number] => {
    const n = points.length;
    const totalSegments = n - 1;
    const scaledT = t * totalSegments;
    const segmentIndex = Math.min(Math.floor(scaledT), totalSegments - 1);
    const localT = scaledT - segmentIndex;
    
    const p0 = points[Math.max(0, segmentIndex - 1)];
    const p1 = points[segmentIndex];
    const p2 = points[Math.min(n - 1, segmentIndex + 1)];
    const p3 = points[Math.min(n - 1, segmentIndex + 2)];
    
    const t2 = localT * localT;
    const t3 = t2 * localT;
    
    const result: [number, number, number] = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      result[i] = 
        tension * 2 * p1[i] +
        tension * (-p0[i] + p2[i]) * localT +
        tension * (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * t2 +
        tension * (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * t3;
      result[i] *= 0.5;
    }
    
    return result;
  };
  
  const getTangent = (t: number): [number, number, number] => {
    const eps = 0.0001;
    const t1 = Math.max(0, t - eps);
    const t2 = Math.min(1, t + eps);
    const p1 = getPoint(t1);
    const p2 = getPoint(t2);
    
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const dz = p2[2] - p1[2];
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (len < 0.0001) return [0, 0, -1];
    return [dx / len, dy / len, dz / len];
  };
  
  return { getPoint, getTangent };
}

function getPositionOnPath(progress: number): [number, number, number] {
  if (!catmullRomCurve || waypoints.length < 2) return [0, 3, 0];
  return catmullRomCurve.getPoint(progress);
}

function getPathTangent(progress: number): [number, number, number] {
  if (!catmullRomCurve) return [0, 0, -1];
  return catmullRomCurve.getTangent(progress);
}

function createRotationMatrix(x: number, y: number, z: number): number[] {
  const cx = Math.cos(x), sx = Math.sin(x);
  const cy = Math.cos(y), sy = Math.sin(y);
  const cz = Math.cos(z), sz = Math.sin(z);
  
  return [
    cy * cz, cx * sz + sx * sy * cz, sx * sz - cx * sy * cz, 0,
    -cy * sz, cx * cz - sx * sy * sz, sx * cz + cx * sy * sz, 0,
    sy, -sx * cy, cx * cy, 0,
    0, 0, 0, 1
  ];
}

function composeTransformMatrix(
  position: [number, number, number],
  rotation: [number, number, number],
  scale: [number, number, number] = [1, 1, 1]
): number[] {
  const rotMatrix = createRotationMatrix(rotation[0], rotation[1], rotation[2]);
  
  rotMatrix[12] = position[0];
  rotMatrix[13] = position[1];
  rotMatrix[14] = position[2];
  
  rotMatrix[0] *= scale[0];
  rotMatrix[1] *= scale[0];
  rotMatrix[2] *= scale[0];
  
  rotMatrix[4] *= scale[1];
  rotMatrix[5] *= scale[1];
  rotMatrix[6] *= scale[1];
  
  rotMatrix[8] *= scale[2];
  rotMatrix[9] *= scale[2];
  rotMatrix[10] *= scale[2];
  
  return rotMatrix;
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
    timestamp,
    lifeProgress: 0
  });
  
  if (trailParticles.length > MAX_TRAIL_PARTICLES) {
    trailParticles.pop();
  }
  
  if (trailParticles.length === 1) {
    console.debug(`[FlightWorker] Trail particle added at position: (${position[0].toFixed(2)}, ${position[1].toFixed(2)}, ${position[2].toFixed(2)})`);
  }
}

function updateTrailParticles(currentTime: number): Array<{ pos: [number, number, number]; alpha: number; lifeProgress: number }> {
  const result: Array<{ pos: [number, number, number]; alpha: number; lifeProgress: number }> = [];
  
  for (let i = 0; i < MAX_TRAIL_PARTICLES; i++) {
    if (i < trailParticles.length) {
      const particle = trailParticles[i];
      const age = currentTime - particle.timestamp;
      const alpha = Math.max(0, 1 - age / TRAIL_FADE_TIME);
      const lifeProgress = Math.min(1, age / TRAIL_FADE_TIME);
      
      particle.lifeProgress = lifeProgress;
      
      result.push({
        pos: particle.pos,
        alpha,
        lifeProgress
      });
    } else {
      result.push({
        pos: [0, -100, 0],
        alpha: 0,
        lifeProgress: 0
      });
    }
  }
  
  if (trailParticles.length > 0 && Math.floor(currentTime * 1000) % 100 < 20) {
    console.debug(`[FlightWorker] Trail particles: ${trailParticles.length} active, first particle lifeProgress: ${trailParticles[0].lifeProgress.toFixed(2)}`);
  }
  
  return result;
}

onmessage = (e: MessageEvent<WorkerMessage>) => {
  const message = e.data;
  
  switch (message.type) {
    case 'init':
      waypoints = message.waypoints;
      catmullRomCurve = createCatmullRomCurve(waypoints, 0.5);
      
      const testPoint = catmullRomCurve.getPoint(0);
      const initMsg = `CatmullRomCurve3 initialized, test point at t=0: (${testPoint[0].toFixed(2)}, ${testPoint[1].toFixed(2)}, ${testPoint[2].toFixed(2)})`;
      console.log(`[FlightWorker] ${initMsg}`);
      
      postMessage({
        type: 'debug',
        message: initMsg,
        data: { waypointCount: waypoints.length }
      } as WorkerResponse);
      break;
      
    case 'start':
      isFlying = true;
      pathProgress = 0;
      currentAngles = message.angles;
      currentPosition = getPositionOnPath(0);
      currentRotorRotations = [0, 0, 0, 0];
      trailParticles.length = 0;
      accumulatedTime = 0;
      lastTrailEmit = 0;
      
      console.debug(`[FlightWorker] Flight started, initial angles:`, message.angles);
      break;
      
    case 'updateAngles':
      currentAngles = message.angles;
      break;
      
    case 'reset':
      isFlying = false;
      pathProgress = 0;
      currentPosition = [0, 3, 0];
      currentRotation = [0, 0, 0];
      currentRotorRotations = [0, 0, 0, 0];
      trailParticles.length = 0;
      accumulatedTime = 0;
      lastTrailEmit = 0;
      currentAngles = {
        frontLeft: 15,
        frontRight: 15,
        rearLeft: 15,
        rearRight: 15
      };
      
      const resetMatrix = composeTransformMatrix([0, 3, 0], [0, 0, 0]);
      const resetResponse: WorkerResponse = {
        type: 'transform',
        position: [0, 3, 0],
        rotation: [0, 0, 0],
        matrix: resetMatrix
      };
      postMessage(resetResponse);
      
      const resetSpeeds: WorkerResponse = {
        type: 'rotorSpeeds',
        speeds: [0, 0, 0, 0],
        rotations: [0, 0, 0, 0]
      };
      postMessage(resetSpeeds);
      
      const resetTrail = updateTrailParticles(0);
      postMessage({ type: 'trailParticles', particles: resetTrail } as WorkerResponse);
      
      console.debug(`[FlightWorker] Flight reset`);
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
        
        const transformMatrix = composeTransformMatrix(currentPosition, currentRotation);
        
        const transformResponse: WorkerResponse = {
          type: 'transform',
          position: [...currentPosition],
          rotation: [...currentRotation],
          matrix: transformMatrix
        };
        postMessage(transformResponse);
        
        const speeds = calculateRotorSpeeds(currentAngles);
        for (let i = 0; i < 4; i++) {
          currentRotorRotations[i] += speeds[i] * delta;
          
          while (currentRotorRotations[i] > Math.PI * 2) {
            currentRotorRotations[i] -= Math.PI * 2;
          }
        }
        
        const speedsResponse: WorkerResponse = {
          type: 'rotorSpeeds',
          speeds,
          rotations: [...currentRotorRotations] as [number, number, number, number]
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
        
        if (Math.floor(accumulatedTime * 1000) % 2000 < 20) {
          const frameMsg = `Frame update: progress=${pathProgress.toFixed(3)}, position=(${currentPosition[0].toFixed(2)}, ${currentPosition[1].toFixed(2)}, ${currentPosition[2].toFixed(2)})`;
          const rotorMsg = `Rotor rotations: FL=${radToDeg(currentRotorRotations[0]).toFixed(1)}°, FR=${radToDeg(currentRotorRotations[1]).toFixed(1)}°, RL=${radToDeg(currentRotorRotations[2]).toFixed(1)}°, RR=${radToDeg(currentRotorRotations[3]).toFixed(1)}°`;
          const matrixMsg = `Transform matrix first 4 elements: [${transformMatrix.slice(0, 4).join(', ')}]`;
          
          console.log(`[FlightWorker] ${frameMsg}`);
          console.log(`[FlightWorker] ${rotorMsg}`);
          console.log(`[FlightWorker] ${matrixMsg}`);
          
          postMessage({
            type: 'debug',
            message: rotorMsg,
            data: {
              rotorRotations: currentRotorRotations.map(r => radToDeg(r)),
              matrixFirst4: transformMatrix.slice(0, 4)
            }
          } as WorkerResponse);
        }
        
        if (trailParticles.length > 0 && Math.floor(accumulatedTime * 1000) % 3000 < 20) {
          const firstParticle = trailParticles[0];
          const progress = firstParticle.lifeProgress;
          const colorStart = { r: 0.376, g: 0.647, b: 0.980 };
          const colorEnd = { r: 0.545, g: 0.361, b: 0.965 };
          const r = Math.round((colorStart.r + (colorEnd.r - colorStart.r) * progress) * 255);
          const g = Math.round((colorStart.g + (colorEnd.g - colorStart.g) * progress) * 255);
          const b = Math.round((colorStart.b + (colorEnd.b - colorStart.b) * progress) * 255);
          const colorHex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
          
          const colorMsg = `Trail particle[0] lifeProgress=${progress.toFixed(2)}, interpolated color=${colorHex} (from #60a5fa to #8b5cf6)`;
          console.log(`[FlightWorker] ${colorMsg}`);
          
          postMessage({
            type: 'debug',
            message: colorMsg,
            data: {
              lifeProgress: progress,
              colorStart: '#60a5fa',
              colorEnd: '#8b5cf6',
              interpolatedColor: colorHex
            }
          } as WorkerResponse);
        }
        
      } else {
        const idleSpeeds = calculateRotorSpeeds(currentAngles).map(s => s * 0.1) as [number, number, number, number];
        for (let i = 0; i < 4; i++) {
          currentRotorRotations[i] += idleSpeeds[i] * delta;
          while (currentRotorRotations[i] > Math.PI * 2) {
            currentRotorRotations[i] -= Math.PI * 2;
          }
        }
        
        const idleSpeedsResponse: WorkerResponse = {
          type: 'rotorSpeeds',
          speeds: idleSpeeds,
          rotations: [...currentRotorRotations] as [number, number, number, number]
        };
        postMessage(idleSpeedsResponse);
      }
      break;
  }
};
