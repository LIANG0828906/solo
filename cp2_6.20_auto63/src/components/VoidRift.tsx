import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const VoidRift: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const swirlRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const particleData = useMemo(() => {
    const count = 150;
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 1 + Math.random() * 1.5;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
      positions[i * 3 + 2] = Math.sin(angle) * r;
      speeds[i] = 0.5 + Math.random() * 1.5;
    }
    return { positions, speeds, count };
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (groupRef.current) {
      const targetY = 1.5;
      groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.05;
      groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.05);
    }

    if (swirlRef.current) {
      swirlRef.current.rotation.z = t * 1.5;
      const mat = swirlRef.current.material as THREE.ShaderMaterial;
      if (mat.uniforms) {
        mat.uniforms.time.value = t;
      }
    }

    if (innerRef.current) {
      innerRef.current.rotation.z = -t * 2;
      const s = 1 + Math.sin(t * 3) * 0.1;
      innerRef.current.scale.setScalar(s);
    }

    if (particlesRef.current) {
      const pos = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < particleData.count; i++) {
        const idx = i * 3;
        const x = arr[idx];
        const z = arr[idx + 2];
        const angle = Math.atan2(z, x) + particleData.speeds[i] * 0.03;
        const r = Math.sqrt(x * x + z * z) * 0.985;
        if (r < 0.2) {
          const a = Math.random() * Math.PI * 2;
          const rr = 1.8 + Math.random() * 0.8;
          arr[idx] = Math.cos(a) * rr;
          arr[idx + 2] = Math.sin(a) * rr;
        } else {
          arr[idx] = Math.cos(angle) * r;
          arr[idx + 2] = Math.sin(angle) * r;
        }
      }
      pos.needsUpdate = true;
      particlesRef.current.rotation.y = t * 0.5;
    }
  });

  const swirlUniforms = useMemo(() => ({
    time: { value: 0 },
    color1: { value: new THREE.Color('#1a0a2e') },
    color2: { value: new THREE.Color('#8844ff') },
  }), []);

  return (
    <group ref={groupRef} position={[0, -5, 1.5]} scale={0.01}>
      <mesh ref={swirlRef}>
        <planeGeometry args={[5, 5, 64, 64]} />
        <shaderMaterial
          uniforms={swirlUniforms}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform float time;
            uniform vec3 color1;
            uniform vec3 color2;
            varying vec2 vUv;
            void main() {
              vec2 c = vUv - 0.5;
              float r = length(c);
              float a = atan(c.y, c.x) + time * 0.5;
              float swirl = sin(r * 20.0 - time * 3.0 + a * 3.0) * 0.5 + 0.5;
              float mask = 1.0 - smoothstep(0.0, 0.5, r);
              vec3 col = mix(color1, color2, swirl * mask);
              float alpha = mask * (0.8 + sin(time * 2.0) * 0.2);
              gl_FragColor = vec4(col, alpha);
            }
          `}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={innerRef}>
        <circleGeometry args={[0.5, 32]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.95}
          side={THREE.DoubleSide}
        />
      </mesh>

      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particleData.positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          color="#a855f7"
          transparent
          opacity={0.9}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <pointLight color="#8844ff" intensity={2} distance={12} decay={2} />
    </group>
  );
};

export default VoidRift;
