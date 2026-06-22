import * as THREE from 'three';

const starVertexShader = `
  attribute float size;
  attribute float twinkleSpeed;
  attribute float twinkleOffset;
  varying float vTwinkle;
  uniform float time;
  
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float twinkle = sin(time * twinkleSpeed + twinkleOffset) * 0.35 + 0.65;
    vTwinkle = twinkle;
    gl_PointSize = size * (300.0 / -mvPosition.z) * twinkle;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const starFragmentShader = `
  varying float vTwinkle;
  uniform vec3 starColor;
  
  void main() {
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;
    float alpha = (1.0 - r * 2.0) * vTwinkle;
    gl_FragColor = vec4(starColor, alpha);
  }
`;

export class StarField {
  private scene: THREE.Scene;
  private stars: THREE.Points | null = null;
  private time: number = 0;
  private starCount: number = 500;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.createStarField();
  }

  private createStarField(): void {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.starCount * 3);
    const sizes = new Float32Array(this.starCount);
    const twinkleSpeeds = new Float32Array(this.starCount);
    const twinkleOffsets = new Float32Array(this.starCount);

    for (let i = 0; i < this.starCount; i++) {
      const i3 = i * 3;
      const radius = 30 + Math.random() * 70;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      const isLarge = Math.random() < 0.15;
      sizes[i] = isLarge ? 3 + Math.random() * 4 : 1 + Math.random() * 2;

      twinkleSpeeds[i] = 0.5 + Math.random() * 2;
      twinkleOffsets[i] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('twinkleSpeed', new THREE.BufferAttribute(twinkleSpeeds, 1));
    geometry.setAttribute('twinkleOffset', new THREE.BufferAttribute(twinkleOffsets, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        starColor: { value: new THREE.Color(0xffffff) }
      },
      vertexShader: starVertexShader,
      fragmentShader: starFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.stars = new THREE.Points(geometry, material);
    this.scene.add(this.stars);
  }

  public update(deltaTime: number): void {
    this.time += deltaTime;
    if (this.stars) {
      (this.stars.material as THREE.ShaderMaterial).uniforms.time.value = this.time;
    }
  }
}
