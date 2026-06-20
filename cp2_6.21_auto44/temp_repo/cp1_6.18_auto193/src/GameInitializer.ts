import type { GameState, Planet, Asteroid, Spaceship } from './types';
import { MathUtils } from './utils/MathUtils';

const PLANET_COLORS = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6C5CE7', '#A29BFE'];

export class GameInitializer {
  static createInitialState(): GameState {
    const width = window.innerWidth;
    const height = window.innerHeight;

    return {
      status: 'playing',
      score: 0,
      spaceship: this.createSpaceship(width, height),
      planets: this.createPlanets(width, height),
      asteroids: this.createAsteroids(width, height),
      particles: [],
      finishLineX: width - 80,
      slingshotEvents: []
    };
  }

  private static createSpaceship(_width: number, height: number): Spaceship {
    return {
      position: { x: 100, y: height / 2 },
      velocity: { x: 1, y: 0 },
      angle: 0,
      thrust: 0,
      isInGravityWell: false,
      trail: []
    };
  }

  private static createPlanets(width: number, height: number): Planet[] {
    const planets: Planet[] = [];
    const centerY = height / 2;
    const usableWidth = width - 300;

    for (let i = 0; i < 5; i++) {
      const orbitCenterX = 200 + (i + 1) * (usableWidth / 6);
      const orbitCenterY = centerY + MathUtils.random(-100, 100);
      const semiMajor = MathUtils.random(80, 150);
      const semiMinor = semiMajor * MathUtils.random(0.6, 0.9);
      const radius = MathUtils.random(30, 80);
      const initialAngle = MathUtils.random(0, Math.PI * 2);

      planets.push({
        id: i,
        position: {
          x: orbitCenterX + Math.cos(initialAngle) * semiMajor,
          y: orbitCenterY + Math.sin(initialAngle) * semiMinor
        },
        radius,
        color: PLANET_COLORS[i % PLANET_COLORS.length],
        orbit: {
          centerX: orbitCenterX,
          centerY: orbitCenterY,
          semiMajor,
          semiMinor,
          angle: initialAngle,
          speed: MathUtils.random(0.003, 0.008) * (Math.random() > 0.5 ? 1 : -1)
        },
        gravityWell: {
          radius: radius * 3,
          strength: 1.5
        },
        rotation: 0
      });
    }

    return planets;
  }

  private static createAsteroids(width: number, height: number): Asteroid[] {
    const asteroids: Asteroid[] = [];
    const startX = 200;
    const endX = width - 150;

    for (let i = 0; i < 30; i++) {
      const radius = MathUtils.random(10, 25);
      const vertexCount = MathUtils.randomInt(6, 10);
      const vertices: { x: number; y: number }[] = [];

      for (let j = 0; j < vertexCount; j++) {
        const angle = (j / vertexCount) * Math.PI * 2;
        const r = radius * MathUtils.random(0.7, 1.2);
        vertices.push({
          x: Math.cos(angle) * r,
          y: Math.sin(angle) * r
        });
      }

      const speed = MathUtils.random(0.5, 1.5);
      const angle = MathUtils.random(0, Math.PI * 2);

      asteroids.push({
        id: i,
        position: {
          x: MathUtils.random(startX, endX),
          y: MathUtils.random(80, height - 80)
        },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        },
        radius,
        vertices,
        color: `rgb(${MathUtils.random(90, 139)}, ${MathUtils.random(90, 139)}, ${MathUtils.random(90, 139)})`
      });
    }

    return asteroids;
  }
}
