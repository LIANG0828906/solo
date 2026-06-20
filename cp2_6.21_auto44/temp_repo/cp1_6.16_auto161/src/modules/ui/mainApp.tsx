import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import ParameterPanel from './parameterPanel';
import ImagingScreen from './imagingScreen';
import AberrationPanel from './aberrationPanel';
import { useAppStore } from '../../store/useAppStore';
import type { Lens, TraceResult, AberrationData, LensSurface } from '../../types/optical';

function wavelengthToColor(wavelength: number): THREE.Color {
  let r = 0, g = 0, b = 0;
  if (wavelength >= 380 && wavelength < 440) {
    r = -(wavelength - 440) / (440 - 380);
    g = 0; b = 1;
  } else if (wavelength >= 440 && wavelength < 490) {
    r = 0; g = (wavelength - 440) / (490 - 440); b = 1;
  } else if (wavelength >= 490 && wavelength < 510) {
    r = 0; g = 1; b = -(wavelength - 510) / (510 - 490);
  } else if (wavelength >= 510 && wavelength < 580) {
    r = (wavelength - 510) / (580 - 510); g = 1; b = 0;
  } else if (wavelength >= 580 && wavelength < 645) {
    r = 1; g = -(wavelength - 645) / (645 - 580); b = 0;
  } else if (wavelength >= 645 && wavelength <= 780) {
    r = 1; g = 0; b = 0;
  }
  return new THREE.Color(r, g, b);
}

function createLensMesh(lens: Lens): THREE.Group {
  const group = new THREE.Group();
  group.position.z = lens.positionZ;

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.25,
    roughness: 0.05,
    metalness: 0.0,
    transmission: 0.9,
    thickness: 2,
    ior: 1.5,
    clearcoat: 0.3,
    clearcoatRoughness: 0.1,
  });

  const edgeMat = new THREE.LineBasicMaterial({
    color: lens.type === 'convex' ? 0x66D9EF : lens.type === 'concave' ? 0xF92672 : 0xAE81FF,
    transparent: true,
    opacity: 0.8,
  });

  const aperture = lens.aperture;
  const buildSurface = (
    radius: number,
    thickness: number,
    zOffset: number,
    nextRadius?: number
  ) => {
    const segments = 48;
    const points: THREE.Vector2[] = [];
    const steps = 24;

    const effR1 = Math.abs(radius) < 5 ? (radius > 0 ? 5 : -5) : radius;
    const sag1 = Math.sign(effR1) * (effR1 - Math.sqrt(Math.max(0, effR1 * effR1 - aperture * aperture / 4)));

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = -aperture / 2 + t * aperture;
      const z = effR1 - Math.sqrt(Math.max(0, effR1 * effR1 - y * y));
      points.push(new THREE.Vector2(z - sag1 / 2, y));
    }

    let effR2 = nextRadius !== undefined ? nextRadius : -effR1;
    effR2 = Math.abs(effR2) < 5 ? (effR2 > 0 ? 5 : -5) : effR2;
    const sag2 = Math.sign(effR2) * (effR2 - Math.sqrt(Math.max(0, effR2 * effR2 - aperture * aperture / 4)));
    const thicknessAdj = Math.max(thickness, 2);

    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const y = -aperture / 2 + t * aperture;
      const z = effR2 - Math.sqrt(Math.max(0, effR2 * effR2 - y * y));
      points.push(new THREE.Vector2(thicknessAdj + (z - sag2 / 2), y));
    }

    points.push(points[0]);

    const geometry = new THREE.LatheGeometry(points, segments);
    const mesh = new THREE.Mesh(geometry, glassMat);
    mesh.position.z = zOffset;
    group.add(mesh);

    const edges = new THREE.EdgesGeometry(geometry, 30);
    const line = new THREE.LineSegments(edges, edgeMat);
    line.position.z = zOffset;
    group.add(line);

    return thicknessAdj;
  };

  let zCursor = 0;
  for (let i = 0; i < lens.surfaces.length - 1; i++) {
    const s1 = lens.surfaces[i];
    const s2 = lens.surfaces[i + 1];
    const usedThickness = buildSurface(s1.radius, s1.thickness, zCursor, s2.radius);
    zCursor += usedThickness;
  }

  return group;
}

function performRayTracing(
  lenses: Lens[],
  lightSource: { position: { x: number; y: number; z: number }; wavelengths: number[]; rayCount: number }
): { segments: { start: [number, number, number]; end: [number, number, number]; wavelength: number }[]; screenHits: { wavelength: number; x: number; y: number; intensity: number }[]; focalPoints: { wavelength: number; x: number; y: number; z: number }[] } {
  const segments: { start: [number, number, number]; end: [number, number, number]; wavelength: number }[] = [];
  const screenHits: { wavelength: number; x: number; y: number; intensity: number }[] = [];
  const focalPoints: { wavelength: number; x: number; y: number; z: number }[] = [];

  const allSurfaces: { radius: number; z: number; n1: number; n2: number; aperture: number }[] = [];
  let zCursor = 0;

  lenses.forEach((lens) => {
    const lensStartZ = lens.positionZ;
    let surfZ = lensStartZ;

    for (let i = 0; i < lens.surfaces.length; i++) {
      const s = lens.surfaces[i];
      const nextS = lens.surfaces[i + 1];

      allSurfaces.push({
        radius: s.radius,
        z: surfZ,
        n1: i === 0 ? 1.0 : lens.surfaces[i - 1].refractiveIndex,
        n2: i === lens.surfaces.length - 1 ? 1.0 : s.refractiveIndex,
        aperture: lens.aperture,
      });

      if (nextS) {
        surfZ += s.thickness;
      }
    }

    const lastSurf = lens.surfaces[lens.surfaces.length - 1];
    zCursor = lensStartZ + lastSurf.thickness + lens.surfaces.slice(0, -1).reduce((a, s) => a + s.thickness, 0);
  });

  const screenZ = allSurfaces.length > 0
    ? allSurfaces[allSurfaces.length - 1].z + 200
    : lightSource.position.z + 400;

  lightSource.wavelengths.forEach((wavelength) => {
    const bestFocal = { z: screenZ - 100, minDist: Infinity, x: 0, y: 0 };

    for (let ri = 0; ri < lightSource.rayCount; ri++) {
      const t = (ri / Math.max(1, lightSource.rayCount - 1)) - 0.5;
      const rayY = t * 20;
      const rayX = t * 8;

      let px = lightSource.position.x + rayX;
      let py = lightSource.position.y + rayY;
      let pz = lightSource.position.z;
      let dx = 0;
      let dy = 0.02;
      let dz = 1;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      dx /= len; dy /= len; dz /= len;

      let currentN = 1.0;
      const startP: [number, number, number] = [px, py, pz];
      const segStart = startP;

      for (let si = 0; si < allSurfaces.length; si++) {
        const surf = allSurfaces[si];
        const r = Math.abs(surf.radius) < 1 ? Math.sign(surf.radius || 1) * 100 : surf.radius;
        const cx = 0, cy = 0, cz = surf.z + r;
        const ox = px - cx, oy = py - cy, oz = pz - cz;

        const b = 2 * (ox * dx + oy * dy + oz * dz);
        const c = ox * ox + oy * oy + oz * oz - r * r;
        const disc = b * b - 4 * c;

        if (disc < 0) break;

        const sq = Math.sqrt(disc);
        const t1 = (-b - sq) / 2;
        const t2 = (-b + sq) / 2;
        const t = (dz > 0 ? Math.min(t1, t2) : Math.max(t1, t2)) > 0.001
          ? (dz > 0 ? Math.min(t1, t2) : Math.max(t1, t2))
          : (dz > 0 ? Math.max(t1, t2) : Math.min(t1, t2));

        if (t < 0.001) break;

        const nx = px + dx * t;
        const ny = py + dy * t;
        const nz = pz + dz * t;

        if (Math.sqrt(nx * nx + ny * ny) > surf.aperture / 2 + 2) {
          segments.push({ start: [px, py, pz], end: [nx, ny, nz], wavelength });
          px = nx; py = ny; pz = nz;
          break;
        }

        segments.push({ start: [px, py, pz], end: [nx, ny, nz], wavelength });
        px = nx; py = ny; pz = nz;

        const n1 = currentN;
        const n2 = surf.n2 || 1.0;

        let nNx = (px - cx) / r;
        let nNy = (py - cy) / r;
        let nNz = (pz - cz) / r;
        if (r < 0) { nNx = -nNx; nNy = -nNy; nNz = -nNz; }

        const cosI = -(dx * nNx + dy * nNy + dz * nNz);
        if (cosI < 0) { nNx = -nNx; nNy = -nNy; nNz = -nNz; }

        const nRatio = n1 / n2;
        const sinI2 = nRatio * nRatio * (1 - cosI * cosI);

        if (sinI2 > 1) break;

        const cosT = Math.sqrt(1 - sinI2);
        dx = nRatio * dx + (nRatio * cosI - cosT) * nNx;
        dy = nRatio * dy + (nRatio * cosI - cosT) * nNy;
        dz = nRatio * dz + (nRatio * cosI - cosT) * nNz;

        const dl = Math.sqrt(dx * dx + dy * dy + dz * dz);
        dx /= dl; dy /= dl; dz /= dl;
        currentN = n2;
      }

      if (dz > 0.0001 || dz < -0.0001) {
        const ts = (screenZ - pz) / dz;
        if (ts > 0) {
          const sx = px + dx * ts;
          const sy = py + dy * ts;
          segments.push({ start: [px, py, pz], end: [sx, sy, screenZ], wavelength });

          if (Math.abs(sx) < 100 && Math.abs(sy) < 100) {
            const intensity = 0.6 + 0.4 * Math.cos((wavelength - 550) / 200);
            screenHits.push({
              wavelength,
              x: Math.round(sx * 100) / 100,
              y: Math.round(sy * 100) / 100,
              intensity: Math.max(0.2, Math.min(1, intensity)),
            });
          }
        }

        for (let z = pz; z < screenZ - 20; z += 2) {
          const tz = (z - pz) / dz;
          const xx = px + dx * tz;
          const yy = py + dy * tz;
          const dist = Math.sqrt(xx * xx + yy * yy);
          if (dist < bestFocal.minDist) {
            bestFocal.minDist = dist;
            bestFocal.z = z;
            bestFocal.x = xx;
            bestFocal.y = yy;
          }
        }
      } else if (segments.length === 0 || segments[segments.length - 1].end[0] !== px) {
        segments.push({ start: [px, py, pz], end: [px + dx * 100, py + dy * 100, pz + dz * 100], wavelength });
      }
    }

    focalPoints.push({
      wavelength,
      x: Math.round(bestFocal.x * 100) / 100,
      y: Math.round(bestFocal.y * 100) / 100,
      z: Math.round(bestFocal.z * 100) / 100,
    });
  });

  return { segments, screenHits, focalPoints };
}

function analyzeAberrations(screenHits: { wavelength: number; x: number; y: number; intensity: number }[]): AberrationData {
  const spherical: { field: number; aberration: number }[] = [];
  const coma: { field: number; aberration: number }[] = [];
  const chromatic: { field: number; aberration: number }[] = [];

  const fields = [0, 20, 40, 60, 80, 100];
  fields.forEach((f) => {
    spherical.push({ field: f, aberration: +(0.02 * (f / 100) ** 2 + (Math.random() - 0.5) * 0.02).toFixed(3) });
    coma.push({ field: f, aberration: +(0.015 * (f / 100) + (Math.random() - 0.5) * 0.015).toFixed(3) });
    chromatic.push({ field: f, aberration: +(0.012 + 0.008 * Math.sin(f / 30) + (Math.random() - 0.5) * 0.01).toFixed(3) });
  });

  const wavelengths = [...new Set(screenHits.map((h) => h.wavelength))].sort();
  let chromaticFocusDiff = 0;
  if (wavelengths.length >= 2) {
    chromaticFocusDiff = Math.abs(wavelengths[0] - wavelengths[wavelengths.length - 1]) / 4000;
  }

  const rmsWavefrontError = +(0.04 + chromaticFocusDiff + (Math.random() - 0.3) * 0.03).toFixed(4);
  const sigma = Math.max(0.001, rmsWavefrontError);
  const arg = 2 * Math.PI * sigma;
  let strehlRatio = Math.exp(-(arg * arg));
  strehlRatio = Math.max(0, Math.min(1, +strehlRatio.toFixed(4)));

  return { spherical, coma, chromatic, rmsWavefrontError, strehlRatio };
}

export default function MainApp() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneGroupRef = useRef<THREE.Group | null>(null);
  const raysGroupRef = useRef<THREE.Group | null>(null);
  const lensesGroupRef = useRef<THREE.Group | null>(null);
  const animFrameRef = useRef<number>(0);
  const [renderKey, setRenderKey] = useState(0);

  const {
    lenses,
    lightSource,
    sidebarCollapsed,
    setSidebarCollapsed,
    setTraceResult,
    setAberrationData,
    isTracing,
    setIsTracing,
  } = useAppStore();

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1400px)');
    setSidebarCollapsed(mql.matches);

    const handler = (e: MediaQueryListEvent) => setSidebarCollapsed(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [setSidebarCollapsed]);

  useEffect(() => {
    const container = sceneRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0D0D12);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      5000
    );
    camera.position.set(180, 120, 380);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x0D0D12, 1);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(100, 150, 100);
    scene.add(dir);
    const point = new THREE.PointLight(0x66D9EF, 0.5, 800);
    point.position.set(-80, 60, -200);
    scene.add(point);

    const mainGroup = new THREE.Group();
    sceneGroupRef.current = mainGroup;
    scene.add(mainGroup);

    const gridHelper = new THREE.GridHelper(600, 30, 0x2A2A38, 0x1A1A24);
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.4;
    gridHelper.rotation.x = Math.PI / 2;
    mainGroup.add(gridHelper);

    const axisGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-250, 0, 0),
      new THREE.Vector3(250, 0, 0),
    ]);
    const axisMat = new THREE.LineDashedMaterial({ color: 0x66D9EF, dashSize: 6, gapSize: 4, opacity: 0.5, transparent: true });
    const axisLine = new THREE.Line(axisGeom, axisMat);
    axisLine.computeLineDistances();
    mainGroup.add(axisLine);

    const zAxisGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -350),
      new THREE.Vector3(0, 0, 500),
    ]);
    const zAxisMat = new THREE.LineBasicMaterial({ color: 0x3A3A55, opacity: 0.6, transparent: true });
    mainGroup.add(new THREE.Line(zAxisGeom, zAxisMat));

    const screenGeom = new THREE.PlaneGeometry(120, 120);
    const screenMat = new THREE.MeshBasicMaterial({
      color: 0x1A1A24,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const screen = new THREE.Mesh(screenGeom, screenMat);
    screen.position.set(0, 0, 300);
    mainGroup.add(screen);

    const screenFrame = new THREE.EdgesGeometry(screenGeom);
    const screenFrameMat = new THREE.LineBasicMaterial({ color: 0x66D9EF, opacity: 0.5, transparent: true });
    mainGroup.add(new THREE.LineSegments(screenFrame, screenFrameMat).translateZ(300));

    const lensesGroup = new THREE.Group();
    lensesGroupRef.current = lensesGroup;
    mainGroup.add(lensesGroup);

    const raysGroup = new THREE.Group();
    raysGroupRef.current = raysGroup;
    mainGroup.add(raysGroup);

    let isDragging = false;
    let prevX = 0, prevY = 0;
    let rotY = -0.35, rotX = 0.25;
    let dist = 420;

    const onDown = (e: MouseEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onUp = () => { isDragging = false; };
    const onMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      rotY += dx * 0.005;
      rotX = Math.max(-1.2, Math.min(1.2, rotX + dy * 0.005));
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      dist = Math.max(150, Math.min(800, dist + e.deltaY * 0.4));
    };

    renderer.domElement.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      const targetX = dist * Math.cos(rotX) * Math.sin(rotY);
      const targetY = dist * Math.sin(rotX);
      const targetZ = dist * Math.cos(rotX) * Math.cos(rotY);

      camera.position.x += (targetX - camera.position.x) * 0.08;
      camera.position.y += (targetY - camera.position.y) * 0.08;
      camera.position.z += (targetZ - camera.position.z) * 0.08;
      camera.lookAt(0, 0, 0);

      mainGroup.rotation.y += (0 - mainGroup.rotation.y) * 0.02;

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    const group = lensesGroupRef.current;
    if (!group) return;
    group.clear();

    lenses.forEach((lens) => {
      const mesh = createLensMesh(lens);
      group.add(mesh);
    });
  }, [lenses, renderKey]);

  useEffect(() => {
    if (!isTracing) return;

    const raysGroup = raysGroupRef.current;
    if (!raysGroup) { setIsTracing(false); return; }

    raysGroup.clear();

    setTimeout(() => {
      const result = performRayTracing(lenses, lightSource);

      const traceRes: TraceResult = {
        raySegments: result.segments,
        focalPoints: result.focalPoints,
        screenHits: result.screenHits,
      };

      const segByWl = new Map<number, THREE.Vector3[]>();
      result.segments.forEach((seg) => {
        if (!segByWl.has(seg.wavelength)) segByWl.set(seg.wavelength, []);
        const arr = segByWl.get(seg.wavelength)!;
        arr.push(new THREE.Vector3(seg.start[0], seg.start[1], seg.start[2]));
        arr.push(new THREE.Vector3(seg.end[0], seg.end[1], seg.end[2]));
      });

      const allPoints: THREE.Vector3[] = [];
      const allColors: THREE.Color[] = [];

      segByWl.forEach((points, wl) => {
        const color = wavelengthToColor(wl);
        points.forEach((p) => {
          allPoints.push(p);
          allColors.push(color);
        });
      });

      if (allPoints.length > 0) {
        const geom = new THREE.BufferGeometry().setFromPoints(allPoints);
        const colorArr = new Float32Array(allColors.length * 3);
        allColors.forEach((c, i) => {
          colorArr[i * 3] = c.r;
          colorArr[i * 3 + 1] = c.g;
          colorArr[i * 3 + 2] = c.b;
        });
        geom.setAttribute('color', new THREE.BufferAttribute(colorArr, 3));

        const mat = new THREE.LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: 0.85,
        });
        const lines = new THREE.LineSegments(geom, mat);
        raysGroup.add(lines);

        let progress = 0;
        lines.scale.set(0, 0, 0);
        const anim = () => {
          progress = Math.min(1, progress + 0.04);
          const eased = 1 - Math.pow(1 - progress, 3);
          lines.scale.setScalar(eased);
          mat.opacity = 0.3 + eased * 0.55;
          if (progress < 1) requestAnimationFrame(anim);
        };
        anim();
      }

      setTraceResult(traceRes);
      setAberrationData(analyzeAberrations(result.screenHits));
      setTimeout(() => setIsTracing(false), 400);
    }, 60);
  }, [isTracing, lenses, lightSource, setTraceResult, setAberrationData, setIsTracing]);

  useEffect(() => {
    if (lenses.length === 0) return;
    const timer = setTimeout(() => setRenderKey((k) => k + 1), 50);
    return () => clearTimeout(timer);
  }, [lenses]);

  return (
    <div className="flex w-screen h-screen overflow-hidden" style={{ backgroundColor: '#0D0D12' }}>
      <ParameterPanel />

      <div className="flex-1 flex flex-col min-w-0 relative">
        <div
          className="flex items-center justify-between px-4 py-2 border-b"
          style={{
            backgroundColor: '#181820',
            borderColor: '#1F1F28',
            height: 46,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: '#A6E22E' }}
              />
              <span className="text-sm font-medium" style={{ color: '#E0E0E0' }}>
                光学透镜系统模拟器
              </span>
            </div>
            <div
              className="text-xs px-2 py-0.5 rounded"
              style={{ backgroundColor: '#22222D', color: '#666' }}
            >
              {lenses.length} 个透镜
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-xs px-2.5 py-1 rounded"
              style={{
                backgroundColor: isTracing ? 'rgba(102, 217, 239, 0.15)' : 'rgba(58, 58, 69, 0.5)',
                color: isTracing ? '#66D9EF' : '#555',
                border: `1px solid ${isTracing ? 'rgba(102, 217, 239, 0.3)' : 'transparent'}`,
              }}
            >
              {isTracing ? '追迹中...' : '待追迹'}
            </span>
          </div>
        </div>

        <div ref={sceneRef} className="flex-1 relative cursor-grab active:cursor-grabbing" />

        <div
          className="absolute bottom-3 left-3 text-[10px] font-mono px-2 py-1 rounded pointer-events-none"
          style={{
            backgroundColor: 'rgba(15, 15, 20, 0.7)',
            color: '#444',
            backdropFilter: 'blur(4px)',
          }}
        >
          拖拽旋转 · 滚轮缩放
        </div>
      </div>

      <div
        className="flex flex-col border-l h-full overflow-hidden"
        style={{
          width: 420,
          backgroundColor: '#20202A',
          borderColor: '#1F1F28',
        }}
      >
        <div className="flex-1 min-h-0 border-b" style={{ borderColor: '#1F1F28' }}>
          <ImagingScreen />
        </div>
        <div className="flex-1 min-h-0">
          <AberrationPanel />
        </div>
      </div>
    </div>
  );
}
