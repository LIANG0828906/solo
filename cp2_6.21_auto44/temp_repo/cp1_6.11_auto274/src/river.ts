import * as THREE from 'three';

export interface RiverSegment {
  startT: number;
  endT: number;
  flowSpeed: number;
  width: number;
  type: 'rapid' | 'calm' | 'wide';
}

export interface Obstacle {
  position: THREE.Vector3;
  radius: number;
  type: 'rock' | 'vortex' | 'log';
  segmentType: 'rapid' | 'calm' | 'wide';
  active: boolean;
  vortexAngle?: number;
  vortexStrength?: number;
}

export interface Checkpoint {
  t: number;
  position: THREE.Vector3;
  label: string;
  passed: boolean;
  passTime: number;
}

const RIVER_SEGMENTS: RiverSegment[] = [
  { startT: 0, endT: 0.33, flowSpeed: 2.5, width: 6, type: 'rapid' },
  { startT: 0.33, endT: 0.66, flowSpeed: 1.2, width: 10, type: 'calm' },
  { startT: 0.66, endT: 1.0, flowSpeed: 1.8, width: 14, type: 'wide' }
];

export class River {
  public curve: THREE.CatmullRomCurve3;
  public mesh: THREE.Mesh;
  public waterMaterial: THREE.ShaderMaterial;
  public canyonWalls: THREE.Group;
  public obstacles: Obstacle[] = [];
  public checkpoints: Checkpoint[] = [];
  public riverLength: number;
  public obstacleMeshes: THREE.Mesh[] = [];
  private pathPoints: THREE.Vector3[];

  constructor(scene: THREE.Scene) {
    this.pathPoints = this.generatePathPoints();
    this.curve = new THREE.CatmullRomCurve3(this.pathPoints);
    this.riverLength = this.curve.getLength();

    this.waterMaterial = this.createWaterMaterial();
    this.mesh = this.createWaterMesh();
    scene.add(this.mesh);

    this.canyonWalls = this.createCanyonWalls();
    scene.add(this.canyonWalls);

    this.createObstacles();
    this.createObstacleMeshes(scene);

    this.createCheckpoints();
  }

  private generatePathPoints(): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    const numPoints = 30;
    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1);
      const z = -t * 500;
      const x = Math.sin(t * Math.PI * 4) * 30 + Math.cos(t * Math.PI * 2.5) * 15;
      const y = -0.5;
      points.push(new THREE.Vector3(x, y, z));
    }
    return points;
  }

  private createWaterMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uFlowSpeed: { value: 1.0 },
        uColor1: { value: new THREE.Color(0x3A7CA5) },
        uColor2: { value: new THREE.Color(0x1A4A6E) },
        uFogColor: { value: new THREE.Color(0xD4E6F1) },
        uFogDensity: { value: 0.008 }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uFlowSpeed;
        varying vec2 vUv;
        varying float vElevation;
        varying float vFogDepth;

        void main() {
          vUv = uv;
          vec3 pos = position;

          float wave1 = sin(pos.x * 2.0 + uTime * 3.0 * uFlowSpeed) * 0.15;
          float wave2 = sin(pos.z * 1.5 + uTime * 2.0 * uFlowSpeed + 1.0) * 0.1;
          float wave3 = cos(pos.x * 3.0 + pos.z * 2.0 + uTime * 4.0 * uFlowSpeed) * 0.05;
          pos.y += wave1 + wave2 + wave3;

          vElevation = pos.y;
          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          vFogDepth = -mvPos.z;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uTime;
        uniform float uFlowSpeed;
        uniform vec3 uFogColor;
        uniform float uFogDensity;
        varying vec2 vUv;
        varying float vElevation;
        varying float vFogDepth;

        void main() {
          float flowPattern = sin(vUv.x * 20.0 + uTime * uFlowSpeed * 2.0) * 0.5 + 0.5;
          vec3 color = mix(uColor1, uColor2, flowPattern * 0.6 + vUv.y * 0.4);

          float foam = smoothstep(0.12, 0.18, vElevation) * 0.4;
          color += vec3(foam);

          float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * vFogDepth * vFogDepth);
          color = mix(color, uFogColor, clamp(fogFactor, 0.0, 1.0));

          float alpha = 0.85 + vElevation * 0.1;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
  }

  private createWaterMesh(): THREE.Mesh {
    const segments = 300;
    const widthSegments = 40;
    const geometry = new THREE.BufferGeometry();

    const vertices: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = this.curve.getPointAt(t);
      const tangent = this.curve.getTangentAt(t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const seg = this.getSegmentAtT(t);
      const halfW = seg.width / 2;

      for (let j = 0; j <= widthSegments; j++) {
        const s = j / widthSegments;
        const offset = (s - 0.5) * seg.width;
        vertices.push(point.x + normal.x * offset, point.y, point.z + normal.z * offset);
        uvs.push(s, t);
      }
    }

    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < widthSegments; j++) {
        const a = i * (widthSegments + 1) + j;
        const b = a + 1;
        const c = (i + 1) * (widthSegments + 1) + j;
        const d = c + 1;
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry, this.waterMaterial);
    mesh.renderOrder = 0;
    return mesh;
  }

  private createCanyonWalls(): THREE.Group {
    const group = new THREE.Group();
    const wallSegments = 100;
    const wallHeight = 20;

    const leftPositions: number[] = [];
    const rightPositions: number[] = [];
    const leftNormals: number[] = [];
    const rightNormals: number[] = [];
    const leftUvs: number[] = [];
    const rightUvs: number[] = [];
    const leftIndices: number[] = [];
    const rightIndices: number[] = [];

    for (let i = 0; i <= wallSegments; i++) {
      const t = i / wallSegments;
      const point = this.curve.getPointAt(t);
      const tangent = this.curve.getTangentAt(t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const seg = this.getSegmentAtT(t);
      const halfW = seg.width / 2;

      leftPositions.push(
        point.x + normal.x * halfW, -2, point.z + normal.z * halfW,
        point.x + normal.x * halfW, wallHeight, point.z + normal.z * halfW,
        point.x + normal.x * (halfW + 8), wallHeight + 3, point.z + normal.z * (halfW + 8),
        point.x + normal.x * (halfW + 8), -2, point.z + normal.z * (halfW + 8)
      );
      rightPositions.push(
        point.x - normal.x * halfW, -2, point.z - normal.z * halfW,
        point.x - normal.x * halfW, wallHeight, point.z - normal.z * halfW,
        point.x - normal.x * (halfW + 8), wallHeight + 3, point.z - normal.z * (halfW + 8),
        point.x - normal.x * (halfW + 8), -2, point.z - normal.z * (halfW + 8)
      );

      for (let v = 0; v < 4; v++) {
        leftUvs.push(t, v / 3);
        rightUvs.push(t, v / 3);
        leftNormals.push(-normal.x, 0, -normal.z);
        rightNormals.push(normal.x, 0, normal.z);
      }

      if (i < wallSegments) {
        const base = i * 4;
        leftIndices.push(base, base + 4, base + 1, base + 1, base + 4, base + 5);
        leftIndices.push(base + 1, base + 5, base + 2, base + 2, base + 5, base + 6);
        leftIndices.push(base + 2, base + 6, base + 3, base + 3, base + 6, base + 7);
        rightIndices.push(base, base + 4, base + 1, base + 1, base + 4, base + 5);
        rightIndices.push(base + 1, base + 5, base + 2, base + 2, base + 5, base + 6);
        rightIndices.push(base + 2, base + 6, base + 3, base + 3, base + 6, base + 7);
      }
    }

    const wallMaterial = new THREE.MeshLambertMaterial({
      color: 0x6B5B4F,
      side: THREE.DoubleSide
    });

    const createWall = (positions: number[], normals: number[], uvs: number[], indices: number[]) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      return new THREE.Mesh(geo, wallMaterial);
    };

    group.add(createWall(leftPositions, leftNormals, leftUvs, leftIndices));
    group.add(createWall(rightPositions, rightNormals, rightUvs, rightIndices));

    const groundGeo = new THREE.PlaneGeometry(200, 600);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x5A4A3A });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -3, -250);
    group.add(ground);

    return group;
  }

  private createObstacles(): void {
    const rapidTs = [0.08, 0.15, 0.22, 0.28];
    rapidTs.forEach(t => {
      const point = this.curve.getPointAt(t);
      this.obstacles.push({
        position: point.clone().add(new THREE.Vector3((Math.random() - 0.5) * 3, 0.3, (Math.random() - 0.5) * 2)),
        radius: 1.2 + Math.random() * 0.8,
        type: 'rock',
        segmentType: 'rapid',
        active: true
      });
    });

    const vortexTs = [0.38, 0.48, 0.58];
    vortexTs.forEach(t => {
      const point = this.curve.getPointAt(t);
      this.obstacles.push({
        position: point.clone().add(new THREE.Vector3((Math.random() - 0.5) * 4, 0, (Math.random() - 0.5) * 2)),
        radius: 2.5,
        type: 'vortex',
        segmentType: 'calm',
        active: true,
        vortexAngle: 0,
        vortexStrength: 1.5
      });
    });

    const logTs = [0.72, 0.85];
    logTs.forEach(t => {
      const point = this.curve.getPointAt(t);
      this.obstacles.push({
        position: point.clone().add(new THREE.Vector3((Math.random() - 0.5) * 5, 0.1, (Math.random() - 0.5) * 2)),
        radius: 1.5,
        type: 'log',
        segmentType: 'wide',
        active: true
      });
    });
  }

  private createObstacleMeshes(scene: THREE.Scene): void {
    this.obstacles.forEach(obs => {
      let mesh: THREE.Mesh;
      if (obs.type === 'rock') {
        const geo = new THREE.DodecahedronGeometry(obs.radius, 1);
        const mat = new THREE.MeshLambertMaterial({ color: 0x7A6A5A });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(obs.position);
        mesh.position.y = -0.3;
      } else if (obs.type === 'vortex') {
        const geo = new THREE.TorusGeometry(obs.radius, 0.3, 8, 24);
        const mat = new THREE.MeshLambertMaterial({ color: 0x2A5A7A, transparent: true, opacity: 0.5 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.copy(obs.position);
        mesh.position.y = 0.2;
      } else {
        const geo = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
        const mat = new THREE.MeshLambertMaterial({ color: 0x6B4226 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.z = Math.PI / 2;
        mesh.position.copy(obs.position);
        mesh.position.y = 0.1;
      }
      scene.add(mesh);
      this.obstacleMeshes.push(mesh);
    });
  }

  private createCheckpoints(): void {
    const checkpointTs = [
      { t: 0.1, label: '已过五里' },
      { t: 0.25, label: '已过十里' },
      { t: 0.38, label: '已过十五里' },
      { t: 0.48, label: '已过二十里' },
      { t: 0.6, label: '已过二十五里' },
      { t: 0.72, label: '已过三十里' },
      { t: 0.85, label: '已过三十五里' },
      { t: 0.95, label: '已过四十里' }
    ];

    checkpointTs.forEach(cp => {
      const pos = this.curve.getPointAt(cp.t);
      const tangent = this.curve.getTangentAt(cp.t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const seg = this.getSegmentAtT(cp.t);
      this.checkpoints.push({
        t: cp.t,
        position: pos.clone().add(normal.multiplyScalar(seg.width / 2 - 1)),
        label: cp.label,
        passed: false,
        passTime: 0
      });
    });
  }

  getSegmentAtT(t: number): RiverSegment {
    const ct = Math.max(0, Math.min(1, t));
    for (const seg of RIVER_SEGMENTS) {
      if (ct >= seg.startT && ct <= seg.endT) return seg;
    }
    return RIVER_SEGMENTS[RIVER_SEGMENTS.length - 1];
  }

  getPositionAtT(t: number): THREE.Vector3 {
    return this.curve.getPointAt(Math.max(0, Math.min(1, t)));
  }

  getTangentAtT(t: number): THREE.Vector3 {
    return this.curve.getTangentAt(Math.max(0, Math.min(1, t)));
  }

  getFlowSpeedAtT(t: number): number {
    return this.getSegmentAtT(t).flowSpeed;
  }

  getWidthAtT(t: number): number {
    return this.getSegmentAtT(t).width;
  }

  findClosestT(pos: THREE.Vector3): number {
    let closestT = 0;
    let closestDist = Infinity;
    const samples = 200;
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const p = this.curve.getPointAt(t);
      const dist = pos.distanceTo(p);
      if (dist < closestDist) {
        closestDist = dist;
        closestT = t;
      }
    }
    return closestT;
  }

  checkObstacleCollision(pos: THREE.Vector3, radius: number): Obstacle | null {
    for (const obs of this.obstacles) {
      if (!obs.active) continue;
      const dist = pos.distanceTo(obs.position);
      if (dist < obs.radius + radius) {
        return obs;
      }
    }
    return null;
  }

  getClosestObstacleDistance(pos: THREE.Vector3): number {
    let minDist = Infinity;
    for (const obs of this.obstacles) {
      if (!obs.active) continue;
      const dist = pos.distanceTo(obs.position);
      if (dist < minDist) minDist = dist;
    }
    return minDist;
  }

  update(time: number): void {
    this.waterMaterial.uniforms.uTime.value = time;

    this.obstacles.forEach((obs, i) => {
      if (obs.type === 'vortex' && obs.active) {
        obs.vortexAngle = (obs.vortexAngle || 0) + 0.03;
        this.obstacleMeshes[i].rotation.z = obs.vortexAngle;
      }
    });
  }
}
