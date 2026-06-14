import * as THREE from 'three';
import { gameState } from './gameState';
import type { Planet } from './types';

interface PlanetMesh extends THREE.Mesh {
  userData: {
    planetId: string;
    isPlanet: boolean;
  };
}

interface ConnectionLine extends THREE.Line {
  userData: {
    isConnection: boolean;
    fromId: string;
    toId: string;
  };
}

class StarMap {
  private scene: THREE.Scene;
  private planetMeshes: Map<string, PlanetMesh> = new Map();
  private connectionLines: ConnectionLine[] = [];
  private starField!: THREE.Points;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private onPlanetSelect: ((planetId: string | null) => void) | null = null;
  private glowMeshes: Map<string, THREE.Mesh> = new Map();
  private labelSprites: Map<string, THREE.Sprite> = new Map();
  private highlightRing!: THREE.Mesh;
  private missionHighlights: Map<string, THREE.Mesh> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    this.createStarField();
    this.createHighlightRing();
    this.generatePlanets();
    this.generateConnections();
  }

  private createStarField(): void {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount * 3; i += 3) {
      const radius = 100 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = radius * Math.cos(phi);

      const color = new THREE.Color();
      color.setHSL(0.55 + Math.random() * 0.15, 0.3 + Math.random() * 0.5, 0.6 + Math.random() * 0.4);
      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;

      sizes[i / 3] = Math.random() * 2 + 0.5;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const starMaterial = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });

    this.starField = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(this.starField);
  }

  private createHighlightRing(): void {
    const ringGeometry = new THREE.RingGeometry(2.5, 3.5, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    
    this.highlightRing = new THREE.Mesh(ringGeometry, ringMaterial);
    this.highlightRing.rotation.x = -Math.PI / 2;
    this.highlightRing.visible = false;
    this.scene.add(this.highlightRing);
  }

  private generatePlanets(): void {
    const planets = gameState.getPlanets();
    
    planets.forEach((planet, id) => {
      this.createPlanetMesh(planet, id);
    });
  }

  private createPlanetMesh(planet: Planet, id: string): void {
    const geometry = new THREE.SphereGeometry(planet.size, 32, 32);
    
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    const color = new THREE.Color(planet.color);
    gradient.addColorStop(0, `rgb(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)})`);
    gradient.addColorStop(0.5, `rgb(${Math.floor(color.r * 200)}, ${Math.floor(color.g * 200)}, ${Math.floor(color.b * 200)})`);
    gradient.addColorStop(1, `rgb(${Math.floor(color.r * 100)}, ${Math.floor(color.g * 100)}, ${Math.floor(color.b * 100)})`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const radius = Math.random() * 20 + 5;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${Math.floor(color.r * 150)}, ${Math.floor(color.g * 150)}, ${Math.floor(color.b * 150)}, 0.3)`;
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    
    const material = new THREE.MeshPhongMaterial({
      map: texture,
      bumpMap: texture,
      bumpScale: 0.1,
      shininess: 25
    });

    const mesh = new THREE.Mesh(geometry, material) as unknown as PlanetMesh;
    mesh.position.set(planet.position.x, planet.position.y, planet.position.z);
    mesh.userData = { planetId: id, isPlanet: true };
    
    this.scene.add(mesh);
    this.planetMeshes.set(id, mesh);

    const glowGeometry = new THREE.SphereGeometry(planet.size * 1.3, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: planet.color,
      transparent: true,
      opacity: 0.15 * planet.glowIntensity,
      side: THREE.BackSide
    });
    
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.position.copy(mesh.position);
    this.scene.add(glowMesh);
    this.glowMeshes.set(id, glowMesh);

    if (planet.isStation) {
      const ringGeometry = new THREE.TorusGeometry(planet.size * 1.8, 0.15, 8, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 0.6
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.copy(mesh.position);
      ring.rotation.x = Math.PI / 3;
      this.scene.add(ring);
    }

    this.createLabel(planet.name, mesh.position);
  }

  private createLabel(text: string, position: THREE.Vector3): void {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, 256, 64);
    
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true
    });
    
    const sprite = new THREE.Sprite(material);
    sprite.position.set(position.x, position.y + 4, position.z);
    sprite.scale.set(4, 1, 1);
    
    this.scene.add(sprite);
    this.labelSprites.set(text, sprite);
  }

  private generateConnections(): void {
    const planets = gameState.getPlanets();
    
    planets.forEach((planet, id) => {
      planet.connectedPlanets.forEach(targetId => {
        if (id < targetId) {
          this.createConnectionLine(id, targetId);
        }
      });
    });
  }

  private createConnectionLine(fromId: string, toId: string): void {
    const fromPlanet = gameState.getPlanet(fromId);
    const toPlanet = gameState.getPlanet(toId);
    
    if (!fromPlanet || !toPlanet) return;

    const points: THREE.Vector3[] = [];
    const start = new THREE.Vector3(
      fromPlanet.position.x,
      fromPlanet.position.y,
      fromPlanet.position.z
    );
    const end = new THREE.Vector3(
      toPlanet.position.x,
      toPlanet.position.y,
      toPlanet.position.z
    );
    
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const distance = start.distanceTo(end);
    mid.normalize().multiplyScalar(mid.length() + distance * 0.1);
    
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const curvePoints = curve.getPoints(50);
    
    curvePoints.forEach(p => points.push(p));

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    const opacityArray = new Float32Array(points.length);
    for (let i = 0; i < points.length; i++) {
      const t = i / (points.length - 1);
      opacityArray[i] = Math.sin(t * Math.PI) * 0.6 + 0.2;
    }
    geometry.setAttribute('opacity', new THREE.BufferAttribute(opacityArray, 1));

    const material = new THREE.LineBasicMaterial({
      color: 0x6366f1,
      transparent: true,
      opacity: 0.5
    });

    const line = new THREE.Line(geometry, material) as unknown as ConnectionLine;
    line.userData = { isConnection: true, fromId, toId };
    
    this.scene.add(line);
    this.connectionLines.push(line);

    const glowGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const glowMaterial = new THREE.LineBasicMaterial({
      color: 0x818cf8,
      transparent: true,
      opacity: 0.1
    });
    const glowLine = new THREE.Line(glowGeometry, glowMaterial);
    this.scene.add(glowLine);
  }

  public handleClick(event: MouseEvent, camera: THREE.Camera): string | null {
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, camera);
    
    const planetMeshArray = Array.from(this.planetMeshes.values());
    const intersects = this.raycaster.intersectObjects(planetMeshArray);

    if (intersects.length > 0) {
      const planetMesh = intersects[0].object as PlanetMesh;
      const planetId = planetMesh.userData.planetId;
      
      this.highlightPlanet(planetId);
      gameState.setSelectedPlanetId(planetId);
      
      if (this.onPlanetSelect) {
        this.onPlanetSelect(planetId);
      }
      
      return planetId;
    }
    
    return null;
  }

  public handleHover(event: MouseEvent, camera: THREE.Camera): string | null {
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, camera);
    
    const planetMeshArray = Array.from(this.planetMeshes.values());
    const intersects = this.raycaster.intersectObjects(planetMeshArray);

    if (intersects.length > 0) {
      const planetMesh = intersects[0].object as PlanetMesh;
      return planetMesh.userData.planetId;
    }
    
    return null;
  }

  private highlightPlanet(planetId: string): void {
    const planet = gameState.getPlanet(planetId);
    const mesh = this.planetMeshes.get(planetId);
    
    if (planet && mesh) {
      this.highlightRing.position.set(
        planet.position.x,
        planet.position.y - planet.size,
        planet.position.z
      );
      this.highlightRing.visible = true;
    }
  }

  public hideHighlight(): void {
    this.highlightRing.visible = false;
  }

  public highlightMissionTarget(planetId: string): void {
    this.removeMissionHighlight(planetId);
    
    const planet = gameState.getPlanet(planetId);
    if (!planet) return;

    const geometry = new THREE.RingGeometry(planet.size * 1.5, planet.size * 2, 4);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    
    const ring = new THREE.Mesh(geometry, material);
    ring.position.set(planet.position.x, planet.position.y, planet.position.z);
    ring.rotation.x = -Math.PI / 2;
    
    this.scene.add(ring);
    this.missionHighlights.set(planetId, ring);
  }

  public removeMissionHighlight(planetId: string): void {
    const ring = this.missionHighlights.get(planetId);
    if (ring) {
      this.scene.remove(ring);
      this.missionHighlights.delete(planetId);
    }
  }

  public updateMissionHighlights(): void {
    this.missionHighlights.forEach((_, id) => this.removeMissionHighlight(id));
    
    const activeMissions = gameState.getMissions().filter(m => m.accepted && !m.completed);
    activeMissions.forEach(mission => {
      this.highlightMissionTarget(mission.targetPlanetId);
    });
  }

  public setOnPlanetSelect(callback: (planetId: string | null) => void): void {
    this.onPlanetSelect = callback;
  }

  public getPlanetPosition(planetId: string): THREE.Vector3 | null {
    const mesh = this.planetMeshes.get(planetId);
    return mesh ? mesh.position.clone() : null;
  }

  public update(deltaTime: number): void {
    this.planetMeshes.forEach((mesh, id) => {
      mesh.rotation.y += deltaTime * 0.2;
      
      const glow = this.glowMeshes.get(id);
      if (glow) {
        const time = Date.now() * 0.001;
        glow.scale.setScalar(1 + Math.sin(time * 2 + id.charCodeAt(id.length - 1)) * 0.1);
      }
    });

    this.starField.rotation.y += deltaTime * 0.01;

    const pulseScale = 1 + Math.sin(Date.now() * 0.003) * 0.1;
    this.highlightRing.scale.setScalar(pulseScale);

    this.missionHighlights.forEach(ring => {
      ring.rotation.z += deltaTime * 2;
      const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.15;
      ring.scale.setScalar(pulse);
    });
  }

  public dispose(): void {
    this.planetMeshes.forEach(mesh => {
      (mesh.geometry as THREE.BufferGeometry).dispose();
      (mesh.material as THREE.Material).dispose();
    });
    
    this.connectionLines.forEach(line => {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    });
    
    this.starField.geometry.dispose();
    (this.starField.material as THREE.Material).dispose();
  }
}

export { StarMap };
