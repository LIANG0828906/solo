import React, { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import StarChart from '../scenes/StarChart';
import InfoPanel from '../components/InfoPanel';
import RadarMap from '../components/RadarMap';
import NavBar from '../components/NavBar';
import ControlsHint from '../components/ControlsHint';
import { useStarData } from '../hooks/useStarData';
import type { Star } from '../types';

interface StarChartPageProps {
  stars?: Star[];
  cameraPos?: [number, number, number];
  allStars?: Star[];
}

const StarChartPage: React.FC<StarChartPageProps> = ({
  stars: propStars,
  cameraPos: propCameraPos,
  allStars: propAllStars,
}) => {
  const { stars: hookStars, loading } = useStarData();
  const displayStars = propStars ?? hookStars;
  const allStars = propAllStars ?? displayStars;

  const cameraStart: [number, number, number] = propCameraPos ?? [0, 30, 80];

  return (
    <>
      <NavBar />

      <div className="canvas-container">
        <Canvas
          camera={{
            position: cameraStart,
            fov: 60,
            near: 0.1,
            far: 5000,
          }}
          gl={{ antialias: true, alpha: false }}
          style={{ background: 'transparent' }}
          frameloop="always"
          dpr={[1, 2]}
        >
          <color attach="background" args={['#0a0e27']} />
          <fog attach="fog" args={['#0a0e27', 150, 600]} />
          <ambientLight intensity={0.15} />
          <StarChart propStars={displayStars} propAllStars={allStars} />
        </Canvas>
      </div>

      <InfoPanel />
      <RadarMap allStars={allStars} />
      <ControlsHint />
    </>
  );
};

export default StarChartPage;
