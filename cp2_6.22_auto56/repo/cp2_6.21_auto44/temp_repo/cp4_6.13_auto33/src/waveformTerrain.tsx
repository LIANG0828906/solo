import { useRef, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from './store';
import { audioEngine } from './audioEngine';

const vertexShader = `
  uniform float uTime;
  uniform float uFlowOffset;
  uniform sampler2D uWaveformTexture;
  uniform float uAmplitude;
  
  varying vec3 vPosition;
  varying float vHeight;
  varying vec2 vUv;
  varying float vFrequency;
  
  void main() {
    vUv = uv;
    vec3 pos = position;
    
    float normalizedZ = (position.z + 10.0) / 20.0;
    float waveformValue = texture2D(uWaveformTexture, vec2(uv.x, 0.5)).r;
    float flowWave = sin((uv.x + uFlowOffset) * 20.0) * 0.1;
    float zWave = sin(normalizedZ * 30.0 + uTime * 2.0) * 0.05;
    
    float height = waveformValue * uAmplitude * 2.0 + flowWave + zWave;
    pos.y = height;
    
    vHeight = height;
    vPosition = pos;
    vFrequency = normalizedZ;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform float uCursorX;
  uniform float uIsLoaded;
  
  varying vec3 vPosition;
  varying float vHeight;
  varying vec2 vUv;
  varying float vFrequency;
  
  vec3 getColor(float freq, float height) {
    float normalizedFreq = clamp(freq, 0.0, 1.0);
    float normalizedHeight = clamp(height * 0.5 + 0.5, 0.0, 1.0);
    
    vec3 lowColor = vec3(0.0, 0.2, 0.8);
    vec3 midColor = vec3(0.0, 0.6, 0.8);
    vec3 highColor = vec3(1.0, 0.2, 0.1);
    
    vec3 freqColor;
    if (normalizedFreq < 0.5) {
      freqColor = mix(lowColor, midColor, normalizedFreq * 2.0);
    } else {
      freqColor = mix(midColor, highColor, (normalizedFreq - 0.5) * 2.0);
    }
    
    float brightness = 0.6 + normalizedHeight * 0.4;
    return freqColor * brightness;
  }
  
  void main() {
    vec3 baseColor = getColor(vFrequency, vHeight);
    
    float cursorDist = abs(vUv.x - uCursorX);
    float cursorGlow = exp(-cursorDist * 50.0) * 0.8;
    vec3 cursorColor = vec3(1.0, 0.1, 0.1);
    
    float pulse = sin(uTime * 4.0) * 0.5 + 0.5;
    float cursorPulse = exp(-cursorDist * 30.0) * pulse * 0.5;
    
    vec3 finalColor = baseColor + cursorColor * (cursorGlow + cursorPulse) * uIsLoaded;
    
    float fresnel = pow(1.0 - abs(dot(normalize(vPosition), vec3(0.0, 1.0, 0.0))), 2.0);
    finalColor += vec3(0.1, 0.3, 0.5) * fresnel * 0.3;
    
    gl_FragColor = vec4(finalColor, 0.95);
  }
`;

export function WaveformTerrain() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const waveform = useStore((state) => state.spectrumData.waveform);
  const { currentTime, duration, isLoaded } = useStore((state) => state.playbackState);
  const cursorPosition = useStore((state) => state.cursorPosition);
  const targetCameraPos = useRef(new THREE.Vector3(0, 8, 12));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));

  const waveformTexture = useMemo(() => {
    const size = 1024;
    const data = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      const value = waveform[i] || 0;
      data[i] = Math.min(255, Math.max(0, value * 255));
    }
    const texture = new THREE.DataTexture(data, size, 1, THREE.RedFormat);
    texture.needsUpdate = true;
    return texture;
  }, [waveform]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uFlowOffset: { value: 0 },
      uWaveformTexture: { value: waveformTexture },
      uAmplitude: { value: 1.5 },
      uCursorX: { value: 0 },
      uIsLoaded: { value: isLoaded ? 1.0 : 0.0 },
    }),
    [waveformTexture, isLoaded]
  );

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(20, 20, 200, 60);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  const handleTerrainClick = useCallback(
    (event: any) => {
      event.stopPropagation();
      if (!isLoaded || duration === 0) return;

      const uv = event.uv;
      if (uv) {
        const clickTime = uv.x * duration;
        audioEngine.seek(clickTime);
      }
    },
    [isLoaded, duration]
  );

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = time;
      material.uniforms.uFlowOffset.value = (time * 0.3) % 1;
      material.uniforms.uCursorX.value = duration > 0 ? cursorPosition / duration : 0;
      material.uniforms.uIsLoaded.value = isLoaded ? 1.0 : 0.0;

      if (isLoaded && duration > 0) {
        const progress = currentTime / duration;
        targetLookAt.current.set(progress * 20 - 10, 0, 0);
      }
    }

    targetCameraPos.current.lerp(targetCameraPos.current, 0.05);
    camera.position.lerp(targetCameraPos.current, delta * 2);
    camera.lookAt(targetLookAt.current);
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      onClick={handleTerrainClick}
      onPointerMissed={() => {}}
    >
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
