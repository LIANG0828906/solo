export function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60, 32, 32]} />
        <meshStandardMaterial
          color="#4A7C59"
          roughness={1}
          metalness={0}
          flatShading
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <ringGeometry args={[7, 8, 64]} />
        <meshStandardMaterial
          color="#6B8E6B"
          transparent
          opacity={0.8}
          roughness={1}
          flatShading
        />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, Math.PI / 4]}
        position={[0, 0.002, 0]}
        receiveShadow
      >
        <planeGeometry args={[3, 40]} />
        <meshStandardMaterial
          color="#808080"
          roughness={0.95}
          metalness={0.05}
          flatShading
        />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.002, 0]}
        receiveShadow
      >
        <planeGeometry args={[40, 3]} />
        <meshStandardMaterial
          color="#808080"
          roughness={0.95}
          metalness={0.05}
          flatShading
        />
      </mesh>
    </group>
  );
}
