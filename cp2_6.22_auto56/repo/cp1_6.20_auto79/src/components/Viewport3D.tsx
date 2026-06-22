import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { ModelData, SelectionState, UIParams } from '../types';

interface Viewport3DProps {
  modelData: ModelData | null;
  selection: SelectionState;
  uiParams: UIParams;
  onFaceClick: (faceIndex: number, isMultiSelect: boolean) => void;
  onVertexDrag?: (vertexIndex: number, delta: { x: number; y: number; z: number }) => void;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  modelData,
  selection,
  uiParams,
  onFaceClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const wireframeRef = useRef<THREE.LineSegments | null>(null);
  const highlightMeshesRef = useRef<THREE.Mesh[]>([]);
  const autoRotateRef = useRef(true);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const animationFrameRef = useRef<number>();
  const lastInteractionRef = useRef<number>(0);

  const initScene = useCallback(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(3, 2, 3);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x1a1a2e);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x00d4ff, 0.3, 10);
    pointLight.position.set(-3, 2, -3);
    scene.add(pointLight);

    const gridHelper = new THREE.GridHelper(5, 20, 0x333355, 0x222244);
    gridHelper.position.y = -1;
    scene.add(gridHelper);

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      const now = Date.now();
      if (now - lastInteractionRef.current > 2000) {
        if (controlsRef.current) {
          controlsRef.current.autoRotate = autoRotateRef.current;
        }
      }

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      const time = Date.now() * 0.002;
      highlightMeshesRef.current.forEach((mesh, index) => {
        const material = mesh.material as THREE.MeshBasicMaterial;
        const pulse = 0.5 + 0.5 * Math.sin(time * 3 + index * 0.5);
        material.opacity = 0.3 + pulse * 0.4;
      });

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  const buildModel = useCallback((data: ModelData) => {
    if (!sceneRef.current) return;

    if (meshRef.current) {
      sceneRef.current.remove(meshRef.current);
      meshRef.current.geometry.dispose();
      (meshRef.current.material as THREE.Material).dispose();
    }
    if (wireframeRef.current) {
      sceneRef.current.remove(wireframeRef.current);
      wireframeRef.current.geometry.dispose();
      (wireframeRef.current.material as THREE.Material).dispose();
    }
    highlightMeshesRef.current.forEach((mesh) => {
      sceneRef.current?.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
    highlightMeshesRef.current = [];

    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];

    data.faces.forEach((face) => {
      for (let i = 0; i < 3; i++) {
        const v = data.vertices[face.vertexIndices[i]];
        positions.push(v.x, v.y, v.z);

        const color = new THREE.Color(face.color);
        colors.push(color.r, color.g, color.b);
      }
    });

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      roughness: 0.3,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    meshRef.current = mesh;
    sceneRef.current.add(mesh);

    const wireframeGeometry = new THREE.EdgesGeometry(geometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
    });
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    wireframe.visible = uiParams.showWireframe;
    wireframeRef.current = wireframe;
    sceneRef.current.add(wireframe);

    const box = new THREE.Box3().setFromObject(mesh);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    if (cameraRef.current && controlsRef.current) {
      const distance = maxDim * 2.5;
      cameraRef.current.position.set(distance, distance * 0.7, distance);
      cameraRef.current.lookAt(center);
      controlsRef.current.target.copy(center);
    }
  }, [uiParams.showWireframe]);

  const updateHighlights = useCallback((data: ModelData, selectedFaces: number[]) => {
    if (!sceneRef.current || !meshRef.current) return;

    highlightMeshesRef.current.forEach((mesh) => {
      sceneRef.current?.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
    highlightMeshesRef.current = [];

    selectedFaces.forEach((faceIndex) => {
      const face = data.faces[faceIndex];
      if (!face) return;

      const geometry = new THREE.BufferGeometry();
      const positions: number[] = [];

      for (let i = 0; i < 3; i++) {
        const v = data.vertices[face.vertexIndices[i]];
        positions.push(v.x, v.y, v.z);
      }

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

      const material = new THREE.MeshBasicMaterial({
        color: 0x00d4ff,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });

      const highlightMesh = new THREE.Mesh(geometry, material);
      highlightMesh.scale.setScalar(1.02);
      sceneRef.current?.add(highlightMesh);
      highlightMeshesRef.current.push(highlightMesh);

      const edgesGeometry = new THREE.EdgesGeometry(geometry);
      const edgesMaterial = new THREE.LineBasicMaterial({
        color: 0x00d4ff,
        transparent: true,
        opacity: 1,
        linewidth: 2,
      });
      const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
      edges.scale.setScalar(1.02);
      sceneRef.current?.add(edges);
      highlightMeshesRef.current.push(edges as unknown as THREE.Mesh);
    });
  }, []);

  const handleClick = useCallback((event: React.MouseEvent) => {
    if (!containerRef.current || !cameraRef.current || !meshRef.current || !modelData) return;

    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObject(meshRef.current);

    if (intersects.length > 0 && intersects[0].faceIndex !== undefined) {
      lastInteractionRef.current = Date.now();
      autoRotateRef.current = false;
      if (controlsRef.current) {
        controlsRef.current.autoRotate = false;
      }
      onFaceClick(intersects[0].faceIndex, event.shiftKey);
    }
  }, [modelData, onFaceClick]);

  const handleMouseMove = useCallback(() => {
    lastInteractionRef.current = Date.now();
    autoRotateRef.current = false;
  }, []);

  useEffect(() => {
    const cleanup = initScene();
    return cleanup;
  }, [initScene]);

  useEffect(() => {
    if (modelData) {
      buildModel(modelData);
    }
  }, [modelData, buildModel]);

  useEffect(() => {
    if (modelData) {
      updateHighlights(modelData, selection.selectedFaceIndices);
    }
  }, [modelData, selection.selectedFaceIndices, updateHighlights]);

  useEffect(() => {
    if (wireframeRef.current) {
      wireframeRef.current.visible = uiParams.showWireframe;
    }
  }, [uiParams.showWireframe]);

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        cursor: 'pointer',
      }}
    />
  );
};
