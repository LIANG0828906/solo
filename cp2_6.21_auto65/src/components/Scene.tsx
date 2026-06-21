import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import {
  OrbitControls,
  useTexture,
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

  const time = useSimulationStore((state) => state.time);
  const sunDeclination = useSimulationStore((state) => state.sunDeclination);
  const isPlaying = useSimulationStore((state) => state.isPlaying);
  const setTime = useSimulationStore((state) => state.setTime);
  const setSelectedPosition = useSimulationStore((state) => state.setSelectedPosition);

  const [clickMarkers, setClickMarkers] = useState<ClickMarker[]>([]);

  const [earthTexture, earthNormalMap, cloudsTexture] = useTexture([
    'https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg',
    'https://unpkg.com/three-globe@2.31.1/example/img/earth-topology.png',
    'https://unpkg.com/three-globe@2.31.1/example/img/earth-clouds.png',
  ]);

  const sunPosition = useMemo(() => {
    const { lat, lon } = calcSunPosition(time, sunDeclination);
    const latRad = (lat * Math.PI) / 180;
    const lonRad = (lon * Math.PI) / 180;
    const x = SUN_DISTANCE * Math.cos(latRad) * Math.cos(lonRad);
    const y = SUN_DISTANCE * Math.sin(latRad);
    const z = SUN_DISTANCE * Math.cos(latRad) * Math.sin(lonRad);
    return [x, y, z] as [number, number, number];
  }, [time, sunDeclination]);

  const terminatorUniforms = useMemo(
    () => ({
      sunDirection: { value: new THREE.Vector3(...sunPosition).normalize() },
    }),
    [sunPosition],
  );

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
    if (directionalLightRef.current) {
      directionalLightRef.current.position.set(...sunPosition);
      terminatorUniforms.sunDirection.value.set(...sunPosition).normalize();
    }

    if (isPlaying) {
      lastTimeAccumulator.current += delta * 1000;
      if (lastTimeAccumulator.current >= 100) {
        const increments = Math.floor(lastTimeAccumulator.current / 100);
        setTime(time + increments * 6);
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
        intensity