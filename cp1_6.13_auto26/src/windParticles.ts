import * as THREE from 'three';
import { eventBus, EVENTS } from './eventBus';
import { dataManager, WindDataPoint } from './dataManager';

interface ParticleData {
  posX: number;
  posY: number;
  posZ: number;
  velX: number;
  velY: number;
  velZ: number;
  temperature: number;
  age: number;
  lifeTime: number;
  trailHead: number;
}

export class WindParticles {
  private scene: THREE.Scene;
  private earthRadius: number = 1;
  private particleCount: number = 5000;
  private trailLength: number = 4;
  private altitude: number = 1000;
  private altitudeFactor: number = 0.02;

  private particles: ParticleData[] = [];
  private trailPositionsX: Float32Array;
  private trailPositionsY: Float32Array;
  private trailPositionsZ: Float32Array;

  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private points: THREE.Points;

  private trailGeometry: THREE.BufferGeometry;
  private trailMaterial: THREE.LineBasicMaterial;
  private trailLines: THREE.LineSegments;

  private positions: Float32Array;
  private colors: Float32Array;
  private trailPositions: Float32Array;
  private trailColors: Float32Array;

  private fadeOpacity: number = 1;
  private targetOpacity: number = 1;
  private isTransitioning: boolean = false;
  private transitionTime: number = 0;
  private transitionDuration: number = 0.6;

  private coldR = 0.125;
  private coldG = 0.376;
  private coldB = 1.0;
  private warmR = 1.0;
  private warmG = 0.251;
  private warmB = 0.251;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.particleCount = dataManager.getParticleCount();

    this.positions = new Float32Array(this.particleCount * 3);
    this.colors = new Float32Array(this.particleCount * 3);

    const trailSegmentCount = this.particleCount * (this.trailLength - 1) * 2;
    this.trailPositions = new Float32Array(trailSegmentCount * 3);
    this.trailColors = new Float32Array(trailSegmentCount * 3);

    this.trailPositionsX = new Float32Array(this.particleCount * this.trailLength);
    this.trailPositionsY = new Float32Array(this.particleCount * this.trailLength);
    this.trailPositionsZ = new Float32Array(this.particleCount * this.trailLength);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    this.material = new THREE.PointsMaterial({
      size: 0.015,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);

    this.trailGeometry = new THREE.BufferGeometry();
    this.trailGeometry.setAttribute('position', new THREE.BufferAttribute(this.trailPositions, 3));
    this.trailGeometry.setAttribute('color', new THREE.BufferAttribute(this.trailColors, 3));

    this.trailMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.trailLines = new THREE.LineSegments(this.trailGeometry, this.trailMaterial);
    this.scene.add(this.trailLines);

    this.initParticles();
    this.setupEventListeners();
    this.updateParticleGeometry();

    eventBus.emit(EVENTS.PARTICLES_READY);
  }

  private setupEventListeners(): void {
    eventBus.on(EVENTS.ALTITUDE_CHANGED, (altitude) => {
      this.switchAltitude(altitude as number);
    });

    eventBus.on(EVENTS.WIND_DATA_UPDATED, (altitude) => {
      if (altitude === this.altitude) {
        this.updateFromData();
      }
    });
  }

  private initParticles(): void {
    const dataset = dataManager.getWindData(this.altitude);
    if (!dataset) return;

    this.particles = new Array(this.particleCount);

    for (let i = 0; i < this.particleCount; i++) {
      const dataPoint = dataset.points[i % dataset.points.length];
      this.particles[i] = this.createParticle(dataPoint, i);
      this.particles[i].age = Math.random() * this.particles[i].lifeTime;
    }
  }

  private createParticle(dataPoint: WindDataPoint, index: number): ParticleData {
    const altitudeRadius = this.earthRadius * (1 + this.altitudeFactor * (this.altitude / 1000));

    const { x: posX, y: posY, z: posZ } = this.latLonToVector(
      dataPoint.longitude,
      dataPoint.latitude,
      altitudeRadius
    );

    const { x: velX, y: velY, z: velZ } = this.calculateVelocity(
      dataPoint.longitude,
      dataPoint.latitude,
      dataPoint.windDirection,
      dataPoint.windSpeed,
      altitudeRadius
    );

    const baseIdx = index * this.trailLength;
    for (let i = 0; i < this.trailLength; i++) {
      this.trailPositionsX[baseIdx + i] = posX;
      this.trailPositionsY[baseIdx + i] = posY;
      this.trailPositionsZ[baseIdx + i] = posZ;
    }

    return {
      posX,
      posY,
      posZ,
      velX,
      velY,
      velZ,
      temperature: dataPoint.temperature,
      age: 0,
      lifeTime: 3 + Math.random() * 2,
      trailHead: 0,
    };
  }

  private latLonToVector(lon: number, lat: number, radius: number): { x: number; y: number; z: number } {
    const cosLat = Math.cos(lat);
    return {
      x: radius * cosLat * Math.cos(lon),
      y: radius * Math.sin(lat),
      z: radius * cosLat * Math.sin(lon),
    };
  }

  private calculateVelocity(
    lon: number,
    lat: number,
    direction: number,
    speed: number,
    _radius: number
  ): { x: number; y: number; z: number } {
    const speedFactor = speed * 0.0003;
    const sinLon = Math.sin(lon);
    const cosLon = Math.cos(lon);
    const sinLat = Math.sin(lat);
    const cosLat = Math.cos(lat);

    const eNX = -sinLon;
    const eNY = 0;
    const eNZ = cosLon;

    const nNX = -sinLat * cosLon;
    const nNY = cosLat;
    const nNZ = -sinLat * sinLon;

    const sinDir = Math.sin(direction);
    const cosDir = Math.cos(direction);

    return {
      x: (eNX * sinDir + nNX * cosDir) * speedFactor,
      y: (eNY * sinDir + nNY * cosDir) * speedFactor,
      z: (eNZ * sinDir + nNZ * cosDir) * speedFactor,
    };
  }

  private updateParticleGeometry(): void {
    const posArr = this.positions;
    const colArr = this.colors;
    const tPosArr = this.trailPositions;
    const tColArr = this.trailColors;
    const tX = this.trailPositionsX;
    const tY = this.trailPositionsY;
    const tZ = this.trailPositionsZ;

    const particles = this.particles;
    const trailLen = this.trailLength;
    const coldR = this.coldR;
    const coldG = this.coldG;
    const coldB = this.coldB;
    const warmR = this.warmR;
    const warmG = this.warmG;
    const warmB = this.warmB;
    const minTemp = -20;
    const maxTemp = 40;
    const tempRange = maxTemp - minTemp;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const i3 = i * 3;

      posArr[i3] = p.posX;
      posArr[i3 + 1] = p.posY;
      posArr[i3 + 2] = p.posZ;

      const tempNorm = Math.max(0, Math.min(1, (p.temperature - minTemp) / tempRange));
      const r = coldR + (warmR - coldR) * tempNorm;
      const g = coldG + (warmG - coldG) * tempNorm;
      const b = coldB + (warmB - coldB) * tempNorm;

      colArr[i3] = r;
      colArr[i3 + 1] = g;
      colArr[i3 + 2] = b;

      const baseTrailIdx = i * (trailLen - 1) * 2 * 3;
      const baseArrIdx = i * trailLen;

      for (let j = 0; j < trailLen - 1; j++) {
        const alpha = 1 - j / trailLen;
        const alpha2 = alpha * 0.4;
        const idx1 = baseArrIdx + j;
        const idx2 = baseArrIdx + j + 1;
        const tIdx = baseTrailIdx + j * 6;

        tPosArr[tIdx] = tX[idx1];
        tPosArr[tIdx + 1] = tY[idx1];
        tPosArr[tIdx + 2] = tZ[idx1];
        tColArr[tIdx] = r * alpha;
        tColArr[tIdx + 1] = g * alpha;
        tColArr[tIdx + 2] = b * alpha;

        tPosArr[tIdx + 3] = tX[idx2];
        tPosArr[tIdx + 4] = tY[idx2];
        tPosArr[tIdx + 5] = tZ[idx2];
        tColArr[tIdx + 3] = r * alpha2;
        tColArr[tIdx + 4] = g * alpha2;
        tColArr[tIdx + 5] = b * alpha2;
      }
    }

    (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    (this.trailGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.trailGeometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  }

  public update(deltaTime: number): void {
    if (this.isTransitioning) {
      this.transitionTime += deltaTime;
      const t = Math.min(1, this.transitionTime / this.transitionDuration);
      const easeT = 1 - (1 - t) * (1 - t) * (1 - t);
      this.fadeOpacity = this.targetOpacity === 1 ? easeT : 1 - easeT;

      this.material.opacity = this.fadeOpacity;
      this.trailMaterial.opacity = this.fadeOpacity * 0.5;

      if (t >= 1) {
        this.isTransitioning = false;
        if (this.targetOpacity === 0) {
          this.initParticles();
          this.targetOpacity = 1;
          this.transitionTime = 0;
          this.isTransitioning = true;
        }
      }
    }

    const targetRadius = this.earthRadius * (1 + this.altitudeFactor * (this.altitude / 1000));
    const dt = deltaTime * 60;
    const particles = this.particles;
    const trailLen = this.trailLength;
    const tX = this.trailPositionsX;
    const tY = this.trailPositionsY;
    const tZ = this.trailPositionsZ;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.age += deltaTime;

      if (p.age >= p.lifeTime) {
        this.resetParticle(i);
        continue;
      }

      const baseIdx = i * trailLen;

      for (let j = trailLen - 1; j > 0; j--) {
        tX[baseIdx + j] = tX[baseIdx + j - 1];
        tY[baseIdx + j] = tY[baseIdx + j - 1];
        tZ[baseIdx + j] = tZ[baseIdx + j - 1];
      }
      tX[baseIdx] = p.posX;
      tY[baseIdx] = p.posY;
      tZ[baseIdx] = p.posZ;

      p.posX += p.velX * dt;
      p.posY += p.velY * dt;
      p.posZ += p.velZ * dt;

      const distSq = p.posX * p.posX + p.posY * p.posY + p.posZ * p.posZ;
      const targetSq = targetRadius * targetRadius;
      const diff = Math.abs(distSq - targetSq);

      if (diff > 0.002 * targetRadius) {
        const dist = Math.sqrt(distSq);
        const scale = targetRadius / dist;
        p.posX *= scale;
        p.posY *= scale;
        p.posZ *= scale;
      }
    }

    this.updateParticleGeometry();
  }

  private resetParticle(index: number): void {
    const dataset = dataManager.getWindData(this.altitude);
    if (!dataset) return;

    const randomIndex = Math.floor(Math.random() * dataset.points.length);
    const dataPoint = dataset.points[randomIndex];

    const altitudeRadius = this.earthRadius * (1 + this.altitudeFactor * (this.altitude / 1000));
    const { x: posX, y: posY, z: posZ } = this.latLonToVector(
      dataPoint.longitude,
      dataPoint.latitude,
      altitudeRadius
    );
    const { x: velX, y: velY, z: velZ } = this.calculateVelocity(
      dataPoint.longitude,
      dataPoint.latitude,
      dataPoint.windDirection,
      dataPoint.windSpeed,
      altitudeRadius
    );

    const p = this.particles[index];
    p.posX = posX;
    p.posY = posY;
    p.posZ = posZ;
    p.velX = velX;
    p.velY = velY;
    p.velZ = velZ;
    p.temperature = dataPoint.temperature;
    p.age = 0;
    p.lifeTime = 3 + Math.random() * 2;

    const baseIdx = index * this.trailLength;
    for (let i = 0; i < this.trailLength; i++) {
      this.trailPositionsX[baseIdx + i] = posX;
      this.trailPositionsY[baseIdx + i] = posY;
      this.trailPositionsZ[baseIdx + i] = posZ;
    }
  }

  private updateFromData(): void {
  }

  private switchAltitude(altitude: number): void {
    if (altitude === this.altitude) return;

    this.altitude = altitude;
    this.targetOpacity = 0;
    this.transitionTime = 0;
    this.isTransitioning = true;
  }

  public getAltitude(): number {
    return this.altitude;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.trailGeometry.dispose();
    this.trailMaterial.dispose();
    this.scene.remove(this.points);
    this.scene.remove(this.trailLines);
  }
}
