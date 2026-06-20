import * as THREE from 'three';
import type { CelestialBody } from './dataLoader';

interface StarSystemOptions {
  sceneRadius: number;
  starCount: number;
  planetCount: number;
  backgroundStarCount: number;
}

interface PlanetRuntime {
  mesh: THREE.Mesh;
  parentStar: THREE.Vector3;
  orbitRadius: number;
  orbitSpeed: number;
  angle: number;
}

export class StarSystem {
  public group: THREE.Group;
  public selectableObjects: THREE.Object3D[] = [];
  public idToMesh: Map<string, THREE.Object3D> = new Map();
  public idToData: Map<string, CelestialBody> = new Map();
  public typeToMeshes: Map<string, THREE.Object3D[]> = new Map();

  private data: CelestialBody[];
  private options: StarSystemOptions;
  private planetRuntimes: PlanetRuntime[] = [];
  private backgroundStars: THREE.Points | null = null;
  private haloMeshes: Map<string, THREE.Mesh> = new Map();
  private time: number = 0;

  constructor(data: CelestialBody[], options: StarSystemOptions) {
    this.data = data;
    this.options = options;
    this.group = new THREE.Group();
    this.build();
  }

  private build(): void {
    const starPositions: Map<string, THREE.Vector3> = new Map();

    for (const body of this.data) {
      this.idToData.set(body.id, body);

      if (body.type === 'star') {
        const starMesh = this.createStar(body);
        starMesh.position.set(body.position[0], body.position[1], body.position[2]);
        this.group.add(starMesh);
        this.selectableObjects.push(starMesh);
        this.idToMesh.set(body.id, starMesh);
        starPositions.set(body.id, starMesh.position.clone());
        this.addToTypeMap('star', starMesh);

        const haloMesh = this.createHalo(body);
        haloMesh.position.copy(starMesh.position);
        this.haloMeshes.set(body.id, haloMesh);
        this.group.add(haloMesh);
      }
    }

    for (const body of this.data) {
      if (body.type === 'planet') {
        const parentPos = starPositions.get(body.parentStarId || '');
        if (!parentPos) continue;

        const planetMesh = this.createPlanet(body);
        const orbitRadius = body.orbitRadius || 3;
        const initialAngle = body.initialAngle || 0;
        planetMesh.position.set(
          parentPos.x + Math.cos(initialAngle) * orbitRadius,
          parentPos.y,
          parentPos.z + Math.sin(initialAngle) * orbitRadius
        );
        this.group.add(planetMesh);
        this.selectableObjects.push(planetMesh);
        this.idToMesh.set(body.id, planetMesh);
        this.addToTypeMap('planet', planetMesh);

        const orbitLine = this.createOrbitLine(parentPos, orbitRadius);
        this.group.add(orbitLine);
        this.addToTypeMap('planet', orbitLine);

        this.planetRuntimes.push({
          mesh: planetMesh,
          parentStar: parentPos.clone(),
          orbitRadius,
          orbitSpeed: body.orbitSpeed || 0.3,
          angle: initialAngle,
        });

        const haloMesh = this.createHalo(body);
        haloMesh.position.copy(planetMesh.position);
        this.haloMeshes.set(body.id, haloMesh);
        this.group.add(haloMesh);
      }
    }

    this.backgroundStars = this.createBackgroundStars();
    this.group.add(this.backgroundStars);
  }

  private addToTypeMap(type: string, obj: THREE.Object3D): void {
    if (!this.typeToMeshes.has(type)) {
      this.typeToMeshes.set(type, []);
    }
    this.typeToMeshes.get(type)!.push(obj);
  }

  private createStar(body: CelestialBody): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(body.size, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(body.color),
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.bodyId = body.id;
    mesh.userData.bodyType = 'star';
    return mesh;
  }

  private createPlanet(body: CelestialBody): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(body.size, 24, 24);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(body.color),
      roughness: 0.8,
      metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.bodyId = body.id;
    mesh.userData.bodyType = 'planet';
    return mesh;
  }

  private createHalo(body: CelestialBody): THREE.Mesh {
    const haloSize = body.size * 1.8;
    const geometry = new THREE.RingGeometry(haloSize * 0.9, haloSize * 1.1, 64);
    const material = new THREE.MeshBasicMaterial({
      color: 0x4fc3f7,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.userData.isHalo = true;
    mesh.userData.baseSize = haloSize;
    mesh.visible = false;
    return mesh;
  }

  private createOrbitLine(center: THREE.Vector3, radius: number): THREE.LineLoop {
    const segments = 128;
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(
        center.x + Math.cos(angle) * radius,
        center.y,
        center.z + Math.sin(angle) * radius
      ));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x4fc3f7,
      transparent: true,
      opacity: 0.2,
    });
    const line = new THREE.LineLoop(geometry, material);
    return line;
  }

  private createBackgroundStars(): THREE.Points {
    const count = this.options.backgroundStarCount;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);

    const radius = this.options.sceneRadius * 0.95;
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = radius * Math.cbrt(Math.random());

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const colorTone = Math.random();
      colors[i * 3] = 0.7 + colorTone * 0.3;
      colors[i * 3 + 1] = 0.8 + colorTone * 0.2;
      colors[i * 3 + 2] = 1.0;

      sizes[i] = Math.random() * 1.5 + 0.5;
      phases[i] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: `
        attribute float size;
        attribute float phase;
        varying vec3 vColor;
        varying float vPhase;
        uniform float time;
        void main() {
          vColor = color;
          vPhase = phase;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float brightness = 0.3 + 0.7 * abs(sin(time * 0.8 + phase));
          gl_PointSize = size * (300.0 / -mvPosition.z) * brightness;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vPhase;
        uniform float time;
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          if (dist > 0.5) discard;
          float brightness = 0.3 + 0.7 * abs(sin(time * 0.8 + vPhase));
          float alpha = (1.0 - dist * 2.0) * brightness;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    this.addToTypeMap('nebula', points);
    return points;
  }

  public setSelected(id: string | null): void {
    for (const [meshId, halo] of this.haloMeshes) {
      if (meshId === id) {
        halo.visible = true;
        (halo.material as THREE.MeshBasicMaterial).opacity = 0.8;
      } else {
        halo.visible = false;
        (halo.material as THREE.MeshBasicMaterial).opacity = 0;
      }
    }
  }

  public setFilter(filter: 'all' | 'star' | 'planet' | 'nebula'): void {
    const setObjectOpacity = (obj: THREE.Object3D, opacity: number): void => {
      obj.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const mat = mesh.material as THREE.Material | THREE.Material[];
          const applyOpacity = (m: THREE.Material) => {
            if ('opacity' in m) {
              (m as any).opacity = opacity;
            }
            if (opacity < 1) {
              (m as any).transparent = true;
            }
          };
          if (Array.isArray(mat)) {
            mat.forEach(applyOpacity);
          } else {
            applyOpacity(mat);
          }
        }
      });
    };

    for (const [type, meshes] of this.typeToMeshes) {
      const targetOpacity = (filter === 'all' || filter === type) ? 1.0 : 0.2;
      for (const mesh of meshes) {
        setObjectOpacity(mesh, targetOpacity);
      }
    }
  }

  public update(delta: number): void {
    this.time += delta;

    for (const runtime of this.planetRuntimes) {
      runtime.angle += runtime.orbitSpeed * delta;
      runtime.mesh.position.x = runtime.parentStar.x + Math.cos(runtime.angle) * runtime.orbitRadius;
      runtime.mesh.position.z = runtime.parentStar.z + Math.sin(runtime.angle) * runtime.orbitRadius;

      const halo = this.haloMeshes.get(runtime.mesh.userData.bodyId);
      if (halo && halo.visible) {
        halo.position.copy(runtime.mesh.position);
        const pulse = 0.7 + 0.3 * Math.sin(this.time * Math.PI * 2);
        halo.scale.setScalar(1 + 0.15 * pulse);
        (halo.material as THREE.MeshBasicMaterial).opacity = 0.6 + 0.4 * pulse;
        halo.lookAt(0, runtime.mesh.position.y, 0);
      }
    }

    for (const [id, halo] of this.haloMeshes) {
      if (halo.visible && !this.planetRuntimes.some((r) => r.mesh.userData.bodyId === id)) {
        const pulse = 0.7 + 0.3 * Math.sin(this.time * Math.PI * 2);
        halo.scale.setScalar(1 + 0.15 * pulse);
        (halo.material as THREE.MeshBasicMaterial).opacity = 0.6 + 0.4 * pulse;
      }
    }

    if (this.backgroundStars && this.backgroundStars.material instanceof THREE.ShaderMaterial) {
      this.backgroundStars.material.uniforms.time.value = this.time;
    }
  }

  public getFirstByType(type: 'star' | 'planet' | 'nebula'): CelestialBody | null {
    for (const body of this.data) {
      if (body.type === type) return body;
    }
    return null;
  }

  public getMeshPosition(id: string): THREE.Vector3 | null {
    const mesh = this.idToMesh.get(id);
    if (mesh) return mesh.position.clone();
    const data = this.idToData.get(id);
    if (data) return new THREE.Vector3(data.position[0], data.position[1], data.position[2]);
    return null;
  }
}
