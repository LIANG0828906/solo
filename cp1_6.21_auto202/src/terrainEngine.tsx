import React, { createContext, useContext, useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface Marker {
  id: string;
  x: number;
  z: number;
  y: number;
  label: string;
  createdAt: string;
}

interface FaultLine {
  id: string;
  start: { x: number; z: number };
  end: { x: number; z: number };
  width: number;
}

interface TerrainContextType {
  mousePosition: { x: number; z: number };
  excavatedCount: number;
  markers: Marker[];
  activeTool: 'brush' | 'marker' | null;
  setActiveTool: (tool: 'brush' | 'marker' | null) => void;
  addMarker: (x: number, z: number, label: string) => Marker;
  removeMarker: (id: string) => void;
  flyToMarker: (id: string, duration?: number) => void;
  resetTerrain: () => Promise<void>;
  getTerrainHeight: (x: number, z: number) => number;
}

const TerrainContext = createContext<TerrainContextType | null>(null);

export const useTerrainContext = () => {
  const context = useContext(TerrainContext);
  if (!context) {
    throw new Error('useTerrainContext must be used within TerrainProvider');
  }
  return context;
};

function perlin2(x: number, y: number): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const u = fade(xf);
  const v = fade(yf);
  const aa = hash(X + hash(Y));
  const ab = hash(X + hash(Y + 1));
  const ba = hash(X + 1 + hash(Y));
  const bb = hash(X + 1 + hash(Y + 1));
  const x1 = lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u);
  const x2 = lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u);
  return lerp(x1, x2, v);
}

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}

function hash(n: number): number {
  return ((Math.sin(n) * 43758.5453) % 1) * 2 - 1;
}

function grad(hash: number, x: number, y: number): number {
  const h = Math.floor(hash * 4) & 3;
  const u = h < 2 ? x : y;
  const v = h < 2 ? y : x;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0, g: 0, b: 0 };
}

function getPointToLineDistance(
  px: number,
  pz: number,
  start: { x: number; z: number },
  end: { x: number; z: number }
): number {
  const A = px - start.x;
  const B = pz - start.z;
  const C = end.x - start.x;
  const D = end.z - start.z;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = lenSq !== 0 ? dot / lenSq : -1;
  let xx, zz;
  if (param < 0) {
    xx = start.x;
    zz = start.z;
  } else if (param > 1) {
    xx = end.x;
    zz = end.z;
  } else {
    xx = start.x + param * C;
    zz = start.z + param * D;
  }
  const dx = px - xx;
  const dz = pz - zz;
  return Math.sqrt(dx * dx + dz * dz);
}

interface FadingFace {
  faceIndex: number;
  startTime: number;
  duration: number;
  opacity: number;
}

interface TerrainProviderProps {
  children: React.ReactNode;
}

export const TerrainProvider: React.FC<TerrainProviderProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const gridHelperRef = useRef<THREE.LineSegments | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const originalIndicesRef = useRef<Uint32Array | null>(null);
  const excavatedFacesRef = useRef<Set<number>>(new Set());
  const fadingFacesRef = useRef<Map<number, FadingFace>>(new Map());
  const faceOpacityRef = useRef<Float32Array | null>(null);
  const animationIdRef = useRef<number>(0);
  const isMouseDownRef = useRef(false);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const markersGroupRef = useRef<THREE.Group | null>(null);
  const markerObjectsRef = useRef<Map<string, { group: THREE.Group; label: string }>>(new Map());
  const layersGroupRef = useRef<THREE.Group | null>(null);
  const faultLinesRef = useRef<THREE.LineSegments[]>([]);
  const faultDataRef = useRef<FaultLine[]>([]);
  const showFaultTipRef = useRef<{ show: boolean; x: number; y: number; message: string; timeout: number } | null>(null);
  const heightmapRef = useRef<number[][]>([]);
  const brushRadius = useRef(2);

  const [mousePosition, setMousePosition] = useState({ x: 0, z: 0 });
  const [excavatedCount, setExcavatedCount] = useState(0);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [activeTool, setActiveToolState] = useState<'brush' | 'marker' | null>(null);
  const [, forceUpdate] = useState(0);

  const faultTipCallback = useRef<((tip: { show: boolean; x: number; y: number; message: string } | null) => void) | null>(null);

  const setFaultTipCallback = useCallback((cb: (tip: { show: boolean; x: number; y: number; message: string } | null) => void) => {
    faultTipCallback.current = cb;
  }, []);

  const generateHeightmap = useCallback(() => {
    const size = 64;
    const heightmap: number[][] = [];
    for (let i = 0; i < size; i++) {
      const row: number[] = [];
      for (let j = 0; j < size; j++) {
        const nx = i / size - 0.5;
        const nz = j / size - 0.5;
        const elevation =
          perlin2(nx * 4, nz * 4) * 3 +
          perlin2(nx * 8 + 1.5, nz * 8 + 0.8) * 1.5 +
          perlin2(nx * 2 + nz * 2, nx * 2 - nz * 2) * 2;
        const height = 8 + elevation + Math.random() * 0.3;
        row.push(Math.max(2, Math.min(15, height)));
      }
      heightmap.push(row);
    }
    return heightmap;
  }, []);

  const getTerrainHeight = useCallback(
    (x: number, z: number): number => {
      const heightmap = heightmapRef.current;
      if (heightmap.length === 0) return 0;
      const size = heightmap.length;
      const gx = ((x + 30) / 60) * (size - 1);
      const gz = ((z + 30) / 60) * (size - 1);
      const x0 = Math.floor(Math.max(0, Math.min(size - 1, gx)));
      const z0 = Math.floor(Math.max(0, Math.min(size - 1, gz)));
      const x1 = Math.min(size - 1, x0 + 1);
      const z1 = Math.min(size - 1, z0 + 1);
      const fx = gx - x0;
      const fz = gz - z0;
      const h00 = heightmap[z0][x0];
      const h10 = heightmap[z0][x1];
      const h01 = heightmap[z1][x0];
      const h11 = heightmap[z1][x1];
      return h00 * (1 - fx) * (1 - fz) + h10 * fx * (1 - fz) + h01 * (1 - fx) * fz + h11 * fx * fz;
    },
    []
  );

  const checkFaultLine = useCallback(
    (x: number, z: number): boolean => {
      for (const fault of faultDataRef.current) {
        const dist = getPointToLineDistance(x, z, fault.start, fault.end);
        if (dist < fault.width + brushRadius.current) {
          return true;
        }
      }
      return false;
    },
    []
  );

  const showFaultTip = useCallback((x: number, y: number) => {
    if (faultTipCallback.current) {
      faultTipCallback.current({
        show: true,
        x,
        y,
        message: '⚠️ 发现断层线！此处为地质活动带',
      });
    }
    if (showFaultTipRef.current) {
      clearTimeout(showFaultTipRef.current.timeout);
    }
    const timeout = window.setTimeout(() => {
      if (faultTipCallback.current) {
        faultTipCallback.current(null);
      }
      showFaultTipRef.current = null;
    }, 3000);
    showFaultTipRef.current = {
      show: true,
      x,
      y,
      message: '⚠️ 发现断层线！此处为地质活动带',
      timeout,
    };
  }, []);

  const excavateFaces = useCallback(
    (worldX: number, worldZ: number, screenX: number, screenY: number) => {
      const terrainMesh = terrainMeshRef.current;
      if (!terrainMesh || !terrainMesh.geometry) return;

      const geometry = terrainMesh.geometry as THREE.BufferGeometry;
      const positionAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
      const indexAttr = geometry.getIndex() as THREE.BufferAttribute;
      if (!positionAttr || !indexAttr) return;

      const indices = indexAttr.array as Uint32Array;
      const positions = positionAttr.array as Float32Array;
      const excavated = excavatedFacesRef.current;
      const fading = fadingFacesRef.current;
      const now = performance.now();
      const brushRadiusSq = brushRadius.current * brushRadius.current;

      const matrix = new THREE.Matrix4().copy(terrainMesh.matrixWorld);
      const invMatrix = new THREE.Matrix4().copy(matrix).invert();
      const localPoint = new THREE.Vector3(worldX, 0, worldZ).applyMatrix4(invMatrix);

      let hitFault = false;
      const facesToFade: number[] = [];

      for (let i = 0; i < indices.length; i += 3) {
        const faceIdx = i / 3;
        if (excavated.has(faceIdx) || fading.has(faceIdx)) continue;

        const i0 = indices[i] * 3;
        const i1 = indices[i + 1] * 3;
        const i2 = indices[i + 2] * 3;

        const cx = (positions[i0] + positions[i1] + positions[i2]) / 3;
        const cz = (positions[i0 + 2] + positions[i1 + 2] + positions[i2 + 2]) / 3;

        const dx = cx - localPoint.x;
        const dz = cz - localPoint.z;
        const distSq = dx * dx + dz * dz;

        if (distSq < brushRadiusSq) {
          const worldCx = cx * matrix.elements[0] + matrix.elements[12];
          const worldCz = cz * matrix.elements[10] + matrix.elements[14];
          
          if (checkFaultLine(worldCx, worldCz)) {
            hitFault = true;
          }

          facesToFade.push(faceIdx);
        }
      }

      facesToFade.forEach((faceIdx) => {
        fading.set(faceIdx, {
          faceIndex: faceIdx,
          startTime: now,
          duration: 300,
          opacity: 1,
        });
      });

      if (hitFault) {
        showFaultTip(screenX, screenY);
      }
    },
    [checkFaultLine, showFaultTip]
  );

  const updateTerrainIndices = useCallback(() => {
    const terrainMesh = terrainMeshRef.current;
    if (!terrainMesh || !terrainMesh.geometry) return;

    const geometry = terrainMesh.geometry as THREE.BufferGeometry;
    const originalIndices = originalIndicesRef.current;
    if (!originalIndices) return;

    const excavated = excavatedFacesRef.current;
    const fading = fadingFacesRef.current;
    const newIndices: number[] = [];

    for (let i = 0; i < originalIndices.length; i += 3) {
      const faceIdx = i / 3;
      if (!excavated.has(faceIdx) && !fading.has(faceIdx)) {
        newIndices.push(originalIndices[i], originalIndices[i + 1], originalIndices[i + 2]);
      }
    }

    geometry.setIndex(newIndices);
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }, []);

  const animateFading = useCallback(() => {
    const fading = fadingFacesRef.current;
    const excavated = excavatedFacesRef.current;
    const now = performance.now();
    const opacityAttr = faceOpacityRef.current;
    let needUpdate = false;

    fading.forEach((face, faceIdx) => {
      const elapsed = now - face.startTime;
      const progress = Math.min(1, elapsed / face.duration);
      const opacity = 1 - progress;
      face.opacity = opacity;

      if (opacityAttr) {
        const geometry = terrainMeshRef.current?.geometry as THREE.BufferGeometry;
        const indexAttr = geometry?.getIndex() as THREE.BufferAttribute;
        if (indexAttr) {
          const indices = indexAttr.array as Uint32Array;
          for (let i = 0; i < indices.length; i += 3) {
            const idx = i / 3;
            if (idx === faceIdx) {
              opacityAttr[indices[i]] = opacity;
              opacityAttr[indices[i] + 1] = opacity;
              opacityAttr[indices[i] + 2] = opacity;
              opacityAttr[indices[i + 1]] = opacity;
              opacityAttr[indices[i + 1] + 1] = opacity;
              opacityAttr[indices[i + 1] + 2] = opacity;
              opacityAttr[indices[i + 2]] = opacity;
              opacityAttr[indices[i + 2] + 1] = opacity;
              opacityAttr[indices[i + 2] + 2] = opacity;
              break;
            }
          }
        }
      }

      if (progress >= 1) {
        fading.delete(faceIdx);
        excavated.add(faceIdx);
        setExcavatedCount(excavated.size);
        needUpdate = true;
      }
    });

    if (needUpdate) {
      updateTerrainIndices();
      const material = terrainMeshRef.current?.material as THREE.MeshStandardMaterial;
      if (material) {
        material.needsUpdate = true;
      }
    }
  }, [updateTerrainIndices]);

  const restoreFaces = useCallback(async () => {
    const excavated = excavatedFacesRef.current;
    const faceArray = Array.from(excavated);
    const totalFaces = faceArray.length;

    for (let i = 0; i < totalFaces; i++) {
      const faceIdx = faceArray[i];
      excavated.delete(faceIdx);
      updateTerrainIndices();
      setExcavatedCount(excavated.size);
      if (i % 10 === 0) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
    }
    updateTerrainIndices();
    setExcavatedCount(0);
  }, [updateTerrainIndices]);

  const placeMarker = useCallback(
    (x: number, z: number, label: string): Marker => {
      const y = getTerrainHeight(x, z);
      const marker: Marker = {
        id: `marker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        x,
        z,
        y,
        label,
        createdAt: new Date().toISOString(),
      };

      const group = new THREE.Group();
      group.position.set(x, y, z);

      const cylinderGeo = new THREE.CylinderGeometry(0.15, 0.2, 1.2, 16);
      const cylinderMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        transparent: true,
        opacity: 0.8,
        metalness: 0.3,
        roughness: 0.5,
      });
      const cylinder = new THREE.Mesh(cylinderGeo, cylinderMat);
      cylinder.position.y = 0.6;
      group.add(cylinder);

      const sphereGeo = new THREE.SphereGeometry(0.3, 32, 32);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        metalness: 0.5,
        roughness: 0.3,
        emissive: 0xfacc15,
        emissiveIntensity: 0.2,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.y = 1.5;
      group.add(sphere);

      if (markersGroupRef.current) {
        markersGroupRef.current.add(group);
      }

      markerObjectsRef.current.set(marker.id, { group, label });
      setMarkers((prev) => [...prev, marker]);

      return marker;
    },
    [getTerrainHeight]
  );

  const removeMarker = useCallback((id: string) => {
    const markerObj = markerObjectsRef.current.get(id);
    if (markerObj && markersGroupRef.current) {
      markersGroupRef.current.remove(markerObj.group);
      markerObj.group.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    }
    markerObjectsRef.current.delete(id);
    setMarkers((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const flyToMarker = useCallback(
    (id: string, duration: number = 1200) => {
      const marker = markers.find((m) => m.id === id);
      if (!marker || !cameraRef.current || !controlsRef.current) return;

      const camera = cameraRef.current;
      const controls = controlsRef.current;
      const startPos = camera.position.clone();
      const startTarget = controls.target.clone();
      const endPos = new THREE.Vector3(marker.x + 8, marker.y + 6, marker.z + 8);
      const endTarget = new THREE.Vector3(marker.x, marker.y + 0.5, marker.z);

      const startTime = performance.now();

      const animateFly = () => {
        const elapsed = performance.now() - startTime;
        const t = Math.min(1, elapsed / duration);
        const eased = 1 - Math.pow(1 - t, 3);

        camera.position.lerpVectors(startPos, endPos, eased);
        controls.target.lerpVectors(startTarget, endTarget, eased);
        controls.update();

        if (t < 1) {
          requestAnimationFrame(animateFly);
        }
      };
      animateFly();
    },
    [markers]
  );

  const resetTerrain = useCallback(async () => {
    await restoreFaces();

    const markerIds = Array.from(markerObjectsRef.current.keys());
    markerIds.forEach((id) => removeMarker(id));

    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(30, 40, 50);
      controlsRef.current.target.set(0, 5, 0);
      controlsRef.current.update();
    }

    setExcavatedCount(0);
    setMarkers([]);
  }, [restoreFaces, removeMarker]);

  const setActiveTool = useCallback((tool: 'brush' | 'marker' | null) => {
    setActiveToolState(tool);
    if (rendererRef.current && rendererRef.current.domElement) {
      if (tool === 'brush') {
        rendererRef.current.domElement.style.cursor = 'crosshair';
      } else if (tool === 'marker') {
        rendererRef.current.domElement.style.cursor = 'copy';
      } else {
        rendererRef.current.domElement.style.cursor = 'grab';
      }
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const heightmap = generateHeightmap();
    heightmapRef.current = heightmap;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.Fog(0x0f172a, 80, 150);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(30, 40, 50);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = (85 * Math.PI) / 180;
    controls.minDistance = 5;
    controls.maxDistance = 100;
    controls.target.set(0, 5, 0);
    controls.update();
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x334155, 0.5);
    scene.add(hemisphereLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(50, 80, 30);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);

    const terrainSize = 60;
    const segments = 80;
    const geometry = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);
    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.attributes.position.array as Float32Array;
    const colors = new Float32Array(positions.length);
    const vertexCount = positions.length / 3;

    for (let i = 0; i < vertexCount; i++) {
      const i3 = i * 3;
      const x = positions[i3];
      const z = positions[i3 + 2];

      const height = getTerrainHeight(x, z);
      positions[i3 + 1] = height;

      const heightRatio = Math.max(0, Math.min(1, (height - 2) / 13));
      const topColor = hexToRgb('#4ADE80');
      const bottomColor = hexToRgb('#334155');
      colors[i3] = bottomColor.r + (topColor.r - bottomColor.r) * heightRatio;
      colors[i3 + 1] = bottomColor.g + (topColor.g - bottomColor.g) * heightRatio;
      colors[i3 + 2] = bottomColor.b + (topColor.b - bottomColor.b) * heightRatio;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const originalIndices = new Uint32Array((geometry.getIndex()?.array as Uint32Array) || []);
    originalIndicesRef.current = originalIndices;

    const faceCount = originalIndices.length / 3;
    faceOpacityRef.current = new Float32Array(vertexCount).fill(1);
    geometry.setAttribute('opacity', new THREE.BufferAttribute(faceOpacityRef.current, 1));

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0.1,
    });

    const terrainMesh = new THREE.Mesh(geometry, material);
    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = true;
    scene.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    const gridHelper = new THREE.GridHelper(60, 60, 0x334155, 0x1e293b);
    gridHelper.position.y = 0.01;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.3;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    const layersGroup = new THREE.Group();
    const layerColors = ['#D97706', '#A3A3A3', '#78716C'];
    const layerY = [8, 6, 4];

    for (let layerIdx = 0; layerIdx < 3; layerIdx++) {
      const layerGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, segments / 2, segments / 2);
      layerGeo.rotateX(-Math.PI / 2);

      const layerPositions = layerGeo.attributes.position.array as Float32Array;
      const layerVertexCount = layerPositions.length / 3;

      for (let i = 0; i < layerVertexCount; i++) {
        const i3 = i * 3;
        const x = layerPositions[i3];
        const z = layerPositions[i3 + 2];
        const wave = Math.sin(x * 0.3 + layerIdx) * Math.cos(z * 0.3 + layerIdx * 0.7) * 0.5;
        layerPositions[i3 + 1] = layerY[layerIdx] + wave;
      }

      layerGeo.computeVertexNormals();

      const layerColor = hexToRgb(layerColors[layerIdx]);
      const layerColorsAttr = new Float32Array(layerPositions.length);
      for (let i = 0; i < layerVertexCount; i++) {
        const i3 = i * 3;
        layerColorsAttr[i3] = layerColor.r;
        layerColorsAttr[i3 + 1] = layerColor.g;
        layerColorsAttr[i3 + 2] = layerColor.b;
      }
      layerGeo.setAttribute('color', new THREE.BufferAttribute(layerColorsAttr, 3));

      const layerMat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        roughness: 0.9,
        metalness: 0.05,
      });

      const layerMesh = new THREE.Mesh(layerGeo, layerMat);
      layersGroup.add(layerMesh);
    }
    scene.add(layersGroup);
    layersGroupRef.current = layersGroup;

    const faultData: FaultLine[] = [
      { id: 'fault-1', start: { x: -25, z: -20 }, end: { x: 25, z: 20 }, width: 0.3 },
      { id: 'fault-2', start: { x: -20, z: 20 }, end: { x: 20, z: -22 }, width: 0.3 },
    ];
    faultDataRef.current = faultData;

    const faultVertexShader = `
      varying vec2 vUv;
      varying vec3 vPosition;
      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const faultFragmentShader = `
      uniform float time;
      varying vec2 vUv;
      varying vec3 vPosition;
      
      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      void main() {
        float pulse = 0.6 + 0.4 * sin(time * 3.14159);
        float n = noise(vUv * 20.0) * 0.3;
        vec3 color = vec3(0.937, 0.267, 0.267) * pulse + n * 0.2;
        float glow = pulse * 0.8 + 0.2;
        gl_FragColor = vec4(color * glow, 0.95);
      }
    `;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    for (let i = 0; i < 5000; i++) {
      ctx.fillStyle = `rgba(${180 + Math.random() * 75}, ${100 + Math.random() * 50}, ${100 + Math.random() * 50}, ${Math.random() * 0.3})`;
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 3, 1 + Math.random() * 3);
    }
    const frictionTexture = new THREE.CanvasTexture(canvas);
    frictionTexture.wrapS = THREE.RepeatWrapping;
    frictionTexture.wrapT = THREE.RepeatWrapping;

    faultData.forEach((fault) => {
      const points: THREE.Vector3[] = [];
      const dx = fault.end.x - fault.start.x;
      const dz = fault.end.z - fault.start.z;
      const length = Math.sqrt(dx * dx + dz * dz);
      const steps = Math.ceil(length * 2);

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = fault.start.x + dx * t;
        const z = fault.start.z + dz * t;
        const height = getTerrainHeight(x, z);
        points.push(new THREE.Vector3(x, height - 0.5, z));
        points.push(new THREE.Vector3(x, height - 3, z));
      }

      const faultGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const faultMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          noiseTexture: { value: frictionTexture },
        },
        vertexShader: faultVertexShader,
        fragmentShader: faultFragmentShader,
        transparent: true,
        side: THREE.DoubleSide,
      });

      const faultLine = new THREE.LineSegments(faultGeometry, faultMaterial);
      scene.add(faultLine);
      faultLinesRef.current.push(faultLine);
    });

    const markersGroup = new THREE.Group();
    scene.add(markersGroup);
    markersGroupRef.current = markersGroup;

    const onMouseMove = (event: MouseEvent) => {
      if (!containerRef.current || !cameraRef.current || !terrainMeshRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObject(terrainMeshRef.current);

      if (intersects.length > 0) {
        const point = intersects[0].point;
        setMousePosition({ x: parseFloat(point.x.toFixed(2)), z: parseFloat(point.z.toFixed(2)) });

        if (isMouseDownRef.current && activeTool === 'brush' && !isDraggingRef.current) {
          excavateFaces(point.x, point.z, event.clientX, event.clientY);
        }
      }

      const dx = Math.abs(event.clientX - lastMousePosRef.current.x);
      const dy = Math.abs(event.clientY - lastMousePosRef.current.y);
      if (dx > 3 || dy > 3) {
        isDraggingRef.current = true;
      }
      lastMousePosRef.current = { x: event.clientX, y: event.clientY };
    };

    const onMouseDown = (event: MouseEvent) => {
      if (event.button !== 0) return;
      isMouseDownRef.current = true;
      isDraggingRef.current = false;
      lastMousePosRef.current = { x: event.clientX, y: event.clientY };

      if (!containerRef.current || !cameraRef.current || !terrainMeshRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObject(terrainMeshRef.current);

      if (intersects.length > 0 && activeTool === 'marker') {
        const point = intersects[0].point;
        const label = window.prompt('请输入标注文字：', '');
        if (label !== null) {
          placeMarker(point.x, point.z, label);
        }
      }
    };

    const onMouseUp = () => {
      isMouseDownRef.current = false;
    };

    const onWheel = (event: WheelEvent) => {
      event.stopPropagation();
    };

    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel);

    const onResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', onResize);

    const startTime = performance.now();

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      const elapsed = (performance.now() - startTime) / 1000;

      faultLinesRef.current.forEach((faultLine) => {
        const material = faultLine.material as THREE.ShaderMaterial;
        if (material.uniforms) {
          material.uniforms.time.value = elapsed;
        }
      });

      animateFading();
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationIdRef.current);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('wheel', onWheel);

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });

      frictionTexture.dispose();
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [generateHeightmap, getTerrainHeight, excavateFaces, animateFading, placeMarker, activeTool]);

  const contextValue = useMemo(
    () => ({
      mousePosition,
      excavatedCount,
      markers,
      activeTool,
      setActiveTool,
      addMarker: placeMarker,
      removeMarker,
      flyToMarker,
      resetTerrain,
      getTerrainHeight,
    }),
    [mousePosition, excavatedCount, markers, activeTool, setActiveTool, placeMarker, removeMarker, flyToMarker, resetTerrain, getTerrainHeight]
  );

  return (
    <TerrainContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          overflow: 'hidden',
        }}
      />
      {children}
    </TerrainContext.Provider>
  );
};
