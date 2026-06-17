import type { TrackNode, Obstacle, MusicNote, AudioAnalysisResult } from '../types/gameTypes';

export class TrackGenerator {
  private nodes: TrackNode[] = [];
  private obstacles: Obstacle[] = [];
  private notes: MusicNote[] = [];
  private lastNodeX: number = 0;
  private lastBeatTime: number = 0;
  private beatCounter: number = 0;
  private nextObstacleBeat: number = 0;
  private baseY: number = 0;
  private trackWidth: number = 800;
  private nodeSpacing: number = 80;
  private amplitudeMin: number = 30;
  private amplitudeMax: number = 80;
  private obstacleSize: number = 15;
  private noteSize: number = 12;
  private obstacleSpawnChance: number = 1;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.trackWidth = canvasWidth;
    this.baseY = canvasHeight * 0.6;
    this.reset();
  }

  public reset(): void {
    this.nodes = [];
    this.obstacles = [];
    this.notes = [];
    this.lastNodeX = 0;
    this.lastBeatTime = 0;
    this.beatCounter = 0;
    this.nextObstacleBeat = 2 + Math.random() * 2;

    for (let x = -this.nodeSpacing; x <= this.trackWidth + this.nodeSpacing * 2; x += this.nodeSpacing) {
      this.nodes.push(this.createNode(x, false));
    }
    this.lastNodeX = this.trackWidth + this.nodeSpacing * 2;
  }

  private createNode(x: number, isBeat: boolean): TrackNode {
    const amplitude = this.amplitudeMin + Math.random() * (this.amplitudeMax - this.amplitudeMin);
    const phase = (x / this.nodeSpacing) * Math.PI * 0.5;
    const y = this.baseY + Math.sin(phase) * amplitude;

    return {
      x,
      y,
      baseY: this.baseY,
      amplitude: isBeat ? amplitude * 1.2 : amplitude,
      phase,
      isPeak: Math.sin(phase) > 0.8
    };
  }

  public update(
    deltaTime: number,
    scrollSpeed: number,
    analysis: AudioAnalysisResult,
    _bpm: number
  ): void {
    const scrollDistance = scrollSpeed * deltaTime;

    for (const node of this.nodes) {
      node.x -= scrollDistance;
      node.phase += (scrollDistance / this.nodeSpacing) * Math.PI * 0.5;
      node.y = node.baseY + Math.sin(node.phase) * node.amplitude;
    }

    while (this.nodes.length > 0 && this.nodes[0].x < -this.nodeSpacing * 2) {
      this.nodes.shift();
    }

    this.lastNodeX -= scrollDistance;
    while (this.lastNodeX < this.trackWidth + this.nodeSpacing * 2) {
      this.lastNodeX += this.nodeSpacing;
      this.nodes.push(this.createNode(this.lastNodeX, analysis.isBeat));
    }

    if (analysis.isBeat) {
      const now = performance.now();
      if (now - this.lastBeatTime > 100) {
        this.beatCounter++;
        this.lastBeatTime = now;
        this.spawnNote();

        if (this.beatCounter >= this.nextObstacleBeat) {
          this.spawnObstacle();
          const minBeats = Math.max(1, 2 * (1 / this.obstacleSpawnChance));
          const maxBeats = Math.max(2, 4 * (1 / this.obstacleSpawnChance));
          this.nextObstacleBeat = this.beatCounter + minBeats + Math.random() * (maxBeats - minBeats);
        }
      }
    }

    for (const obstacle of this.obstacles) {
      obstacle.x -= scrollDistance;
    }
    this.obstacles = this.obstacles.filter(o => o.x > -50 && o.active);

    for (const note of this.notes) {
      note.x -= scrollDistance;
    }
    this.notes = this.notes.filter(n => n.x > -50 && n.active && !n.collected);
  }

  private spawnObstacle(): void {
    const peaksAndValleys = this.nodes.filter(n => n.isPeak || Math.sin(n.phase) < -0.8);
    if (peaksAndValleys.length === 0) return;

    const targetNode = peaksAndValleys[Math.floor(Math.random() * peaksAndValleys.length)];

    this.obstacles.push({
      x: targetNode.x,
      y: targetNode.y,
      size: this.obstacleSize,
      active: true
    });
  }

  private spawnNote(): void {
    const x = this.trackWidth + this.noteSize;
    const y = this.baseY;

    this.notes.push({
      x,
      y,
      size: this.noteSize,
      active: true,
      collected: false
    });
  }

  public getNodes(): TrackNode[] {
    return this.nodes;
  }

  public getObstacles(): Obstacle[] {
    return this.obstacles;
  }

  public getNotes(): MusicNote[] {
    return this.notes;
  }

  public getBaseY(): number {
    return this.baseY;
  }

  public getTrackYAt(x: number): number {
    if (this.nodes.length < 2) return this.baseY;

    for (let i = 0; i < this.nodes.length - 1; i++) {
      const n1 = this.nodes[i];
      const n2 = this.nodes[i + 1];
      if (x >= n1.x && x <= n2.x) {
        const t = (x - n1.x) / (n2.x - n1.x);
        return n1.y + (n2.y - n1.y) * t;
      }
    }

    return this.baseY;
  }

  public resize(canvasWidth: number, canvasHeight: number): void {
    this.trackWidth = canvasWidth;
    const newBaseY = canvasHeight * 0.6;
    const deltaY = newBaseY - this.baseY;
    this.baseY = newBaseY;

    for (const node of this.nodes) {
      node.baseY = newBaseY;
      node.y += deltaY;
    }

    for (const obstacle of this.obstacles) {
      obstacle.y += deltaY;
    }

    for (const note of this.notes) {
      note.y += deltaY;
    }
  }

  public increaseDifficulty(level: number): void {
    this.obstacleSpawnChance = 1 + (level - 1) * 0.2;
  }

  public collectNote(note: MusicNote): void {
    note.collected = true;
    note.active = false;
  }

  public removeObstacle(obstacle: Obstacle): void {
    obstacle.active = false;
  }
}
