import starsData from './stars.json';
import type { Star, EvolutionPoint, SpectralType, EvolutionStage } from '../types/star';

interface RawStarData {
  id: unknown;
  name: unknown;
  spectralType: unknown;
  temperature: unknown;
  absoluteMagnitude: unknown;
  radius: unknown;
  evolutionStage: unknown;
  mass: unknown;
  luminosity: unknown;
}

interface StarsJson {
  stars: RawStarData[];
}

class StarCatalog {
  private stars: Star[] = [];
  private isLoaded = false;

  async loadStars(): Promise<Star[]> {
    const validSpectralTypes: readonly string[] = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];
    const validStages: readonly string[] = ['main_sequence', 'red_giant', 'white_dwarf'];

    const validStars = (starsData as StarsJson).stars.filter((star: RawStarData) => {
      const spectralType = star.spectralType === 'DA' ? 'A' : star.spectralType;
      return (
        typeof star.id === 'string' &&
        typeof star.name === 'string' &&
        typeof spectralType === 'string' &&
        validSpectralTypes.includes(spectralType) &&
        typeof star.temperature === 'number' &&
        typeof star.absoluteMagnitude === 'number' &&
        typeof star.radius === 'number' &&
        typeof star.evolutionStage === 'string' &&
        validStages.includes(star.evolutionStage) &&
        typeof star.mass === 'number' &&
        typeof star.luminosity === 'number'
      );
    }).map((star: RawStarData) => ({
      ...star,
      spectralType: star.spectralType === 'DA' ? 'A' : star.spectralType
    })) as Star[];

    this.stars = validStars;
    this.isLoaded = true;
    return this.stars;
  }

  getAllStars(): Star[] {
    if (!this.isLoaded) {
      throw new Error('Stars not loaded. Call loadStars() first.');
    }
    return [...this.stars];
  }

  getStarById(id: string): Star | undefined {
    if (!this.isLoaded) {
      throw new Error('Stars not loaded. Call loadStars() first.');
    }
    return this.stars.find(star => star.id === id);
  }

  filterBySpectralType(type: SpectralType): Star[] {
    if (!this.isLoaded) {
      throw new Error('Stars not loaded. Call loadStars() first.');
    }
    if (type === 'ALL') {
      return [...this.stars];
    }
    return this.stars.filter(star => star.spectralType === type);
  }

  getEvolutionPath(starId: string): EvolutionPoint[] {
    const star = this.getStarById(starId);
    if (!star) {
      throw new Error(`Star with id ${starId} not found`);
    }

    const mass = star.mass;
    const massFactor = Math.min(mass / 10, 3);

    const mainSequence: EvolutionPoint = {
      position: { x: 0, y: 0, z: 0 },
      temperature: star.temperature,
      radius: star.radius,
      spectralType: star.spectralType,
      stage: 'main_sequence'
    };

    const subGiant: EvolutionPoint = {
      position: { x: 20, y: 10, z: 5 },
      temperature: star.temperature * 0.7,
      radius: star.radius * 5 * massFactor,
      spectralType: this.mapTemperatureToSpectralType(star.temperature * 0.7),
      stage: 'main_sequence'
    };

    const redGiant: EvolutionPoint = {
      position: { x: 50, y: 40, z: 10 },
      temperature: Math.max(2500, star.temperature * 0.35),
      radius: star.radius * (mass > 8 ? 250 : 120) * massFactor,
      spectralType: this.mapTemperatureToSpectralType(Math.max(2500, star.temperature * 0.35)),
      stage: 'red_giant'
    };

    const heliumFlash: EvolutionPoint = {
      position: { x: 70, y: 25, z: 5 },
      temperature: star.temperature * 1.2,
      radius: star.radius * 20 * massFactor,
      spectralType: this.mapTemperatureToSpectralType(star.temperature * 1.2),
      stage: 'red_giant'
    };

    const coolingDwarf: EvolutionPoint = {
      position: { x: 90, y: -10, z: -5 },
      temperature: Math.max(8000, star.temperature * 2),
      radius: Math.max(0.008, star.radius * 0.012),
      spectralType: this.mapTemperatureToSpectralType(Math.max(8000, star.temperature * 2)),
      stage: 'white_dwarf'
    };

    const whiteDwarf: EvolutionPoint = {
      position: { x: 100, y: -30, z: -10 },
      temperature: Math.max(6000, star.temperature * 1.5),
      radius: Math.max(0.008, star.radius * 0.01),
      spectralType: this.mapTemperatureToSpectralType(Math.max(6000, star.temperature * 1.5)),
      stage: 'white_dwarf'
    };

    const controlPoints: EvolutionPoint[] = [
      mainSequence,
      subGiant,
      redGiant,
      heliumFlash,
      coolingDwarf,
      whiteDwarf
    ];

    return this.catmullRomInterpolate(controlPoints, 25);
  }

  private catmullRomInterpolate(
    controlPoints: EvolutionPoint[],
    pointsPerSegment: number
  ): EvolutionPoint[] {
    if (controlPoints.length < 2) return controlPoints;

    const result: EvolutionPoint[] = [];
    const extendedPoints = [
      this.createVirtualControlPoint(controlPoints[0], controlPoints[1]),
      ...controlPoints,
      this.createVirtualControlPoint(controlPoints[controlPoints.length - 1], controlPoints[controlPoints.length - 2])
    ];

    for (let i = 0; i < extendedPoints.length - 3; i++) {
      const p0 = extendedPoints[i];
      const p1 = extendedPoints[i + 1];
      const p2 = extendedPoints[i + 2];
      const p3 = extendedPoints[i + 3];

      for (let t = 0; t < pointsPerSegment; t++) {
        const s = t / pointsPerSegment;
        const interpolated = this.interpolatePoint(p0, p1, p2, p3, s, i, controlPoints.length - 1);
        
        const isFirstSegment = i === 0;
        const isLastSegment = i === extendedPoints.length - 4;
        
        if (isFirstSegment && t === 0) {
          result.push({ ...controlPoints[0] });
        } else if (!isLastSegment || t < pointsPerSegment - 1) {
          result.push(interpolated);
        }
      }
    }

    result.push({ ...controlPoints[controlPoints.length - 1] });

    return result;
  }

  private createVirtualControlPoint(reference: EvolutionPoint, mirror: EvolutionPoint): EvolutionPoint {
    return {
      position: {
        x: 2 * reference.position.x - mirror.position.x,
        y: 2 * reference.position.y - mirror.position.y,
        z: 2 * reference.position.z - mirror.position.z
      },
      temperature: reference.temperature,
      radius: reference.radius,
      spectralType: reference.spectralType,
      stage: reference.stage
    };
  }

  private interpolatePoint(
    p0: EvolutionPoint,
    p1: EvolutionPoint,
    p2: EvolutionPoint,
    p3: EvolutionPoint,
    t: number,
    segmentIndex: number,
    totalSegments: number
  ): EvolutionPoint {
    const t2 = t * t;
    const t3 = t2 * t;

    const catmullRom = (v0: number, v1: number, v2: number, v3: number): number => {
      return 0.5 * (
        (2 * v1) +
        (-v0 + v2) * t +
        (2 * v0 - 5 * v1 + 4 * v2 - v3) * t2 +
        (-v0 + 3 * v1 - 3 * v2 + v3) * t3
      );
    };

    const x = catmullRom(p0.position.x, p1.position.x, p2.position.x, p3.position.x);
    const y = catmullRom(p0.position.y, p1.position.y, p2.position.y, p3.position.y);
    const z = catmullRom(p0.position.z, p1.position.z, p2.position.z, p3.position.z);

    const temperature = catmullRom(p0.temperature, p1.temperature, p2.temperature, p3.temperature);
    const radius = Math.max(0.008, catmullRom(p0.radius, p1.radius, p2.radius, p3.radius));

    const globalProgress = (segmentIndex + t) / totalSegments;
    let stage: EvolutionStage = 'main_sequence';
    if (globalProgress >= 0.75) {
      stage = 'white_dwarf';
    } else if (globalProgress >= 0.35) {
      stage = 'red_giant';
    }

    return {
      position: { x, y, z },
      temperature: Math.max(2000, temperature),
      radius,
      spectralType: this.mapTemperatureToSpectralType(Math.max(2000, temperature)),
      stage
    };
  }

  mapTemperatureToSpectralType(temperature: number): Exclude<SpectralType, 'ALL'> {
    if (temperature >= 30000) return 'O';
    if (temperature >= 10000) return 'B';
    if (temperature >= 7500) return 'A';
    if (temperature >= 6000) return 'F';
    if (temperature >= 5200) return 'G';
    if (temperature >= 3700) return 'K';
    return 'M';
  }
}

export const starCatalog = new StarCatalog();
export { StarCatalog };
