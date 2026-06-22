import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useMemo,
} from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Building, ShadowGridData, SunPosition, ViewMode } from '@/types';
import { addWatermarkToCanvas } from '@/utils/exportUtils';

export interface Scene3DHandle {
  captureShadowGrid: () => Promise<ShadowGridData>;
  captureScreenshot: (width: number, height: number, timestamp: string) => Promise<string>;
  calculateBuildingShadowPercent: (building: Building) => number;
}

interface Scene3DProps {
  sunPosition: SunPosition;
  viewMode: ViewMode;
  buildings: Building[];
  onBuildingClick: (building: Building, screenPos: { x: number; y: number }) => void;
  onCaptureShadowGrid?: () => Promise<ShadowGridData>;
}

interface BuildingMesh {
  group: THREE.Group;
  building: Building;
  meshes: THREE.Mesh[];
}

const Scene3D = forwardRef<Scene3DHandle, Scene3DProps>((props, ref) => {
  const { sunPosition, viewMode, buildings, onBuildingClick, onCaptureShadowGrid } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameRef = useRef<number>(0);

  const directionalLightRef = useRef<THREE.DirectionalLight | null>(null);
  const sunMeshRef = useRef<THREE.Mesh | null>(null);

  const groundRef = useRef<THREE.Mesh | null>(null);
  const buildingMeshesRef = useRef<BuildingMesh[]>([]);

  const keysRef = useRef<Set<string>>(new Set());

  const sunTargetPosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const sunCurrentPosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const sunAnimProgressRef = useRef<number>(1);
  const sunAnimStartPosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const lastSunPositionRef = useRef<SunPosition | null>(null);

  const viewModeRef = useRef<ViewMode>(viewMode);
  const cameraAnimProgressRef = useRef<number>(1);
  const cameraAnimStartPosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const cameraAnimStartTargetRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const cameraTargetPosRef = useRef<THREE.Vector3>(new THREE.Vector3(80, 80, 80));
  const cameraTargetLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  const previousBuildingsRef = useRef<Building[]>([]);

  const allObjectsForRaycast = useRef<THREE.Object3D[]>([]);

  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouse = useMemo(() => new THREE.Vector2(), []);

  useImperativeHandle(ref, () => ({
    captureShadowGrid: async (): Promise<ShadowGridData> => {
      if (!sceneRef.current || !groundRef.current) {
        return { resolution: 10, gridSize: 100, cells: [] };
      }

      if (onCaptureShadowGrid) {
        return onCaptureShadowGrid();
      }

      const resolution = 10;
      const gridSize = 100;
      const cellSize = gridSize / resolution;
      const cells: ShadowGridData['cells'] = [];

      const buildingMeshes: THREE.Object3D[] = [];
      buildingMeshesRef.current.forEach((bm) => {
        bm.meshes.forEach((m) => buildingMeshes.push(m));
      });

      for (let xi = 0; xi < resolution; xi++) {
        for (let zi = 0; zi < resolution; zi++) {
          const baseX = -gridSize / 2 + xi * cellSize + cellSize / 2;
          const baseZ = -gridSize / 2 + zi * cellSize + cellSize / 2;

          let occludedCount = 0;
          const samples = 3;
          const halfSize = cellSize / 2;
          const step = cellSize / (samples - 1);

          for (let sx = 0; sx < samples; sx++) {
            for (let sz = 0; sz < samples; sz++) {
              const sampleX = baseX - halfSize + sx * step;
              const sampleZ = baseZ - halfSize + sz * step;

              const origin = new THREE.Vector3(sampleX, 100, sampleZ);
              const dir = new THREE.Vector3(0, -1, 0);

              raycaster.set(origin, dir);
              raycaster.far = 200;
              const intersects: THREE.Intersection[] = raycaster.intersectObjects(
                [groundRef.current!, ...buildingMeshes],
                false
              );

              if (intersects.length > 0) {
                if (intersects[0].object !== groundRef.current) {
                  occludedCount++;
                } else {
                  const hitY = intersects[0].point.y;
                  const checkOrigin = new THREE.Vector3(sampleX, hitY + 0.01, sampleZ);
                  raycaster.set(checkOrigin, new THREE.Vector3(0, 1, 0));
                  raycaster.far = 200;
                  const aboveIntersects = raycaster.intersectObjects(buildingMeshes, false);
                  if (aboveIntersects.length > 0) {
                    occludedCount++;
                  }
                }
              } else {
                occludedCount++;
              }
            }
          }

          cells.push({
            x: xi,
            z: zi,
            shadowValue: occludedCount / (samples * samples),
          });
        }
      }

      return { resolution, gridSize, cells };
    },

    captureScreenshot: async (width: number, height: number, timestamp: string): Promise<string> => {
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;

      if (!renderer || !scene || !camera) {
        return '';
      }

      const prevSize = new THREE.Vector2();
      renderer.getSize(prevSize);
      const prevPixelRatio = renderer.getPixelRatio();

      const canvas = renderer.domElement;
      const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (context) {
        const attrs = context.getContextAttributes();
        if (!attrs?.preserveDrawingBuffer) {
          const oldRenderer = renderer;
          const newRenderer = new THREE.WebGLRenderer({
            antialias: true,
            preserveDrawingBuffer: true,
          });
          newRenderer.setSize(prevSize.x, prevSize.y, false);
          newRenderer.setPixelRatio(prevPixelRatio);
          newRenderer.shadowMap.enabled = true;
          newRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
          newRenderer.setClearColor(0x141420);
          newRenderer.domElement.style.width = '100%';
          newRenderer.domElement.style.height = '100%';
          rendererRef.current = newRenderer;

          if (containerRef.current) {
            if (oldRenderer.domElement.parentNode === containerRef.current) {
              containerRef.current.removeChild(oldRenderer.domElement);
            }
            containerRef.current.appendChild(newRenderer.domElement);
          }

          oldRenderer.dispose();
        }
      }

      const curRenderer = rendererRef.current!;
      curRenderer.setSize(width, height, false);
      curRenderer.setPixelRatio(1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      curRenderer.render(scene, camera);

      const renderedCanvas = curRenderer.domElement;
      const watermarkedCanvas = addWatermarkToCanvas(renderedCanvas, timestamp);
      const dataUrl = watermarkedCanvas.toDataURL('image/png');

      curRenderer.setSize(prevSize.x, prevSize.y, false);
      curRenderer.setPixelRatio(prevPixelRatio);
      camera.aspect = prevSize.x / prevSize.y;
      camera.updateProjectionMatrix();
      curRenderer.render(scene, camera);

      return dataUrl;
    },

    calculateBuildingShadowPercent: (building: Building): number => {
      if (!sceneRef.current) return 0;

      const { position, dimensions } = building;
      const { width, depth, height } = dimensions;

      const footprintArea = width * depth;
      if (footprintArea === 0) return 0;

      const samplesX = Math.max(3, Math.ceil(width / 2));
      const samplesZ = Math.max(3, Math.ceil(depth / 2));
      const totalSamples = samplesX * samplesZ;
      let occluded = 0;

      const otherBuildingMeshes: THREE.Object3D[] = [];
      buildingMeshesRef.current.forEach((bm) => {
        if (bm.building.id !== building.id) {
          bm.meshes.forEach((m) => otherBuildingMeshes.push(m));
        }
      });

      if (otherBuildingMeshes.length === 0) {
        return 0;
      }

      const halfW = width / 2;
      const halfD = depth / 2;
      const stepX = width / (samplesX - 1 || 1);
      const stepZ = depth / (samplesZ - 1 || 1);

      for (let sx = 0; sx < samplesX; sx++) {
        for (let sz = 0; sz < samplesZ; sz++) {
          const px = position.x - halfW + sx * stepX;
          const pz = position.z - halfD + sz * stepZ;

          const origin = new THREE.Vector3(px, height + 0.01, pz);
          const dir = new THREE.Vector3(0, 1, 0);

          raycaster.set(origin, dir);
          raycaster.far = 200;
          const intersects = raycaster.intersectObjects(otherBuildingMeshes, false);
          if (intersects.length > 0) {
            occluded++;
          }
        }
      }

      return Math.round((occluded / totalSamples) * 100);
    },
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x141420);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(80, 80, 80);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x141420);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 30;
    controls.maxDistance = 200;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x8899aa, 0x222233, 0.4);
    scene.add(hemiLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(1024, 1024);
    directionalLight.shadow.camera.left = -60;
    directionalLight.shadow.camera.right = 60;
    directionalLight.shadow.camera.top = 60;
    directionalLight.shadow.camera.bottom = -60;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 300;
    directionalLight.position.set(0, 100, 100);
    scene.add(directionalLight);
    directionalLightRef.current = directionalLight;

    const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffee88 });
    const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    sunMesh.position.set(0, 120, 0);
    scene.add(sunMesh);
    sunMeshRef.current = sunMesh;

    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a5e,
      transparent: true,
      opacity: 0.85,
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);
    groundRef.current = ground;

    const gridHelper = new THREE.GridHelper(100, 20, 0x666688, 0x444466);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current || !cameraRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current);

      const meshes: THREE.Object3D[] = [];
      buildingMeshesRef.current.forEach((bm) => {
        bm.meshes.forEach((m) => meshes.push(m));
      });

      const intersects = raycaster.intersectObjects(meshes, false);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        for (const bm of buildingMeshesRef.current) {
          if (bm.meshes.includes(hitMesh as THREE.Mesh)) {
            const screenPosX = event.clientX - rect.left;
            const screenPosY = event.clientY - rect.top;
            onBuildingClick(bm.building, { x: screenPosX, y: screenPosY });
            break;
          }
        }
      }
    };

    renderer.domElement.addEventListener('click', handleClick);

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      const keys = keysRef.current;
      const cam = cameraRef.current;
      const ctrl = controlsRef.current;

      if (cam && ctrl) {
        const forward = new THREE.Vector3();
        cam.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(forward, cam.up).normalize();

        const speed = 0.8;

        if (keys.has('w')) {
          cam.position.addScaledVector(forward, speed);
          ctrl.target.addScaledVector(forward, speed);
        }
        if (keys.has('s')) {
          cam.position.addScaledVector(forward, -speed);
          ctrl.target.addScaledVector(forward, -speed);
        }
        if (keys.has('a')) {
          cam.position.addScaledVector(right, -speed);
          ctrl.target.addScaledVector(right, -speed);
        }
        if (keys.has('d')) {
          cam.position.addScaledVector(right, speed);
          ctrl.target.addScaledVector(right, speed);
        }
      }

      if (sunAnimProgressRef.current < 1 && directionalLightRef.current && sunMeshRef.current) {
        sunAnimProgressRef.current = Math.min(1, sunAnimProgressRef.current + 1 / 30);
        const t = sunAnimProgressRef.current;
        const easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

        const cur = sunCurrentPosRef.current.clone();
        const start = sunAnimStartPosRef.current.clone();
        const target = sunTargetPosRef.current.clone();

        cur.lerpVectors(start, target, easeT);
        sunCurrentPosRef.current.copy(cur);

        sunMeshRef.current.position.copy(cur);

        const lightDir = cur.clone().normalize();
        directionalLightRef.current.position.copy(lightDir.multiplyScalar(150));
        directionalLightRef.current.target.position.set(0, 0, 0);
        directionalLightRef.current.shadow.needsUpdate = true;
      }

      if (cameraAnimProgressRef.current < 1 && cam && ctrl) {
        cameraAnimProgressRef.current = Math.min(1, cameraAnimProgressRef.current + 1 / 60);
        const t = cameraAnimProgressRef.current;
        const easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

        const posStart = cameraAnimStartPosRef.current.clone();
        const posTarget = cameraTargetPosRef.current.clone();
        const targetStart = cameraAnimStartTargetRef.current.clone();
        const targetTarget = cameraTargetLookAtRef.current.clone();

        cam.position.lerpVectors(posStart, posTarget, easeT);
        ctrl.target.lerpVectors(targetStart, targetTarget, easeT);
      }

      if (ctrl) {
        ctrl.update();
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleClick);

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material?.dispose();
          }
        }
      });

      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [onBuildingClick, raycaster]);

  useEffect(() => {
    const { azimuth, altitude, color, lightIntensity } = sunPosition;

    const last = lastSunPositionRef.current;
    if (
      last &&
      last.azimuth === azimuth &&
      last.altitude === altitude &&
      last.color === color &&
      last.lightIntensity === lightIntensity
    ) {
      return;
    }

    const altRad = (altitude * Math.PI) / 180;
    const azRad = (azimuth * Math.PI) / 180;

    const radius = 120;
    const x = radius * Math.cos(altRad) * Math.sin(azRad);
    const y = radius * Math.sin(altRad);
    const z = radius * Math.cos(altRad) * Math.cos(azRad);

    sunAnimStartPosRef.current.copy(sunCurrentPosRef.current);
    sunTargetPosRef.current.set(x, y, z);
    sunAnimProgressRef.current = 0;

    if (sunMeshRef.current) {
      const mat = sunMeshRef.current.material as THREE.MeshBasicMaterial;
      mat.color.set(new THREE.Color(color));
    }

    if (directionalLightRef.current) {
      directionalLightRef.current.intensity = lightIntensity;
    }

    lastSunPositionRef.current = { ...sunPosition };
  }, [sunPosition]);

  useEffect(() => {
    if (viewModeRef.current === viewMode) return;
    viewModeRef.current = viewMode;

    if (!cameraRef.current || !controlsRef.current) return;

    cameraAnimStartPosRef.current.copy(cameraRef.current.position);
    cameraAnimStartTargetRef.current.copy(controlsRef.current.target);

    if (viewMode === 'topdown') {
      cameraTargetPosRef.current.set(0, 140, 0.01);
      cameraTargetLookAtRef.current.set(0, 0, 0);
      controlsRef.current.enableRotate = false;
    } else {
      cameraTargetPosRef.current.set(80, 80, 80);
      cameraTargetLookAtRef.current.set(0, 0, 0);
      controlsRef.current.enableRotate = true;
    }

    cameraAnimProgressRef.current = 0;
  }, [viewMode]);

  useEffect(() => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;

    buildingMeshesRef.current.forEach((bm) => {
      bm.meshes.forEach((m) => {
        scene.remove(m);
        m.geometry.dispose();
        if (Array.isArray(m.material)) {
          m.material.forEach((mat) => mat.dispose());
        } else {
          m.material.dispose();
        }
      });
      scene.remove(bm.group);
    });
    buildingMeshesRef.current = [];

    buildings.forEach((building) => {
      const group = new THREE.Group();
      const meshes: THREE.Mesh[] = [];

      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(building.color),
        roughness: 0.6 + Math.random() * 0.2,
        metalness: 0.1 + Math.random() * 0.2,
      });

      if (building.type === 'cube') {
        const { width, depth, height } = building.dimensions;
        const geom = new THREE.BoxGeometry(width, height, depth);
        const mesh = new THREE.Mesh(geom, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.position.set(
          building.position.x,
          building.dimensions.height / 2,
          building.position.z
        );
        meshes.push(mesh);
        group.add(mesh);
      } else if (building.type === 'cylinder') {
        const { width, depth, height } = building.dimensions;
        const radius = Math.min(width, depth) / 2;
        const geom = new THREE.CylinderGeometry(radius, radius, height, 32);
        const mesh = new THREE.Mesh(geom, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.position.set(
          building.position.x,
          building.dimensions.height / 2,
          building.position.z
        );
        meshes.push(mesh);
        group.add(mesh);
      } else if (building.type === 'L-shape') {
        const { width, depth, height } = building.dimensions;
        const armWidth = width * 0.6;
        const armDepth = depth * 0.6;

        const geom1 = new THREE.BoxGeometry(width, height, depth * 0.4);
        const mesh1 = new THREE.Mesh(geom1, material);
        mesh1.castShadow = true;
        mesh1.receiveShadow = true;
        mesh1.position.set(
          building.position.x,
          height / 2,
          building.position.z - (depth - depth * 0.4) / 2
        );
        meshes.push(mesh1);
        group.add(mesh1);

        const geom2 = new THREE.BoxGeometry(width * 0.4, height, armDepth);
        const mesh2 = new THREE.Mesh(geom2, material);
        mesh2.castShadow = true;
        mesh2.receiveShadow = true;
        mesh2.position.set(
          building.position.x + (width - width * 0.4) / 2,
          height / 2,
          building.position.z + (depth - armDepth) / 2
        );
        meshes.push(mesh2);
        group.add(mesh2);
      }

      scene.add(group);
      buildingMeshesRef.current.push({ group, building, meshes });
    });

    const all: THREE.Object3D[] = [];
    buildingMeshesRef.current.forEach((bm) => {
      bm.meshes.forEach((m) => all.push(m));
    });
    if (groundRef.current) {
      all.push(groundRef.current);
    }
    allObjectsForRaycast.current = all;

    previousBuildingsRef.current = buildings;
  }, [buildings]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
});

Scene3D.displayName = 'Scene3D';

export default Scene3D;
