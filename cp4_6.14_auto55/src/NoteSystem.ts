export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Note {
  id: number;
  direction: Direction;
  y: number;
  x: number;
  hit: boolean;
  missed: boolean;
  spawnTime: number;
}

export interface HitEffect {
  type: 'perfect' | 'good';
  direction: Direction;
  x: number;
  y: number;
  startTime: number;
  duration: number;
}

export interface ShatterParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  startTime: number;
  duration: number;
}

export interface HitBurstParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  startTime: number;
  duration: number;
}

export class NoteSystem {
  private notes: Note[] = [];
  private nextNoteId = 0;
  private readonly beatInterval = 250;
  private lastNoteTime = 0;
  private gameStartTime = 0;
  private noteSpeed = 3;
  private directions: Direction[] = ['up', 'down', 'left', 'right'];
  private trackPositions: Map<Direction, number> = new Map();
  private canvasWidth = 800;
  private canvasHeight = 600;
  private judgmentAreaY = 0;
  private judgmentAreaHeight = 100;
  private judgmentAreaWidth = 80;
  private hitEffects: HitEffect[] = [];
  private shatterParticles: ShatterParticle[] = [];
  private hitBurstParticles: HitBurstParticle[] = [];
  private directionColors: Map<Direction, string> = new Map([
    ['up', '#00ff00'],
    ['down', '#00aaff'],
    ['left', '#aa00ff'],
    ['right', '#ff8800']
  ]);

  constructor(canvasWidth: number, canvasHeight: number) {
    this.updateCanvasSize(canvasWidth, canvasHeight);
  }

  public updateCanvasSize(canvasWidth: number, canvasHeight: number): void {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.judgmentAreaY = canvasHeight - this.judgmentAreaHeight - 20;
    
    const centerX = canvasWidth / 2;
    const trackSpacing = 100;
    this.trackPositions.set('up', centerX - trackSpacing * 1.5);
    this.trackPositions.set('down', centerX - trackSpacing * 0.5);
    this.trackPositions.set('left', centerX + trackSpacing * 0.5);
    this.trackPositions.set('right', centerX + trackSpacing * 1.5);
    
    const minTrackX = Math.min(...Array.from(this.trackPositions.values()));
    const maxTrackX = Math.max(...Array.from(this.trackPositions.values()));
    this.judgmentAreaWidth = maxTrackX - minTrackX + 100;
  }

  public start(currentTime: number): void {
    this.gameStartTime = currentTime;
    this.lastNoteTime = currentTime - this.beatInterval;
    this.notes = [];
    this.nextNoteId = 0;
  }

  public reset(): void {
    this.notes = [];
    this.hitEffects = [];
    this.shatterParticles = [];
    this.hitBurstParticles = [];
    this.nextNoteId = 0;
  }

  public update(currentTime: number, deltaTime: number): Direction | null {
    const elapsed = currentTime - this.gameStartTime;
    const gameDuration = 30000;
    
    if (elapsed > gameDuration) {
      this.updateNotes(deltaTime);
      this.updateEffects(currentTime);
      return null;
    }

    while (currentTime - this.lastNoteTime >= this.beatInterval) {
      this.spawnNote(this.lastNoteTime + this.beatInterval);
      this.lastNoteTime += this.beatInterval;
    }

    this.updateNotes(deltaTime);
    this.updateEffects(currentTime);

    return null;
  }

  private spawnNote(time: number): void {
    const direction = this.directions[Math.floor(Math.random() * this.directions.length)] as Direction;
    const x = this.trackPositions.get(direction) ?? this.canvasWidth / 2;
    
    this.notes.push({
      id: this.nextNoteId++,
      direction,
      x,
      y: -50,
      hit: false,
      missed: false,
      spawnTime: time
    });
  }

  private updateNotes(deltaTime: number): void {
    const speed = this.noteSpeed * (deltaTime / 16.67);
    
    for (let i = this.notes.length - 1; i >= 0; i--) {
      const note = this.notes[i];
      if (!note) continue;
      
      note.y += speed;
      
      if (!note.hit && !note.missed && note.y > this.judgmentAreaY + this.judgmentAreaHeight) {
        note.missed = true;
      }

      if (note.y > this.canvasHeight + 100) {
        this.notes.splice(i, 1);
      }
    }
  }

  private updateEffects(currentTime: number): void {
    this.hitEffects = this.hitEffects.filter(effect => 
      currentTime - effect.startTime < effect.duration
    );

    this.shatterParticles = this.shatterParticles.filter(particle =>
      currentTime - particle.startTime < particle.duration
    );

    for (const particle of this.shatterParticles) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.2;
    }

    this.hitBurstParticles = this.hitBurstParticles.filter(particle =>
      currentTime - particle.startTime < particle.duration
    );

    for (const particle of this.hitBurstParticles) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.98;
      particle.vy *= 0.98;
    }
  }

  public checkHit(direction: Direction, currentTime: number): { hit: boolean; type: 'perfect' | 'good' | null } {
    const judgmentCenterY = this.judgmentAreaY + this.judgmentAreaHeight / 2;
    const perfectWindow = 50;
    const goodWindow = 100;

    for (const note of this.notes) {
      if (note.direction !== direction || note.hit || note.missed) continue;

      const distance = Math.abs(note.y - judgmentCenterY);
      
      if (distance <= goodWindow) {
        note.hit = true;
        
        const type = distance <= perfectWindow ? 'perfect' : 'good';
        
        this.hitEffects.push({
          type,
          direction,
          x: note.x,
          y: this.judgmentAreaY - 20,
          startTime: currentTime,
          duration: 500
        });

        this.createShatterEffect(note.x, note.y, direction, currentTime);
        this.createHitBurst(note.x, this.judgmentAreaY + this.judgmentAreaHeight / 2, direction, currentTime);

        return { hit: true, type };
      }
    }

    return { hit: false, type: null };
  }

  private createShatterEffect(x: number, y: number, direction: Direction, currentTime: number): void {
    const color = this.directionColors.get(direction) ?? '#ffffff';
    
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const speed = 2 + Math.random() * 3;
      
      this.shatterParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color,
        size: 3 + Math.random() * 4,
        startTime: currentTime,
        duration: 200
      });
    }
  }

  private createHitBurst(x: number, y: number, direction: Direction, currentTime: number): void {
    const color = this.directionColors.get(direction) ?? '#ffffff';
    
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      
      this.hitBurstParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2 + Math.random() * 3,
        startTime: currentTime,
        duration: 400
      });
    }
  }

  public getNotes(): Note[] {
    return this.notes.filter(n => !n.hit);
  }

  public consumeMissedNotes(): Note[] {
    const missedNotes = this.notes.filter(n => n.missed && !n.hit);
    for (const note of missedNotes) {
      note.missed = false;
    }
    return missedNotes;
  }

  public getTrackPositions(): Map<Direction, number> {
    return this.trackPositions;
  }

  public getJudgmentArea(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.canvasWidth / 2 - this.judgmentAreaWidth / 2,
      y: this.judgmentAreaY,
      width: this.judgmentAreaWidth,
      height: this.judgmentAreaHeight
    };
  }

  public getHitEffects(): HitEffect[] {
    return this.hitEffects;
  }

  public getShatterParticles(): ShatterParticle[] {
    return this.shatterParticles;
  }

  public getHitBurstParticles(): HitBurstParticle[] {
    return this.hitBurstParticles;
  }

  public getDirectionColor(direction: Direction): string {
    return this.directionColors.get(direction) ?? '#ffffff';
  }

  public getDirectionArrow(direction: Direction): string {
    const arrows: Record<Direction, string> = {
      up: '↑',
      down: '↓',
      left: '←',
      right: '→'
    };
    return arrows[direction];
  }

  public isGameOver(): boolean {
    return this.notes.length === 0 && this.lastNoteTime > this.gameStartTime + 30000;
  }
}
