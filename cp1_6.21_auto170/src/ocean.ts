import * as THREE from 'three';

const SHALLOW_BLUE = new THREE.Color('#4A90D9');
const DEEP_BLUE = new THREE.Color('#0F2B5B');

export class Ocean {
  public mesh: THREE.Mesh;
  public params: { amplitude: number; frequency: number };

  private geometry: THREE.PlaneGeometry;
  private material: THREE.MeshPhongMaterial;
  private positionAttr: THREE.BufferAttribute;
  private colorAttr: THREE.BufferAttribute;
  private readonly segments: number = 100;
  private readonly size: number = 200;

  private readonly waves: Array<{
    dirX: number; dirZ: number; freq: number; amp: number; speed: number; phase: number;
  }>;

  constructor(scene: THREE.Scene) {
    this.params = { amplitude: 1.5, frequency: 1.0 };

    this.waves = [
      { dirX: 1.0, dirZ: 0.0, freq: 0.12, amp: 1.0, speed: 0.8, phase: 0.0 },
      { dirX: 0.5, dirZ: 0.866, freq: 0.18, amp: 0.6, speed: 1.1, phase: 1.3 },
      { dirX: -0.7, dirZ: 0.7, freq: 0.25, amp: 0.35, speed: 1.4, phase: 2.7 },
      { dirX: 0.3, dirZ: -0.95, freq: 0.32, amp: 0.22, speed: 0.9, phase: 0.5 },
      { dirX: -0.9, dirZ: -0.43, freq: 0.4, amp: 0.15, speed: 1.6, phase: 4.1 }
    ];

    this.geometry = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
    this.geometry.rotateX(-Math.PI / 2);

    const vertexCount = (this.segments + 1) * (this.segments + 1);
    const colors = new Float32Array(vertexCount * 3);
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.positionAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    this.colorAttr = this.geometry.getAttribute('color') as THREE.BufferAttribute;

    this.material = new THREE.MeshPhongMaterial({
      vertexColors: true,
      shininess: 120,
      specular: new THREE.Color(0xffffff),
      reflectivity: 0.7,
      side: THREE.DoubleSide
    });

    this.material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.uniforms.uShallow = { value: SHALLOW_BLUE.clone() };
      shader.uniforms.uDeep = { value: DEEP_BLUE.clone() };
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `
        #include <common>
        varying float vHeight;
        varying vec3 vWorldPos;
        `
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        vHeight = position.y;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        `
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `
        #include <common>
        varying float vHeight;
        varying vec3 vWorldPos;
        uniform vec3 uShallow;
        uniform vec3 uDeep;
        `
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `
        float depthFactor = clamp((vHeight + 3.0) / 6.0, 0.0, 1.0);
        vec3 oceanColor = mix(uDeep, uShallow, clamp(depthFactor, 0.0, 1.0));
        diffuseColor.rgb = oceanColor;
        `
      );
      (this.material as any).userData.shader = shader;
    };

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.receiveShadow = true;
    scene.add(this.mesh);

    this.updateColors();
  }

  private updateColors(): void {
    const colors = this.colorAttr.array as Float32Array;
    const positions = this.positionAttr.array as Float32Array;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];
      const dist = Math.sqrt(x * x + z * z);
      const t = Math.min(1, Math.max(0, 1 - dist / (this.size * 0.35)));
      const color = DEEP_BLUE.clone().lerp(SHALLOW_BLUE, t);
      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;
    }
    this.colorAttr.needsUpdate = true;
  }

  public computeHeight(x: number, z: number, time: number): number {
    let height = 0;
    const amp = this.params.amplitude;
    const freq = this.params.frequency;
    for (let i = 0; i < this.waves.length; i++) {
      const w = this.waves[i];
      const dot = x * w.dirX + z * w.dirZ;
      height += Math.sin(dot * w.freq * freq + time * w.speed + w.phase) * w.amp * amp;
    }
    return height;
  }

  public getHeightAt(x: number, z: number, time: number): number {
    return this.computeHeight(x, z, time);
  }

  public setAmplitude(v: number): void {
    this.params.amplitude = v;
  }

  public setFrequency(v: number): void {
    this.params.frequency = v;
  }

  public update(time: number): void {
    const positions = this.positionAttr.array as Float32Array;
    const amp = this.params.amplitude;
    const freq = this.params.frequency;
    const len = positions.length;
    for (let i = 1; i < len; i += 3) {
      const x = positions[i - 1];
      const z = positions[i + 1];
      let h = 0;
      for (let w = 0; w < this.waves.length; w++) {
        const wave = this.waves[w];
        const dot = x * wave.dirX + z * wave.dirZ;
        h += Math.sin(dot * wave.freq * freq + time * wave.speed + wave.phase) * wave.amp * amp;
      }
      positions[i] = h;
    }
    this.positionAttr.needsUpdate = true;
    this.geometry.computeVertexNormals();
    const shader = (this.material as any).userData.shader;
    if (shader) {
      shader.uniforms.uTime.value = time;
    }
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
