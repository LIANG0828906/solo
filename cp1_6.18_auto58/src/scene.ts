import * as THREE from 'three';
import { SculptureData, MoodType, MOOD_COLORS, MOOD_SHAPES } from './types';
import { useAppStore } from './store';

interface SculptureMesh {
  id: string;
  mainMesh: THREE.Mesh;
  haloMesh: THREE.Mesh;
  group: THREE.Group;
  originalScale: number;
  targetScale: number;
  targetOpacity: number;
  pulsePhase: number;
  isPulsing: boolean;
}

export interface SceneAPI {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  sculptureMeshes: Map<string, SculptureMesh>;
  addSculpture: (data: SculptureData) => void;
  removeSculpture: (id: string) => void;
  focusSculpture: (id: string | null) => void;
  updateFilter: (filterMood: MoodType | null) => void;
  updateShelf: () => void;
  dispose: () => void;
}

let sceneAPI: SceneAPI | null = null;
let animationFrameId: number | null = null;

const createSculptureGeometry = (mood: MoodType, radius: number): THREE.BufferGeometry => {
  const shape = MOOD_SHAPES[mood];

  switch (shape) {
    case 'sphere':
      return new THREE.SphereGeometry(radius, 64, 64);
    case 'teardrop': {
      const points: THREE.Vector2[] = [];
      const segments = 64;
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = radius * Math.sin(t * Math.PI) * (1 - 0.3 * t);
        const y = -radius * Math.cos(t * Math.PI) * 1.2 + radius * 0.2;
        points.push(new THREE.Vector2(x, y));
      }
      return new THREE.LatheGeometry(points, 64);
    }
    case 'spike': {
      const geometry = new THREE.IcosahedronGeometry(radius, 2);
      const positions = geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        const len = Math.sqrt(x * x + y * y + z * z);
        const noise = 1 + Math.random() * 0.6;
        positions.setXYZ(i, (x / len) * radius * noise, (y / len) * radius * noise, (z / len) * radius * noise);
      }
      geometry.computeVertexNormals();
      return geometry;
    }
    case 'torus':
      return new THREE.TorusGeometry(radius, radius * 0.3, 32, 100);
    case 'icosahedron':
      return new THREE.IcosahedronGeometry(radius, 1);
    default:
      return new THREE.SphereGeometry(radius, 64, 64);
  }
};

const createSculpture = (data: SculptureData): SculptureMesh => {
  const group = new THREE.Group();
  const color = new THREE.Color(MOOD_COLORS[data.mood]);
  const radius = data.baseRadius;

  const geometry = createSculptureGeometry(data.mood, radius);
  const material = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.3,
    roughness: 0.4,
    emissive: color,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 1
  });
  const mainMesh = new THREE.Mesh(geometry, material);
  mainMesh.castShadow = true;
  mainMesh.receiveShadow = true;
  group.add(mainMesh);

  const haloGeometry = createSculptureGeometry(data.mood, radius * 1.2);
  const haloMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.15,
    side: THREE.BackSide
  });
  const haloMesh = new THREE.Mesh(haloGeometry, haloMaterial);
  group.add(haloMesh);

  group.position.set(data.position.x, data.position.y, data.position.z);
  if (data.isOnShelf) {
    group.scale.setScalar(0.4);
  }

  return {
    id: data.id,
    mainMesh,
    haloMesh,
    group,
    originalScale: data.isOnShelf ? 0.4 : 1,
    targetScale: data.isOnShelf ? 0.4 : 1,
    targetOpacity: 1,
    pulsePhase: Math.random() * Math.PI * 2,
    isPulsing: true
  };
};

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

export const initScene = (container: HTMLElement): SceneAPI => {
  if (sceneAPI) {
    return sceneAPI;
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0D1117');
  scene.fog = new THREE.Fog('#0D1117', 300, 800);

  const camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    2000
  );
  camera.position.set(0, 30, 180);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
  mainLight.position.set(100, 150, 100);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.width = 2048;
  mainLight.shadow.mapSize.height = 2048;
  mainLight.shadow.camera.near = 0.5;
  mainLight.shadow.camera.far = 1000;
  mainLight.shadow.camera.left = -300;
  mainLight.shadow.camera.right = 300;
  mainLight.shadow.camera.top = 300;
  mainLight.shadow.camera.bottom = -300;
  scene.add(mainLight);

  const rimLight = new THREE.DirectionalLight(0x4ecdc4, 0.5);
  rimLight.position.set(-100, 50, -100);
  scene.add(rimLight);

  const fillLight = new THREE.PointLight(0xff6b6b, 0.3, 500);
  fillLight.position.set(0, -50, 100);
  scene.add(fillLight);

  const starsGeometry = new THREE.BufferGeometry();
  const starsCount = 1000;
  const positions = new Float32Array(starsCount * 3);
  for (let i = 0; i < starsCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 2000;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 2000;
  }
  starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, transparent: true, opacity: 0.6 });
  const stars = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(stars);

  const shelfGroup = new THREE.Group();
  const shelfCurve = new THREE.EllipseCurve(
    0, 0,
    200, 200,
    Math.PI * 0.2, Math.PI * 0.8,
    false,
    0
  );
  const shelfPoints = shelfCurve.getPoints(100);
  const shelfGeometry = new THREE.BufferGeometry().setFromPoints(
    shelfPoints.map(p => new THREE.Vector3(p.x, -30, -p.y - 50))
  );
  const shelfMaterial = new THREE.LineBasicMaterial({ color: 0x4ecdc4, transparent: true, opacity: 0.3 });
  const shelfLine = new THREE.Line(shelfGeometry, shelfMaterial);
  shelfGroup.add(shelfLine);
  scene.add(shelfGroup);

  const sculptureMeshes = new Map<string, SculptureMesh>();

  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  let rotationVelocity = { x: 0, y: 0 };
  let cameraPolarAngle = Math.PI / 3;
  let cameraAzimuthAngle = 0;
  let cameraDistance = 180;
  let targetCameraPolarAngle = cameraPolarAngle;
  let targetCameraAzimuthAngle = cameraAzimuthAngle;
  let targetCameraDistance = cameraDistance;
  let isFocused = false;
  let focusedPosition: THREE.Vector3 | null = null;

  const updateCameraPosition = () => {
    const lookTarget = focusedPosition || new THREE.Vector3(0, 0, 0);
    const clampedPolar = Math.max((30 * Math.PI) / 180, Math.min((120 * Math.PI) / 180, targetCameraPolarAngle));
    targetCameraPolarAngle = clampedPolar;

    camera.position.x = lookTarget.x + targetCameraDistance * Math.sin(targetCameraPolarAngle) * Math.sin(targetCameraAzimuthAngle);
    camera.position.y = lookTarget.y + targetCameraDistance * Math.cos(targetCameraPolarAngle);
    camera.position.z = lookTarget.z + targetCameraDistance * Math.sin(targetCameraPolarAngle) * Math.cos(targetCameraAzimuthAngle);
    camera.lookAt(lookTarget);
  };

  const canvas = renderer.domElement;

  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
    rotationVelocity = { x: 0, y: 0 };
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) {
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const allMeshes: THREE.Object3D[] = [];
      sculptureMeshes.forEach((sm) => allMeshes.push(sm.mainMesh));
      const intersects = raycaster.intersectObjects(allMeshes);

      sculptureMeshes.forEach((sm, id) => {
        const sculptureData = useAppStore.getState().sculptures.find(s => s.id === id);
        if (intersects.length > 0 && intersects[0].object === sm.mainMesh) {
          if (sculptureData?.isOnShelf) {
            sm.targetScale = 1;
          }
          canvas.style.cursor = 'pointer';
        } else {
          if (sculptureData?.isOnShelf) {
            sm.targetScale = 0.4;
          }
          if (!isDragging) canvas.style.cursor = 'grab';
        }
      });
      return;
    }

    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;

    rotationVelocity.y = deltaX * 0.005;
    rotationVelocity.x = deltaY * 0.005;

    targetCameraAzimuthAngle += rotationVelocity.y;
    targetCameraPolarAngle += rotationVelocity.x;

    previousMousePosition = { x: e.clientX, y: e.clientY };
    canvas.style.cursor = 'grabbing';
  });

  canvas.addEventListener('mouseup', () => {
    isDragging = false;
    canvas.style.cursor = 'grab';
  });

  canvas.addEventListener('mouseleave', () => {
    isDragging = false;
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    targetCameraDistance += e.deltaY * 0.3;
    targetCameraDistance = Math.max(50, Math.min(500, targetCameraDistance));
  }, { passive: false });

  let lastClickTime = 0;
  let lastClickPosition = { x: 0, y: 0 };

  canvas.addEventListener('click', (e) => {
    const now = Date.now();
    const dist = Math.sqrt(Math.pow(e.clientX - lastClickPosition.x, 2) + Math.pow(e.clientY - lastClickPosition.y, 2));

    if (now - lastClickTime < 300 && dist < 20) {
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const allMeshes: THREE.Object3D[] = [];
      const meshToId = new Map<THREE.Object3D, string>();
      sculptureMeshes.forEach((sm, id) => {
        allMeshes.push(sm.mainMesh);
        meshToId.set(sm.mainMesh, id);
      });
      const intersects = raycaster.intersectObjects(allMeshes);

      if (intersects.length > 0) {
        const id = meshToId.get(intersects[0].object);
        if (id) {
          const currentFocused = useAppStore.getState().focusedSculptureId;
          if (currentFocused === id) {
            sceneAPI?.focusSculpture(null);
          } else {
            sceneAPI?.focusSculpture(id);
          }
        }
      } else {
        sceneAPI?.focusSculpture(null);
      }
    }

    lastClickTime = now;
    lastClickPosition = { x: e.clientX, y: e.clientY };
  });

  const handleResize = () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  };
  window.addEventListener('resize', handleResize);

  let lastTime = performance.now();

  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);

    const currentTime = performance.now();
    const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;

    cameraPolarAngle += (targetCameraPolarAngle - cameraPolarAngle) * 0.1;
    cameraAzimuthAngle += (targetCameraAzimuthAngle - cameraAzimuthAngle) * 0.1;
    cameraDistance += (targetCameraDistance - cameraDistance) * 0.1;

    if (focusedPosition && isFocused) {
      const currentLook = new THREE.Vector3();
      camera.getWorldDirection(currentLook).negate();
      const targetLook = new THREE.Vector3().copy(focusedPosition).sub(camera.position).normalize();
    }
    updateCameraPosition();

    sculptureMeshes.forEach((sm) => {
      const mainMat = sm.mainMesh.material as THREE.MeshStandardMaterial;
      const haloMat = sm.haloMesh.material as THREE.MeshBasicMaterial;

      if (sm.isPulsing) {
        sm.pulsePhase += delta * Math.PI;
        const pulse = 1 + 0.03 * Math.sin(sm.pulsePhase);
        sm.mainMesh.scale.setScalar(pulse);

        const haloPulse = 1.1 + 0.2 * (0.5 + 0.5 * Math.sin(sm.pulsePhase));
        const haloScale = haloPulse / pulse;
        sm.haloMesh.scale.setScalar(haloScale);

        mainMat.emissiveIntensity = 0.15 + 0.1 * (0.5 + 0.5 * Math.sin(sm.pulsePhase));
        haloMat.opacity = 0.1 + 0.1 * (0.5 + 0.5 * Math.sin(sm.pulsePhase));
      } else {
        haloMat.opacity = 0.08;
        mainMat.emissiveIntensity = 0.1;
      }

      const currentScale = sm.group.scale.x;
      const newScale = currentScale + (sm.targetScale - currentScale) * Math.min(1, delta * 4);
      sm.group.scale.setScalar(newScale);

      const currentOpacity = mainMat.opacity;
      const newOpacity = currentOpacity + (sm.targetOpacity - currentOpacity) * Math.min(1, delta * 4);
      mainMat.opacity = newOpacity;
      haloMat.opacity = newOpacity * (sm.isPulsing ? (0.1 + 0.1 * (0.5 + 0.5 * Math.sin(sm.pulsePhase))) : 0.08);

      mainMat.transparent = newOpacity < 0.99;
      haloMat.transparent = true;
    });

    if (!isDragging) {
      rotationVelocity.x *= 0.9;
      rotationVelocity.y *= 0.9;
      if (Math.abs(rotationVelocity.y) > 0.0001) {
        targetCameraAzimuthAngle += rotationVelocity.y;
      }
      if (Math.abs(rotationVelocity.x) > 0.0001) {
        targetCameraPolarAngle += rotationVelocity.x;
      }
    }

    stars.rotation.y += delta * 0.005;

    renderer.render(scene, camera);
  };

  animate();

  sceneAPI = {
    scene,
    camera,
    renderer,
    sculptureMeshes,

    addSculpture: (data: SculptureData) => {
      if (sculptureMeshes.has(data.id)) return;

      const sm = createSculpture(data);
      sculptureMeshes.set(data.id, sm);
      scene.add(sm.group);

      sm.group.scale.setScalar(0.01);
      sm.targetScale = data.isOnShelf ? 0.4 : 1;
      sm.originalScale = sm.targetScale;

      const startPos = data.isOnShelf
        ? new THREE.Vector3(data.position.x, data.position.y - 50, data.position.z)
        : new THREE.Vector3(0, -100, 0);
      const endPos = new THREE.Vector3(data.position.x, data.position.y, data.position.z);
      sm.group.position.copy(startPos);

      let startTime = performance.now();
      const animIn = () => {
        const elapsed = (performance.now() - startTime) / 1000;
        const t = Math.min(1, elapsed / 0.5);
        const eased = easeOutCubic(t);
        sm.group.position.lerpVectors(startPos, endPos, eased);
        if (t < 1) requestAnimationFrame(animIn);
      };
      animIn();
    },

    removeSculpture: (id: string) => {
      const sm = sculptureMeshes.get(id);
      if (!sm) return;

      sm.targetOpacity = 0;
      sm.targetScale = 0.01;

      setTimeout(() => {
        scene.remove(sm.group);
        sm.mainMesh.geometry.dispose();
        (sm.mainMesh.material as THREE.Material).dispose();
        sm.haloMesh.geometry.dispose();
        (sm.haloMesh.material as THREE.Material).dispose();
        sculptureMeshes.delete(id);
      }, 1000);
    },

    focusSculpture: (id: string | null) => {
      useAppStore.getState().setFocusedSculptureId(id);
      isFocused = id !== null;

      sculptureMeshes.forEach((sm, meshId) => {
        sm.isPulsing = id === null || meshId === id;
      });

      if (id) {
        const sm = sculptureMeshes.get(id);
        if (sm) {
          const data = useAppStore.getState().sculptures.find(s => s.id === id);
          const radius = data?.baseRadius || 25;
          const offsetDistance = radius * 5 + 80;

          const direction = new THREE.Vector3()
            .subVectors(camera.position, sm.group.position)
            .normalize();

          focusedPosition = sm.group.position.clone();
          const newCameraPos = new THREE.Vector3()
            .copy(sm.group.position)
            .add(direction.multiplyScalar(offsetDistance));

          const lookDir = new THREE.Vector3().subVectors(sm.group.position, camera.position);
          targetCameraAzimuthAngle = Math.atan2(lookDir.x, lookDir.z);
          targetCameraPolarAngle = Math.acos(lookDir.y / lookDir.length());
          targetCameraDistance = offsetDistance;
        }
      } else {
        focusedPosition = null;
        targetCameraPolarAngle = Math.PI / 3;
        targetCameraAzimuthAngle = 0;
        targetCameraDistance = 180;
      }
    },

    updateFilter: (filterMood: MoodType | null) => {
      const sculptures = useAppStore.getState().sculptures;
      sculptures.forEach((sculpture) => {
        const sm = sculptureMeshes.get(sculpture.id);
        if (!sm) return;

        if (filterMood === null) {
          sm.targetOpacity = 1;
        } else {
          sm.targetOpacity = sculpture.mood === filterMood ? 1 : 0.15;
        }
      });
    },

    updateShelf: () => {
      const sculptures = useAppStore.getState().sculptures;
      sculptures.forEach((sculpture) => {
        const sm = sculptureMeshes.get(sculpture.id);
        if (!sm) return;

        sm.group.position.set(
          sculpture.position.x,
          sculpture.position.y,
          sculpture.position.z
        );

        if (sculpture.isOnShelf && useAppStore.getState().focusedSculptureId !== sculpture.id) {
          sm.targetScale = 0.4;
          sm.originalScale = 0.4;
        }
      });
    },

    dispose: () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener('resize', handleResize);
      sculptureMeshes.forEach((sm) => {
        sm.mainMesh.geometry.dispose();
        (sm.mainMesh.material as THREE.Material).dispose();
        sm.haloMesh.geometry.dispose();
        (sm.haloMesh.material as THREE.Material).dispose();
      });
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      sceneAPI = null;
    }
  };

  return sceneAPI;
};

export const getSceneAPI = (): SceneAPI | null => sceneAPI;
