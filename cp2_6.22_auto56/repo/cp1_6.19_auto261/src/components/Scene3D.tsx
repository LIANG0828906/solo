import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useSceneStore } from '../store/sceneStore';
import { FURNITURE_CATALOG, FurnitureType, ROOM_SIZE } from '../types';
import { kelvinToRgb, computeShadowRadius, computeSpotAngle, easeInOutCubic } from '../utils/lightUtils';
import LightControlPanel from './LightControlPanel';

interface PlacementPreview {
  visible: boolean;
  position: { x: number; z: number };
  valid: boolean;
  type: FurnitureType | null;
}

const Scene3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const groundPlaneRef = useRef<THREE.Mesh | null>(null);
  const furnitureMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const lightObjectsRef = useRef<Map<string, { spot: THREE.SpotLight; target: THREE.Object3D; helper?: THREE.Mesh }>>(new Map());
  const controlRingRef = useRef<THREE.Mesh | null>(null);
  const angleIndicatorRef = useRef<THREE.Mesh | null>(null);
  const animFrameRef = useRef<number>(0);

  const isDraggingCameraRef = useRef<'rotate' | 'pan' | null>(null);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const cameraStateRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 6, radius: 500, target: new THREE.Vector3(0, 0, 0) });

  const [placementPreview, setPlacementPreview] = useState<PlacementPreview>({ visible: false, position: { x: 0, z: 0 }, valid: false, type: null });
  const [draggingType, setDraggingType] = useState<FurnitureType | null>(null);
  const [flashEffect, setFlashEffect] = useState(false);
  const [lightControlVisible, setLightControlVisible] = useState(false);
  const [controlledLightId, setControlledLightId] = useState<string | null>(null);
  const [ringScreenPos, setRingScreenPos] = useState<{ x: number; y: number } | null>(null);

  const selectedFurnitureId = useSceneStore((s) => s.selectedFurnitureId);
  const warningFurnitureIds = useSceneStore((s) => s.warningFurnitureIds);
  const lights = useSceneStore((s) => s.lights);
  const addFurniture = useSceneStore((s) => s.addFurniture);
  const selectFurniture = useSceneStore((s) => s.selectFurniture);
  const setLightParams = useSceneStore((s) => s.setLightParams);
  const saveSnapshot = useSceneStore((s) => s.saveSnapshot);
  const setWarningFurniture = useSceneStore((s) => s.setWarningFurniture);
  const storeCamera = useSceneStore((s) => s.camera);

  const previewMeshRef = useRef<THREE.Mesh | null>(null);

  const lightAnimationsRef = useRef<Map<string, {
    fromBrightness: number;
    toBrightness: number;
    fromAngle: number;
    toAngle: number;
    fromColor: THREE.Color;
    toColor: THREE.Color;
    progress: number;
  }>>(new Map());

  const createFurnitureMesh = useCallback((type: FurnitureType, color: string): THREE.Group => {
    const group = new THREE.Group();
    const meshColor = new THREE.Color(color);
    const material = new THREE.MeshStandardMaterial({ color: meshColor, roughness: 0.7, metalness: 0.1 });

    switch (type) {
      case 'sofa': {
        const base = new THREE.Mesh(new THREE.BoxGeometry(100, 20, 50), material);
        base.position.y = 10;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);
        const back = new THREE.Mesh(new THREE.BoxGeometry(100, 30, 8), material);
        back.position.set(0, 25, -21);
        back.castShadow = true;
        group.add(back);
        const armL = new THREE.Mesh(new THREE.BoxGeometry(6, 25, 50), material);
        armL.position.set(-47, 12.5, 0);
        armL.castShadow = true;
        group.add(armL);
        const armR = armL.clone();
        armR.position.x = 47;
        group.add(armR);
        break;
      }
      case 'coffeeTable': {
        const top = new THREE.Mesh(new THREE.BoxGeometry(60, 4, 40), material);
        top.position.y = 25;
        top.castShadow = true;
        top.receiveShadow = true;
        group.add(top);
        const legGeo = new THREE.BoxGeometry(4, 25, 4);
        const positions: [number, number, number][] = [[-26, 12.5, -16], [26, 12.5, -16], [-26, 12.5, 16], [26, 12.5, 16]];
        positions.forEach(p => {
          const leg = new THREE.Mesh(legGeo, material);
          leg.position.set(p[0], p[1], p[2]);
          leg.castShadow = true;
          group.add(leg);
        });
        break;
      }
      case 'floorLamp': {
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.6 });
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 100, 12), poleMat);
        pole.position.y = 50;
        pole.castShadow = true;
        group.add(pole);
        const base = new THREE.Mesh(new THREE.CylinderGeometry(12, 14, 4, 16), poleMat);
        base.position.y = 2;
        base.castShadow = true;
        group.add(base);
        const shadeMat = new THREE.MeshStandardMaterial({ color: 0xf5e6c8, roughness: 0.9, side: THREE.DoubleSide });
        const shade = new THREE.Mesh(new THREE.CylinderGeometry(8, 14, 20, 16, 1, true), shadeMat);
        shade.position.y = 110;
        shade.castShadow = true;
        group.add(shade);
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(4, 12, 12), new THREE.MeshBasicMaterial({ color: 0xfff8e0 }));
        bulb.position.y = 100;
        group.add(bulb);
        break;
      }
      case 'chandelier': {
        const chainMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.8 });
        const chain = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 60, 8), chainMat);
        chain.position.y = 260;
        group.add(chain);
        const frame = new THREE.Mesh(new THREE.TorusGeometry(20, 3, 8, 24), chainMat);
        frame.rotation.x = Math.PI / 2;
        frame.position.y = 230;
        group.add(frame);
        const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfff8e0 });
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const bulb = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 8), bulbMat);
          bulb.position.set(Math.cos(angle) * 20, 230, Math.sin(angle) * 20);
          group.add(bulb);
        }
        const centerBulb = new THREE.Mesh(new THREE.SphereGeometry(5, 10, 10), bulbMat);
        centerBulb.position.y = 230;
        group.add(centerBulb);
        break;
      }
      case 'bookshelf': {
        const side = new THREE.BoxGeometry(3, 150, 25);
        const sideL = new THREE.Mesh(side, material);
        sideL.position.set(-38.5, 75, 0);
        sideL.castShadow = true;
        group.add(sideL);
        const sideR = sideL.clone();
        sideR.position.x = 38.5;
        group.add(sideR);
        const shelfGeo = new THREE.BoxGeometry(74, 2, 25);
        for (let i = 0; i <= 4; i++) {
          const shelf = new THREE.Mesh(shelfGeo, material);
          shelf.position.y = i * 37;
          shelf.castShadow = true;
          shelf.receiveShadow = true;
          group.add(shelf);
        }
        const back = new THREE.Mesh(new THREE.BoxGeometry(80, 150, 1), new THREE.MeshStandardMaterial({ color: 0x8b6f47, roughness: 0.8 }));
        back.position.set(0, 75, -12);
        group.add(back);
        const bookColors = [0x8B0000, 0x006400, 0x00008B, 0x8B8B00, 0x4B0082];
        for (let row = 0; row < 4; row++) {
          for (let col = 0; col < 8; col++) {
            if (Math.random() > 0.3) {
              const h = 25 + Math.random() * 10;
              const bookMat = new THREE.MeshStandardMaterial({ color: bookColors[Math.floor(Math.random() * bookColors.length)], roughness: 0.8 });
              const book = new THREE.Mesh(new THREE.BoxGeometry(6, h, 20), bookMat);
              book.position.set(-32 + col * 9, row * 37 + 2 + h / 2, 0);
              book.castShadow = true;
              group.add(book);
            }
          }
        }
        break;
      }
      case 'carpet': {
        const carpetMat = new THREE.MeshStandardMaterial({ color: meshColor, roughness: 0.95 });
        const carpet = new THREE.Mesh(new THREE.BoxGeometry(150, 2, 100), carpetMat);
        carpet.position.y = 1;
        carpet.receiveShadow = true;
        group.add(carpet);
        const borderMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.8), roughness: 0.9 });
        const borderT = new THREE.Mesh(new THREE.BoxGeometry(150, 3, 6), borderMat);
        borderT.position.set(0, 1.5, 47);
        group.add(borderT);
        const borderB = borderT.clone();
        borderB.position.z = -47;
        group.add(borderB);
        const borderL = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 100), borderMat);
        borderL.position.set(-72, 1.5, 0);
        group.add(borderL);
        const borderR = borderL.clone();
        borderR.position.x = 72;
        group.add(borderR);
        break;
      }
    }

    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).castShadow = true;
        (child as THREE.Mesh).receiveShadow = true;
      }
    });

    return group;
  }, []);

  const checkCollision = useCallback((posX: number, posZ: number, type: FurnitureType, excludeId?: string): boolean => {
    const catalog = FURNITURE_CATALOG.find(c => c.type === type)!;
    const halfW = catalog.defaultSize.w / 2;
    const halfD = catalog.defaultSize.d / 2;
    const furniture = useSceneStore.getState().furniture;
    for (const f of furniture) {
      if (excludeId && f.id === excludeId) continue;
      const fc = FURNITURE_CATALOG.find(c => c.type === f.type)!;
      const fHalfW = fc.defaultSize.w / 2;
      const fHalfD = fc.defaultSize.d / 2;
      if (
        posX - halfW < f.position.x + fHalfW &&
        posX + halfW > f.position.x - fHalfW &&
        posZ - halfD < f.position.z + fHalfD &&
        posZ + halfD > f.position.z - fHalfD
      ) {
        return true;
      }
    }
    return false;
  }, []);

  const checkWarnings = useCallback(() => {
    const furniture = useSceneStore.getState().furniture;
    const warnings: string[] = [];
    for (let i = 0; i < furniture.length; i++) {
      for (let j = i + 1; j < furniture.length; j++) {
        const a = furniture[i];
        const b = furniture[j];
        const dx = Math.abs(a.position.x - b.position.x);
        const dz = Math.abs(a.position.z - b.position.z);
        if (dx < 10 && dz < 10) {
          if (!warnings.includes(a.id)) warnings.push(a.id);
          if (!warnings.includes(b.id)) warnings.push(b.id);
        }
      }
    }
    setWarningFurniture(warnings);
  }, [setWarningFurniture]);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF0F0F0);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 5000);
    updateCameraFromState(camera);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xffffff, 0xeaeaea, 0.3);
    scene.add(hemi);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(300, 500, 300);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    dirLight.shadow.camera.left = -400;
    dirLight.shadow.camera.right = 400;
    dirLight.shadow.camera.top = 400;
    dirLight.shadow.camera.bottom = -400;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 1500;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    createRoom(scene);

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      updateLightAnimations();
      updateControlRingPosition();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  const createRoom = (scene: THREE.Scene) => {
    const { width: rw, height: rh, depth: rd } = ROOM_SIZE;

    const groundGeo = new THREE.PlaneGeometry(rw, rd);
    const gridCanvas = document.createElement('canvas');
    gridCanvas.width = 512;
    gridCanvas.height = 512;
    const ctx = gridCanvas.getContext('2d')!;
    ctx.fillStyle = '#EAEAEA';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#B0B0B0';
    ctx.lineWidth = 1;
    const gridStep = 512 / 20;
    for (let i = 0; i <= 20; i++) {
      const p = i * gridStep + 0.5;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(512, p);
      ctx.stroke();
    }
    const groundTex = new THREE.CanvasTexture(gridCanvas);
    groundTex.wrapS = THREE.RepeatWrapping;
    groundTex.wrapT = THREE.RepeatWrapping;
    groundTex.repeat.set(1, 1);

    const groundMat = new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.9, metalness: 0.0 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = 'ground';
    scene.add(ground);
    groundPlaneRef.current = ground;

    const wallMat = new THREE.MeshStandardMaterial({ color: 0xF8F8F8, roughness: 0.85, side: THREE.DoubleSide });
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(rw, rh), wallMat);
    backWall.position.set(0, rh / 2, -rd / 2);
    backWall.receiveShadow = true;
    scene.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(rd, rh), wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-rw / 2, rh / 2, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(rd, rh), wallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(rw / 2, rh / 2, 0);
    rightWall.receiveShadow = true;
    scene.add(rightWall);
  };

  const updateCameraFromState = (camera: THREE.PerspectiveCamera) => {
    const { theta, phi, radius, target } = cameraStateRef.current;
    camera.position.x = target.x + radius * Math.sin(phi) * Math.cos(theta);
    camera.position.y = target.y + radius * Math.cos(phi);
    camera.position.z = target.z + radius * Math.sin(phi) * Math.sin(theta);
    camera.lookAt(target);
  };

  const updateLightAnimations = () => {
    if (!sceneRef.current) return;
    lightAnimationsRef.current.forEach((anim, id) => {
      anim.progress = Math.min(anim.progress + 0.016, 1);
      const t = easeInOutCubic(anim.progress);
      const brightness = anim.fromBrightness + (anim.toBrightness - anim.fromBrightness) * t;
      const angle = anim.fromAngle + (anim.toAngle - anim.fromAngle) * t;
      const color = anim.fromColor.clone().lerp(anim.toColor, t);

      const lightObj = lightObjectsRef.current.get(id);
      const lightParams = lights[id];
      if (lightObj && lightParams) {
        const effectiveIntensity = lightParams.on ? brightness * 15 : 0;
        lightObj.spot.intensity = effectiveIntensity;
        lightObj.spot.color.copy(color);
        lightObj.spot.penumbra = computeShadowRadius(brightness) / 10;
        lightObj.spot.angle = computeSpotAngle(brightness);
        lightObj.target.rotation.y = -angle * Math.PI / 180;
      }
      if (anim.progress >= 1) {
        lightAnimationsRef.current.delete(id);
      }
    });
  };

  const updateControlRingPosition = () => {
    if (!controlRingRef.current || !cameraRef.current || !rendererRef.current || !containerRef.current) return;
    if (!controlledLightId) return;

    const mesh = furnitureMeshesRef.current.get(controlledLightId);
    if (!mesh) return;

    const lightHeight = mesh.position.y + 100;
    const worldPos = new THREE.Vector3(mesh.position.x, lightHeight, mesh.position.z);
    controlRingRef.current.position.copy(worldPos);
    controlRingRef.current.rotation.y += 0.01;

    const projected = worldPos.clone().project(cameraRef.current);
    const rect = containerRef.current.getBoundingClientRect();
    const sx = (projected.x * 0.5 + 0.5) * rect.width;
    const sy = (-projected.y * 0.5 + 0.5) * rect.height;
    setRingScreenPos({ x: sx, y: sy });

    if (angleIndicatorRef.current) {
      const params = lights[controlledLightId];
      if (params) {
        angleIndicatorRef.current.rotation.y = -params.angle * Math.PI / 180;
        angleIndicatorRef.current.position.copy(worldPos);
      }
    }
  };

  useEffect(() => {
    if (!sceneRef.current) return;
    const state = useSceneStore.getState();
    const existingIds = new Set(furnitureMeshesRef.current.keys());
    const newIds = new Set(state.furniture.map(f => f.id));

    existingIds.forEach(id => {
      if (!newIds.has(id)) {
        const mesh = furnitureMeshesRef.current.get(id);
        if (mesh) sceneRef.current!.remove(mesh);
        furnitureMeshesRef.current.delete(id);
        const lightObj = lightObjectsRef.current.get(id);
        if (lightObj) {
          sceneRef.current!.remove(lightObj.spot);
          sceneRef.current!.remove(lightObj.target);
          lightObjectsRef.current.delete(id);
        }
      }
    });

    state.furniture.forEach(item => {
      let mesh = furnitureMeshesRef.current.get(item.id);
      const catalog = FURNITURE_CATALOG.find(c => c.type === item.type)!;
      if (!mesh) {
        mesh = createFurnitureMesh(item.type, catalog.color);
        mesh.name = item.id;
        furnitureMeshesRef.current.set(item.id, mesh);
        sceneRef.current!.add(mesh);

        if (catalog.isLight) {
          setupSpotLight(item.id, mesh);
        }
      }
      mesh.position.set(item.position.x, item.position.y, item.position.z);
      mesh.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
      mesh.scale.set(item.scale.x, item.scale.y, item.scale.z);

      if (item.id === selectedFurnitureId) {
        mesh.children.forEach(child => {
          const m = child as THREE.Mesh;
          if (m.isMesh && m.material) {
            const mats = Array.isArray(m.material) ? m.material : [m.material];
            mats.forEach(mat => {
              if ('emissive' in mat) {
                (mat as THREE.MeshStandardMaterial).emissive.set(0x333333);
                (mat as THREE.MeshStandardMaterial).emissiveIntensity = warningFurnitureIds.includes(item.id) ? 0.6 : 0.3;
              }
            });
          }
        });
      } else {
        mesh.children.forEach(child => {
          const m = child as THREE.Mesh;
          if (m.isMesh && m.material) {
            const mats = Array.isArray(m.material) ? m.material : [m.material];
            mats.forEach(mat => {
              if ('emissive' in mat) {
                (mat as THREE.MeshStandardMaterial).emissive.set(0x000000);
                (mat as THREE.MeshStandardMaterial).emissiveIntensity = 0;
              }
            });
          }
        });
      }

      if (catalog.isLight) {
        updateLightForFurniture(item.id);
      }
    });
  }, [useSceneStore.getState().furniture, selectedFurnitureId, warningFurnitureIds]);

  useEffect(() => {
    Object.keys(lights).forEach(id => {
      updateLightForFurniture(id);
    });
  }, [JSON.stringify(Object.keys(lights).map(k => `${k}:${JSON.stringify(lights[k])}`))]);

  const setupSpotLight = (id: string, parent: THREE.Group) => {
    if (!sceneRef.current) return;
    const item = useSceneStore.getState().furniture.find(f => f.id === id);
    if (!item) return;

    const spot = new THREE.SpotLight(0xffffff, 0, 45, Math.PI / 5, 0.4, 1.2);
    spot.castShadow = true;
    spot.shadow.mapSize.set(2048, 2048);
    spot.shadow.bias = -0.0001;
    spot.shadow.normalBias = 0.02;

    const target = new THREE.Object3D();

    if (item.type === 'floorLamp') {
      spot.position.set(0, 95, 0);
      target.position.set(0, 0, 60);
    } else if (item.type === 'chandelier') {
      spot.position.set(0, 210, 0);
      target.position.set(0, 0, 80);
    }

    target.rotation.y = 0;
    parent.add(spot);
    parent.add(target);
    spot.target = target;

    lightObjectsRef.current.set(id, { spot, target });
  };

  const updateLightForFurniture = (id: string) => {
    const lightObj = lightObjectsRef.current.get(id);
    const params = lights[id];
    if (!lightObj || !params) return;

    const currentAnim = lightAnimationsRef.current.get(id);
    const fromBrightness = currentAnim ? (currentAnim.fromBrightness + (currentAnim.toBrightness - currentAnim.fromBrightness) * easeInOutCubic(currentAnim.progress)) : lightObj.spot.intensity / 15;
    const fromAngle = currentAnim ? (currentAnim.fromAngle + (currentAnim.toAngle - currentAnim.fromAngle) * easeInOutCubic(currentAnim.progress)) : (lightObj.target.rotation.y * -180 / Math.PI);
    const fromColor = currentAnim ? currentAnim.fromColor.clone().lerp(currentAnim.toColor, easeInOutCubic(currentAnim.progress)) : lightObj.spot.color.clone();

    lightAnimationsRef.current.set(id, {
      fromBrightness: Math.max(0, Math.min(1, fromBrightness)),
      toBrightness: params.brightness,
      fromAngle,
      toAngle: params.angle,
      fromColor,
      toColor: kelvinToRgb(params.colorTemp),
      progress: 0,
    });
  };

  const getGroundIntersection = (clientX: number, clientY: number): THREE.Vector3 | null => {
    if (!containerRef.current || !cameraRef.current || !groundPlaneRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObject(groundPlaneRef.current);
    if (intersects.length > 0) {
      return intersects[0].point;
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    lastMousePosRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    if (e.button === 0) {
      isDraggingCameraRef.current = 'rotate';
      const hit = checkFurnitureHit(e.clientX, e.clientY);
      if (hit) {
        selectFurniture(hit.id);
        const catalog = FURNITURE_CATALOG.find(c => c.type === hit.type)!;
        if (catalog.isLight) {
          showControlRing(hit.id);
        } else {
          hideControlRing();
        }
        isDraggingCameraRef.current = null;
      } else {
        selectFurniture(null);
        hideControlRing();
      }
    } else if (e.button === 2) {
      isDraggingCameraRef.current = 'pan';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const dx = mx - lastMousePosRef.current.x;
    const dy = my - lastMousePosRef.current.y;

    if (draggingType) {
      const point = getGroundIntersection(e.clientX, e.clientY);
      if (point) {
        const { width: rw, depth: rd } = ROOM_SIZE;
        const catalog = FURNITURE_CATALOG.find(c => c.type === draggingType)!;
        let px = Math.max(-rw / 2 + catalog.defaultSize.w / 2, Math.min(rw / 2 - catalog.defaultSize.w / 2, point.x));
        let pz = Math.max(-rd / 2 + catalog.defaultSize.d / 2, Math.min(rd / 2 - catalog.defaultSize.d / 2, point.z));
        const collided = checkCollision(px, pz, draggingType);
        setPlacementPreview({ visible: true, position: { x: px, z: pz }, valid: !collided, type: draggingType });
        if (previewMeshRef.current && sceneRef.current) {
          previewMeshRef.current.position.set(px, 0.1, pz);
          (previewMeshRef.current.material as THREE.MeshBasicMaterial).color.set(collided ? 0xff4444 : 0x44ff44);
        }
      }
      return;
    }

    if (isDraggingCameraRef.current === 'rotate') {
      cameraStateRef.current.theta -= dx * 0.005;
      cameraStateRef.current.phi = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, cameraStateRef.current.phi - dy * 0.005));
      if (cameraRef.current) updateCameraFromState(cameraRef.current);
    } else if (isDraggingCameraRef.current === 'pan') {
      const panSpeed = 0.8;
      const right = new THREE.Vector3();
      const up = new THREE.Vector3(0, 1, 0);
      cameraRef.current!.getWorldDirection(right);
      right.cross(up).normalize();
      cameraStateRef.current.target.addScaledVector(right, -dx * panSpeed);
      cameraStateRef.current.target.y += dy * panSpeed;
      if (cameraRef.current) updateCameraFromState(cameraRef.current);
    }

    lastMousePosRef.current = { x: mx, y: my };
  };

  const handleMouseUp = () => {
    isDraggingCameraRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    cameraStateRef.current.radius = Math.max(150, Math.min(1200, cameraStateRef.current.radius + e.deltaY * 0.5));
    if (cameraRef.current) updateCameraFromState(cameraRef.current);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const hit = checkFurnitureHit(e.clientX, e.clientY);
    if (hit) {
      const catalog = FURNITURE_CATALOG.find(c => c.type === hit.type)!;
      if (catalog.isLight) {
        showControlRing(hit.id);
      }
    }
  };

  const checkFurnitureHit = (clientX: number, clientY: number): { id: string; type: FurnitureType } | null => {
    if (!containerRef.current || !cameraRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const meshes: THREE.Object3D[] = [];
    furnitureMeshesRef.current.forEach(m => meshes.push(m));
    const intersects = raycasterRef.current.intersectObjects(meshes, true);
    if (intersects.length > 0) {
      let obj: THREE.Object3D | null = intersects[0].object;
      while (obj && !furnitureMeshesRef.current.has(obj.name)) {
        obj = obj.parent;
      }
      if (obj) {
        const item = useSceneStore.getState().furniture.find(f => f.id === obj!.name);
        if (item) return { id: item.id, type: item.type };
      }
    }
    return null;
  };

  const showControlRing = (id: string) => {
    if (!sceneRef.current) return;
    hideControlRing();
    setControlledLightId(id);
    setLightControlVisible(true);

    const ringGeo = new THREE.RingGeometry(18, 22, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xFFE4A0, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthTest: false });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.name = 'controlRing';
    sceneRef.current.add(ring);
    controlRingRef.current = ring;

    const indicatorGeo = new THREE.BoxGeometry(20, 2, 2);
    const indicatorMat = new THREE.MeshBasicMaterial({ color: 0xFFAA00, depthTest: false });
    const indicator = new THREE.Mesh(indicatorGeo, indicatorMat);
    indicator.position.z = 14;
    indicator.name = 'angleIndicator';
    ring.add(indicator);
    angleIndicatorRef.current = indicator;
  };

  const hideControlRing = () => {
    if (sceneRef.current && controlRingRef.current) {
      sceneRef.current.remove(controlRingRef.current);
      controlRingRef.current = null;
    }
    angleIndicatorRef.current = null;
    setRingScreenPos(null);
    setLightControlVisible(false);
    setControlledLightId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    const type = e.dataTransfer.types.includes('furnitureType') ? null : null;
    if (draggingType === null) {
      const t = e.dataTransfer.getData('furnitureType') as FurnitureType;
      if (t) {
        setDraggingType(t);
        if (sceneRef.current) {
          const previewGeo = new THREE.BoxGeometry(
            FURNITURE_CATALOG.find(c => c.type === t)!.defaultSize.w,
            1,
            FURNITURE_CATALOG.find(c => c.type === t)!.defaultSize.d
          );
          const previewMat = new THREE.MeshBasicMaterial({ color: 0x44ff44, transparent: true, opacity: 0.35, depthTest: false });
          const previewMesh = new THREE.Mesh(previewGeo, previewMat);
          previewMesh.name = 'placementPreview';
          sceneRef.current.add(previewMesh);
          previewMeshRef.current = previewMesh;
        }
      }
    }
    void type;
  };

  const handleDragLeave = () => {
    setDraggingType(null);
    setPlacementPreview(p => ({ ...p, visible: false }));
    if (sceneRef.current && previewMeshRef.current) {
      sceneRef.current.remove(previewMeshRef.current);
      previewMeshRef.current = null;
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('furnitureType') as FurnitureType;
    if (type && placementPreview.valid && placementPreview.visible) {
      addFurniture({
        type,
        position: { x: placementPreview.position.x, y: 0, z: placementPreview.position.z },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      });
      setTimeout(checkWarnings, 50);
    }
    setDraggingType(null);
    setPlacementPreview(p => ({ ...p, visible: false, type: null }));
    if (sceneRef.current && previewMeshRef.current) {
      sceneRef.current.remove(previewMeshRef.current);
      previewMeshRef.current = null;
    }
  };

  const capturePhoto = useCallback(() => {
    if (!rendererRef.current || !cameraRef.current || !sceneRef.current) return;
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
    const cam = cameraRef.current;
    saveSnapshot(dataUrl, {
      position: { x: cam.position.x, y: cam.position.y, z: cam.position.z },
      target: { x: cameraStateRef.current.target.x, y: cameraStateRef.current.target.y, z: cameraStateRef.current.target.z },
    });
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);
  }, [saveSnapshot]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'p' && !e.repeat) {
        capturePhoto();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedFurnitureId) {
          useSceneStore.getState().removeFurniture(selectedFurnitureId);
          setTimeout(checkWarnings, 50);
          if (controlledLightId === selectedFurnitureId) {
            hideControlRing();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [capturePhoto, selectedFurnitureId, controlledLightId, checkWarnings]);

  useEffect(() => {
    const cam = cameraRef.current;
    if (!cam) return;
    cam.position.set(storeCamera.position.x, storeCamera.position.y, storeCamera.position.z);
    cameraStateRef.current.target.set(storeCamera.target.x, storeCamera.target.y, storeCamera.target.z);
    const dx = cam.position.x - cameraStateRef.current.target.x;
    const dy = cam.position.y - cameraStateRef.current.target.y;
    const dz = cam.position.z - cameraStateRef.current.target.z;
    cameraStateRef.current.radius = Math.sqrt(dx * dx + dy * dy + dz * dz);
    cameraStateRef.current.phi = Math.acos(dy / cameraStateRef.current.radius);
    cameraStateRef.current.theta = Math.atan2(dz, dx);
    cam.lookAt(cameraStateRef.current.target);
  }, [storeCamera.position.x, storeCamera.position.y, storeCamera.position.z, storeCamera.target.x, storeCamera.target.y, storeCamera.target.z]);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#F2F2F2',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {flashEffect && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#FFFFFF',
            pointerEvents: 'none',
            animation: 'flashAnim 0.2s ease-out',
            zIndex: 1000,
          }}
        />
      )}
      <style>{`
        @keyframes flashAnim {
          0% { opacity: 0; }
          30% { opacity: 0.85; }
          100% { opacity: 0; }
        }
      `}</style>

      {warningFurnitureIds.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 170, 60, 0.95)',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 100,
          }}
        >
          ⚠ 部分家具间距过小（小于10单位），请调整布局
        </div>
      )}

      {lightControlVisible && controlledLightId && ringScreenPos && (
        <LightControlPanel
          lightId={controlledLightId}
          position={ringScreenPos}
          lights={lights}
          setLightParams={setLightParams}
          onClose={hideControlRing}
        />
      )}

      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          fontSize: '11px',
          color: '#888',
          lineHeight: 1.7,
          background: 'rgba(255,255,255,0.7)',
          padding: '10px 14px',
          borderRadius: 8,
          backdropFilter: 'blur(4px)',
          pointerEvents: 'none',
        }}
      >
        <div>🖱 左键旋转 · 滚轮缩放 · 右键平移</div>
        <div>📸 P键拍照 · Delete键删除选中家具</div>
        <div>💡 双击灯具调整光束角度与亮度</div>
      </div>
    </div>
  );
};

export default Scene3D;
