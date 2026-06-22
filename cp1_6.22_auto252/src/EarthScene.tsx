import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Photo } from './types';
import { MapInteraction } from './MapInteraction';

export interface EarthSceneHandle {
  flyToLocation: (lat: number, lng: number, duration?: number) => void;
  flyToPhoto: (photoId: string, duration?: number) => void;
  clearSelection: () => void;
  getCamera: () => THREE.PerspectiveCamera | null;
  projectPhoto: (photoId: string) => { x: number; y: number; visible: boolean } | null;
  getSize: () => { width: number; height: number };
}

interface EarthSceneProps {
  photos: Photo[];
  onMarkerClick: (photo: Photo | null) => void;
  onCameraChange?: () => void;
}

const EARTH_RADIUS = 250;

export const EarthScene = forwardRef<EarthSceneHandle, EarthSceneProps>(function EarthScene(
  { photos, onMarkerClick, onCameraChange },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const interactionRef = useRef<MapInteraction | null>(null);
  const rafRef = useRef<number | null>(null);
  const flyStateRef = useRef<{
    active: boolean;
    startPos: THREE.Vector3;
    targetPos: THREE.Vector3;
    startTarget: THREE.Vector3;
    endTarget: THREE.Vector3;
    duration: number;
    elapsed: number;
    onDone?: () => void;
  } | null>(null);
  const sizeRef = useRef({ width: 0, height: 0 });

  useImperativeHandle(ref, () => ({
    flyToLocation: (lat: number, lng: number, duration = 600) => {
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      const interaction = interactionRef.current;
      if (!camera || !controls || !interaction) return;
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      const targetPoint = new THREE.Vector3(
        -EARTH_RADIUS * Math.sin(phi) * Math.cos(theta),
        EARTH_RADIUS * Math.cos(phi),
        EARTH_RADIUS * Math.sin(phi) * Math.sin(theta),
      );
      const camPos = targetPoint.clone().normalize().multiplyScalar(EARTH_RADIUS + 320);
      flyStateRef.current = {
        active: true,
        startPos: camera.position.clone(),
        targetPos: camPos,
        startTarget: controls.target.clone(),
        endTarget: targetPoint.clone(),
        duration,
        elapsed: 0,
      };
    },
    flyToPhoto: (photoId: string, duration = 600) => {
      interactionRef.current?.flyToPhoto(photoId, duration);
    },
    clearSelection: () => {
      interactionRef.current?.clearSelection();
    },
    getCamera: () => cameraRef.current,
    projectPhoto: (photoId: string) => {
      const camera = cameraRef.current;
      const interaction = interactionRef.current;
      if (!camera || !interaction) return null;
      return interaction.projectToScreen(camera, photoId, sizeRef.current.width, sizeRef.current.height);
    },
    getSize: () => sizeRef.current,
  }));

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    const width = container.clientWidth;
    const height = container.clientHeight;
    sizeRef.current = { width, height };

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000);
    camera.position.set(0, 60, 560);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.55;
    controls.zoomSpeed = 0.9;
    controls.minDistance = 320;
    controls.maxDistance = 1100;
    controls.enablePan = false;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(300, 400, 500);
    scene.add(dirLight);
    const rimLight = new THREE.DirectionalLight(0x4a90d9, 0.35);
    rimLight.position.set(-300, -100, -500);
    scene.add(rimLight);

    const starGeo = new THREE.BufferGeometry();
    const starCount = 1600;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 1800 + Math.random() * 800;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.6,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.85,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    function makeEarthTexture(): THREE.Texture {
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d')!;
      const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      bgGrad.addColorStop(0, '#061433');
      bgGrad.addColorStop(0.5, '#0a1e4e');
      bgGrad.addColorStop(1, '#051026');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 0.25;
      for (let i = 0; i < 800; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const r = 2 + Math.random() * 12;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const hue = 200 + Math.random() * 60;
        g.addColorStop(0, `hsla(${hue},80%,70%,0.6)`);
        g.addColorStop(1, 'hsla(220,80%,40%,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1;
      for (let lat = -80; lat <= 80; lat += 20) {
        const y = ((90 - lat) / 180) * canvas.height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(
          canvas.width * 0.25, y + (Math.random() - 0.5) * 14,
          canvas.width * 0.75, y + (Math.random() - 0.5) * 14,
          canvas.width, y,
        );
        ctx.stroke();
      }
      for (let lng = -180; lng <= 180; lng += 20) {
        const x = ((lng + 180) / 360) * canvas.width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.bezierCurveTo(
          x + (Math.random() - 0.5) * 10, canvas.height * 0.3,
          x + (Math.random() - 0.5) * 10, canvas.height * 0.7,
          x, canvas.height,
        );
        ctx.stroke();
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      tex.anisotropy = 4;
      return tex;
    }

    const earthGeo = new THREE.SphereGeometry(EARTH_RADIUS, 96, 96);
    const earthTex = makeEarthTexture();
    const earthMat = new THREE.MeshPhongMaterial({
      map: earthTex,
      shininess: 12,
      specular: 0x244073,
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earth);

    const atmosphereGeo = new THREE.SphereGeometry(EARTH_RADIUS * 1.045, 64, 64);
    const atmosphereMat = new THREE.MeshBasicMaterial({
      color: 0x4a90d9,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    scene.add(atmosphere);

    const grid = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.SphereGeometry(EARTH_RADIUS * 1.003, 36, 24)),
      new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
      }),
    );
    scene.add(grid);

    const interaction = new MapInteraction();
    interactionRef.current = interaction;
    scene.add(interaction.markersGroup);

    interaction.onRequestFlyTo = (target, duration) => {
      const cam = cameraRef.current;
      const ctl = controlsRef.current;
      if (!cam || !ctl) return;
      const endTarget = target.clone().normalize().multiplyScalar(EARTH_RADIUS * 0.0);
      flyStateRef.current = {
        active: true,
        startPos: cam.position.clone(),
        targetPos: target,
        startTarget: ctl.target.clone(),
        endTarget,
        duration,
        elapsed: 0,
      };
    };

    interaction.onMarkerClick = (p) => onMarkerClick(p);

    let mouseDown = false;
    let mouseMoved = false;
    let startX = 0;
    let startY = 0;

    const onDown = (e: MouseEvent) => {
      mouseDown = true;
      mouseMoved = false;
      startX = e.clientX;
      startY = e.clientY;
    };
    const onMove = (e: MouseEvent) => {
      if (mouseDown && !mouseMoved) {
        const dx = Math.abs(e.clientX - startX);
        const dy = Math.abs(e.clientY - startY);
        if (dx > 4 || dy > 4) mouseMoved = true;
      }
    };
    const onUp = (e: MouseEvent) => {
      if (mouseDown && !mouseMoved) {
        const rect = renderer.domElement.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const photo = interaction.handleClick(camera, sx, sy, sizeRef.current.width, sizeRef.current.height);
        if (!photo) onMarkerClick(null);
      }
      mouseDown = false;
      mouseMoved = false;
    };
    renderer.domElement.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    const onResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      sizeRef.current = { width: w, height: h };
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    let last = performance.now();
    let fpsSmoothed = 60;

    const animate = () => {
      const now = performance.now();
      const dt = Math.min(33, now - last);
      last = now;
      const fps = 1000 / Math.max(1, dt);
      fpsSmoothed = fpsSmoothed * 0.9 + fps * 0.1;

      if (flyStateRef.current?.active) {
        const fs = flyStateRef.current;
        fs.elapsed += dt;
        const tRaw = Math.min(1, fs.elapsed / fs.duration);
        const t = 1 - Math.pow(1 - tRaw, 3);
        camera.position.lerpVectors(fs.startPos, fs.targetPos, t);
        controls.target.lerpVectors(fs.startTarget, fs.endTarget, t);
        if (tRaw >= 1) {
          fs.active = false;
        }
      } else {
        controls.update();
      }

      interaction.updateMarkers(now);
      atmosphere.rotation.y += 0.0003;
      grid.rotation.y = earth.rotation.y;
      renderer.render(scene, camera);

      onCameraChange?.();
      rafRef.current = requestAnimationFrame(animate);
      (renderer.domElement as any).__fps = fpsSmoothed;
    };
    animate();

    return () => {
      rafRef.current && cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      controls.dispose();
      interaction.dispose();
      renderer.dispose();
      earthTex.dispose();
      starGeo.dispose();
      starMat.dispose();
      earthGeo.dispose();
      (earthMat as any).dispose?.();
      atmosphereGeo.dispose();
      atmosphereMat.dispose();
      (grid.geometry as any).dispose?.();
      (grid.material as any).dispose?.();
      container.contains(renderer.domElement) && container.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    interactionRef.current?.setPhotos(photos);
  }, [photos]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        cursor: 'grab',
      }}
    />
  );
});
