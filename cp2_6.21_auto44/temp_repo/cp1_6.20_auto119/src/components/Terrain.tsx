import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { fbm } from '../utils/simplexNoise';

interface TerrainProps {
  size?: number;
  segments?: number;
  onTerrainClick?: (position: [number, number, number]) => void;
}

export function Terrain({ size = 400, segments = 128, onTerrainClick }: TerrainProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const { geometry, colors } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    const positions = geo.attributes.position;
    const colorArray = new Float32Array(positions.count * 3);
    const heightScale = 30;

    const lowColor = new THREE.Color(0x4a7c23);
    const midColor = new THREE.Color(0x8b7355);
    const highColor = new THREE.Color(0x6b5344);

    let minHeight = Infinity;
    let maxHeight = -Infinity;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const noiseVal = fbm(x * 0.003, y * 0.003, 5);
      const height = noiseVal * heightScale;
      positions.setZ(i, height);
      minHeight = Math.min(minHeight, height);
      maxHeight = Math.max(maxHeight, height);
    }

    for (let i = 0; i < positions.count; i++) {
      const height = positions.getZ(i);
      const normalizedHeight = (height - minHeight) / (maxHeight - minHeight);

      let color: THREE.Color;
      if (normalizedHeight < 0.4) {
        const t = normalizedHeight / 0.4;
        color = lowColor.clone().lerp(midColor, t);
      } else if (normalizedHeight < 0.7) {
        const t = (normalizedHeight - 0.4) / 0.3;
        color = midColor.clone().lerp(highColor, t);
      } else {
        const t = Math.min(1, (normalizedHeight - 0.7) / 0.3);
        color = highColor.clone().lerp(new THREE.Color(0xffffff), t * 0.3);
      }

      colorArray[i * 3] = color.r;
      colorArray[i * 3 + 1] = color.g;
      colorArray[i * 3 + 2] = color.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    geo.computeVertexNormals();
    geo.rotateX(-Math.PI / 2);

    return { geometry: geo, colors: colorArray };
  }, [size, segments]);

  const uniforms = useMemo(() => ({
    uContourSpacing: { value: 5 },
    uContourWidth: { value: 0.3 },
    uContourColor: { value: new THREE.Color(0x1a1a2e) },
    uContourOpacity: { value: 0.3 },
  }), []);

  const vertexShader = `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vColor;

    void main() {
      vPosition = position;
      vNormal = normal;
      vColor = color;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float uContourSpacing;
    uniform float uContourWidth;
    uniform vec3 uContourColor;
    uniform float uContourOpacity;

    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vColor;

    void main() {
      float height = vPosition.z;
      float contour = mod(height, uContourSpacing);
      float edge = smoothstep(uContourWidth, 0.0, contour) * 
                   smoothstep(uContourSpacing - uContourWidth, uContourSpacing, contour);
      
      vec3 baseColor = vColor;
      vec3 finalColor = mix(baseColor, uContourColor, edge * uContourOpacity);
      
      vec3 lightDir = normalize(vec3(0.5, 1.0, 0.5));
      float diffuse = max(dot(vNormal, lightDir), 0.0);
      float ambient = 0.4;
      vec3 litColor = finalColor * (ambient + diffuse * 0.6);
      
      gl_FragColor = vec4(litColor, 1.0);
    }
  `;

  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    vertexColors: true,
    side: THREE.DoubleSide,
  }), [uniforms]);

  const handleClick = (event: { point: THREE.Vector3; stopPropagation: () => void }) => {
    event.stopPropagation();
    if (onTerrainClick) {
      onTerrainClick([event.point.x, event.point.y, event.point.z]);
    }
  };

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} onClick={handleClick} receiveShadow>
    </mesh>
  );
}

export function getTerrainHeight(x: number, z: number, size: number = 400): number {
  const noiseVal = fbm(x * 0.003, z * 0.003, 5);
  return noiseVal * 30;
}
