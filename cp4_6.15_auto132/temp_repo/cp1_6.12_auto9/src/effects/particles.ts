import * as THREE from 'three';

export class ParticleSystem {
  points: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private paths: THREE.CatmullRomCurve3[] = [];
  private particleCountPerPath = 18;
  private ts: Float32Array = new Float32Array();
  private pathIndex: Int32Array = new Int32Array();
  private baseSpeed = 0.08;

  constructor() {
    this.geometry = new THREE.BufferGeometry();
    this.material = new THREE.PointsMaterial({
      color: 0x00e5ff,
      size: 0.22,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
  }

  init(buildingCenter: THREE.Vector3, buildingSize: THREE.Vector3, floors: number): void {
    this.paths = this.createPaths(buildingCenter, buildingSize, floors);
    const total = this.paths.length * this.particleCountPerPath;
    const positions = new Float32Array(total * 3);
    const colors = new Float32Array(total * 3);
    this.ts = new Float32Array(total);
    this.pathIndex = new Int32Array(total);

    const palette = [
      new THREE.Color('#00e5ff'),
      new THREE.Color('#7dd3fc'),
      new THREE.Color('#38bdf8')
    ];

    let idx = 0;
    for (let p = 0; p < this.paths.length; p++) {
      for (let i = 0; i < this.particleCountPerPath; i++) {
        this.ts[idx] = i / this.particleCountPerPath + (Math.random() * 0.02);
        this.pathIndex[idx] = p;
        const col = palette[p % palette.length];
        colors[idx * 3] = col.r;
        colors[idx * 3 + 1] = col.g;
        colors[idx * 3 + 2] = col.b;
        idx++;
      }
    }
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.material.vertexColors = true;
    this.updatePositions();
  }

  private createPaths(center: THREE.Vector3, size: THREE.Vector3, floors: number): THREE.CatmullRomCurve3[] {
    const paths: THREE.CatmullRomCurve3[] = [];
    const halfW = size.x / 2 + 4;
    const halfD = size.z / 2 + 4;
    const h = size.y;

    const supplyNodes = [
      new THREE.Vector3(center.x - halfW - 3, -0.5, center.z),
      new THREE.Vector3(center.x + halfW + 3, -0.5, center.z),
      new THREE.Vector3(center.x, -0.5, center.z - halfD - 3)
    ];

    const entryPoints: THREE.Vector3[] = [];
    for (let f = 0; f < floors; f++) {
      const y = f * 3.2 + 1.4;
      entryPoints.push(new THREE.Vector3(center.x - halfW + 0.5, y, center.z));
      entryPoints.push(new THREE.Vector3(center.x + halfW - 0.5, y, center.z));
    }

    supplyNodes.forEach((start, si) => {
      entryPoints.forEach((end, ei) => {
        if ((si === 0 && ei % 2 === 1) || (si === 1 && ei % 2 === 0) || si === 2) {
          const mid = new THREE.Vector3(
            (start.x + end.x) / 2 + (Math.random() - 0.5) * 2,
            Math.max(start.y, end.y) + h * 0.15 + Math.random() * 1.2,
            (start.z + end.z) / 2 + (Math.random() - 0.5) * 2
          );
          const mid2 = new THREE.Vector3(
            end.x + (Math.random() - 0.5) * 1.5,
            (mid.y + end.y) / 2,
            end.z + (Math.random() - 0.5) * 1.5
          );
          paths.push(new THREE.CatmullRomCurve3([start, mid, mid2, end], false, 'catmullrom', 0.5));
        }
      });
    });
    return paths.slice(0, 6);
  }

  private updatePositions(): void {
    const positions = this.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < this.ts.length; i++) {
      const path = this.paths[this.pathIndex[i]];
      if (!path) continue;
      const t = ((this.ts[i] % 1) + 1) % 1;
      const pt = path.getPointAt(t);
      positions[i * 3] = pt.x;
      positions[i * 3 + 1] = pt.y;
      positions[i * 3 + 2] = pt.z;
    }
    this.geometry.attributes.position.needsUpdate = true;
  }

  update(delta: number, energyMultiplier: number): void {
    const speed = this.baseSpeed * Math.max(0.2, energyMultiplier);
    for (let i = 0; i < this.ts.length; i++) {
      const offset = (i % 7) * 0.013;
      this.ts[i] = (this.ts[i] + delta * speed * (0.6 + offset)) % 1;
    }
    const s = 0.9 + Math.min(energyMultiplier, 2) * 0.25;
    this.material.size = 0.22 * s;
    this.material.opacity = 0.75 + Math.min(energyMultiplier * 0.15, 0.25);
    this.updatePositions();
  }
}
