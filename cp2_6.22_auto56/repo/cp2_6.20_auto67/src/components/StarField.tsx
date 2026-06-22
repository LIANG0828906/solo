import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStarStore } from '@/store/starStore';
import { kelvinToRGB } from '@/utils/colorTemperature';
import type { Star } from '@/types';

interface StarFieldProps {
  onStarClick?: (star: Star) => void;
  onStarDragStart?: (star: Star) => void;
  onStarDragEnd?: (star?: Star) => void;
}

export function StarField({
  onStarClick,
  onStarDragStart,
  onStarDragEnd,
}: StarFieldProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const glowRef = useRef<THREE.Points>(null);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const isDragging = useRef(false);
  const dragStartStar = useRef<Star | null>(null);
  const dragThreshold = useRef(5);
  const startMousePos = useRef({ x: 0, y: 0 });

  const { camera, gl } = useThree();

  const stars = useStarStore((state) => state.stars);
  const visibleStarCount = useStarStore((state) => state.visibleStarCount);
  const selectedStarId = useStarStore((state) => state.selectedStarId);
  const storeIsDragging = useStarStore((state) => state.isDragging);
  const startDragging = useStarStore((state) => state.startDragging);
  const updateDragPosition = useStarStore((state) => state.updateDragPosition);
  const endDragging = useStarStore((state) => state.endDragging);
  const selectStar = useStarStore((state) => state.selectStar);

  const [hoveredStarId, setHoveredStarId] = useState<string | null>(null);

  const { positions, colors, sizes, twinklePhases } = useMemo(() => {
    const visibleStars = stars.slice(0, visibleStarCount);
    const positions = new Float32Array(visibleStars.length * 3);
    const colors = new Float32Array(visibleStars.length * 3);
    const sizes = new Float32Array(visibleStars.length);
    const twinklePhases = new Float32Array(visibleStars.length);

    for (let i = 0; i < visibleStars.length; i++) {
      const star = visibleStars[i];
      positions[i * 3] = star.x;
      positions[i * 3 + 1] = star.y;
      positions[i * 3 + 2] = star.z;

      const [r, g, b] = kelvinToRGB(star.temperature);
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;

      sizes[i] = star.size;
      twinklePhases[i] = Math.random() * Math.PI * 2;
    }

    return { positions, colors, sizes, twinklePhases };
  }, [stars, visibleStarCount]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, [positions, colors, sizes]);

  const glowGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors.slice(), 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes.map((s) => s * 2), 1));
    return geo;
  }, [positions, colors, sizes]);

  const getStarFromIntersection = (event: PointerEvent): Star | null => {
    const rect = gl.domElement.getBoundingClientRect();
    mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(mouse.current, camera);

    if (pointsRef.current) {
      const intersects = raycaster.current.intersectObject(pointsRef.current);
      if (intersects.length > 0) {
        const index = intersects[0].index;
        if (index !== undefined && index < visibleStarCount) {
          return stars[index];
        }
      }
    }
    return null;
  };

  const handlePointerDown = (event: PointerEvent) => {
    const star = getStarFromIntersection(event);
    if (star) {
      isDragging.current = false;
      dragStartStar.current = star;
      startMousePos.current = { x: event.clientX, y: event.clientY };
    } else {
      selectStar(null);
    }
  };

  const handlePointerMove = (event: PointerEvent) => {
    const star = getStarFromIntersection(event);

    if (star) {
      setHoveredStarId(star.id);
      gl.domElement.style.cursor = 'pointer';
    } else {
      setHoveredStarId(null);
      gl.domElement.style.cursor = 'grab';
    }

    if (dragStartStar.current) {
      const dx = event.clientX - startMousePos.current.x;
      const dy = event.clientY - startMousePos.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > dragThreshold.current && !isDragging.current) {
        isDragging.current = true;
        startDragging(dragStartStar.current.id);
        onStarDragStart?.(dragStartStar.current);
      }

      if (storeIsDragging) {
        const rect = gl.domElement.getBoundingClientRect();
        const ndcX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const ndcY = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        const vector = new THREE.Vector3(ndcX, ndcY, 0.5);
        vector.unproject(camera);
        const dir = vector.sub(camera.position).normalize();
        const distance = -camera.position.z / dir.z;
        const pos = camera.position.clone().add(dir.multiplyScalar(distance));

        updateDragPosition({ x: pos.x, y: pos.y, z: pos.z });
      }
    }
  };

  const handlePointerUp = (event: PointerEvent) => {
    if (isDragging.current) {
      const star = getStarFromIntersection(event);
      endDragging(star?.id);
      onStarDragEnd?.(star ?? undefined);
    } else if (dragStartStar.current) {
      const star = getStarFromIntersection(event);
      if (star && star.id === dragStartStar.current.id) {
        selectStar(star.id);
        onStarClick?.(star);
      }
    }

    isDragging.current = false;
    dragStartStar.current = null;
  };

  const handlePointerLeave = () => {
    if (isDragging.current) {
      endDragging();
      onStarDragEnd?.();
    }
    isDragging.current = false;
    dragStartStar.current = null;
    setHoveredStarId(null);
    gl.domElement.style.cursor = 'grab';
  };

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [storeIsDragging, visibleStarCount]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (pointsRef.current) {
      const sizeAttr = pointsRef.current.geometry.attributes.size as THREE.BufferAttribute;
      const colorAttr = pointsRef.current.geometry.attributes.color as THREE.BufferAttribute;

      for (let i = 0; i < visibleStarCount; i++) {
        const star = stars[i];
        const twinkle = 0.85 + Math.sin(time * 2 + twinklePhases[i]) * 0.15;
        let baseSize = sizes[i] * twinkle;

        if (star.id === selectedStarId) {
          baseSize *= 1.5;
          colorAttr.setXYZ(i, 1, 1, 1);
        } else if (star.id === hoveredStarId) {
          baseSize *= 1.2;
          const [r, g, b] = kelvinToRGB(star.temperature);
          colorAttr.setXYZ(i, r * 1.2, g * 1.2, b * 1.2);
        } else {
          const [r, g, b] = kelvinToRGB(star.temperature);
          colorAttr.setXYZ(i, r, g, b);
        }

        sizeAttr.setX(i, baseSize);
      }

      sizeAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;
    }

    if (glowRef.current && selectedStarId) {
      const selectedIndex = stars.findIndex((s) => s.id === selectedStarId);
      if (selectedIndex >= 0 && selectedIndex < visibleStarCount) {
        const sizeAttr = glowRef.current.geometry.attributes.size as THREE.BufferAttribute;
        const colorAttr = glowRef.current.geometry.attributes.color as THREE.BufferAttribute;

        for (let i = 0; i < visibleStarCount; i++) {
          if (i === selectedIndex) {
            const glowSize = sizes[i] * 3 * (0.8 + Math.sin(time * 4) * 0.2);
            sizeAttr.setX(i, glowSize);
            colorAttr.setXYZ(i, 1, 1, 1);
          } else {
            sizeAttr.setX(i, 0);
            colorAttr.setXYZ(i, 0, 0, 0);
          }
        }
        sizeAttr.needsUpdate = true;
        colorAttr.needsUpdate = true;
      }
    }
  });

  return (
    <group>
      <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
        <pointsMaterial
          size={0.5}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      <points ref={glowRef} geometry={glowGeometry} frustumCulled={false}>
        <pointsMaterial
          size={0.5}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
