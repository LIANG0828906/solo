import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface Particle {
  mesh: THREE.Mesh;
  lifetime: number;
  maxLifetime: number;
}

export class InnScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private clock: THREE.Clock;
  private innkeeper: THREE.Group;
  private innkeeperArm: THREE.Group;
  private wineJars: THREE.Mesh[];
  private particles: Particle[];
  onAnimate: (() => void) | null;
  private nobleGuest: THREE.Group | null;
  private mouseIcon: THREE.Mesh | null;
  private animationId: number;

  constructor(container: HTMLElement) {
    this.container = container;
    this.onAnimate = null;
    this.nobleGuest = null;
    this.mouseIcon = null;
    this.animationId = 0;
    this.wineJars = [];
    this.particles = [];

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1A1A2E);

    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    this.camera.position.set(8, 8, 8);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enableZoom = true;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 15;
    this.controls.enableRotate = true;
    this.controls.enablePan = false;

    const pointLight = new THREE.PointLight(0xFFD700, 1.2);
    pointLight.position.set(0, 5, 0);
    this.scene.add(pointLight);

    const ambientLight = new THREE.AmbientLight(0xFFE4B5, 0.3);
    this.scene.add(ambientLight);

    this.clock = new THREE.Clock();

    this.createFloor();
    this.createWalls();
    this.createBarCounter();
    this.createTablesAndChairs();
    this.createWineRack();
    this.innkeeper = this.createInnkeeper();

    this.animate();
  }

  private createFloor() {
    const geo = new THREE.PlaneGeometry(10, 10);
    const mat = new THREE.MeshStandardMaterial({ color: 0x654321 });
    const floor = new THREE.Mesh(geo, mat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 0);
    this.scene.add(floor);
  }

  private createWalls() {
    const wallGeo = new THREE.PlaneGeometry(10, 4);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x4A3728 });

    const backWall1 = new THREE.Mesh(wallGeo, wallMat);
    backWall1.position.set(0, 2, -5);
    this.scene.add(backWall1);

    const backWall2 = new THREE.Mesh(wallGeo, wallMat);
    backWall2.position.set(-5, 2, 0);
    backWall2.rotation.y = Math.PI / 2;
    this.scene.add(backWall2);
  }

  private createBarCounter() {
    const counterGeo = new THREE.BoxGeometry(4, 0.8, 1.2);
    const counterMat = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      metalness: 0.3,
      roughness: 0.4
    });
    const counter = new THREE.Mesh(counterGeo, counterMat);
    counter.position.set(0, 0.4, -1.5);
    this.scene.add(counter);

    const surfaceGeo = new THREE.BoxGeometry(4.1, 0.05, 1.3);
    const surfaceMat = new THREE.MeshStandardMaterial({
      color: 0xA0522D,
      metalness: 0.5,
      roughness: 0.3
    });
    const surface = new THREE.Mesh(surfaceGeo, surfaceMat);
    surface.position.set(0, 0.825, -1.5);
    this.scene.add(surface);
  }

  private createTablesAndChairs() {
    const tablePositions = [
      new THREE.Vector3(-2, 0, 1.5),
      new THREE.Vector3(2, 0, 1.5),
      new THREE.Vector3(-2, 0, 3.5),
      new THREE.Vector3(2, 0, 3.5)
    ];

    for (const pos of tablePositions) {
      this.createTableWithChairs(pos);
    }
  }

  private createTableWithChairs(pos: THREE.Vector3) {
    const tableGroup = new THREE.Group();

    const topGeo = new THREE.BoxGeometry(1.2, 0.08, 1.2);
    const topMat = new THREE.MeshStandardMaterial({ color: 0xD2691E });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = 0.7;
    tableGroup.add(top);

    const clothGeo = new THREE.BoxGeometry(1.3, 0.3, 1.3);
    const clothMat = new THREE.MeshStandardMaterial({ color: 0x800000 });
    const cloth = new THREE.Mesh(clothGeo, clothMat);
    cloth.position.y = 0.51;
    tableGroup.add(cloth);

    const legGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.7);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const legOffsets = [
      new THREE.Vector3(-0.5, 0.35, -0.5),
      new THREE.Vector3(0.5, 0.35, -0.5),
      new THREE.Vector3(-0.5, 0.35, 0.5),
      new THREE.Vector3(0.5, 0.35, 0.5)
    ];
    for (const offset of legOffsets) {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.copy(offset);
      tableGroup.add(leg);
    }

    const chairPositions = [
      new THREE.Vector3(-0.8, 0, 0),
      new THREE.Vector3(0.8, 0, 0)
    ];
    for (const chairPos of chairPositions) {
      const chair = this.createChair();
      chair.position.copy(chairPos);
      tableGroup.add(chair);
    }

    tableGroup.position.copy(pos);
    this.scene.add(tableGroup);
  }

  private createChair(): THREE.Group {
    const chairGroup = new THREE.Group();
    const chairMat = new THREE.MeshStandardMaterial({ color: 0xD2691E });

    const seatGeo = new THREE.BoxGeometry(0.5, 0.05, 0.5);
    const seat = new THREE.Mesh(seatGeo, chairMat);
    seat.position.y = 0.45;
    chairGroup.add(seat);

    const backGeo = new THREE.BoxGeometry(0.5, 0.5, 0.05);
    const back = new THREE.Mesh(backGeo, chairMat);
    back.position.set(0, 0.7, -0.225);
    chairGroup.add(back);

    return chairGroup;
  }

  private createWineRack() {
    const shelfGeo = new THREE.BoxGeometry(3, 2, 0.5);
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const shelf = new THREE.Mesh(shelfGeo, shelfMat);
    shelf.position.set(0, 1, -3.5);
    this.scene.add(shelf);

    const jarColors = [0xA0522D, 0x8B0000];
    const startX = -1.25;
    const spacing = 0.5;

    for (let i = 0; i < 6; i++) {
      const jarGroup = new THREE.Group();

      const jarGeo = new THREE.SphereGeometry(0.25, 16, 16);
      const jarMat = new THREE.MeshStandardMaterial({ color: jarColors[i % 2] });
      const jar = new THREE.Mesh(jarGeo, jarMat);
      jar.position.y = -0.1;
      jarGroup.add(jar);

      const neckGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.15);
      const neckMat = new THREE.MeshStandardMaterial({ color: jarColors[i % 2] });
      const neck = new THREE.Mesh(neckGeo, neckMat);
      neck.position.y = 0.18;
      jarGroup.add(neck);

      jarGroup.position.set(startX + i * spacing, 1.75, -3.5);

      this.scene.add(jarGroup);
      this.wineJars.push(jar);
    }
  }

  private createInnkeeper(): THREE.Group {
    const group = new THREE.Group();

    const bodyGeo = new THREE.CylinderGeometry(0.3, 0.35, 1.2);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xC0392B });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.6;
    group.add(body);

    const headGeo = new THREE.SphereGeometry(0.2);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xFDEBD0 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.3;
    group.add(head);

    const hatGeo = new THREE.ConeGeometry(0.25, 0.3);
    const hatMat = new THREE.MeshStandardMaterial({ color: 0x2C3E50 });
    const hat = new THREE.Mesh(hatGeo, hatMat);
    hat.position.y = 1.55;
    group.add(hat);

    this.innkeeperArm = new THREE.Group();
    this.innkeeperArm.position.set(0.35, 1.0, 0);

    const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.5);
    const armMat = new THREE.MeshStandardMaterial({ color: 0xC0392B });
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.position.y = -0.25;
    this.innkeeperArm.add(arm);

    group.add(this.innkeeperArm);

    group.position.set(0, 0.6, -2);
    this.scene.add(group);
    return group;
  }

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    this.controls.update();

    if (this.innkeeperArm) {
      this.innkeeperArm.rotation.x = Math.sin(elapsed * Math.PI / 2) * 0.5;
    }

    this.updateParticles(delta);

    if (this.onAnimate) {
      this.onAnimate();
    }

    this.renderer.render(this.scene, this.camera);
  };

  addParticle(position: THREE.Vector3) {
    const geo = new THREE.SphereGeometry(0.03);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: 1
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(position);
    this.scene.add(mesh);

    this.particles.push({
      mesh,
      lifetime: 0,
      maxLifetime: 2
    });
  }

  updateParticles(delta: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.lifetime += delta;
      p.mesh.position.y += 0.5 * delta;

      const progress = p.lifetime / p.maxLifetime;
      const mat = p.mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = 1 - progress;

      if (p.lifetime >= p.maxLifetime) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        mat.dispose();
        this.particles.splice(i, 1);
      }
    }
  }

  getWineJars(): THREE.Mesh[] {
    return this.wineJars;
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  resize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  dispose() {
    cancelAnimationFrame(this.animationId);
    this.controls.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }

  addNobleGuest() {
    const group = new THREE.Group();

    const bodyGeo = new THREE.CylinderGeometry(0.3, 0.35, 1.2);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.6;
    group.add(body);

    const headGeo = new THREE.SphereGeometry(0.2);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xFDEBD0 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.3;
    group.add(head);

    const hatGeo = new THREE.ConeGeometry(0.25, 0.3);
    const hatMat = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
    const hat = new THREE.Mesh(hatGeo, hatMat);
    hat.position.y = 1.55;
    group.add(hat);

    group.position.set(0, 0, -0.5);
    this.scene.add(group);
    this.nobleGuest = group;
  }

  removeNobleGuest() {
    if (this.nobleGuest) {
      this.scene.remove(this.nobleGuest);
      this.nobleGuest = null;
    }
  }

  addMouseIcon() {
    const geo = new THREE.SphereGeometry(0.15);
    const mat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(3, 0.3, 3);
    this.scene.add(mesh);
    this.mouseIcon = mesh;
  }

  removeMouseIcon() {
    if (this.mouseIcon) {
      this.scene.remove(this.mouseIcon);
      this.mouseIcon = null;
    }
  }
}
