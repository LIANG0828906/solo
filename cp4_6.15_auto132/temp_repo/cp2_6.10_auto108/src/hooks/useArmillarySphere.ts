import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RING_CONFIGS, STAR_CATALOG, generateRandomStars, Star, Ring } from '../types';
import { useAppStore } from '../store/useAppStore';

const STAR_ROTATION_PERIOD = 60;
const EARTH_RADIUS = 1.25;
const STAR_SPHERE_RADIUS = 2.4;

export const useArmillarySphere = () => {
  const groupRef = useRef<THREE.Group>(null);
  const starsGroupRef = useRef<THREE.Group>(null);
  const earthRef = useRef<THREE.Mesh>(null);
  const ringMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const starMeshesRef = useRef<Map<number, THREE.Mesh>>(new Map());
  const trailLinesRef = useRef<Map<number, THREE.Line>>(new Map());
  
  const { timeAcceleration, highlightedStarId, starTrails, addStarTrail } = useAppStore();

  const stars = useMemo<Star[]>(() => {
    const catalogStars = STAR_CATALOG.map(s => ({ ...s, isHighlighted: false }));
    const randomStars = generateRandomStars(170).map(s => ({ ...s, isHighlighted: false }));
    return [...catalogStars, ...randomStars];
  }, []);

  const starPositions = useMemo(() => {
    return stars.map(star => {
      const raRad = (star.ra / 24) * Math.PI * 2;
      const decRad = (star.dec / 180) * Math.PI;
      const r = STAR_SPHERE_RADIUS;
      
      const x = r * Math.cos(decRad) * Math.cos(raRad);
      const y = r * Math.sin(decRad);
      const z = r * Math.cos(decRad) * Math.sin(raRad);
      
      return { ...star, x, y, z };
    });
  }, [stars]);

  const createRingGeometry = (ring: Ring) => {
    const tubeGeometry = new THREE.TorusGeometry(
      ring.radius,
      ring.ringWidth / 2,
      16,
      128
    );
    return tubeGeometry;
  };

  const createTickMarks = (ring: Ring) => {
    const tickCount = Math.floor((ring.radius * 2 * Math.PI) / 0.5);
    const tickMarks: THREE.Mesh[] = [];
    
    for (let i = 0; i < tickCount; i++) {
      const angle = (i / tickCount) * Math.PI * 2;
      const tickGeometry = new THREE.BoxGeometry(0.02, 0.08, 0.01);
      const tickMaterial = new THREE.MeshBasicMaterial({ 
        color: ring.color,
        transparent: true,
        opacity: 0.6
      });
      const tick = new THREE.Mesh(tickGeometry, tickMaterial);
      
      tick.position.x = ring.radius * Math.cos(angle);
      tick.position.z = ring.radius * Math.sin(angle);
      tick.rotation.y = -angle;
      tick.rotation.x = Math.PI / 2;
      
      tickMarks.push(tick);
    }
    
    return tickMarks;
  };

  const createStarGeometry = (magnitude: 1 | 2 | 3) => {
    const sizes = { 1: 0.12, 2: 0.08, 3: 0.05 };
    return new THREE.SphereGeometry(sizes[magnitude], 16, 16);
  };

  const createStarMaterial = (magnitude: 1 | 2 | 3, isHighlighted: boolean) => {
    const colors = { 1: '#ffffff', 2: '#fff8dc', 3: '#b0c4de' };
    const color = isHighlighted ? '#ffd700' : colors[magnitude];
    
    return new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: isHighlighted ? 1 : 0.9
    });
  };

  const createStarGlow = (magnitude: 1 | 2 | 3, isHighlighted: boolean) => {
    const sizes = { 1: 0.12, 2: 0.08, 3: 0.05 };
    const glowSize = (isHighlighted ? sizes[magnitude] * 2 : sizes[magnitude] * 1.3) + 0.05;
    
    const glowGeometry = new THREE.SphereGeometry(glowSize, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: isHighlighted ? '#ffd700' : '#ffffff',
      transparent: true,
      opacity: isHighlighted ? 0.2 : 0.1
    });
    
    return new THREE.Mesh(glowGeometry, glowMaterial);
  };

  const createEarthGeometry = () => {
    const geometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
    
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      
      const noise = Math.sin(x * 3) * Math.sin(y * 3) * Math.sin(z * 3) * 0.03;
      const length = Math.sqrt(x * x + y * y + z * z);
      const normalizedNoise = noise * (1 + length * 0.1);
      
      positions.setX(i, x + (x / length) * normalizedNoise);
      positions.setY(i, y + (y / length) * normalizedNoise);
      positions.setZ(i, z + (z / length) * normalizedNoise);
    }
    
    geometry.computeVertexNormals();
    return geometry;
  };

  const createEarthMaterial = () => {
    return new THREE.MeshStandardMaterial({
      color: '#4a4a4a',
      roughness: 0.8,
      metalness: 0.2,
      flatShading: false
    });
  };

  const updateTrail = (starId: number, position: THREE.Vector3) => {
    const trail = starTrails.find(t => t.starId === starId);
    if (!trail) return;

    const maxPoints = 90;
    trail.points.push({ x: position.x, y: position.y, z: position.z });
    
    if (trail.points.length > maxPoints) {
      trail.points = trail.points.slice(-maxPoints);
    }

    addStarTrail(trail);
  };

  const createTrailLine = (starId: number) => {
    const trail = starTrails.find(t => t.starId === starId);
    if (!trail || trail.points.length < 2) return null;

    const points = trail.points.map(p => new THREE.Vector3(p.x, p.y, p.z));
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    const material = new THREE.LineDashedMaterial({
      color: '#ff0000',
      dashSize: 0.1,
      gapSize: 0.1,
      transparent: true,
      opacity: 0.3
    });

    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    
    return line;
  };

  useFrame((_state, delta) => {
    if (starsGroupRef.current) {
      const rotationSpeed = (delta * Math.PI * 2 / STAR_ROTATION_PERIOD) * timeAcceleration;
      starsGroupRef.current.rotation.y += rotationSpeed;
    }

    const flashPeriod = 1 / timeAcceleration;
    const flashPhase = (Date.now() / 1000) % flashPeriod;
    const flashIntensity = 0.3 + 0.7 * Math.abs(Math.sin(flashPhase * Math.PI * 2));

    ringMeshesRef.current.forEach((mesh) => {
      const material = mesh.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = flashIntensity * 0.2;
    });

    if (highlightedStarId !== null) {
      const starMesh = starMeshesRef.current.get(highlightedStarId);
      if (starMesh && starsGroupRef.current) {
        const worldPos = new THREE.Vector3();
        starMesh.getWorldPosition(worldPos);
        updateTrail(highlightedStarId, worldPos);
      }
    }

    starTrails.forEach(trail => {
      if (trail.points.length >= 2) {
        let line = trailLinesRef.current.get(trail.starId);
        
        if (!line) {
          const newLine = createTrailLine(trail.starId);
          if (newLine && starsGroupRef.current) {
            starsGroupRef.current.add(newLine);
            trailLinesRef.current.set(trail.starId, newLine);
            line = newLine;
          }
        }
        
        if (line) {
          const points = trail.points.map(p => new THREE.Vector3(p.x, p.y, p.z));
          line.geometry.dispose();
          line.geometry = new THREE.BufferGeometry().setFromPoints(points);
          line.computeLineDistances();
        }
      }
    });

    starMeshesRef.current.forEach((mesh, starId) => {
      const isHighlighted = starId === highlightedStarId;
      const starData = starPositions.find(s => s.id === starId);
      
      if (starData) {
        mesh.scale.setScalar(isHighlighted ? 1.5 : 1);
        const material = mesh.material as THREE.MeshBasicMaterial;
        material.color.set(isHighlighted ? '#ffd700' : 
          starData.magnitude === 1 ? '#ffffff' :
          starData.magnitude === 2 ? '#fff8dc' : '#b0c4de');
      }
    });
  });

  useEffect(() => {
    const interval = setInterval(() => {
      useAppStore.getState().clearExpiredTrails();
      
      trailLinesRef.current.forEach((line, starId) => {
        const trail = starTrails.find(t => t.starId === starId);
        if (!trail || Date.now() - trail.createdAt >= 15000) {
          if (starsGroupRef.current) {
            starsGroupRef.current.remove(line);
          }
          line.geometry.dispose();
          (line.material as THREE.Material).dispose();
          trailLinesRef.current.delete(starId);
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [starTrails]);

  return {
    groupRef,
    starsGroupRef,
    earthRef,
    ringMeshesRef,
    starMeshesRef,
    trailLinesRef,
    stars: starPositions,
    rings: RING_CONFIGS,
    createRingGeometry,
    createTickMarks,
    createStarGeometry,
    createStarMaterial,
    createStarGlow,
    createEarthGeometry,
    createEarthMaterial,
    earthRadius: EARTH_RADIUS
  };
};
