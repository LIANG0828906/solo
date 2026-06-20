import * as THREE from 'three';
import { WeatherManager, WeatherType } from './WeatherParticles';

export type ThemeType = 'forest' | 'desert' | 'snow';
export type CharacterColor = 'red' | 'blue' | 'green';

interface ThemeColors {
  bg: number;
  groundColor1: number;
  groundColor2: number;
  fog: number;
  ambient: number;
}

const THEME_COLORS: Record<ThemeType, ThemeColors> = {
  forest: {
    bg: 0x1a2e1a,
    groundColor1: 0x4a7c59,
    groundColor2: 0x2d5a3d,
    fog: 0x1a2e1a,
    ambient: 0xffffff
  },
  desert: {
    bg: 0x3d2e1f,
    groundColor1: 0xd4a574,
    groundColor2: 0xb8956a,
    fog: 0x3d2e1f,
    ambient: 0xfff4e6
  },
  snow: {
    bg: 0x1e2a38,
    groundColor1: 0xe8f0f5,
    groundColor2: 0xc8d8e8,
    fog: 0x1e2a38,
    ambient: 0xeaf4ff
  }
};

const CHARACTER_COLORS: Record<CharacterColor, number> = {
  red: 0xe74c3c,
  blue: 0x3498db,
  green: 0x27ae60
};

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  private weatherManager: WeatherManager;
  private fog: THREE.FogExp2;

  private ground: THREE.Mesh | null = null;
  private decorations: THREE.Group;
  private character: THREE.Group | null = null;
  private characterBodyMaterial: THREE.MeshStandardMaterial | null = null;

  private currentTheme: ThemeType = 'forest';
  private targetThemeColors: ThemeColors = THEME_COLORS.forest;
  private transitionProgress = 1;
  private transitionDuration = 2;
  private isTransitioning = false;
  private prevThemeColors: ThemeColors = THEME_COLORS.forest;

  private clock: THREE.Clock;
  private animationId: number | null = null;
  private frameCount = 0;
  private lastFpsUpdate = 0;
  private fps = 60;
  private onFpsUpdate?: (fps: number) => void;

  private container: HTMLElement | null = null;

  constructor() {
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();

    this.camera = new THREE.PerspectiveCamera(
      45,
      1,
      0.1,
      1000
    );
    this.camera.position.set(0, 18, 22);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.ambientLight = new THREE.AmbientLight(THEME_COLORS.forest.ambient, 0.6);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.directionalLight.position.set(10, 20, 10);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 1024;
    this.directionalLight.shadow.mapSize.height = 1024;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 60;
    this.directionalLight.shadow.camera.left = -20;
    this.directionalLight.shadow.camera.right = 20;
    this.directionalLight.shadow.camera.top = 20;
    this.directionalLight.shadow.camera.bottom = -20;
    this.scene.add(this.directionalLight);

    this.fog = new THREE.FogExp2(THEME_COLORS.forest.fog, 0.015);
    this.scene.fog = this.fog;

    this.weatherManager = new WeatherManager(this.scene, this.ambientLight, this.fog as unknown as THREE.Fog);

    this.decorations = new THREE.Group();
    this.scene.add(this.decorations);

    this.createGround();
    this.createCharacter();
    this.createDecorations('forest');
    this.applyThemeColors(THEME_COLORS.forest);
  }

  private createGround(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, '#4a7c59');
    gradient.addColorStop(1, '#2d5a3d');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      ctx.fillStyle = `rgba(${Math.random() > 0.5 ? '100,180,100' : '60,120,70'},${Math.random() * 0.4})`;
      ctx.fillRect(x, y, 2, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    const geometry = new THREE.CircleGeometry(10, 64);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.9,
      metalness: 0
    });

    this.ground = new THREE.Mesh(geometry, material);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    const ringGeometry = new THREE.RingGeometry(10, 10.5, 64);
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    ring.receiveShadow = true;
    this.scene.add(ring);
  }

  private updateGroundTexture(colors: ThemeColors): void {
    if (!this.ground) return;
    const material = this.ground.material as THREE.MeshStandardMaterial;
    if (!material.map) return;

    const canvas = (material.map as THREE.CanvasTexture).image as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;

    const c1 = '#' + colors.groundColor1.toString(16).padStart(6, '0');
    const c2 = '#' + colors.groundColor2.toString(16).padStart(6, '0');

    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, c1);
    gradient.addColorStop(1, c2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const r1 = parseInt(c1.slice(1, 3), 16);
      const g1 = parseInt(c1.slice(3, 5), 16);
      const b1 = parseInt(c1.slice(5, 7), 16);
      const r2 = parseInt(c2.slice(1, 3), 16);
      const g2 = parseInt(c2.slice(3, 5), 16);
      const b2 = parseInt(c2.slice(5, 7), 16);
      ctx.fillStyle = `rgba(${Math.floor((r1 + r2) / 2 + (Math.random() - 0.5) * 40)},${Math.floor((g1 + g2) / 2 + (Math.random() - 0.5) * 40)},${Math.floor((b1 + b2) / 2 + (Math.random() - 0.5) * 40)},${Math.random() * 0.4})`;
      ctx.fillRect(x, y, 2, 2);
    }

    material.map.needsUpdate = true;
  }

  private createCharacter(): void {
    this.character = new THREE.Group();

    this.characterBodyMaterial = new THREE.MeshStandardMaterial({
      color: CHARACTER_COLORS.red,
      roughness: 0.5,
      metalness: 0.1
    });

    const bodyGeometry = new THREE.BoxGeometry(1.2, 1.8, 0.8);
    const body = new THREE.Mesh(bodyGeometry, this.characterBodyMaterial);
    body.position.y = 1.5;
    body.castShadow = true;
    body.receiveShadow = true;
    this.character.add(body);

    const headGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const head = new THREE.Mesh(headGeometry, this.characterBodyMaterial);
    head.position.y = 2.8;
    head.castShadow = true;
    head.receiveShadow = true;
    this.character.add(head);

    const armGeometry = new THREE.BoxGeometry(0.35, 1.2, 0.35);
    const leftArm = new THREE.Mesh(armGeometry, this.characterBodyMaterial);
    leftArm.position.set(-0.85, 1.6, 0);
    leftArm.castShadow = true;
    leftArm.receiveShadow = true;
    this.character.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, this.characterBodyMaterial);
    rightArm.position.set(0.85, 1.6, 0);
    rightArm.castShadow = true;
    rightArm.receiveShadow = true;
    this.character.add(rightArm);

    const legGeometry = new THREE.BoxGeometry(0.4, 1.0, 0.4);
    const leftLeg = new THREE.Mesh(legGeometry, this.characterBodyMaterial);
    leftLeg.position.set(-0.35, 0.5, 0);
    leftLeg.castShadow = true;
    leftLeg.receiveShadow = true;
    this.character.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, this.characterBodyMaterial);
    rightLeg.position.set(0.35, 0.5, 0);
    rightLeg.castShadow = true;
    rightLeg.receiveShadow = true;
    this.character.add(rightLeg);

    this.scene.add(this.character);
  }

  private createTree(position: THREE.Vector3): THREE.Group {
    const tree = new THREE.Group();

    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 2.5, 6);
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x5c4033,
      roughness: 0.9,
      flatShading: true
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 1.25;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    const foliageColors = [0x2d5a3d, 0x3a7d4f, 0x4a9c5e];
    for (let i = 0; i < 3; i++) {
      const coneGeometry = new THREE.ConeGeometry(1.8 - i * 0.35, 2 - i * 0.3, 7);
      const foliageMaterial = new THREE.MeshStandardMaterial({
        color: foliageColors[i],
        roughness: 0.8,
        flatShading: true
      });
      const foliage = new THREE.Mesh(coneGeometry, foliageMaterial);
      foliage.position.y = 3.2 + i * 1.1;
      foliage.castShadow = true;
      foliage.receiveShadow = true;
      tree.add(foliage);
    }

    tree.position.copy(position);
    tree.scale.setScalar(0.9 + Math.random() * 0.3);
    tree.rotation.y = Math.random() * Math.PI * 2;
    return tree;
  }

  private createCactus(position: THREE.Vector3): THREE.Group {
    const cactus = new THREE.Group();
    const cactusMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a7c39,
      roughness: 0.8,
      flatShading: true
    });

    const mainTrunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.4, 3, 7),
      cactusMaterial
    );
    mainTrunk.position.y = 1.5;
    mainTrunk.castShadow = true;
    cactus.add(mainTrunk);

    const leftArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.22, 1.3, 6),
      cactusMaterial
    );
    leftArm.position.set(-0.55, 1.6, 0);
    leftArm.rotation.z = 0.5;
    leftArm.castShadow = true;
    cactus.add(leftArm);

    const leftArmTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.8, 6),
      cactusMaterial
    );
    leftArmTop.position.set(-0.8, 2.3, 0);
    leftArmTop.castShadow = true;
    cactus.add(leftArmTop);

    const rightArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.22, 1.1, 6),
      cactusMaterial
    );
    rightArm.position.set(0.55, 2.0, 0);
    rightArm.rotation.z = -0.5;
    rightArm.castShadow = true;
    cactus.add(rightArm);

    const rightArmTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.7, 6),
      cactusMaterial
    );
    rightArmTop.position.set(0.8, 2.6, 0);
    rightArmTop.castShadow = true;
    cactus.add(rightArmTop);

    cactus.position.copy(position);
    cactus.scale.setScalar(0.85 + Math.random() * 0.3);
    cactus.rotation.y = Math.random() * Math.PI * 2;
    return cactus;
  }

  private createSnowTree(position: THREE.Vector3): THREE.Group {
    const tree = new THREE.Group();

    const trunkGeometry = new THREE.CylinderGeometry(0.25, 0.35, 2, 6);
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a3c2a,
      roughness: 0.9,
      flatShading: true
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 1;
    trunk.castShadow = true;
    tree.add(trunk);

    const snowColors = [0x2d6a5a, 0x3d8a7a, 0x5aaa9a];
    for (let i = 0; i < 3; i++) {
      const coneGeometry = new THREE.ConeGeometry(1.6 - i * 0.3, 1.8 - i * 0.2, 7);
      const foliageMaterial = new THREE.MeshStandardMaterial({
        color: snowColors[i],
        roughness: 0.7,
        flatShading: true
      });
      const foliage = new THREE.Mesh(coneGeometry, foliageMaterial);
      foliage.position.y = 2.6 + i * 1;
      foliage.castShadow = true;
      tree.add(foliage);

      const capGeometry = new THREE.ConeGeometry(1.65 - i * 0.3, 0.25, 7);
      const snowCapMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.4,
        flatShading: true
      });
      const snowCap = new THREE.Mesh(capGeometry, snowCapMaterial);
      snowCap.position.y = 3.4 + i * 1;
      snowCap.castShadow = true;
      tree.add(snowCap);
    }

    tree.position.copy(position);
    tree.scale.setScalar(0.9 + Math.random() * 0.35);
    tree.rotation.y = Math.random() * Math.PI * 2;
    return tree;
  }

  private createDecorations(theme: ThemeType): void {
    while (this.decorations.children.length > 0) {
      const child = this.decorations.children[0];
      this.decorations.remove(child);
      if ((child as THREE.Mesh).geometry) {
        ((child as THREE.Mesh).geometry as THREE.BufferGeometry).dispose();
      }
    }

    const positions: THREE.Vector3[] = [];
    const minDist = 4;
    const radius = 12;

    while (positions.length < 7) {
      const angle = Math.random() * Math.PI * 2;
      const r = 11 + Math.random() * 4;
      const pos = new THREE.Vector3(
        Math.cos(angle) * r,
        0,
        Math.sin(angle) * r
      );

      let valid = true;
      for (const p of positions) {
        if (pos.distanceTo(p) < minDist) {
          valid = false;
          break;
        }
      }
      if (valid && Math.abs(pos.x) < radius && Math.abs(pos.z) < radius) {
        positions.push(pos);
      }
    }

    for (const pos of positions) {
      let decoration: THREE.Group;
      switch (theme) {
        case 'desert':
          decoration = this.createCactus(pos);
          break;
        case 'snow':
          decoration = this.createSnowTree(pos);
          break;
        case 'forest':
        default:
          decoration = this.createTree(pos);
          break;
      }
      this.decorations.add(decoration);
    }
  }

  private lerpColor(from: number, to: number, t: number): number {
    const fr = (from >> 16) & 255;
    const fg = (from >> 8) & 255;
    const fb = from & 255;
    const tr = (to >> 16) & 255;
    const tg = (to >> 8) & 255;
    const tb = to & 255;
    const r = Math.round(fr + (tr - fr) * t);
    const g = Math.round(fg + (tg - fg) * t);
    const b = Math.round(fb + (tb - fb) * t);
    return (r << 16) | (g << 8) | b;
  }

  private applyThemeColors(colors: ThemeColors): void {
    this.scene.background = new THREE.Color(colors.bg);
    this.fog.color.setHex(colors.fog);
    this.weatherManager.setFogColor(colors.fog);
    this.ambientLight.color.setHex(colors.ambient);
    this.updateGroundTexture(colors);
  }

  private interpolateThemeColors(t: number): void {
    const from = this.prevThemeColors;
    const to = this.targetThemeColors;
    const colors: ThemeColors = {
      bg: this.lerpColor(from.bg, to.bg, t),
      groundColor1: this.lerpColor(from.groundColor1, to.groundColor1, t),
      groundColor2: this.lerpColor(from.groundColor2, to.groundColor2, t),
      fog: this.lerpColor(from.fog, to.fog, t),
      ambient: this.lerpColor(from.ambient, to.ambient, t)
    };
    this.applyThemeColors(colors);
  }

  setup(container: HTMLElement, onFpsUpdate?: (fps: number) => void): void {
    this.container = container;
    this.onFpsUpdate = onFpsUpdate;
    container.innerHTML = '';
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.className = 'scene-canvas';
    this.resize();
    window.addEventListener('resize', this.resize);
    this.startAnimation();
  }

  private resize = (): void => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

  switchTheme(theme: ThemeType): void {
    if (this.currentTheme === theme) return;
    this.prevThemeColors = { ...THEME_COLORS[this.currentTheme] };
    this.currentTheme = theme;
    this.targetThemeColors = { ...THEME_COLORS[theme] };
    this.transitionProgress = 0;
    this.isTransitioning = true;
    this.createDecorations(theme);
  }

  setWeather(weather: WeatherType): void {
    this.weatherManager.setWeather(weather);
  }

  updateLight(angleDeg: number, intensity: number): void {
    const angleRad = (angleDeg * Math.PI) / 180;
    const height = 18;
    const radius = 15;
    this.directionalLight.position.set(
      Math.cos(angleRad) * radius,
      height,
      Math.sin(angleRad) * radius
    );
    this.directionalLight.intensity = intensity;
  }

  setCharacterColor(color: CharacterColor): void {
    if (this.characterBodyMaterial) {
      this.characterBodyMaterial.color.setHex(CHARACTER_COLORS[color]);
    }
  }

  private startAnimation(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      const delta = Math.min(this.clock.getDelta(), 0.1);

      if (this.isTransitioning) {
        this.transitionProgress += delta / this.transitionDuration;
        if (this.transitionProgress >= 1) {
          this.transitionProgress = 1;
          this.isTransitioning = false;
        }
        this.interpolateThemeColors(this.easeInOutCubic(this.transitionProgress));
      }

      if (this.decorations.children.length > 0) {
        this.decorations.children.forEach((child, i) => {
          (child as THREE.Group).rotation.y += delta * 0.05 * (i % 2 === 0 ? 1 : -1);
        });
      }

      this.weatherManager.update(delta);

      this.renderer.render(this.scene, this.camera);

      this.frameCount++;
      const now = performance.now();
      if (now - this.lastFpsUpdate >= 500) {
        this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
        this.frameCount = 0;
        this.lastFpsUpdate = now;
        if (this.onFpsUpdate) {
          this.onFpsUpdate(this.fps);
        }
      }
    };
    animate();
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.resize);
    this.weatherManager.dispose();
    this.renderer.dispose();
    if (this.container && this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
