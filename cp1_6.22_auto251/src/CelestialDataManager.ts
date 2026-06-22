import * as THREE from 'three';
import type { CelestialBody } from './types';

export class CelestialDataManager {
  private static instance: CelestialDataManager | null = null;
  private bodies: Map<string, CelestialBody>;
  private readonly AU_SCALE = 20;

  private constructor() {
    this.bodies = new Map();
    this.initializeBodies();
  }

  public static getInstance(): CelestialDataManager {
    if (!CelestialDataManager.instance) {
      CelestialDataManager.instance = new CelestialDataManager();
    }
    return CelestialDataManager.instance;
  }

  private initializeBodies(): void {
    const bodies: CelestialBody[] = [
      {
        id: 'sun',
        name: '太阳',
        englishName: 'Sun',
        type: 'sun',
        radius: 696340,
        color: 0xfdb813,
        orbit: {
          semiMajorAxis: 0,
          eccentricity: 0,
          inclination: 0,
          ascendingNode: 0,
          perihelion: 0,
          period: 0,
        },
        rotation: { period: 609.12 },
        physical: {
          mass: 1.989e30,
          density: 1.408,
          temperature: [5778, 5778],
          moons: 0,
        },
      },
      {
        id: 'mercury',
        name: '水星',
        englishName: 'Mercury',
        type: 'planet',
        radius: 2439.7,
        color: 0x8c7853,
        orbit: {
          semiMajorAxis: 0.387,
          eccentricity: 0.2056,
          inclination: 7.005,
          ascendingNode: 48.331,
          perihelion: 29.124,
          period: 87.97,
        },
        rotation: { period: 1407.6 },
        physical: {
          mass: 3.285e23,
          density: 5.427,
          temperature: [100, 700],
          moons: 0,
        },
      },
      {
        id: 'venus',
        name: '金星',
        englishName: 'Venus',
        type: 'planet',
        radius: 6051.8,
        color: 0xffc649,
        orbit: {
          semiMajorAxis: 0.723,
          eccentricity: 0.0067,
          inclination: 3.395,
          ascendingNode: 76.68,
          perihelion: 54.884,
          period: 224.7,
        },
        rotation: { period: 5832.6 },
        physical: {
          mass: 4.867e24,
          density: 5.243,
          temperature: [737, 737],
          moons: 0,
        },
      },
      {
        id: 'earth',
        name: '地球',
        englishName: 'Earth',
        type: 'planet',
        radius: 6371,
        color: 0x6b93d6,
        orbit: {
          semiMajorAxis: 1,
          eccentricity: 0.0167,
          inclination: 0,
          ascendingNode: 174.873,
          perihelion: 102.947,
          period: 365.26,
        },
        rotation: { period: 23.93 },
        physical: {
          mass: 5.972e24,
          density: 5.513,
          temperature: [184, 330],
          moons: 1,
        },
      },
      {
        id: 'mars',
        name: '火星',
        englishName: 'Mars',
        type: 'planet',
        radius: 3389.5,
        color: 0xc1440e,
        orbit: {
          semiMajorAxis: 1.524,
          eccentricity: 0.0934,
          inclination: 1.85,
          ascendingNode: 49.558,
          perihelion: 286.502,
          period: 686.98,
        },
        rotation: { period: 24.62 },
        physical: {
          mass: 6.39e23,
          density: 3.933,
          temperature: [130, 308],
          moons: 2,
        },
      },
      {
        id: 'jupiter',
        name: '木星',
        englishName: 'Jupiter',
        type: 'planet',
        radius: 69911,
        color: 0xd8ca9d,
        orbit: {
          semiMajorAxis: 5.204,
          eccentricity: 0.049,
          inclination: 1.303,
          ascendingNode: 100.492,
          perihelion: 273.867,
          period: 4332.82,
        },
        rotation: { period: 9.93 },
        physical: {
          mass: 1.898e27,
          density: 1.326,
          temperature: [110, 165],
          moons: 95,
        },
      },
      {
        id: 'saturn',
        name: '土星',
        englishName: 'Saturn',
        type: 'planet',
        radius: 58232,
        color: 0xf4d59e,
        orbit: {
          semiMajorAxis: 9.582,
          eccentricity: 0.0565,
          inclination: 2.489,
          ascendingNode: 113.642,
          perihelion: 339.392,
          period: 10755.7,
        },
        rotation: { period: 10.66 },
        physical: {
          mass: 5.683e26,
          density: 0.687,
          temperature: [84, 134],
          moons: 146,
        },
      },
      {
        id: 'uranus',
        name: '天王星',
        englishName: 'Uranus',
        type: 'planet',
        radius: 25362,
        color: 0xd1e7e7,
        orbit: {
          semiMajorAxis: 19.201,
          eccentricity: 0.0457,
          inclination: 0.773,
          ascendingNode: 74.016,
          perihelion: 98.999,
          period: 30688.5,
        },
        rotation: { period: 17.24 },
        physical: {
          mass: 8.681e25,
          density: 1.27,
          temperature: [47, 76],
          moons: 27,
        },
      },
      {
        id: 'neptune',
        name: '海王星',
        englishName: 'Neptune',
        type: 'planet',
        radius: 24622,
        color: 0x5b5ddf,
        orbit: {
          semiMajorAxis: 30.047,
          eccentricity: 0.0113,
          inclination: 1.77,
          ascendingNode: 131.784,
          perihelion: 276.336,
          period: 60182,
        },
        rotation: { period: 16.11 },
        physical: {
          mass: 1.024e26,
          density: 1.638,
          temperature: [55, 72],
          moons: 16,
        },
      },
    ];

    bodies.forEach((body) => this.bodies.set(body.id, body));
  }

  public getBody(id: string): CelestialBody | undefined {
    return this.bodies.get(id);
  }

  public getAllBodies(): CelestialBody[] {
    return Array.from(this.bodies.values());
  }

  public getPlanets(): CelestialBody[] {
    return this.getAllBodies().filter((body) => body.type === 'planet');
  }

  public calculatePosition(bodyId: string, time: number): THREE.Vector3 {
    const body = this.bodies.get(bodyId);
    if (!body || body.type === 'sun') {
      return new THREE.Vector3(0, 0, 0);
    }

    const { semiMajorAxis: a, eccentricity: e, inclination: i, ascendingNode: Ω, perihelion: ω, period: T } = body.orbit;

    const degToRad = Math.PI / 180;
    const iRad = i * degToRad;
    const ΩRad = Ω * degToRad;
    const ωRad = ω * degToRad;

    const M = 2 * Math.PI * (time / T);

    let E = M;
    for (let iter = 0; iter < 5; iter++) {
      E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    }

    const sinE2 = Math.sin(E / 2);
    const cosE2 = Math.cos(E / 2);
    const sqrt1e = Math.sqrt(1 + e);
    const sqrt1_e = Math.sqrt(1 - e);
    const ν = 2 * Math.atan2(sqrt1e * sinE2, sqrt1_e * cosE2);

    const r = (a * (1 - e * e)) / (1 + e * Math.cos(ν));

    const xOrbit = r * Math.cos(ν);
    const yOrbit = r * Math.sin(ν);

    const cosω = Math.cos(ωRad);
    const sinω = Math.sin(ωRad);
    const cosΩ = Math.cos(ΩRad);
    const sinΩ = Math.sin(ΩRad);
    const cosi = Math.cos(iRad);
    const sini = Math.sin(iRad);

    const x = (cosω * cosΩ - sinω * sinΩ * cosi) * xOrbit + (-sinω * cosΩ - cosω * sinΩ * cosi) * yOrbit;
    const y = (cosω * sinΩ + sinω * cosΩ * cosi) * xOrbit + (-sinω * sinΩ + cosω * cosΩ * cosi) * yOrbit;
    const z = sinω * sini * xOrbit + cosω * sini * yOrbit;

    return new THREE.Vector3(x * this.AU_SCALE, z * this.AU_SCALE, -y * this.AU_SCALE);
  }
}
