import * as THREE from 'three';

export interface GlassMaterialOptions {
  colorStart?: string;
  colorEnd?: string;
  opacity?: number;
}

const defaultOptions: Required<GlassMaterialOptions> = {
  colorStart: '#00d2ff',
  colorEnd: '#7b2ff7',
  opacity: 0.82,
};

export function createGradientMaterial(options: GlassMaterialOptions = {}): THREE.ShaderMaterial {
  const config = { ...defaultOptions, ...options };
  const start = new THREE.Color(config.colorStart);
  const end = new THREE.Color(config.colorEnd);

  const vertexShader = `
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec2 vUvCustom;

    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vNormal = normalize(normalMatrix * normal);
      vec3 localPos = position;
      float height = (localPos.y + 6.0) / 12.0;
      vUvCustom = vec2(height, 0.0);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    uniform vec3 uColorStart;
    uniform vec3 uColorEnd;
    uniform float uOpacity;
    uniform float uTime;
    uniform float uGlowIntensity;

    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec2 vUvCustom;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      float heightRatio = clamp(vUvCustom.x, 0.0, 1.0);
      vec3 baseColor = mix(uColorEnd, uColorStart, heightRatio);

      float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.2);
      vec3 rimLight = vec3(1.0) * fresnel * 0.9;

      float flow1 = sin(vWorldPosition.x * 1.5 + uTime * 1.3);
      float flow2 = cos(vWorldPosition.y * 1.8 + uTime * 1.7);
      float flow3 = sin(vWorldPosition.z * 1.2 + uTime * 1.1);
      float flowPattern = (flow1 + flow2 + flow3) / 3.0;
      float glow = smoothstep(0.6, 1.0, flowPattern) * 0.35 * uGlowIntensity;
      vec3 glowColor = mix(uColorStart, uColorEnd, 0.5 + flowPattern * 0.5);

      float diffuse = max(dot(normal, normalize(vec3(0.4, 0.7, 0.5))), 0.0);
      vec3 ambient = baseColor * 0.35;
      vec3 diffuseLight = baseColor * diffuse * 0.55;

      vec3 finalColor = ambient + diffuseLight;
      finalColor += glowColor * glow;
      finalColor += rimLight * 0.7;
      finalColor += baseColor * fresnel * 0.15;

      float alpha = uOpacity * (0.55 + fresnel * 0.45) + glow * 0.35;
      alpha = clamp(alpha, 0.1, 1.0);

      gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uColorStart: { value: start },
      uColorEnd: { value: end },
      uOpacity: { value: config.opacity },
      uTime: { value: 0 },
      uGlowIntensity: { value: 1 },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

export function updateMaterialColor(
  material: THREE.ShaderMaterial,
  options: GlassMaterialOptions
): void {
  if (options.colorStart) {
    (material.uniforms.uColorStart.value as THREE.Color).set(options.colorStart);
  }
  if (options.colorEnd) {
    (material.uniforms.uColorEnd.value as THREE.Color).set(options.colorEnd);
  }
  if (options.opacity !== undefined) {
    material.uniforms.uOpacity.value = options.opacity;
  }
}

export function updateMaterialTime(material: THREE.ShaderMaterial, time: number): void {
  material.uniforms.uTime.value = time;
}

export function lerpColor(a: string, b: string, t: number): string {
  const ca = new THREE.Color(a);
  const cb = new THREE.Color(b);
  const result = new THREE.Color().lerpColors(ca, cb, t);
  return `#${result.getHexString()}`;
}

export const SCENE_BACKGROUNDS: Record<string, string> = {
  torusKnot: '#0a0a2e',
  spiralBranch: '#1a0a2e',
  fractalTree: '#0a2e1a',
};
