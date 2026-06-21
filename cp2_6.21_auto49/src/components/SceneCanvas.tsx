import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useLightStore } from '@/store/lightStore';

function colorDistance(c1: THREE.Color, c2: THREE.Color): number {
  const r = c1.r - c2.r;
  const g = c1.g - c2.g;
  const b = c1.b - c2.b;
  return Math.sqrt(r * r + g * g + b * b);
}

interface TintMaterialProps {
  color: string;
  roughness: number;
  metalness: number;
  warmStrength: number;
  coolStrength: number;
  lightDir: THREE.Vector3;
  warmColor: THREE.Color;
  coolColor: THREE.Color;
}

const TintedStandardMaterial: React.FC<TintMaterialProps> = ({
  color,
  roughness,
  metalness,
  warmStrength,
  coolStrength,
  lightDir,
  warmColor,
  coolColor,
}) => {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const uniformsRef = useRef<any>(null);

  useEffect(() => {
    if (!matRef.current) return;
    const mat = matRef.current;

    const uniforms = {
      uWarmStrength: { value: 0 },
      uCoolStrength: { value: 0 },
      uWarmColor: { value: new THREE.Color('#ffcc66') },
      uCoolColor: { value: new THREE.Color('#6688cc') },
      uLightDir: { value: new THREE.Vector3(0, 1, 0) },
    };
    uniformsRef.current = uniforms;

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uWarmStrength = uniforms.uWarmStrength;
      shader.uniforms.uCoolStrength = uniforms.uCoolStrength;
      shader.uniforms.uWarmColor = uniforms.uWarmColor;
      shader.uniforms.uCoolColor = uniforms.uCoolColor;
      shader.uniforms.uLightDir = uniforms.uLightDir;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>
         varying vec3 vTintWorldNormal;`
      );

      shader.vertexShader = shader.vertexShader.replace(
        '#include <beginnormal_vertex>',
        `#include <beginnormal_vertex>
         vTintWorldNormal = normalize(mat3(modelMatrix) * objectNormal);`
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `#include <common>
         uniform float uWarmStrength;
         uniform float uCoolStrength;
         uniform vec3 uWarmColor;
         uniform vec3 uCoolColor;
         uniform vec3 uLightDir;
         varying vec3 vTintWorldNormal;`
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
         {
           vec3 N = normalize(vTintWorldNormal);
           vec3 L = normalize(uLightDir);
           float NdotL = dot(N, -L);

           float litFactor = smoothstep(-0.15, 0.55, NdotL);
           float shadowFactor = smoothstep(0.15, -0.55, NdotL);

           vec3 warmTint = uWarmColor * uWarmStrength * 0.35 * litFactor;
           vec3 coolTint = uCoolColor * uCoolStrength * 0.3 * shadowFactor;

           gl_FragColor.rgb += warmTint;
           gl_FragColor.rgb += coolTint;
         }`
      );
    };

    mat.needsUpdate = true;
  }, []);

  useEffect(() => {
    if (!uniformsRef.current) return;
    uniformsRef.current.uWarmStrength.value = warmStrength;
    uniformsRef.current.uCoolStrength.value = coolStrength;
    uniformsRef.current.uLightDir.value.copy(lightDir);
    uniformsRef.current.uWarmColor.value.copy(warmColor);
    uniformsRef.current.uCoolColor.value.copy(coolColor);
  }, [warmStrength, coolStrength, lightDir, warmColor, coolColor]);

  return (
    <meshStandardMaterial
      ref={matRef}
      color={color}
      roughness={roughness}
      metalness={metalness}
      shadowSide={THREE.DoubleSide}
    />
  );
};

function SceneContent() {
  const sun = useLightStore((s) => s.sun);
  const moon = useLightStore((s) => s.moon);
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const pointRef = useRef<THREE.PointLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);

  const sunPos = useMemo(() => {
    const d = 8;
    const el = (sun.elevation * Math.PI) / 180;
    const az = (sun.azimuth * Math.PI) / 180;
    return new THREE.Vector3(
      d * Math.cos(el) * Math.sin(az),
      d * Math.sin(el),
      d * Math.cos(el) * Math.cos(az)
    );
  }, [sun.elevation, sun.azimuth]);

  const moonPos = useMemo(() => {
    const d = 6;
    const el = (moon.elevation * Math.PI) / 180;
    const az = (moon.azimuth * Math.PI) / 180;
    return new THREE.Vector3(
      d * Math.cos(el) * Math.sin(az),
      d * Math.sin(el),
      d * Math.cos(el) * Math.cos(az)
    );
  }, [moon.elevation, moon.azimuth]);

  const { hemiSky, hemiGround, warmStrength, coolStrength, warmColor, coolColor, lightDir } = useMemo(() => {
    const sc = new THREE.Color(sun.color);
    const mc = new THREE.Color(moon.color);

    const warmStart = new THREE.Color('#ffaa00');
    const warmEnd = new THREE.Color('#ff6600');
    const warmMid = new THREE.Color().lerpColors(warmStart, warmEnd, 0.5);
    const warmRange = colorDistance(warmStart, warmEnd) * 1.5;
    const warmDist = colorDistance(sc, warmMid);
    const warmth = Math.max(0, Math.min(1, 1 - warmDist / Math.max(warmRange, 0.3))) * (sc.r > 0.6 ? 1 : 0);

    const coolStart = new THREE.Color('#aaccff');
    const coolEnd = new THREE.Color('#4466ff');
    const coolMid = new THREE.Color().lerpColors(coolStart, coolEnd, 0.5);
    const coolRange = colorDistance(coolStart, coolEnd) * 1.5;
    const coolDist = colorDistance(mc, coolMid);
    const coolness = Math.max(0, Math.min(1, 1 - coolDist / Math.max(coolRange, 0.3))) * (mc.b > 0.5 ? 1 : 0);

    const sky = new THREE.Color('#f0f0f0').lerp(new THREE.Color('#fff0c8'), warmth * 0.5);
    const gnd = new THREE.Color('#556677').lerp(new THREE.Color('#6699cc'), coolness * 0.6);

    const wCol = new THREE.Color('#ffcc66').lerp(new THREE.Color('#ff9933'), warmth);
    const cCol = new THREE.Color('#88aadd').lerp(new THREE.Color('#4466cc'), coolness);

    const lDir = sunPos.clone().negate().normalize();

    return {
      hemiSky: sky,
      hemiGround: gnd,
      warmStrength: warmth,
      coolStrength: coolness,
      warmColor: wCol,
      coolColor: cCol,
      lightDir: lDir,
    };
  }, [sun.color, sun.elevation, sun.azimuth, moon.color]);

  useEffect(() => {
    if (dirRef.current) {
      dirRef.current.shadow.mapSize.width = 1024;
      dirRef.current.shadow.mapSize.height = 1024;
      dirRef.current.shadow.camera.left = -5;
      dirRef.current.shadow.camera.right = 5;
      dirRef.current.shadow.camera.top = 5;
      dirRef.current.shadow.camera.bottom = -5;
      dirRef.current.shadow.camera.near = 0.1;
      dirRef.current.shadow.camera.far = 50;
      dirRef.current.shadow.bias = -0.001;
      dirRef.current.shadow.radius = 3;
      dirRef.current.shadow.camera.updateProjectionMatrix();
    }
    if (pointRef.current) {
      pointRef.current.shadow.mapSize.width = 1024;
      pointRef.current.shadow.mapSize.height = 1024;
      pointRef.current.shadow.bias = -0.001;
      pointRef.current.shadow.radius = 3;
    }
  }, []);

  useFrame(() => {
    if (dirRef.current) {
      dirRef.current.position.copy(sunPos);
      dirRef.current.target.position.set(0, 0, 0);
    }
    if (pointRef.current) {
      pointRef.current.position.copy(moonPos);
    }
    if (hemiRef.current) {
      hemiRef.current.color.copy(hemiSky);
      hemiRef.current.groundColor.copy(hemiGround);
    }
  });

  const tintProps = {
    warmStrength,
    coolStrength,
    lightDir,
    warmColor,
    coolColor,
  };

  return (
    <>
      <ambientLight intensity={0.2} />

      <hemisphereLight ref={hemiRef} args={[hemiSky, hemiGround, 0.4]} />

      <directionalLight
        ref={dirRef}
        position={[sunPos.x, sunPos.y, sunPos.z]}
        intensity={sun.intensity}
        color={sun.color}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-camera-near={0.1}
        shadow-camera-far={50}
        shadow-bias={-0.001}
        shadow-radius={3}
      />

      <pointLight
        ref={pointRef}
        position={[moonPos.x, moonPos.y, moonPos.z]}
        intensity={moon.intensity}
        color={moon.color}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.001}
        shadow-radius={3}
        distance={20}
        decay={1}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <TintedStandardMaterial
          color="#777777"
          roughness={0.9}
          metalness={0.1}
          {...tintProps}
        />
      </mesh>

      <Grid
        position={[0, 0.001, 0]}
        args={[10, 10]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#999999"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#bbbbbb"
        fadeDistance={15}
        infiniteGrid={false}
      />

      <mesh position={[-2, 0.75, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.75, 32, 32]} />
        <TintedStandardMaterial
          color="#ff6b6b"
          roughness={0.4}
          metalness={0.1}
          {...tintProps}
        />
      </mesh>
      <mesh position={[2, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <TintedStandardMaterial
          color="#4ecdc4"
          roughness={0.4}
          metalness={0.1}
          {...tintProps}
        />
      </mesh>
      <mesh position={[0, 0.75, -2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.5, 1.5, 32]} />
        <TintedStandardMaterial
          color="#ffe66d"
          roughness={0.4}
          metalness={0.1}
          {...tintProps}
        />
      </mesh>
      <mesh position={[0, 0.75, 2]} castShadow receiveShadow>
        <coneGeometry args={[0.5, 1.5, 32]} />
        <TintedStandardMaterial
          color="#95e1d3"
          roughness={0.4}
          metalness={0.1}
          {...tintProps}
        />
      </mesh>

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={25}
        maxPolarAngle={Math.PI / 2 - 0.05}
      />
    </>
  );
}

export default function SceneCanvas() {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas
        shadows
        camera={{ position: [8, 6, 8], fov: 50, near: 0.1, far: 100 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          gl.shadowMap.needsUpdate = true;
        }}
      >
        <color attach="background" args={['#1a1a2e']} />
        <fog attach="fog" args={['#1a1a2e', 15, 35]} />
        <SceneContent />
      </Canvas>
    </div>
  );
}
