import { useEffect, useRef, useState } from 'react';
import { useNebulaStore } from '@/store/nebulaStore';
import { NebulaCloud } from './NebulaCloud';
import { StarEmitter } from './StarEmitter';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface SceneProps {
  onRendererReady?: (renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera) => void;
}

export function Scene({ onRendererReady }: SceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nebulaRef = useRef<NebulaCloud | null>(null);
  const emitterRef = useRef<StarEmitter | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationIdRef = useRef<number>(0);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  const fpsSamplesRef = useRef<number[]>([]);
  const lastFpsUpdateRef = useRef<number>(0);

  const density = useNebulaStore((state) => state.density);
  const turbulence = useNebulaStore((state) => state.turbulence);
  const getInterpolatedColor = useNebulaStore((state) => state.getInterpolatedColor);
  const updateColorTransition = useNebulaStore((state) => state.updateColorTransition);
  const particleScale = useNebulaStore((state) => state.particleScale);
  const setCurrentFPS = useNebulaStore((state) => state.setCurrentFPS);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 20;
    controlsRef.current = controls;

    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 800;
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 30 + Math.random() * 20;

      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);

      starSizes[i] = 0.02 + Math.random() * 0.04;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
    });

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    const nebula = new NebulaCloud({
      particleCount: 20000,
      radius: 3.5,
      density,
      turbulence,
    });
    nebulaRef.current = nebula;
    scene.add(nebula.mesh);

    nebula.setColorInterpolator(getInterpolatedColor);

    const emitter = new StarEmitter({
      emitterCount: 20,
      maxParticles: 500,
      nebulaRadius: 3.5,
    });
    emitterRef.current = emitter;
    scene.add(emitter.mesh);
    emitter.setColorMap(getInterpolatedColor);

    if (onRendererReady) {
      onRendererReady(renderer, scene, camera);
    }

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      const deltaTime = clockRef.current.getDelta();
      const elapsed = clockRef.current.getElapsedTime();

      const now = performance.now();
      fpsSamplesRef.current.push(now);
      while (fpsSamplesRef.current.length > 0 && now - fpsSamplesRef.current[0] > 1000) {
        fpsSamplesRef.current.shift();
      }

      if (now - lastFpsUpdateRef.current > 500) {
        const fps = fpsSamplesRef.current.length;
        setCurrentFPS(fps);
        lastFpsUpdateRef.current = now;
      }

      updateColorTransition(deltaTime);

      if (nebulaRef.current) {
        nebulaRef.current.setColorInterpolator(getInterpolatedColor);
        nebulaRef.current.animate(elapsed);
      }

      if (emitterRef.current) {
        emitterRef.current.update(deltaTime);
        emitterRef.current.setColorMap(getInterpolatedColor);
        emitterRef.current.animate(elapsed);
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationIdRef.current);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      nebula.dispose();
      emitter.dispose();
      starsGeometry.dispose();
      starsMaterial.dispose();
      controls.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (nebulaRef.current) {
      nebulaRef.current.setDensity(density);
    }
  }, [density]);

  useEffect(() => {
    if (nebulaRef.current) {
      nebulaRef.current.setTurbulence(turbulence);
    }
  }, [turbulence]);

  useEffect(() => {
    if (nebulaRef.current) {
      nebulaRef.current.updateParticleScale(particleScale);
    }
    if (emitterRef.current) {
      emitterRef.current.updateParticleScale(particleScale);
    }
  }, [particleScale]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    />
  );
}

export default Scene;
