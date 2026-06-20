import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  OCEAN_CURRENTS,
  DEPTH_LAYERS,
  useStore,
  type OceanCurrent,
} from '../store';

interface ParticleData {
  current: OceanCurrent;
  progress: number;
  speed: number;
  baseSize: number;
  offset: THREE.Vector3;
}

function lerpColor(c1: THREE.Color, c2: THREE.Color, t: number): THREE.Color {
  return new THREE.Color(
    c1.r + (c2.r - c1.r) * t,
    c1.g + (c2.g - c1.g) * t,
    c1.b + (c2.b - c1.b) * t
  );
}

const WARM_COLORS = [new THREE.Color('#FF6B35'), new THREE.Color('#FFD166')];
const COLD_COLORS = [new THREE.Color('#118AB2'), new THREE.Color('#073B4C')];

function getCurrentPath(current: OceanCurrent, depthMode: boolean): THREE.CatmullRomCurve3 {
  const points = current.controlPoints.map(([x, _y, z]) => {
    const scale = 0.5;
    const yOffset = depthMode
      ? (current.depth / 4000) * -40
      : 0;
    return new THREE.Vector3(x * scale, yOffset, z * scale);
  });
  if (points.length < 2) {
    points.push(points[0].clone().add(new THREE.Vector3(1, 0, 0)));
  }
  return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
}

function createEarthSphere(): THREE.Group {
  const group = new THREE.Group();

  const earthGeo = new THREE.SphereGeometry(48, 64, 64);
  const earthMat = new THREE.MeshBasicMaterial({
    color: 0x0a1a3a,
    transparent: true,
    opacity: 0.6,
  });
  const earth = new THREE.Mesh(earthGeo, earthMat);
  group.add(earth);

  const wireGeo = new THREE.SphereGeometry(48.1, 32, 32);
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x1a3a6a,
    wireframe: true,
    transparent: true,
    opacity: 0.15,
  });
  const wire = new THREE.Mesh(wireGeo, wireMat);
  group.add(wire);

  const landGeo = new THREE.SphereGeometry(48.3, 64, 64);
  const landMat = new THREE.MeshBasicMaterial({
    color: 0x0d2847,
    transparent: true,
    opacity: 0.4,
  });
  const land = new THREE.Mesh(landGeo, landMat);
  group.add(land);

  return group;
}

function createDepthPlanes(): THREE.Group {
  const group = new THREE.Group();
  const depths = [
    { y: 0, label: '0m' },
    { y: -10, label: '200m' },
    { y: -20, label: '1000m' },
    { y: -40, label: '4000m' },
  ];

  depths.forEach(({ y }) => {
    const geo = new THREE.PlaneGeometry(200, 120);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x4a4a6a,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const plane = new THREE.Mesh(geo, mat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = y;
    plane.visible = false;
    plane.userData.isDepthPlane = true;
    group.add(plane);
  });

  return group;
}

interface SceneViewProps {
  containerRef?: React.RefObject<HTMLDivElement>;
}

export default function SceneView({ containerRef }: SceneViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const particleDataRef = useRef<ParticleData[]>([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const frameIdRef = useRef<number>(0);
  const depthPlanesRef = useRef<THREE.Group | null>(null);
  const clockRef = useRef(new THREE.Clock());
  const prevTimeRef = useRef(1);
  const transitionProgressRef = useRef(1);
  const transitionFromRef = useRef(1);
  const transitionToRef = useRef(1);

  const currentTime = useStore((s) => s.currentTime);
  const depthMode = useStore((s) => s.depthMode);
  const setSelectedFlow = useStore((s) => s.setSelectedFlow);
  const setSelectedDepthLayer = useStore((s) => s.setSelectedDepthLayer);
  const setDepthStats = useStore((s) => s.setDepthStats);
  const setDepthStatsVisible = useStore((s) => s.setDepthStatsVisible);

  const createParticles = useCallback(() => {
    const totalParticles = 3000;
    const positions = new Float32Array(totalParticles * 3);
    const colors = new Float32Array(totalParticles * 3);
    const sizes = new Float32Array(totalParticles);
    const particleData: ParticleData[] = [];

    let idx = 0;
    const particlesPerCurrent = Math.floor(totalParticles / OCEAN_CURRENTS.length);

    OCEAN_CURRENTS.forEach((current) => {
      const count = particlesPerCurrent;
      for (let i = 0; i < count; i++) {
        const progress = Math.random();
        const path = getCurrentPath(current, false);
        const point = path.getPoint(progress);

        const spread = 0.8;
        const offset = new THREE.Vector3(
          (Math.random() - 0.5) * spread * 2,
          (Math.random() - 0.5) * spread * 0.5,
          (Math.random() - 0.5) * spread * 2
        );

        positions[idx * 3] = point.x + offset.x;
        positions[idx * 3 + 1] = point.y + offset.y;
        positions[idx * 3 + 2] = point.z + offset.z;

        const t = Math.random();
        const color = current.type === 'warm'
          ? lerpColor(WARM_COLORS[0], WARM_COLORS[1], t)
          : lerpColor(COLD_COLORS[0], COLD_COLORS[1], t);

        colors[idx * 3] = color.r;
        colors[idx * 3 + 1] = color.g;
        colors[idx * 3 + 2] = color.b;

        sizes[idx] = 2 + Math.random() * 6;

        particleData.push({
          current,
          progress,
          speed: 0.5 + Math.random() * 1.5,
          baseSize: sizes[idx],
          offset,
        });

        idx++;
      }
    });

    while (idx < totalParticles) {
      positions[idx * 3] = 0;
      positions[idx * 3 + 1] = 0;
      positions[idx * 3 + 2] = 0;
      colors[idx * 3] = 0.1;
      colors[idx * 3 + 1] = 0.1;
      colors[idx * 3 + 2] = 0.3;
      sizes[idx] = 0;
      particleData.push({
        current: OCEAN_CURRENTS[0],
        progress: 0,
        speed: 0,
        baseSize: 0,
        offset: new THREE.Vector3(),
      });
      idx++;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_PointSize = clamp(gl_PointSize, 1.0, 20.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    particleDataRef.current = particleData;

    return points;
  }, []);

  const handleClick = useCallback((event: MouseEvent) => {
    if (!canvasRef.current || !cameraRef.current || !particlesRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    raycasterRef.current.params.Points!.threshold = 0.8;

    const intersects = raycasterRef.current.intersectObject(particlesRef.current);
    if (intersects.length > 0) {
      const idx = intersects[0].index!;
      const data = particleDataRef.current[idx];
      if (data) {
        const month = useStore.getState().currentTime;
        const speed = data.current.seasonalSpeedVariation[month - 1];
        const temp = data.current.seasonalTempVariation[month - 1];
        setSelectedFlow({
          name: data.current.name,
          nameEn: data.current.nameEn,
          speed,
          temperature: temp,
          type: data.current.type,
          depth: data.current.depth,
        });
      }
    } else {
      setSelectedFlow(null);
    }
  }, [setSelectedFlow]);

  const handleDepthPlaneClick = useCallback((event: MouseEvent) => {
    if (!depthMode || !cameraRef.current || !depthPlanesRef.current) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const planes = depthPlanesRef.current.children.filter(c => c.userData.isDepthPlane && c.visible);
    const intersects = raycasterRef.current.intersectObjects(planes);

    if (intersects.length > 0) {
      const y = intersects[0].object.position.y;
      let layerIdx = 0;
      if (y === 0) layerIdx = 0;
      else if (y === -10) layerIdx = 1;
      else if (y === -20) layerIdx = 2;
      else layerIdx = 3;

      const layer = DEPTH_LAYERS[layerIdx] || DEPTH_LAYERS[0];
      const currentsInLayer = OCEAN_CURRENTS.filter((c) => c.depth >= layer.min && c.depth < layer.max);
      const density = currentsInLayer.length;
      const avgSpeed = density > 0
        ? currentsInLayer.reduce((sum, c) => sum + c.baseSpeed, 0) / density
        : 0;
      const dominantDirection = currentsInLayer.length > 0
        ? (currentsInLayer[0].type === 'warm' ? '东向' : '西向')
        : '无数据';

      setSelectedDepthLayer(layerIdx);
      setDepthStats({ density, avgSpeed, dominantDirection });
      setDepthStatsVisible(true);
    }
  }, [depthMode, setSelectedDepthLayer, setDepthStats, setDepthStatsVisible]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a2e);
    scene.fog = new THREE.FogExp2(0x0a0a2e, 0.003);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    );
    camera.position.set(30, 40, 60);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 200;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0x334466, 0.5);
    scene.add(ambientLight);

    const earthGroup = createEarthSphere();
    scene.add(earthGroup);

    const particles = createParticles();
    scene.add(particles);
    particlesRef.current = particles;

    const depthPlanes = createDepthPlanes();
    scene.add(depthPlanes);
    depthPlanesRef.current = depthPlanes;

    const starGeo = new THREE.BufferGeometry();
    const starCount = 2000;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 400;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 400;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 400;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x8888cc,
      size: 0.3,
      transparent: true,
      opacity: 0.6,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('click', handleDepthPlaneClick);

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const clock = new THREE.Clock();
    clockRef.current = clock;

    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      controls.update();

      if (particlesRef.current && particleDataRef.current.length > 0) {
        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
        const colors = particlesRef.current.geometry.attributes.color.array as Float32Array;
        const sizes = particlesRef.current.geometry.attributes.size.array as Float32Array;
        const store = useStore.getState();
        const currentMonth = store.currentTime;
        const isDepthMode = store.depthMode;

        if (prevTimeRef.current !== currentMonth) {
          transitionFromRef.current = prevTimeRef.current;
          transitionToRef.current = currentMonth;
          transitionProgressRef.current = 0;
          prevTimeRef.current = currentMonth;
        }

        if (transitionProgressRef.current < 1) {
          transitionProgressRef.current = Math.min(1, transitionProgressRef.current + delta / 0.5);
        }

        const eased = transitionProgressRef.current < 1
          ? 1 - Math.pow(1 - transitionProgressRef.current, 3)
          : 1;

        const monthFrom = transitionFromRef.current;
        const monthTo = transitionToRef.current;

        for (let i = 0; i < particleDataRef.current.length; i++) {
          const pd = particleDataRef.current[i];
          const fromSpeed = pd.current.seasonalSpeedVariation[monthFrom - 1];
          const toSpeed = pd.current.seasonalSpeedVariation[monthTo - 1];
          const currentSpeed = fromSpeed + (toSpeed - fromSpeed) * eased;
          const normalizedSpeed = currentSpeed / 2;

          pd.progress += delta * pd.speed * normalizedSpeed * 0.05;
          if (pd.progress > 1) pd.progress -= 1;
          if (pd.progress < 0) pd.progress += 1;

          const path = getCurrentPath(pd.current, isDepthMode);
          const point = path.getPoint(pd.progress);

          const spread = isDepthMode ? 0.4 : 0.8;
          const ySpread = isDepthMode ? 0.2 : 0.5;
          positions[i * 3] = point.x + pd.offset.x * spread;
          positions[i * 3 + 1] = point.y + pd.offset.y * ySpread;
          positions[i * 3 + 2] = point.z + pd.offset.z * spread;

          const fromTemp = pd.current.seasonalTempVariation[monthFrom - 1];
          const toTemp = pd.current.seasonalTempVariation[monthTo - 1];
          const currentTemp = fromTemp + (toTemp - fromTemp) * eased;
          const tempNorm = Math.max(0, Math.min(1, (currentTemp + 5) / 35));

          if (pd.current.type === 'warm') {
            const c = lerpColor(WARM_COLORS[0], WARM_COLORS[1], tempNorm);
            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
          } else {
            const c = lerpColor(COLD_COLORS[1], COLD_COLORS[0], tempNorm);
            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
          }

          sizes[i] = pd.baseSize;
        }

        particlesRef.current.geometry.attributes.position.needsUpdate = true;
        particlesRef.current.geometry.attributes.color.needsUpdate = true;
        particlesRef.current.geometry.attributes.size.needsUpdate = true;
      }

      if (depthPlanesRef.current) {
        depthPlanesRef.current.children.forEach((plane) => {
          if (plane.userData.isDepthPlane) {
            plane.visible = depthMode;
          }
        });
      }

      stars.rotation.y += delta * 0.002;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameIdRef.current);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('click', handleDepthPlaneClick);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      scene.clear();
    };
  }, [createParticles, handleClick, handleDepthPlaneClick, depthMode]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        cursor: 'grab',
      }}
    />
  );
}
