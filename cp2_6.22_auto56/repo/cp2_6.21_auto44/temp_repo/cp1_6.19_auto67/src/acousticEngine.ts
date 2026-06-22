import {
  Vector3,
  SoundSource,
  Listener,
  Obstacle,
  SoundWave,
  ReflectionLine,
  DiffractionArc,
  RT60DataPoint,
  RayHit,
  MaterialType,
  MATERIAL_PROPS,
  FREQUENCIES,
  WALL_ABSORPTION,
} from './types/acoustic';
import {
  vec3,
  vec3Add,
  vec3Sub,
  vec3Scale,
  vec3Normalize,
  vec3Length,
  vec3Distance,
  vec3Dot,
  vec3Reflect,
  rayIntersectsObstacle,
  rayIntersectsRoom,
  getObstacleEdges,
  pointToLineDistance,
  generateId,
  lerp,
  secondOrderExponentialFit,
} from './utils/mathUtils';

const SOUND_SPEED = 343;
const WAVE_SPAWN_INTERVAL = 0.4;
const WAVE_MAX_RADIUS = 15;
const REFLECTION_DURATION = 0.5;
const DIFFRACTION_DURATION = 0.3;
const REFLECTION_MAX_BOUNCES = 3;
const DIFFRACTION_EDGE_THRESHOLD = 0.15;

export class AcousticEngine {
  private roomSize: Vector3;
  private time: number = 0;
  private lastWaveSpawn: Map<string, number> = new Map();
  private rt60UpdateTimer: number = 0;
  private rt60UpdateInterval: number = 1 / 15;

  constructor(roomSize: Vector3) {
    this.roomSize = roomSize;
  }

  setRoomSize(size: Vector3) {
    this.roomSize = size;
  }

  update(
    deltaTime: number,
    sources: SoundSource[],
    listeners: Listener[],
    obstacles: Obstacle[],
    currentWaves: SoundWave[],
    currentReflections: ReflectionLine[],
    currentDiffractions: DiffractionArc[]
  ): {
    waves: SoundWave[];
    reflections: ReflectionLine[];
    diffractions: DiffractionArc[];
    updatedListeners: Listener[];
    rt60Data: RT60DataPoint[];
  } {
    this.time += deltaTime;

    const newWaves = this.spawnWaves(sources, currentWaves);
    const activeWaves = this.updateWaves(newWaves);

    const { newReflections, newDiffractions } = this.traceAcousticPaths(
      sources,
      obstacles,
      activeWaves,
      currentReflections,
      currentDiffractions
    );

    const activeReflections = this.updateReflections(newReflections);
    const activeDiffractions = this.updateDiffractions(newDiffractions);

    const updatedListeners = this.updateListenerDbValues(
      sources,
      listeners,
      obstacles,
      activeReflections
    );

    this.rt60UpdateTimer += deltaTime;
    let rt60Data: RT60DataPoint[] = [];
    if (this.rt60UpdateTimer >= this.rt60UpdateInterval) {
      this.rt60UpdateTimer = 0;
      rt60Data = this.calculateRT60(obstacles);
    }

    return {
      waves: activeWaves,
      reflections: activeReflections,
      diffractions: activeDiffractions,
      updatedListeners,
      rt60Data,
    };
  }

  private spawnWaves(
    sources: SoundSource[],
    existingWaves: SoundWave[]
  ): SoundWave[] {
    const waves = [...existingWaves];

    for (const source of sources) {
      const lastSpawn = this.lastWaveSpawn.get(source.id) || 0;
      if (this.time - lastSpawn >= WAVE_SPAWN_INTERVAL) {
        waves.push({
          id: generateId(),
          sourceId: source.id,
          startTime: this.time,
          maxRadius: WAVE_MAX_RADIUS,
        });
        this.lastWaveSpawn.set(source.id, this.time);
      }
    }

    return waves;
  }

  private updateWaves(waves: SoundWave[]): SoundWave[] {
    return waves.filter((wave) => {
      const elapsed = this.time - wave.startTime;
      const currentRadius = elapsed * SOUND_SPEED;
      return currentRadius < wave.maxRadius;
    });
  }

  private updateReflections(
    reflections: ReflectionLine[]
  ): ReflectionLine[] {
    return reflections.filter(
      (r) => this.time - r.startTime < r.duration
    );
  }

  private updateDiffractions(
    diffractions: DiffractionArc[]
  ): DiffractionArc[] {
    return diffractions.filter(
      (d) => this.time - d.startTime < d.duration
    );
  }

  private traceAcousticPaths(
    sources: SoundSource[],
    obstacles: Obstacle[],
    waves: SoundWave[],
    existingReflections: ReflectionLine[],
    existingDiffractions: DiffractionArc[]
  ): {
    newReflections: ReflectionLine[];
    newDiffractions: DiffractionArc[];
  } {
    const newReflections = [...existingReflections];
    const newDiffractions = [...existingDiffractions];

    const recentlySpawned = waves.filter(
      (w) => this.time - w.startTime < 0.02
    );

    for (const wave of recentlySpawned) {
      const source = sources.find((s) => s.id === wave.sourceId);
      if (!source) continue;

      const directions = this.generateRayDirections(16);

      for (const dir of directions) {
        this.traceRay(
          source.position,
          dir,
          obstacles,
          0,
          newReflections,
          newDiffractions,
          source.power
        );
      }
    }

    return { newReflections, newDiffractions };
  }

  private generateRayDirections(count: number): Vector3[] {
    const directions: Vector3[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;

      directions.push(vec3Normalize(vec3(x, y, z)));
    }

    return directions;
  }

  private traceRay(
    origin: Vector3,
    direction: Vector3,
    obstacles: Obstacle[],
    bounceCount: number,
    reflections: ReflectionLine[],
    diffractions: DiffractionArc[],
    power: number
  ): void {
    if (bounceCount > REFLECTION_MAX_BOUNCES) return;

    const roomHit = rayIntersectsRoom(origin, direction, this.roomSize);
    let closestHit: RayHit | null = null;

    if (roomHit) {
      closestHit = {
        point: vec3Add(origin, vec3Scale(direction, roomHit.distance)),
        normal: roomHit.normal,
        distance: roomHit.distance,
        obstacle: null,
        isWall: true,
        wallNormal: roomHit.normal,
      };
    }

    for (const obstacle of obstacles) {
      const hit = rayIntersectsObstacle(origin, direction, obstacle);
      if (hit && (!closestHit || hit.distance < closestHit.distance)) {
        closestHit = {
          point: vec3Add(origin, vec3Scale(direction, hit.distance)),
          normal: hit.normal,
          distance: hit.distance,
          obstacle,
          isWall: false,
        };
      }
    }

    if (!closestHit) return;

    reflections.push({
      id: generateId(),
      start: { ...origin },
      end: { ...closestHit.point },
      normal: { ...closestHit.normal },
      startTime: this.time,
      duration: REFLECTION_DURATION,
    });

    this.checkDiffraction(
      origin,
      closestHit.point,
      obstacles,
      diffractions
    );

    let absorption = 0;
    let reflectionCoeff = 0.9;

    if (closestHit.obstacle) {
      const matProps = MATERIAL_PROPS[closestHit.obstacle.material];
      absorption = matProps.absorption;
      reflectionCoeff = matProps.reflection;
    } else if (closestHit.wallNormal) {
      absorption = WALL_ABSORPTION[1000];
      reflectionCoeff = 0.9;
    }

    const newPower = power * (1 - absorption) * reflectionCoeff;
    if (newPower < 30) return;

    const reflectDir = vec3Reflect(direction, closestHit.normal);
    const newOrigin = vec3Add(
      closestHit.point,
      vec3Scale(reflectDir, 0.01)
    );

    this.traceRay(
      newOrigin,
      reflectDir,
      obstacles,
      bounceCount + 1,
      reflections,
      diffractions,
      newPower
    );
  }

  private checkDiffraction(
    rayStart: Vector3,
    rayEnd: Vector3,
    obstacles: Obstacle[],
    diffractions: DiffractionArc[]
  ): void {
    for (const obstacle of obstacles) {
      const edges = getObstacleEdges(obstacle);

      for (const edge of edges) {
        const { distance, closestPoint, t } = pointToLineDistance(
          rayEnd,
          edge.start,
          edge.end
        );

        if (distance < DIFFRACTION_EDGE_THRESHOLD && t > 0.05 && t < 0.95) {
          const edgeDir = vec3Normalize(vec3Sub(edge.end, edge.start));
          const rayDir = vec3Normalize(vec3Sub(rayEnd, rayStart));

          const perpDir = vec3Normalize(
            vec3Sub(
              rayDir,
              vec3Scale(edgeDir, vec3Dot(rayDir, edgeDir))
            )
          );

          if (vec3Length(perpDir) > 0.1) {
            diffractions.push({
              id: generateId(),
              center: { ...closestPoint },
              radius: 0.3,
              startAngle: -Math.PI / 2,
              endAngle: Math.PI / 2,
              normal: { ...perpDir },
              startTime: this.time,
              duration: DIFFRACTION_DURATION,
            });
          }
        }
      }
    }
  }

  updateListenerDbValues(
    sources: SoundSource[],
    listeners: Listener[],
    obstacles: Obstacle[],
    reflections: ReflectionLine[]
  ): Listener[] {
    return listeners.map((listener) => {
      let totalDb = 0;
      let hasContribution = false;

      for (const source of sources) {
        const directPathDb = this.calculateDirectPathDb(
          source,
          listener,
          obstacles
        );

        if (directPathDb !== null) {
          totalDb = this.addDb(totalDb, directPathDb);
          hasContribution = true;
        }

        const reflectedDb = this.calculateReflectedPathDb(
          source,
          listener,
          obstacles,
          reflections
        );

        if (reflectedDb > 0) {
          totalDb = this.addDb(totalDb, reflectedDb);
          hasContribution = true;
        }
      }

      if (!hasContribution) {
        totalDb = 20;
      }

      const targetDb = Math.max(20, Math.min(120, totalDb));
      const displayDb = lerp(listener.displayDbValue, targetDb, 0.3);

      return {
        ...listener,
        dbValue: targetDb,
        displayDbValue: displayDb,
      };
    });
  }

  private calculateDirectPathDb(
    source: SoundSource,
    listener: Listener,
    obstacles: Obstacle[]
  ): number | null {
    const direction = vec3Normalize(
      vec3Sub(listener.position, source.position)
    );
    const distance = vec3Distance(source.position, listener.position);

    if (distance < 0.1) return source.power;

    for (const obstacle of obstacles) {
      const hit = rayIntersectsObstacle(
        source.position,
        direction,
        obstacle
      );
      if (hit && hit.distance < distance) {
        return source.power - 20 * Math.log10(distance) - 15;
      }
    }

    const roomHit = rayIntersectsRoom(
      source.position,
      direction,
      this.roomSize
    );
    if (roomHit && roomHit.distance < distance) {
      return null;
    }

    return source.power - 20 * Math.log10(distance);
  }

  private calculateReflectedPathDb(
    source: SoundSource,
    listener: Listener,
    obstacles: Obstacle[],
    reflections: ReflectionLine[]
  ): number {
    let totalReflectedDb = 0;

    for (const reflection of reflections) {
      const age = this.time - reflection.startTime;
      if (age > 0.1) continue;

      const dist1 = vec3Distance(source.position, reflection.start);
      const dist2 = vec3Distance(reflection.end, listener.position);
      const totalDist = dist1 + dist2;

      if (totalDist > 20) continue;

      const midPoint = vec3(
        (reflection.start.x + reflection.end.x) / 2,
        (reflection.start.y + reflection.end.y) / 2,
        (reflection.start.z + reflection.end.z) / 2
      );

      const toListener = vec3Normalize(
        vec3Sub(listener.position, reflection.end)
      );
      const alignFactor = Math.max(
        0,
        vec3Dot(reflection.normal, toListener)
      );

      let reflectedDb = source.power - 20 * Math.log10(totalDist + 1);
      reflectedDb -= 10;
      reflectedDb *= alignFactor;

      if (reflectedDb > 0) {
        totalReflectedDb = this.addDb(totalReflectedDb, reflectedDb);
      }
    }

    return totalReflectedDb;
  }

  private addDb(a: number, b: number): number {
    if (a === 0) return b;
    if (b === 0) return a;
    return 10 * Math.log10(Math.pow(10, a / 10) + Math.pow(10, b / 10));
  }

  calculateRT60(obstacles: Obstacle[]): RT60DataPoint[] {
    const volume = this.roomSize.x * this.roomSize.y * this.roomSize.z;

    const wallArea =
      2 * this.roomSize.x * this.roomSize.y +
      2 * this.roomSize.x * this.roomSize.z +
      2 * this.roomSize.y * this.roomSize.z;

    const rt60Data: RT60DataPoint[] = [];

    for (const freq of FREQUENCIES) {
      let totalAbsorption = wallArea * WALL_ABSORPTION[freq];

      for (const obstacle of obstacles) {
        const mat = MATERIAL_PROPS[obstacle.material];
        const freqFactor = this.getFrequencyAbsorptionFactor(freq, obstacle.material);
        const obstacleArea =
          2 * obstacle.size.x * obstacle.size.y +
          2 * obstacle.size.x * obstacle.size.z +
          2 * obstacle.size.y * obstacle.size.z;
        totalAbsorption += obstacleArea * mat.absorption * freqFactor;
      }

      let rt60 = 0.161 * volume / Math.max(totalAbsorption, 0.1);
      rt60 = Math.max(0.2, Math.min(5, rt60));

      const noise = (Math.random() - 0.5) * 0.1;
      const rt60Noisy = rt60 + noise;

      const decayCurve = this.generateDecayCurve(rt60Noisy);
      const confidence: [number, number] = [
        Math.max(0, rt60Noisy - 0.3),
        Math.min(5, rt60Noisy + 0.3),
      ];

      rt60Data.push({
        frequency: freq,
        rt60: rt60Noisy,
        confidence,
        decayCurve,
      });
    }

    return rt60Data;
  }

  private getFrequencyAbsorptionFactor(
    freq: number,
    material: MaterialType
  ): number {
    const factors: Record<MaterialType, Record<number, number>> = {
      concrete: { 125: 0.7, 250: 0.8, 500: 1, 1000: 1.1, 2000: 1.2, 4000: 1.2 },
      glass: { 125: 0.5, 250: 0.7, 500: 1, 1000: 1.1, 2000: 1, 4000: 0.9 },
      carpet: { 125: 0.3, 250: 0.5, 500: 0.8, 1000: 1, 2000: 1.2, 4000: 1.3 },
    };
    return factors[material][freq] || 1;
  }

  private generateDecayCurve(rt60: number): number[] {
    const curve: number[] = [];
    const points = 100;
    const maxTime = rt60 * 1.2;

    const a = 70;
    const b = 6 / rt60;
    const c = 30;
    const d = 2 / rt60;

    for (let i = 0; i < points; i++) {
      const t = (i / points) * maxTime;
      const db = secondOrderExponentialFit(t, a, b, c, d);
      curve.push(Math.max(-60, db));
    }

    return curve;
  }

  getWaveRadius(wave: SoundWave): number {
    const elapsed = this.time - wave.startTime;
    return Math.min(elapsed * SOUND_SPEED, wave.maxRadius);
  }

  getWaveOpacity(wave: SoundWave): number {
    const radius = this.getWaveRadius(wave);
    const progress = radius / wave.maxRadius;
    return Math.max(0, 1 - progress * 0.9);
  }

  getWaveSpacing(radius: number): number {
    return 0.15 + radius * 0.03;
  }

  getReflectionOpacity(reflection: ReflectionLine): number {
    const age = this.time - reflection.startTime;
    return Math.max(0, 1 - age / reflection.duration);
  }

  getDiffractionOpacity(diffraction: DiffractionArc): number {
    const age = this.time - diffraction.startTime;
    return Math.max(0, 1 - age / diffraction.duration);
  }

  getBreathScale(time: number): number {
    return 1 + 0.15 * Math.sin((time * Math.PI * 2) / 0.6);
  }
}
