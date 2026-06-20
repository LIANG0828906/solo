import * as THREE from 'three';
import { hexToRgbVec } from './statusStore';

const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3  uColor;
  uniform vec3  uColorSecondary;
  uniform float uBandAlpha;
  uniform float uBandBeta;
  uniform float uBandTheta;
  uniform float uBandDelta;

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vWave;
  varying vec3 vBaseColor;
  varying float vDepth;

  void main() {
    vNormal = normalize(normalMatrix * normal);

    float freqAlpha = uBandAlpha * 12.0 + 4.0;
    float freqBeta  = uBandBeta  * 16.0 + 6.0;
    float freqTheta = uBandTheta * 8.0  + 3.0;
    float freqDelta = uBandDelta * 4.0  + 1.0;

    float speedAlpha = uBandAlpha * 3.0 + 1.0;
    float speedBeta  = uBandBeta  * 4.0 + 1.5;
    float speedTheta = uBandTheta * 2.0 + 0.6;
    float speedDelta = uBandDelta * 1.0 + 0.3;

    float w1 = sin(position.x * freqAlpha + uTime * speedAlpha)
             * sin(position.y * freqBeta  + uTime * speedBeta)
             * sin(position.z * freqTheta + uTime * speedTheta);

    float w2 = cos(position.y * freqDelta + uTime * speedDelta)
             * sin(position.x * freqBeta + position.z * freqAlpha + uTime * (speedAlpha + speedDelta));

    float wave = w1 * 0.65 + w2 * 0.35;

    float bandWeight = (uBandAlpha + uBandBeta + uBandTheta + uBandDelta) * 0.25;
    float displacement = wave * uIntensity * (0.06 + bandWeight * 0.06);

    vec3 newPosition = position + normal * displacement;
    vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
    vViewPosition = -mvPosition.xyz;
    vDepth = clamp(1.0 - (-mvPosition.z / 8.0), 0.0, 1.0);

    vWave = wave * 0.5 + 0.5;
    vBaseColor = mix(uColor, uColorSecondary, vWave * 0.6 + vDepth * 0.3);

    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3  uColor;
  uniform float uRimPower;

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vWave;
  varying vec3 vBaseColor;
  varying float vDepth;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);

    float rim = 1.0 - max(dot(normal, viewDir), 0.0);
    rim = pow(rim, uRimPower) * (0.6 + uIntensity * 0.8);

    vec3 fresnelColor = uColor * 1.4 + vec3(0.2, 0.4, 0.8) * 0.2;
    vec3 color = vBaseColor;

    float waveHot = smoothstep(0.65, 1.0, vWave);
    color += fresnelColor * waveHot * (0.35 + uIntensity * 0.5);

    color += fresnelColor * rim * 0.9;

    float inner = pow(max(dot(normal, viewDir), 0.0), 1.8);
    color *= 0.55 + inner * 0.9;

    color += uColor * vDepth * 0.15;

    float flicker = sin(uTime * 6.0 + vWave * 30.0) * 0.03 + 0.97;
    color *= flicker;

    gl_FragColor = vec4(color, 0.96);
  }
`;

function createHemisphereGeometry(radius: number, detail: number, side: 'left' | 'right'): THREE.BufferGeometry {
  const sphere = new THREE.SphereGeometry(radius, detail * 2, detail, 0, Math.PI * 2, 0, Math.PI);
  const posAttr = sphere.getAttribute('position') as THREE.BufferAttribute;
  const positions = posAttr.array as Float32Array;
  const vertexCount = posAttr.count;

  const keptIndices: number[] = [];

  for (let i = 0; i < vertexCount; i++) {
    const x = positions[i * 3 + 0];
    if (side === 'left' && x <= 0.0001) {
      keptIndices.push(i);
    } else if (side === 'right' && x >= -0.0001) {
      keptIndices.push(i);
    }
  }

  const newPositions = new Float32Array(keptIndices.length * 3);
  const newNormals = new Float32Array(keptIndices.length * 3);
  const newUvs = new Float32Array(keptIndices.length * 2);

  const oldNormals = (sphere.getAttribute('normal') as THREE.BufferAttribute).array as Float32Array;
  const oldUvs = (sphere.getAttribute('uv') as THREE.BufferAttribute).array as Float32Array;

  for (let k = 0; k < keptIndices.length; k++) {
    const i = keptIndices[k];
    newPositions[k * 3 + 0] = positions[i * 3 + 0];
    newPositions[k * 3 + 1] = positions[i * 3 + 1];
    newPositions[k * 3 + 2] = positions[i * 3 + 2];
    newNormals[k * 3 + 0] = oldNormals[i * 3 + 0];
    newNormals[k * 3 + 1] = oldNormals[i * 3 + 1];
    newNormals[k * 3 + 2] = oldNormals[i * 3 + 2];
    newUvs[k * 2 + 0] = oldUvs[i * 2 + 0];
    newUvs[k * 2 + 1] = oldUvs[i * 2 + 1];
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(newNormals, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(newUvs, 2));
  geometry.computeVertexNormals();

  sphere.dispose();
  return geometry;
}

export class BrainModel {
  public readonly group: THREE.Group;
  private leftMesh: THREE.Mesh;
  private rightMesh: THREE.Mesh;
  private leftMaterial: THREE.ShaderMaterial;
  private rightMaterial: THREE.ShaderMaterial;
  private startTime: number;
  private currentColor: string;
  private currentIntensity: number;

  constructor() {
    this.group = new THREE.Group();
    this.startTime = performance.now();
    this.currentColor = '#00aaff';
    this.currentIntensity = 0.75;

    const radius = 1.6;
    const detail = 48;
    const gap = 0.04;

    const leftGeom = createHemisphereGeometry(radius, detail, 'left');
    const rightGeom = createHemisphereGeometry(radius, detail, 'right');

    leftGeom.translate(-gap * 0.5, 0, 0);
    rightGeom.translate(gap * 0.5, 0, 0);

    this.leftMaterial = this.createMaterial();
    this.rightMaterial = this.createMaterial();

    this.leftMesh = new THREE.Mesh(leftGeom, this.leftMaterial);
    this.rightMesh = new THREE.Mesh(rightGeom, this.rightMaterial);

    const coreGeom = new THREE.SphereGeometry(radius * 0.88, 32, 24);
    const coreMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#02040a'),
      transparent: true,
      opacity: 0.9,
      side: THREE.BackSide,
    });
    const core = new THREE.Mesh(coreGeom, coreMat);
    this.group.add(core);

    this.group.add(this.leftMesh);
    this.group.add(this.rightMesh);

    this.updateFreqBand(this.currentColor, this.currentIntensity, 0.4, 0.9, 0.2, 0.1);
  }

  private createMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 0.5 },
        uColor: { value: new THREE.Color('#00aaff') },
        uColorSecondary: { value: new THREE.Color('#ffffff') },
        uBandAlpha: { value: 0.4 },
        uBandBeta: { value: 0.6 },
        uBandTheta: { value: 0.3 },
        uBandDelta: { value: 0.2 },
        uRimPower: { value: 3.5 },
      },
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: true,
    });
  }

  public updateFreqBand(
    colorHex: string,
    intensity: number,
    alpha: number,
    beta: number,
    theta: number,
    delta: number,
  ): void {
    this.currentColor = colorHex;
    this.currentIntensity = intensity;

    const [r, g, b] = hexToRgbVec(colorHex);
    const colorPrimary = new THREE.Color(r, g, b);
    const colorSecondary = new THREE.Color(
      Math.min(1, r * 1.6 + 0.25),
      Math.min(1, g * 1.6 + 0.35),
      Math.min(1, b * 1.8 + 0.45),
    );

    [this.leftMaterial, this.rightMaterial].forEach((mat) => {
      mat.uniforms.uColor.value = colorPrimary;
      mat.uniforms.uColorSecondary.value = colorSecondary;
      mat.uniforms.uIntensity.value = intensity;
      mat.uniforms.uBandAlpha.value = alpha;
      mat.uniforms.uBandBeta.value = beta;
      mat.uniforms.uBandTheta.value = theta;
      mat.uniforms.uBandDelta.value = delta;
    });
  }

  public update(now: number): void {
    const t = (now - this.startTime) * 0.001;
    this.leftMaterial.uniforms.uTime.value = t;
    this.rightMaterial.uniforms.uTime.value = t;

    this.group.rotation.y = Math.sin(t * 0.12) * 0.25 + 0.3;
    this.group.rotation.x = Math.sin(t * 0.08) * 0.12 - 0.1;

    const pulse = 1 + Math.sin(t * 2.2) * 0.008 * this.currentIntensity;
    this.group.scale.setScalar(pulse);
  }

  public dispose(): void {
    this.leftMesh.geometry.dispose();
    this.rightMesh.geometry.dispose();
    this.leftMaterial.dispose();
    this.rightMaterial.dispose();
  }
}
