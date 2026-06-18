import * as THREE from 'three';

export interface StarData {
  id: string;
  position: THREE.Vector3;
  color: THREE.Color;
  size: number;
}

export interface ConnectionData {
  id: string;
  starId1: string;
  starId2: string;
}

export interface ConstellationData {
  id: string;
  name: string;
  stars: StarData[];
  connections: ConnectionData[];
}

export interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export interface FlowDot {
  mesh: THREE.Mesh;
  line: THREE.Line;
  progress: number;
  speed: number;
  star1: THREE.Object3D;
  star2: THREE.Object3D;
}

const starColors = [
  new THREE.Color('#FFF7E0'),
  new THREE.Color('#FFF4D6'),
  new THREE.Color('#E8F4FF'),
  new THREE.Color('#D4E8FF'),
  new THREE.Color('#A0C4FF')
];

export class ConstellationManager {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private stars: Map<string, THREE.Group> = new Map();
  private connections: Map<string, { line: THREE.Line; flowDot: FlowDot; selected: boolean }> = new Map();
  private particles: Particle[] = [];
  private constellations: Map<string, ConstellationData> = new Map();
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2();
  private selectedStarForConnection: string | null = null;
  private activeConstellationId: string | null = null;
  private starGeometry: THREE.SphereGeometry;
  private particleGeometry: THREE.SphereGeometry;
  private flowDotGeometry: THREE.SphereGeometry;

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene;
    this.camera = camera;
    this.starGeometry = new THREE.SphereGeometry(1, 16, 16);
    this.particleGeometry = new THREE.SphereGeometry(1, 8, 8);
    this.flowDotGeometry = new THREE.SphereGeometry(1, 16, 16);
    this.loadConstellations();
  }

  public getStarColors(): THREE.Color[] {
    return starColors;
  }

  public handleClick(event: MouseEvent, isShiftPressed: boolean): void {
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const starObjects = Array.from(this.stars.values());
    const starMeshes = starObjects.flatMap(group => 
      group.children.filter(child => child.userData.isStarCore)
    );
    
    const intersects = this.raycaster.intersectObjects(starMeshes, true);

    if (isShiftPressed && intersects.length > 0) {
      const clickedMesh = intersects[0].object;
      const starGroup = clickedMesh.parent as THREE.Group;
      const starId = starGroup.userData.id;

      if (this.selectedStarForConnection === null) {
        this.selectedStarForConnection = starId;
        this.setStarHighlight(starId, true);
      } else if (this.selectedStarForConnection !== starId) {
        this.createConnection(this.selectedStarForConnection, starId);
        this.setStarHighlight(this.selectedStarForConnection, false);
        this.selectedStarForConnection = null;
      } else {
        this.setStarHighlight(this.selectedStarForConnection, false);
        this.selectedStarForConnection = null;
      }
      return;
    }

    if (intersects.length === 0) {
      const planeNormal = new THREE.Vector3();
      this.camera.getWorldDirection(planeNormal);
      const plane = new THREE.Plane(planeNormal, 0);
      const point = new THREE.Vector3();
      this.raycaster.ray.intersectPlane(plane, point);

      if (point) {
        this.addStar(point);
      }
    }
  }

  public cancelConnectionSelection(): void {
    if (this.selectedStarForConnection) {
      this.setStarHighlight(this.selectedStarForConnection, false);
      this.selectedStarForConnection = null;
    }
  }

  private addStar(position: THREE.Vector3): void {
    const id = 'star_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const color = starColors[Math.floor(Math.random() * starColors.length)].clone();
    const size = 4 + Math.random() * 4;

    const starGroup = new THREE.Group();
    starGroup.position.copy(position);
    starGroup.userData.id = id;
    starGroup.userData.color = color;
    starGroup.userData.size = size;

    const coreMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 1.0
    });
    const coreMesh = new THREE.Mesh(this.starGeometry, coreMaterial);
    coreMesh.scale.setScalar(0);
    coreMesh.userData.isStarCore = true;
    starGroup.add(coreMesh);

    const haloMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const haloMesh = new THREE.Mesh(this.starGeometry, haloMaterial);
    haloMesh.scale.setScalar(0);
    starGroup.add(haloMesh);

    this.scene.add(starGroup);
    this.stars.set(id, starGroup);

    const startTime = performance.now();
    const animateScale = () => {
      const elapsed = (performance.now() - startTime) / 300;
      if (elapsed < 1) {
        let t = elapsed;
        const overshoot = 1.70158;
        t += 1;
        const scale = size * (t * t * ((overshoot + 1) * t - overshoot) + 1) / 2;
        const actualScale = Math.min(scale, size);
        
        coreMesh.scale.setScalar(actualScale);
        haloMesh.scale.setScalar(actualScale * 2.5);
        
        requestAnimationFrame(animateScale);
      } else {
        coreMesh.scale.setScalar(size);
        haloMesh.scale.setScalar(size * 2.5);
      }
    };
    animateScale();

    this.createParticles(position, color);
  }

  private createParticles(position: THREE.Vector3, color: THREE.Color): void {
    const particleCount = 10;
    for (let i = 0; i < particleCount; i++) {
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize().multiplyScalar(0.5 + Math.random() * 1.0);

      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(this.particleGeometry, material);
      const size = 2 + Math.random() * 2;
      mesh.scale.setScalar(size);
      mesh.position.copy(position);

      this.scene.add(mesh);

      this.particles.push({
        mesh,
        velocity,
        life: 0.8,
        maxLife: 0.8
      });
    }
  }

  private setStarHighlight(starId: string, highlighted: boolean): void {
    const starGroup = this.stars.get(starId);
    if (!starGroup) return;

    const haloMesh = starGroup.children.find(child => 
      child instanceof THREE.Mesh && !child.userData.isStarCore
    ) as THREE.Mesh;

    if (haloMesh) {
      const material = haloMesh.material as THREE.MeshBasicMaterial;
      material.opacity = highlighted ? 0.6 : 0.3;
      haloMesh.scale.setScalar(starGroup.userData.size * (highlighted ? 3.5 : 2.5));
    }
  }

  private createConnection(starId1: string, starId2: string): void {
    if (this.hasConnection(starId1, starId2)) return;

    const star1 = this.stars.get(starId1);
    const star2 = this.stars.get(starId2);
    if (!star1 || !star2) return;

    const connectionId = 'conn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    const points = [star1.position.clone(), star2.position.clone()];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const material = new THREE.LineBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0
    });

    const line = new THREE.Line(geometry, material);
    line.userData.id = connectionId;
    this.scene.add(line);

    const flowDotMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const flowDotMesh = new THREE.Mesh(this.flowDotGeometry, flowDotMaterial);
    flowDotMesh.scale.setScalar(6);
    this.scene.add(flowDotMesh);

    const flowDot: FlowDot = {
      mesh: flowDotMesh,
      line,
      progress: 0,
      speed: 1,
      star1,
      star2
    };

    this.connections.set(connectionId, {
      line,
      flowDot,
      selected: false
    });

    const startTime = performance.now();
    const animateFadeIn = () => {
      const elapsed = (performance.now() - startTime) / 500;
      if (elapsed < 1) {
        material.opacity = elapsed * 0.6;
        flowDotMaterial.opacity = elapsed;
        requestAnimationFrame(animateFadeIn);
      } else {
        material.opacity = 0.6;
        flowDotMaterial.opacity = 1;
      }
    };
    animateFadeIn();
  }

  private hasConnection(starId1: string, starId2: string): boolean {
    for (const { line } of this.connections.values()) {
      const positions = line.geometry.attributes.position.array as Float32Array;
      const p1 = new THREE.Vector3(positions[0], positions[1], positions[2]);
      const p2 = new THREE.Vector3(positions[3], positions[4], positions[5]);

      const star1 = this.stars.get(starId1);
      const star2 = this.stars.get(starId2);
      if (!star1 || !star2) continue;

      const matches1 = p1.equals(star1.position) && p2.equals(star2.position);
      const matches2 = p1.equals(star2.position) && p2.equals(star1.position);

      if (matches1 || matches2) return true;
    }
    return false;
  }

  public update(deltaTime: number, camera: THREE.Camera): void {
    for (const starGroup of this.stars.values()) {
      starGroup.lookAt(camera.position);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.mesh.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
      particle.life -= deltaTime;
      const alpha = Math.max(0, particle.life / particle.maxLife);
      (particle.mesh.material as THREE.MeshBasicMaterial).opacity = alpha;
      particle.mesh.scale.setScalar((2 + Math.random() * 2) * alpha);

      if (particle.life <= 0) {
        this.scene.remove(particle.mesh);
        this.particles.splice(i, 1);
      }
    }

    for (const { flowDot, selected } of this.connections.values()) {
      flowDot.progress += flowDot.speed * deltaTime;
      if (flowDot.progress > 1) flowDot.progress = 0;

      const start = flowDot.star1.position;
      const end = flowDot.star2.position;
      flowDot.mesh.position.lerpVectors(start, end, flowDot.progress);

      const lineMaterial = flowDot.line.material as THREE.LineBasicMaterial;
      lineMaterial.color.setHex(selected ? 0xFFD700 : 0xFFFFFF);

      const dotMaterial = flowDot.mesh.material as THREE.MeshBasicMaterial;
      dotMaterial.color.setHex(selected ? 0xFFD700 : 0xFFFFFF);
    }
  }

  public saveConstellation(name: string): boolean {
    if (this.stars.size === 0) return false;

    const id = 'constellation_' + Date.now();
    const stars: StarData[] = [];
    const connections: ConnectionData[] = [];

    for (const [starId, starGroup] of this.stars.entries()) {
      stars.push({
        id: starId,
        position: starGroup.position.clone(),
        color: starGroup.userData.color.clone(),
        size: starGroup.userData.size
      });
    }

    for (const [connId, { line }] of this.connections.entries()) {
      const positions = line.geometry.attributes.position.array as Float32Array;
      const p1 = new THREE.Vector3(positions[0], positions[1], positions[2]);
      const p2 = new THREE.Vector3(positions[3], positions[4], positions[5]);

      let starId1 = '';
      let starId2 = '';

      for (const [starId, starGroup] of this.stars.entries()) {
        if (starGroup.position.equals(p1)) starId1 = starId;
        if (starGroup.position.equals(p2)) starId2 = starId;
      }

      connections.push({
        id: connId,
        starId1,
        starId2
      });
    }

    const constellation: ConstellationData = {
      id,
      name,
      stars,
      connections
    };

    this.constellations.set(id, constellation);
    this.saveConstellations();
    this.activeConstellationId = id;
    return true;
  }

  public loadConstellation(id: string): void {
    const constellation = this.constellations.get(id);
    if (!constellation) return;

    this.clearCurrent();
    this.activeConstellationId = id;

    for (const starData of constellation.stars) {
      const starGroup = new THREE.Group();
      starGroup.position.copy(starData.position);
      starGroup.userData.id = starData.id;
      starGroup.userData.color = starData.color.clone();
      starGroup.userData.size = starData.size;

      const coreMaterial = new THREE.MeshBasicMaterial({
        color: starData.color,
        transparent: true,
        opacity: 1.0
      });
      const coreMesh = new THREE.Mesh(this.starGeometry, coreMaterial);
      coreMesh.scale.setScalar(starData.size);
      coreMesh.userData.isStarCore = true;
      starGroup.add(coreMesh);

      const haloMaterial = new THREE.MeshBasicMaterial({
        color: starData.color,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const haloMesh = new THREE.Mesh(this.starGeometry, haloMaterial);
      haloMesh.scale.setScalar(starData.size * 2.5);
      starGroup.add(haloMesh);

      this.scene.add(starGroup);
      this.stars.set(starData.id, starGroup);
    }

    for (const connData of constellation.connections) {
      const star1 = this.stars.get(connData.starId1);
      const star2 = this.stars.get(connData.starId2);
      if (!star1 || !star2) continue;

      const points = [star1.position.clone(), star2.position.clone()];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      const material = new THREE.LineBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.6
      });

      const line = new THREE.Line(geometry, material);
      line.userData.id = connData.id;
      this.scene.add(line);

      const flowDotMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const flowDotMesh = new THREE.Mesh(this.flowDotGeometry, flowDotMaterial);
      flowDotMesh.scale.setScalar(6);
      this.scene.add(flowDotMesh);

      const flowDot: FlowDot = {
        mesh: flowDotMesh,
        line,
        progress: Math.random(),
        speed: 1,
        star1,
        star2
      };

      this.connections.set(connData.id, {
        line,
        flowDot,
        selected: false
      });
    }
  }

  public deleteConstellation(id: string): void {
    this.constellations.delete(id);
    this.saveConstellations();

    if (this.activeConstellationId === id) {
      this.clearCurrent();
      this.activeConstellationId = null;
    }
  }

  public clearCurrent(): void {
    for (const starGroup of this.stars.values()) {
      this.scene.remove(starGroup);
    }
    this.stars.clear();

    for (const { line, flowDot } of this.connections.values()) {
      this.scene.remove(line);
      this.scene.remove(flowDot.mesh);
    }
    this.connections.clear();

    for (const particle of this.particles) {
      this.scene.remove(particle.mesh);
    }
    this.particles = [];

    this.selectedStarForConnection = null;
  }

  public getConstellations(): Map<string, ConstellationData> {
    return this.constellations;
  }

  public getActiveConstellationId(): string | null {
    return this.activeConstellationId;
  }

  private saveConstellations(): void {
    const data = Array.from(this.constellations.values()).map(c => ({
      ...c,
      stars: c.stars.map(s => ({
        ...s,
        position: { x: s.position.x, y: s.position.y, z: s.position.z },
        color: `#${s.color.getHexString()}`
      }))
    }));
    localStorage.setItem('constellations', JSON.stringify(data));
  }

  private loadConstellations(): void {
    const saved = localStorage.getItem('constellations');
    if (!saved) return;

    try {
      const data = JSON.parse(saved) as Array<Omit<ConstellationData, 'stars'> & {
        stars: Array<Omit<StarData, 'position' | 'color'> & { position: { x: number; y: number; z: number }; color: string }>
      }>;

      for (const item of data) {
        const constellation: ConstellationData = {
          ...item,
          stars: item.stars.map(s => ({
            ...s,
            position: new THREE.Vector3(s.position.x, s.position.y, s.position.z),
            color: new THREE.Color(s.color)
          }))
        };
        this.constellations.set(constellation.id, constellation);
      }
    } catch (e) {
      console.error('Failed to load constellations:', e);
    }
  }
}
