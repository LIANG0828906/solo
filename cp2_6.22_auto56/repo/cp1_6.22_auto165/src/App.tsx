import React, { useState, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import PointCloudRenderer from './PointCloudRenderer';
import ControlPanel from './ControlPanel';
import { generateSampleData, samplePoints, Point3D } from './PointCloudData';

const App: React.FC = () => {
  const [rawPoints, setRawPoints] = useState<Point3D[]>(() => generateSampleData(10000));
  const [samplePercent, setSamplePercent] = useState<number>(50);
  const [displayCount, setDisplayCount] = useState<number>(0);
  const [fadeKey, setFadeKey] = useState<number>(0);

  const sampledPoints = useMemo(() => {
    const result = samplePoints(rawPoints, samplePercent);
    setDisplayCount(result.length);
    setFadeKey((k) => k + 1);
    return result;
  }, [rawPoints, samplePercent]);

  const handleSampleChange = useCallback((percent: number) => {
    setSamplePercent(percent);
  }, []);

  const handleLoadPoints = useCallback((points: Point3D[]) => {
    setRawPoints(points);
    setSamplePercent(50);
  }, []);

  return (
    <div className="app-container">
      <Canvas
        camera={{ position: [4, 4, 4], fov: 50, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#0F172A']} />
        <PointCloudRenderer points={sampledPoints} />
        <OrbitControls
          enableDamping
          dampingFactor={0.1}
          minDistance={0.5}
          maxDistance={20}
          rotateSpeed={1}
          zoomSpeed={1.2}
        />
      </Canvas>

      <ControlPanel
        samplePercent={samplePercent}
        pointCount={displayCount}
        totalPoints={rawPoints.length}
        onSampleChange={handleSampleChange}
        onLoadPoints={handleLoadPoints}
      />

      <div className="point-label" key={fadeKey}>
        {displayCount.toLocaleString()} 点
      </div>
    </div>
  );
};

export default App;
