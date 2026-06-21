import { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import {
  OrbitControls,
  Line,
} from '@react-three/drei';
import * as THREE from 'three';
import { useSimulationStore } from '@/store/useSimulationStore';
import { calcSunPosition } from '@/utils/geoCalculator';

const EARTH_RADIUS = 1;
const CLOUDS_RADIUS = 1.01;
const TERMINATOR_RADIUS = 1.005;
const LINE_SEGMENTS = 360;
const EARTH_ROTATION_SPEED = 0.05;
const CLOUDS_ROTATION_SPEED = EARTH_ROTATION_SPEED * 0.5;
const SUN_DISTANCE = 5;
const CLICK_MARKER_DURATION = 2000;

interface ClickMarker {
  id: number;
  position: [number, number, number];
  createdAt: number;
}

const terminatorVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const terminatorFragmentShader = `
  uniform vec3 sunDirection;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vec3 normal = normalize(vNormal);
    vec3 sunDir = normalize(sunDirection);
    float dotProduct = dot(normal, sunDir);
    float terminatorWidth = 0.05;
    float gradient = smoothstep(-terminatorWidth, terminatorWidth, dotProduct);
    vec3 dayColor = vec3(1.0, 0.9, 0.7);
    vec3 nightColor = vec3(0.0, 0.0, 0.0);
    vec3 color = mix(nightColor, dayColor, gradient);
    float alpha = 1.0 - abs(dotProduct);
    alpha = smoothstep(0.0, 0.3, alpha) * 0.6;
    gl_FragColor = vec4(color, alpha);
  }
`;

function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const terminatorRef = useRef<THREE.Mesh>(null);
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  const lastTimeAccumulator = useRef(0);
  const clickMarkerId = useRef(0);
  const sunPositionRef = useRef<[number, number, number]>([0, 0, 0]);

  const time = useSimulationStore((s) => s.time);
  const sunDeclination = useSimulationStore((s) => s.sunDeclination);
  const isPlaying = useSimulationStore((s) => s.isPlaying);
  const setTime = useSimulationStore((s) => s.setTime);
  const setSelectedPosition = useSimulationStore((s) => s.setSelectedPosition);
  const isPlayingRef = useRef(isPlaying);
  const sunDeclinationRef = useRef(sunDeclination);
  const terminatorUniformsRef = useRef<{ sunDirection: { value: THREE.Vector3 } } | null>(null);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    sunDeclinationRef.current = sunDeclination;
  }, [sunDeclination]);

  const [clickMarkers, setClickMarkers] = useState<ClickMarker[]>([]);
  const [earthMap, setEarthMap] = useState<THREE.Texture | null>(null);
  const [earthNormal, setEarthNormal] = useState<THREE.Texture | null>(null);
  const [cloudsMap, setCloudsMap] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    const urls = [
      'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/planets/earth_atmos_2048.jpg',
      'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/planets/earth_normal_2048.jpg',
      'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/planets/earth_clouds_1024.png',
    ];
    const setters = [setEarthMap, setEarthNormal, setCloudsMap];

    urls.forEach((url, i) => {
      loader.load(
        url,
        (tex) => {
          if (i === 0) tex.colorSpace = THREE.SRGBColorSpace;
          setters[i](tex);
        },
        undefined,
        () => {
          setters[i](null);
        },
      );
    });
  }, []);

  const sunPosition = useMemo(() => {
    const { lat, lon } = calcSunPosition(time, sunDeclination);
    const latRad = (lat * Math.PI) / 180;
    const lonRad = (lon * Math.PI) / 180;
    const x = SUN_DISTANCE * Math.cos(latRad) * Math.cos(lonRad);
    const y = SUN_DISTANCE * Math.sin(latRad);
    const z = SUN_DISTANCE * Math.cos(latRad) * Math.sin(lonRad);
    sunPositionRef.current = [x, y, z];
    return [x, y, z] as [number, number, number];
  }, [time, sunDeclination]);

  const terminatorUniforms = useMemo(() => {
    const uniforms = {
      sunDirection: { value: new THREE.Vector3(...sunPosition).normalize() },
    };
    terminatorUniformsRef.current = uniforms;
    return uniforms;
  }, [sunPosition]);

  useFrame((_, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += EARTH_ROTATION_SPEED * delta;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += CLOUDS_ROTATION_SPEED * delta;
    }
    if (terminatorRef.current) {
      terminatorRef.current.rotation.y = earthRef.current?.rotation.y ?? 0;
    }

    const [sx, sy, sz] = sunPositionRef.current;
    if (directionalLightRef.current) {
      directionalLightRef.current.position.set(sx, sy, sz);
      if (terminatorUniformsRef.current) {
        terminatorUniformsRef.current.sunDirection.value.set(sx, sy, sz).normalize();
      }
    }

    if (isPlayingRef.current) {
      lastTimeAccumulator.current += delta * 1000;
      if (lastTimeAccumulator.current >= 100) {
        const increments = Math.floor(lastTimeAccumulator.current / 100);
        setTime((prevTime) => (prevTime + increments * 6) % 1440);
        lastTimeAccumulator.current -= increments * 100;
      }
    }

    const now = Date.now();
    setClickMarkers((prev) =>
      prev.filter((marker) => now - marker.createdAt < CLICK_MARKER_DURATION),
    );
  });

  const createLatitudeLinePoints = (latitude: number): [number, number, number][] => {
    const latRad = (latitude * Math.PI) / 180;
    const y = Math.sin(latRad);
    const radius = Math.cos(latRad);
    const points: [number, number, number][] = [];
    for (let i = 0; i <= LINE_SEGMENTS; i++) {
      const angle = (i / LINE_SEGMENTS) * Math.PI * 2;
      points.push([radius * Math.cos(angle), y, radius * Math.sin(angle)]);
    }
    return points;
  };

  const equatorPoints = useMemo(() => createLatitudeLinePoints(0), []);
  const tropicOfCancerPoints = useMemo(() => createLatitudeLinePoints(23.5), []);
  const tropicOfCapricornPoints = useMemo(() => createLatitudeLinePoints(-23.5), []);

  const handleEarthClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    const point = event.point;
    const lat = (Math.asin(point.y / EARTH_RADIUS) * 180) / Math.PI;
    const lon = (Math.atan2(point.z, point.x) * 180) / Math.PI;
    setSelectedPosition(lat, lon);

    const newMarker: ClickMarker = {
      id: clickMarkerId.current++,
      position: [point.x, point.y, point.z],
      createdAt: Date.now(),
    };
    setClickMarkers((prev) => [...prev, newMarker]);
  };

  return (
    <group>
      <ambientLight intensity={0.1} color="#1a2a4a" />
      <directionalLight
        ref={directionalLightRef}
        position={sunPosition}
        intensity={1.5}
        castShadow
      />
      <mesh ref={earthRef} onClick={handleEarthClick}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshStandardMaterial
          map={earthMap ?? undefined}
          normalMap={earthNormal ?? undefined}
          color={earthMap ? '#ffffff' : '#1a4d7a'}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      <mesh ref={terminatorRef}>
        <sphereGeometry args={[TERMINATOR_RADIUS, 64, 64]} />
        <shaderMaterial
          vertexShader={terminatorVertexShader}
          fragmentShader={terminatorFragmentShader}
          uniforms={terminatorUniforms}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {cloudsMap && (
        <mesh ref={cloudsRef}>
          <sphereGeometry args={[CLOUDS_RADIUS, 64, 64]} />
          <meshStandardMaterial
            map={cloudsMap}
            transparent
            opacity={0.4}
            depthWrite={false}
          />
        </mesh>
      )}
      <Line
        points={equatorPoints}
        color="rgba(255,255,255,0.4)"
        lineWidth={1}
        dashed
        dashSize={0.05}
        gapSize={0.05}
      />
      <Line
        points={tropicOfCancerPoints}
        color="rgba(255,80,80,0.5)"
        lineWidth={1}
        dashed
        dashSize={0.05}
        gapSize={0.05}
      />
      <Line
        points={tropicOfCapricornPoints}
        color="rgba(255,80,80,0.5)"
        lineWidth={1}
        dashed
        dashSize={0.05}
        gapSize={0.05}
      />
      {clickMarkers.map((marker) => {
        const now = Date.now();
        const opacity = 1 - (now - marker.createdAt) / CLICK_MARKER_DURATION;
        return (
          <mesh key={marker.id} position={marker.position}>
            <sphereGeometry args={[0.015, 16, 16]} />
            <meshBasicMaterial color="#66ffff" transparent opacity={opacity} />
          </mesh>
        );
      })}
    </group>
  );
}

function SceneContent() {
  const { camera } = useThree();
  const setCameraPosition = useSimulationStore((state) => state.setCameraPosition);

  const handleControlsEnd = () => {
    setCameraPosition([camera.position.x, camera.position.y, camera.position.z]);
  };

  return (
    <>
      <OrbitControls
        enablePan={false}
        minDistance={1.5}
        maxDistance={8}
        target={[0, 0, 0]}
        makeDefault
        onEnd={handleControlsEnd}
      />
      <Earth />
    </>
  );
}

export default function Scene() {
  const cameraPosition = useSimulationStore((state) => state.cameraPosition);

  return (
    <Canvas
      gl={{ antialias: true }}
      camera={{ position: cameraPosition, fov: 45 }}
      style={{ position: 'absolute', inset: 0, zIndex: 1 }}
    >
      <SceneContent />
    </Canvas>
  );
}
