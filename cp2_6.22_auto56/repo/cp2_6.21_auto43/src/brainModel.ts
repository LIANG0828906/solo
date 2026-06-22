import * as THREE from 'three';
import { hexToRgbVec, easeInOutCubic } from './statusStore';

const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3  uColor;
  uniform vec3  uColorSecondary;
  uniform float uBandAlpha;
  uniform float uBandBeta;
  uniform float uBandTheta;
  uniform float uBandDelta;
  uniform float uPhaseOffset;
  uniform float uSideSign;

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vWave;
  varying vec3 vBaseColor;
  varying float vDepth;
  varying float vPulseSize;

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

    float phase = uTime + uPhaseOffset;

    float w1 = sin(position.x * freqAlpha + phase * speedAlpha + uSideSign * position.z * 2.0)
             * sin(position.y * freqBeta  + phase * speedBeta)
             * sin(position.z * freqTheta + phase * speedTheta + uSideSign * position.x * 1.5);

    float w2 = cos(position.y * freqDelta + phase * speedDelta)
             * sin(position.x * freqBeta + position.z * freqAlpha + phase * (speedAlpha + speedDelta) * 0.8);

    float wave = w1 * 0.65 + w2 * 0.35;

    float bandWeight = (uBandAlpha + uBandBeta + uBandTheta + uBandDelta) * 0.25;
    float displacement = wave * uIntensity * (0.06 + bandWeight * 0.07);

    vec3 newPosition = position + normal * displacement;
    vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
    vViewPosition = -mvPosition.xyz;
    vDepth = clamp(1.0 - (-mvPosition.z / 8.0), 0.0, 1.0);

    vWave = wave * 0.5 + 0.5;
    vBaseColor = mix(uColor, uColorSecondary, vWave * 0.6 + vDepth * 0.3);

    vPulseSize = 1.0;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3  uColor;
  uniform float uRimPower;
  uniform float uGlowIntensity;

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vWave;
  varying vec3 vBaseColor;
  varying float vDepth;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);

    float rim = 1.0 - max(dot(normal, viewDir), 0.0);
    rim = pow(rim, uRimPower) * (0.6 + uIntensity * 0.9) * uGlowIntensity;

    vec3 fresnelColor = uColor * 1.4 + vec3(0.2, 0.4, 0.8) * 0.2;
    vec3 color = vBaseColor;

    float waveHot = smoothstep(0.6, 1.0, vWave);
    color += fresnelColor * waveHot * (0.4 + uIntensity * 0.6) * uGlowIntensity;

    color += fresnelColor * rim * 1.0;

    float inner = pow(max(dot(normal, viewDir), 0.0), 1.8);
    color *= 0.55 + inner * 0.9;

    color += uColor * vDepth * 0.12;

    float flicker = sin(uTime * 6.0 + vWave * 30.0) * 0.025 + 0.975;
    color *= flicker;

    gl_FragColor = vec4(color, 0.96);
  }
`;

function createHemisphereGeometry(radius: number, detail: number, side: 'left' | 'right'): THREE.BufferGeometry {
  const widthSegments = Math.max(6, detail * 2);
  const heightSegments = Math.max(6, detail);

  let geometry: THREE.BufferGeometry;

  if (side === 'left') {
    geometry = new THREE.SphereGeometry(
      radius,
      widthSegments,
      heightSegments,
      Math.PI / 2,
      Math.PI,
      0,
      Math.PI,
    );
  } else {
    geometry = new THREE.SphereGeometry(
      radius,
      widthSegments,
      heightSegments,
      -Math.PI / 2,
      Math.PI,
      0,
      Math.PI,
    );
  }

  const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
  const positions = posAttr.array as Float32Array;
  const normalsAttr = geometry.getAttribute('normal') as THREE.BufferAttribute;
  const normals = normalsAttr.array as Float32Array;
  const count = posAttr.count;

  const seamThreshold = 0.002;
  const indicesToRemove: number[] = [];

  for (let i = 0; i < count; i++) {
    const x = positions[i * 3 + 0];
    if (Math.abs(x) < seamThreshold) {
      indicesToRemove.push(i);
    }
  }

  if (indicesToRemove.length > 0) {
    const keepCount = count - indicesToRemove.length;
    const newPositions = new Float32Array(keepCount * 3);
    const newNormals = new Float32Array(keepCount * 3);
    const newUvs = new Float32Array(keepCount * 2);
    const oldUvs = (geometry.getAttribute('uv') as THREE.BufferAttribute).array as Float32Array;

    let writeIdx = 0;
    const removeSet = new Set(indicesToRemove);
    for (let i = 0; i < count; i++) {
      if (removeSet.has(i)) continue;
      newPositions[writeIdx * 3 + 0] = positions[i * 3 + 0];
      newPositions[writeIdx * 3 + 1] = positions[i * 3 + 1];
      newPositions[writeIdx * 3 + 2] = positions[i * 3 + 2];
      newNormals[writeIdx * 3 + 0] = normals[i * 3 + 0];
      newNormals[writeIdx * 3 + 1] = normals[i * 3 + 1];
      newNormals[writeIdx * 3 + 2] = normals[i * 3 + 2];
      newUvs[writeIdx * 2 + 0] = oldUvs[i * 2 + 0];
      newUvs[writeIdx * 2 + 1] = oldUvs[i * 2 + 1];
      writeIdx++;
    }

    geometry.dispose();
    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(newNormals, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(newUvs, 2));
    geometry.computeVertexNormals();
  }

  if (geometry.index) {
    geometry = geometry.toNonIndexed();
  }

  return geometry;
}

interface TransitionState {
  startColor: string;
  targetColor: string;
  startIntensity: number;
  targetIntensity: number;
  startBands: { alpha: number; beta: number; theta: number; delta: number };
  targetBands: { alpha: number; beta: number; theta: number; delta: number };
  startTime: number;
  duration: number;
  active: boolean;
}

export class BrainModel {
  public readonly group: THREE.Group;
  public readonly leftMesh: THREE.Mesh;
  public readonly rightMesh: THREE.Mesh;
  public readonly leftMaterial: THREE.ShaderMaterial;
  public readonly rightMaterial: THREE.ShaderMaterial;

  private startTime: number;
  private transition: TransitionState;

  private currentColor: string;
  private currentIntensity: number;
  private currentBands: { alpha: number; beta: number; theta: number; delta: number };

  constructor() {
    this.group = new THREE.Group();
    this.startTime = performance.now();

    const radius = 1.6;
    const detail = 48;
    const gap = 0.05;

    const leftGeom = createHemisphereGeometry(radius, detail, 'left');
    const rightGeom = createHemisphereGeometry(radius, detail, 'right');
    leftGeom.translate(-gap * 0.5, 0, 0);
    rightGeom.translate(gap * 0.5, 0, 0);

    this.leftMaterial = this.createMaterial(-1, 0.0);
    this.rightMaterial = this.createMaterial(1, 0.25);

    this.leftMesh = new THREE.Mesh(leftGeom, this.leftMaterial);
    this.rightMesh = new THREE.Mesh(rightGeom, this.rightMaterial);

    const coreGeom = new THREE.SphereGeometry(radius * 0.88, 32, 24);
    const coreMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#02040a'),
      transparent: true,
      opacity: 0.92,
      side: THREE.BackSide,
    });
    const core = new THREE.Mesh(coreGeom, coreMat);
    this.group.add(core);

    const midPlaneGeom = new THREE.PlaneGeometry(radius * 1.8, radius * 1.8, 1, 1);
    const midPlaneMat = new THREE.MeshBasicMaterial({
      color: 0x000812,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const midPlane = new THREE.Mesh(midPlaneGeom, midPlaneMat);
    midPlane.rotation.y = Math.PI / 2;
    this.group.add(midPlane);

    this.group.add(this.leftMesh);
    this.group.add(this.rightMesh);

    this.currentColor = '#00aaff';
    this.currentIntensity = 0.75;
    this.currentBands = { alpha: 0.4, beta: 0.9, theta: 0.2, delta: 0.1 };

    this.transition = {
      startColor: this.currentColor,
      targetColor: this.currentColor,
      startIntensity: this.currentIntensity,
      targetIntensity: this.currentIntensity,
      startBands: { ...this.currentBands },
      targetBands: { ...this.currentBands },
      startTime: 0,
      duration: 1500,
      active: false,
    };

    this.applyCurrentToMaterials();
  }

  private createMaterial(sideSign: number, phaseOffset: number): THREE.ShaderMaterial {
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
        uPhaseOffset: { value: phaseOffset },
        uSideSign: { value: sideSign },
        uGlowIntensity: { value: 1.0 },
      },
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: true,
    });
  }

  private hexToRgb(hex: string): [number, number, number] {
    const [r, g, b] = hexToRgbVec(hex);
    return [r, g, b];
  }

  private lerpColor(hexA: string, hexB: string, t: number): string {
    const [r1, g1, b1] = this.hexToRgb(hexA);
    const [r2, g2, b2] = this.hexToRgb(hexB);
    const r = r1 + (r2 - r1) * t;
    const g = g1 + (g2 - g1) * t;
    const b = b1 + (b2 - b1) * t;
    const toHex = (v: number) =>
      Math.max(0, Math.min(255, Math.round(v * 255))).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  public updateFreqBand(
    colorHex: string,
    intensity: number,
    alpha: number,
    beta: number,
    theta: number,
    delta: number,
    durationMs: number = 1500,
  ): void {
    const now = performance.now();

    this.transition.startColor = this.currentColor;
    this.transition.targetColor = colorHex;
    this.transition.startIntensity = this.currentIntensity;
    this.transition.targetIntensity = intensity;
    this.transition.startBands = { ...this.currentBands };
    this.transition.targetBands = { alpha, beta, theta, delta };
    this.transition.startTime = now;
    this.transition.duration = durationMs;
    this.transition.active = true;
  }

  public setImmediate(
    colorHex: string,
    intensity: number,
    alpha: number,
    beta: number,
    theta: number,
    delta: number,
  ): void {
    this.currentColor = colorHex;
    this.currentIntensity = intensity;
    this.currentBands = { alpha, beta, theta, delta };
    this.transition.active = false;
    this.applyCurrentToMaterials();
  }

  private applyCurrentToMaterials(): void {
    const [r, g, b] = this.hexToRgb(this.currentColor);
    const colorPrimary = new THREE.Color(r, g, b);
    const colorSecondary = new THREE.Color(
      Math.min(1, r * 1.6 + 0.25),
      Math.min(1, g * 1.6 + 0.35),
      Math.min(1, b * 1.8 + 0.45),
    );

    [this.leftMaterial, this.rightMaterial].forEach((mat, idx) => {
      mat.uniforms.uColor.value = colorPrimary;
      mat.uniforms.uColorSecondary.value = colorSecondary;
      mat.uniforms.uIntensity.value = this.currentIntensity;
      mat.uniforms.uBandAlpha.value = this.currentBands.alpha;
      mat.uniforms.uBandBeta.value = this.currentBands.beta;
      mat.uniforms.uBandTheta.value = this.currentBands.theta;
      mat.uniforms.uBandDelta.value = this.currentBands.delta;
      mat.uniforms.uGlowIntensity.value = 0.85 + this.currentIntensity * 0.4 + (idx === 0 ? 0.05 : 0);
    });
  }

  private tickTransition(now: number): void {
    if (!this.transition.active) return;

    const rawT = (now - this.transition.startTime) / this.transition.duration;
    if (rawT >= 1) {
      this.currentColor = this.transition.targetColor;
      this.currentIntensity = this.transition.targetIntensity;
      this.currentBands = { ...this.transition.targetBands };
      this.transition.active = false;
      this.applyCurrentToMaterials();
      return;
    }

    const t = easeInOutCubic(rawT);

    this.currentColor = this.lerpColor(
      this.transition.startColor,
      this.transition.targetColor,
      t,
    );
    this.currentIntensity =
      this.transition.startIntensity +
      (this.transition.targetIntensity - this.transition.startIntensity) * t;
    this.currentBands.alpha =
      this.transition.startBands.alpha +
      (this.transition.targetBands.alpha - this.transition.startBands.alpha) * t;
    this.currentBands.beta =
      this.transition.startBands.beta +
      (this.transition.targetBands.beta - this.transition.startBands.beta) * t;
    this.currentBands.theta =
      this.transition.startBands.theta +
      (this.transition.targetBands.theta - this.transition.startBands.theta) * t;
    this.currentBands.delta =
      this.transition.startBands.delta +
      (this.transition.targetBands.delta - this.transition.startBands.delta) * t;

    this.applyCurrentToMaterials();
  }

  public update(now: number): void {
    const t = (now - this.startTime) * 0.001;
    this.leftMaterial.uniforms.uTime.value = t;
    this.rightMaterial.uniforms.uTime.value = t;

    this.tickTransition(now);

    this.group.rotation.y = Math.sin(t * 0.12) * 0.25 + 0.3;
    this.group.rotation.x = Math.sin(t * 0.08) * 0.12 - 0.1;

    const pulse = 1 + Math.sin(t * 2.2) * 0.008 * this.currentIntensity;
    this.group.scale.setScalar(pulse);
  }

  public getColor(): string {
    return this.currentColor;
  }

  public getIntensity(): number {
    return this.currentIntensity;
  }

  public dispose(): void {
    this.leftMesh.geometry.dispose();
    this.rightMesh.geometry.dispose();
    this.leftMaterial.dispose();
    this.rightMaterial.dispose();
  }
}
