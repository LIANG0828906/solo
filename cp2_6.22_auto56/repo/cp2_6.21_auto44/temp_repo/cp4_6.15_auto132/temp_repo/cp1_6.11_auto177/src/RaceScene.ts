import { GameManager } from './GameManager';

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface TrackPoint {
  x: number;
  y: number;
  z: number;
  angle: number;
}

interface Obstacle {
  x: number;
  y: number;
  z: number;
  radius: number;
  rotation: number;
  rotationSpeed: number;
}

interface Gate {
  index: number;
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  passed: boolean;
  glowTimer: number;
  floatTexts: FloatText[];
}

interface FloatText {
  text: string;
  x: number;
  y: number;
  z: number;
  life: number;
  maxLife: number;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface Cloud {
  x: number;
  y: number;
  z: number;
  scale: number;
  speed: number;
}

interface FloatingIsland {
  x: number;
  y: number;
  z: number;
  scale: number;
}

export class RaceScene {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameManager: GameManager;
  
  private camera: Vec3 = { x: 0, y: 2, z: 0 };
  private cameraAngle: number = 0;
  private cameraPitch: number = 0;
  
  private playerPos: Vec3 = { x: 0, y: 2, z: 0 };
  private playerVel: Vec3 = { x: 0, y: 0, z: 0 };
  private playerAngle: number = 0;
  private playerPitch: number = 0;
  private playerRoll: number = 0;
  
  private speed: number = 0;
  private maxSpeed: number = 15;
  private turningSpeed: number = 2;
  private climbRate: number = 5;
  
  private keys: Set<string> = new Set();
  
  private trackPoints: TrackPoint[] = [];
  private trackLength: number = 0;
  
  private obstacles: Obstacle[] = [];
  private gates: Gate[] = [];
  
  private particles: Particle[] = [];
  private maxParticles: number = 300;
  
  private clouds: Cloud[] = [];
  private islands: FloatingIsland[] = [];
  
  private propellerRotation: number = 0;
  
  private currentTrackIndex: number = 0;
  private distanceAlongTrack: number = 0;
  
  private minHeight: number = 1;
  private maxHeight: number = 15;
  
  private collisionCooldown: number = 0;
  private screenShake: number = 0;
  
  private noiseCanvas: HTMLCanvasElement;
  
  private finished: boolean = false;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.gameManager = GameManager.getInstance();
    
    this.noiseCanvas = document.createElement('canvas');
    this.generateNoiseTexture();
    
    this.initializeTrack();
    this.initializeObstacles();
    this.initializeGates();
    this.initializeClouds();
    this.initializeIslands();
    this.updateStatsFromAircraft();
  }
  
  private generateNoiseTexture(): void {
    this.noiseCanvas.width = 128;
    this.noiseCanvas.height = 128;
    const ctx = this.noiseCanvas.getContext('2d')!;
    const imageData = ctx.createImageData(128, 128);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const value = Math.random() * 255;
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
      data[i + 3] = 255;
    }
    
    ctx.putImageData(imageData, 0, 0);
  }
  
  private initializeTrack(): void {
    const numPoints = 40;
    const radius = 30;
    
    for (let i = 0; i < numPoints; i++) {
      const t = (i / numPoints) * Math.PI * 2;
      const wobble = Math.sin(t * 3) * 5;
      const heightWobble = Math.sin(t * 2) * 3 + 3;
      
      this.trackPoints.push({
        x: Math.cos(t) * (radius + wobble),
        y: heightWobble,
        z: Math.sin(t) * (radius + wobble),
        angle: t + Math.PI / 2
      });
    }
    
    this.trackLength = 0;
    for (let i = 0; i < this.trackPoints.length; i++) {
      const p1 = this.trackPoints[i];
      const p2 = this.trackPoints[(i + 1) % this.trackPoints.length];
      this.trackLength += this.distance3D(p1, p2);
    }
  }
  
  private initializeObstacles(): void {
    const numObstacles = 10;
    
    for (let i = 0; i < numObstacles; i++) {
      const t = (i / numObstacles) * Math.PI * 2 + Math.random() * 0.5;
      const trackIndex = Math.floor((t / (Math.PI * 2)) * this.trackPoints.length);
      const trackPoint = this.trackPoints[trackIndex % this.trackPoints.length];
      
      const offsetAngle = trackPoint.angle + (Math.random() - 0.5) * Math.PI * 0.6;
      const offsetDist = 2 + Math.random() * 3;
      
      this.obstacles.push({
        x: trackPoint.x + Math.cos(offsetAngle) * offsetDist,
        y: trackPoint.y + 2 + Math.random() * 3,
        z: trackPoint.z + Math.sin(offsetAngle) * offsetDist,
        radius: 0.5 + Math.random() * 0.7,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: 0.1 + Math.random() * 0.2
      });
    }
  }
  
  private initializeGates(): void {
    const gatePositions = [0.15, 0.5, 0.85];
    
    for (let i = 0; i < 3; i++) {
      const t = gatePositions[i] * this.trackPoints.length;
      const index = Math.floor(t) % this.trackPoints.length;
      const point = this.trackPoints[index];
      
      this.gates.push({
        index: i,
        x: point.x,
        y: point.y + 1.5,
        z: point.z,
        width: 4,
        height: 6,
        passed: false,
        glowTimer: 0,
        floatTexts: []
      });
    }
  }
  
  private initializeClouds(): void {
    for (let i = 0; i < 15; i++) {
      this.clouds.push({
        x: (Math.random() - 0.5) * 100,
        y: 8 + Math.random() * 15,
        z: (Math.random() - 0.5) * 100,
        scale: 2 + Math.random() * 4,
        speed: 0.2 + Math.random() * 0.3
      });
    }
  }
  
  private initializeIslands(): void {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * 30;
      
      this.islands.push({
        x: Math.cos(angle) * dist,
        y: -2 + Math.random() * 4,
        z: Math.sin(angle) * dist,
        scale: 3 + Math.random() * 5
      });
    }
  }
  
  public resetRace(): void {
    this.gameManager.resetRace();
    this.finished = false;
    
    const startPoint = this.trackPoints[0];
    this.playerPos = { ...startPoint };
    this.playerPos.y += 2;
    this.playerVel = { x: 0, y: 0, z: 0 };
    this.playerAngle = startPoint.angle;
    this.playerPitch = 0;
    this.playerRoll = 0;
    this.speed = 0;
    
    this.cameraAngle = this.playerAngle;
    this.cameraPitch = 0;
    
    this.currentTrackIndex = 0;
    this.distanceAlongTrack = 0;
    
    this.gates.forEach(g => {
      g.passed = false;
      g.glowTimer = 0;
      g.floatTexts = [];
    });
    
    this.particles = [];
    this.collisionCooldown = 0;
    this.screenShake = 0;
    
    this.updateStatsFromAircraft();
  }
  
  private updateStatsFromAircraft(): void {
    const stats = this.gameManager.aircraftStats;
    this.maxSpeed = 8 + (stats.speed / 100) * 12;
    this.turningSpeed = 1 + (stats.turning / 100) * 2;
    this.climbRate = 3 + (stats.climb / 100) * 5;
  }
  
  public update(dt: number): void {
    if (this.gameManager.currentPhase !== 'race') return;
    if (this.finished) return;
    
    this.gameManager.raceTime += dt * 1000;
    
    this.handleInput(dt);
    this.updatePlayer(dt);
    this.updateCamera(dt);
    this.checkTrackPosition();
    this.checkGateCollision();
    this.checkObstacleCollision(dt);
    this.updateParticles(dt);
    this.updateClouds(dt);
    this.updatePropeller(dt);
    this.updateGateEffects(dt);
    
    if (this.collisionCooldown > 0) {
      this.collisionCooldown -= dt;
    }
    
    if (this.screenShake > 0) {
      this.screenShake -= dt * 5;
      if (this.screenShake < 0) this.screenShake = 0;
    }
    
    if (Math.random() < 0.5) {
      this.spawnTrailParticle();
    }
  }
  
  private handleInput(dt: number): void {
    if (this.keys.has('w') || this.keys.has('W')) {
      this.speed = Math.min(this.speed + 8 * dt, this.maxSpeed);
    }
    if (this.keys.has('s') || this.keys.has('S')) {
      this.speed = Math.max(this.speed - 10 * dt, -this.maxSpeed * 0.3);
    }
    
    if (this.keys.has('a') || this.keys.has('A')) {
      this.playerAngle += this.turningSpeed * dt;
      this.playerRoll = Math.min(this.playerRoll + dt * 3, 0.5);
    } else if (this.keys.has('d') || this.keys.has('D')) {
      this.playerAngle -= this.turningSpeed * dt;
      this.playerRoll = Math.max(this.playerRoll - dt * 3, -0.5);
    } else {
      this.playerRoll *= 0.95;
    }
    
    if (this.keys.has('q') || this.keys.has('Q')) {
      this.playerPitch = Math.min(this.playerPitch + dt * 2, 0.5);
    } else if (this.keys.has('e') || this.keys.has('E')) {
      this.playerPitch = Math.max(this.playerPitch - dt * 2, -0.5);
    } else {
      this.playerPitch *= 0.9;
    }
  }
  
  private updatePlayer(dt: number): void {
    const forwardX = -Math.sin(this.playerAngle) * Math.cos(this.playerPitch);
    const forwardY = Math.sin(this.playerPitch);
    const forwardZ = -Math.cos(this.playerAngle) * Math.cos(this.playerPitch);
    
    this.playerPos.x += forwardX * this.speed * dt;
    this.playerPos.y += forwardY * this.speed * dt;
    this.playerPos.z += forwardZ * this.speed * dt;
    
    this.playerPos.y = Math.max(this.minHeight, Math.min(this.maxHeight, this.playerPos.y));
    
    if (this.playerPos.y <= this.minHeight) {
      this.speed *= 0.98;
    }
  }
  
  private updateCamera(dt: number): void {
    const followDist = 0.5;
    const targetX = this.playerPos.x - Math.sin(this.playerAngle) * followDist;
    const targetZ = this.playerPos.z - Math.cos(this.playerAngle) * followDist;
    const targetY = this.playerPos.y + 0.2;
    
    this.camera.x += (targetX - this.camera.x) * 0.3;
    this.camera.y += (targetY - this.camera.y) * 0.3;
    this.camera.z += (targetZ - this.camera.z) * 0.3;
    
    this.cameraAngle += (this.playerAngle - this.cameraAngle) * 0.2;
    this.cameraPitch += (this.playerPitch * 0.3 - this.cameraPitch) * 0.15;
  }
  
  private checkTrackPosition(): void {
    let minDist = Infinity;
    let nearestIndex = 0;
    
    for (let i = 0; i < this.trackPoints.length; i++) {
      const point = this.trackPoints[i];
      const dist = this.distance2D(this.playerPos, point);
      
      if (dist < minDist) {
        minDist = dist;
        nearestIndex = i;
      }
    }
    
    if (this.currentTrackIndex > nearestIndex + this.trackPoints.length / 2) {
    } else if (nearestIndex > this.currentTrackIndex + this.trackPoints.length / 2) {
    }
    
    if (nearestIndex > this.currentTrackIndex) {
      this.currentTrackIndex = nearestIndex;
    }
  }
  
  private checkGateCollision(): void {
    for (const gate of this.gates) {
      if (gate.passed) continue;
      
      const dist = this.distance2D(this.playerPos, gate);
      const heightDiff = Math.abs(this.playerPos.y - gate.y);
      
      if (dist < gate.width / 2 && heightDiff < gate.height / 2) {
        gate.passed = true;
        gate.glowTimer = 1.5;
        
        gate.floatTexts.push({
          text: '+1',
          x: gate.x,
          y: gate.y + gate.height / 2 + 1,
          z: gate.z,
          life: 0.8,
          maxLife: 0.8
        });
        
        this.gameManager.passGate();
        
        if (this.gameManager.currentPhase !== 'race') {
          this.finished = true;
        }
      }
    }
    
    if (this.currentTrackIndex >= this.trackPoints.length - 1) {
      this.currentTrackIndex = 0;
      this.gates.forEach(g => g.passed = false);
    }
  }
  
  private checkObstacleCollision(dt: number): void {
    if (this.collisionCooldown > 0) return;
    
    for (const obstacle of this.obstacles) {
      const dist = this.distance3D(this.playerPos, obstacle);
      
      if (dist < obstacle.radius + 0.8) {
        this.speed *= 0.5;
        this.collisionCooldown = 1;
        this.screenShake = 1;
        
        const angle = Math.atan2(
          this.playerPos.z - obstacle.z,
          this.playerPos.x - obstacle.x
        );
        this.playerPos.x += Math.cos(angle) * 0.5;
        this.playerPos.z += Math.sin(angle) * 0.5;
        
        for (let i = 0; i < 15; i++) {
          this.spawnCollisionParticle(obstacle.x, obstacle.y, obstacle.z);
        }
        
        break;
      }
    }
  }
  
  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vy -= 5 * dt;
      p.life -= dt;
      p.size += 2 * dt;
      
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
  
  private updateClouds(dt: number): void {
    for (const cloud of this.clouds) {
      cloud.x += cloud.speed * dt;
      
      if (cloud.x > 60) {
        cloud.x = -60;
        cloud.z = (Math.random() - 0.5) * 100;
      }
    }
  }
  
  private updatePropeller(dt: number): void {
    const propSpeed = this.speed * 5 + 10;
    this.propellerRotation += propSpeed * dt;
  }
  
  private updateGateEffects(dt: number): void {
    for (const gate of this.gates) {
      if (gate.glowTimer > 0) {
        gate.glowTimer -= dt;
      }
      
      for (let i = gate.floatTexts.length - 1; i >= 0; i--) {
        const ft = gate.floatTexts[i];
        ft.life -= dt;
        ft.y += 5 * dt;
        
        if (ft.life <= 0) {
          gate.floatTexts.splice(i, 1);
        }
      }
    }
  }
  
  private spawnTrailParticle(): void {
    if (this.particles.length >= this.maxParticles) return;
    
    const backAngle = this.playerAngle + Math.PI;
    const spread = 0.3;
    
    this.particles.push({
      x: this.playerPos.x + Math.sin(backAngle) * 0.5 + (Math.random() - 0.5) * spread,
      y: this.playerPos.y + (Math.random() - 0.5) * spread,
      z: this.playerPos.z + Math.cos(backAngle) * 0.5 + (Math.random() - 0.5) * spread,
      vx: -Math.sin(this.playerAngle) * 2 + (Math.random() - 0.5) * 3,
      vy: 1 + Math.random() * 2,
      vz: -Math.cos(this.playerAngle) * 2 + (Math.random() - 0.5) * 3,
      life: 0.6,
      maxLife: 0.6,
      color: '#FFFFFF',
      size: 0.1
    });
  }
  
  private spawnCollisionParticle(x: number, y: number, z: number): void {
    if (this.particles.length >= this.maxParticles) return;
    
    this.particles.push({
      x, y, z,
      vx: (Math.random() - 0.5) * 10,
      vy: Math.random() * 5,
      vz: (Math.random() - 0.5) * 10,
      life: 0.8,
      maxLife: 0.8,
      color: '#8B4513',
      size: 0.15
    });
  }
  
  public render(): void {
    const ctx = this.ctx;
    
    const shakeX = (Math.random() - 0.5) * this.screenShake * 10;
    const shakeY = (Math.random() - 0.5) * this.screenShake * 10;
    
    ctx.save();
    ctx.translate(shakeX, shakeY);
    
    this.drawSky();
    this.drawIslands();
    this.drawClouds();
    this.drawTrack();
    this.drawObstacles();
    this.drawGates();
    this.drawParticles();
    this.drawAircraft();
    this.drawHUD();
    
    ctx.restore();
    
    if (this.gameManager.currentPhase === 'result') {
      this.drawResultScreen();
    }
  }
  
  private drawSky(): void {
    const ctx = this.ctx;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#3A2E20');
    gradient.addColorStop(1, '#4A3B2C');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  private drawIslands(): void {
    const sorted = [...this.islands].sort((a, b) => {
      return this.projectZ(b.z) - this.projectZ(a.z);
    });
    
    for (const island of sorted) {
      this.drawFloatingIsland(island);
    }
  }
  
  private drawFloatingIsland(island: FloatingIsland): void {
    const screenPos = this.project3D(island.x, island.y, island.z);
    
    if (screenPos.z <= 0) return;
    
    const scale = screenPos.scale * island.scale;
    
    if (scale < 1) return;
    
    const ctx = this.ctx;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(screenPos.x + scale * 0.1, screenPos.y + scale * 0.5, scale * 0.8, scale * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#5C4033';
    ctx.beginPath();
    ctx.moveTo(screenPos.x - scale * 0.7, screenPos.y);
    ctx.lineTo(screenPos.x + scale * 0.7, screenPos.y);
    ctx.lineTo(screenPos.x + scale * 0.3, screenPos.y + scale * 0.6);
    ctx.lineTo(screenPos.x - scale * 0.3, screenPos.y + scale * 0.6);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#3A5F3A';
    ctx.beginPath();
    ctx.ellipse(screenPos.x, screenPos.y, scale * 0.7, scale * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  
  private drawClouds(): void {
    const sorted = [...this.clouds].sort((a, b) => {
      return this.projectZ(b.z) - this.projectZ(a.z);
    });
    
    for (const cloud of sorted) {
      this.drawCloud(cloud);
    }
  }
  
  private drawCloud(cloud: Cloud): void {
    const screenPos = this.project3D(cloud.x, cloud.y, cloud.z);
    
    if (screenPos.z <= 0) return;
    
    const scale = screenPos.scale * cloud.scale;
    
    if (scale < 2) return;
    
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    
    ctx.beginPath();
    ctx.arc(screenPos.x, screenPos.y, scale * 0.5, 0, Math.PI * 2);
    ctx.arc(screenPos.x + scale * 0.4, screenPos.y + scale * 0.1, scale * 0.4, 0, Math.PI * 2);
    ctx.arc(screenPos.x - scale * 0.4, screenPos.y + scale * 0.1, scale * 0.35, 0, Math.PI * 2);
    ctx.arc(screenPos.x + scale * 0.2, screenPos.y - scale * 0.2, scale * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
  
  private drawTrack(): void {
    const ctx = this.ctx;
    const trackWidth = 4;
    
    const visibleSegments: { p1: TrackPoint; p2: TrackPoint; dist: number }[] = [];
    
    for (let i = 0; i < this.trackPoints.length; i++) {
      const p1 = this.trackPoints[i];
      const p2 = this.trackPoints[(i + 1) % this.trackPoints.length];
      
      const midZ = (this.worldToCameraZ(p1.z) + this.worldToCameraZ(p2.z)) / 2;
      
      if (midZ > 0.5) {
        visibleSegments.push({ p1, p2, dist: midZ });
      }
    }
    
    visibleSegments.sort((a, b) => b.dist - a.dist);
    
    for (const seg of visibleSegments) {
      this.drawTrackSegment(seg.p1, seg.p2, trackWidth);
    }
  }
  
  private drawTrackSegment(p1: TrackPoint, p2: TrackPoint, width: number): void {
    const ctx = this.ctx;
    
    const perpAngle = p1.angle;
    const halfW = width / 2;
    
    const left1 = this.project3D(
      p1.x + Math.cos(perpAngle) * halfW,
      p1.y - 0.1,
      p1.z + Math.sin(perpAngle) * halfW
    );
    const right1 = this.project3D(
      p1.x - Math.cos(perpAngle) * halfW,
      p1.y - 0.1,
      p1.z - Math.sin(perpAngle) * halfW
    );
    const left2 = this.project3D(
      p2.x + Math.cos(perpAngle) * halfW,
      p2.y - 0.1,
      p2.z + Math.sin(perpAngle) * halfW
    );
    const right2 = this.project3D(
      p2.x - Math.cos(perpAngle) * halfW,
      p2.y - 0.1,
      p2.z - Math.sin(perpAngle) * halfW
    );
    
    if (left1.z <= 0 || right1.z <= 0 || left2.z <= 0 || right2.z <= 0) return;
    
    ctx.fillStyle = '#696969';
    ctx.beginPath();
    ctx.moveTo(left1.x, left1.y);
    ctx.lineTo(left2.x, left2.y);
    ctx.lineTo(right2.x, right2.y);
    ctx.lineTo(right1.x, right1.y);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#505050';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    this.drawRail(p1, p2, halfW, 1);
    this.drawRail(p1, p2, -halfW, 1);
  }
  
  private drawRail(p1: TrackPoint, p2: TrackPoint, offset: number, height: number): void {
    const ctx = this.ctx;
    const perpAngle = p1.angle;
    
    const bottom1 = this.project3D(
      p1.x + Math.cos(perpAngle) * offset,
      p1.y,
      p1.z + Math.sin(perpAngle) * offset
    );
    const top1 = this.project3D(
      p1.x + Math.cos(perpAngle) * offset,
      p1.y + height,
      p1.z + Math.sin(perpAngle) * offset
    );
    const bottom2 = this.project3D(
      p2.x + Math.cos(perpAngle) * offset,
      p2.y,
      p2.z + Math.sin(perpAngle) * offset
    );
    const top2 = this.project3D(
      p2.x + Math.cos(perpAngle) * offset,
      p2.y + height,
      p2.z + Math.sin(perpAngle) * offset
    );
    
    if (bottom1.z <= 0 || top1.z <= 0 || bottom2.z <= 0 || top2.z <= 0) return;
    
    ctx.strokeStyle = '#5C4033';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(top1.x, top1.y);
    ctx.lineTo(top2.x, top2.y);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(bottom1.x, bottom1.y);
    ctx.lineTo(top1.x, top1.y);
    ctx.stroke();
  }
  
  private drawObstacles(): void {
    const sorted = [...this.obstacles].sort((a, b) => {
      return this.distance3D(this.camera, b) - this.distance3D(this.camera, a);
    });
    
    for (const obstacle of sorted) {
      obstacle.rotation += obstacle.rotationSpeed * 0.016;
      this.drawObstacle(obstacle);
    }
  }
  
  private drawObstacle(obstacle: Obstacle): void {
    const screenPos = this.project3D(obstacle.x, obstacle.y, obstacle.z);
    
    if (screenPos.z <= 0) return;
    
    const size = screenPos.scale * obstacle.radius * 50;
    
    if (size < 2) return;
    
    const ctx = this.ctx;
    
    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);
    ctx.rotate(obstacle.rotation);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(size * 0.1, size * 0.8, size * 0.8, size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#4A4A4A';
    ctx.beginPath();
    const sides = 7;
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      const r = size * (0.7 + Math.sin(i * 2.5) * 0.3);
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r * 0.8;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#6A6A6A';
    ctx.beginPath();
    ctx.arc(-size * 0.2, -size * 0.2, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
  
  private drawGates(): void {
    for (const gate of this.gates) {
      this.drawGate(gate);
    }
  }
  
  private drawGate(gate: Gate): void {
    const ctx = this.ctx;
    
    const leftPost = this.project3D(gate.x - gate.width / 2, gate.y, gate.z);
    const rightPost = this.project3D(gate.x + gate.width / 2, gate.y, gate.z);
    const topLeft = this.project3D(gate.x - gate.width / 2, gate.y + gate.height, gate.z);
    const topRight = this.project3D(gate.x + gate.width / 2, gate.y + gate.height, gate.z);
    
    if (leftPost.z <= 0 || rightPost.z <= 0) return;
    
    const glowAlpha = gate.glowTimer > 0 ? 0.8 : 0.3;
    const color = gate.glowTimer > 0 ? '#00FF7F' : '#FFD700';
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.globalAlpha = glowAlpha;
    
    ctx.beginPath();
    ctx.moveTo(leftPost.x, leftPost.y);
    ctx.lineTo(topLeft.x, topLeft.y);
    ctx.lineTo(topRight.x, topRight.y);
    ctx.lineTo(rightPost.x, rightPost.y);
    ctx.stroke();
    
    ctx.lineWidth = 8;
    ctx.globalAlpha = glowAlpha * 0.3;
    ctx.stroke();
    
    ctx.globalAlpha = 1;
    
    const gaugeY = (topLeft.y + topRight.y) / 2 + 15;
    const gaugeX = (topLeft.x + topRight.x) / 2;
    const gaugeSize = 12;
    
    ctx.fillStyle = '#3A2E20';
    ctx.beginPath();
    ctx.arc(gaugeX, gaugeY, gaugeSize, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gaugeX, gaugeY);
    const needleAngle = -Math.PI / 2 + Math.sin(Date.now() / 500) * 0.5;
    ctx.lineTo(gaugeX + Math.cos(needleAngle) * (gaugeSize - 3), 
               gaugeY + Math.sin(needleAngle) * (gaugeSize - 3));
    ctx.stroke();
    
    for (const ft of gate.floatTexts) {
      const ftScreen = this.project3D(ft.x, ft.y, ft.z);
      if (ftScreen.z <= 0) continue;
      
      const alpha = ft.life / ft.maxLife;
      const scale = 0.8 + (1 - alpha) * 0.5;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#FFD700';
      ctx.font = `bold ${24 * scale}px Georgia`;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 10;
      ctx.fillText(ft.text, ftScreen.x, ftScreen.y);
      ctx.restore();
    }
  }
  
  private drawParticles(): void {
    const sorted = [...this.particles].sort((a, b) => {
      return this.distance3D(this.camera, b) - this.distance3D(this.camera, a);
    });
    
    for (const p of sorted) {
      this.drawParticle(p);
    }
  }
  
  private drawParticle(p: Particle): void {
    const screenPos = this.project3D(p.x, p.y, p.z);
    
    if (screenPos.z <= 0) return;
    
    const size = screenPos.scale * p.size * 30;
    
    if (size < 0.5) return;
    
    const ctx = this.ctx;
    const alpha = p.life / p.maxLife;
    
    ctx.globalAlpha = alpha * 0.6;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(screenPos.x, screenPos.y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  
  private drawAircraft(): void {
  }
  
  private drawHUD(): void {
    const ctx = this.ctx;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.roundRect(20, 20, 150, 80, 8);
    ctx.fill();
    
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 18px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText(`圈数: ${this.gameManager.currentLap + 1}/${this.gameManager.totalLaps}`, 35, 50);
    
    ctx.fillStyle = '#D4A574';
    ctx.font = '14px Georgia';
    ctx.fillText(`门: ${this.gameManager.gatesPassed}/${this.gameManager.totalGates}`, 35, 75);
    
    const timeStr = this.gameManager.formatTime(this.gameManager.raceTime);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.roundRect(this.canvas.width - 170, 20, 150, 50, 8);
    ctx.fill();
    
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(timeStr, this.canvas.width - 35, 52);
    
    const speedPercent = this.speed / this.maxSpeed;
    const barWidth = 150;
    const barHeight = 12;
    const barX = 20;
    const barY = this.canvas.height - 40;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight + 20, 6);
    ctx.fill();
    
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    const speedGradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    speedGradient.addColorStop(0, '#2E8B57');
    speedGradient.addColorStop(1, '#3CB371');
    
    ctx.fillStyle = speedGradient;
    ctx.beginPath();
    ctx.roundRect(barX + 5, barY + 5, (barWidth - 10) * speedPercent, barHeight - 3, 4);
    ctx.fill();
    
    ctx.fillStyle = '#D4A574';
    ctx.font = '11px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText('速度', barX + 8, barY + barHeight + 18);
    
    const altBarWidth = 12;
    const altBarHeight = 100;
    const altBarX = this.canvas.width - 35;
    const altBarY = this.canvas.height - 130;
    const altPercent = (this.playerPos.y - this.minHeight) / (this.maxHeight - this.minHeight);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.roundRect(altBarX, altBarY, altBarWidth, altBarHeight, 4);
    ctx.fill();
    
    ctx.fillStyle = '#B8860B';
    ctx.beginPath();
    ctx.roundRect(altBarX + 2, altBarY + altBarHeight - 5 - altPercent * (altBarHeight - 10), altBarWidth - 4, 5, 2);
    ctx.fill();
    
    ctx.fillStyle = '#D4A574';
    ctx.font = '10px Georgia';
    ctx.textAlign = 'right';
    ctx.fillText('高度', altBarX - 5, altBarY + altBarHeight / 2);
    
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = 1;
    
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy);
    ctx.lineTo(cx - 8, cy);
    ctx.moveTo(cx + 8, cy);
    ctx.lineTo(cx + 20, cy);
    ctx.moveTo(cx, cy - 20);
    ctx.lineTo(cx, cy - 8);
    ctx.moveTo(cx, cy + 8);
    ctx.lineTo(cx, cy + 20);
    ctx.stroke();
  }
  
  private drawResultScreen(): void {
    const ctx = this.ctx;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const panelW = 300;
    const panelH = 280;
    const panelX = this.canvas.width / 2 - panelW / 2;
    const panelY = this.canvas.height / 2 - panelH / 2;
    
    ctx.fillStyle = '#3A2E20';
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 12);
    ctx.fill();
    
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    this.drawGearBorder(panelX, panelY, panelW, panelH);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 28px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('竞速完成!', this.canvas.width / 2, panelY + 45);
    
    ctx.fillStyle = '#D4A574';
    ctx.font = '16px Georgia';
    ctx.fillText('完成时间', this.canvas.width / 2, panelY + 85);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 32px monospace';
    ctx.fillText(this.gameManager.formatTime(this.gameManager.finalTime), this.canvas.width / 2, panelY + 120);
    
    ctx.fillStyle = '#D4A574';
    ctx.font = '16px Georgia';
    ctx.fillText('评级', this.canvas.width / 2, panelY + 160);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 48px Georgia';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 20;
    ctx.fillText(this.gameManager.finalRating, this.canvas.width / 2, panelY + 205);
    ctx.shadowBlur = 0;
    
    const btnW = 140;
    const btnH = 45;
    const btnX = this.canvas.width / 2 - btnW / 2;
    const btnY = panelY + panelH - 65;
    
    const gradient = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
    gradient.addColorStop(0, '#2E8B57');
    gradient.addColorStop(1, '#3CB371');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 8);
    ctx.fill();
    
    ctx.strokeStyle = '#1E5631';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Georgia';
    ctx.fillText('返回车间', this.canvas.width / 2, btnY + 30);
  }
  
  private drawGearBorder(x: number, y: number, w: number, h: number): void {
    const ctx = this.ctx;
    const time = Date.now() / 2000;
    
    ctx.save();
    ctx.strokeStyle = '#FFD700';
    ctx.globalAlpha = 0.6;
    
    const gearSize = 15;
    const corners = [
      { x: x + 5, y: y + 5, startAngle: 0 },
      { x: x + w - 5, y: y + 5, startAngle: Math.PI / 2 },
      { x: x + w - 5, y: y + h - 5, startAngle: Math.PI },
      { x: x + 5, y: y + h - 5, startAngle: -Math.PI / 2 }
    ];
    
    corners.forEach((corner, i) => {
      ctx.save();
      ctx.translate(corner.x, corner.y);
      ctx.rotate(time * (i % 2 === 0 ? 1 : -1) + corner.startAngle);
      this.drawGearShape(gearSize);
      ctx.stroke();
      ctx.restore();
    });
    
    ctx.restore();
  }
  
  private drawGearShape(size: number): void {
    const ctx = this.ctx;
    const teeth = 8;
    const innerR = size * 0.6;
    const outerR = size;
    
    ctx.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const angle = (i * Math.PI) / teeth;
      const r = i % 2 === 0 ? outerR : innerR;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
  }
  
  private project3D(x: number, y: number, z: number): { x: number; y: number; scale: number; z: number } {
    const dx = x - this.camera.x;
    const dy = y - this.camera.y;
    const dz = z - this.camera.z;
    
    const cosA = Math.cos(-this.cameraAngle);
    const sinA = Math.sin(-this.cameraAngle);
    const rx = dx * cosA - dz * sinA;
    const rz = dx * sinA + dz * cosA;
    
    const cosP = Math.cos(-this.cameraPitch);
    const sinP = Math.sin(-this.cameraPitch);
    const ry = dy * cosP - rz * sinP;
    const finalZ = dy * sinP + rz * cosP;
    
    const fov = 500;
    const scale = fov / Math.max(finalZ, 0.1);
    
    return {
      x: this.canvas.width / 2 + rx * scale,
      y: this.canvas.height / 2 - ry * scale,
      scale,
      z: finalZ
    };
  }
  
  private projectZ(z: number): number {
    return z - this.camera.z;
  }
  
  private worldToCameraZ(z: number): number {
    const dx = 0;
    const dz = z - this.camera.z;
    
    const cosA = Math.cos(-this.cameraAngle);
    const sinA = Math.sin(-this.cameraAngle);
    const rz = dx * sinA + dz * cosA;
    
    return rz;
  }
  
  private distance3D(a: Vec3, b: Vec3): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  private distance2D(a: { x: number; z: number }, b: { x: number; z: number }): number {
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
  
  public handleKeyDown(key: string): void {
    this.keys.add(key);
  }
  
  public handleKeyUp(key: string): void {
    this.keys.delete(key);
  }
  
  public handleClick(x: number, y: number): void {
    if (this.gameManager.currentPhase === 'result') {
      const btnW = 140;
      const btnH = 45;
      const btnX = this.canvas.width / 2 - btnW / 2;
      const btnY = this.canvas.height / 2 + 75;
      
      if (x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH) {
        this.gameManager.returnToAssembly();
      }
    }
  }
  
  public handleMouseMove(x: number, y: number): void {
  }
}
