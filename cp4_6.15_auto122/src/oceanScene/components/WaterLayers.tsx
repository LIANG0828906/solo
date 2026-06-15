function WaterLayer({ y, opacity, color }: { y: number; opacity: number; color: string }) {
  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[80, 80]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        side={2}
        depthWrite={false}
      />
    </mesh>
  );
}

const layers = [
  { y: -5, opacity: 0.04, color: '#004466' },
  { y: -30, opacity: 0.06, color: '#003355' },
  { y: -80, opacity: 0.08, color: '#002244' },
  { y: -150, opacity: 0.1, color: '#001133' },
  { y: -300, opacity: 0.12, color: '#000a22' },
];

export default function WaterLayers() {
  return (
    <>
      {layers.map((layer, i) => (
        <WaterLayer key={`wl-${i}`} y={layer.y} opacity={layer.opacity} color={layer.color} />
      ))}
    </>
  );
}
