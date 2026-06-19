import React from 'react'

const Lighting: React.FC = () => {
  return (
    <>
      <ambientLight intensity={0.4} color="#ffffff" />
      <directionalLight
        position={[5, 5, 5]}
        intensity={0.8}
        color="#FFF5E1"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight
        position={[-3, 2, -4]}
        intensity={0.2}
        color="#8B7355"
      />
      <pointLight
        position={[0, 3, 0]}
        intensity={0.3}
        color="#D4AF37"
        distance={10}
      />
    </>
  )
}

export default Lighting
