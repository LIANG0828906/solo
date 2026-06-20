import { useOceanStore } from './store';
import OceanWater from './oceanScene/components/OceanWater';
import SeaFloor from './oceanScene/components/SeaFloor';
import SpeciesPoints from './oceanScene/components/SpeciesPoints';
import CameraAnimator from './oceanScene/components/CameraAnimator';
import WaterLayers from './oceanScene/components/WaterLayers';
import DynamicLights from './oceanScene/components/DynamicLights';
import AmbientParticles from './oceanScene/components/AmbientParticles';

export default function OceanScene() {
  const lightPenetration = useOceanStore((s) => s.envParams.lightPenetration);
  const temperature = useOceanStore((s) => s.envParams.temperature);

  const directionalIntensity = 0.4 + (lightPenetration / 200) * 1.1;
  const ambientColor =
    temperature >= 24 ? '#406a88' : temperature >= 16 ? '#487a96' : '#4488aa';
  const sunColor =
    temperature >= 24 ? '#bbd6ff' : temperature >= 16 ? '#aaccff' : '#99c4ff';
  const fogDensity = 0.0045 + Math.max(0, 0.0085 - (lightPenetration / 200) * 0.006);

  const colorTop =
    temperature >= 24 ? '#1a3b58' : temperature >= 16 ? '#123050' : '#0a2848';
  const colorBottom =
    temperature >= 24 ? '#0a1a30' : temperature >= 16 ? '#05102a' : '#020818';

  return (
    <>
      <color attach="background" args={[colorTop]} />
      <fogExp2 attach="fog" args={[colorBottom, fogDensity]} />

      <AmbientParticles count={120} />

      <ambientLight intensity={0.18} color={ambientColor} />
      <hemisphereLight args={[sunColor, '#001830', 0.42]} />
      <DynamicLights
        directionalIntensity={directionalIntensity}
        sunColor={sunColor}
        lightPenetration={lightPenetration}
      />

      <CameraAnimator />
      <OceanWater />
      <WaterLayers />

      <SeaFloor />

      <SpeciesPoints />
    </>
  );
}
