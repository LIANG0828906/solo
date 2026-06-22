import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, type MatrixRune } from '@/store/useGameStore';
import { MatrixPuzzle } from '@/game/MatrixPuzzle';

interface EnergyMatrixProps {
  runes: MatrixRune[];
  matrixPuzzle: MatrixPuzzle;
}

const EnergyMatrix: React.FC<EnergyMatrixProps> = ({ runes, matrixPuzzle }) => {
  const groupRef = useRef<THREE.Group>(null);
  const handleClick = useGameStore((s) => s.phase === 'matrix');

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = Math.sin(t * 0.2) * 0.1;
    groupRef.current.position.y = 1.5 + Math.sin(t * 0.5) * 0.05;
  });

  const getRunePosition = (index: number): [number, number, number] => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    return [(col - 1) * 1.1, (1 - row) * 1.1, 0];
  };

  return (
    <group ref={groupRef} position={[0, 1.5, 1.5]}>
      <mesh>
        <planeGeometry args={[3.8, 3.8, 1, 1]} />
        <meshStandardMaterial
          color="#1a0a2e"
          emissive="#4a2a7a"
          emissiveIntensity={0.3}
          transparent
          opacity={0.7}
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>

      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[3.5, 3.5, 1, 1]} />
        <meshBasicMaterial
          color="#2a1a4a"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {runes.map((rune, i) => (
        <RuneCell
          key={rune.id}
          rune={rune}
          position={getRunePosition(i)}
          matrixPuzzle={matrixPuzzle}
          clickable={handleClick}
        />
      ))}

      <pointLight color="#d4af37" intensity={1.5} distance={8} decay={2} position={[0, 0, 2]} />
    </group>
  );
};

interface RuneCellProps {
  rune: MatrixRune;
  position: [number, number, number];
  matrixPuzzle: MatrixPuzzle;
  clickable: boolean;
}

const RuneCell: React.FC<RuneCellProps> = ({ rune, position, matrixPuzzle, clickable }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const textRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime + rune.pulsePhase;
    if (meshRef.current) {
      const breathe = 1 + Math.sin(t * 1.5) * 0.06;
      meshRef.current.scale.setScalar(breathe);
    }

    const pulseIntensity = matrixPuzzle.getPulseIntensity(rune.id);
    const errorIntensity = matrixPuzzle.getErrorIntensity(rune.id);

    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      if (rune.isActivated) {
        mat.color.set('#ffd700');
        mat.emissive.set('#ffd700');
        mat.emissiveIntensity = 1.2 + pulseIntensity * 2;
      } else if (rune.isError || errorIntensity > 0) {
        mat.color.set('#ff3355');
        mat.emissive.set('#ff3355');
        mat.emissiveIntensity = 1 + errorIntensity * 1.5;
        if (errorIntensity > 0) {
          meshRef.current.position.x = position[0] + (Math.random() - 0.5) * 0.08;
        } else {
          meshRef.current.position.x = position[0];
        }
      } else {
        mat.color.set('#d4af37');
        mat.emissive.set('#d4af37');
        mat.emissiveIntensity = 0.6 + Math.sin(t * 1.5) * 0.2;
        meshRef.current.position.x = position[0];
      }
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerDown={(e) => {
          if (!clickable) return;
          e.stopPropagation();
          matrixPuzzle.handleRuneClick(rune.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (clickable && !rune.isActivated) {
            document.body.style.cursor = 'pointer';
          }
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        <boxGeometry args={[0.9, 0.9, 0.15]} />
        <meshStandardMaterial
          color="#d4af37"
          emissive="#d4af37"
          emissiveIntensity={0.8}
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>

      <RuneText symbol={rune.symbol} ref={textRef} activated={rune.isActivated} />
    </group>
  );
};

import { forwardRef, useMemo } from 'react';

interface RuneTextProps {
  symbol: string;
  activated: boolean;
}

const RuneText = forwardRef<THREE.Mesh, RuneTextProps>(({ symbol, activated }, ref) => {
  const canvas = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = activated ? '#ffffff' : '#fff8dc';
    ctx.font = 'bold 140px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 20;
    ctx.shadowColor = activated ? '#ffd700' : '#d4af37';
    ctx.fillText(symbol, 128, 138);
    return c;
  }, [symbol, activated]);

  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [canvas]);

  return (
    <mesh ref={ref} position={[0, 0, 0.09]}>
      <planeGeometry args={[0.75, 0.75]} />
      <meshBasicMaterial
        map={texture}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
});
RuneText.displayName = 'RuneText';

export default EnergyMatrix;
