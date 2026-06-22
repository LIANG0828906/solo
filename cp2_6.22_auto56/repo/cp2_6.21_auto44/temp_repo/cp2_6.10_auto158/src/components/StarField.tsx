import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { stars, raDecToVector3, getStarById } from '@/data/starData';
import { starVertexShader, starFragmentShader } from './shaders/starShader';
import { useStore } from '@/store/useStore';
import type { Star } from '@/types';

interface StarFieldProps {
  onStarClick: (star: Star) => void;
}

export function StarField({ onStarClick }: StarFieldProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { camera, gl, raycaster, mouse } = useThree();
  const [hoveredStarId, setHoveredStarId] = useState<string | null>(null);
  const [starPositions] = useState(() => new Map<string, THREE.Vector3>());
  
  const timeMonth = useStore((state) => state.timeMonth);
  const selectedStarId = useStore((state) => state.selectedStarId);
  const searchQuery = useStore((state) => state.searchQuery);

  const { geometry, starIds } = useMemo(() => {
    const positions = new Float32Array(stars.length * 3);
    const sizes = new Float32Array(stars.length);
    const magnitudes = new Float32Array(stars.length);
    const twinkleOffsets = new Float32Array(stars.length);
    const colors = new Float32Array(stars.length * 3);
    const indices: number[] = [];
    const ids: string[] = [];

    stars.forEach((star, i) => {
      const [x, y, z] = raDecToVector3(star.ra, star.dec, 100);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      starPositions.set(star.id, new THREE.Vector3(x, y, z));
      
      const sizeMultiplier = star.isMain ? 1.5 : 1.0;
      const baseSize = (6 - star.magnitude) * 1.2;
      sizes[i] = Math.max(2, baseSize * sizeMultiplier);
      
      magnitudes[i] = star.magnitude;
      twinkleOffsets[i] = Math.random() * Math.PI * 2;
      
      const colorT = Math.max(0, Math.min(1, star.magnitude / 6));
      const r = 1.0;
      const g = 0.95 - colorT * 0.15;
      const b = 0.9 + colorT * 0.1;
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
      
      indices.push(i);
      ids.push(star.id);
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('magnitude', new THREE.BufferAttribute(magnitudes, 1));
    geo.setAttribute('twinkleOffset', new THREE.BufferAttribute(twinkleOffsets, 1));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setIndex(indices);

    return { geometry: geo, starIds: ids };
  }, [starPositions]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
    
    if (pointsRef.current) {
      const rotationAngle = (timeMonth / 12) * Math.PI * 2;
      pointsRef.current.rotation.y = rotationAngle;
    }

    if (selectedStarId) {
      const selectedStar = getStarById(selectedStarId);
      if (selectedStar) {
        const [x, y, z] = raDecToVector3(selectedStar.ra, selectedStar.dec, 100);
        const targetPos = new THREE.Vector3(x, y, z);
        const rotationAngle = (timeMonth / 12) * Math.PI * 2;
        targetPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationAngle);
        
        const lookAtPos = targetPos.clone().normalize().multiplyScalar(150);
        camera.position.lerp(lookAtPos, 0.02);
        camera.lookAt(targetPos);
      }
    }
  });

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!pointsRef.current || !gl.domElement) return;
      
      const rect = gl.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(pointsRef.current);
      
      if (intersects.length > 0 && intersects[0].index !== undefined) {
        const starId = starIds[intersects[0].index];
        const star = getStarById(starId);
        if (star) {
          onStarClick(star);
        }
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!pointsRef.current || !gl.domElement) return;
      
      const rect = gl.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(pointsRef.current);
      
      if (intersects.length > 0 && intersects[0].index !== undefined) {
        const starId = starIds[intersects[0].index];
        setHoveredStarId(starId);
        document.body.style.cursor = 'pointer';
      } else {
        setHoveredStarId(null);
        document.body.style.cursor = 'default';
      }
    };

    gl.domElement.addEventListener('click', handleClick);
    gl.domElement.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      gl.domElement.removeEventListener('click', handleClick);
      gl.domElement.removeEventListener('mousemove', handleMouseMove);
    };
  }, [camera, gl, mouse, raycaster, starIds, onStarClick]);

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      pixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    }),
    []
  );

  const filteredStars = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const lowerQuery = searchQuery.toLowerCase();
    return stars.filter(
      (s) =>
        s.name.toLowerCase().includes(lowerQuery) ||
        s.constellation.toLowerCase().includes(lowerQuery) ||
        s.fenye.toLowerCase().includes(lowerQuery) ||
        s.westernConstellation.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery]);

  return (
    <group>
      <points ref={pointsRef} geometry={geometry}>
        <shaderMaterial
          ref={materialRef}
          vertexShader={starVertexShader}
          fragmentShader={starFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
      
      {hoveredStarId && !selectedStarId && (
        <mesh position={starPositions.get(hoveredStarId) || new THREE.Vector3()}>
          <sphereGeometry args={[1.5, 16, 16]} />
          <meshBasicMaterial color="#d4af37" transparent opacity={0.5} />
        </mesh>
      )}
      
      {selectedStarId && (
        <mesh position={starPositions.get(selectedStarId) || new THREE.Vector3()}>
          <sphereGeometry args={[2.5, 24, 24]} />
          <meshBasicMaterial color="#d4af37" transparent opacity={0.8} />
        </mesh>
      )}

      {filteredStars && filteredStars.length > 0 && (
        <group>
          {filteredStars.map((star) => {
            if (star.id === selectedStarId) return null;
            const pos = starPositions.get(star.id);
            if (!pos) return null;
            return (
              <mesh key={star.id} position={pos}>
                <sphereGeometry args={[1.2, 12, 12]} />
                <meshBasicMaterial color="#5f9ea0" transparent opacity={0.6} />
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
}
