import { Text } from '@react-three/drei';

export default function GroundGrid() {
  const labels: { position: [number, number, number]; text: string }[] = [];

  for (let i = -20; i <= 20; i += 5) {
    if (i !== 0) {
      labels.push({ position: [i, 0.1, 0.5], text: `${i}` });
      labels.push({ position: [0.5, 0.1, i], text: `${i}` });
    }
  }

  return (
    <group>
      <gridHelper args={[40, 40, '#2d2d44', '#2d2d44']} position={[0, -0.01, 0]} />
      {labels.map((label, idx) => (
        <Text
          key={idx}
          position={label.position}
          fontSize={0.8}
          color="#555577"
          anchorX="center"
          anchorY="middle"
        >
          {label.text}
        </Text>
      ))}
    </group>
  );
}
