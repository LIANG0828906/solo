import * as THREE from 'three';

export type FaultType = 'normal' | 'reverse' | 'strike-slip';

export interface FaultParameters {
  type: FaultType;
  dipAngle: number;
  displacement: number;
  slipSpeed: number;
}

interface LayerData {
  mesh: THREE.Mesh;
  basePositions: Float32Array;
  currentPositions: Float32Array;
  yBase: number;
  thickness: number;
}

export const LAYER_COLORS = [
  0xe8b86d, 0xdaa65a, 0xc9924a, 0xc97b4b, 0xb8683a,
  0xa85730, 0x964825, 0x8b4423, 0x7c3a1e, 0x6b4423,
  0x7a5235, 0x8b6140, 0x7b5838, 0x6a4a2d, 0x5a3e25,
  0x6b5840, 0x7a6850, 0x8b8178, 0x7d7468, 0x6e6658,
  0x8b7355, 0x9c8460, 0x8a7250, 0x786040, 0x6a5438,
  0x9b7b4e, 0x8a6b3e, 0x7a5c30, 0x6a4d25, 0x5a3e1a
];

export class TerrainModel {
  public group: THREE.Group;
  public faultLine: THREE.Line;
  public faultGlow: THREE.Mesh;
  public particles: THREE.Points;
  public faultEdgeLines: THREE.LineSegments;

  private readonly layerCount: number;
  private readonly verticesPerLayer: number;
  private readonly blockWidth = 6;
  private readonly blockDepth = 4;
  private readonly totalHeight = 5;

  private layers: LayerData[] = [];
  private currentParams: FaultParameters = {
    type: 'normal',
    dipAngle: 60,
    displacement: 0.5,
    slipSpeed: 1.0
  };
  private currentProgress = 0;
  private targetProgress = 0;

  private particleVelocities: Float32Array;
  private particleLifetimes: Float32Array;
  private particleCount = 1500;

  private glowTime = 0;
  private shakeIntensity = 0;
  private shakeTime = 0;

  constructor(layerCount: number, verticesPerLayer: number) {
    this.layerCount = layerCount;
    this.verticesPerLayer = verticesPerLayer;
    this.group = new THREE.Group();

    this.faultLine = this.createFaultLine();
    this.faultGlow = this.createFaultGlow();
    this.particles = this.createParticles();
    this.faultEdgeLines = this.createFaultEdgeLines();
    this.particleVelocities = new Float32Array(this.particleCount * 3);
    this.particleLifetimes = new Float32Array(this.particleCount);

    this.buildLayers();
    this.group.add(this.faultGlow);
    this.group.add(this.faultLine);
    this.group.add(this.particles);
    this.group.add(this.faultEdgeLines);
  }

  private createFaultLine(): THREE.Line {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(50 * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      linewidth: 2
    });
    const line = new THREE.Line(geometry, material);
    line.renderOrder = 999;
    return line;
  }

  private createFaultGlow(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(8, 7, 1, 1);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uOpacity;
        varying vec2 vUv;
        
        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        void main() {
          float dist = abs(vUv.x - 0.5);
          float pulse = sin(uTime * 3.0) * 0.3 + 0.7;
          float glow = exp(-dist * 8.0) * pulse;
          float flicker = noise(vUv * 10.0 + uTime) * 0.15 + 0.85;
          vec3 color = vec3(1.0, 0.98, 0.9);
          gl_FragColor = vec4(color, glow * uOpacity * flicker);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const glow = new THREE.Mesh(geometry, material);
    glow.visible = false;
    return glow;
  }

  private createParticles(): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    const sizes = new Float32Array(this.particleCount);

    for (let i = 0; i < this.particleCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -100;
      positions[i * 3 + 2] = 0;
      const t = Math.random();
      colors[i * 3] = 0.9 + t * 0.1;
      colors[i * 3 + 1] = 0.75 + t * 0.15;
      colors[i * 3 + 2] = 0.5 + t * 0.2;
      sizes[i] = 0.03 + Math.random() * 0.05;
      this.particleLifetimes[i] = 0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: window.devicePixelRatio || 1 }
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
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float alpha = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    return new THREE.Points(geometry, material);
  }

  private createFaultEdgeLines(): THREE.LineSegments {
    const geometry = new THREE.BufferGeometry();
    const edgeCount = this.layerCount * 2;
    const segmentsPerEdge = 30;
    const positions = new Float32Array(edgeCount * segmentsPerEdge * 2 * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }
      },
      vertexShader: `
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        void main() {
          float pulse = sin(uTime * 4.0) * 0.5 + 0.5;
          float glow = 0.6 + pulse * 0.4;
          vec3 color = vec3(1.0, 1.0, 0.95) * glow;
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const lines = new THREE.LineSegments(geometry, material);
    lines.renderOrder = 999;
    return lines;
  }

  private buildLayers(): void {
    const layerThickness = this.totalHeight / this.layerCount;
    const segX = Math.ceil(Math.sqrt(this.verticesPerLayer));
    const segZ = Math.ceil(this.verticesPerLayer / segX);

    for (let i = 0; i < this.layerCount; i++) {
      const yBase = -this.totalHeight / 2 + i * layerThickness;
      const color = LAYER_COLORS[i % LAYER_COLORS.length];

      const geometry = new THREE.BoxGeometry(
        this.blockWidth,
        layerThickness * 1.002,
        this.blockDepth,
        segX, 1, segZ
      );

      geometry.translate(0, yBase + layerThickness / 2, 0);

      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.85,
        metalness: 0.05,
        flatShading: false
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
      const basePositions = new Float32Array(posAttr.array as Float32Array);
      const currentPositions = new Float32Array(posAttr.array as Float32Array);

      this.layers.push({
        mesh,
        basePositions,
        currentPositions,
        yBase,
        thickness: layerThickness
      });

      this.group.add(mesh);
    }

    this.addWireframeEdges();
  }

  private addWireframeEdges(): void {
    for (const layer of this.layers) {
      const edges = new THREE.EdgesGeometry(layer.mesh.geometry);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x1a1208,
        transparent: true,
        opacity: 0.35
      });
      const wireframe = new THREE.LineSegments(edges, lineMaterial);
      layer.mesh.add(wireframe);
    }
  }

  public triggerShake(): void {
    this.shakeIntensity = 0.08;
    this.shakeTime = 0.5;
  }

  public emitParticles(type?: FaultType): void {
    const positions = this.particles.geometry.getAttribute('position') as THREE.BufferAttribute;
    const colors = this.particles.geometry.getAttribute('color') as THREE.BufferAttribute;
    const posArr = positions.array as Float32Array;
    const colorArr = colors.array as Float32Array;
    const faultType = type || this.currentParams.type;
    const dipRad = THREE.MathUtils.degToRad(this.currentParams.dipAngle);
    const faultNormalX = Math.sin(dipRad);
    const faultNormalY = Math.cos(dipRad);

    let emitCount: number;
    let speedMul: number;
    let normalDir: number;
    let baseColor: { r: number; g: number; b: number };

    if (faultType === 'normal') {
      emitCount = 600;
      speedMul = 1.1;
      normalDir = -1;
      baseColor = { r: 1.0, g: 0.75, b: 0.35 };
    } else if (faultType === 'reverse') {
      emitCount = 800;
      speedMul = 1.4;
      normalDir = 1;
      baseColor = { r: 1.0, g: 0.55, b: 0.25 };
    } else {
      emitCount = 500;
      speedMul = 1.0;
      normalDir = 0;
      baseColor = { r: 0.85, g: 0.7, b: 0.4 };
    }

    let emitted = 0;
    for (let i = 0; i < this.particleCount && emitted < emitCount; i++) {
      if (this.particleLifetimes[i] <= 0) {
        const t = Math.random();
        const y = -this.totalHeight / 2 + t * this.totalHeight;
        const xOffset = (y + this.totalHeight / 2) / this.totalHeight * Math.tan(dipRad) * this.totalHeight / 2;

        posArr[i * 3] = xOffset + (Math.random() - 0.5) * 0.15;
        posArr[i * 3 + 1] = y + (Math.random() - 0.5) * 0.1;
        posArr[i * 3 + 2] = (Math.random() - 0.5) * this.blockDepth * 0.8;

        const colorVar = Math.random() * 0.2;
        colorArr[i * 3] = Math.min(1.0, baseColor.r + colorVar);
        colorArr[i * 3 + 1] = Math.min(1.0, baseColor.g + colorVar * 0.8);
        colorArr[i * 3 + 2] = Math.min(1.0, baseColor.b + colorVar * 0.5);

        const spread = 2.5 * speedMul;
        if (faultType === 'strike-slip') {
          const side = Math.random() > 0.5 ? 1 : -1;
          this.particleVelocities[i * 3] = side * (Math.random() * 1.5 + 1.0) * speedMul;
          this.particleVelocities[i * 3 + 1] = Math.random() * 0.5 * speedMul;
          this.particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * spread;
        } else {
          this.particleVelocities[i * 3] = (Math.random() - 0.5) * spread + faultNormalX * normalDir * 1.2 * speedMul;
          this.particleVelocities[i * 3 + 1] = Math.random() * spread * 0.8 + 0.8 * speedMul;
          this.particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * spread;
        }

        this.particleLifetimes[i] = 0.8 + Math.random() * 0.7;
        emitted++;
      }
    }
    positions.needsUpdate = true;
    colors.needsUpdate = true;
  }

  public setParameters(params: Partial<FaultParameters>): void {
    this.currentParams = { ...this.currentParams, ...params };
    this.applyFault(this.currentProgress);
  }

  public getParameters(): FaultParameters {
    return { ...this.currentParams };
  }

  public setProgress(progress: number, animate = true): void {
    this.targetProgress = THREE.MathUtils.clamp(progress, 0, 1);
    if (!animate) {
      this.currentProgress = this.targetProgress;
      this.applyFault(this.currentProgress);
    }
  }

  public reset(): void {
    this.targetProgress = 0;
    this.currentProgress = 0;
    this.applyFault(0);
    (this.faultGlow.material as THREE.ShaderMaterial).uniforms.uOpacity.value = 0;
    this.faultGlow.visible = false;
    this.faultEdgeLines.visible = false;
  }

  public applyFault(progress: number): void {
    this.currentProgress = progress;
    const { type, dipAngle, displacement } = this.currentParams;
    const dipRad = THREE.MathUtils.degToRad(dipAngle);
    const tanDip = Math.tan(dipRad);
    const maxDisp = displacement * 1.5;

    for (const layer of this.layers) {
      const posAttr = layer.mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const base = layer.basePositions;

      for (let j = 0; j < arr.length; j += 3) {
        const bx = base[j];
        const by = base[j + 1];
        const bz = base[j + 2];

        const faultXAtY = (by + this.totalHeight / 2) / tanDip - this.blockWidth / 2;
        const isHangingWall = bx < faultXAtY;

        let dx = 0, dy = 0, dz = 0;

        if (type === 'normal') {
          if (isHangingWall) {
            dy = -maxDisp * progress * Math.cos(dipRad);
            dx = -maxDisp * progress * Math.sin(dipRad);
          }
        } else if (type === 'reverse') {
          if (isHangingWall) {
            dy = maxDisp * progress * Math.cos(dipRad) * 0.7;
            dx = maxDisp * progress * Math.sin(dipRad);
          }
        } else if (type === 'strike-slip') {
          const threshold = 0;
          if (bx < threshold) {
            dz = maxDisp * progress * 0.8;
          } else {
            dz = -maxDisp * progress * 0.8;
          }
        }

        const crackWidth = 0.04 * progress;
        if (type !== 'strike-slip') {
          const distToFault = Math.abs(bx - faultXAtY);
          const crackFactor = Math.max(0, 1 - distToFault / 0.3);
          if (isHangingWall) {
            dx -= crackWidth * crackFactor;
          } else {
            dx += crackWidth * crackFactor;
          }
        }

        arr[j] = bx + dx;
        arr[j + 1] = by + dy;
        arr[j + 2] = bz + dz;
      }

      posAttr.needsUpdate = true;
      layer.mesh.geometry.computeVertexNormals();
    }

    this.updateFaultLine(progress);
    this.updateFaultEdgeLines(progress);
  }

  private updateFaultLine(progress: number): void {
    const { type, dipAngle } = this.currentParams;
    const dipRad = THREE.MathUtils.degToRad(dipAngle);
    const tanDip = Math.tan(dipRad);

    const positions = this.faultLine.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = positions.array as Float32Array;
    const pointCount = arr.length / 3;
    const halfH = this.totalHeight / 2;
    const halfD = this.blockDepth / 2;

    for (let i = 0; i < pointCount; i++) {
      const t = i / (pointCount - 1);
      const y = -halfH + t * this.totalHeight;
      const x = (y + halfH) / tanDip - this.blockWidth / 2;

      let z = 0;
      if (type === 'strike-slip') {
        const disp = this.currentParams.displacement * 1.5 * progress * 0.8;
        z = (x < 0) ? disp : -disp;
        const fadeZ = Math.sin(t * Math.PI);
        z *= fadeZ;
      }

      arr[i * 3] = x;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = z;
    }
    positions.needsUpdate = true;
    this.faultLine.geometry.computeBoundingSphere();

    if (progress > 0.01) {
      this.faultGlow.visible = true;
      const glowMat = this.faultGlow.material as THREE.ShaderMaterial;
      glowMat.uniforms.uOpacity.value = Math.min(0.35, progress * 0.5);
      this.faultGlow.position.set(0, 0, 0);
      this.faultGlow.rotation.set(0, 0, -dipRad);
      this.faultGlow.scale.set(1, 1.1, 1);
    }
  }

  private updateFaultEdgeLines(progress: number): void {
    const { type, dipAngle, displacement } = this.currentParams;
    const dipRad = THREE.MathUtils.degToRad(dipAngle);
    const tanDip = Math.tan(dipRad);
    const maxDisp = displacement * 1.5;

    const positions = this.faultEdgeLines.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = positions.array as Float32Array;
    const segmentsPerEdge = 30;
    const halfH = this.totalHeight / 2;
    const halfD = this.blockDepth / 2;
    const layerThickness = this.totalHeight / this.layerCount;

    let vertexIndex = 0;

    for (let layerIdx = 0; layerIdx < this.layerCount; layerIdx++) {
      const yBase = -halfH + layerIdx * layerThickness;
      const yTop = yBase + layerThickness;

      for (const zSign of [-1, 1]) {
        const z = zSign * halfD;

        for (let i = 0; i < segmentsPerEdge; i++) {
          const t0 = i / segmentsPerEdge;
          const t1 = (i + 1) / segmentsPerEdge;

          const y0 = yBase + t0 * layerThickness;
          const y1 = yBase + t1 * layerThickness;

          const x0 = (y0 + halfH) / tanDip - this.blockWidth / 2;
          const x1 = (y1 + halfH) / tanDip - this.blockWidth / 2;

          const getOffset = (x: number, y: number): [number, number, number] => {
            const faultXAtY = (y + halfH) / tanDip - this.blockWidth / 2;
            const isHangingWall = x < faultXAtY;
            let dx = 0, dy = 0, dz = 0;

            if (type === 'normal') {
              if (isHangingWall) {
                dy = -maxDisp * progress * Math.cos(dipRad);
                dx = -maxDisp * progress * Math.sin(dipRad);
              }
            } else if (type === 'reverse') {
              if (isHangingWall) {
                dy = maxDisp * progress * Math.cos(dipRad) * 0.7;
                dx = maxDisp * progress * Math.sin(dipRad);
              }
            } else if (type === 'strike-slip') {
              if (x < 0) {
                dz = maxDisp * progress * 0.8;
              } else {
                dz = -maxDisp * progress * 0.8;
              }
            }

            const crackWidth = 0.04 * progress;
            if (type !== 'strike-slip') {
              const distToFault = Math.abs(x - faultXAtY);
              const crackFactor = Math.max(0, 1 - distToFault / 0.3);
              if (isHangingWall) {
                dx -= crackWidth * crackFactor;
              } else {
                dx += crackWidth * crackFactor;
              }
            }

            return [dx, dy, dz];
          };

          const [dx0, dy0, dz0] = getOffset(x0, y0);
          const [dx1, dy1, dz1] = getOffset(x1, y1);

          arr[vertexIndex++] = x0 + dx0;
          arr[vertexIndex++] = y0 + dy0;
          arr[vertexIndex++] = z + dz0;

          arr[vertexIndex++] = x1 + dx1;
          arr[vertexIndex++] = y1 + dy1;
          arr[vertexIndex++] = z + dz1;
        }
      }
    }

    positions.needsUpdate = true;
    this.faultEdgeLines.geometry.computeBoundingSphere();

    if (progress > 0.01) {
      this.faultEdgeLines.visible = true;
      const edgeMat = this.faultEdgeLines.material as THREE.ShaderMaterial;
      edgeMat.uniforms.uTime.value = this.glowTime;
    } else {
      this.faultEdgeLines.visible = false;
    }
  }

  public getSliceGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const { type, dipAngle, displacement } = this.currentParams;
    const progress = this.currentProgress;
    const dipRad = THREE.MathUtils.degToRad(dipAngle);
    const tanDip = Math.tan(dipRad);
    const maxDisp = displacement * 1.5;

    const vertices: number[] = [];
    const colors: number[] = [];
    const halfW = this.blockWidth / 2;
    const halfH = this.totalHeight / 2;

    const layerThickness = this.totalHeight / this.layerCount;

    for (let i = 0; i < this.layerCount; i++) {
      const y0 = -halfH + i * layerThickness;
      const y1 = y0 + layerThickness;
      const colorHex = LAYER_COLORS[i % LAYER_COLORS.length];
      const c = new THREE.Color(colorHex);

      const getOffset = (x: number, y: number): [number, number] => {
        const faultXAtY = (y + halfH) / tanDip - halfW;
        const isHangingWall = x < faultXAtY;
        let dx = 0, dy = 0;

        if (type === 'normal') {
          if (isHangingWall) {
            dy = -maxDisp * progress * Math.cos(dipRad);
            dx = -maxDisp * progress * Math.sin(dipRad);
          }
        } else if (type === 'reverse') {
          if (isHangingWall) {
            dy = maxDisp * progress * Math.cos(dipRad) * 0.7;
            dx = maxDisp * progress * Math.sin(dipRad);
          }
        } else if (type === 'strike-slip') {
          if (x < 0) {
            dx = maxDisp * progress * 0.4;
          } else {
            dx = -maxDisp * progress * 0.4;
          }
        }

        const crackWidth = 0.05 * progress;
        if (type !== 'strike-slip') {
          const distToFault = Math.abs(x - faultXAtY);
          const crackFactor = Math.max(0, 1 - distToFault / 0.4);
          if (isHangingWall) {
            dx -= crackWidth * crackFactor;
          } else {
            dx += crackWidth * crackFactor;
          }
        }

        return [dx, dy];
      };

      const x0 = -halfW, x1 = halfW;
      const [dx00, dy00] = getOffset(x0, y0);
      const [dx10, dy10] = getOffset(x1, y0);
      const [dx01, dy01] = getOffset(x0, y1);
      const [dx11, dy11] = getOffset(x1, y1);

      const p00 = [x0 + dx00, y0 + dy00];
      const p10 = [x1 + dx10, y0 + dy10];
      const p01 = [x0 + dx01, y1 + dy01];
      const p11 = [x1 + dx11, y1 + dy11];

      vertices.push(
        p00[0], p00[1], 0,
        p10[0], p10[1], 0,
        p01[0], p01[1], 0,
        p10[0], p10[1], 0,
        p11[0], p11[1], 0,
        p01[0], p01[1], 0
      );

      for (let k = 0; k < 6; k++) {
        colors.push(c.r, c.g, c.b);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeBoundingSphere();

    return geometry;
  }

  public update(dt: number): void {
    if (this.currentProgress < this.targetProgress) {
      const speed = this.currentParams.slipSpeed * 1.5;
      this.currentProgress = Math.min(
        this.targetProgress,
        this.currentProgress + dt * speed
      );
      this.applyFault(this.currentProgress);
    }

    this.glowTime += dt;
    (this.faultGlow.material as THREE.ShaderMaterial).uniforms.uTime.value = this.glowTime;
    (this.faultEdgeLines.material as THREE.ShaderMaterial).uniforms.uTime.value = this.glowTime;

    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      const t = this.shakeTime / 0.5;
      const intensity = this.shakeIntensity * t;
      this.group.position.x = (Math.random() - 0.5) * intensity;
      this.group.position.y = (Math.random() - 0.5) * intensity;
      this.group.position.z = (Math.random() - 0.5) * intensity;
      if (this.shakeTime <= 0) {
        this.group.position.set(0, 0, 0);
      }
    }

    const posAttr = this.particles.geometry.getAttribute('position') as THREE.BufferAttribute;
    const posArr = posAttr.array as Float32Array;
    const gravity = -2.5;

    for (let i = 0; i < this.particleCount; i++) {
      if (this.particleLifetimes[i] > 0) {
        this.particleLifetimes[i] -= dt;
        const idx = i * 3;
        this.particleVelocities[idx + 1] += gravity * dt;

        const drag = Math.exp(-dt * 0.8);
        this.particleVelocities[idx] *= drag;
        this.particleVelocities[idx + 1] *= drag;
        this.particleVelocities[idx + 2] *= drag;

        posArr[idx] += this.particleVelocities[idx] * dt;
        posArr[idx + 1] += this.particleVelocities[idx + 1] * dt;
        posArr[idx + 2] += this.particleVelocities[idx + 2] * dt;

        if (this.particleLifetimes[i] <= 0) {
          posArr[idx + 1] = -100;
        }
      }
    }
    posAttr.needsUpdate = true;
  }

  public getProgress(): number {
    return this.currentProgress;
  }
}
