import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '../store/sceneStore';
import { generateGlowTexture } from '../utils/textureGenerator';

export function LightingSystem() {
  const lighting = useSceneStore((state) => state.lighting);
  const updatePointLight = useSceneStore((state) => state.updatePointLight);
  const glowTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const [draggingLight, setDraggingLight] = useState<string | null>(null);
  const dragStartPos = useRef<{ x: number; y: number; z: number } | null>(null);
  const dragStartMouse = useRef<{ x: number; y: number } | null>(null);

  if (!glowTextureRef.current) {
    glowTextureRef.current = generateGlowTexture();
  }

  useFrame((state) => {
    // 可选：添加灯光光晕脉动效果
  });

  const handleLightPointerDown = (e: any, lightId: string) => {
    e.stopPropagation();
    setDraggingLight(lightId);
    const light = lighting.pointLights.find((l) => l.id === lightId);
    if (light) {
      dragStartPos.current = { ...light.position };
      dragStartMouse.current = { x: e.point.x, y: e.point.y };
    }
    e.target.setPointerCapture?.(e.pointerId);
  };

  const handleLightPointerMove = (e: any) => {
    if (!draggingLight || !dragStartPos.current || !dragStartMouse.current) return;

    const newPos = {
      x: Math.max(-10, Math.min(10, dragStartPos.current.x + (e.point.x - dragStartMouse.current.x))),
      y: Math.max(0.5, Math.min(10, dragStartPos.current.y + (e.point.y - dragStartMouse.current.y))),
      z: dragStartPos.current.z,
    };

    updatePointLight(draggingLight, { position: newPos });
  };

  const handleLightPointerUp = (e: any) => {
    setDraggingLight(null);
    dragStartPos.current = null;
    dragStartMouse.current = null;
    e.target.releasePointerCapture?.(e.pointerId);
  };

  return (
    <>
      <ambientLight
        color={lighting.ambientColor}
        intensity={lighting.ambientIntensity}
      />

      {lighting.pointLights.map((light) => (
        <group key={light.id}>
          <pointLight
            position={[light.position.x, light.position.y, light.position.z]}
            color={light.color}
            intensity={light.intensity}
            distance={20}
            decay={2}
          />

          <sprite
            position={[light.position.x, light.position.y, light.position.z]}
            scale={[0.4, 0.4, 0.4]}
            onPointerDown={(e) => handleLightPointerDown(e, light.id)}
            onPointerMove={handleLightPointerMove}
            onPointerUp={handleLightPointerUp}
            onPointerOut={handleLightPointerUp}
          >
            <spriteMaterial
              map={glowTextureRef.current}
              color={light.color}
              transparent
              opacity={0.3}
              depthWrite={false}
            />
          </sprite>

          <mesh
            position={[light.position.x, light.position.y, light.position.z]}
            onPointerDown={(e) => handleLightPointerDown(e, light.id)}
            onPointerMove={handleLightPointerMove}
            onPointerUp={handleLightPointerUp}
            onPointerOut={handleLightPointerUp}
          >
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial
              color={light.color}
              emissive={light.color}
              emissiveIntensity={1}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}
