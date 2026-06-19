import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { ParticleSystem } from './ParticleSystem';
import { GeomagneticField } from './GeomagneticField';
import { useAuroraStore } from './store';

export function AuroraScene() {
  const particleSystemRef = useRef<ParticleSystem | null>(null);
  const geomagneticFieldRef = useRef<GeomagneticField | null>(null);
  const timeRef = useRef(0);
  const fpsCounterRef = useRef({ frames: 0, acc: 0, lastUpdate: 0 });
  const { scene } = useThree();

  const stormIntensity = useAuroraStore((s) => s.stormIntensity);
  const speedMultiplier = useAuroraStore((s) => s.speedMultiplier);
  const pulseAmplitude = useAuroraStore((s) => s.pulseAmplitude);
  const updateTimers = useAuroraStore((s) => s.updateTimers);
  const setFps = useAuroraStore((s) => s.setFps);

  useEffect(() => {
    const particleSystem = new ParticleSystem();
    const geomagneticField = new GeomagneticField();

    scene.add(particleSystem.points);
    scene.add(geomagneticField.lines);

    particleSystemRef.current = particleSystem;
    geomagneticFieldRef.current = geomagneticField;

    return () => {
      scene.remove(particleSystem.points);
      scene.remove(geomagneticField.lines);
      particleSystem.dispose();
      geomagneticField.dispose();
    };
  }, [scene]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    timeRef.current += dt;

    updateTimers(dt);

    if (particleSystemRef.current) {
      particleSystemRef.current.update({
        stormIntensity,
        speedMultiplier,
        pulseAmplitude,
        time: timeRef.current,
        delta: dt,
      });
    }

    if (geomagneticFieldRef.current) {
      geomagneticFieldRef.current.update(stormIntensity, timeRef.current);
    }

    const fps = fpsCounterRef.current;
    fps.frames++;
    fps.acc += dt;
    if (timeRef.current - fps.lastUpdate >= 0.5) {
      const currentFps = Math.round(fps.frames / fps.acc);
      setFps(currentFps);
      fps.frames = 0;
      fps.acc = 0;
      fps.lastUpdate = timeRef.current;
    }
  });

  return (
    <>
      <color attach="background" args={['#0a0e1a']} />
      <fog attach="fog" args={['#0a0e1a', 150, 350]} />

      <ambientLight intensity={0.15} color="#88aaff" />
      <pointLight position={[0, 0, 0]} intensity={0.8} color="#00FF88" distance={120} />
      <pointLight position={[-60, 10, 30]} intensity={0.4} color="#AA88FF" distance={150} />
      <pointLight position={[60, 10, -30]} intensity={0.4} color="#88DDFF" distance={150} />

      <primitive object={new THREE.Group()} />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        panSpeed={0.8}
        zoomSpeed={0.8}
        minDistance={50}
        maxDistance={200}
        target={[0, 0, 0]}
      />
    </>
  );
}
