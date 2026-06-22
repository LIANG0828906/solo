import * as THREE from 'three';
import { createStele } from './stele';
import { EngravingSystem } from './engraving';
import { ParticleSystem } from './particles';
import { createUI } from './ui';

class App {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private particleSystem!: ParticleSystem;
  private engravingSystem!: EngravingSystem;
  private steleGroup!: THREE.Group;
  private steleSurface!: THREE.Mesh;
  private lightBeam!: THREE.Mesh;
  private mouseScreen = new THREE.Vector2();
  private cursorMesh!: THREE.Mesh;
  private chiselGroup!: THREE.Group;
  private broomGroup!: THREE.Group;
  private rubbingsCanvas!: HTMLCanvasElement;
  private rubbingsCtx!: CanvasRenderingContext2D;

  constructor() {
    const container = document.getElementById('app')!;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.9;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x2A1E10);
    this.scene.fog = new THREE.Fog(0x2A1E10, 8, 20);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 1.6, 3.5);
    this.camera.lookAt(0, 1.0, 0);

    this.setupLights();
    this.setupEnvironment();
    this.setupStele();
    this.setupTools();
    this.setupCursor();
    this.setupRubbings();
    this.setupLightBeam();
    this.setupInteraction();

    window.addEventListener('resize', () => this.onResize());
    this.animate();
  }

  private setupLights(): void {
    const ambient = new THREE.AmbientLight(0x6B5B4A, 0.4);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xFFFACD, 1.2);
    dirLight.position.set(-3, 5, 2);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(1024, 1024);
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 20;
    dirLight.shadow.camera.left = -4;
    dirLight.shadow.camera.right = 4;
    dirLight.shadow.camera.top = 4;
    dirLight.shadow.camera.bottom = -2;
    this.scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x8899AA, 0.3);
    fillLight.position.set(2, 3, -1);
    this.scene.add(fillLight);

    const pointLight = new THREE.PointLight(0xFFE4B5, 0.5, 6);
    pointLight.position.set(0, 2.5, 2);
    this.scene.add(pointLight);
  }

  private setupEnvironment(): void {
    const floorGeo = new THREE.PlaneGeometry(12, 12);
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512;
    floorCanvas.height = 512;
    const fctx = floorCanvas.getContext('2d')!;
    fctx.fillStyle = '#B0A090';
    fctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const b = 160 + Math.random() * 40;
      fctx.fillStyle = `rgb(${b}, ${b - 10}, ${b - 20})`;
      fctx.fillRect(x, y, 2 + Math.random() * 3, 2 + Math.random() * 3);
    }
    for (let x = 0; x < 512; x += 64) {
      for (let y = 0; y < 512; y += 64) {
        fctx.strokeStyle = 'rgba(100, 90, 80, 0.3)';
        fctx.lineWidth = 1;
        fctx.strokeRect(x, y, 64, 64);
      }
    }
    const floorTex = new THREE.CanvasTexture(floorCanvas);
    floorTex.wrapS = THREE.RepeatWrapping;
    floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(3, 3);
    const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.9 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const brickColor = 0x5A6B7D;
    const brickMat = new THREE.MeshStandardMaterial({ color: brickColor, roughness: 0.85 });
    const pillarGeo = new THREE.CylinderGeometry(0.12, 0.14, 3.0, 8);
    const positions = [[-1.8, 1.5, -0.8], [1.8, 1.5, -0.8], [-1.8, 1.5, 0.8], [1.8, 1.5, 0.8]];
    positions.forEach(pos => {
      const pillar = new THREE.Mesh(pillarGeo, brickMat);
      pillar.position.set(pos[0], pos[1], pos[2]);
      pillar.castShadow = true;
      this.scene.add(pillar);
    });

    const roofGeo = new THREE.BoxGeometry(4.4, 0.15, 2.2);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x4A3A2A, roughness: 0.9 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 3.1, 0);
    roof.castShadow = true;
    this.scene.add(roof);

    const roofTopGeo = new THREE.ConeGeometry(0.15, 0.3, 6);
    const roofTop = new THREE.Mesh(roofTopGeo, new THREE.MeshStandardMaterial({ color: 0x8B7355 }));
    roofTop.position.set(0, 3.35, 0);
    this.scene.add(roofTop);

    const backWallGeo = new THREE.PlaneGeometry(4.4, 2.8);
    const backWallCanvas = document.createElement('canvas');
    backWallCanvas.width = 256;
    backWallCanvas.height = 256;
    const bwctx = backWallCanvas.getContext('2d')!;
    bwctx.fillStyle = '#5A6B7D';
    bwctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 24) {
      for (let x = 0; x < 256; x += 48) {
        const offsetX = (Math.floor(y / 24) % 2) * 24;
        bwctx.fillStyle = `rgb(${80 + Math.random() * 20}, ${95 + Math.random() * 20}, ${110 + Math.random() * 20})`;
        bwctx.fillRect(x + offsetX, y, 46, 22);
        bwctx.strokeStyle = 'rgba(60, 70, 80, 0.5)';
        bwctx.strokeRect(x + offsetX, y, 46, 22);
      }
    }
    const backWallTex = new THREE.CanvasTexture(backWallCanvas);
    const backWallMat = new THREE.MeshStandardMaterial({ map: backWallTex, roughness: 0.9 });
    const backWall = new THREE.Mesh(backWallGeo, backWallMat);
    backWall.position.set(0, 1.4, -1.0);
    this.scene.add(backWall);
  }

  private setupStele(): void {
    const {
      group,
      steleSurface,
      displacementCanvas,
      displacementCtx,
      displacementTexture,
      weatherCanvas,
      weatherCtx,
      weatherTexture,
    } = createStele(this.scene);

    this.steleGroup = group;
    this.steleSurface = steleSurface;

    this.particleSystem = new ParticleSystem(this.scene);

    this.rubbingsCanvas = document.createElement('canvas');
    this.rubbingsCanvas.width = 320;
    this.rubbingsCanvas.height = 160;
    this.rubbingsCtx = this.rubbingsCanvas.getContext('2d')!;
    this.rubbingsCtx.fillStyle = '#F5E6C8';
    this.rubbingsCtx.fillRect(0, 0, 320, 160);
    this.rubbingsCtx.fillStyle = 'rgba(139, 115, 85, 0.3)';
    for (let i = 0; i < 200; i++) {
      this.rubbingsCtx.fillRect(Math.random() * 320, Math.random() * 160, 1 + Math.random() * 2, 1);
    }
    this.rubbingsCtx.strokeStyle = 'rgba(139, 115, 85, 0.2)';
    this.rubbingsCtx.lineWidth = 0.5;
    for (let i = 0; i < 8; i++) {
      this.rubbingsCtx.beginPath();
      this.rubbingsCtx.moveTo(0, i * 20 + 10);
      this.rubbingsCtx.lineTo(320, i * 20 + 10);
      this.rubbingsCtx.stroke();
    }

    this.engravingSystem = new EngravingSystem(
      this.camera,
      steleSurface,
      this.particleSystem,
      displacementCanvas,
      displacementCtx,
      displacementTexture,
      weatherCanvas,
      weatherCtx,
      weatherTexture,
      this.rubbingsCanvas,
      this.rubbingsCtx
    );

    createUI(document.body, this.engravingSystem, this.rubbingsCanvas);
  }

  private setupTools(): void {
    this.chiselGroup = new THREE.Group();

    const handleGeo = new THREE.CylinderGeometry(0.02, 0.025, 0.35, 8);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.rotation.z = Math.PI / 6;
    this.chiselGroup.add(handle);

    const headGeo = new THREE.CylinderGeometry(0.015, 0.008, 0.12, 6);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.4, metalness: 0.6 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.rotation.z = Math.PI / 6;
    head.position.set(0.22, 0.1, 0);
    this.chiselGroup.add(head);

    this.chiselGroup.position.set(-1.0, 0.35, 0.5);
    this.chiselGroup.rotation.y = Math.PI / 4;
    this.scene.add(this.chiselGroup);

    this.broomGroup = new THREE.Group();
    const broomHandleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.6, 6);
    const broomHandleMat = new THREE.MeshStandardMaterial({ color: 0xB8860B, roughness: 0.9 });
    const broomHandle = new THREE.Mesh(broomHandleGeo, broomHandleMat);
    broomHandle.rotation.z = Math.PI / 5;
    broomHandle.position.set(0, 0.15, 0);
    this.broomGroup.add(broomHandle);

    const bristleGeo = new THREE.ConeGeometry(0.05, 0.15, 8);
    const bristleMat = new THREE.MeshStandardMaterial({ color: 0xC8A860, roughness: 1.0 });
    const bristle = new THREE.Mesh(bristleGeo, bristleMat);
    bristle.rotation.z = Math.PI / 5;
    bristle.position.set(-0.18, -0.12, 0);
    this.broomGroup.add(bristle);

    this.broomGroup.position.set(-0.8, 0.3, 0.6);
    this.broomGroup.rotation.y = -Math.PI / 6;
    this.scene.add(this.broomGroup);
  }

  private setupCursor(): void {
    const cursorGeo = new THREE.RingGeometry(0.012, 0.015, 32);
    const cursorMat = new THREE.MeshBasicMaterial({
      color: 0xDDDDDD,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      depthTest: false,
    });
    this.cursorMesh = new THREE.Mesh(cursorGeo, cursorMat);
    this.cursorMesh.visible = false;
    this.cursorMesh.renderOrder = 999;
    this.scene.add(this.cursorMesh);
  }

  private setupRubbings(): void {
  }

  private setupLightBeam(): void {
    const beamGeo = new THREE.CylinderGeometry(0.3, 0.8, 4.0, 12, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xFFFACD,
      transparent: true,
      opacity: 0.06,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.lightBeam = new THREE.Mesh(beamGeo, beamMat);
    this.lightBeam.position.set(-1.5, 2.5, 1);
    this.lightBeam.rotation.z = Math.PI / 8;
    this.lightBeam.rotation.x = Math.PI / 12;
    this.scene.add(this.lightBeam);
  }

  private setupInteraction(): void {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    this.renderer.domElement.addEventListener('mousemove', (e) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.mouseScreen.set(e.clientX, e.clientY);

      raycaster.setFromCamera(mouse, this.camera);
      const hits = raycaster.intersectObject(this.steleSurface);

      if (hits.length > 0) {
        const hit = hits[0];
        this.cursorMesh.visible = true;
        this.cursorMesh.position.copy(hit.point);
        this.cursorMesh.position.z += 0.005;
        this.cursorMesh.lookAt(hit.point.clone().add(hit.face!.normal));
        this.renderer.domElement.style.cursor = 'none';
      } else {
        this.cursorMesh.visible = false;
        this.renderer.domElement.style.cursor = 'default';
      }

      const nx = (e.clientX / window.innerWidth - 0.5) * 0.3;
      const ny = (e.clientY / window.innerHeight - 0.5) * 0.2;
      this.lightBeam.rotation.z = Math.PI / 8 + nx;
      this.lightBeam.rotation.x = Math.PI / 12 + ny;
    });

    this.renderer.domElement.addEventListener('click', (e) => {
      this.engravingSystem.engraveAt(e, this.renderer, this.renderer.domElement);
    });

    this.renderer.domElement.addEventListener('mouseleave', () => {
      this.cursorMesh.visible = false;
    });
  }

  private onResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());

    const dt = Math.min(this.clock.getDelta(), 0.05);

    this.particleSystem.updateParticles(dt);
    this.engravingSystem.updateShake(dt, this.steleGroup);

    this.renderer.render(this.scene, this.camera);
  }
}

new App();
