import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  CompassLogic,
  TWENTY_FOUR_MOUNTAINS,
  EIGHT_TRIGRAMS,
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  LAYER_CONFIGS,
  DirectionInfo,
  FlowDirection,
} from './compassLogic';

interface TextSprite {
  sprite: THREE.Sprite;
  name: string;
  baseAngle: number;
  baseRadius: number;
  baseY: number;
}

class CompassApp {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private clock!: THREE.Clock;
  private compassLogic!: CompassLogic;

  private compassGroup!: THREE.Group;
  private textSprites: TextSprite[] = [];
  private particlesMesh!: THREE.Points;
  private particlesGeometry!: THREE.BufferGeometry;
  private starField!: THREE.Points;
  private groundGrid!: THREE.Group;

  private raycaster!: THREE.Raycaster;
  private mouse!: THREE.Vector2;
  private container!: HTMLElement;
  private infoBubble!: HTMLElement;
  private bubbleVisible: boolean = false;

  private DEFAULT_CAM_POS = new THREE.Vector3(0, 10, 15);

  constructor() {
    this.compassLogic = new CompassLogic();
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    const container = document.getElementById('canvas-container');
    if (!container) throw new Error('Container not found');
    this.container = container;

    this.infoBubble = document.getElementById('info-bubble')!;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x2C1A0E);
    this.scene.fog = new THREE.FogExp2(0x2C1A0E, 0.015);

    const rect = container.getBoundingClientRect();
    this.camera = new THREE.PerspectiveCamera(
      60,
      rect.width / rect.height,
      0.1,
      200
    );
    this.camera.position.copy(this.DEFAULT_CAM_POS);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(rect.width, rect.height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 60;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
    this.controls.target.set(0, 2, 0);

    this.compassGroup = new THREE.Group();
    this.compassGroup.position.y = 2;
    this.scene.add(this.compassGroup);

    this.createLights();
    this.createCompassLayers();
    this.createTextSprites();
    this.createTianchiCenter();
    this.createParticles();
    this.createStars();
    this.createGroundGrid();

    this.particlesGeometry = this.particlesMesh.geometry as THREE.BufferGeometry;

    this.setupEventListeners();

    window.addEventListener('resize', this.onResize.bind(this));
    this.animate();
  }

  private createLights(): void {
    const ambient = new THREE.AmbientLight(0xFFFFFF, 0.55);
    this.scene.add(ambient);

    const topLight = new THREE.DirectionalLight(0xFFF5E1, 0.8);
    topLight.position.set(8, 20, 8);
    topLight.castShadow = true;
    topLight.shadow.mapSize.width = 1024;
    topLight.shadow.mapSize.height = 1024;
    topLight.shadow.camera.near = 0.5;
    topLight.shadow.camera.far = 60;
    topLight.shadow.camera.left = -20;
    topLight.shadow.camera.right = 20;
    topLight.shadow.camera.top = 20;
    topLight.shadow.camera.bottom = -20;
    this.scene.add(topLight);

    const rimLight = new THREE.PointLight(0xD4A574, 0.6, 50);
    rimLight.position.set(-10, 8, -10);
    this.scene.add(rimLight);

    const fillLight = new THREE.PointLight(0x87CEEB, 0.3, 40);
    fillLight.position.set(10, 4, -8);
    this.scene.add(fillLight);
  }

  private createCompassLayers(): void {
    const thickness = 0.3;

    for (let i = 0; i < LAYER_CONFIGS.length; i++) {
      const cfg = LAYER_CONFIGS[i];
      const geo = new THREE.CylinderGeometry(
        cfg.outerRadius,
        cfg.outerRadius,
        thickness,
        128,
        1,
        false
      );
      const mat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        roughness: 0.75,
        metalness: i >= 3 ? 0.35 : 0.1,
      });
      const outerRing = new THREE.Mesh(geo, mat);
      outerRing.position.y = cfg.y + thickness / 2;
      outerRing.receiveShadow = true;
      outerRing.castShadow = true;
      this.compassGroup.add(outerRing);

      if (cfg.innerRadius > 0) {
        const innerGeo = new THREE.CylinderGeometry(
          cfg.innerRadius,
          cfg.innerRadius,
          thickness + 0.02,
          128,
          1,
          false
        );
        const innerMat = new THREE.MeshStandardMaterial({
          color: cfg.color,
          roughness: 0.75,
          metalness: i >= 3 ? 0.35 : 0.1,
        });
        const innerRing = new THREE.Mesh(innerGeo, innerMat);
        innerRing.position.y = cfg.y + thickness / 2;
        this.compassGroup.add(innerRing);

        const ringGeo = new THREE.RingGeometry(
          cfg.innerRadius - 0.02,
          cfg.innerRadius + 0.02,
          64
        );
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x1A1A1A,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.5,
        });
        const innerBorder = new THREE.Mesh(ringGeo, ringMat);
        innerBorder.rotation.x = -Math.PI / 2;
        innerBorder.position.y = cfg.y + thickness + 0.005;
        this.compassGroup.add(innerBorder);
      }

      const topGeo = new THREE.RingGeometry(
        cfg.innerRadius,
        cfg.outerRadius,
        128
      );
      const topMat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        roughness: 0.7,
        metalness: i >= 3 ? 0.3 : 0.08,
        side: THREE.DoubleSide,
      });
      const top = new THREE.Mesh(topGeo, topMat);
      top.rotation.x = -Math.PI / 2;
      top.position.y = cfg.y + thickness;
      top.receiveShadow = true;
      this.compassGroup.add(top);

      const outerBorderGeo = new THREE.RingGeometry(
        cfg.outerRadius - 0.02,
        cfg.outerRadius + 0.02,
        64
      );
      const outerBorder = new THREE.Mesh(outerBorderGeo, new THREE.MeshBasicMaterial({
        color: 0x1A1A1A,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      }));
      outerBorder.rotation.x = -Math.PI / 2;
      outerBorder.position.y = cfg.y + thickness + 0.006;
      this.compassGroup.add(outerBorder);
    }
  }

  private createTextCanvasTexture(text: string, highlight: boolean = false): THREE.Texture {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, size, size);

    if (highlight) {
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 20;
    }

    ctx.font = 'bold 72px "Ma Shan Zheng", "STKaiti", "KaiTi", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = highlight ? '#FFD700' : '#1A1A1A';
    ctx.fillText(text, size / 2, size / 2 + 4);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
  }

  private createTextSprite(dir: DirectionInfo, yOffset: number): TextSprite {
    const texture = this.createTextCanvasTexture(dir.name);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.5, 0.5, 0.5);
    sprite.userData = { name: dir.name, isText: true };

    const x = Math.cos(dir.angle) * dir.radius;
    const z = Math.sin(dir.angle) * dir.radius;
    sprite.position.set(x, 2 + yOffset + 0.2, z);

    this.scene.add(sprite);

    return {
      sprite,
      name: dir.name,
      baseAngle: dir.angle,
      baseRadius: dir.radius,
      baseY: 2 + yOffset + 0.2,
    };
  }

  private createTextSprites(): void {
    const thickness = 0.3;
    const layerY = LAYER_CONFIGS.map(c => c.y + thickness);

    for (const dir of EIGHT_TRIGRAMS) {
      this.textSprites.push(this.createTextSprite(dir, layerY[1]));
    }

    for (const dir of HEAVENLY_STEMS) {
      this.textSprites.push(this.createTextSprite(dir, layerY[2]));
    }

    for (const dir of TWENTY_FOUR_MOUNTAINS) {
      this.textSprites.push(this.createTextSprite(dir, layerY[3]));
    }

    for (const dir of EARTHLY_BRANCHES) {
      this.textSprites.push(this.createTextSprite(dir, layerY[4]));
    }
  }

  private createTianchiCenter(): void {
    const poolGeo = new THREE.CircleGeometry(0.9, 64);
    const poolMat = new THREE.MeshStandardMaterial({
      color: 0x1A2A3A,
      roughness: 0.2,
      metalness: 0.5,
    });
    const pool = new THREE.Mesh(poolGeo, poolMat);
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = 0.31;
    this.compassGroup.add(pool);

    const needleGroup = new THREE.Group();
    needleGroup.position.y = 0.38;
    needleGroup.name = 'needleGroup';

    const needleShape = new THREE.Shape();
    needleShape.moveTo(0, -0.06);
    needleShape.lineTo(0.55, 0);
    needleShape.lineTo(0, 0.06);
    needleShape.lineTo(-0.55, 0);
    needleShape.closePath();

    const northHalf = new THREE.Shape();
    northHalf.moveTo(0, -0.06);
    northHalf.lineTo(0.55, 0);
    northHalf.lineTo(0, 0.06);
    northHalf.lineTo(0, 0);
    northHalf.closePath();

    const southHalf = new THREE.Shape();
    southHalf.moveTo(0, -0.06);
    southHalf.lineTo(0, 0);
    southHalf.lineTo(0, 0.06);
    southHalf.lineTo(-0.55, 0);
    southHalf.closePath();

    const northGeo = new THREE.ShapeGeometry(northHalf);
    const northMat = new THREE.MeshStandardMaterial({
      color: 0xCC3333,
      roughness: 0.3,
      metalness: 0.7,
    });
    const north = new THREE.Mesh(northGeo, northMat);
    north.rotation.x = -Math.PI / 2;
    needleGroup.add(north);

    const southGeo = new THREE.ShapeGeometry(southHalf);
    const southMat = new THREE.MeshStandardMaterial({
      color: 0xC0C0C0,
      roughness: 0.3,
      metalness: 0.8,
    });
    const south = new THREE.Mesh(southGeo, southMat);
    south.rotation.x = -Math.PI / 2;
    needleGroup.add(south);

    const capGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.04, 16);
    const capMat = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      roughness: 0.2,
      metalness: 0.9,
    });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 0.025;
    needleGroup.add(cap);

    this.compassGroup.add(needleGroup);
  }

  private createParticles(): void {
    const maxParticles = 800;
    const positions = new Float32Array(maxParticles * 3);
    const colors = new Float32Array(maxParticles * 3);
    const sizes = new Float32Array(maxParticles);

    for (let i = 0; i < maxParticles; i++) {
      const p = this.compassLogic.particles[i] || {
        angle: Math.random() * Math.PI * 2,
        radius: Math.random() * 12,
        height: 0,
      };
      positions[i * 3] = Math.cos(p.angle) * p.radius;
      positions[i * 3 + 1] = 2 + (p.height || 0);
      positions[i * 3 + 2] = Math.sin(p.angle) * p.radius;

      const t = (p.radius || 0) / 12;
      const r = 0.53 + (0.2 - 0.53) * t;
      const g = 0.81 + (0.8 - 0.81) * t;
      const b = 0.92 + (0.2 - 0.92) * t;
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;

      sizes[i] = 0.05 + Math.random() * 0.1;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = 64;
    spriteCanvas.height = 64;
    const sctx = spriteCanvas.getContext('2d')!;
    const grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.2, 'rgba(200,255,255,0.9)');
    grad.addColorStop(0.5, 'rgba(135,206,235,0.5)');
    grad.addColorStop(1, 'rgba(50,205,50,0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 64, 64);
    const particleTexture = new THREE.CanvasTexture(spriteCanvas);

    const mat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      map: particleTexture,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    this.particlesMesh = new THREE.Points(geo, mat);
    this.scene.add(this.particlesMesh);
  }

  private createStars(): void {
    const starCount = 28;
    const positions = new Float32Array(starCount * 3);
    const phases = new Float32Array(starCount);
    const periods = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 40;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) * 0.7 + 10;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      phases[i] = Math.random() * Math.PI * 2;
      periods[i] = 2 + Math.random() * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geo.setAttribute('aPeriod', new THREE.BufferAttribute(periods, 1));

    const starCanvas = document.createElement('canvas');
    starCanvas.width = 32;
    starCanvas.height = 32;
    const sctx = starCanvas.getContext('2d')!;
    const sgrad = sctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    sgrad.addColorStop(0, 'rgba(255,255,255,1)');
    sgrad.addColorStop(0.3, 'rgba(255,255,255,0.8)');
    sgrad.addColorStop(1, 'rgba(255,255,255,0)');
    sctx.fillStyle = sgrad;
    sctx.fillRect(0, 0, 32, 32);
    const starTex = new THREE.CanvasTexture(starCanvas);

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMap: { value: starTex },
      },
      vertexShader: `
        attribute float aPhase;
        attribute float aPeriod;
        uniform float uTime;
        varying float vTwinkle;
        void main() {
          vTwinkle = 0.5 + 0.5 * sin(uTime * 6.28 / aPeriod + aPhase);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = (0.1 + vTwinkle * 0.08) * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;
        varying float vTwinkle;
        void main() {
          vec4 tex = texture2D(uMap, gl_PointCoord);
          float alpha = tex.a * (0.4 + vTwinkle * 0.6);
          gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.starField = new THREE.Points(geo, mat);
    this.scene.add(this.starField);
  }

  private createGroundGrid(): void {
    this.groundGrid = new THREE.Group();

    const diskGeo = new THREE.RingGeometry(1, 20, 64);
    const diskMat = new THREE.MeshBasicMaterial({
      color: 0x4E342E,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    const disk = new THREE.Mesh(diskGeo, diskMat);
    disk.rotation.x = -Math.PI / 2;
    disk.position.y = 0;
    this.groundGrid.add(disk);

    const gridGroup = new THREE.Group();
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x4E342E,
      transparent: true,
      opacity: 0.3,
    });

    for (let r = 2; r <= 20; r += 2) {
      const seg = 64;
      const pts = [];
      for (let i = 0; i <= seg; i++) {
        const a = (i / seg) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, 0.01, Math.sin(a) * r));
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      gridGroup.add(new THREE.Line(lineGeo, lineMat));
    }

    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      const pts = [
        new THREE.Vector3(Math.cos(a) * 2, 0.01, Math.sin(a) * 2),
        new THREE.Vector3(Math.cos(a) * 20, 0.01, Math.sin(a) * 20),
      ];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      gridGroup.add(new THREE.Line(lineGeo, lineMat));
    }

    this.groundGrid.add(gridGroup);
    this.scene.add(this.groundGrid);
  }

  private setupEventListeners(): void {
    const timeSlider = document.getElementById('time-speed') as HTMLInputElement;
    const timeValue = document.getElementById('time-value')!;
    timeSlider.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      this.compassLogic.setTimeSpeed(val);
      timeValue.textContent = val.toFixed(1) + 'x';
    });

    const qiSlider = document.getElementById('qi-strength') as HTMLInputElement;
    const qiValue = document.getElementById('qi-value')!;
    qiSlider.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      this.compassLogic.setQiStrength(val);
      qiValue.textContent = val + '%';
    });

    const particleSlider = document.getElementById('particle-density') as HTMLInputElement;
    const particleValue = document.getElementById('particle-value')!;
    particleSlider.addEventListener('input', (e) => {
      const val = parseInt((e.target as HTMLInputElement).value);
      this.compassLogic.setParticleCount(val);
      particleValue.textContent = val.toString();
      this.rebuildParticles();
    });

    const flowBtns = document.querySelectorAll('.flow-btn');
    flowBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        flowBtns.forEach((b) => b.classList.remove('active'));
        const target = e.target as HTMLElement;
        target.classList.add('active');
        const flow = target.dataset.flow as FlowDirection;
        this.compassLogic.setFlowDirection(flow);
      });
    });

    document.getElementById('reset-view')!.addEventListener('click', () => {
      this.camera.position.copy(this.DEFAULT_CAM_POS);
      this.controls.target.set(0, 2, 0);
      this.controls.update();
    });

    document.getElementById('export-screenshot')!.addEventListener('click', () => {
      this.exportScreenshot();
    });

    this.renderer.domElement.addEventListener('pointerdown', this.onCanvasClick.bind(this));

    document.addEventListener('pointerdown', (e) => {
      const bubble = document.getElementById('info-bubble')!;
      const sceneContainer = document.getElementById('scene-container')!;
      if (!bubble.contains(e.target as Node) && !this.renderer.domElement.contains(e.target as Node)) {
        this.hideBubble();
      } else if (sceneContainer.contains(e.target as Node) && !bubble.contains(e.target as Node)) {
        this.hideBubble();
      }
    });
  }

  private rebuildParticles(): void {
    const pos = this.particlesGeometry.getAttribute('position') as THREE.BufferAttribute;
    const col = this.particlesGeometry.getAttribute('color') as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    const carr = col.array as Float32Array;

    for (let i = 0; i < this.compassLogic.particles.length; i++) {
      const p = this.compassLogic.particles[i];
      arr[i * 3] = Math.cos(p.angle) * p.radius;
      arr[i * 3 + 1] = 2 + p.height;
      arr[i * 3 + 2] = Math.sin(p.angle) * p.radius;

      const t = p.radius / 12;
      carr[i * 3] = 0.53 + (0.2 - 0.53) * t;
      carr[i * 3 + 1] = 0.81 + (0.8 - 0.81) * t;
      carr[i * 3 + 2] = 0.92 + (0.2 - 0.92) * t;
    }

    for (let i = this.compassLogic.particles.length; i < 800; i++) {
      arr[i * 3 + 1] = -9999;
    }

    pos.needsUpdate = true;
    col.needsUpdate = true;
    this.particlesGeometry.setDrawRange(0, this.compassLogic.particles.length);
  }

  private onCanvasClick(event: PointerEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const sprites = this.textSprites.map((ts) => ts.sprite);
    const intersects = this.raycaster.intersectObjects(sprites, false);

    if (intersects.length > 0) {
      const obj = intersects[0].object as THREE.Sprite;
      const name = obj.userData.name as string;
      if (name) {
        this.compassLogic.highlightName(name);
        this.updateTextHighlight();
        this.showInfoBubble(name);
      }
    }
  }

  private updateTextHighlight(): void {
    const intensity = this.compassLogic.getHighlightIntensity();
    const hl = this.compassLogic.highlightedName;

    for (const ts of this.textSprites) {
      const mat = ts.sprite.material as THREE.SpriteMaterial;
      if (hl && ts.name === hl && intensity > 0) {
        if (!(mat as any)._highlighted) {
          const newTex = this.createTextCanvasTexture(ts.name, true);
          if (mat.map) mat.map.dispose();
          mat.map = newTex;
          (mat as any)._highlighted = true;
        }
      } else {
        if ((mat as any)._highlighted) {
          const newTex = this.createTextCanvasTexture(ts.name, false);
          if (mat.map) mat.map.dispose();
          mat.map = newTex;
          (mat as any)._highlighted = false;
        }
      }
    }
  }

  private showInfoBubble(name: string): void {
    const info = this.compassLogic.getDirectionInfo(name);
    if (!info) return;

    const title = document.getElementById('bubble-title')!;
    const trigram = document.getElementById('bubble-trigram')!;
    const element = document.getElementById('bubble-element')!;

    title.textContent = info.direction || name + '位';
    trigram.textContent = info.trigram || (info.ganzhi ? '干支：' + info.ganzhi : '—');
    element.textContent = info.element || '—';

    this.infoBubble.classList.add('visible');
    this.bubbleVisible = true;
  }

  private hideBubble(): void {
    if (this.bubbleVisible) {
      this.infoBubble.classList.remove('visible');
      this.bubbleVisible = false;
    }
  }

  private exportScreenshot(): void {
    this.renderer.render(this.scene, this.camera);
    const dataURL = this.renderer.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `compass_${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  }

  private onResize(): void {
    const rect = this.container.getBoundingClientRect();
    this.camera.aspect = rect.width / rect.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(rect.width, rect.height);
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.elapsedTime;

    this.compassLogic.updateParticles(delta);
    this.compassLogic.updateHighlight(delta);
    this.updateTextHighlight();

    this.compassGroup.rotation.y = this.compassLogic.compassRotation;

    for (const ts of this.textSprites) {
      const totalAngle = ts.baseAngle + this.compassLogic.compassRotation;
      const x = Math.cos(totalAngle) * ts.baseRadius;
      const z = Math.sin(totalAngle) * ts.baseRadius;
      ts.sprite.position.set(x, ts.baseY, z);
    }

    const pos = this.particlesGeometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < this.compassLogic.particles.length; i++) {
      const p = this.compassLogic.particles[i];
      arr[i * 3] = Math.cos(p.angle) * p.radius;
      arr[i * 3 + 1] = 2 + p.height;
      arr[i * 3 + 2] = Math.sin(p.angle) * p.radius;
    }
    pos.needsUpdate = true;

    const starMat = this.starField.material as THREE.ShaderMaterial;
    if (starMat.uniforms) {
      starMat.uniforms.uTime.value = elapsed;
    }

    const needle = this.compassGroup.getObjectByName('needleGroup');
    if (needle) {
      needle.rotation.z = Math.sin(elapsed * 0.7) * 0.02;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };
}

window.addEventListener('DOMContentLoaded', () => {
  new CompassApp();
});
