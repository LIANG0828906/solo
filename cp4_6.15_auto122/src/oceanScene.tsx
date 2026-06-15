import { useOceanStore } from './store';
import OceanWater from './oceanScene/components/OceanWater';
import SeaFloor from './oceanScene/components/SeaFloor';
import SpeciesPoints from './oceanScene/components/SpeciesPoints';
import CameraAnimator from './oceanScene/components/CameraAnimator';
import WaterLayers from './oceanScene/components/WaterLayers';

export default function OceanScene() {
  const lightPenetration = useOceanStore((s) => s.envParams.lightPenetration);
  const directionalIntensity = 0.5 + (lightPenetration / 200) * 1.0;

  return (
    <>
      <fog attach="fog" args={['#000a1a', 20, 120]} />
      <ambientLight intensity={0.15} color="#4488aa" />
      <directionalLight
        position={[10, 30, 10]}
        intensity={directionalIntensity}
        color="#88ccff"
      />
      <pointLight position={[0, 5, 0]} intensity={0.3} color="#00e5ff" distance={50} />
      <CameraAnimator />
      <OceanWater />
      <WaterLayers />
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <SeaFloor />
      </group>
      <SpeciesPoints />
    </>
  );
}
