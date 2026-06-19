import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Sculpture from './Sculpture';
import Particles from './Particles';
import Environment from './Environment';

const SculptureScene: React.FC = () => {
  const [sculptureColor, setSculptureColor] = useState('#888888');

  return (
    <div className="three-canvas-container">
      <Canvas
        shadows
        camera={{ position: [0, 2, 8], fov: 50, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <OrbitControls
          enablePan={false}
          minDistance={2}
          maxDistance={10}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI * (5 / 6)}
          enableDamping
          dampingFactor={0.05}
        />
        <Environment />
        <Sculpture onColorUpdate={setSculptureColor} />
        <Particles sculptureColor={sculptureColor} />
      </Canvas>
    </div>
  );
};

export default SculptureScene;
