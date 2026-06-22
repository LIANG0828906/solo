import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { continentOutlines, plateBoundaries } from '../data';

const EARTH_RADIUS = 5;

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private composer: EffectComposer;
  private tickCallbacks: Array<(dt: number) => void> = [];
  private clock: THREE.Clock;
  private earthGroup: THREE.Group;
  private stars: THREE.Points;

  constructor(container: HTMLElement) {
    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 3, 14);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.5;
    this.controls.zoomSpeed = 0.8;
    this.controls.minDistance = 7;
    this.controls.maxDistance = 30;
    this.controls.enablePan = true;
    this.controls.panSpeed = 0.5;

    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      0.8,
      0.4,
      0.85
    );
    this.composer.addPass(bloomPass);

    this.earthGroup = new THREE.Group();
    this.scene.add(this.earthGroup);

    this.stars = this.createStars();
    this.scene.add(this.stars);

    this.createLights();
    this.createEarth();
    this.createContinentOutlines();
    this.createPlateBoundaries();
    this.createAtmosphere();

    window.addEventListener('resize', this.onResize.bind(this));
  }

  private createStars(): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    const count = 3000;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const r = 80 + Math.random() * 120;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      sizes[i] = 0.3 + Math.random() * 0.7;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.15,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8,
    });

    return new THREE.Points(geometry, material);
  }

  private createLights(): void {
    const ambient = new THREE.AmbientLight(0x4466aa, 0.6);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffeedd, 1.2);
    sun.position.set(10, 5, 8);
    this.scene.add(sun);

    const fill = new THREE.DirectionalLight(0x334466, 0.3);
    fill.position.set(-5, -3, -5);
    this.scene.add(fill);
  }

  private createEarth(): void {
    const geometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        color1: { value: new THREE.Color(0x1F2833) },
        color2: { value: new THREE.Color(0x45A29E) },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color1;
        uniform vec3 color2;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          float t = (vPosition.y + 5.0) / 10.0;
          t = clamp(t, 0.0, 1.0);
          vec3 col = mix(color1, color2, t);
          float rim = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
          col += 0.15 * rim * rim;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });

    const earth = new THREE.Mesh(geometry, material);
    this.earthGroup.add(earth);
  }

  private createAtmosphere(): void {
    const geometry = new THREE.SphereGeometry(EARTH_RADIUS * 1.04, 64, 64);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0x45A29E) },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
          gl_FragColor = vec4(glowColor, intensity * 0.4);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const atmosphere = new THREE.Mesh(geometry, material);
    this.earthGroup.add(atmosphere);
  }

  private createContinentOutlines(): void {
    for (const continent of continentOutlines) {
      const points = continent.points.map(([lat, lng]) =>
        this.latLngToVector3(lat, lng, EARTH_RADIUS * 1.003)
      );

      if (points.length < 2) continue;

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0x45A29E,
        transparent: true,
        opacity: 0.5,
      });

      const line = new THREE.Line(geometry, material);
      this.earthGroup.add(line);
    }
  }

  private createPlateBoundaries(): void {
    for (const plate of plateBoundaries) {
      const points = plate.points.map(([lat, lng]) =>
        this.latLngToVector3(lat, lng, EARTH_RADIUS * 1.005)
      );

      if (points.length < 2) continue;

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: plate.color,
        transparent: true,
        opacity: 0.9,
        linewidth: 2,
      });

      const line = new THREE.Line(geometry, material);
      line.name = `plate_${plate.name}`;
      this.earthGroup.add(line);

      const glowMaterial = new THREE.LineBasicMaterial({
        color: 0xff6666,
        transparent: true,
        opacity: 0.3,
        linewidth: 1,
      });
      const glowLine = new THREE.Line(geometry.clone(), glowMaterial);
      glowLine.name = `plate_glow_${plate.name}`;
      this.earthGroup.add(glowLine);
    }
  }

  latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
    const phi = ((90 - lat) * Math.PI) / 180;
    const theta = ((lng + 180) * Math.PI) / 180;
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  getEarthGroup(): THREE.Group {
    return this.earthGroup;
  }

  getControls(): OrbitControls {
    return this.controls;
  }

  addTickCallback(cb: (dt: number) => void): void {
    this.tickCallbacks.push(cb);
  }

  animate(): void {
    requestAnimationFrame(this.animate.bind(this));
    const dt = this.clock.getDelta();

    for (const cb of this.tickCallbacks) {
      cb(dt);
    }

    this.controls.update();
    this.composer.render();
  }

  private onResize(): void {
    const container = this.renderer.domElement.parentElement;
    if (!container) return;

    const w = container.clientWidth;
    const h = container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
  }

  dispose(): void {
    this.renderer.dispose();
    this.controls.dispose();
    window.removeEventListener('resize', this.onResize.bind(this));
  }
}

export { EARTH_RADIUS };
