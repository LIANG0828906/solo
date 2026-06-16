import * as THREE from 'three';
import {
  StarData,
  ConstellationData,
  bvToColor,
  seasonAngles,
  famousConstellationIds,
  getConstellationById
} from '../utils/starData';

interface StarMesh extends THREE.Mesh {
  userData: {
    starData: StarData;
    originalScale: number;
    originalEmissive: number;
    selected: boolean;
    pulsePhase: number;
    highlight: boolean;
  };
}

export class StarScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private container: HTMLElement;

  private starGroup: THREE.Group;
  private backgroundStars: THREE.Points;
  private constellationLineMeshes: THREE.Group;
  private starMeshes: Map<string, StarMesh>;
  private selectedStarMesh: StarMesh | null;
  private pulseRing: THREE.Mesh | null;

  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  private isDragging: boolean;
  private previousMousePosition: { x: number; y: number };
  private rotationVelocity: { x: number; y: number };
  private targetRotation: { x: number; y: number };
  private currentRotation: { x: number; y: number };
  private zoomLevel: number;

  private animationId: number | null;
  private clock: THREE.Clock;

  private currentSeason: string;
  private roamingInterval: number | null;
  private currentRoamIndex: number;
  private roamingActive: boolean;
  private transitioning: boolean;

  private onStarSelect: ((star: StarData | null) => void) | null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.starMeshes = new Map();
    this.selectedStarMesh = null;
    this.pulseRing = null;
    this.onStarSelect = null;

    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.rotationVelocity = { x: 0, y: 0 };
    this.targetRotation = { x: 0.2, y: 0.5 };
    this.currentRotation = { x: 0.2, y: 0.5 };
    this.zoomLevel = 1;

    this.animationId = null;
    this.clock = new THREE.Clock();

    this.currentSeason = 'spring';
    this.roamingInterval = null;
    this.currentRoamIndex = 0;
    this.roamingActive = false;
    this.transitioning = false;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000011);
    this.scene.fog = new THREE.FogExp2(0x000011, 0.008);

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 120);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    container.appendChild(this.renderer.domElement);

    this.starGroup = new THREE.Group();
    this.constellationLineMeshes = new THREE.Group();
    this.scene.add(this.starGroup);
    this.scene.add(this.constellationLineMeshes);

    this.backgroundStars = this.createBackgroundStars();
    this.scene.add(this.backgroundStars);

    this.addEventListeners();
  }

  setOnStarSelect(callback: (star: StarData | null) => void) {
    this.onStarSelect = callback;
  }

  private createBackgroundStars(): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(2000 * 3);
    const sizes = new Float32Array(2000);

    for (let i = 0; i < 2000; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 95 + Math.random() * 5;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      sizes[i] = 0.5 + Math.random() * 1.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.8,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8
    });

    return new THREE.Points(geometry, material);
  }

  private createThinLine(
    start: THREE.Vector3,
    end: THREE.Vector3,
    color: number,
    opacity: number
  ): THREE.Mesh {
    const direction = end.clone().sub(start);
    const length = direction.length();
    const midPoint = start.clone().add(end).multiplyScalar(0.5);

    const geometry = new THREE.CylinderGeometry(0.08, 0.08, length, 6);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: opacity
    });

    const cylinder = new THREE.Mesh(geometry, material);
    cylinder.position.copy(midPoint);
    cylinder.lookAt(end);
    cylinder.rotateX(Math.PI / 2);

    return cylinder;
  }

  public loadConstellations(constellations: ConstellationData[]) {
    this.constellationLineMeshes.clear();
    this.starGroup.clear();
    this.starMeshes.clear();

    for (const constellation of constellations) {
      for (const star of constellation.stars) {
        if (this.starMeshes.has(star.id)) continue;

        const color = bvToColor(star.bvColorIndex);
        const baseRadius = Math.max(0.3, Math.min(2.0, (5 - star.apparentMagnitude) * 0.3));

        const geometry = new THREE.SphereGeometry(baseRadius, 16, 16);
        const material = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.95
        });

        const starMesh = new THREE.Mesh(geometry, material) as StarMesh;
        starMesh.position.set(star.x, star.y, star.z);
        starMesh.userData = {
          starData: star,
          originalScale: baseRadius,
          originalEmissive: color,
          selected: false,
          pulsePhase: 0,
          highlight: false
        };

        const glowGeometry = new THREE.SphereGeometry(baseRadius * 1.8, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.15,
          side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        starMesh.add(glow);

        this.starMeshes.set(star.id, starMesh);
        this.starGroup.add(starMesh);
      }

      for (const [idx1, idx2] of constellation.connections) {
        const star1 = constellation.stars[idx1];
        const star2 = constellation.stars[idx2];
        if (!star1 || !star2) continue;

        const lineOpacity = constellation.season === this.currentSeason ? 0.8 : 0.2;

        const line = this.createThinLine(
          new THREE.Vector3(star1.x, star1.y, star1.z),
          new THREE.Vector3(star2.x, star2.y, star2.z),
          0x4da6ff,
          lineOpacity
        );
        line.userData = { constellationId: constellation.id, season: constellation.season };
        this.constellationLineMeshes.add(line);
      }
    }
  }

  private addEventListeners() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));
    canvas.addEventListener('wheel', this.onWheel.bind(this));
    canvas.addEventListener('click', this.onClick.bind(this));
    window.addEventListener('resize', this.onResize.bind(this));
  }

  private onMouseDown(e: MouseEvent) {
    if (this.roamingActive) this.stopRoaming();
    this.isDragging = true;
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
    this.rotationVelocity = { x: 0, y: 0 };
  }

  private onMouseMove(e: MouseEvent) {
    if (!this.isDragging) return;

    const deltaX = e.clientX - this.previousMousePosition.x;
    const deltaY = e.clientY - this.previousMousePosition.y;

    this.rotationVelocity.y = deltaX * 0.005;
    this.rotationVelocity.x = deltaY * 0.005;

    this.targetRotation.y += this.rotationVelocity.y;
    this.targetRotation.x += this.rotationVelocity.x;

    this.targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetRotation.x));

    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  }

  private onMouseUp() {
    this.isDragging = false;
  }

  private onWheel(e: WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY * 0.001;
    this.zoomLevel = Math.max(0.5, Math.min(5, this.zoomLevel + delta * 0.5));
    this.camera.position.z = 120 / this.zoomLevel;
  }

  private onClick(e: MouseEvent) {
    if (this.isDragging) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const starObjects = Array.from(this.starMeshes.values());
    const intersects = this.raycaster.intersectObjects(starObjects, false);

    if (intersects.length > 0) {
      const starMesh = intersects[0].object as StarMesh;
      this.selectStar(starMesh);
    } else {
      this.deselectStar();
    }
  }

  private selectStar(starMesh: StarMesh) {
    if (this.selectedStarMesh) {
      this.deselectStar();
    }

    this.selectedStarMesh = starMesh;
    starMesh.userData.selected = true;

    starMesh.scale.setScalar(1.5);

    const ringGeometry = new THREE.RingGeometry(
      starMesh.userData.originalScale * 2.2,
      starMesh.userData.originalScale * 2.6,
      32
    );
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    this.pulseRing = new THREE.Mesh(ringGeometry, ringMaterial);
    this.pulseRing.position.copy(starMesh.position);
    this.starGroup.add(this.pulseRing);

    if (this.onStarSelect) {
      this.onStarSelect(starMesh.userData.starData);
    }
  }

  private deselectStar() {
    if (this.selectedStarMesh) {
      this.selectedStarMesh.userData.selected = false;
      this.selectedStarMesh.scale.setScalar(1);
      this.selectedStarMesh = null;
    }
    if (this.pulseRing) {
      this.starGroup.remove(this.pulseRing);
      this.pulseRing.geometry.dispose();
      (this.pulseRing.material as THREE.Material).dispose();
      this.pulseRing = null;
    }
    if (this.onStarSelect) {
      this.onStarSelect(null);
    }
  }

  public deselectStarExternal() {
    this.deselectStar();
  }

  private onResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  public setSeason(season: string) {
    this.currentSeason = season;

    for (const line of this.constellationLineMeshes.children) {
      const mesh = line as THREE.Mesh;
      const material = mesh.material as THREE.MeshBasicMaterial;
      if (mesh.userData.season === season) {
        material.opacity = 0.8;
      } else {
        material.opacity = 0.2;
      }
    }

    for (const starMesh of this.starMeshes.values()) {
      const starData = starMesh.userData.starData;
      if (starData.season === season && !starMesh.userData.selected) {
        starMesh.scale.setScalar(1.2);
        starMesh.userData.highlight = true;
      } else if (!starMesh.userData.selected) {
        starMesh.scale.setScalar(1);
        starMesh.userData.highlight = false;
      }
    }

    const angles = seasonAngles[season];
    if (angles) {
      this.animateRotationTo(angles.x, angles.y, 1000);
    }
  }

  private animateRotationTo(targetX: number, targetY: number, duration: number) {
    const startX = this.currentRotation.x;
    const startY = this.currentRotation.y;
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);

      this.targetRotation.x = startX + (targetX - startX) * eased;
      this.targetRotation.y = startY + (targetY - startY) * eased;

      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  public focusOnStar(star: StarData) {
    const starMesh = this.starMeshes.get(star.id);
    if (starMesh) {
      this.selectStar(starMesh);
    }

    const vector = new THREE.Vector3(star.x, star.y, star.z);
    const spherical = new THREE.Spherical();
    spherical.setFromVector3(vector);

    this.animateRotationTo(spherical.phi - Math.PI / 2, spherical.theta, 500);
  }

  public startRoaming() {
    if (this.roamingActive) return;
    this.roamingActive = true;
    this.currentRoamIndex = 0;
    this.animateToNextConstellation();
  }

  public stopRoaming() {
    this.roamingActive = false;
    if (this.roamingInterval) {
      clearTimeout(this.roamingInterval);
      this.roamingInterval = null;
    }
  }

  public toggleRoaming(): boolean {
    if (this.roamingActive) {
      this.stopRoaming();
      return false;
    } else {
      this.startRoaming();
      return true;
    }
  }

  public isRoaming(): boolean {
    return this.roamingActive;
  }

  private animateToNextConstellation() {
    if (!this.roamingActive) return;

    const constellationId = famousConstellationIds[this.currentRoamIndex];
    const constellation = getConstellationById(constellationId);

    if (constellation && constellation.stars.length > 0) {
      const centerStar = constellation.stars[0];
      const vector = new THREE.Vector3(centerStar.x, centerStar.y, centerStar.z);
      const spherical = new THREE.Spherical();
      spherical.setFromVector3(vector);

      this.highlightConstellation(constellationId, true);

      this.animateRotationTo(spherical.phi - Math.PI / 2, spherical.theta, 500);

      this.roamingInterval = window.setTimeout(() => {
        this.highlightConstellation(constellationId, false);
        this.currentRoamIndex = (this.currentRoamIndex + 1) % famousConstellationIds.length;
        this.animateToNextConstellation();
      }, 3000);
    } else {
      this.currentRoamIndex = (this.currentRoamIndex + 1) % famousConstellationIds.length;
      this.animateToNextConstellation();
    }
  }

  private highlightConstellation(constellationId: string, highlight: boolean) {
    const constellation = getConstellationById(constellationId);
    if (!constellation) return;

    for (const star of constellation.stars) {
      const starMesh = this.starMeshes.get(star.id);
      if (starMesh && !starMesh.userData.selected) {
        starMesh.scale.setScalar(highlight ? 1.3 : 1);
        starMesh.userData.highlight = highlight;
      }
    }

    for (const line of this.constellationLineMeshes.children) {
      const mesh = line as THREE.Mesh;
      const material = mesh.material as THREE.MeshBasicMaterial;
      if (mesh.userData.constellationId === constellationId) {
        material.opacity = highlight ? 1.0 : 0.3;
      }
    }
  }

  public setShowConnections(show: boolean) {
    this.constellationLineMeshes.visible = show;
  }

  public resetView() {
    this.targetRotation = { x: 0.2, y: 0.5 };
    this.zoomLevel = 1;
    this.camera.position.z = 120;
    this.deselectStar();
  }

  private updateBackgroundStars(delta: number) {
    this.backgroundStars.rotation.y += delta * 0.005;
  }

  private updateRotation(delta: number) {
    if (!this.isDragging) {
      this.rotationVelocity.x *= 0.95;
      this.rotationVelocity.y *= 0.95;
      this.targetRotation.x += this.rotationVelocity.x;
      this.targetRotation.y += this.rotationVelocity.y;
    }

    this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.1;
    this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.1;

    this.starGroup.rotation.x = this.currentRotation.x;
    this.starGroup.rotation.y = this.currentRotation.y;
    this.constellationLineMeshes.rotation.x = this.currentRotation.x;
    this.constellationLineMeshes.rotation.y = this.currentRotation.y;
  }

  private updateSelectedStar(delta: number) {
    if (this.selectedStarMesh && this.pulseRing) {
      this.selectedStarMesh.userData.pulsePhase += delta * Math.PI * 2;
      const pulse = Math.sin(this.selectedStarMesh.userData.pulsePhase) * 0.5 + 0.5;
      
      const material = this.pulseRing.material as THREE.MeshBasicMaterial;
      material.opacity = 0.4 + pulse * 0.4;
      
      const scale = 1 + pulse * 0.15;
      this.pulseRing.scale.setScalar(scale);

      this.pulseRing.position.copy(this.selectedStarMesh.position);
      this.pulseRing.lookAt(this.camera.position);
    }
  }

  public animate() {
    const delta = this.clock.getDelta();

    this.updateBackgroundStars(delta);
    this.updateRotation(delta);
    this.updateSelectedStar(delta);

    this.renderer.render(this.scene, this.camera);
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  public start() {
    this.animate();
  }

  public stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.stopRoaming();
  }

  public dispose() {
    this.stop();
    window.removeEventListener('resize', this.onResize.bind(this));
    this.container.removeChild(this.renderer.domElement);
    this.renderer.dispose();
  }
}
