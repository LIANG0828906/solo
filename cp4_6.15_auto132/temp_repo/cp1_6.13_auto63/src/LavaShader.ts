import * as THREE from 'three';

export const LavaVertexShader = `
  varying vec2 vUv;
  varying float vHeight;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vHeight = position.y;
    vNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const LavaFragmentShader = `
  uniform float uTime;
  uniform float uFadeIn;
  uniform sampler2D uNoiseTexture;
  uniform vec2 uPoolCenter;
  uniform float uPoolRadius;
  uniform float uMaxHeight;

  varying vec2 vUv;
  varying float vHeight;
  varying vec3 vNormal;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    float normHeight = clamp(vHeight / max(uMaxHeight, 0.01), 0.0, 1.0);

    float baseSpeed = 0.02;
    float flowSpeed = baseSpeed;
    vec2 flowDir = vec2(0.0, 1.0);

    if (normHeight > 0.5) {
      flowSpeed = mix(baseSpeed, 0.05, (normHeight - 0.5) * 2.0);
      flowDir = mix(vec2(0.0, 1.0), vec2(0.3, 0.95), (normHeight - 0.5) * 2.0);
    } else if (normHeight < 0.1) {
      flowSpeed = mix(0.01, baseSpeed, normHeight / 0.1);
      flowDir = mix(vec2(-0.2, 0.98), vec2(0.0, 1.0), normHeight / 0.1);
    }
    
    flowDir = normalize(flowDir + vec2(sin(normHeight * 3.14159) * 0.1, cos(normHeight * 2.0) * 0.1));

    vec2 scrollUv = vUv;
    scrollUv += flowDir * uTime * flowSpeed;
    scrollUv.x += sin(uTime * 0.3 + normHeight * 3.0) * 0.01;

    float n1 = fbm(scrollUv * 4.0);
    float n2 = fbm(scrollUv * 8.0 + uTime * 0.1);
    float pattern = n1 * 0.6 + n2 * 0.4;

    vec3 darkRed = vec3(0.5, 0.05, 0.0);
    vec3 orange = vec3(1.0, 0.35, 0.05);
    vec3 brightYellow = vec3(1.0, 0.9, 0.2);

    float heightT = clamp(vHeight / 10.0, 0.0, 1.0);
    vec3 baseColor = mix(darkRed, orange, smoothstep(0.0, 0.5, heightT));
    baseColor = mix(baseColor, brightYellow, smoothstep(0.4, 1.0, heightT));

    vec3 finalColor = mix(baseColor * 0.7, baseColor * 1.3, pattern);

    vec2 poolUv = vUv - 0.5;
    poolUv *= 50.0;
    float distFromPool = length(poolUv - uPoolCenter);
    float poolMask = 1.0 - smoothstep(uPoolRadius - 0.5, uPoolRadius + 0.5, distFromPool);
    if (uPoolRadius > 0.0 && vHeight < 0.5) {
      finalColor = mix(finalColor, vec3(1.0, 0.95, 0.4), poolMask);
    }

    float glowIntensity = 0.3 + 0.7 * pattern + heightT * 0.5;
    finalColor += brightYellow * glowIntensity * 0.15;

    finalColor *= uFadeIn;

    float fresnel = pow(1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 2.0);
    finalColor += brightYellow * fresnel * 0.1;

    gl_FragColor = vec4(finalColor, uFadeIn);
  }
`;

export interface LavaMaterialUniforms {
  [key: string]: THREE.IUniform<any>;
  uTime: { value: number };
  uFadeIn: { value: number };
  uNoiseTexture: { value: THREE.Texture | null };
  uPoolCenter: { value: THREE.Vector2 };
  uPoolRadius: { value: number };
}

export function createLavaMaterial(): {
  material: THREE.ShaderMaterial;
  uniforms: LavaMaterialUniforms;
} {
  const uniforms: LavaMaterialUniforms = {
    uTime: { value: 0 },
    uFadeIn: { value: 0 },
    uNoiseTexture: { value: null },
    uPoolCenter: { value: new THREE.Vector2(0, 0) },
    uPoolRadius: { value: 0 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: LavaVertexShader,
    fragmentShader: LavaFragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
  });

  return { material, uniforms };
}
