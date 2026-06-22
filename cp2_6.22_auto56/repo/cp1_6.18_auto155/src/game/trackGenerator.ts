import { Star, Meteor, BackgroundStar, Vector2, GameState } from '../types';

export class TrackGenerator {
  private canvas: HTMLCanvasElement;
  private state: GameState;
  private stars: Star[] = [];
  private meteors: Meteor[] = [];
  private backgroundStars: BackgroundStar[] = [];
  private starSpawnTimer: number = 0;
  private meteorSpawnTimer: number = 0;
  private baseStarInterval: number = 1500;
  private baseMeteorInterval: number = 3000;
  private trackPoints: Vector2[] = [];

  constructor(canvas: HTMLCanvasElement, state: GameState) {
    this.canvas = canvas;
    this.state = state;
    this.initBackgroundStars();
    this.initTrackPoints();
  }

  private initBackgroundStars(): void {
    for (let i = 0; i < 150; i++) {
      this.backgroundStars.push(this.createBackgroundStar(Math.random() * this.canvas.width));
    }
  }

  private createBackgroundStar(x: number): BackgroundStar {
    const colors = ['#FFFFFF', '#88CCFF'];
    return {
      x: x,
      y: Math.random() * this.canvas.height,
      radius: 2 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      twinklePhase: Math.random() * Math.PI * 2
    };
  }

  private initTrackPoints(): void {
    this.trackPoints = [];
    const pointCount = 20;
    for (let i = 0; i < pointCount; i++) {
      this.trackPoints.push({
        x: (i / (pointCount - 1)) * this.canvas.width,
        y: this.canvas.height * 0.5
      });
    }
  }

  update(deltaTime: number): void {
    this.state.trackOffset += this.state.trackSpeed * (deltaTime / 16);
    this.state.curvaturePhase += 0.02;
    this.state.trackCurvature = Math.sin(this.state.curvaturePhase) * 0.02;
    this.state.gameTime += deltaTime;

    this.state.trackSpeed += 0.5 * (deltaTime / 1000);

    this.updateBackgroundStars(deltaTime);
    this.updateTrackPoints();
    this.spawnObjects(deltaTime);
    this.updateStars();
    this.updateMeteors();
  }

  private updateBackgroundStars(deltaTime: number): void {
    const speed = this.state.trackSpeed * 0.3;
    
    for (let i = this.backgroundStars.length - 1; i >= 0; i--) {
      const star = this.backgroundStars[i];
      star.x -= speed * (deltaTime / 16);
      star.twinklePhase += 0.03;

      if (star.x < -10) {
        this.backgroundStars.splice(i, 1);
        this.backgroundStars.push(this.createBackgroundStar(this.canvas.width + 10));
      }
    }
  }

  private updateTrackPoints(): void {
    const centerY = this.canvas.height * 0.5;
    const amplitude = this.canvas.height * 0.15;

    for (let i = 0; i < this.trackPoints.length; i++) {
      const point = this.trackPoints[i];
      const progress = point.x / this.canvas.width;
      point.y = centerY + Math.sin(progress * Math.PI * 2 + this.state.curvaturePhase) * amplitude;
    }
  }

  private spawnObjects(deltaTime: number): void {
    const levelMultiplier = 1 + (this.state.level - 1) * 0.2;

    const starInterval = this.baseStarInterval / (1 + (this.state.level - 1) * 0.1);
    this.starSpawnTimer += deltaTime;
    if (this.starSpawnTimer >= starInterval) {
      this.starSpawnTimer = 0;
      if (Math.random() < 0.7 / levelMultiplier) {
        this.spawnStar();
      }
    }

    const meteorInterval = this.baseMeteorInterval / levelMultiplier;
    this.meteorSpawnTimer += deltaTime;
    if (this.meteorSpawnTimer >= meteorInterval) {
      this.meteorSpawnTimer = 0;
      if (Math.random() < 0.8) {
        this.spawnMeteor();
      }
    }
  }

  private spawnStar(): void {
    const y = this.getTrackY(this.canvas.width + 50);
    const yOffset = (Math.random() - 0.5) * 150;

    this.stars.push({
      x: this.canvas.width + 50,
      y: y + yOffset,
      radius: 20,
      collected: false,
      pulsePhase: Math.random() * Math.PI * 2
    });
  }

  private spawnMeteor(): void {
    const y = this.getTrackY(this.canvas.width + 50);
    const yOffset = (Math.random() - 0.5) * 200;
    const radius = 30 + Math.random() * 20;

    const vertices: Vector2[] = [];
    const vertexCount = 7 + Math.floor(Math.random() * 4);
    for (let i = 0; i < vertexCount; i++) {
      const angle = (i / vertexCount) * Math.PI * 2;
      const r = radius * (0.7 + Math.random() * 0.6);
      vertices.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r
      });
    }

    this.meteors.push({
      x: this.canvas.width + 50,
      y: y + yOffset,
      radius: radius,
      vertices: vertices,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.02
    });
  }

  private getTrackY(x: number): number {
    const centerY = this.canvas.height * 0.5;
    const amplitude = this.canvas.height * 0.15;
    const progress = x / this.canvas.width;
    return centerY + Math.sin(progress * Math.PI * 2 + this.state.curvaturePhase) * amplitude;
  }

  private updateStars(): void {
    for (let i = this.stars.length - 1; i >= 0; i--) {
      const star = this.stars[i];
      star.x -= this.state.trackSpeed;
      star.pulsePhase += 0.05;

      if (star.x < -50 || star.collected) {
        this.stars.splice(i, 1);
      }
    }
  }

  private updateMeteors(): void {
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const meteor = this.meteors[i];
      meteor.x -= this.state.trackSpeed;
      meteor.rotation += meteor.rotationSpeed;

      if (meteor.x < -80) {
        this.meteors.splice(i, 1);
      }
    }
  }

  getStars(): Star[] {
    return this.stars;
  }

  getMeteors(): Meteor[] {
    return this.meteors;
  }

  getBackgroundStars(): BackgroundStar[] {
    return this.backgroundStars;
  }

  getTrackPoints(): Vector2[] {
    return this.trackPoints;
  }

  getTrackYAt(x: number): number {
    return this.getTrackY(x);
  }

  collectStar(star: Star): void {
    star.collected = true;
  }

  reset(): void {
    this.stars = [];
    this.meteors = [];
    this.backgroundStars = [];
    this.starSpawnTimer = 0;
    this.meteorSpawnTimer = 0;
    this.initBackgroundStars();
    this.initTrackPoints();
  }

  resize(): void {
    this.initTrackPoints();
    
    for (const star of this.backgroundStars) {
      star.y = Math.random() * this.canvas.height;
    }
  }
}
