import { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Earthquake } from '../types/earthquake';
import { depthToColor, magToRadius } from '../utils/colorScale';

interface EarthquakeMarkersProps {
  earthquakes: Earthquake[];
  onMarkerClick: (earthquake: Earthquake, screenPos: { x: number; y: number }) => void;
  flashId?: string | null;
}

const EARTH_RADIUS = 5;

const latLngToVector3 = (lat: number, lng: number, radius: number = EARTH_RADIUS): THREE.Vector3 => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
};

const EarthquakeMarker = ({ 
  earthquake, 
  radius, 
  onClick,
  isFlashing
}: { 
  earthquake: Earthquake; 
  radius: number; 
  onClick: (eq: Earthquake, pos: { x: number; y: number }) => void;
  isFlashing: boolean;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const lineRef = useRef<THREE.Line>(null);
  const { camera, gl } = useThree();
  const baseScale = useRef(radius);
  const flashPhase = useRef(0);

  const position = useMemo(() => {
    return latLngToVector3(earthquake.lat, earthquake.lng, EARTH_RADIUS + radius * 0.8);
  }, [earthquake.lat, earthquake.lng, radius]);

  const color = useMemo(() => depthToColor(earthquake.depth), [earthquake.depth]);

  const linePoints = useMemo(() => {
    const surfacePos = latLngToVector3(earthquake.lat, earthquake.lng);
    return [surfacePos, position];
  }, [earthquake.lat, earthquake.lng, position]);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 2 + earthquake.mag) * 0.15;
      meshRef.current.scale.setScalar(baseScale.current * pulse);
      
      const material = meshRef.current.material as THREE.MeshBasicMaterial;
      if (isFlashing) {
        flashPhase.current += 0.2;
        const flashIntensity = Math.abs(Math.sin(flashPhase.current));
        material.opacity = 0.6 + flashIntensity * 0.4;
      } else {
        material.opacity = 0.8;
      }
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    const rect = gl.domElement.getBoundingClientRect();
    const vector = new THREE.Vector3();
    meshRef.current!.getWorldPosition(vector);
    vector.project(camera);
    
    const x = (vector.x * 0.5 + 0.5) * rect.width + rect.left;
    const y = (-vector.y * 0.5 + 0.5) * rect.height + rect.top;
    
    onClick(earthquake, { x, y });
  };

  const lineGeometry = useMemo(() => {
    const positions = new Float32Array([
      linePoints[0].x, linePoints[0].y, linePoints[0].z,
      linePoints[1].x, linePoints[1].y, linePoints[1].z,
    ]);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [linePoints]);

  return (
    <group>
      <mesh
        ref={meshRef}
        position={position}
        onClick={handleClick}
        scale={radius}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.8}
        />
      </mesh>
      <line ref={lineRef} geometry={lineGeometry}>
        <lineBasicMaterial color={color} transparent opacity={0.5} />
      </line>
    </group>
  );
};

const EarthquakeMarkers = ({ earthquakes, onMarkerClick, flashId }: EarthquakeMarkersProps) => {
  const magRange = useMemo(() => {
    if (earthquakes.length === 0) return { min: 3, max: 7 };
    const mags = earthquakes.map(e => e.mag);
    return { min: Math.min(...mags), max: Math.max(...mags) };
  }, [earthquakes]);

  const markerRadius = (mag: number) => {
    return magToRadius(mag, magRange.min, magRange.max) * 0.15;
  };

  return (
    <group>
      {earthquakes.map((eq) => (
        <EarthquakeMarker
          key={eq.id}
          earthquake={eq}
          radius={markerRadius(eq.mag)}
          onClick={onMarkerClick}
          isFlashing={flashId === eq.id}
        />
      ))}
    </group>
  );
};

export default EarthquakeMarkers;
