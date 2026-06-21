import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { getSkyColors, getSunIntensity, getSunColor } from '../utils/colorTheme';

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;
  public sun: THREE.Mesh;
  public sunLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public ground: THREE.Mesh;
  public ambientLight: THREE.AmbientLight;
  public sunGlow: THREE.Mesh;
  public sunCorona: THREE.Mesh;

  private container: HTMLElement | null = null;
  private buildingGroup: THREE.Group;
  private clock: THREE.Clock;
  private _currentTime: number = 17;
  private targetTime: number = 17;
  private _autoRotate: boolean = false;

  private skyMesh: THREE.Mesh | null = null;
  private skyTop: THREE.Color = new THREE.Color(0x0a0a2e);
  private skyBottom: THREE.Color = new THREE.Color(0x1a1a4e);

  get currentTime(): number {
    return this._currentTime;
  }

  get autoRotate(): boolean {
    return this._autoRotate;
  }

  constructor() {
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.buildingGroup = new THREE.Group();
    this.buildingGroup.name = 'buildings';

    this.camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    this.camera.position.set(180, 140, 180);
    this.camera.lookAt(0, 20, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minPolarAngle = THREE.MathUtils.degToRad(10);
    this.controls.maxPolarAngle = THREE.MathUtils.degToRad(80);
    this.controls.minDistance = 40;
    this.controls.maxDistance = 500;
    this.controls.target.set(0, 20, 0);
    this.controls.autoRotateSpeed = 0.8;

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x3a2a1a, 0.4);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffffee, 1.0);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 800;
    const d = 250;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    const sunGeo = new THREE.SphereGeometry(10, 48, 48);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffee88, fog: false });
    this.sun = new THREE.Mesh(sunGeo, sunMat);
    this.scene.add(this.sun);

    const glowGeo = new THREE.SphereGeometry(18, 48, 48);
    const glowMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      fog: false,
      transparent: true,
      depthWrite: false,
      uniforms: {
        color: { value: new THREE.Color(0xffaa44) },
        intensity: { value: 0.8 }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        uniform vec3 color;
        uniform float intensity;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(color, intensity * 1.2);
        }
      `
    });
    this.sunGlow = new THREE.Mesh(glowGeo, glowMat);
    this.scene.add(this.sunGlow);

    const coronaGeo = new THREE.SphereGeometry(28, 48, 48);
    const coronaMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      fog: false,
      transparent: true,
      depthWrite: false,
      uniforms: {
        color: { value: new THREE.Color(0xff6633) },
        intensity: { value: 0.5 }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        uniform vec3 color;
        uniform float intensity;
        void main() {
          float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          gl_FragColor = vec4(color, intensity * 0.8);
        }
      `
    });
    this.sunCorona = new THREE.Mesh(coronaGeo, coronaMat);
    this.scene.add(this.sunCorona);

    const groundGeo = new THREE.PlaneGeometry(600, 600);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x2d1f3d,
      roughness: 0.95,
      metalness: 0.0
    });
    this.ground = new THREE.Mesh(groundGeo, groundMat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    this.scene.add(this.buildingGroup);

    this.createGradientSky();
    this.updateTime(17, true);
  }

  private createGradientSky(): void {
    const geo = new THREE.SphereGeometry(900, 32, 32);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(0x0a0a2e) },
        bottomColor: { value: new THREE.Color(0x1a1a4e) },
        offset: { value: 33 },
        exponent: { value: 0.6 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `
    });
    this.skyMesh = new THREE.Mesh(geo, mat);
    this.scene.add(this.skyMesh);
    this.scene.fog = new THREE.Fog(0x1a1a4e, 200, 700);
  }

  public init(container: HTMLElement): void {
    this.container = container;
    container.appendChild(this.renderer.domElement);
    window.addEventListener('resize', this.onResize);
  }

  private onResize = (): void => {
    if (!this.container) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public addObject(obj: THREE.Object3D): void {
    this.buildingGroup.add(obj);
  }

  public removeObject(obj: THREE.Object3D): void {
    this.buildingGroup.remove(obj);
  }

  public clearBuildings(): void {
    const toRemove: THREE.Object3D[] = [];
    this.buildingGroup.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.InstancedMesh || child instanceof THREE.Group) {
        toRemove.push(child);
      }
    });
    toRemove.forEach((obj) => {
      this.buildingGroup.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
      if (obj instanceof THREE.InstancedMesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }

  public updateTime(hour: number, immediate: boolean = false): void {
    this.targetTime = ((hour % 24) + 24) % 24;
    if (immediate) {
      this._currentTime = this.targetTime;
      this.applyTime(this._currentTime);
    }
  }

  private applyTime(hour: number): void {
    const angle = ((hour - 6) / 24) * Math.PI * 2;
    const radius = 380;
    const sunX = Math.cos(angle) * radius;
    const sunY = Math.sin(angle) * radius * 0.95 + 30;
    const sunZ = Math.sin(angle * 0.5) * 120;

    this.sun.position.set(sunX, sunY, sunZ);
    this.sunGlow.position.copy(this.sun.position);
    this.sunCorona.position.copy(this.sun.position);

    this.sunLight.position.copy(this.sun.position);
    this.sunLight.target.position.set(0, 0, 0);
    this.sunLight.target.updateMatrixWorld();

    const intensity = getSunIntensity(hour);
    const sunColor = getSunColor(hour);
    this.sunLight.intensity = intensity;
    this.sunLight.color.setHex(sunColor);
    (this.sun.material as THREE.MeshBasicMaterial).color.setHex(sunColor);

    const normalizedHeight = Math.max(0, Math.min(1, sunY / 350));
    const glowMat = this.sunGlow.material as THREE.ShaderMaterial;
    const coronaMat = this.sunCorona.material as THREE.ShaderMaterial;
    glowMat.uniforms.color.value.setHex(sunColor);
    coronaMat.uniforms.color.value.setHex(sunColor);
    const glowIntensity = 0.3 + normalizedHeight * 0.8;
    glowMat.uniforms.intensity.value = glowIntensity;
    coronaMat.uniforms.intensity.value = glowIntensity * 0.7;

    const sunScale = 0.5 + normalizedHeight * 1.0;
    this.sun.scale.setScalar(sunScale);
    this.sunGlow.scale.setScalar(sunScale * 1.4);
    this.sunCorona.scale.setScalar(sunScale * 2.0);

    const altitudeAngle = Math.atan2(sunY, Math.sqrt(sunX * sunX + sunZ * sunZ));
    const shadowMultiplier = Math.max(0.5, 1.5 - Math.sin(altitudeAngle) * 1.0);
    const shadowSoftness = 0.0002 + (1 - normalizedHeight) * 0.0008;
    this.sunLight.shadow.bias = -shadowSoftness;
    this.sunLight.shadow.normalBias = 0.01 + (1 - normalizedHeight) * 0.03;

    const shadowSize = 1536 + Math.floor(normalizedHeight * 512);
    if (this.sunLight.shadow.mapSize.width !== shadowSize) {
      this.sunLight.shadow.mapSize.set(shadowSize, shadowSize);
      if (this.sunLight.shadow.map) {
        this.sunLight.shadow.map.dispose();
        this.sunLight.shadow.map = null;
      }
    }

    const d = 200 + shadowMultiplier * 150;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.camera.updateProjectionMatrix();

    const sky = getSkyColors(hour);
    this.skyTop.setHex(sky.top);
    this.skyBottom.setHex(sky.bottom);
    if (this.skyMesh) {
      const mat = this.skyMesh.material as THREE.ShaderMaterial;
      mat.uniforms.topColor.value.copy(this.skyTop);
      mat.uniforms.bottomColor.value.copy(this.skyBottom);
    }
    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.color.lerpColors(this.skyBottom, this.skyTop, 0.5);
      this.scene.fog.near = 150 + normalizedHeight * 100;
      this.scene.fog.far = 500 + normalizedHeight * 300;
    }

    this.hemiLight.color.setHex(sky.top);
    this.hemiLight.groundColor.lerpColors(new THREE.Color(sky.bottom), new THREE.Color(0x1a1a1a), 0.5);
    this.hemiLight.intensity = 0.3 + intensity * 0.3;

    this.ambientLight.color.setHex(sky.ambient);
    this.ambientLight.intensity = 0.2 + intensity * 0.2;

    this.renderer.toneMappingExposure = 0.75 + normalizedHeight * 0.5;

    this.sunGlow.lookAt(this.camera.position);
    this.sunCorona.lookAt(this.camera.position);
  }

  public setGroundColor(color: number): void {
    (this.ground.material as THREE.MeshStandardMaterial).color.setHex(color);
  }

  public setOrbitEnabled(enabled: boolean): void {
    this.controls.enabled = enabled;
  }

  public setAutoRotate(enabled: boolean): void {
    this._autoRotate = enabled;
    this.controls.autoRotate = enabled;
  }

  public update(): void {
    const dt = this.clock.getDelta();

    if (Math.abs(this._currentTime - this.targetTime) > 0.01) {
      const diff = this.targetTime - this._currentTime;
      const step = diff * Math.min(1, dt * 4);
      this._currentTime += step;
      this.applyTime(this._currentTime);
    }

    this.controls.update();
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    window.removeEventListener('resize', this.onResize);
    this.controls.dispose();
    this.renderer.dispose();
    this.clearBuildings();

    this.scene.remove(this.sun);
    this.scene.remove(this.sunGlow);
    this.scene.remove(this.sunCorona);
    this.sun.geometry.dispose();
    (this.sun.material as THREE.Material).dispose();
    this.sunGlow.geometry.dispose();
    (this.sunGlow.material as THREE.Material).dispose();
    this.sunCorona.geometry.dispose();
    (this.sunCorona.material as THREE.Material).dispose();

    if (this.skyMesh) {
      this.scene.remove(this.skyMesh);
      this.skyMesh.geometry.dispose();
      (this.skyMesh.material as THREE.Material).dispose();
    }

    if (this.container && this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
