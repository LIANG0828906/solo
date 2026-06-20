import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { MarkerEvent, SpectrumFrame, TimeRange } from './types';
import { TerrainGenerator } from './TerrainGenerator';

interface SoundscapeSceneProps {
  spectrumData: SpectrumFrame[];
  markers: MarkerEvent[];
  selectedMarkerId: string | null;
  timeRange: TimeRange | null;
  currentTime: number;
  isPlaying: boolean;
  onMarkerAdd: (marker: Omit<MarkerEvent, 'id' | 'index' | 'createdAt'>) => void;
  onMarkerSelect: (id: string | null) => void;
  onTerrainGenerated: (generator: TerrainGenerator) => void;
}

interface MarkerObject {
  group: THREE.Group;
  pillar: THREE.Mesh;
  dot: THREE.Mesh;
  markerId: string;
}

const SoundscapeScene: React.FC<SoundscapeSceneProps> = ({
  spectrumData,
  markers,
  selectedMarkerId,
  timeRange,
  currentTime,
  isPlaying,
  onMarkerAdd,
  onMarkerSelect,
  onTerrainGenerated
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const terrainGeneratorRef = useRef<TerrainGenerator | null>(null);
  const highlightMeshRef = useRef<THREE.Mesh | null>(null);
  const playheadIndicatorRef = useRef<THREE.Mesh | null>(null);
  const markerObjectsRef = useRef<Map<string, MarkerObject>>(new Map());
  const beamEffectsRef = useRef<{ mesh: THREE.Mesh; startTime: number }[]>([]);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const animationFrameRef = useRef<number>(0);
  const fpsRef = useRef<{ count: number; lastTime: number; value: number }>({
    count: 0,
    lastTime: performance.now(),
    value: 0
  });
  const fpsElementRef = useRef<HTMLDivElement>(null);

  const createMarkerPillar = useCallback((position: THREE.Vector3, amplitude: number): MarkerObject => {
    const group = new THREE.Group();

    const heightScale = Math.max(2, amplitude * 12);
    const pillarGeometry = new THREE.CylinderGeometry(0.4, 0.6, heightScale, 16, 1, true);
    const positions = pillarGeometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);

    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      const t = (y + heightScale / 2) / heightScale;

      colors[i * 3] = 0.3 + t * 0.2;
      colors[i * 3 + 1] = 0.7 + t * 0.15;
      colors[i * 3 + 2] = 0.95 - t * 0.45;
    }

    pillarGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pillarMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      emissive: 0x4fc3f7,
      emissiveIntensity: 0.3
    });

    const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillar.position.set(position.x, heightScale / 2, position.z);
    group.add(pillar);

    const dotGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const dotMaterial = new THREE.MeshStandardMaterial({
      color: 0x81c784,
      emissive: 0x81c784,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.9
    });

    const dot = new THREE.Mesh(dotGeometry, dotMaterial);
    dot.position.set(position.x, heightScale + 0.5, position.z);
    dot.userData.isMarkerDot = true;
    group.add(dot);

    return { group, pillar, dot, markerId: '' };
  }, []);

  const createBeamEffect = useCallback((position: THREE.Vector3) => {
    const beamGeometry = new THREE.CylinderGeometry(0.15, 0.15, 30, 12, 1, true);
    const beamMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });

    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.set(position.x, 15, position.z);

    if (sceneRef.current) {
      sceneRef.current.add(beam);
    }

    beamEffectsRef.current.push({
      mesh: beam,
      startTime: performance.now()
    });
  }, []);

  const initScene = useCallback(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d1b2a);
    scene.fog = new THREE.FogExp2(0x0d1b2a, 0.012);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      55,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(50, 45, 60);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);
    renderer.domElement.className = 'scene-canvas';
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 20;
    controls.maxDistance = 150;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.target.set(0, 5, 0);
    controlsRef.current = controls;

    const hemiLight = new THREE.HemisphereLight(0x4fc3f7, 0x0a1929, 0.8);
    scene.add(hemiLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(30, 50, 30);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const fillLight = new THREE.PointLight(0x4fc3f7, 0.4, 200);
    fillLight.position.set(-30, 20, -30);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0x81c784, 0.3, 200);
    rimLight.position.set(30, 10, -40);
    scene.add(rimLight);

    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a1929,
      transparent: true,
      opacity: 0.8
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(120, 60, 0x1e3a5f, 0x142740);
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.4;
    scene.add(gridHelper);

    const playheadGeometry = new THREE.PlaneGeometry(62, 1, 1, 1);
    const playheadMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    const playheadIndicator = new THREE.Mesh(playheadGeometry, playheadMaterial);
    playheadIndicator.rotation.x = -Math.PI / 2;
    playheadIndicator.position.set(0, 0.02, -40);
    scene.add(playheadIndicator);
    playheadIndicatorRef.current = playheadIndicator;

    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const buildTerrain = useCallback(() => {
    if (!sceneRef.current || spectrumData.length === 0) return;

    if (terrainMeshRef.current) {
      sceneRef.current.remove(terrainMeshRef.current);
      terrainMeshRef.current.geometry.dispose();
      (terrainMeshRef.current.material as THREE.Material).dispose();
    }

    const generator = new TerrainGenerator(spectrumData);
    terrainGeneratorRef.current = generator;

    const terrainMesh = generator.getMesh();
    sceneRef.current.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    const wireframe = generator.getWireframeMesh();
    sceneRef.current.add(wireframe);

    onTerrainGenerated(generator);
  }, [spectrumData, onTerrainGenerated]);

  const updateMarkers = useCallback(() => {
    if (!sceneRef.current) return;

    const currentMarkerIds = new Set(markers.map(m => m.id));
    const existingMarkerIds = new Set(markerObjectsRef.current.keys());

    for (const id of existingMarkerIds) {
      if (!currentMarkerIds.has(id)) {
        const obj = markerObjectsRef.current.get(id);
        if (obj) {
          sceneRef.current.remove(obj.group);
          obj.pillar.geometry.dispose();
          (obj.pillar.material as THREE.Material).dispose();
          obj.dot.geometry.dispose();
          (obj.dot.material as THREE.Material).dispose();
        }
        markerObjectsRef.current.delete(id);
      }
    }

    for (const marker of markers) {
      if (!markerObjectsRef.current.has(marker.id)) {
        const pos = new THREE.Vector3(
          marker.position.x,
          marker.position.y,
          marker.position.z
        );
        const markerObj = createMarkerPillar(pos, marker.amplitude);
        markerObj.markerId = marker.id;
        markerObj.dot.userData.markerId = marker.id;
        sceneRef.current.add(markerObj.group);
        markerObjectsRef.current.set(marker.id, markerObj);
      }

      const obj = markerObjectsRef.current.get(marker.id);
      if (obj) {
        const isSelected = marker.id === selectedMarkerId;
        const dotMaterial = obj.dot.material as THREE.MeshStandardMaterial;
        dotMaterial.emissiveIntensity = isSelected ? 1.5 : 0.8;
        dotMaterial.opacity = isSelected ? 1 : 0.9;
        (obj.pillar.material as THREE.MeshStandardMaterial).emissiveIntensity = isSelected ? 0.6 : 0.3;
      }
    }
  }, [markers, selectedMarkerId, createMarkerPillar]);

  const updateHighlight = useCallback(() => {
    if (!sceneRef.current || !terrainGeneratorRef.current) return;

    if (highlightMeshRef.current) {
      sceneRef.current.remove(highlightMeshRef.current);
      highlightMeshRef.current.geometry.dispose();
      (highlightMeshRef.current.material as THREE.Material).dispose();
      highlightMeshRef.current = null;
    }

    if (timeRange && timeRange.start !== timeRange.end) {
      const highlightMesh = terrainGeneratorRef.current.highlightTimeRange(timeRange.start, timeRange.end);
      sceneRef.current.add(highlightMesh);
      highlightMeshRef.current = highlightMesh;

      if (controlsRef.current && cameraRef.current) {
        const { depth } = terrainGeneratorRef.current.getDimensions();
        const duration = spectrumData[spectrumData.length - 1]?.time || 1;
        const zCenter = ((timeRange.start + timeRange.end) / 2 / duration - 0.5) * depth;

        const targetPosition = new THREE.Vector3(0, 30, zCenter + 40);
        const targetLookAt = new THREE.Vector3(0, 5, zCenter);

        animateCamera(targetPosition, targetLookAt);
      }
    }
  }, [timeRange, spectrumData]);

  const animateCamera = (targetPos: THREE.Vector3, targetLookAt: THREE.Vector3) => {
    if (!cameraRef.current || !controlsRef.current) return;

    const startPos = cameraRef.current.position.clone();
    const startLookAt = controlsRef.current.target.clone();
    const startTime = performance.now();
    const duration = 800;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);

      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.lerpVectors(startPos, targetPos, eased);
        controlsRef.current.target.lerpVectors(startLookAt, targetLookAt, eased);
        controlsRef.current.update();
      }

      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  const updatePlayhead = useCallback(() => {
    if (!playheadIndicatorRef.current || !terrainGeneratorRef.current) return;

    const { depth } = terrainGeneratorRef.current.getDimensions();
    const duration = spectrumData[spectrumData.length - 1]?.time || 1;
    const zPos = (currentTime / duration - 0.5) * depth;

    playheadIndicatorRef.current.position.z = zPos;
  }, [currentTime, spectrumData]);

  const handleClick = useCallback((event: MouseEvent) => {
    if (!containerRef.current || !sceneRef.current || !cameraRef.current || !terrainGeneratorRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    const dotMeshes = Array.from(markerObjectsRef.current.values()).map(obj => obj.dot);
    const dotIntersects = raycasterRef.current.intersectObjects(dotMeshes);

    if (dotIntersects.length > 0) {
      const clickedDot = dotIntersects[0].object;
      const markerId = clickedDot.userData.markerId;
      if (markerId) {
        onMarkerSelect(markerId);
        return;
      }
    }

    if (terrainMeshRef.current) {
      const terrainIntersects = raycasterRef.current.intersectObject(terrainMeshRef.current);

      if (terrainIntersects.length > 0) {
        const point = terrainIntersects[0].point;

        createBeamEffect(point);

        const { depth } = terrainGeneratorRef.current.getDimensions();
        const numFrames = spectrumData.length;
        const numFreqBins = Math.min(spectrumData[0]?.frequencies.length || 256, 128);

        const frameIndex = Math.round(((point.z + depth / 2) / depth) * (numFrames - 1));
        const freqIndex = Math.round(((point.x + 30) / 60) * (numFreqBins - 1));

        const clampedFrameIndex = Math.max(0, Math.min(numFrames - 1, frameIndex));
        const clampedFreqIndex = Math.max(0, Math.min(numFreqBins - 1, freqIndex));

        const frame = spectrumData[clampedFrameIndex];
        if (!frame) return;

        const sampleRate = 44100;
        const nyquist = sampleRate / 2;
        const binWidth = nyquist / frame.frequencies.length;

        const freqCenter = clampedFreqIndex * binWidth * (frame.frequencies.length / numFreqBins);
        const freqRange: [number, number] = [Math.max(0, freqCenter - binWidth * 5), freqCenter + binWidth * 5];

        let ampSum = 0;
        let ampCount = 0;
        const fiStart = Math.max(0, clampedFreqIndex - 3);
        const fiEnd = Math.min(numFreqBins - 1, clampedFreqIndex + 3);
        for (let fi = fiStart; fi <= fiEnd; fi++) {
          const origIdx = Math.round((fi / (numFreqBins - 1)) * (frame.frequencies.length - 1));
          ampSum += frame.frequencies[origIdx] || 0;
          ampCount++;
        }
        const amplitude = ampCount > 0 ? ampSum / ampCount / terrainGeneratorRef.current.getMaxAmplitude() : 0;

        onMarkerAdd({
          time: frame.time,
          frequencyRange: freqRange,
          amplitude,
          position: { x: point.x, y: point.y, z: point.z }
        });
      }
    }
  }, [spectrumData, createBeamEffect, onMarkerAdd, onMarkerSelect]);

  const animate = useCallback(() => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current || !controlsRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate);
      return;
    }

    const now = performance.now();
    fpsRef.current.count++;

    if (now - fpsRef.current.lastTime >= 1000) {
      fpsRef.current.value = fpsRef.current.count;
      fpsRef.current.count = 0;
      fpsRef.current.lastTime = now;

      if (fpsElementRef.current) {
        fpsElementRef.current.textContent = `${fpsRef.current.value} FPS`;
      }
    }

    const beamsToRemove: number[] = [];
    beamEffectsRef.current.forEach((beam, index) => {
      const elapsed = now - beam.startTime;
      const duration = 500;

      if (elapsed >= duration) {
        beamsToRemove.push(index);
      } else {
        const opacity = 1 - (elapsed / duration);
        (beam.mesh.material as THREE.MeshBasicMaterial).opacity = opacity * 0.6;
        beam.mesh.scale.y = 1 + (elapsed / duration) * 0.5;
      }
    });

    for (let i = beamsToRemove.length - 1; i >= 0; i--) {
      const idx = beamsToRemove[i];
      const beam = beamEffectsRef.current[idx];
      sceneRef.current.remove(beam.mesh);
      beam.mesh.geometry.dispose();
      (beam.mesh.material as THREE.Material).dispose();
      beamEffectsRef.current.splice(idx, 1);
    }

    const time = now * 0.001;
    markerObjectsRef.current.forEach((obj, id) => {
      const pulse = 1 + Math.sin(time * 3 + obj.markerId.charCodeAt(0)) * 0.1;
      obj.dot.scale.setScalar(pulse);

      if (id === selectedMarkerId) {
        const rotate = time * 0.5;
        obj.dot.rotation.y = rotate;
      }
    });

    controlsRef.current.update();
    rendererRef.current.render(sceneRef.current, cameraRef.current);

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [selectedMarkerId]);

  useEffect(() => {
    const cleanupResize = initScene();

    return () => {
      cleanupResize?.();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [initScene]);

  useEffect(() => {
    if (sceneRef.current) {
      buildTerrain();
    }
  }, [buildTerrain]);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  useEffect(() => {
    updateHighlight();
  }, [updateHighlight]);

  useEffect(() => {
    if (isPlaying || currentTime > 0) {
      updatePlayhead();
    }
  }, [updatePlayhead, currentTime, isPlaying]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('click', handleClick);
    return () => {
      container.removeEventListener('click', handleClick);
    };
  }, [handleClick]);

  return (
    <div ref={containerRef} className="scene-container">
      <div ref={fpsElementRef} className="fps-counter">-- FPS</div>
      <div className="scene-hint">拖拽旋转视角 · 滚轮缩放 · 点击地形添加标记</div>
    </div>
  );
};

export default SoundscapeScene;
