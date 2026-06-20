import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { District, NoiseDataPoint, PerformanceMode } from '../data/noiseData';

const COLOR_GREEN = new THREE.Color(0x4caf50);
const COLOR_YELLOW = new THREE.Color(0xffeb3b);
const COLOR_RED = new THREE.Color(0xf44336);

const BAR_RADIUS = 0.8;
const BAR_HEIGHT_SCALE = 0.15;
const HEIGHT_LAYER_GAP = 0.3;
const QUALITY_SEGMENTS = 64;
const PERFORMANCE_SEGMENTS = 16;
const AUTO_ROTATE_SPEED = (Math.PI * 2) / 30;
const TRANSITION_DURATION = 1500;
const RISE_DURATION = 300;

export interface NoiseCityResult {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  update: (delta: number) => void;
  setDistrict: (districtId: string) => Promise<void>;
  setPerformanceMode: (mode: PerformanceMode) => void;
  onBarClick: (callback: (data: NoiseDataPoint | null) => void) => void;
  getMaxDbPoint: () => { point: NoiseDataPoint; maxDb: number } | null;
  onDragStateChange: (callback: (isDragging: boolean) => void) => void;
  dispose: () => void;
}

interface BarGroup {
  group: THREE.Group;
  data: NoiseDataPoint;
  cylinders: THREE.Mesh[];
  halos: THREE.Mesh[];
  targetScale: number;
  currentScale: number;
  isSelected: boolean;
}

interface EasingFunction {
  (t: number): number;
}

const easeInOut: EasingFunction = (t) => {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
};

const easeOut: EasingFunction = (t) => {
  return 1 - Math.pow(1 - t, 3);
};

export function getNoiseColor(db: number): THREE.Color {
  const clampedDb = Math.max(40, Math.min(100, db));
  const t = (clampedDb - 40) / 60;

  if (t < 0.5) {
    return new THREE.Color().lerpColors(COLOR_GREEN, COLOR_YELLOW, t * 2);
  } else {
    return new THREE.Color().lerpColors(COLOR_YELLOW, COLOR_RED, (t - 0.5) * 2);
  }
}

export function initNoiseCity(
  container: HTMLElement,
  districts: District[],
  initialDistrictId: string,
  initialPerformanceMode: PerformanceMode
): NoiseCityResult {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a2332);
  scene.fog = new THREE.Fog(0x1a2332, 50, 120);

  const camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(30, 40, 50);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 15;
  controls.maxDistance = 100;
  controls.maxPolarAngle = Math.PI / 2.1;
  controls.target.set(0, 0, 0);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(20, 40, 30);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 100;
  directionalLight.shadow.camera.left = -50;
  directionalLight.shadow.camera.right = 50;
  directionalLight.shadow.camera.top = 50;
  directionalLight.shadow.camera.bottom = -50;
  scene.add(directionalLight);

  const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x1a2332, 0.3);
  scene.add(hemisphereLight);

  let groundMesh: THREE.Mesh | null = null;
  let buildingLines: THREE.LineSegments | null = null;
  const barGroups: BarGroup[] = [];
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  let performanceMode: PerformanceMode = initialPerformanceMode;
  let currentDistrictId = initialDistrictId;
  let autoRotate = true;
  let autoRotateResumeTimer: number | null = null;
  let isDragging = false;

  let barClickCallback: ((data: NoiseDataPoint | null) => void) | null = null;
  let dragStateCallback: ((isDragging: boolean) => void) | null = null;

  let transitionProgress = 0;
  let isTransitioning = false;
  let transitionStartTime = 0;
  let riseAnimations: Map<BarGroup, { startTime: number; baseY: number }> = new Map();

  function getCylinderSegments(): number {
    return performanceMode === 'quality' ? QUALITY_SEGMENTS : PERFORMANCE_SEGMENTS;
  }

  function createGround(district: District): THREE.Mesh {
    const groundGeometry = new THREE.PlaneGeometry(120, 120);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: district.groundColor,
      roughness: 0.9,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    return ground;
  }

  function createBuildingLines(district: District): THREE.LineSegments {
    const points: THREE.Vector3[] = [];
    const buildingPositions = getBuildingPositionsForDistrict(district.id);

    buildingPositions.forEach(({ x, z, width, depth, height }) => {
      const halfW = width / 2;
      const halfD = depth / 2;

      const corners = [
        new THREE.Vector3(x - halfW, 0, z - halfD),
        new THREE.Vector3(x + halfW, 0, z - halfD),
        new THREE.Vector3(x + halfW, 0, z + halfD),
        new THREE.Vector3(x - halfW, 0, z + halfD),
        new THREE.Vector3(x - halfW, height, z - halfD),
        new THREE.Vector3(x + halfW, height, z - halfD),
        new THREE.Vector3(x + halfW, height, z + halfD),
        new THREE.Vector3(x - halfW, height, z + halfD)
      ];

      const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7]
      ];

      edges.forEach(([i, j]) => {
        points.push(corners[i], corners[j]);
      });
    });

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x4a90d9,
      transparent: true,
      opacity: 0.4
    });
    return new THREE.LineSegments(geometry, material);
  }

  function getBuildingPositionsForDistrict(districtId: string): Array<{
    x: number; z: number; width: number; depth: number; height: number;
  }> {
    switch (districtId) {
      case 'sunken-plaza':
        return [
          { x: -20, z: -20, width: 10, depth: 10, height: 25 },
          { x: 20, z: -20, width: 12, depth: 8, height: 30 },
          { x: -20, z: 20, width: 8, depth: 12, height: 20 },
          { x: 20, z: 20, width: 10, depth: 10, height: 35 }
        ];
      case 'commercial-street':
        return [
          { x: -30, z: -12, width: 8, depth: 60, height: 15 },
          { x: 30, z: -12, width: 8, depth: 60, height: 18 },
          { x: -30, z: 12, width: 8, depth: 60, height: 12 },
          { x: 30, z: 12, width: 8, depth: 60, height: 20 }
        ];
      case 'viaduct':
        return [
          { x: 0, z: -25, width: 60, depth: 6, height: 8 },
          { x: -25, z: 20, width: 12, depth: 12, height: 25 },
          { x: 25, z: 20, width: 12, depth: 12, height: 28 },
          { x: 0, z: 25, width: 15, depth: 10, height: 22 }
        ];
      default:
        return [];
    }
  }

  function createBarGroup(data: NoiseDataPoint): BarGroup {
    const group = new THREE.Group();
    group.position.set(data.x, 0, data.z);

    const cylinders: THREE.Mesh[] = [];
    const halos: THREE.Mesh[] = [];

    const heightValues = [data.groundDb, data.height10Db, data.height20Db, data.height30Db];
    const segments = getCylinderSegments();

    let cumulativeY = 0;
    heightValues.forEach((db, index) => {
      const height = db * BAR_HEIGHT_SCALE;
      const geometry = new THREE.CylinderGeometry(BAR_RADIUS, BAR_RADIUS, height, segments);
      const material = new THREE.MeshStandardMaterial({
        color: getNoiseColor(db),
        roughness: 0.3,
        metalness: 0.6,
        transparent: true,
        opacity: 0.9
      });

      const cylinder = new THREE.Mesh(geometry, material);
      cylinder.position.y = cumulativeY + height / 2;
      cylinder.castShadow = true;
      cylinder.receiveShadow = true;
      group.add(cylinder);
      cylinders.push(cylinder);

      if (performanceMode === 'quality') {
        const haloGeometry = new THREE.RingGeometry(BAR_RADIUS * 1.1, BAR_RADIUS * 1.3, segments);
        const haloMaterial = new THREE.MeshBasicMaterial({
          color: getNoiseColor(db),
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide
        });
        const halo = new THREE.Mesh(haloGeometry, haloMaterial);
        halo.position.y = cumulativeY + height;
        halo.rotation.x = -Math.PI / 2;
        group.add(halo);
        halos.push(halo);
      }

      cumulativeY += height + HEIGHT_LAYER_GAP;
    });

    const shadowGeometry = new THREE.CircleGeometry(BAR_RADIUS * 1.2, 32);
    const shadowMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.2
    });
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    group.add(shadow);

    group.userData.barData = data;

    return {
      group,
      data,
      cylinders,
      halos,
      targetScale: 1,
      currentScale: 0,
      isSelected: false
    };
  }

  function clearBars(): void {
    barGroups.forEach(bar => {
      scene.remove(bar.group);
      bar.cylinders.forEach(c => {
        c.geometry.dispose();
        (c.material as THREE.Material).dispose();
      });
      bar.halos.forEach(h => {
        h.geometry.dispose();
        (h.material as THREE.Material).dispose();
      });
    });
    barGroups.length = 0;
    riseAnimations.clear();
  }

  function loadDistrict(districtId: string, animate: boolean = true): void {
    const district = districts.find(d => d.id === districtId);
    if (!district) return;

    currentDistrictId = districtId;

    if (groundMesh) {
      scene.remove(groundMesh);
      groundMesh.geometry.dispose();
      (groundMesh.material as THREE.Material).dispose();
    }
    groundMesh = createGround(district);
    scene.add(groundMesh);

    if (buildingLines) {
      scene.remove(buildingLines);
      buildingLines.geometry.dispose();
      (buildingLines.material as THREE.Material).dispose();
    }
    buildingLines = createBuildingLines(district);
    scene.add(buildingLines);

    const oldBars = [...barGroups];
    const now = performance.now();

    if (animate && oldBars.length > 0) {
      isTransitioning = true;
      transitionStartTime = now;
      transitionProgress = 0;

      oldBars.forEach(bar => {
        bar.targetScale = 0;
      });

      setTimeout(() => {
        clearBars();
        district.data.forEach((data, index) => {
          const bar = createBarGroup(data);
          bar.group.scale.setScalar(0);
          bar.currentScale = 0;
          bar.group.position.y = -5;
          scene.add(bar.group);
          barGroups.push(bar);

          setTimeout(() => {
            riseAnimations.set(bar, {
              startTime: performance.now(),
              baseY: -5
            });
            bar.targetScale = 1;
          }, index * 20);
        });

        setTimeout(() => {
          isTransitioning = false;
        }, TRANSITION_DURATION);
      }, TRANSITION_DURATION / 2);
    } else {
      clearBars();
      district.data.forEach((data, index) => {
        const bar = createBarGroup(data);
        bar.group.scale.setScalar(0);
        bar.currentScale = 0;
        bar.group.position.y = -5;
        scene.add(bar.group);
        barGroups.push(bar);

        setTimeout(() => {
          riseAnimations.set(bar, {
            startTime: performance.now(),
            baseY: -5
          });
          bar.targetScale = 1;
        }, index * 20);
      });
    }
  }

  function setSelectedBar(selectedData: NoiseDataPoint | null): void {
    barGroups.forEach(bar => {
      const wasSelected = bar.isSelected;
      bar.isSelected = selectedData !== null &&
        bar.data.x === selectedData.x &&
        bar.data.z === selectedData.z;

      if (wasSelected !== bar.isSelected) {
        bar.targetScale = bar.isSelected ? 1.2 : 1;

        bar.cylinders.forEach((cylinder, index) => {
          const material = cylinder.material as THREE.MeshStandardMaterial;
          if (bar.isSelected) {
            material.emissive = new THREE.Color(0xffffff);
            material.emissiveIntensity = 0.3;
          } else {
            material.emissive = new THREE.Color(0x000000);
            material.emissiveIntensity = 0;
          }

          if (performanceMode === 'quality' && bar.halos[index]) {
            const haloMaterial = bar.halos[index].material as THREE.MeshBasicMaterial;
            haloMaterial.opacity = bar.isSelected ? 0.6 : 0.3;
            haloMaterial.color = bar.isSelected ?
              new THREE.Color(0xffffff) :
              getNoiseColor([bar.data.groundDb, bar.data.height10Db, bar.data.height20Db, bar.data.height30Db][index]);
          }
        });
      }
    });
  }

  function handleClick(event: MouseEvent): void {
    if (isTransitioning) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const allCylinders: THREE.Mesh[] = [];
    barGroups.forEach(bar => {
      allCylinders.push(...bar.cylinders);
    });

    const intersects = raycaster.intersectObjects(allCylinders);

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      const parentGroup = clickedObject.parent as THREE.Group;
      const barData = parentGroup.userData.barData as NoiseDataPoint;

      if (barData && barClickCallback) {
        const isCurrentlySelected = barGroups.some(b =>
          b.isSelected && b.data.x === barData.x && b.data.z === barData.z
        );

        if (isCurrentlySelected) {
          setSelectedBar(null);
          barClickCallback(null);
        } else {
          setSelectedBar(barData);
          barClickCallback(barData);
        }
      }
    } else {
      setSelectedBar(null);
      if (barClickCallback) {
        barClickCallback(null);
      }
    }
  }

  function handlePointerDown(): void {
    isDragging = true;
    autoRotate = false;
    if (autoRotateResumeTimer) {
      clearTimeout(autoRotateResumeTimer);
      autoRotateResumeTimer = null;
    }
    if (dragStateCallback) {
      dragStateCallback(true);
    }
  }

  function handlePointerUp(): void {
    isDragging = false;
    if (dragStateCallback) {
      dragStateCallback(false);
    }
    autoRotateResumeTimer = window.setTimeout(() => {
      autoRotate = true;
    }, 5000);
  }

  function handleResize(): void {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }

  function update(delta: number): void {
    const now = performance.now();

    if (isTransitioning) {
      transitionProgress = Math.min(1, (now - transitionStartTime) / TRANSITION_DURATION);
      const easedProgress = easeInOut(transitionProgress);

      barGroups.forEach(bar => {
        if (bar.targetScale === 0) {
          bar.currentScale = 1 - easedProgress;
          bar.group.scale.setScalar(bar.currentScale);
        }
      });
    }

    riseAnimations.forEach((animData, bar) => {
      const progress = Math.min(1, (now - animData.startTime) / RISE_DURATION);
      const easedProgress = easeOut(progress);

      bar.currentScale = bar.targetScale * easedProgress;
      bar.group.scale.setScalar(bar.currentScale);
      bar.group.position.y = animData.baseY + (0 - animData.baseY) * easedProgress;

      if (progress >= 1) {
        riseAnimations.delete(bar);
      }
    });

    barGroups.forEach(bar => {
      if (!riseAnimations.has(bar) && Math.abs(bar.currentScale - bar.targetScale) > 0.001) {
        bar.currentScale += (bar.targetScale - bar.currentScale) * delta * 8;
        bar.group.scale.setScalar(bar.currentScale);
      }
    });

    if (autoRotate && !isDragging) {
      const angle = AUTO_ROTATE_SPEED * delta;
      const radius = Math.sqrt(
        camera.position.x ** 2 + camera.position.z ** 2
      );
      const currentAngle = Math.atan2(camera.position.z, camera.position.x);
      const newAngle = currentAngle + angle;

      camera.position.x = Math.cos(newAngle) * radius;
      camera.position.z = Math.sin(newAngle) * radius;
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
    }

    controls.update();
    renderer.render(scene, camera);
  }

  function setDistrict(districtId: string): Promise<void> {
    return new Promise((resolve) => {
      loadDistrict(districtId, true);
      setTimeout(resolve, TRANSITION_DURATION);
    });
  }

  function setPerformanceMode(mode: PerformanceMode): void {
    if (performanceMode === mode) return;
    performanceMode = mode;

    const currentData = barGroups.map(bar => ({ ...bar.data }));
    clearBars();

    currentData.forEach((data, index) => {
      const bar = createBarGroup(data);
      bar.group.scale.setScalar(1);
      bar.currentScale = 1;
      scene.add(bar.group);
      barGroups.push(bar);
    });
  }

  function onBarClick(callback: (data: NoiseDataPoint | null) => void): void {
    barClickCallback = callback;
  }

  function onDragStateChange(callback: (isDragging: boolean) => void): void {
    dragStateCallback = callback;
  }

  function getMaxDbPoint(): { point: NoiseDataPoint; maxDb: number } | null {
    if (barGroups.length === 0) return null;

    let maxDb = -Infinity;
    let maxPoint: NoiseDataPoint | null = null;

    barGroups.forEach(bar => {
      const dbValues = [bar.data.groundDb, bar.data.height10Db, bar.data.height20Db, bar.data.height30Db];
      const barMax = Math.max(...dbValues);
      if (barMax > maxDb) {
        maxDb = barMax;
        maxPoint = bar.data;
      }
    });

    return maxPoint ? { point: maxPoint, maxDb } : null;
  }

  function dispose(): void {
    if (autoRotateResumeTimer) {
      clearTimeout(autoRotateResumeTimer);
    }

    renderer.domElement.removeEventListener('click', handleClick);
    renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
    renderer.domElement.removeEventListener('pointerup', handlePointerUp);
    renderer.domElement.removeEventListener('pointerleave', handlePointerUp);
    window.removeEventListener('resize', handleResize);

    clearBars();

    if (groundMesh) {
      groundMesh.geometry.dispose();
      (groundMesh.material as THREE.Material).dispose();
    }
    if (buildingLines) {
      buildingLines.geometry.dispose();
      (buildingLines.material as THREE.Material).dispose();
    }

    controls.dispose();
    renderer.dispose();
    container.removeChild(renderer.domElement);
  }

  renderer.domElement.addEventListener('click', handleClick);
  renderer.domElement.addEventListener('pointerdown', handlePointerDown);
  renderer.domElement.addEventListener('pointerup', handlePointerUp);
  renderer.domElement.addEventListener('pointerleave', handlePointerUp);
  window.addEventListener('resize', handleResize);

  loadDistrict(initialDistrictId, false);

  return {
    scene,
    camera,
    renderer,
    update,
    setDistrict,
    setPerformanceMode,
    onBarClick,
    getMaxDbPoint,
    onDragStateChange,
    dispose
  };
}
