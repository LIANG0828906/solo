export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.5} color="#FFFFFF" />

      <spotLight
        position={[0, 20, 8]}
        angle={Math.PI / 4}
        penumbra={0.6}
        intensity={2.5}
        color="#FFF5E0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />

      <pointLight
        position={[-12, 8, 10]}
        intensity={0.6}
        color="#E0E8FF"
      />

      <pointLight
        position={[12, 6, -8]}
        intensity={0.4}
        color="#FFE8D0"
      />

      <directionalLight
        position={[0, 15, -12]}
        intensity={0.6}
        color="#FFFFFF"
      />

      <hemisphereLight
        color="#FFF5E0"
        groundColor="#2A2018"
        intensity={0.4}
      />
    </>
  );
}
