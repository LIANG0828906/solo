import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, FirstPersonControls } from '@react-three/drei';
import * as THREE from 'three';
import { TerrainParams, TerrainStats, ViewMode, TERRAIN_SIZE, GRID_RESOLUTION } from '../types';
import { generateHeightMap, generateTerrainStats, getColorGradient } from '../utils/terrainGenerator';

interface TerrainSceneProps {
  params: TerrainParams;
  viewMode: ViewMode;
  regenerateTrigger: number;
  onStatsUpdate: (stats: TerrainStats) => void;
}

const vertexShader = `
  varying float vHeight;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  uniform float uTransitionProgress;
  uniform sampler2D uHeightMap;
  uniform sampler2D uPrevHeightMap;
  uniform float uSize;
  
  void main() {
    vec2 uv = position.xz / uSize + 0.5;
    
    float prevHeight = texture2D(uPrevHeightMap, uv).r;
    float targetHeight = texture2D(uHeightMap, uv).r;
    float height = mix(prevHeight, targetHeight, uTransitionProgress);
    
    vHeight = height;
    vec3 newPosition = vec3(position.x, height, position.z);
    vPosition = newPosition;
    vNormal = normalMatrix * normal;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const fragmentShader = `
  varying float vHeight;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  uniform vec3 uLowColor;
  uniform vec3 uHighColor;
  uniform vec3 uPrevLowColor;
  uniform vec3 uPrevHighColor;
  uniform float uColorTransitionProgress;
  uniform float uMaxHeight;
  uniform float uMinHeight;
  uniform float uOpacity;
  
  void main() {
    float heightRange = uMaxHeight - uMinHeight;
    float normalizedHeight = heightRange > 0.0 ? (vHeight - uMinHeight) / heightRange : 0.5;
    
    vec3 prevColor = mix(uPrevLowColor, uPrevHighColor, normalizedHeight);
    vec3 targetColor = mix(uLowColor, uHighColor, normalizedHeight);
    vec3 finalColor = mix(prevColor, targetColor, uColorTransitionProgress);
    
    vec3 lightDir = normalize(vec3(-1.0, 1.0, -1.0));
    float diff = max(dot(vNormal, lightDir), 0.0);
    float ambient = 0.3;
    vec3 diffuse = vec3(diff * 0.7);
    
    vec3 viewDir = normalize(cameraPosition - vPosition);
    vec3 halfDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(vNormal, halfDir), 0.0), 32.0);
    vec3 specular = vec3(spec * 0.1);
    
    vec3 color = finalColor * (ambient + diffuse) + specular;
    
    gl_FragColor = vec4(color, uOpacity);
  }
`;

interface TerrainMeshProps {
  params: TerrainParams;
  regenerateTrigger: number;
  onStatsUpdate: (stats: TerrainStats) => void;
}

const TerrainMesh: React.FC<TerrainMeshProps> = ({ params, regenerateTrigger, onStatsUpdate }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const [heightMap, setHeightMap] = useState<Float32Array | null>(null);
  const [prevHeightMap, setPrevHeightMap] = useState<Float32Array | null>(null);
  const [opacity, setOpacity] = useState(1);
  const [isFading, setIsFading] = useState(false);
  const transitionProgressRef = useRef(0);
  const colorTransitionProgressRef = useRef(0);
  const targetParamsRef = useRef(params);
  const prevParamsRef = useRef(params);
  
  const size = TERRAIN_SIZE;
  
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, GRID_RESOLUTION, GRID_RESOLUTION);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);
  
  const createDataTexture = useCallback((data: Float32Array): THREE.DataTexture => {
    const resolution = GRID_RESOLUTION + 1;
    const pixels = new Uint8Array(resolution * resolution * 4);
    
    let maxH = -Infinity;
    let minH = Infinity;
    for (let i = 0; i < data.length; i++) {
      if (data[i] > maxH) maxH = data[i];
      if (data[i] < minH) minH = data[i];
    }
    const range = maxH - minH || 1;
    
    for (let i = 0; i < data.length; i++) {
      const normalized = ((data[i] - minH) / range) * 255;
      const idx = i * 4;
      pixels[idx] = normalized;
      pixels[idx + 1] = normalized;
      pixels[idx + 2] = normalized;
      pixels[idx + 3] = 255;
    }
    
    const texture = new THREE.DataTexture(pixels, resolution, resolution, THREE.RGBAFormat);
    texture.needsUpdate = true;
    return texture;
  }, []);
  
  const heightMapTexture = useMemo(() => {
    if (!heightMap) return new THREE.DataTexture(new Uint8Array(4), 1, 1, THREE.RGBAFormat);
    return createDataTexture(heightMap);
  }, [heightMap, createDataTexture]);
  
  const prevHeightMapTexture = useMemo(() => {
    if (!prevHeightMap) return new THREE.DataTexture(new Uint8Array(4), 1, 1, THREE.RGBAFormat);
    return createDataTexture(prevHeightMap);
  }, [prevHeightMap, createDataTexture]);
  
  const colors = useMemo(() => getColorGradient(params.textureTone), [params.textureTone]);
  const prevColors = useMemo(() => getColorGradient(prevParamsRef.current.textureTone), [regenerateTrigger]);
  
  const uniforms = useMemo(() => ({
    uHeightMap: { value: heightMapTexture },
    uPrevHeightMap: { value: prevHeightMapTexture },
    uSize: { value: size },
    uLowColor: { value: new THREE.Color(...colors.low) },
    uHighColor: { value: new THREE.Color(...colors.high) },
    uPrevLowColor: { value: new THREE.Color(...prevColors.low) },
    uPrevHighColor: { value: new THREE.Color(...prevColors.high) },
    uTransitionProgress: { value: 0 },
    uColorTransitionProgress: { value: 0 },
    uMaxHeight: { value: 2.3 },
    uMinHeight: { value: 0.3 },
    uOpacity: { value: 1 }
  }), [heightMapTexture, prevHeightMapTexture, size, colors, prevColors]);
  
  useEffect(() => {
    const initialHeightMap = generateHeightMap(params);
    setHeightMap(initialHeightMap);
    setPrevHeightMap(initialHeightMap);
    onStatsUpdate(generateTerrainStats(initialHeightMap));
  }, []);
  
  useEffect(() => {
    if (regenerateTrigger > 0) {
      setIsFading(true);
      setOpacity(0);
      
      const fadeTimeout = setTimeout(() => {
        const newHeightMap = generateHeightMap(params);
        setPrevHeightMap(heightMap);
        setHeightMap(newHeightMap);
        transitionProgressRef.current = 0;
        prevParamsRef.current = targetParamsRef.current;
        targetParamsRef.current = params;
        onStatsUpdate(generateTerrainStats(newHeightMap));
        
        setTimeout(() => {
          setOpacity(1);
          setIsFading(false);
        }, 50);
      }, 250);
      
      return () => clearTimeout(fadeTimeout);
    }
  }, [regenerateTrigger]);
  
  useEffect(() => {
    if (regenerateTrigger > 0 || !heightMap) return;
    
    const newHeightMap = generateHeightMap(params);
    setPrevHeightMap(heightMap);
    setHeightMap(newHeightMap);
    transitionProgressRef.current = 0;
    colorTransitionProgressRef.current = 0;
    prevParamsRef.current = targetParamsRef.current;
    targetParamsRef.current = params;
    onStatsUpdate(generateTerrainStats(newHeightMap));
  }, [params.heightAmplitude, params.smoothness, params.seed]);
  
  useEffect(() => {
    if (regenerateTrigger > 0) return;
    colorTransitionProgressRef.current = 0;
    prevParamsRef.current = { ...prevParamsRef.current, textureTone: targetParamsRef.current.textureTone };
    targetParamsRef.current = { ...targetParamsRef.current, textureTone: params.textureTone };
  }, [params.textureTone]);
  
  useFrame((_, delta) => {
    if (materialRef.current) {
      if (transitionProgressRef.current < 1) {
        transitionProgressRef.current = Math.min(1, transitionProgressRef.current + delta / 0.3);
        materialRef.current.uniforms.uTransitionProgress.value = transitionProgressRef.current;
      }
      
      if (colorTransitionProgressRef.current < 1) {
        colorTransitionProgressRef.current = Math.min(1, colorTransitionProgressRef.current + delta / 0.3);
        materialRef.current.uniforms.uColorTransitionProgress.value = colorTransitionProgressRef.current;
      }
      
      if (isFading) {
        const currentOpacity = materialRef.current.uniforms.uOpacity.value;
        materialRef.current.uniforms.uOpacity.value = THREE.MathUtils.lerp(currentOpacity, opacity, delta * 8);
      } else {
        materialRef.current.uniforms.uOpacity.value = THREE.MathUtils.lerp(materialRef.current.uniforms.uOpacity.value, 1, delta * 8);
      }
      
      materialRef.current.uniforms.uLowColor.value.setRGB(...colors.low);
      materialRef.current.uniforms.uHighColor.value.setRGB(...colors.high);
    }
  });
  
  return (
    <mesh ref={meshRef} geometry={geometry} receiveShadow castShadow>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

interface CameraControllerProps {
  viewMode: ViewMode;
}

const CameraController: React.FC<CameraControllerProps> = ({ viewMode }) => {
  const { camera } = useThree();
  const initialRotationRef = useRef(0);
  const autoRotateCompleteRef = useRef(false);
  const orbitControlsRef = useRef<any>(null);
  
  useEffect(() => {
    if (viewMode === ViewMode.OVERVIEW) {
      const distance = 60;
      const angle = Math.PI / 4;
      camera.position.set(
        Math.cos(angle) * distance,
        Math.sin(angle) * distance,
        Math.sin(angle) * distance
      );
      camera.lookAt(0, 0.5, 0);
      autoRotateCompleteRef.current = false;
      initialRotationRef.current = 0;
    } else {
      camera.position.set(0, 3, 20);
      camera.lookAt(0, 1, 0);
    }
  }, [viewMode, camera]);
  
  useFrame((_, delta) => {
    if (viewMode === ViewMode.OVERVIEW && !autoRotateCompleteRef.current) {
      initialRotationRef.current += delta;
      
      const duration = 5;
      const progress = Math.min(1, initialRotationRef.current / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const angle = eased * Math.PI * 2;
      
      const distance = 60;
      const elevation = Math.PI / 4;
      camera.position.x = Math.cos(angle) * Math.cos(elevation) * distance;
      camera.position.y = Math.sin(elevation) * distance;
      camera.position.z = Math.sin(angle) * Math.cos(elevation) * distance;
      camera.lookAt(0, 0.5, 0);
      
      if (progress >= 1) {
        autoRotateCompleteRef.current = true;
        if (orbitControlsRef.current) {
          orbitControlsRef.current.target.set(0, 0.5, 0);
          orbitControlsRef.current.update();
        }
      }
    }
  });
  
  return (
    <>
      {viewMode === ViewMode.OVERVIEW ? (
        <OrbitControls
          ref={orbitControlsRef}
          enablePan={false}
          minDistance={30}
          maxDistance={120}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 6}
          enabled={autoRotateCompleteRef.current}
        />
      ) : (
        <FirstPersonControls
          movementSpeed={2}
          lookSpeed={0.002}
          lookVertical={true}
          autoForward={false}
          activeLook={true}
          heightCoef={0.5}
        />
      )}
    </>
  );
};

interface SceneContentProps {
  params: TerrainParams;
  viewMode: ViewMode;
  regenerateTrigger: number;
  onStatsUpdate: (stats: TerrainStats) => void;
}

const SceneContent: React.FC<SceneContentProps> = ({ params, viewMode, regenerateTrigger, onStatsUpdate }) => {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[-30, 40, -30]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      
      <TerrainMesh
        params={params}
        regenerateTrigger={regenerateTrigger}
        onStatsUpdate={onStatsUpdate}
      />
      
      <CameraController viewMode={viewMode} />
    </>
  );
};

const TerrainScene: React.FC<TerrainSceneProps> = ({ params, viewMode, regenerateTrigger, onStatsUpdate }) => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
      <Canvas
        camera={{ fov: 60, near: 0.1, far: 1000, position: [50, 50, 50] }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
        shadows
      >
        <color attach="background" args={['#0F172A']} />
        <fog attach="fog" args={['#0F172A', 80, 150]} />
        
        <SceneContent
          params={params}
          viewMode={viewMode}
          regenerateTrigger={regenerateTrigger}
          onStatsUpdate={onStatsUpdate}
        />
      </Canvas>
    </div>
  );
};

export default TerrainScene;
