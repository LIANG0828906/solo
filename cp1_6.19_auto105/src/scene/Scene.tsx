import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { Vase } from '@/components/Vase';
import { Platform } from '@/components/Platform';
import { Lighting } from '@/components/Lighting';
import { SceneBackground } from '@/components/SceneBackground';
import { CameraController } from '@/components/CameraController';

export function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 3, 25], fov: 40, near: 0.1, far: 1000 }}
      gl={{
        antialias: true,
        alpha: false,
        pixelRatio: Math.min(window.devicePixelRatio, 2),
        preserveDrawingBuffer: true,
        localClippingEnabled: true,
      }}
      dpr={[1, 2]}
      shadows
    >
      <Suspense fallback={null}>
        <SceneBackground />
        <Lighting />
        <Vase />
        <Platform />
        <CameraController />
      </Suspense>
    </Canvas>
  );
}
