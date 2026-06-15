import React from 'react';

const ValleyScene: React.FC = () => {
  return (
    <group>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#5a8a4a" />
      </mesh>
    </group>
  );
};

export default ValleyScene;
