import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useBuildingStore } from '../store/buildingStore';
import { BuildingParams, computeShadowPolygon, shadowToShape } from '../utils/shadowSolver';

interface BuildingMeshUserData {
  buildingId: string;
  targetHeight: number;
  currentHeight: number;
  targetX: number;
  targetZ: number;
  isHovered: number;
  targetHover: number;
}

interface BuildingMesh extends THREE.Mesh {
  userData: BuildingMeshUserData;
  geometry: THREE.BoxGeometry;
}

export default function Scene3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const buildingsMapRef = useRef<Map<string, { mesh: BuildingMesh; edges: THREE.LineSegments; hover: THREE.Mesh }>>(new Map());
  const shadowsMapRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const animFrameRef = useRef<number>(0);
  const fpsCounterRef = useRef({ frames: 0, lastTime: performance.now(), fps: 0 });
  const frameCountRef = useRef(0);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const hoveredIdRef = useRef<string | null>(null);

  const {
    buildings,
    selectedBuildingId,
    sunAltitude,
    sunAzimuth,
    shadowEnabled,
    setRenderInfo,
    selectBuilding,
  } = useBuildingStore();

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a202c);
    scene.fog = new THREE.Fog(0x1a202c, 200, 600);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    camera.position.set(120, 150, 120);
    camera.lookAt(0, 20, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 30;
    controls.maxDistance = 500;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    const ambient = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xa0c4ff, 0x4a5568, 0.4);
    scene.add(hemi);

    const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.8);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -300;
    sunLight.shadow.camera.right = 300;
    sunLight.shadow.camera.top = 300;
    sunLight.shadow.camera.bottom = -300;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    const sunHelper = new THREE.PointLight(0xffaa44, 0, 0);
    scene.add(sunHelper);

    const groundGeo = new THREE.PlaneGeometry(500, 500, 1, 1);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e0,
      roughness: 0.95,
      metalness: 0,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = 'ground';
    scene.add(ground);

    const grid = new THREE.GridHelper(500, 50, 0xa0aec0, 0xa0aec0);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.5;
    scene.add(grid);

    const handleClick = (event: MouseEvent) => {
      if (!mountRef.current || !camera) return;
      const rect = mountRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const buildingMeshes = Array.from(buildingsMapRef.current.values()).map((v) => v.mesh);
      const hits = raycasterRef.current.intersectObjects(buildingMeshes);
      if (hits.length > 0) {
        const mesh = hits[0].object as BuildingMesh;
        selectBuilding(mesh.userData.buildingId);
      } else {
        selectBuilding(null);
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!mountRef.current || !camera) return;
      const rect = mountRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const buildingMeshes = Array.from(buildingsMapRef.current.values()).map((v) => v.mesh);
      const hits = raycasterRef.current.intersectObjects(buildingMeshes);
      const newHovered = hits.length > 0 ? (hits[0].object as BuildingMesh).userData.buildingId : null;
      if (hoveredIdRef.current !== newHovered) {
        if (hoveredIdRef.current) {
          const prev = buildingsMapRef.current.get(hoveredIdRef.current);
          if (prev) prev.mesh.userData.targetHover = 0;
        }
        if (newHovered) {
          const curr = buildingsMapRef.current.get(newHovered);
          if (curr) curr.mesh.userData.targetHover = 0.2;
        }
        hoveredIdRef.current = newHovered;
      }
    };

    renderer.domElement.addEventListener('click', handleClick);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const now = performance.now();
      frameCountRef.current++;
      fpsCounterRef.current.frames++;
      if (now - fpsCounterRef.current.lastTime >= 500) {
        fpsCounterRef.current.fps = Math.round((fpsCounterRef.current.frames * 1000) / (now - fpsCounterRef.current.lastTime));
        fpsCounterRef.current.frames = 0;
        fpsCounterRef.current.lastTime = now;
        setRenderInfo(fpsCounterRef.current.fps, frameCountRef.current);
      }

      buildingsMapRef.current.forEach(({ mesh, hover }) => {
        const dh = mesh.userData.targetHeight - mesh.userData.currentHeight;
        if (Math.abs(dh) > 0.01) {
          const step = dh * Math.min(1, 0.012 * 10 / 0.5);
          mesh.userData.currentHeight += step;
          const h = mesh.userData.currentHeight;
          mesh.scale.y = h / Math.max(0.01, mesh.geometry.parameters?.height || 1);
          mesh.position.y = h / 2;
          const edges = mesh.parent?.children.find((c) => c.userData?.isEdge) as THREE.LineSegments | undefined;
          if (edges) {
            edges.scale.y = mesh.scale.y;
            edges.position.y = h / 2;
          }
          const hov = mesh.parent?.children.find((c) => c.userData?.isHover) as THREE.Mesh | undefined;
          if (hov) {
            hov.scale.y = mesh.scale.y;
            hov.position.y = h / 2;
          }
        }
        const dx = mesh.userData.targetX - mesh.position.x;
        const dz = mesh.userData.targetZ - mesh.position.z;
        if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
          const t = Math.min(1, 0.012 * 10 / 0.5);
          mesh.position.x += dx * t;
          mesh.position.z += dz * t;
          const parent = mesh.parent;
          if (parent) {
            parent.position.x = mesh.position.x;
            parent.position.z = mesh.position.z;
            mesh.position.x = 0;
            mesh.position.z = 0;
          }
        }
        const hovDiff = mesh.userData.targetHover - mesh.userData.isHovered;
        if (Math.abs(hovDiff) > 0.001) {
          mesh.userData.isHovered += hovDiff * 0.25;
          const hov = mesh.parent?.children.find((c) => c.userData?.isHover) as THREE.Mesh | undefined;
          if (hov && hov.material instanceof THREE.MeshBasicMaterial) {
            hov.material.opacity = mesh.userData.isHovered;
          }
        }
      });

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.dispose();
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
        const mat = (obj as THREE.Mesh).material;
        if (mat) {
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else (mat as THREE.Material).dispose();
        }
      });
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const existingIds = new Set(buildingsMapRef.current.keys());
    const newIds = new Set(buildings.map((b) => b.id));

    existingIds.forEach((id) => {
      if (!newIds.has(id)) {
        const entry = buildingsMapRef.current.get(id);
        if (entry) {
          scene.remove(entry.mesh.parent!);
          entry.mesh.geometry.dispose();
          (entry.mesh.material as THREE.Material).dispose();
          buildingsMapRef.current.delete(id);
        }
        const sh = shadowsMapRef.current.get(id);
        if (sh) {
          scene.remove(sh);
          sh.geometry.dispose();
          (sh.material as THREE.Material).dispose();
          shadowsMapRef.current.delete(id);
        }
      }
    });

    buildings.forEach((b) => {
      if (!buildingsMapRef.current.has(b.id)) {
        createBuilding(b);
      }
    });

    if (buildings.length > 20 && rendererRef.current) {
      if (sunLightRef.current) {
        if (sunLightRef.current.shadow.mapSize.width !== 1024) {
          sunLightRef.current.shadow.mapSize.set(1024, 1024);
        }
      }
    }
  }, [buildings.map((b) => b.id).join(',')]);

  useEffect(() => {
    buildings.forEach((b) => {
      const entry = buildingsMapRef.current.get(b.id);
      if (!entry) return;
      entry.mesh.userData.targetHeight = b.height;
      entry.mesh.userData.targetX = b.x;
      entry.mesh.userData.targetZ = b.z;
      if (entry.mesh.parent) {
        entry.mesh.parent.position.x = b.x;
        entry.mesh.parent.position.z = b.z;
      }
    });
  }, [buildings.map((b) => `${b.id}:${b.height.toFixed(2)}:${b.x.toFixed(2)}:${b.z.toFixed(2)}`).join('|')]);

  useEffect(() => {
    buildingsMapRef.current.forEach((entry, id) => {
      const isSelected = id === selectedBuildingId;
      const edgeMat = entry.edges.material as THREE.LineBasicMaterial;
      if (isSelected) {
        edgeMat.color.set(0xed8936);
        (edgeMat as any).linewidth = 2;
      } else {
        edgeMat.color.set(0x2d3748);
      }
    });
  }, [selectedBuildingId]);

  useEffect(() => {
    const sunLight = sunLightRef.current;
    const scene = sceneRef.current;
    if (!sunLight || !scene) return;

    const alt = (sunAltitude * Math.PI) / 180;
    const azi = (sunAzimuth * Math.PI) / 180;
    const r = 200;
    sunLight.position.set(
      Math.cos(alt) * Math.sin(azi) * r,
      Math.sin(alt) * r + 50,
      Math.cos(alt) * Math.cos(azi) * r
    );
    sunLight.target.position.set(0, 0, 0);
    sunLight.target.updateMatrixWorld();

    shadowsMapRef.current.forEach((sh) => {
      scene.remove(sh);
      sh.geometry.dispose();
      (sh.material as THREE.Material).dispose();
    });
    shadowsMapRef.current.clear();

    if (!shadowEnabled) return;

    buildings.forEach((b) => {
      const verts = computeShadowPolygon(b, sunAltitude, sunAzimuth);
      if (verts.length < 3) return;
      const shape = shadowToShape(verts);
      const geo = new THREE.ShapeGeometry(shape);
      geo.rotateX(-Math.PI / 2);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x000044,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = 0.02;
      mesh.renderOrder = 2;
      mesh.userData.shadowBuildingId = b.id;
      scene.add(mesh);
      shadowsMapRef.current.set(b.id, mesh);
    });
  }, [sunAltitude, sunAzimuth, shadowEnabled, buildings.map((b) => `${b.id}:${b.height}:${b.x}:${b.z}`).join(',')]);

  function createBuilding(b: BuildingParams) {
    const scene = sceneRef.current!;
    const group = new THREE.Group();
    group.position.set(b.x, 0, b.z);

    const geo = new THREE.BoxGeometry(b.width, 1, b.depth);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x4a5568,
      roughness: 0.7,
      metalness: 0.15,
    });
    const mesh = new THREE.Mesh(geo, mat) as unknown as BuildingMesh;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = {
      buildingId: b.id,
      targetHeight: b.height,
      currentHeight: b.height,
      targetX: b.x,
      targetZ: b.z,
      isHovered: 0,
      targetHover: 0,
    };
    mesh.scale.y = b.height;
    mesh.position.y = b.height / 2;

    const edgeGeo = new THREE.EdgesGeometry(geo);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x2d3748 });
    const edges = new THREE.LineSegments(edgeGeo, edgeMat);
    edges.userData = { isEdge: true };
    edges.scale.y = b.height;
    edges.position.y = b.height / 2;

    const hoverGeo = new THREE.BoxGeometry(b.width * 1.05, 1, b.depth * 1.05);
    const hoverMat = new THREE.MeshBasicMaterial({
      color: 0x90cdf4,
      transparent: true,
      opacity: 0,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const hover = new THREE.Mesh(hoverGeo, hoverMat);
    hover.userData = { isHover: true };
    hover.scale.y = b.height;
    hover.position.y = b.height / 2;

    group.add(mesh);
    group.add(edges);
    group.add(hover);
    scene.add(group);

    buildingsMapRef.current.set(b.id, { mesh, edges, hover });
  }

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
}
