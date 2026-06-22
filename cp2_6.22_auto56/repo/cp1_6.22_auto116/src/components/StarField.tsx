import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Constellation, Star } from '../utils/constellationData';

interface StarFieldProps {
  constellation: Constellation | null;
  onStarClick: (star: Star) => void;
}

const StarField: React.FC<StarFieldProps> = ({ constellation, onStarClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const backgroundStarsRef = useRef<THREE.Points | null>(null);
  const constellationStarsRef = useRef<THREE.Mesh[]>([]);
  const constellationLinesRef = useRef<THREE.Line[]>([]);
  const flowingPointsRef = useRef<{ mesh: THREE.Mesh; line: THREE.Line; progress: number }[]>([]);
  const constellationGroupRef = useRef<THREE.Group | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const rotationTargetRef = useRef({ x: 0, y: 0 });
  const rotationCurrentRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const zoomTargetRef = useRef(1);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const cameraAnimRef = useRef<{
    active: boolean;
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    startTime: number;
    duration: number;
  } | null>(null);
  const allStarMeshesRef = useRef<{ mesh: THREE.Mesh; star: Star }[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000011, 0.0008);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 0, 8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    createBackgroundStars(scene);
    constellationGroupRef.current = new THREE.Group();
    scene.add(constellationGroupRef.current);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const animate = () => {
      requestAnimationFrame(animate);
      updateScene();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        const dx = e.clientX - lastMouseRef.current.x;
        const dy = e.clientY - lastMouseRef.current.y;
        rotationTargetRef.current.y += dx * 0.005;
        rotationTargetRef.current.x -= dy * 0.005;
        const maxAngle = Math.PI / 4;
        rotationTargetRef.current.x = Math.max(-maxAngle, Math.min(maxAngle, rotationTargetRef.current.x));
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
      }

      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomTargetRef.current *= e.deltaY > 0 ? 0.9 : 1.1;
      zoomTargetRef.current = Math.max(0.5, Math.min(8, zoomTargetRef.current));
    };

    const handleDoubleClick = () => {
      if (!camera || !constellationGroupRef.current) return;
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const meshes = allStarMeshesRef.current.map(s => s.mesh);
      const intersects = raycasterRef.current.intersectObjects(meshes);
      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object as THREE.Mesh;
        const starData = allStarMeshesRef.current.find(s => s.mesh === clickedMesh);
        if (starData) {
          onStarClick(starData.star);
          animateCameraToStar(starData.star);
        }
      }
    };

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });
    renderer.domElement.addEventListener('dblclick', handleDoubleClick);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      renderer.domElement.removeEventListener('dblclick', handleDoubleClick);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!constellationGroupRef.current) return;
    clearConstellation();
    if (constellation) {
      renderConstellation(constellation);
    }
    if (backgroundStarsRef.current) {
      const material = backgroundStarsRef.current.material as THREE.PointsMaterial;
      material.opacity = constellation ? 0.3 : 1.0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [constellation]);

  const createBackgroundStars = (scene: THREE.Scene) => {
    const starCount = 2000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    const warmColor = new THREE.Color(0xffd4a3);
    const coolColor = new THREE.Color(0xa0c4ff);

    for (let i = 0; i < starCount; i++) {
      const radius = 30 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const t = Math.random();
      const color = warmColor.clone().lerp(coolColor, t);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = 0.1 + Math.random() * 0.7;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      sizeAttenuation: true,
      depthWrite: false,
    });

    const stars = new THREE.Points(geometry, material);
    scene.add(stars);
    backgroundStarsRef.current = stars;
  };

  const clearConstellation = () => {
    if (!constellationGroupRef.current) return;
    const group = constellationGroupRef.current;
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
    }
    constellationStarsRef.current = [];
    constellationLinesRef.current = [];
    flowingPointsRef.current = [];
    allStarMeshesRef.current = [];
  };

  const renderConstellation = (constellationData: Constellation) => {
    if (!constellationGroupRef.current) return;
    const group = constellationGroupRef.current;

    constellationData.stars.forEach((star) => {
      const geometry = new THREE.SphereGeometry(0.5, 32, 32);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 1.0,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(star.x, star.y, star.z);
      mesh.userData = { star, baseScale: 1 };
      group.add(mesh);
      constellationStarsRef.current.push(mesh);
      allStarMeshesRef.current.push({ mesh, star });
    });

    constellationData.connections.forEach(([fromIdx, toIdx]) => {
      const fromStar = constellationData.stars[fromIdx];
      const toStar = constellationData.stars[toIdx];
      const points = [
        new THREE.Vector3(fromStar.x, fromStar.y, fromStar.z),
        new THREE.Vector3(toStar.x, toStar.y, toStar.z),
      ];
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
        linewidth: 1,
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      group.add(line);
      constellationLinesRef.current.push(line);

      const pointGeometry = new THREE.SphereGeometry(0.08, 16, 16);
      const pointMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9,
      });
      const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
      group.add(pointMesh);
      flowingPointsRef.current.push({
        mesh: pointMesh,
        line,
        progress: Math.random(),
      });
    });
  };

  const animateCameraToStar = (star: Star) => {
    if (!cameraRef.current) return;
    const camera = cameraRef.current;
    const direction = new THREE.Vector3(star.x, star.y, star.z).normalize();
    const targetPos = direction.multiplyScalar(2);
    cameraAnimRef.current = {
      active: true,
      startPos: camera.position.clone(),
      endPos: targetPos,
      startTime: performance.now(),
      duration: 800,
    };
  };

  const easeInOutCubic = (t: number) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const updateScene = () => {
    const time = performance.now();

    rotationCurrentRef.current.x += (rotationTargetRef.current.x - rotationCurrentRef.current.x) * 0.05;
    rotationCurrentRef.current.y += (rotationTargetRef.current.y - rotationCurrentRef.current.y) * 0.05;
    zoomRef.current += (zoomTargetRef.current - zoomRef.current) * 0.05;

    if (cameraRef.current) {
      const camera = cameraRef.current;

      if (cameraAnimRef.current && cameraAnimRef.current.active) {
        const anim = cameraAnimRef.current;
        const elapsed = time - anim.startTime;
        const t = Math.min(elapsed / anim.duration, 1);
        const easedT = easeInOutCubic(t);
        camera.position.lerpVectors(anim.startPos, anim.endPos, easedT);
        camera.lookAt(0, 0, 0);
        if (t >= 1) {
          cameraAnimRef.current.active = false;
        }
      } else {
        if (!isDraggingRef.current) {
          rotationTargetRef.current.y += 0.02 * 0.016;
        }
        const radius = 8 / zoomRef.current;
        const rx = rotationCurrentRef.current.x;
        const ry = rotationCurrentRef.current.y;
        camera.position.x = radius * Math.sin(ry) * Math.cos(rx);
        camera.position.y = radius * Math.sin(rx);
        camera.position.z = radius * Math.cos(ry) * Math.cos(rx);
        camera.lookAt(0, 0, 0);
      }
    }

    if (backgroundStarsRef.current) {
      backgroundStarsRef.current.rotation.y += 0.02 * 0.016;
    }

    constellationStarsRef.current.forEach((mesh, idx) => {
      const pulse = 1 + Math.sin(time * 0.003 + idx * 0.5) * 0.15;
      mesh.scale.setScalar(pulse);
      const material = mesh.material as THREE.MeshBasicMaterial;
      material.opacity = 0.85 + Math.sin(time * 0.004 + idx * 0.3) * 0.15;
    });

    flowingPointsRef.current.forEach((fp) => {
      fp.progress += 0.008;
      if (fp.progress > 1) fp.progress -= 1;
      const positions = fp.line.geometry.attributes.position;
      const start = new THREE.Vector3(
        positions.getX(0),
        positions.getY(0),
        positions.getZ(0)
      );
      const end = new THREE.Vector3(
        positions.getX(1),
        positions.getY(1),
        positions.getZ(1)
      );
      const current = start.clone().lerp(end, fp.progress);
      fp.mesh.position.copy(current);
    });
  };

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};

export default StarField;
