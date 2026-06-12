import * as THREE from 'three';
import { TerrainData } from './TerrainGenerator';
import { PerlinNoise } from '../utils/PerlinNoise';

export interface VegetationConfig {
  density: number;
  minAltitude: number;
  maxAltitude: number;
}

export class TerrainVisualizer {
  private scene: THREE.Scene;
  private terrainMesh: THREE.Mesh | null = null;
  private waterMesh: THREE.Mesh | null = null;
  private vegetationMesh: THREE.InstancedMesh | null = null;
  private noise: PerlinNoise;
  private dummy: THREE.Object3D;
  private treeTrunkGeometry: THREE.CylinderGeometry;
  private treeCrownGeometry: THREE.ConeGeometry;
  private treeMergedGeometry: THREE.BufferGeometry;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.noise = new PerlinNoise(42);
    this.dummy = new THREE.Object3D();

    this.treeTrunkGeometry = new THREE.CylinderGeometry(0.15, 0.2, 1, 6);
    this.treeTrunkGeometry.translate(0, 0.5, 0);

    this.treeCrownGeometry = new THREE.ConeGeometry(0.6, 1.5, 6);
    this.treeCrownGeometry.translate(0, 1.75, 0);

    this.treeMergedGeometry = this.mergeTreeGeometries();
  }

  private mergeTreeGeometries(): THREE.BufferGeometry {
    const geometries = [this.treeTrunkGeometry, this.treeCrownGeometry];
    return this.manualMergeGeometries(geometries);
  }

  private manualMergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
    const merged = new THREE.BufferGeometry();
    let totalVertices = 0;
    let totalIndices = 0;
    const positionArrays: Float32Array[] = [];
    const normalArrays: Float32Array[] = [];
    const colorArrays: Float32Array[] = [];
    const indexArrays: number[][] = [];

    const trunkColor = new THREE.Color(0x8B4513);
    const crownColor = new THREE.Color(0x2E7D32);

    for (let i = 0; i < geometries.length; i++) {
      const geo = geometries[i];
      const posAttr = geo.getAttribute('position');
      const normAttr = geo.getAttribute('normal');
      const indexAttr = geo.getIndex();

      const positions = new Float32Array(posAttr.count * 3);
      const normals = new Float32Array(normAttr.count * 3);
      const colors = new Float32Array(posAttr.count * 3);

      const color = i === 0 ? trunkColor : crownColor;

      for (let v = 0; v < posAttr.count; v++) {
        positions[v * 3] = posAttr.getX(v);
        positions[v * 3 + 1] = posAttr.getY(v);
        positions[v * 3 + 2] = posAttr.getZ(v);

        normals[v * 3] = normAttr.getX(v);
        normals[v * 3 + 1] = normAttr.getY(v);
        normals[v * 3 + 2] = normAttr.getZ(v);

        colors[v * 3] = color.r;
        colors[v * 3 + 1] = color.g;
        colors[v * 3 + 2] = color.b;
      }

      positionArrays.push(positions);
      normalArrays.push(normals);
      colorArrays.push(colors);

      if (indexAttr) {
        const indices: number[] = [];
        for (let idx = 0; idx < indexAttr.count; idx++) {
          indices.push(indexAttr.getX(idx) + totalVertices);
        }
        indexArrays.push(indices);
        totalIndices += indexAttr.count;
      } else {
        const indices: number[] = [];
        for (let v = 0; v < posAttr.count; v++) {
          indices.push(v + totalVertices);
        }
        indexArrays.push(indices);
        totalIndices += posAttr.count;
      }

      totalVertices += posAttr.count;
    }

    const mergedPositions = new Float32Array(totalVertices * 3);
    const mergedNormals = new Float32Array(totalVertices * 3);
    const mergedColors = new Float32Array(totalVertices * 3);
    const mergedIndices = new Uint32Array(totalIndices);

    let vertexOffset = 0;
    let indexOffset = 0;

    for (let i = 0; i < positionArrays.length; i++) {
      mergedPositions.set(positionArrays[i], vertexOffset * 3);
      mergedNormals.set(normalArrays[i], vertexOffset * 3);
      mergedColors.set(colorArrays[i], vertexOffset * 3);

      for (let idx = 0; idx < indexArrays[i].length; idx++) {
        mergedIndices[indexOffset + idx] = indexArrays[i][idx];
      }

      vertexOffset += positionArrays[i].length / 3;
      indexOffset += indexArrays[i].length;
    }

    merged.setAttribute('position', new THREE.BufferAttribute(mergedPositions, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(mergedNormals, 3));
    merged.setAttribute('color', new THREE.BufferAttribute(mergedColors, 3));
    merged.setIndex(new THREE.BufferAttribute(mergedIndices, 1));

    return merged;
  }

  public createTerrainMaterial(data: TerrainData): THREE.ShaderMaterial {
    const sandColor = new THREE.Color(0xE8D5B7);
    const grassColor = new THREE.Color(0x7CB342);
    const rockColor = new THREE.Color(0x9E9E9E);
    const transitionWidth = 0.05;

    return new THREE.ShaderMaterial({
      uniforms: {
        uSandColor: { value: sandColor },
        uGrassColor: { value: grassColor },
        uRockColor: { value: rockColor },
        uMinHeight: { value: data.minHeight },
        uMaxHeight: { value: data.maxHeight },
        uTransitionWidth: { value: transitionWidth },
        uTime: { value: 0 }
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying float vHeight;
        varying vec2 vUv;

        void main() {
          vPosition = position;
          vNormal = normal;
          vHeight = position.y;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uSandColor;
        uniform vec3 uGrassColor;
        uniform vec3 uRockColor;
        uniform float uMinHeight;
        uniform float uMaxHeight;
        uniform float uTransitionWidth;
        uniform float uTime;

        varying vec3 vPosition;
        varying vec3 vNormal;
        varying float vHeight;
        varying vec2 vUv;

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
          float normalizedHeight = (vHeight - uMinHeight) / max(uMaxHeight - uMinHeight, 0.001);

          float noiseOffset = noise(vPosition.xz * 8.0) * 0.08;
          normalizedHeight += noiseOffset;
          normalizedHeight = clamp(normalizedHeight, 0.0, 1.0);

          float sandGrass = smoothstep(0.3 - uTransitionWidth, 0.3 + uTransitionWidth, normalizedHeight);
          float grassRock = smoothstep(0.6 - uTransitionWidth, 0.6 + uTransitionWidth, normalizedHeight);

          vec3 color = mix(uSandColor, uGrassColor, sandGrass);
          color = mix(color, uRockColor, grassRock);

          vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
          float diffuse = max(dot(vNormal, lightDir), 0.0) * 0.5 + 0.5;
          color *= diffuse;

          float detailNoise = noise(vPosition.xz * 50.0) * 0.05;
          color += detailNoise;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      lights: false
    });
  }

  public buildTerrain(data: TerrainData, waterHeight: number, onComplete: () => void): void {
    if (this.terrainMesh) {
      this.scene.remove(this.terrainMesh);
      this.terrainMesh.geometry.dispose();
      (this.terrainMesh.material as THREE.Material).dispose();
      this.terrainMesh = null;
    }

    const material = this.createTerrainMaterial(data);
    this.terrainMesh = new THREE.Mesh(data.geometry, material);
    this.terrainMesh.receiveShadow = true;
    this.terrainMesh.position.set(0, 0, 0);
    this.terrainMesh.scale.set(1, 1, 1);

    (this.terrainMesh.material as THREE.ShaderMaterial).opacity = 0;
    (this.terrainMesh.material as THREE.ShaderMaterial).transparent = true;

    this.scene.add(this.terrainMesh);

    const halfWater = (data.maxHeight - data.minHeight) * waterHeight + data.minHeight;
    this.buildWater(data, halfWater);

    const startTime = performance.now();
    const duration = 500;

    const fadeIn = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      if (this.terrainMesh) {
        (this.terrainMesh.material as THREE.ShaderMaterial).opacity = eased;
      }

      if (progress < 1) {
        requestAnimationFrame(fadeIn);
      } else {
        if (this.terrainMesh) {
          (this.terrainMesh.material as THREE.ShaderMaterial).transparent = false;
          (this.terrainMesh.material as THREE.ShaderMaterial).opacity = 1;
        }
        onComplete();
      }
    };

    fadeIn();
  }

  private buildWater(data: TerrainData, height: number): void {
    if (this.waterMesh) {
      this.scene.remove(this.waterMesh);
      this.waterMesh.geometry.dispose();
      (this.waterMesh.material as THREE.Material).dispose();
      this.waterMesh = null;
    }

    const waterGeometry = new THREE.PlaneGeometry(data.size * 1.1, data.size * 1.1, 32, 32);
    waterGeometry.rotateX(-Math.PI / 2);

    const waterMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uWaterColor: { value: new THREE.Color(0x2196F3) },
        uTime: { value: 0 },
        uAmplitude: { value: 0.05 },
        uFrequency: { value: 1.0 }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uAmplitude;
        uniform float uFrequency;
        varying vec2 vUv;
        varying float vWaveHeight;

        void main() {
          vUv = uv;
          vec3 pos = position;
          float wave = sin(pos.x * uFrequency + uTime * 2.0) * cos(pos.z * uFrequency + uTime * 1.5) * uAmplitude;
          pos.y += wave;
          vWaveHeight = wave;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uWaterColor;
        uniform float uTime;
        varying vec2 vUv;
        varying float vWaveHeight;

        void main() {
          float specular = pow(max(vWaveHeight * 10.0 + 0.5, 0.0), 2.0) * 0.3;
          vec3 finalColor = uWaterColor + specular;
          gl_FragColor = vec4(finalColor, 0.3);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });

    this.waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
    this.waterMesh.position.y = height;
    this.scene.add(this.waterMesh);
  }

  public buildVegetation(data: TerrainData, config: VegetationConfig): void {
    if (this.vegetationMesh) {
      this.scene.remove(this.vegetationMesh);
      this.vegetationMesh.geometry.dispose();
      (this.vegetationMesh.material as THREE.Material).dispose();
      this.vegetationMesh = null;
    }

    const minCount = 1000;
    const maxCount = 5000;
    const count = Math.floor(minCount + (maxCount - minCount) * (config.density / 100));

    if (count === 0 || config.density === 0) {
      return;
    }

    const treeMaterial = new THREE.MeshLambertMaterial({
      vertexColors: true
    });

    this.vegetationMesh = new THREE.InstancedMesh(
      this.treeMergedGeometry,
      treeMaterial,
      count
    );

    this.vegetationMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const halfSize = data.size / 2;
    const heightRange = data.maxHeight - data.minHeight;
    const minWorldHeight = data.minHeight + heightRange * config.minAltitude;
    const maxWorldHeight = data.minHeight + heightRange * config.maxAltitude;

    this.noise.reseed(data.seed);

    let placedCount = 0;
    let attempts = 0;
    const maxAttempts = count * 20;

    while (placedCount < count && attempts < maxAttempts) {
      attempts++;

      const rx = this.noise.noise2D(attempts * 0.1, attempts * 0.15 + 100);
      const rz = this.noise.noise2D(attempts * 0.2 + 200, attempts * 0.12 + 300);

      const localX = (rx + 1) * 0.5 * data.size;
      const localZ = (rz + 1) * 0.5 * data.size;

      const ix = Math.min(Math.floor(localX), data.size);
      const iz = Math.min(Math.floor(localZ), data.size);
      const height = data.heights[iz * (data.size + 1) + ix];

      if (height < minWorldHeight || height > maxWorldHeight) {
        continue;
      }

      const worldX = localX - halfSize;
      const worldZ = localZ - halfSize;

      const altitudeNormalized = (height - minWorldHeight) / (maxWorldHeight - minWorldHeight);
      const heightMultiplier = 1.2 - altitudeNormalized * 0.7;

      const rotationNoise = this.noise.noise2D(attempts * 0.3, attempts * 0.35 + 500);
      const rotation = (rotationNoise + 1) * Math.PI;

      const scaleNoise = this.noise.noise2D(attempts * 0.4 + 600, attempts * 0.45 + 700);
      const baseScale = 0.8 + (scaleNoise + 1) * 0.2;
      const finalScale = baseScale * heightMultiplier;

      this.dummy.position.set(worldX, height, worldZ);
      this.dummy.rotation.set(0, rotation, 0);
      this.dummy.scale.set(finalScale, finalScale, finalScale);
      this.dummy.updateMatrix();

      this.vegetationMesh.setMatrixAt(placedCount, this.dummy.matrix);
      placedCount++;
    }

    if (placedCount < count) {
      this.vegetationMesh.count = placedCount;
    }

    this.vegetationMesh.instanceMatrix.needsUpdate = true;
    this.vegetationMesh.castShadow = true;
    this.scene.add(this.vegetationMesh);
  }

  public updateWater(time: number): void {
    if (this.waterMesh) {
      const material = this.waterMesh.material as THREE.ShaderMaterial;
      if (material.uniforms && material.uniforms.uTime) {
        material.uniforms.uTime.value = time;
      }
    }
    if (this.terrainMesh) {
      const material = this.terrainMesh.material as THREE.ShaderMaterial;
      if (material.uniforms && material.uniforms.uTime) {
        material.uniforms.uTime.value = time;
      }
    }
  }

  public dispose(): void {
    if (this.terrainMesh) {
      this.scene.remove(this.terrainMesh);
      this.terrainMesh.geometry.dispose();
      (this.terrainMesh.material as THREE.Material).dispose();
    }
    if (this.waterMesh) {
      this.scene.remove(this.waterMesh);
      this.waterMesh.geometry.dispose();
      (this.waterMesh.material as THREE.Material).dispose();
    }
    if (this.vegetationMesh) {
      this.scene.remove(this.vegetationMesh);
      this.vegetationMesh.geometry.dispose();
      (this.vegetationMesh.material as THREE.Material).dispose();
    }
    this.treeTrunkGeometry.dispose();
    this.treeCrownGeometry.dispose();
    this.treeMergedGeometry.dispose();
  }
}
