import * as THREE from 'three';

export interface GalaxyParams {
  particleCount: number;
  mass: number;
  radius: number;
  arms: number;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  armSpin?: number;
  coreSize?: number;
}

export interface StarType {
  r: number;
  g: number;
  b: number;
  probability: number;
}

const STAR_TYPES: StarType[] = [
  { r: 0.43, g: 0.66, b: 1.0, probability: 0.15 },
  { r: 1.0, g: 0.42, b: 0.42, probability: 0.15 },
  { r: 1.0, g: 0.88, b: 0.51, probability: 0.70 },
];

function pickStarType(): StarType {
  const r = Math.random();
  let cumulative = 0;
  for (const type of STAR_TYPES) {
    cumulative += type.probability;
    if (r <= cumulative) return type;
  }
  return STAR_TYPES[2];
}

export class Galaxy {
  public particles: THREE.Points;
  public positions: Float32Array;
  public velocities: Float32Array;
  public baseColors: Float32Array;
  public colors: Float32Array;
  public sizes: Float32Array;
  public mass: number;
  public particleCount: number;
  public centerOfMass: THREE.Vector3;
  public corePosition: THREE.Vector3;
  public coreVelocity: THREE.Vector3;
  public haloMesh: THREE.Mesh;

  private params: GalaxyParams;
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;

  constructor(params: GalaxyParams) {
    this.params = { ...params, armSpin: params.armSpin ?? 1.2, coreSize: params.coreSize ?? 0.15 };
    this.particleCount = params.particleCount;
    this.mass = params.mass;
    this.centerOfMass = params.position.clone();
    this.corePosition = params.position.clone();
    this.coreVelocity = new THREE.Vector3();

    this.positions = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount * 3);
    this.baseColors = new Float32Array(this.particleCount * 3);
    this.colors = new Float32Array(this.particleCount * 3);
    this.sizes = new Float32Array(this.particleCount);

    this.generateSpiralArm();
    this.assignStarColors();
    this.geometry = this.createGeometry();
    this.material = this.createMaterial();
    this.particles = new THREE.Points(this.geometry, this.material);
    this.particles.frustumCulled = false;
    this.haloMesh = this.createHalo();
  }

  private generateSpiralArm(): void {
    const { particleCount, radius, arms, position, rotation, armSpin = 1.2, coreSize = 0.15 } = this.params;
    const euler = rotation;
    const quat = new THREE.Quaternion().setFromEuler(euler);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const isCore = Math.random() < 0.15;

      let r: number;
      let theta: number;
      let armAngle: number;

      if (isCore) {
        r = Math.pow(Math.random(), 2) * radius * coreSize;
        theta = Math.random() * Math.PI * 2;
        armAngle = 0;
      } else {
        const arm = Math.floor(Math.random() * arms);
        const armBase = (arm / arms) * Math.PI * 2;
        r = Math.pow(Math.random(), 0.6) * radius;
        const spin = r * armSpin * 0.05;
        armAngle = armBase + spin + (Math.random() - 0.5) * 0.4;
        theta = armAngle;
      }

      const heightFactor = Math.exp(-r / (radius * 0.4)) * 0.15;
      const z = (Math.random() - 0.5) * heightFactor * radius;

      const x = Math.cos(theta) * r;
      const y = Math.sin(theta) * r;

      const localPos = new THREE.Vector3(x, y, z).applyQuaternion(quat);

      this.positions[i3] = localPos.x + position.x;
      this.positions[i3 + 1] = localPos.y + position.y;
      this.positions[i3 + 2] = localPos.z + position.z;

      const circularSpeed = Math.sqrt(this.mass * 50 / (r + 2)) * (isCore ? 0.6 : 1.0);
      const tangent = new THREE.Vector3(-Math.sin(theta), Math.cos(theta), 0);
      const velocity = tangent.multiplyScalar(circularSpeed).applyQuaternion(quat);

      this.velocities[i3] = velocity.x;
      this.velocities[i3 + 1] = velocity.y;
      this.velocities[i3 + 2] = velocity.z;

      this.sizes[i] = isCore ? 2.0 + Math.random() * 1.5 : 0.6 + Math.random() * 0.8;
    }
  }

  private assignStarColors(): void {
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      const type = pickStarType();
      const brightness = 0.7 + Math.random() * 0.3;
      this.baseColors[i3] = type.r * brightness;
      this.baseColors[i3 + 1] = type.g * brightness;
      this.baseColors[i3 + 2] = type.b * brightness;
      this.colors[i3] = this.baseColors[i3];
      this.colors[i3 + 1] = this.baseColors[i3 + 1];
      this.colors[i3 + 2] = this.baseColors[i3 + 2];
    }
  }

  private createGeometry(): THREE.BufferGeometry {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    return geo;
  }

  private createMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        uniform float uPixelRatio;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * uPixelRatio * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          if (dist > 0.5) discard;
          float alpha = smoothstep(0.5, 0.0, dist);
          alpha = pow(alpha, 1.5);
          vec3 glow = vColor * (1.0 + 0.5 * smoothstep(0.5, 0.0, dist));
          gl_FragColor = vec4(glow, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });
  }

  private createHalo(): THREE.Mesh {
    const haloGeo = new THREE.SphereGeometry(this.params.radius * 0.3, 32, 32);
    const haloMat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(0.3, 0.4, 0.8) },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vec3 viewDir = normalize(-vPosition);
          float rim = 1.0 - max(dot(viewDir, vNormal), 0.0);
          rim = pow(rim, 3.0);
          float intensity = rim * 0.6;
          gl_FragColor = vec4(uColor, intensity);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    const mesh = new THREE.Mesh(haloGeo, haloMat);
    mesh.position.copy(this.corePosition);
    return mesh;
  }

  public setMass(mass: number): void {
    this.mass = mass;
    const mat = this.haloMesh.material as THREE.ShaderMaterial;
    const intensity = Math.min(1.0, mass * 0.5);
    mat.uniforms.uColor.value.setRGB(0.3 * intensity, 0.4 * intensity, 0.8 * intensity);
  }

  public updateColorsByVelocity(): void {
    let maxSpeed = 0;
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      const vx = this.velocities[i3];
      const vy = this.velocities[i3 + 1];
      const vz = this.velocities[i3 + 2];
      const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
      if (speed > maxSpeed) maxSpeed = speed;
    }

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      const vx = this.velocities[i3];
      const vy = this.velocities[i3 + 1];
      const vz = this.velocities[i3 + 2];
      const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
      const t = Math.min(1.0, speed / (maxSpeed + 0.001));

      const baseR = this.baseColors[i3];
      const baseG = this.baseColors[i3 + 1];
      const baseB = this.baseColors[i3 + 2];

      const shiftR = 0.4 + t * 0.3;
      const shiftG = 0.4 + t * 0.2;
      const shiftB = 0.8 + t * 0.2;

      this.colors[i3] = baseR * (1 - t * 0.3) + shiftR * t * 0.3;
      this.colors[i3 + 1] = baseG * (1 - t * 0.4) + shiftG * t * 0.2;
      this.colors[i3 + 2] = baseB * (1 - t * 0.1) + shiftB * t * 0.3;
    }

    const colorAttr = this.geometry.getAttribute('color') as THREE.BufferAttribute;
    colorAttr.needsUpdate = true;
  }

  public updateGeometry(): void {
    const posAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    posAttr.needsUpdate = true;
    this.haloMesh.position.copy(this.corePosition);

    let cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      cx += this.positions[i3];
      cy += this.positions[i3 + 1];
      cz += this.positions[i3 + 2];
    }
    this.centerOfMass.set(cx / this.particleCount, cy / this.particleCount, cz / this.particleCount);
  }

  public reset(params: GalaxyParams): void {
    this.params = { ...params, armSpin: params.armSpin ?? 1.2, coreSize: params.coreSize ?? 0.15 };
    this.mass = params.mass;
    this.particleCount = params.particleCount;
    this.centerOfMass.copy(params.position);
    this.corePosition.copy(params.position);
    this.coreVelocity.set(0, 0, 0);
    this.generateSpiralArm();
    this.assignStarColors();
    this.updateGeometry();
    this.updateColorsByVelocity();
    const haloMat = this.haloMesh.material as THREE.ShaderMaterial;
    this.haloMesh.scale.setScalar(1);
    haloMat.uniforms.uColor.value.setRGB(0.3, 0.4, 0.8);
  }
}
