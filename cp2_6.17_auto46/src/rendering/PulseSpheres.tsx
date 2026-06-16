import { useFireflyStore } from '../store/fireflyStore'

const PULSE_COLOR = '#00FFAA'

export default function PulseSpheres() {
  const pulses = useFireflyStore((s) => s.pulses)

  return (
    <>
      {pulses.map((p) => (
        <mesh key={p.id} position={p.center.toArray()}>
          <sphereGeometry args={[p.radius, 24, 16]} />
          <meshBasicMaterial
            color={PULSE_COLOR}
            transparent
            opacity={p.opacity}
            depthWrite={false}
            side={2}
          />
        </mesh>
      ))}
    </>
  )
}
