import React, { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { PlanetData, PLANET_COLORS, ZODIAC_COLORS, ZODIAC_SYMBOLS } from './types';

interface ChartRendererProps {
  planets: PlanetData[];
  houses: number[];
  onPlanetClick?: (planet: PlanetData) => void;
  onPlanetHover?: (planet: PlanetData | null, position?: { x: number; y: number }) => void;
}

export interface ChartRendererRef {
  resetCamera: () => void;
  setRotation: (x: number, y: number) => void;
}

const ZODIAC_SIGNS = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];

const ChartRenderer = forwardRef<ChartRendererRef, ChartRendererProps>(({ planets, houses, onPlanetClick, onPlanetHover }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const planetMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const animationIdRef = useRef<number>(0);
  
  const isDraggingRef = useRef(false);
  const previousMouseRef = useRef({ x: 0, y: 0 });
  const rotationVelocityRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));

  const outerRadius = 5;
  const innerRadius = 3.5;
  const planetOrbitRadius = 2.5;

  useImperativeHandle(ref, () => ({
    resetCamera: () => {
      if (cameraRef.current) {
        cameraRef.current.position.set(0, 0, 12);
        cameraRef.current.lookAt(0, 0, 0);
        cameraTargetRef.current.set(0, 0, 0);
        rotationVelocityRef.current = { x: 0, y: 0 };
      }
    },
    setRotation: (x: number, y: number) => {
      if (sceneRef.current) {
        sceneRef.current.rotation.x = x;
        sceneRef.current.rotation.y = y;
      }
    },
  }));

  const createStarField = useCallback((scene: THREE.Scene) => {
    const particleCount = 800;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const radius = 50 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      const brightness = 0.5 + Math.random() * 0.5;
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness;
      colors[i * 3 + 2] = brightness * (0.9 + Math.random() * 0.2);
      
      sizes[i] = 0.5 + Math.random() * 1.5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    const stars = new THREE.Points(geometry, material);
    stars.name = 'stars';
    scene.add(stars);

    return stars;
  }, []);

  const createZodiacRing = useCallback((scene: THREE.Scene) => {
    const zodiacGroup = new THREE.Group();
    
    for (let i = 0; i < 12; i++) {
      const startAngle = (i * 30 - 90) * Math.PI / 180;
      const endAngle = ((i + 1) * 30 - 90) * Math.PI / 180;
      
      const shape = new THREE.Shape();
      
      const outerX1 = outerRadius * Math.cos(startAngle);
      const outerY1 = outerRadius * Math.sin(startAngle);
      const outerX2 = outerRadius * Math.cos(endAngle);
      const outerY2 = outerRadius * Math.sin(endAngle);
      
      const innerX1 = innerRadius * Math.cos(startAngle);
      const innerY1 = innerRadius * Math.sin(startAngle);
      const innerX2 = innerRadius * Math.cos(endAngle);
      const innerY2 = innerRadius * Math.sin(endAngle);
      
      shape.moveTo(outerX1, outerY1);
      shape.absarc(0, 0, outerRadius, startAngle, endAngle, false);
      shape.lineTo(innerX2, innerY2);
      shape.absarc(0, 0, innerRadius, endAngle, startAngle, true);
      shape.lineTo(outerX1, outerY1);
      
      const extrudeSettings = {
        depth: 0.2,
        bevelEnabled: false,
      };
      
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geometry.translate(0, 0, -0.1);
      
      const color = ZODIAC_COLORS[ZODIAC_SIGNS[i]];
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.2,
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      zodiacGroup.add(mesh);
      
      const symbolAngle = (i * 30 + 15 - 90) * Math.PI / 180;
      const symbolRadius = (outerRadius + innerRadius) / 2;
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ZODIAC_SYMBOLS[ZODIAC_SIGNS[i]], 32, 32);
      
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.9,
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.set(
        symbolRadius * Math.cos(symbolAngle),
        symbolRadius * Math.sin(symbolAngle),
        0.2
      );
      sprite.scale.set(0.6, 0.6, 1);
      zodiacGroup.add(sprite);
    }
    
    zodiacGroup.name = 'zodiac';
    scene.add(zodiacGroup);
    return zodiacGroup;
  }, [outerRadius, innerRadius]);

  const createPlanets = useCallback((scene: THREE.Scene, planetData: PlanetData[]) => {
    const planetGroup = new THREE.Group();
    planetMeshesRef.current.clear();
    
    planetData.forEach((planet) => {
      const angle = (planet.longitude - 90) * Math.PI / 180;
      const x = planetOrbitRadius * Math.cos(angle);
      const y = planetOrbitRadius * Math.sin(angle);
      
      const geometry = new THREE.SphereGeometry(0.2, 16, 16);
      const color = PLANET_COLORS[planet.name] || '#ffffff';
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color(color),
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.95,
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, 0.5);
      mesh.userData = { planet };
      
      const glowGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.3,
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      mesh.add(glow);
      
      planetGroup.add(mesh);
      planetMeshesRef.current.set(planet.name, mesh);
    });
    
    planetGroup.name = 'planets';
    scene.add(planetGroup);
    return planetGroup;
  }, [planetOrbitRadius]);

  const createHouseLines = useCallback((scene: THREE.Scene, houseData: number[]) => {
    const houseGroup = new THREE.Group();
    
    houseData.forEach((cusp, i) => {
      const angle = (cusp - 90) * Math.PI / 180;
      const innerX = innerRadius * 0.7 * Math.cos(angle);
      const innerY = innerRadius * 0.7 * Math.sin(angle);
      const outerX = outerRadius * Math.cos(angle);
      const outerY = outerRadius * Math.sin(angle);
      
      const points = [];
      points.push(new THREE.Vector3(innerX, innerY, 0.1));
      points.push(new THREE.Vector3(outerX, outerY, 0.1));
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
      });
      
      const line = new THREE.Line(geometry, material);
      houseGroup.add(line);
    });
    
    houseGroup.name = 'houses';
    scene.add(houseGroup);
    return houseGroup;
  }, [innerRadius, outerRadius]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button === 0) {
      isDraggingRef.current = true;
    } else if (e.button === 2) {
      isPanningRef.current = true;
    }
    previousMouseRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    isPanningRef.current = false;
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current || !cameraRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
    if (isDraggingRef.current && sceneRef.current) {
      const deltaX = e.clientX - previousMouseRef.current.x;
      const deltaY = e.clientY - previousMouseRef.current.y;
      
      sceneRef.current.rotation.y += deltaX * 0.005;
      sceneRef.current.rotation.x += deltaY * 0.005;
      
      rotationVelocityRef.current = {
        x: deltaY * 0.005,
        y: deltaX * 0.005,
      };
    }
    
    if (isPanningRef.current && cameraRef.current) {
      const deltaX = e.clientX - previousMouseRef.current.x;
      const deltaY = e.clientY - previousMouseRef.current.y;
      
      const panSpeed = 0.01;
      cameraTargetRef.current.x -= deltaX * panSpeed;
      cameraTargetRef.current.y += deltaY * panSpeed;
    }
    
    previousMouseRef.current = { x: e.clientX, y: e.clientY };
    
    if (raycasterRef.current && cameraRef.current && sceneRef.current) {
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const planets = sceneRef.current.getObjectByName('planets');
      if (planets) {
        const intersects = raycasterRef.current.intersectObjects(planets.children, true);
        if (intersects.length > 0) {
          let obj = intersects[0].object;
          while (obj.parent && !obj.userData.planet) {
            obj = obj.parent;
          }
          if (obj.userData.planet && onPlanetHover) {
            document.body.style.cursor = 'pointer';
            onPlanetHover(obj.userData.planet, { x: e.clientX, y: e.clientY });
            return;
          }
        }
      }
      document.body.style.cursor = 'grab';
      if (onPlanetHover) {
        onPlanetHover(null);
      }
    }
  }, [onPlanetHover]);

  const handleClick = useCallback((e: MouseEvent) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
    if (raycasterRef.current && cameraRef.current) {
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const planets = sceneRef.current.getObjectByName('planets');
      if (planets) {
        const intersects = raycasterRef.current.intersectObjects(planets.children, true);
        if (intersects.length > 0) {
          let obj = intersects[0].object;
          while (obj.parent && !obj.userData.planet) {
            obj = obj.parent;
          }
          if (obj.userData.planet && onPlanetClick) {
            onPlanetClick(obj.userData.planet);
          }
        }
      }
    }
  }, [onPlanetClick]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (!cameraRef.current) return;
    
    const zoomSpeed = 0.005;
    cameraRef.current.position.z += e.deltaY * zoomSpeed;
    cameraRef.current.position.z = Math.max(8, Math.min(25, cameraRef.current.position.z));
  }, []);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 12);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);
    
    const pointLight2 = new THREE.PointLight(0x533483, 0.5, 100);
    pointLight2.position.set(-10, -5, 5);
    scene.add(pointLight2);
    
    createStarField(scene);
    createZodiacRing(scene);
    createPlanets(scene, planets);
    createHouseLines(scene, houses);
    
    const centerGeometry = new THREE.CircleGeometry(0.3, 32);
    const centerMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
    });
    const center = new THREE.Mesh(centerGeometry, centerMaterial);
    center.position.z = 0.1;
    scene.add(center);
    
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      const stars = scene.getObjectByName('stars') as THREE.Points;
      if (stars) {
        stars.rotation.y += 0.0001;
        const sizes = stars.geometry.attributes.size as THREE.BufferAttribute;
        for (let i = 0; i < sizes.count; i++) {
          sizes.array[i] = 0.5 + Math.sin(Date.now() * 0.001 + i) * 0.3;
        }
        sizes.needsUpdate = true;
      }
      
      if (!isDraggingRef.current && sceneRef.current) {
        sceneRef.current.rotation.y += rotationVelocityRef.current.y;
        sceneRef.current.rotation.x += rotationVelocityRef.current.x;
        
        rotationVelocityRef.current.x *= 0.95;
        rotationVelocityRef.current.y *= 0.95;
      }
      
      if (cameraRef.current) {
        cameraRef.current.lookAt(cameraTargetRef.current);
      }
      
      renderer.render(scene, camera);
    };
    animate();
    
    const container = containerRef.current;
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('contextmenu', handleContextMenu);
    container.addEventListener('click', handleClick);
    
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
      cancelAnimationFrame(animationIdRef.current);
      
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('contextmenu', handleContextMenu);
      container.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;
    
    const existingPlanets = sceneRef.current.getObjectByName('planets');
    if (existingPlanets) {
      sceneRef.current.remove(existingPlanets);
    }
    createPlanets(sceneRef.current, planets);
    
    const existingHouses = sceneRef.current.getObjectByName('houses');
    if (existingHouses) {
      sceneRef.current.remove(existingHouses);
    }
    createHouseLines(sceneRef.current, houses);
  }, [planets, houses, createPlanets, createHouseLines]);

  return (
    <div ref={containerRef} className="chart-renderer-container" />
  );
});

ChartRenderer.displayName = 'ChartRenderer';

export default ChartRenderer;
