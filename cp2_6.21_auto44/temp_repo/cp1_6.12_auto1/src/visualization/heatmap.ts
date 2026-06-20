import * as THREE from 'three';
import * as d3 from 'd3';
import { Earth } from '../core/earth';
import { AttackGeoJSON, GeoJSONFeature, TimeRange } from '../core/data-loader';

export interface TooltipData {
  country: string;
  countryCode: string;
  frequency: number;
  attackTypes: string[];
  normalizedValue: number;
  screenX: number;
  screenY: number;
}

export interface HeatmapConfig {
  earth: Earth;
  onTooltipShow?: (data: TooltipData | null) => void;
}

interface HotspotData {
  id: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  frequency: number;
  targetFrequency: number;
  attackTypes: string[];
  basePosition: THREE.Vector3;
  phase: number;
}

export class Heatmap {
  private earth: Earth;
  private hotspots: Map<string, HotspotData> = new Map();
  private hotspotOrder: string[] = [];

  private particlesMesh: THREE.Points | null = null;
  private haloMesh: THREE.Points | null = null;
  private pulsesMesh: THREE.Points | null = null;

  private particlesGeometry: THREE.BufferGeometry | null = null;
  private haloGeometry: THREE.BufferGeometry | null = null;
  private pulsesGeometry: THREE.BufferGeometry | null = null;

  private positionsAttr: THREE.BufferAttribute | null = null;
  private colorsAttr: THREE.BufferAttribute | null = null;
  private sizesAttr: THREE.BufferAttribute | null = null;
  private haloPositionsAttr: THREE.BufferAttribute | null = null;
  private haloColorsAttr: THREE.BufferAttribute | null = null;
  private haloSizesAttr: THREE.BufferAttribute | null = null;
  private pulsePositionsAttr: THREE.BufferAttribute | null = null;
  private pulseColorsAttr: THREE.BufferAttribute | null = null;
  private pulseSizesAttr: THREE.BufferAttribute | null = null;
  private pulseProgressAttr: THREE.BufferAttribute | null = null;

  private colorScale: d3.ScaleLinear<string, string>;
  private sizeScale: d3.ScaleLinear<number, number>;

  private minFrequency: number = 0;
  private maxFrequency: number = 1;

  private onTooltipShow?: (data: TooltipData | null) => void;

  private hoveredId: string | null = null;
  private pulsePool: Array<{ id: string; progress: number; speed: number }> = [];
  private maxPulses: number = 40;

  private maxHotspots: number = 1000;

  constructor(config: HeatmapConfig) {
    this.earth = config.earth;
    this.onTooltipShow = config.onTooltipShow;

    this.colorScale = d3.scaleLinear<string>()
      .domain([0, 0.25, 0.5, 0.75, 1])
      .range(['#0066ff', '#00ccff', '#00ffcc', '#ffcc00', '#ff3355'])
      .clamp(true);

    this.sizeScale = d3.scaleLinear<number, number>()
      .domain([0, 1])
      .range([0.015, 0.08]);

    this.setupGeometries();
    this.setupEvents();
    this.setupRenderLoop();
    this.seedPulses();
  }

  private setupGeometries(): void {
    const maxCount = this.maxHotspots;

    this.particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(maxCount * 3);
    const colors = new Float32Array(maxCount * 3);
    const sizes = new Float32Array(maxCount);

    this.positionsAttr = new THREE.BufferAttribute(positions, 3);
    this.colorsAttr = new THREE.BufferAttribute(colors, 3);
    this.sizesAttr = new THREE.BufferAttribute(sizes, 1);

    this.particlesGeometry.setAttribute('position', this.positionsAttr);
    this.particlesGeometry.setAttribute('color', this.colorsAttr);
    this.particlesGeometry.setAttribute('aSize', this.sizesAttr);
    this.particlesGeometry.setDrawRange(0, 0);

    const particlesMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
      },
      vertexShader: `
        attribute float aSize;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float uTime;
        uniform float uPixelRatio;
        varying float vGlow;

        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float breathe = 0.75 + 0.25 * sin(uTime * 3.0 + position.x * 5.0 + position.y * 7.0 + position.z * 3.0);
          float finalSize = aSize * breathe * 280.0 * uPixelRatio / -mvPosition.z;
          vGlow = breathe;
          gl_PointSize = finalSize;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vGlow;

        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);

          if (dist > 0.5) discard;

          float core = 1.0 - smoothstep(0.0, 0.25, dist);
          float glow = 1.0 - smoothstep(0.1, 0.5, dist);

          vec3 coreColor = vec3(1.0) * core + vColor * (1.0 - core * 0.5);
          float alpha = (core * 0.95 + glow * 0.35) * vGlow;

          gl_FragColor = vec4(coreColor * (0.8 + 0.4 * vGlow), alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particlesMesh = new THREE.Points(this.particlesGeometry, particlesMaterial);
    this.earth.addToEarthGroup(this.particlesMesh);

    this.haloGeometry = new THREE.BufferGeometry();
    const haloPositions = new Float32Array(maxCount * 3);
    const haloColors = new Float32Array(maxCount * 3);
    const haloSizes = new Float32Array(maxCount);

    this.haloPositionsAttr = new THREE.BufferAttribute(haloPositions, 3);
    this.haloColorsAttr = new THREE.BufferAttribute(haloColors, 3);
    this.haloSizesAttr = new THREE.BufferAttribute(haloSizes, 1);

    this.haloGeometry.setAttribute('position', this.haloPositionsAttr);
    this.haloGeometry.setAttribute('color', this.haloColorsAttr);
    this.haloGeometry.setAttribute('aSize', this.haloSizesAttr);
    this.haloGeometry.setDrawRange(0, 0);

    const haloMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
      },
      vertexShader: `
        attribute float aSize;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float uTime;
        uniform float uPixelRatio;

        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float breathe = 0.8 + 0.2 * sin(uTime * 1.5 + position.x * 3.0 + position.y * 4.0);
          gl_PointSize = aSize * breathe * 750.0 * uPixelRatio / -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;

        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);

          if (dist > 0.5) discard;

          float radial = 1.0 - smoothstep(0.0, 0.5, dist);
          float alpha = pow(radial, 2.0) * 0.35;

          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.haloMesh = new THREE.Points(this.haloGeometry, haloMaterial);
    this.earth.addToEarthGroup(this.haloMesh);

    this.pulsesGeometry = new THREE.BufferGeometry();
    const pulsePositions = new Float32Array(this.maxPulses * 3);
    const pulseColors = new Float32Array(this.maxPulses * 3);
    const pulseSizes = new Float32Array(this.maxPulses);
    const pulseProgress = new Float32Array(this.maxPulses);

    this.pulsePositionsAttr = new THREE.BufferAttribute(pulsePositions, 3);
    this.pulseColorsAttr = new THREE.BufferAttribute(pulseColors, 3);
    this.pulseSizesAttr = new THREE.BufferAttribute(pulseSizes, 1);
    this.pulseProgressAttr = new THREE.BufferAttribute(pulseProgress, 1);

    this.pulsesGeometry.setAttribute('position', this.pulsePositionsAttr);
    this.pulsesGeometry.setAttribute('color', this.pulseColorsAttr);
    this.pulsesGeometry.setAttribute('aSize', this.pulseSizesAttr);
    this.pulsesGeometry.setAttribute('aProgress', this.pulseProgressAttr);
    this.pulsesGeometry.setDrawRange(0, 0);

    const pulseMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
      },
      vertexShader: `
        attribute float aSize;
        attribute vec3 color;
        attribute float aProgress;
        varying vec3 vColor;
        varying float vProgress;
        uniform float uPixelRatio;

        void main() {
          vColor = color;
          vProgress = aProgress;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (0.5 + 2.5 * aProgress) * 400.0 * uPixelRatio / -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vProgress;

        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);

          if (dist > 0.5) discard;

          float ring = smoothstep(0.35, 0.5, dist) * (1.0 - smoothstep(0.48, 0.5, dist));
          float alpha = ring * (1.0 - vProgress) * 0.8;

          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.pulsesMesh = new THREE.Points(this.pulsesGeometry, pulseMaterial);
    this.earth.addToEarthGroup(this.pulsesMesh);
  }

  private setupEvents(): void {
    this.earth.onMouseMove((event, raycaster) => {
      if (!this.particlesMesh) return;

      const intersects = raycaster.intersectObject(this.particlesMesh, false);

      if (intersects.length > 0 && intersects[0].index !== undefined) {
        const idx = intersects[0].index;
        if (idx < this.hotspotOrder.length) {
          const id = this.hotspotOrder[idx];
          const hotspot = this.hotspots.get(id);

          if (hotspot) {
            this.hoveredId = id;

            const screenPos = hotspot.basePosition.clone()
              .applyMatrix4(this.earth.getEarthGroup().matrixWorld)
              .project(this.earth.getCamera());

            const canvas = this.earth.getRenderer().domElement;
            const rect = canvas.getBoundingClientRect();

            this.onTooltipShow?.({
              country: hotspot.country,
              countryCode: hotspot.countryCode,
              frequency: Math.round(hotspot.frequency),
              attackTypes: hotspot.attackTypes,
              normalizedValue: this.normalizeFrequency(hotspot.frequency),
              screenX: rect.left + (screenPos.x * 0.5 + 0.5) * rect.width,
              screenY: rect.top + (-screenPos.y * 0.5 + 0.5) * rect.height
            });

            document.body.style.cursor = 'pointer';
            return;
          }
        }
      }

      if (this.hoveredId !== null) {
        this.hoveredId = null;
        this.onTooltipShow?.(null);
        document.body.style.cursor = 'default';
      }
    });
  }

  private setupRenderLoop(): void {
    this.earth.onRender((delta, elapsed) => {
      this.updateHotspotAnimations(delta, elapsed);
      this.updatePulses(delta);
      this.updateShaderTime(elapsed);
    });
  }

  private seedPulses(): void {
    for (let i = 0; i < 10; i++) {
      this.pulsePool.push({
        id: `initial-${i}`,
        progress: Math.random(),
        speed: 0.08 + Math.random() * 0.12
      });
    }
  }

  public updateData(geoJSON: AttackGeoJSON, animate: boolean = true): void {
    const { features, metadata } = geoJSON;

    this.minFrequency = metadata.minFrequency;
    this.maxFrequency = Math.max(metadata.maxFrequency, this.minFrequency + 1);

    const seenIds = new Set<string>();

    features.forEach((feature, idx) => {
      const id = feature.properties.id;
      seenIds.add(id);

      const existing = this.hotspots.get(id);
      const frequency = feature.properties.frequency;
      const [lng, lat] = feature.geometry.coordinates;

      if (existing) {
        existing.targetFrequency = frequency;
        existing.country = feature.properties.country;
        existing.countryCode = feature.properties.countryCode;
        existing.attackTypes = feature.properties.attackTypes;

        if (!animate) {
          existing.frequency = frequency;
        }
      } else {
        const pos = Earth.latLngToVector3(lat, lng, this.earth.getEarthRadius() * 1.005);

        this.hotspots.set(id, {
          id,
          country: feature.properties.country,
          countryCode: feature.properties.countryCode,
          lat,
          lng,
          frequency: animate ? this.minFrequency : frequency,
          targetFrequency: frequency,
          attackTypes: feature.properties.attackTypes,
          basePosition: pos,
          phase: Math.random() * Math.PI * 2
        });
      }
    });

    for (const [id] of this.hotspots) {
      if (!seenIds.has(id)) {
        this.hotspots.delete(id);
      }
    }

    this.hotspotOrder = features.map(f => f.properties.id);
    this.updateGeometryBuffers();
  }

  private updateHotspotAnimations(delta: number, _elapsed: number): void {
    const lerpFactor = Math.min(1, delta * 2.0);
    let changed = false;

    let index = 0;
    for (const id of this.hotspotOrder) {
      const hotspot = this.hotspots.get(id);
      if (!hotspot) continue;

      const freqDiff = hotspot.targetFrequency - hotspot.frequency;
      if (Math.abs(freqDiff) > 0.5) {
        hotspot.frequency += freqDiff * lerpFactor;
        changed = true;
      } else if (Math.abs(freqDiff) > 0) {
        hotspot.frequency = hotspot.targetFrequency;
        changed = true;
      }

      const freqNorm = this.normalizeFrequency(hotspot.frequency);
      const colorStr = this.colorScale(freqNorm);
      const color = new THREE.Color(colorStr);
      const size = this.sizeScale(freqNorm);

      if (this.positionsAttr && this.colorsAttr && this.sizesAttr) {
        const pos = hotspot.basePosition;
        this.positionsAttr.setXYZ(index, pos.x, pos.y, pos.z);
        this.colorsAttr.setXYZ(index, color.r, color.g, color.b);
        this.sizesAttr.setX(index, size);
      }

      if (this.haloPositionsAttr && this.haloColorsAttr && this.haloSizesAttr) {
        const pos = hotspot.basePosition;
        this.haloPositionsAttr.setXYZ(index, pos.x, pos.y, pos.z);
        this.haloColorsAttr.setXYZ(index, color.r, color.g, color.b);
        this.haloSizesAttr.setX(index, size * 3.2);
      }

      index++;
    }

    if (changed || this.positionsAttr) {
      if (this.positionsAttr) this.positionsAttr.needsUpdate = true;
      if (this.colorsAttr) this.colorsAttr.needsUpdate = true;
      if (this.sizesAttr) this.sizesAttr.needsUpdate = true;
      if (this.haloPositionsAttr) this.haloPositionsAttr.needsUpdate = true;
      if (this.haloColorsAttr) this.haloColorsAttr.needsUpdate = true;
      if (this.haloSizesAttr) this.haloSizesAttr.needsUpdate = true;
    }

    if (Math.random() < delta * 1.5 && this.hotspotOrder.length > 0) {
      this.triggerRandomPulse();
    }
  }

  private updatePulses(delta: number): void {
    if (!this.pulsePositionsAttr || !this.pulseColorsAttr || !this.pulseSizesAttr || !this.pulseProgressAttr) return;

    for (let i = this.pulsePool.length - 1; i >= 0; i--) {
      const pulse = this.pulsePool[i];
      pulse.progress += pulse.speed * delta;

      if (pulse.progress >= 1) {
        this.pulsePool.splice(i, 1);
      }
    }

    const count = Math.min(this.pulsePool.length, this.maxPulses);
    this.pulsesGeometry?.setDrawRange(0, count);

    let idx = 0;
    for (const pulse of this.pulsePool) {
      if (idx >= this.maxPulses) break;

      const hotspot = this.hotspots.get(pulse.id);
      if (hotspot && idx < this.hotspotOrder.length) {
        const pos = hotspot.basePosition;
        const freqNorm = this.normalizeFrequency(hotspot.frequency);
        const color = new THREE.Color(this.colorScale(freqNorm));
        const size = this.sizeScale(freqNorm);

        this.pulsePositionsAttr.setXYZ(idx, pos.x, pos.y, pos.z);
        this.pulseColorsAttr.setXYZ(idx, color.r, color.g, color.b);
        this.pulseSizesAttr.setX(idx, size * 8);
        this.pulseProgressAttr.setX(idx, pulse.progress);
      }
      idx++;
    }

    this.pulsePositionsAttr.needsUpdate = true;
    this.pulseColorsAttr.needsUpdate = true;
    this.pulseSizesAttr.needsUpdate = true;
    this.pulseProgressAttr.needsUpdate = true;
  }

  private triggerRandomPulse(): void {
    if (this.hotspotOrder.length === 0 || this.pulsePool.length >= this.maxPulses) return;

    const weights: number[] = [];
    let total = 0;
    for (const id of this.hotspotOrder) {
      const h = this.hotspots.get(id);
      const w = h ? Math.max(0.1, this.normalizeFrequency(h.frequency)) : 0.1;
      weights.push(w);
      total += w;
    }

    let r = Math.random() * total;
    let selectedId = this.hotspotOrder[0];
    for (let i = 0; i < this.hotspotOrder.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        selectedId = this.hotspotOrder[i];
        break;
      }
    }

    this.pulsePool.push({
      id: selectedId,
      progress: 0,
      speed: 0.12 + Math.random() * 0.18
    });
  }

  private updateGeometryBuffers(): void {
    const count = this.hotspotOrder.length;
    this.particlesGeometry?.setDrawRange(0, count);
    this.haloGeometry?.setDrawRange(0, count);
  }

  private updateShaderTime(elapsed: number): void {
    if (this.particlesMesh) {
      const mat = this.particlesMesh.material as THREE.ShaderMaterial;
      if (mat.uniforms?.uTime) mat.uniforms.uTime.value = elapsed;
    }
    if (this.haloMesh) {
      const mat = this.haloMesh.material as THREE.ShaderMaterial;
      if (mat.uniforms?.uTime) mat.uniforms.uTime.value = elapsed;
    }
  }

  private normalizeFrequency(freq: number): number {
    const range = this.maxFrequency - this.minFrequency;
    if (range <= 0) return 0.5;
    return d3.scaleLinear()
      .domain([this.minFrequency, this.maxFrequency])
      .range([0, 1])
      .clamp(true)(freq);
  }

  public getColorScale(): d3.ScaleLinear<string, string> {
    return this.colorScale;
  }

  public getMinMax(): { min: number; max: number } {
    return { min: this.minFrequency, max: this.maxFrequency };
  }
}
