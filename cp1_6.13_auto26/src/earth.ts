import * as THREE from 'three';
import { eventBus, EVENTS } from './eventBus';

export class Earth {
  public mesh: THREE.Mesh;
  public atmosphere: THREE.Mesh;
  public gridLines: THREE.Group;
  public group: THREE.Group;
  public rotationSpeed: number = 0.5;
  private baseRotationSpeed: number = 0.0005;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();

    this.mesh = this.createEarthMesh();
    this.atmosphere = this.createAtmosphere();
    this.gridLines = this.createGridLines();

    this.group.add(this.mesh);
    this.group.add(this.atmosphere);
    this.group.add(this.gridLines);

    scene.add(this.group);

    this.setupEventListeners();
  }

  private createEarthMesh(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(1, 48, 48);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a1628');
    gradient.addColorStop(0.3, '#1a3a5c');
    gradient.addColorStop(0.5, '#2d5a7b');
    gradient.addColorStop(0.7, '#1a4a3a');
    gradient.addColorStop(1, '#0a1628');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#2d6a4f';
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const w = 40 + Math.random() * 120;
      const h = 25 + Math.random() * 60;
      ctx.beginPath();
      ctx.ellipse(x, y, w, h, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#40916c';
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const w = 25 + Math.random() * 80;
      const h = 15 + Math.random() * 40;
      ctx.beginPath();
      ctx.ellipse(x, y, w, h, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    const material = new THREE.MeshPhongMaterial({
      map: texture,
      shininess: 8,
      specular: new THREE.Color(0x333366),
    });

    return new THREE.Mesh(geometry, material);
  }

  private createAtmosphere(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(1.05, 32, 32);
    const material = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });

    return new THREE.Mesh(geometry, material);
  }

  private createGridLines(): THREE.Group {
    const group = new THREE.Group();

    const meridiansMaterial = new THREE.LineBasicMaterial({
      color: 0x4a8eff,
      transparent: true,
      opacity: 0.15,
    });

    for (let i = 0; i < 16; i++) {
      const points: THREE.Vector3[] = [];
      const angle = (i / 16) * Math.PI * 2;
      for (let j = 0; j <= 32; j++) {
        const lat = (j / 32) * Math.PI - Math.PI / 2;
        const x = Math.cos(lat) * Math.cos(angle) * 1.005;
        const y = Math.sin(lat) * 1.005;
        const z = Math.cos(lat) * Math.sin(angle) * 1.005;
        points.push(new THREE.Vector3(x, y, z));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, meridiansMaterial);
      group.add(line);
    }

    const parallelsMaterial = new THREE.LineBasicMaterial({
      color: 0x4a8eff,
      transparent: true,
      opacity: 0.15,
    });

    for (let i = 1; i < 8; i++) {
      const points: THREE.Vector3[] = [];
      const lat = (i / 8) * Math.PI - Math.PI / 2;
      const radius = Math.cos(lat) * 1.005;
      const y = Math.sin(lat) * 1.005;
      for (let j = 0; j <= 64; j++) {
        const angle = (j / 64) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        points.push(new THREE.Vector3(x, y, z));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, parallelsMaterial);
      group.add(line);
    }

    return group;
  }

  private setupEventListeners(): void {
    eventBus.on(EVENTS.EARTH_ROTATION_SPEED_CHANGED, (speed) => {
      this.rotationSpeed = speed as number;
    });
  }

  public update(deltaTime: number): void {
    const rot = this.baseRotationSpeed * this.rotationSpeed * deltaTime * 60;
    this.mesh.rotation.y += rot;
    this.gridLines.rotation.y += rot;
  }
}
