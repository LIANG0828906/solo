import type { GalaxyParticleData } from './GalaxyGenerator';
import type { GalaxyType } from '../utils/colorPalette';

export interface UpdateParams {
  rotationSpeed: number;
  evolutionTime: number;
  deltaTime: number;
  elapsedTime: number;
}

export class ParticleUpdater {
  private particleData: GalaxyParticleData | null = null;
  private galaxyType: GalaxyType = 'spiral';
  private cumulativeAngle = 0;

  setParticleData(data: GalaxyParticleData, type: GalaxyType): void {
    this.particleData = data;
    this.galaxyType = type;
    this.cumulativeAngle = 0;
  }

  update(params: UpdateParams): void {
    if (!this.particleData) return;

    const { rotationSpeed, evolutionTime, deltaTime, elapsedTime } = params;
    const { positions, basePositions, initialAngles, distances, radialSpeeds, armIndices, clusterIDs, count, maxRadius } =
      this.particleData;

    this.cumulativeAngle += rotationSpeed * deltaTime;

    switch (this.galaxyType) {
      case 'spiral':
        this.updateSpiral(positions, basePositions, initialAngles, distances, radialSpeeds, armIndices, count, maxRadius, evolutionTime, elapsedTime);
        break;
      case 'elliptical':
        this.updateElliptical(positions, basePositions, initialAngles, distances, radialSpeeds, count, maxRadius, evolutionTime, elapsedTime);
        break;
      case 'irregular':
        this.updateIrregular(positions, basePositions, initialAngles, distances, radialSpeeds, clusterIDs, count, maxRadius, evolutionTime, elapsedTime);
        break;
    }
  }

  private updateSpiral(
    positions: Float32Array,
    _basePositions: Float32Array,
    initialAngles: Float32Array,
    distances: Float32Array,
    radialSpeeds: Float32Array,
    armIndices: Float32Array,
    count: number,
    maxRadius: number,
    evolutionTime: number,
    elapsedTime: number
  ): void {
    const evolutionFactor = Math.min(evolutionTime / 100, 1);
    const armWinding = evolutionFactor * 0.4;
    const thicknessGrowth = evolutionFactor * 0.3;
    const coreCompression = 1 - evolutionFactor * 0.2;
    const globalRotation = this.cumulativeAngle;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r0 = distances[i];
      const initialAngle = initialAngles[i];
      const isCore = armIndices[i] < 0;

      const r = isCore ? r0 * coreCompression : r0 * (1 + thicknessGrowth * 0.05);
      const t = r / maxRadius;

      const baseSpeed = radialSpeeds[i];
      const diffRotFactor = isCore ? 1.2 : 0.5 + (1 - t) * 0.8;
      const angleOffset = globalRotation * diffRotFactor * baseSpeed;

      const armWind = isCore ? 0 : armWinding * (r / maxRadius) * 3;
      const angle = initialAngle + angleOffset + armWind;

      const verticalOsc = Math.sin(elapsedTime * 0.3 + i * 0.001) * 0.02 * (1 + t);
      const thickness = isCore ? 1 : 1 + thicknessGrowth;

      const x = r * Math.cos(angle);
      const y = _basePositions[i3 + 1] * thickness + verticalOsc;
      const z = r * Math.sin(angle);

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
    }
  }

  private updateElliptical(
    positions: Float32Array,
    _basePositions: Float32Array,
    initialAngles: Float32Array,
    distances: Float32Array,
    radialSpeeds: Float32Array,
    count: number,
    maxRadius: number,
    evolutionTime: number,
    elapsedTime: number
  ): void {
    const evolutionFactor = Math.min(evolutionTime / 100, 1);
    const flattening = 1 + evolutionFactor * 0.25;
    const elongation = 1 + evolutionFactor * 0.15;
    const coreContraction = 1 - evolutionFactor * 0.15;
    const globalRotation = this.cumulativeAngle * 0.6;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r0 = distances[i];
      const initialAngle = initialAngles[i];
      const t = r0 / maxRadius;

      const radialFactor = t < 0.3 ? coreContraction : 1 + evolutionFactor * 0.1;
      const r = r0 * radialFactor;
      const baseSpeed = radialSpeeds[i];

      const rotFactor = 0.3 + (1 - t) * 0.7;
      const angleOffset = globalRotation * rotFactor * baseSpeed;
      const angle = initialAngle + angleOffset;

      const ellipticityX = elongation;
      const ellipticityY = 1 / flattening;
      const ellipticityZ = 1 / (elongation * 0.8);

      const oscAmp = 0.015 * (1 + t * 0.5);
      const xOsc = Math.sin(elapsedTime * 0.25 + i * 0.0013) * oscAmp;
      const yOsc = Math.cos(elapsedTime * 0.3 + i * 0.0017) * oscAmp * 0.6;
      const zOsc = Math.sin(elapsedTime * 0.2 + i * 0.0021) * oscAmp;

      const bx = _basePositions[i3];
      const by = _basePositions[i3 + 1];
      const bz = _basePositions[i3 + 2];

      const rotX = bx * Math.cos(angleOffset) - bz * Math.sin(angleOffset);
      const rotZ = bx * Math.sin(angleOffset) + bz * Math.cos(angleOffset);

      positions[i3] = rotX * ellipticityX * radialFactor + xOsc + (r * 0.02 * Math.cos(angle));
      positions[i3 + 1] = by * ellipticityY * radialFactor + yOsc;
      positions[i3 + 2] = rotZ * ellipticityZ * radialFactor + zOsc + (r * 0.02 * Math.sin(angle));
    }
  }

  private updateIrregular(
    positions: Float32Array,
    _basePositions: Float32Array,
    initialAngles: Float32Array,
    distances: Float32Array,
    radialSpeeds: Float32Array,
    clusterIDs: Float32Array,
    count: number,
    maxRadius: number,
    evolutionTime: number,
    elapsedTime: number
  ): void {
    const evolutionFactor = Math.min(evolutionTime / 100, 1);
    const expansion = 1 + evolutionFactor * 0.35;
    const turbulence = evolutionFactor * 0.08;
    const globalRotation = this.cumulativeAngle * 0.3;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r0 = distances[i];
      const initialAngle = initialAngles[i];
      const t = r0 / maxRadius;
      const isInCluster = clusterIDs[i] >= 0;
      const clusterID = isInCluster ? clusterIDs[i] : 0;

      const baseSpeed = radialSpeeds[i];
      const rotFactor = isInCluster ? 0.6 : 0.2 + (1 - t) * 0.5;
      const angleOffset = globalRotation * rotFactor * baseSpeed;
      const angle = initialAngle + angleOffset;

      const bx = _basePositions[i3];
      const by = _basePositions[i3 + 1];
      const bz = _basePositions[i3 + 2];

      const turbFreq = isInCluster ? 0.4 : 0.2;
      const turbAmp = turbulence * (isInCluster ? 0.5 + (clusterID % 3) * 0.2 : 1);
      const phase = i * 0.003 + clusterID * 2.5;

      const turbX = Math.sin(elapsedTime * turbFreq + phase) * turbAmp * (1 + t);
      const turbY = Math.cos(elapsedTime * turbFreq * 0.7 + phase * 1.3) * turbAmp * 0.7;
      const turbZ = Math.sin(elapsedTime * turbFreq * 1.1 + phase * 0.8) * turbAmp * (1 + t * 0.5);

      const expansionFactor = expansion * (isInCluster ? 0.6 : 1);
      const rotCos = Math.cos(angleOffset * 0.3);
      const rotSin = Math.sin(angleOffset * 0.3);

      const rx = bx * rotCos - bz * rotSin;
      const rz = bx * rotSin + bz * rotCos;

      const clusterBounce = isInCluster
        ? Math.sin(elapsedTime * 0.5 + clusterID) * 0.015 * (1 - t * 0.5)
        : 0;

      positions[i3] = rx * expansionFactor + turbX + clusterBounce * Math.cos(angle);
      positions[i3 + 1] = by * expansionFactor + turbY + clusterBounce * 0.5;
      positions[i3 + 2] = rz * expansionFactor + turbZ + clusterBounce * Math.sin(angle);
    }
  }

  getCumulativeAngle(): number {
    return this.cumulativeAngle;
  }
}
