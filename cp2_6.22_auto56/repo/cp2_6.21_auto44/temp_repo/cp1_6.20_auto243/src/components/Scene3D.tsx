import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { CityData, Scene3DHandle, WindParams } from '../types';

interface Scene3DProps {
  initialCity: CityData;
  initialWind: WindParams;
  initialParticleCount: number;
  onFPSUpdate?: (fps: number) => void;
}

interface ParticleRuntime {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  seed: number;
}

const MAX_HISTORY = 8;
const SCENE_HALF_EXTENT = 150;
const MAX_HEIGHT = 130;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255,
  ];
}

const COLOR_LOW = hexToRgb('#2196f3');
const COLOR_HIGH = hexToRgb('#f44336');

function speedToColor(speed: number, maxSpeed: number): THREE.Color {
  const t = Math.min(Math.max(speed / maxSpeed, 0), 1);
  return new THREE.Color(
    lerp(COLOR_LOW[0], COLOR_HIGH[0], t),
    lerp(COLOR_LOW[1], COLOR_HIGH[1], t),
    lerp(COLOR_LOW[2], COLOR_HIGH[2], t)
  );
}

function lerpWind(a: WindParams, b: WindParams, t: number): WindParams {
  return {
    speed: lerp(a.speed, b.speed, t),
    direction: lerpAngle(a.direction, b.direction, t),
    turbulence: lerp(a.turbulence, b.turbulence, t),
  };
}

function lerpAngle(a: number, b: number, t: number): number {
  let diff = ((b - a + 540) % 360) - 180;
  return (a + diff * t + 360) % 360;
}

function directionToVec3(deg: number): THREE.Vector3 {
  const rad = (deg * Math.PI) / 180;
  return new THREE.Vector3(-Math.sin(rad), 0, -Math.cos(rad));
}

const Scene3D = forwardRef<Scene3DHandle, Scene3DProps>(function Scene3D(
  { initialCity, initialWind, initialParticleCount, onFPSUpdate },
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls | null;
    buildingsGroup: THREE.Group;
    particles: THREE.Points | null;
    trails: THREE.LineSegments | null;
    windVane: THREE.Group;
    grid: THREE.GridHelper | null;
    targetWind: WindParams;
    currentWind: WindParams;
    particlesData: ParticleRuntime[];
    particleCount: number;
    animationId: number | null;
    cameraAnim: {
      active: boolean;
      t: number;
      duration: number;
      fromPos: THREE.Vector3;
      toPos: THREE.Vector3;
      fromTarget: THREE.Vector3;
      toTarget: THREE.Vector3;
    };
    fpsData: {
      lastTime: number;
      frameCount: number;
      accumulated: number;
      window: number[];
    };
    maxSpeed: number;
  }>({
    renderer: null,
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(),
    controls: null,
    buildingsGroup: new THREE.Group(),
    particles: null,
    trails: null,
    windVane: new THREE.Group(),
    grid: null,
    targetWind: { ...initialWind },
    currentWind: { ...initialWind },
    particlesData: [],
    particleCount: initialParticleCount,
    animationId: null,
    cameraAnim: {
      active: false,
      t: 0,
      duration: 0.5,
      fromPos: new THREE.Vector3(),
      toPos: new THREE.Vector3(),
      fromTarget: new THREE.Vector3(),
      toTarget: new THREE.Vector3(),
    },
    fpsData: {
      lastTime: performance.now(),
      frameCount: 0,
      accumulated: 0,
      window: [],
    },
    maxSpeed: 20,
  });

  useImperativeHandle(ref, () => ({
    updateWindParams: (wind: WindParams) => {
      stateRef.current.targetWind = { ...wind };
    },
    setParticleCount: (n: number) => {
      const s = stateRef.current;
      s.particleCount = Math.max(50, Math.min(2000, Math.floor(n)));
      rebuildParticleSystem();
    },
    loadCity: (city: CityData) => {
      void stateRef.current;
      rebuildBuildings(city);
      startCameraFlyTo(computeOptimalCamera(city));
    },
    resetCamera: () => {
      startCameraFlyTo({
        pos: new THREE.Vector3(200, 180, 200),
        target: new THREE.Vector3(0, 0, 0),
      });
    },
    getParticleCount: () => stateRef.current.particleCount,
    getFPS: () => {
      const w = stateRef.current.fpsData.window;
      if (w.length === 0) return 60;
      return w.reduce((a, b) => a + b, 0) / w.length;
    },
  }));

  function computeOptimalCamera(
    _city: CityData
  ): { pos: THREE.Vector3; target: THREE.Vector3 } {
    return {
      pos: new THREE.Vector3(210, 170, 210),
      target: new THREE.Vector3(0, 20, 0),
    };
    void _city;
  }

  function startCameraFlyTo(to: {
    pos: THREE.Vector3;
    target: THREE.Vector3;
  }): void {
    const s = stateRef.current;
    if (!s.controls) return;
    s.cameraAnim.active = true;
    s.cameraAnim.t = 0;
    s.cameraAnim.duration = 0.5;
    s.cameraAnim.fromPos.copy(s.camera.position);
    s.cameraAnim.toPos.copy(to.pos);
    s.cameraAnim.fromTarget.copy(s.controls.target);
    s.cameraAnim.toTarget.copy(to.target);
    s.controls.enabled = false;
  }

  function rebuildBuildings(city: CityData): void {
    const s = stateRef.current;
    while (s.buildingsGroup.children.length > 0) {
      const child = s.buildingsGroup.children[0];
      s.buildingsGroup.remove(child);
      if ((child as THREE.Mesh).geometry) {
        (child as THREE.Mesh).geometry.dispose();
      }
      const mat = (child as THREE.Mesh).material;
      if (mat) {
        if (Array.isArray(mat)) {
          mat.forEach((m) => m.dispose());
        } else {
          mat.dispose();
        }
      }
      const edges = (child as THREE.Group & { userData?: { edges?: THREE.LineSegments } }).userData?.edges;
      if (edges) {
        edges.geometry.dispose();
        (edges.material as THREE.Material).dispose();
      }
    }
    const colorLow = hexToRgb('#b0bec5');
    const colorHigh = hexToRgb('#455a64');
    city.buildings.forEach((b) => {
      const geometry = new THREE.BoxGeometry(b.width, b.height, b.depth);
      const t = b.density;
      const color = new THREE.Color(
        lerp(colorLow[0], colorHigh[0], t),
        lerp(colorLow[1], colorHigh[1], t),
        lerp(colorLow[2], colorHigh[2], t)
      );
      const material = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.1,
        roughness: 0.8,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(b.x, b.height / 2, b.z);
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      const edges = new THREE.EdgesGeometry(geometry);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.18,
      });
      const lineSegments = new THREE.LineSegments(edges, lineMat);
      lineSegments.position.set(b.x, b.height / 2, b.z);
      (mesh as THREE.Mesh & { userData: Record<string, unknown> }).userData = {
        edges: lineSegments,
      };
      s.buildingsGroup.add(mesh);
      s.buildingsGroup.add(lineSegments);
    });
  }

  function rebuildParticleSystem(): void {
    const s = stateRef.current;
    if (s.particles) {
      s.scene.remove(s.particles);
      s.particles.geometry.dispose();
      (s.particles.material as THREE.Material).dispose();
      s.particles = null;
    }
    if (s.trails) {
      s.scene.remove(s.trails);
      s.trails.geometry.dispose();
      (s.trails.material as THREE.Material).dispose();
      s.trails = null;
    }
    const count = s.particleCount;
    s.particlesData = new Array(count);
    for (let i = 0; i < count; i++) {
      s.particlesData[i] = {
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * SCENE_HALF_EXTENT * 2,
          Math.random() * MAX_HEIGHT,
          (Math.random() - 0.5) * SCENE_HALF_EXTENT * 2
        ),
        vel: new THREE.Vector3(0, 0, 0),
        seed: Math.random() * 10000,
      };
    }
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const p = s.particlesData[i];
      positions[i * 3] = p.pos.x;
      positions[i * 3 + 1] = p.pos.y;
      positions[i * 3 + 2] = p.pos.z;
      colors[i * 3] = COLOR_LOW[0];
      colors[i * 3 + 1] = COLOR_LOW[1];
      colors[i * 3 + 2] = COLOR_LOW[2];
    }
    const pointsGeom = new THREE.BufferGeometry();
    pointsGeom.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    pointsGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const pointsMat = new THREE.PointsMaterial({
      size: 1.6,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    s.particles = new THREE.Points(pointsGeom, pointsMat);
    s.scene.add(s.particles);
    const trailPositions = new Float32Array(count * MAX_HISTORY * 2 * 3);
    const trailColors = new Float32Array(count * MAX_HISTORY * 2 * 3);
    const trailGeom = new THREE.BufferGeometry();
    trailGeom.setAttribute(
      'position',
      new THREE.BufferAttribute(trailPositions, 3)
    );
    trailGeom.setAttribute(
      'color',
      new THREE.BufferAttribute(trailColors, 3)
    );
    const trailMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    s.trails = new THREE.LineSegments(trailGeom, trailMat);
    s.scene.add(s.trails);
  }

  function initWindVane(): void {
    const s = stateRef.current;
    const arrowGroup = new THREE.Group();
    const poleGeom = new THREE.CylinderGeometry(0.4, 0.4, 16, 8);
    const poleMat = new THREE.MeshStandardMaterial({
      color: 0x666666,
      metalness: 0.6,
      roughness: 0.4,
    });
    const pole = new THREE.Mesh(poleGeom, poleMat);
    pole.position.y = 8;
    arrowGroup.add(pole);
    const coneGeom = new THREE.ConeGeometry(2.4, 7, 4);
    const coneMat = new THREE.MeshStandardMaterial({
      color: 0xff5722,
      emissive: 0xff5722,
      emissiveIntensity: 0.3,
      metalness: 0.2,
      roughness: 0.5,
    });
    const cone = new THREE.Mesh(coneGeom, coneMat);
    cone.position.y = 18;
    cone.rotation.z = Math.PI;
    arrowGroup.add(cone);
    const tailGeom = new THREE.BoxGeometry(0.3, 3.2, 6);
    const tailMat = new THREE.MeshStandardMaterial({
      color: 0xff5722,
      emissive: 0xff3300,
      emissiveIntensity: 0.2,
    });
    const tail = new THREE.Mesh(tailGeom, tailMat);
    tail.position.set(0, 18, -1.5);
    arrowGroup.add(tail);
    s.windVane = arrowGroup;
    s.scene.add(arrowGroup);
  }

  function buildGrid(): void {
    const s = stateRef.current;
    if (s.grid) {
      s.scene.remove(s.grid);
      s.grid.geometry.dispose();
      (s.grid.material as THREE.Material).dispose();
    }
    const grid = new THREE.GridHelper(
      SCENE_HALF_EXTENT * 2,
      (SCENE_HALF_EXTENT * 2) / 20,
      0xe0e0e0,
      0xe0e0e0
    );
    (grid.material as THREE.LineBasicMaterial).transparent = true;
    (grid.material as THREE.LineBasicMaterial).opacity = 0.35;
    grid.position.y = 0.1;
    s.grid = grid;
    s.scene.add(grid);
  }

  function pseudoNoise(x: number, y: number, z: number, seed: number): number {
    const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seed * 0.13);
    return (s - Math.floor(s)) * 2 - 1;
  }

  useEffect(() => {
    if (!containerRef.current) return;
    const s = stateRef.current;
    const container = containerRef.current;
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x1a1a2e, 1);
    container.appendChild(renderer.domElement);
    s.renderer = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 300, 700);
    s.scene = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.5,
      2000
    );
    camera.position.set(200, 180, 200);
    s.camera = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.screenSpacePanning = false;
    controls.minDistance = 50;
    controls.maxDistance = 600;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.target.set(0, 20, 0);
    s.controls = controls;

    const ambient = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.85);
    dir.position.set(150, 220, 100);
    scene.add(dir);
    const hemi = new THREE.HemisphereLight(0x8899ff, 0x111122, 0.25);
    scene.add(hemi);

    buildGrid();
    initWindVane();
    scene.add(s.buildingsGroup);
    rebuildBuildings(initialCity);
    s.targetWind = { ...initialWind };
    s.currentWind = { ...initialWind };
    rebuildParticleSystem();

    const handleResize = (): void => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    const startTime = performance.now();
    let lastT = startTime;

    const animate = (): void => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      const elapsed = (now - startTime) / 1000;

      const fps = s.fpsData;
      const deltaMs = now - fps.lastTime;
      fps.lastTime = now;
      if (deltaMs > 0) {
        const instFps = 1000 / deltaMs;
        fps.window.push(instFps);
        if (fps.window.length > 30) fps.window.shift();
        fps.accumulated += deltaMs;
        if (fps.accumulated > 250) {
          fps.accumulated = 0;
          const avg =
            fps.window.reduce((a, b) => a + b, 0) / fps.window.length;
          onFPSUpdate?.(avg);
        }
      }

      s.currentWind = lerpWind(s.currentWind, s.targetWind, 0.05);

      const windDir = directionToVec3(s.currentWind.direction);
      const baseSpeed = s.currentWind.speed;
      const turbulence = s.currentWind.turbulence;
      const count = s.particleCount;
      const particleArr = s.particlesData;

      const posAttr = s.particles?.geometry.getAttribute(
        'position'
      ) as THREE.BufferAttribute | undefined;
      const colorAttr = s.particles?.geometry.getAttribute(
        'color'
      ) as THREE.BufferAttribute | undefined;
      const trailPosAttr = s.trails?.geometry.getAttribute(
        'position'
      ) as THREE.BufferAttribute | undefined;
      const trailColorAttr = s.trails?.geometry.getAttribute(
        'color'
      ) as THREE.BufferAttribute | undefined;

      for (let i = 0; i < count; i++) {
        const p = particleArr[i];
        const nx = pseudoNoise(
          p.pos.x * 0.01,
          p.pos.y * 0.02 + elapsed * 0.3,
          p.pos.z * 0.01,
          p.seed
        );
        const ny = pseudoNoise(
          p.pos.x * 0.02 + 100,
          p.pos.y * 0.01 + elapsed * 0.2,
          p.pos.z * 0.02 + 50,
          p.seed + 1
        );
        const nz = pseudoNoise(
          p.pos.x * 0.015 + 30,
          p.pos.y * 0.025 + elapsed * 0.15,
          p.pos.z * 0.018 + 70,
          p.seed + 2
        );

        const turbScale = turbulence * 8;
        const vx = windDir.x * baseSpeed + nx * turbScale;
        const vy = ny * turbulence * 3;
        const vz = windDir.z * baseSpeed + nz * turbScale;

        p.vel.set(vx, vy, vz);
        const moveScale = dt * 2.2;
        p.pos.x += p.vel.x * moveScale;
        p.pos.y += p.vel.y * moveScale;
        p.pos.z += p.vel.z * moveScale;

        if (p.pos.x > SCENE_HALF_EXTENT) p.pos.x -= SCENE_HALF_EXTENT * 2;
        else if (p.pos.x < -SCENE_HALF_EXTENT)
          p.pos.x += SCENE_HALF_EXTENT * 2;
        if (p.pos.z > SCENE_HALF_EXTENT) p.pos.z -= SCENE_HALF_EXTENT * 2;
        else if (p.pos.z < -SCENE_HALF_EXTENT)
          p.pos.z += SCENE_HALF_EXTENT * 2;
        if (p.pos.y > MAX_HEIGHT) p.pos.y -= MAX_HEIGHT;
        else if (p.pos.y < 1.5) p.pos.y = 1.5 + Math.random() * 2;

        const speedMag = Math.sqrt(vx * vx + vy * vy + vz * vz);

        let col = speedToColor(speedMag, s.maxSpeed);
        if (turbulence > 0.5) {
          const flick = 1 + (Math.random() - 0.5) * 0.3 * turbulence;
          col = col.clone().multiplyScalar(flick);
        }

        if (posAttr && colorAttr) {
          const pa = posAttr.array as Float32Array;
          const ca = colorAttr.array as Float32Array;
          pa[i * 3] = p.pos.x;
          pa[i * 3 + 1] = p.pos.y;
          pa[i * 3 + 2] = p.pos.z;
          ca[i * 3] = baseSpeed === 0 ? col.r * 0.6 : col.r;
          ca[i * 3 + 1] = baseSpeed === 0 ? col.g * 0.6 : col.g;
          ca[i * 3 + 2] = baseSpeed === 0 ? col.b * 0.6 : col.b;
        }

        if (trailPosAttr && trailColorAttr) {
          const tpa = trailPosAttr.array as Float32Array;
          const tca = trailColorAttr.array as Float32Array;
          const ratio = Math.min(1, speedMag / Math.max(s.maxSpeed, 0.01));
          const visibleTrails = Math.max(
            1,
            Math.floor(ratio * (MAX_HISTORY - 1) + 1)
          );
          for (let h = 0; h < MAX_HISTORY; h++) {
            const segIdx = i * MAX_HISTORY + h;
            const alpha = 1 - h / MAX_HISTORY;
            const active = h < visibleTrails;
            const hBack = h * 0.9;
            const prevX = p.pos.x - vx * moveScale * hBack;
            const prevY = p.pos.y - vy * moveScale * hBack;
            const prevZ = p.pos.z - vz * moveScale * hBack;
            const nextX = hBack === 0 ? p.pos.x : p.pos.x - vx * moveScale * (h - 1) * 0.9;
            const nextY = hBack === 0 ? p.pos.y : p.pos.y - vy * moveScale * (h - 1) * 0.9;
            const nextZ = hBack === 0 ? p.pos.z : p.pos.z - vz * moveScale * (h - 1) * 0.9;
            const startX = active ? prevX : p.pos.x;
            const startY = active ? prevY : p.pos.y;
            const startZ = active ? prevZ : p.pos.z;
            const endX = active ? (h === 0 ? p.pos.x : nextX) : p.pos.x;
            const endY = active ? (h === 0 ? p.pos.y : nextY) : p.pos.y;
            const endZ = active ? (h === 0 ? p.pos.z : nextZ) : p.pos.z;
            const a = active ? (0.2 + 0.4 * alpha) * (0.3 + 0.7 * ratio) : 0;
            tpa[segIdx * 6] = startX;
            tpa[segIdx * 6 + 1] = startY;
            tpa[segIdx * 6 + 2] = startZ;
            tpa[segIdx * 6 + 3] = endX;
            tpa[segIdx * 6 + 4] = endY;
            tpa[segIdx * 6 + 5] = endZ;
            tca[segIdx * 6] = col.r * a;
            tca[segIdx * 6 + 1] = col.g * a;
            tca[segIdx * 6 + 2] = col.b * a;
            tca[segIdx * 6 + 3] = col.r * a * 0.95;
            tca[segIdx * 6 + 4] = col.g * a * 0.95;
            tca[segIdx * 6 + 5] = col.b * a * 0.95;
          }
        }
      }
      if (posAttr) posAttr.needsUpdate = true;
      if (colorAttr) colorAttr.needsUpdate = true;
      if (trailPosAttr) trailPosAttr.needsUpdate = true;
      if (trailColorAttr) trailColorAttr.needsUpdate = true;
      if (s.particles && baseSpeed === 0) {
        (s.particles.material as THREE.PointsMaterial).opacity = 0.45;
      } else if (s.particles) {
        (s.particles.material as THREE.PointsMaterial).opacity = 0.95;
      }

      s.windVane.rotation.y = ((-s.currentWind.direction + 90) * Math.PI) / 180;

      if (s.cameraAnim.active && s.controls) {
        s.cameraAnim.t += dt / s.cameraAnim.duration;
        const t = Math.min(1, s.cameraAnim.t);
        const et = easeInOutCubic(t);
        s.camera.position.lerpVectors(
          s.cameraAnim.fromPos,
          s.cameraAnim.toPos,
          et
        );
        s.controls.target.lerpVectors(
          s.cameraAnim.fromTarget,
          s.cameraAnim.toTarget,
          et
        );
        if (t >= 1) {
          s.cameraAnim.active = false;
          s.controls.enabled = true;
        }
      }

      controls.update();
      renderer.render(scene, camera);
      s.animationId = requestAnimationFrame(animate);
    };
    s.animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (s.animationId !== null) {
        cancelAnimationFrame(s.animationId);
      }
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  void rebuildBuildings;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    />
  );
});

export default Scene3D;
