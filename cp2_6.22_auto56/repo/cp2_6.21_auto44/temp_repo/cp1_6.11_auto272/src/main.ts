import * as THREE from 'three';
import { KilnSimulator } from './KilnSimulator';
import { UIManager } from './UIManager';
import { DataExporter } from './DataExporter';

class SancaiKilnApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  private kilnSimulator: KilnSimulator;
  private uiManager: UIManager;
  private dataExporter: DataExporter;

  private figurineGroup: THREE.Group | null = null;
  private figurineMeshes: THREE.Mesh[] = [];
  private isRotating: boolean = false;
  private previousMousePosition: { x: number; y: number } = { x: 0, y: 0 };
  private rotationVelocity: { x: number; y: number } = { x: 0, y: 0 };

  private clock: THREE.Clock;
  private container: HTMLElement;

  constructor() {
    this.container = document.getElementById('canvas-container')!;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xA0522D);
    this.scene.fog = new THREE.Fog(0xA0522D, 500, 1500);

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    this.camera.position.set(0, 150, 500);
    this.camera.lookAt(0, 150, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.container.appendChild(this.renderer.domElement);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.clock = new THREE.Clock();

    this.dataExporter = new DataExporter();
    this.kilnSimulator = new KilnSimulator();
    this.uiManager = new UIManager(this.kilnSimulator, this.dataExporter);

    this.setupLights();
    this.createEnvironment();
    this.createFigurine();
    this.setupKilnTarget();
    this.setupEventListeners();
    this.setupUICallbacks();

    window.addEventListener('resize', () => this.onWindowResize());

    this.animate();
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffd4a3, 0.6);
    this.scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
    mainLight.position.set(200, 400, 200);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 1000;
    mainLight.shadow.camera.left = -300;
    mainLight.shadow.camera.right = 300;
    mainLight.shadow.camera.top = 300;
    mainLight.shadow.camera.bottom = -300;
    this.scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xffa07a, 0.4);
    fillLight.position.set(-200, 200, 100);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffd700, 0.3);
    rimLight.position.set(0, 300, -200);
    this.scene.add(rimLight);

    const pointLight = new THREE.PointLight(0xff4500, 0.5, 500);
    pointLight.position.set(0, 100, 100);
    this.scene.add(pointLight);
  }

  private createEnvironment(): void {
    const floorGeometry = new THREE.PlaneGeometry(2000, 2000);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.9,
      metalness: 0.0
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -50;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const brickTexture = this.createBrickTexture();
    const wallMaterial = new THREE.MeshStandardMaterial({
      map: brickTexture,
      roughness: 0.95,
      side: THREE.BackSide
    });

    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(2000, 800),
      wallMaterial
    );
    backWall.position.set(0, 350, -600);
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(1200, 800),
      wallMaterial
    );
    leftWall.position.set(-600, 350, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);

    const rightWall = new THREE.Mesh(
      new THREE.PlaneGeometry(1200, 800),
      wallMaterial
    );
    rightWall.position.set(600, 350, 0);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    this.scene.add(rightWall);

    const pedestalGeometry = new THREE.CylinderGeometry(100, 120, 30, 32);
    const pedestalMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.8,
      metalness: 0.1
    });
    const pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
    pedestal.position.y = -35;
    pedestal.receiveShadow = true;
    pedestal.castShadow = true;
    this.scene.add(pedestal);

    const topGeometry = new THREE.CylinderGeometry(105, 100, 5, 32);
    const topMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.7,
      metalness: 0.2
    });
    const pedestalTop = new THREE.Mesh(topGeometry, topMaterial);
    pedestalTop.position.y = -20;
    pedestalTop.receiveShadow = true;
    this.scene.add(pedestalTop);
  }

  private createBrickTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#A0522D';
    ctx.fillRect(0, 0, 512, 512);

    const brickHeight = 40;
    const brickWidth = 80;
    const mortarSize = 4;

    for (let row = 0; row < 14; row++) {
      const offset = (row % 2) * (brickWidth / 2);
      for (let col = -1; col < 8; col++) {
        const x = col * (brickWidth + mortarSize) + offset;
        const y = row * (brickHeight + mortarSize);

        const r = 160 + Math.random() * 30 - 15;
        const g = 82 + Math.random() * 20 - 10;
        const b = 45 + Math.random() * 15 - 7;

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x, y, brickWidth, brickHeight);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(x, y + brickHeight - 3, brickWidth, 3);
        ctx.fillRect(x + brickWidth - 3, y, 3, brickHeight);
      }
    }

    ctx.strokeStyle = '#696969';
    ctx.lineWidth = mortarSize;
    for (let row = 0; row <= 14; row++) {
      const y = row * (brickHeight + mortarSize) - mortarSize / 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 2);

    return texture;
  }

  private createFigurine(): void {
    this.figurineGroup = new THREE.Group();
    this.figurineMeshes = [];

    const clayColor = 0xD2B48C;
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: clayColor,
      roughness: 0.95,
      metalness: 0.0
    });

    const baseRimGeometry = new THREE.CylinderGeometry(78, 80, 6, 32);
    const baseRim = new THREE.Mesh(baseRimGeometry, baseMaterial.clone());
    baseRim.position.y = 3;
    baseRim.castShadow = true;
    this.figurineGroup.add(baseRim);
    this.figurineMeshes.push(baseRim);

    const skirtGeometry = new THREE.CylinderGeometry(45, 75, 75, 32);
    const skirt = new THREE.Mesh(skirtGeometry, baseMaterial.clone());
    skirt.position.y = 45;
    skirt.castShadow = true;
    skirt.name = 'figurine-skirt';
    this.figurineGroup.add(skirt);
    this.figurineMeshes.push(skirt);

    const waistGeometry = new THREE.CylinderGeometry(38, 45, 15, 32);
    const waist = new THREE.Mesh(waistGeometry, baseMaterial.clone());
    waist.position.y = 90;
    waist.castShadow = true;
    this.figurineGroup.add(waist);
    this.figurineMeshes.push(waist);

    const bodyGeometry = new THREE.CylinderGeometry(42, 38, 60, 32);
    const body = new THREE.Mesh(bodyGeometry, baseMaterial.clone());
    body.position.y = 130;
    body.castShadow = true;
    body.name = 'figurine-body';
    this.figurineGroup.add(body);
    this.figurineMeshes.push(body);

    const chestGeometry = new THREE.CylinderGeometry(48, 42, 35, 32);
    const chest = new THREE.Mesh(chestGeometry, baseMaterial.clone());
    chest.position.y = 170;
    chest.castShadow = true;
    this.figurineGroup.add(chest);
    this.figurineMeshes.push(chest);

    const neckGeometry = new THREE.CylinderGeometry(15, 18, 18, 24);
    const neck = new THREE.Mesh(neckGeometry, baseMaterial.clone());
    neck.position.y = 195;
    neck.castShadow = true;
    this.figurineGroup.add(neck);
    this.figurineMeshes.push(neck);

    const headGeometry = new THREE.SphereGeometry(35, 32, 32);
    const head = new THREE.Mesh(headGeometry, baseMaterial.clone());
    head.position.y = 235;
    head.castShadow = true;
    head.name = 'figurine-head';
    this.figurineGroup.add(head);
    this.figurineMeshes.push(head);

    const hairBackGeometry = new THREE.SphereGeometry(37, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.7);
    const hairMaterial = new THREE.MeshStandardMaterial({
      color: 0x2C1810,
      roughness: 0.8
    });
    const hairBack = new THREE.Mesh(hairBackGeometry, hairMaterial);
    hairBack.position.y = 235;
    hairBack.rotation.x = -Math.PI * 0.2;
    hairBack.castShadow = true;
    this.figurineGroup.add(hairBack);

    const hairTopGeometry = new THREE.SphereGeometry(34, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const hairTop = new THREE.Mesh(hairTopGeometry, hairMaterial.clone());
    hairTop.position.y = 238;
    hairTop.castShadow = true;
    this.figurineGroup.add(hairTop);

    const bunGeometry = new THREE.SphereGeometry(16, 24, 24);
    const bun = new THREE.Mesh(bunGeometry, hairMaterial.clone());
    bun.position.set(0, 270, -8);
    bun.castShadow = true;
    this.figurineGroup.add(bun);

    const bunRingGeometry = new THREE.TorusGeometry(9, 2.5, 12, 24);
    const bunRingMaterial = new THREE.MeshStandardMaterial({
      color: 0xD4AF37,
      metalness: 0.8,
      roughness: 0.3
    });
    const bunRing = new THREE.Mesh(bunRingGeometry, bunRingMaterial);
    bunRing.position.set(0, 258, -8);
    bunRing.rotation.x = Math.PI / 2;
    this.figurineGroup.add(bunRing);

    const leftSleeveGeometry = new THREE.CylinderGeometry(16, 12, 40, 20);
    const leftSleeve = new THREE.Mesh(leftSleeveGeometry, baseMaterial.clone());
    leftSleeve.position.set(-55, 165, 0);
    leftSleeve.rotation.z = 0.4;
    leftSleeve.castShadow = true;
    this.figurineGroup.add(leftSleeve);
    this.figurineMeshes.push(leftSleeve);

    const rightSleeveGeometry = new THREE.CylinderGeometry(16, 12, 40, 20);
    const rightSleeve = new THREE.Mesh(rightSleeveGeometry, baseMaterial.clone());
    rightSleeve.position.set(55, 165, 0);
    rightSleeve.rotation.z = -0.4;
    rightSleeve.castShadow = true;
    this.figurineGroup.add(rightSleeve);
    this.figurineMeshes.push(rightSleeve);

    const leftArmGeometry = new THREE.CylinderGeometry(9, 11, 65, 16);
    const leftArm = new THREE.Mesh(leftArmGeometry, baseMaterial.clone());
    leftArm.position.set(-60, 120, 0);
    leftArm.rotation.z = 0.25;
    leftArm.castShadow = true;
    leftArm.name = 'figurine-left-arm';
    this.figurineGroup.add(leftArm);
    this.figurineMeshes.push(leftArm);

    const rightArmGeometry = new THREE.CylinderGeometry(9, 11, 65, 16);
    const rightArm = new THREE.Mesh(rightArmGeometry, baseMaterial.clone());
    rightArm.position.set(60, 120, 0);
    rightArm.rotation.z = -0.25;
    rightArm.castShadow = true;
    rightArm.name = 'figurine-right-arm';
    this.figurineGroup.add(rightArm);
    this.figurineMeshes.push(rightArm);

    const leftHandGeometry = new THREE.SphereGeometry(11, 16, 16);
    const leftHand = new THREE.Mesh(leftHandGeometry, baseMaterial.clone());
    leftHand.position.set(-72, 88, 3);
    leftHand.castShadow = true;
    this.figurineGroup.add(leftHand);
    this.figurineMeshes.push(leftHand);

    const rightHandGeometry = new THREE.SphereGeometry(11, 16, 16);
    const rightHand = new THREE.Mesh(rightHandGeometry, baseMaterial.clone());
    rightHand.position.set(72, 88, 3);
    rightHand.castShadow = true;
    this.figurineGroup.add(rightHand);
    this.figurineMeshes.push(rightHand);

    this.figurineGroup.position.y = -20;
    this.figurineGroup.rotation.y = Math.PI;
    this.scene.add(this.figurineGroup);
  }

  private setupKilnTarget(): void {
    const glazeMeshes = this.figurineMeshes.filter(mesh => 
      mesh.material instanceof THREE.MeshStandardMaterial
    );
    this.kilnSimulator.setTargetMeshes(glazeMeshes as THREE.Mesh[]);
  }

  private setupEventListeners(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    canvas.addEventListener('mouseup', () => this.onMouseUp());
    canvas.addEventListener('mouseleave', () => this.onMouseUp());

    canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
    canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
    canvas.addEventListener('touchend', () => this.onTouchEnd());

    canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
  }

  private setupUICallbacks(): void {
    this.uiManager.setPaintCallback((uvX, uvY, radius, color) => {
      this.kilnSimulator.applyGlaze(uvX, uvY, radius, color);
    });

    this.uiManager.setResetCallback(() => {
      this.rotationVelocity = { x: 0, y: 0 };
      if (this.figurineGroup) {
        this.figurineGroup.rotation.y = 0;
      }
    });
  }

  private onMouseDown(event: MouseEvent): void {
    if (event.button === 0) {
      this.updateMousePosition(event);

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.figurineMeshes, false);

      if (intersects.length > 0 && intersects[0].uv) {
        this.uiManager.setIsPainting(true);
        this.paintAtUV(intersects[0].uv.x, intersects[0].uv.y);
      } else {
        this.isRotating = true;
      }

      this.previousMousePosition = { x: event.clientX, y: event.clientY };
    }
  }

  private onMouseMove(event: MouseEvent): void {
    if (this.uiManager.getIsPainting()) {
      this.updateMousePosition(event);
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.figurineMeshes, false);

      if (intersects.length > 0 && intersects[0].uv) {
        this.paintAtUV(intersects[0].uv.x, intersects[0].uv.y);
      }
    } else if (this.isRotating) {
      const deltaX = event.clientX - this.previousMousePosition.x;

      if (this.figurineGroup) {
        this.figurineGroup.rotation.y += deltaX * 0.01;
      }

      this.rotationVelocity = {
        x: 0,
        y: deltaX * 0.01
      };

      this.previousMousePosition = { x: event.clientX, y: event.clientY };
    }
  }

  private onMouseUp(): void {
    this.uiManager.setIsPainting(false);
    this.isRotating = false;
  }

  private onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0
      });
      this.onMouseDown(mouseEvent);
    }
  }

  private onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.onMouseMove(mouseEvent);
    }
  }

  private onTouchEnd(): void {
    this.onMouseUp();
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault();
    const zoomSpeed = 0.001;
    const delta = event.deltaY * zoomSpeed;

    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);

    const maxDistance = 1000;
    const minDistance = 200;
    const currentDistance = this.camera.position.length();

    if ((delta > 0 && currentDistance < maxDistance) || (delta < 0 && currentDistance > minDistance)) {
      this.camera.position.addScaledVector(direction, -delta * currentDistance);
    }
  }

  private updateMousePosition(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private paintAtUV(uvX: number, uvY: number): void {
    const color = this.uiManager.getSelectedGlaze();
    const brushSize = this.uiManager.getBrushSize();
    this.kilnSimulator.applyGlaze(uvX, uvY, brushSize, color);
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());

    const deltaTime = Math.min(this.clock.getDelta(), 0.1);

    if (!this.isRotating && !this.uiManager.getIsPainting() && this.figurineGroup) {
      this.figurineGroup.rotation.y += this.rotationVelocity.y;
      this.rotationVelocity.y *= 0.95;

      if (Math.abs(this.rotationVelocity.y) < 0.001) {
        this.rotationVelocity.y = 0;
      }
    }

    this.kilnSimulator.update(deltaTime);
    this.uiManager.update(deltaTime);

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new SancaiKilnApp();
});
