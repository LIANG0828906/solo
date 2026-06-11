import * as THREE from 'three';

export interface WaterParams {
  waterHeight: number;
  riseSpeed: number;
  autoRise: boolean;
}

export class WaterSimulator {
  private mesh: THREE.Mesh;
  private geometry: THREE.PlaneGeometry;
  private material: THREE.ShaderMaterial;
  private params: WaterParams;
  private planeSize: number;
  private terrainSize: number;
  private time: number = 0;
  private targetHeight: number;

  constructor(planeSize: number = 10) {
    this.terrainSize = planeSize;
    this.planeSize = planeSize + 4;
    this.params = {
      waterHeight: 0.8,
      riseSpeed: 0.3,
      autoRise: false
    };
    this.targetHeight = 0.8;

    this.geometry = new THREE.PlaneGeometry(this.planeSize, this.planeSize, 100, 100);
    this.geometry.rotateX(-Math.PI / 2);

    const vertexShader = `
      uniform float uTime;
      uniform float uWaterHeight;
      uniform float uTerrainHalfSize;
      
      varying vec2 vUv;
      varying float vWaveHeight;
      varying vec3 vNormal;
      varying float vShoreFactor;
      varying vec3 vWorldPos;
      
      void main() {
        vUv = uv;
        vec3 pos = position;
        
        float wave1 = sin(pos.x * 2.5 + uTime * 0.7) * 0.05;
        float wave2 = sin(pos.y * 2.0 + uTime * 1.0) * 0.04;
        float wave3 = sin((pos.x + pos.y) * 1.8 + uTime * 0.5) * 0.03;
        float wave4 = sin((pos.x - pos.y) * 3.0 + uTime * 1.3) * 0.025;
        
        float waveTotal = wave1 + wave2 + wave3 + wave4;
        vWaveHeight = waveTotal;
        
        pos.y = uWaterHeight + waveTotal;
        vWorldPos = pos;
        
        float dx = cos(pos.x * 2.5 + uTime * 0.7) * 2.5 * 0.05
                 + cos((pos.x + pos.y) * 1.8 + uTime * 0.5) * 1.8 * 0.03
                 + cos((pos.x - pos.y) * 3.0 + uTime * 1.3) * 3.0 * 0.025;
        float dz = cos(pos.y * 2.0 + uTime * 1.0) * 2.0 * 0.04
                 + cos((pos.x + pos.y) * 1.8 + uTime * 0.5) * 1.8 * 0.03
                 - cos((pos.x - pos.y) * 3.0 + uTime * 1.3) * 3.0 * 0.025;
        vNormal = normalize(vec3(-dx, 1.0, -dz));
        
        float distX = abs(pos.x) - uTerrainHalfSize + 0.3;
        float distZ = abs(pos.y) - uTerrainHalfSize + 0.3;
        float shoreDist = max(distX, distZ);
        vShoreFactor = 1.0 - smoothstep(0.0, 1.5, shoreDist);
        vShoreFactor = max(0.0, vShoreFactor);
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float uTime;
      uniform float uWaterHeight;
      uniform float uTerrainHalfSize;
      
      varying vec2 vUv;
      varying float vWaveHeight;
      varying vec3 vNormal;
      varying float vShoreFactor;
      varying vec3 vWorldPos;
      
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }
      
      void main() {
        vec3 waterColorDeep = vec3(0.04, 0.12, 0.4);
        vec3 waterColorShallow = vec3(0.15, 0.45, 0.8);
        
        float waveNormalized = vWaveHeight * 10.0 + 0.5;
        waveNormalized = clamp(waveNormalized, 0.0, 1.0);
        vec3 baseColor = mix(waterColorDeep, waterColorShallow, waveNormalized);
        
        vec3 lightDir = normalize(vec3(0.5, 1.0, 0.5));
        float diffuse = max(dot(vNormal, lightDir), 0.0) * 0.4;
        baseColor += diffuse * vec3(0.3, 0.5, 0.9);
        
        vec3 viewDir = normalize(vec3(0.4, 0.9, 0.4));
        vec3 halfDir = normalize(lightDir + viewDir);
        float specular = pow(max(dot(vNormal, halfDir), 0.0), 64.0) * 1.0;
        baseColor += specular * vec3(0.7, 0.85, 1.0);
        
        float fresnel = pow(1.0 - max(dot(vNormal, vec3(0.0, 1.0, 0.0)), 0.0), 3.0);
        baseColor = mix(baseColor, vec3(0.75, 0.9, 1.0), fresnel * 0.3);
        
        float foamWave = smoothstep(0.02, 0.06, abs(vWaveHeight)) * 0.3;
        
        float noise1 = noise(vUv * 30.0 + uTime * 0.5);
        float noise2 = noise(vUv * 50.0 - uTime * 0.7) * 0.5;
        float foamNoise = (noise1 + noise2) * 0.5 + 0.5;
        
        float shoreFoam = vShoreFactor * foamNoise * 0.6;
        
        float totalFoam = max(foamWave, shoreFoam);
        baseColor = mix(baseColor, vec3(1.0), totalFoam);
        
        float caustic1 = sin(vUv.x * 70.0 + uTime * 1.5) * sin(vUv.y * 70.0 + uTime * 1.2);
        float caustic2 = sin(vUv.x * 90.0 + uTime * 2.0) * sin(vUv.y * 80.0 + uTime * 1.8);
        float caustics = (caustic1 + caustic2) * 0.08;
        baseColor += caustics * vec3(0.4, 0.7, 1.0);
        
        float sparkle1 = step(0.98, noise(vUv * 100.0 + uTime * 2.0));
        float sparkle2 = step(0.99, noise(vUv * 150.0 - uTime * 1.5));
        float sparkles = (sparkle1 + sparkle2) * 0.5;
        baseColor += sparkles * vec3(0.8, 0.9, 1.0);
        
        float alpha = 0.4 + vWaveHeight * 1.5 + vShoreFactor * 0.1;
        alpha = clamp(alpha, 0.3, 0.6);
        alpha += fresnel * 0.05;
        alpha += totalFoam * 0.15;
        
        gl_FragColor = vec4(baseColor, alpha);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uWaterHeight: { value: this.params.waterHeight },
        uTerrainHalfSize: { value: this.terrainSize / 2 }
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
  }

  public getMeshes(): THREE.Object3D[] {
    return [this.mesh];
  }

  public getParams(): WaterParams {
    return { ...this.params };
  }

  public setWaterHeight(height: number): void {
    this.targetHeight = height;
  }

  public setRiseSpeed(speed: number): void {
    this.params.riseSpeed = speed;
  }

  public setAutoRise(auto: boolean): void {
    this.params.autoRise = auto;
  }

  public update(deltaTime: number): void {
    this.time += deltaTime;

    if (this.params.autoRise) {
      this.params.waterHeight += this.params.riseSpeed * deltaTime;
      this.params.waterHeight = Math.min(4, this.params.waterHeight);
    } else {
      if (Math.abs(this.params.waterHeight - this.targetHeight) > 0.001) {
        const diff = this.targetHeight - this.params.waterHeight;
        const step = Math.sign(diff) * Math.min(Math.abs(diff), Math.max(this.params.riseSpeed * deltaTime * 3, 0.02));
        this.params.waterHeight += step;
      }
    }

    this.material.uniforms.uTime.value = this.time;
    this.material.uniforms.uWaterHeight.value = this.params.waterHeight;
  }

  public getWaterHeight(): number {
    return this.params.waterHeight;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
