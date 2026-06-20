import { useRef, useEffect, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useAppStore, type StyleType } from '@/store/useAppStore';
import { processStyle, addBarycentricCoordinates } from '@/utils/styleProcessor';
import ParticleEffect from './ParticleEffect';
import LoadingSpinner from './LoadingSpinner';

export default function ModelViewer() {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const modelGeometryRef = useRef<THREE.BufferGeometry | null>(null);
  const transitionProgressRef = useRef(1);
  const timeRef = useRef(0);
  const autoRotateRef = useRef(true);

  const currentStyle = useAppStore((s) => s.currentStyle);
  const detailIntensity = useAppStore((s) => s.detailIntensity);
  const isLoading = useAppStore((s) => s.isLoading);
  const modelLoaded = useAppStore((s) => s.modelLoaded);
  const isTransitioning = useAppStore((s) => s.isTransitioning);
  const setLoading = useAppStore((s) => s.setLoading);
  const setModelLoaded = useAppStore((s) => s.setModelLoaded);
  const setTransitioning = useAppStore((s) => s.setTransitioning);
  const uploadedFile = useAppStore((s) => s.uploadedFile);
  const setUploadedFile = useAppStore((s) => s.setUploadedFile);

  const { gl } = useThree();

  const loadModel = useCallback(async (file: File) => {
    setLoading(true);
    setModelLoaded(false);

    const ext = file.name.split('.').pop()?.toLowerCase();
    const url = URL.createObjectURL(file);

    try {
      let loadedObject: THREE.Object3D;

      if (ext === 'obj') {
        const loader = new OBJLoader();
        loadedObject = await new Promise<THREE.Object3D>((resolve, reject) => {
          loader.load(url, resolve, undefined, reject);
        });
      } else if (ext === 'gltf' || ext === 'glb') {
        const loader = new GLTFLoader();
        const gltf = await new Promise<{ scene: THREE.Object3D }>((resolve, reject) => {
          loader.load(url, resolve, undefined, reject);
        });
        loadedObject = gltf.scene;
      } else {
        setLoading(false);
        return;
      }

      const geometry = extractGeometry(loadedObject);
      if (geometry) {
        geometry.computeVertexNormals();
        addBarycentricCoordinates(geometry);
        modelGeometryRef.current = geometry;

        if (meshRef.current) {
          meshRef.current.geometry = geometry;
        }
      }

      setModelLoaded(true);
    } catch (err) {
      console.error('Failed to load model:', err);
    } finally {
      setLoading(false);
      URL.revokeObjectURL(url);
    }
  }, [setLoading, setModelLoaded]);

  useEffect(() => {
    if (uploadedFile) {
      loadModel(uploadedFile);
      setUploadedFile(null);
    }
  }, [uploadedFile, loadModel, setUploadedFile]);

  const styleConfig = useMemo(() => {
    return processStyle(currentStyle, detailIntensity, transitionProgressRef.current);
  }, [currentStyle, detailIntensity]);

  useEffect(() => {
    if (isTransitioning) {
      transitionProgressRef.current = 0;
    }
  }, [isTransitioning]);

  useFrame((state, delta) => {
    timeRef.current += delta;

    if (isTransitioning && transitionProgressRef.current < 1) {
      transitionProgressRef.current = Math.min(1, transitionProgressRef.current + delta);
      if (transitionProgressRef.current >= 1) {
        setTransitioning(false);
      }
    }

    if (materialRef.current) {
      materialRef.current.uniforms.uDetailIntensity.value = detailIntensity;
      materialRef.current.uniforms.uTransitionProgress.value = transitionProgressRef.current;
      materialRef.current.uniforms.uTime.value = timeRef.current;
    }

    if (groupRef.current && modelLoaded && autoRotateRef.current) {
      groupRef.current.rotation.y += delta * (15 * Math.PI / 180);
    }
  });

  const handleExport = useCallback(() => {
    const canvas = gl.domElement;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `style-viewer-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      // silently handle
    }
  }, [gl]);

  useEffect(() => {
    const store = useAppStore.getState();
    store.setExportHandler(handleExport);
  }, [handleExport]);

  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: styleConfig.vertexShader,
      fragmentShader: styleConfig.fragmentShader,
      uniforms: { ...styleConfig.uniforms },
      transparent: currentStyle === 'watercolor',
      side: THREE.DoubleSide,
    });
    materialRef.current = mat;
    return mat;
  }, [styleConfig, currentStyle]);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.vertexShader = styleConfig.vertexShader;
      materialRef.current.fragmentShader = styleConfig.fragmentShader;
      materialRef.current.uniforms = { ...styleConfig.uniforms };
      materialRef.current.transparent = currentStyle === 'watercolor';
      materialRef.current.needsUpdate = true;
    }
  }, [styleConfig, currentStyle]);

  const defaultGeometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1.2, 2);
    addBarycentricCoordinates(geo);
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <>
      <ambientLight intensity={0.4} color="#4466aa" />
      <directionalLight
        position={[5, 5, 3]}
        intensity={0.8}
        color="#aaccff"
      />
      <pointLight position={[-3, 2, -2]} intensity={0.3} color={getStyleLightColor(currentStyle)} />

      <group ref={groupRef}>
        {!modelLoaded && !isLoading && (
          <mesh>
            <bufferGeometry attach="geometry" {...defaultGeometry} />
            <shaderMaterial attach="material" {...material} />
          </mesh>
        )}

        {modelLoaded && modelGeometryRef.current && (
          <mesh ref={meshRef} geometry={modelGeometryRef.current} material={material} />
        )}
      </group>

      {isLoading && <LoadingSpinner />}

      <ParticleEffect
        active={isTransitioning}
        geometry={modelGeometryRef.current || defaultGeometry}
        onComplete={() => {}}
      />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        onPointerDown={() => { autoRotateRef.current = false; }}
        onPointerUp={() => {
          setTimeout(() => { autoRotateRef.current = true; }, 3000);
        }}
      />
    </>
  );
}

function extractGeometry(object: THREE.Object3D): THREE.BufferGeometry | null {
  let geometry: THREE.BufferGeometry | null = null;

  object.traverse((child) => {
    if ((child as THREE.Mesh).isMesh && !geometry) {
      const mesh = child as THREE.Mesh;
      geometry = (mesh.geometry as THREE.BufferGeometry).clone();
    }
  });

  if (!geometry) {
    const mesh = object as unknown as THREE.Mesh;
    if (mesh.geometry) {
      geometry = (mesh.geometry as THREE.BufferGeometry).clone();
    }
  }

  return geometry;
}

function getStyleLightColor(style: StyleType): number {
  const colors: Record<StyleType, number> = {
    lowpoly: 0xff8f00,
    toon: 0x7c4dff,
    wireframe: 0xffffff,
    watercolor: 0x00bcd4,
  };
  return colors[style];
}
