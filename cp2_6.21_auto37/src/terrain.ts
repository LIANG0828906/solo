import * as THREE from 'three';

export class Terrain {
  private scene: THREE.Scene;
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;
  private mesh: THREE.Mesh;
  private waterMesh?: THREE.Mesh;
  private waterMaterial?: THREE.ShaderMaterial;
  private heightScale: number = 1.0;
  private resolution: number = 64;
  private size: number = 20;
  private heights: Float32Array;
  private originalPositions: Float32Array;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.heights = new Float32Array(this.resolution * this.resolution);
    this.originalPositions = new Float32Array(this.resolution * this.resolution * 3);

    this.generateHeightmap();
    this.geometry = this.createGeometry();
    this.material = this.createShaderMaterial();
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);
  }

  private noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = this.fade(xf);
    const v = this.fade(yf);
    const aa = this.p[this.p[X] + Y];
    const ab = this.p[this.p[X] + Y + 1];
    const ba = this.p[this.p[X + 1] + Y];
    const bb = this.p[this.p[X + 1] + Y + 1];
    const x1 = this.lerp(this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf), u);
    const x2 = this.lerp(this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1), u);
    return (this.lerp(x1, x2, v) + 1) / 2;
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  private p: number[] = [];

  private initPermutation(): void {
    for (let i = 0; i < 256; i++) {
      this.p[i] = i;
    }
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.p[i], this.p[j]] = [this.p[j], this.p[i]];
    }
    for (let i = 0; i < 256; i++) {
      this.p[i + 256] = this.p[i];
    }
  }

  private fbm(x: number, y: number): number {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1;
    for (let i = 0; i < 6; i++) {
      value += amplitude * this.noise2D(x * frequency, y * frequency);
      amplitude *= 0.5;
      frequency *= 2;
    }
    return value;
  }

  private generateHeightmap(): void {
    this.initPermutation();
    for (let i = 0; i < this.resolution; i++) {
      for (let j = 0; j < this.resolution; j++) {
        const x = i / this.resolution * 4;
        const y = j / this.resolution * 4;
        this.heights[i * this.resolution + j] = this.fbm(x, y) * 3;
      }
    }
  }

  private createGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array(this.resolution * this.resolution * 3);
    const indices = [];
    const uvs = new Float32Array(this.resolution * this.resolution * 2);
    const randomPhases = new Float32Array(this.resolution * this.resolution);

    for (let i = 0; i < this.resolution; i++) {
      for (let j = 0; j < this.resolution; j++) {
        const idx = i * this.resolution + j;
        const x = (i / (this.resolution - 1) - 0.5) * this.size;
        const z = (j / (this.resolution - 1) - 0.5) * this.size;
        const y = this.heights[idx];

        vertices[idx * 3] = x;
        vertices[idx * 3 + 1] = y;
        vertices[idx * 3 + 2] = z;

        this.originalPositions[idx * 3] = x;
        this.originalPositions[idx * 3 + 1] = y;
        this.originalPositions[idx * 3 + 2] = z;

        uvs[idx * 2] = i / (this.resolution - 1);
        uvs[idx * 2 + 1] = j / (this.resolution - 1);

        randomPhases[idx] = Math.random() * Math.PI * 2;
      }
    }

    for (let i = 0; i < this.resolution - 1; i++) {
      for (let j = 0; j < this.resolution - 1; j++) {
        const a = i * this.resolution + j;
        const b = a + 1;
        const c = a + this.resolution;
        const d = c + 1;
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setAttribute('aRandomPhase', new THREE.BufferAttribute(randomPhases, 1));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }

  private createShaderMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        windStrength: { value: 0 },
        heightScale: { value: 1.0 },
        lowColor: { value: new THREE.Color(0x3a5a27) },
        highColor: { value: new THREE.Color(0x8b7d6b) }
      },
      vertexShader: `
        uniform float time;
        uniform float windStrength;
        uniform float heightScale;
        
        attribute float aRandomPhase;
        
        varying vec3 vNormal;
        varying float vHeight;
        varying vec2 vUv;
        
        void main() {
          vec3 pos = position;
          vHeight = pos.y * heightScale;
          
          float phase = aRandomPhase;
          float windOffset = sin(time * 0.5 + phase) * 0.05 * windStrength;
          pos.y += windOffset;
          pos.y *= heightScale;
          
          vNormal = normal;
          vUv = uv;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 lowColor;
        uniform vec3 highColor;
        
        varying vec3 vNormal;
        varying float vHeight;
        varying vec2 vUv;
        
        void main() {
          float normalizedHeight = clamp((vHeight + 1.0) / 4.0, 0.0, 1.0);
          vec3 color = mix(lowColor, highColor, normalizedHeight);
          
          vec3 lightDir = normalize(vec3(0.5, 1.0, 0.5));
          float diff = max(dot(vNormal, lightDir), 0.0);
          float ambient = 0.4;
          
          vec3 finalColor = color * (ambient + diff * 0.6);
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    });
  }

  public showWater(show: boolean): void {
    if (show && !this.waterMesh) {
      const waterGeometry = new THREE.PlaneGeometry(this.size, this.size, 32, 32);
      this.waterMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: new THREE.Color(0x1a5f7a) }
        },
        vertexShader: `
          uniform float time;
          varying vec2 vUv;
          varying float vWave;
          void main() {
            vUv = uv;
            vec3 pos = position;
            float wave = sin(pos.x * 3.0 + time * 2.0) * cos(pos.y * 3.0 + time * 1.5) * 0.05;
            vWave = wave;
            pos.z += wave;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          uniform float time;
          varying vec2 vUv;
          varying float vWave;
          void main() {
            float ripple = sin(length(vUv - 0.5) * 20.0 - time * 3.0) * 0.5 + 0.5;
            vec3 finalColor = mix(color, vec3(0.4, 0.7, 0.9), ripple * 0.3);
            float fresnel = pow(1.0 - abs(dot(vec3(0.0, 0.0, 1.0), vec3(0.0, 0.0, 1.0))), 3.0);
            finalColor += vec3(0.3) * fresnel;
            gl_FragColor = vec4(finalColor, 0.6);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide
      });
      this.waterMesh = new THREE.Mesh(waterGeometry, this.waterMaterial);
      this.waterMesh.rotation.x = -Math.PI / 2;
      this.waterMesh.position.y = 0.1;
      this.scene.add(this.waterMesh);
    } else if (!show && this.waterMesh) {
      this.scene.remove(this.waterMesh);
      this.waterMesh.geometry.dispose();
      this.waterMaterial?.dispose();
      this.waterMesh = undefined;
      this.waterMaterial = undefined;
    }
  }

  public updateScale(scale: number): void {
    this.heightScale = scale;
    this.material.uniforms.heightScale.value = scale;
  }

  public update(time: number, windStrength: number): void {
    this.material.uniforms.time.value = time;
    this.material.uniforms.windStrength.value = windStrength;

    if (this.waterMaterial) {
      this.waterMaterial.uniforms.time.value = time;
    }
  }

  public getHeightAt(x: number, z: number): number {
    const halfSize = this.size / 2;
    const gridX = Math.floor(((x + halfSize) / this.size) * (this.resolution - 1));
    const gridZ = Math.floor(((z + halfSize) / this.size) * (this.resolution - 1));
    const clampedX = Math.max(0, Math.min(this.resolution - 1, gridX));
    const clampedZ = Math.max(0, Math.min(this.resolution - 1, gridZ));
    return this.heights[clampedX * this.resolution + clampedZ] * this.heightScale;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    if (this.waterMesh) {
      this.waterMesh.geometry.dispose();
      this.waterMaterial?.dispose();
    }
  }
}
