import { useTransition } from '@react-three/drei';
import { useAppStore } from '@/store/useAppStore';

export function LightingSystem() {
  const mode = useAppStore((s) => s.mode);
  const lightIntensity = useAppStore((s) => s.lightIntensity);
  const isDay = mode === 'day';

  const { opacity } = useTransition(isDay, {
    from: 0,
    enter: 1,
    leave: 0,
    config: { mass: 1, tension: 280, friction: 60 },
  });

  const dayOpacity = opacity;
  const nightOpacity = 1 - opacity;

  return (
    <>
      <ambientLight intensity={0.35 * lightIntensity} />
      <hemisphereLight
        args={['#c8d8e4', '#b8a890', 0.3 * lightIntensity]}
      />

      <directionalLight
        position={[8, 6, 4]}
        intensity={1.2 * lightIntensity * dayOpacity}
        color="#fff5e6"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0005}
        shadow-radius={6}
      />

      <pointLight
        position={[0, 2.7, 0]}
        color="#ffd89b"
        intensity={2.5 * lightIntensity * nightOpacity}
        distance={12}
        decay={1.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-radius={0.5}
      />
      <pointLight
        position={[-4, 0.8, -3]}
        color="#ffb347"
        intensity={1.5 * lightIntensity * nightOpacity}
        distance={6}
        decay={1.8}
      />
      <pointLight
        position={[4, 0.8, 3]}
        color="#ffb347"
        intensity={1.2 * lightIntensity * nightOpacity}
        distance={6}
        decay={1.8}
      />
    </>
  );
}
