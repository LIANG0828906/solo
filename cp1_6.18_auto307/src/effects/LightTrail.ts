import * as THREE from 'three';

interface TrailSegment {
  points: THREE.Vector3[];
  createdAt: number;
  duration: number;
  mesh: THREE.Mesh | null;
  geometry: THREE.TubeGeometry | null;
  material: THREE.MeshBasicMaterial | null;
  active: boolean;
}

export class LightTrail {
  private trails: TrailSegment[] = [];
  private maxTrails: number = 10;
  private trailDuration: number = 5;
  private minPointDistance: number = 0.05;
  private maxPointsPerTrail: number = 50;
  private tubeRadius: number = 0.02;
  private tubeSegments: number = 8;
  private radialSegments: number = 8;

  private currentTrail: TrailSegment | null = null;
  private lastPointTime: number = 0;
  private debounceInterval: number = 50;
  private lastAddedPoint: THREE.Vector3 | null = null;

  private colorStart: THREE.Color = new THREE.Color('#00E5FF');
  private colorEnd: THREE.Color = new THREE.Color('#2979FF');

  private meshPool: { mesh: THREE.Mesh; geometry: THREE.TubeGeometry | null; material: THREE.MeshBasicMaterial | null }[] = [];
  private poolSize: number = 20;

  constructor() {
    this.initPool();
  }

  private initPool(): void {
    for (let i = 0; i < this.poolSize; i++) {
      const material = new THREE.MeshBasicMaterial({
        color: this.colorStart,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
      mesh.visible = false;

      this.meshPool.push({
        mesh,
        geometry: null,
        material,
      });
    }
  }

  private acquireFromPool(): { mesh: THREE.Mesh; geometry: THREE.TubeGeometry | null; material: THREE.MeshBasicMaterial | null } | null {
    const available = this.meshPool.find((item) => !item.mesh.visible);
    if (available) {
      available.mesh.visible = true;
      return available;
    }
    return null;
  }

  private releaseToPool(trail: TrailSegment): void {
    if (trail.geometry) {
      trail.geometry.dispose();
    }

    const poolItem = this.meshPool.find((item) => item.mesh === trail.mesh);
    if (poolItem && poolItem.material) {
      poolItem.geometry = null;
      poolItem.material.opacity = 0;
      poolItem.mesh.visible = false;
    }

    trail.mesh = null;
    trail.geometry = null;
    trail.material = null;
  }

  public addPoint(position: THREE.Vector3): void {
    const now = performance.now();

    if (now - this.lastPointTime < this.debounceInterval) {
      return;
    }

    if (this.lastAddedPoint && position.distanceTo(this.lastAddedPoint) < this.minPointDistance) {
      return;
    }

    this.lastPointTime = now;
    this.lastAddedPoint = position.clone();

    if (!this.currentTrail || !this.currentTrail.active) {
      this.currentTrail = this.createNewTrail();
      this.trails.push(this.currentTrail);
    }

    this.currentTrail.points.push(position.clone());

    if (this.currentTrail.points.length > this.maxPointsPerTrail) {
      this.currentTrail.points.shift();
    }

    this.updateTrailGeometry(this.currentTrail);
  }

  private createNewTrail(): TrailSegment {
    while (this.trails.filter((t) => t.active).length >= this.maxTrails) {
      const oldest = this.trails.find((t) => t.active);
      if (oldest) {
        this.removeTrail(oldest);
      }
    }

    const poolItem = this.acquireFromPool();

    return {
      points: [],
      createdAt: performance.now(),
      duration: this.trailDuration * 1000,
      mesh: poolItem ? poolItem.mesh : null,
      geometry: poolItem ? poolItem.geometry : null,
      material: poolItem ? poolItem.material : null,
      active: true,
    };
  }

  private updateTrailGeometry(trail: TrailSegment): void {
    if (trail.points.length < 2) {
      return;
    }

    if (trail.geometry) {
      trail.geometry.dispose();
    }

    const curve = new THREE.CatmullRomCurve3(trail.points, false, 'catmullrom', 0.5);
    const segments = Math.max(trail.points.length * 2, this.tubeSegments);

    trail.geometry = new THREE.TubeGeometry(
      curve,
      segments,
      this.tubeRadius,
      this.radialSegments,
      false
    );

    const colorCount = trail.geometry.attributes.position.count;
    const colors = new Float32Array(colorCount * 3);

    for (let i = 0; i < colorCount; i++) {
      const ratio = i / colorCount;
      const color = new THREE.Color().lerpColors(this.colorStart, this.colorEnd, ratio);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    trail.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    if (trail.mesh) {
      trail.mesh.geometry = trail.geometry;
      if (trail.material) {
        trail.material.vertexColors = true;
        trail.material.needsUpdate = true;
      }
    }

    const poolItem = this.meshPool.find((item) => item.mesh === trail.mesh);
    if (poolItem) {
      poolItem.geometry = trail.geometry;
    }
  }

  private removeTrail(trail: TrailSegment): void {
    this.releaseToPool(trail);
    const index = this.trails.indexOf(trail);
    if (index > -1) {
      this.trails.splice(index, 1);
    }
  }

  public update(deltaTime: number): void {
    const now = performance.now();

    if (this.currentTrail && this.currentTrail.active) {
      if (now - this.lastPointTime > 300 && this.currentTrail.points.length > 0) {
        this.currentTrail.active = false;
        this.currentTrail = null;
        this.lastAddedPoint = null;
      }
    }

    for (let i = this.trails.length - 1; i >= 0; i--) {
      const trail = this.trails[i];
      const age = now - trail.createdAt;
      const lifeRatio = Math.max(0, 1 - age / trail.duration);

      if (trail.material) {
        trail.material.opacity = lifeRatio * 0.8;
      }

      if (age >= trail.duration) {
        this.removeTrail(trail);
      }
    }
  }

  public getMeshes(): THREE.Mesh[] {
    return this.trails
      .filter((trail) => trail.mesh && trail.mesh.visible)
      .map((trail) => trail.mesh as THREE.Mesh);
  }

  public dispose(): void {
    for (const trail of this.trails) {
      if (trail.geometry) {
        trail.geometry.dispose();
      }
    }

    for (const poolItem of this.meshPool) {
      if (poolItem.geometry) {
        poolItem.geometry.dispose();
      }
      if (poolItem.material) {
        poolItem.material.dispose();
      }
      poolItem.mesh.geometry.dispose();
    }

    this.trails = [];
    this.meshPool = [];
    this.currentTrail = null;
  }
}
